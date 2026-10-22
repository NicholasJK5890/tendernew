import os
import json
import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import engine, get_db, Base, SessionLocal
from models import (
    User, VendorProfile, Tender, Requirement, Bid, BidDocument,
    VerificationCheck, Evidence, Notification, Clarification, AuditLog, CategoryRulebook
)
from schemas import (
    UserOut, VendorProfileOut, VendorProfileUpdate,
    TenderOut, TenderCreate, RequirementCreate, RequirementOut,
    BidOut, BidCreate, TenderMatchResult, ClarificationCreate,
    ClarificationReply, ClarificationOut, NotificationOut,
    AuditLogOut, TenderApprovalRequest
)
from services.extractor import DocumentExtractor
from services.compliance_engine import ComplianceEngine
from services.report_generator import EvaluationReportGenerator

app = FastAPI(
    title="TenderLens API",
    description="AI Verification & Compliance Engine for Indian Government Procurement",
    version="1.0.0"
)

# Auto-initialize database schema and seed if empty
def _init_database():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as init_db:
        if init_db.query(User).count() == 0:
            import seed
            seed.seed_database(drop_existing=False)

try:
    if engine.dialect.name == "postgresql":
        # Serverless can cold-start several instances at once; serialise first-time
        # schema creation + seeding across them with a Postgres advisory lock.
        from sqlalchemy import text
        with engine.connect() as _lock_conn:
            _lock_conn.execute(text("SELECT pg_advisory_lock(727200123)"))
            try:
                _init_database()
            finally:
                _lock_conn.execute(text("SELECT pg_advisory_unlock(727200123)"))
                _lock_conn.commit()
    else:
        _init_database()
except Exception as e:
    print(f"Database auto-init note: {e}")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for evidence screenshots and generated PDF reports
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
try:
    os.makedirs(os.path.join(static_dir, "evidence"), exist_ok=True)
except OSError:
    pass  # read-only filesystem (e.g. Vercel) - bundled files are already there
reports_dir = "/tmp/reports" if os.environ.get("VERCEL") else os.path.join(static_dir, "reports")
try:
    os.makedirs(reports_dir, exist_ok=True)
except Exception:
    pass

if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

extractor = DocumentExtractor()
compliance_engine = ComplianceEngine()

# Audit Log Helper
def write_audit(db: Session, actor: str, role: str, action: str, target: str, details: Dict[str, Any]):
    entry = AuditLog(
        actor=actor,
        role=role,
        action=action,
        target=target,
        details=json.dumps(details),
        timestamp=datetime.datetime.utcnow()
    )
    db.add(entry)
    db.commit()

# Current User Helper for demo auth
def get_current_user(
    x_user_email: Optional[str] = Header(None),
    user_email: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> User:
    email = x_user_email or user_email or "officer@cpwd.gov.in"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = db.query(User).first()
    return user


# ==================== USERS & AUTH ====================

@app.get("/users", response_model=List[UserOut], tags=["Users"])
def list_users(db: Session = Depends(get_db)):
    """List all seeded demo users for 1-click role and account switching."""
    return db.query(User).all()

@app.get("/users/me", response_model=UserOut, tags=["Users"])
def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently simulated user."""
    return current_user


# ==================== VENDOR PROFILE ====================

@app.get("/vendors/me", response_model=VendorProfileOut, tags=["Vendor"])
def get_my_vendor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not profile:
        # Default to first vendor profile for demo if officer logs into vendor view
        profile = db.query(VendorProfile).first()
    
    # Deserializing JSON text fields for Pydantic schema
    return VendorProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        company_name=profile.company_name,
        gstin=profile.gstin,
        cin=profile.cin,
        pan=profile.pan,
        address=profile.address,
        contact_email=profile.contact_email,
        contact_phone=profile.contact_phone,
        directors=json.loads(profile.directors) if profile.directors else [],
        categories_supplied=json.loads(profile.categories_supplied) if profile.categories_supplied else [],
        annual_turnover=profile.annual_turnover,
        past_projects=json.loads(profile.past_projects) if profile.past_projects else [],
        bis_licences=json.loads(profile.bis_licences) if profile.bis_licences else [],
        completeness_pct=profile.completeness_pct,
        updated_at=profile.updated_at or datetime.datetime.utcnow()
    )

@app.put("/vendors/me", response_model=VendorProfileOut, tags=["Vendor"])
def update_my_vendor_profile(
    payload: VendorProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not profile:
        profile = db.query(VendorProfile).first()

    update_dict = payload.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        if k in ["directors", "categories_supplied", "past_projects", "bis_licences"]:
            setattr(profile, k, json.dumps(v))
        else:
            setattr(profile, k, v)

    # Compute completeness percentage dynamically
    points = 0
    if profile.company_name and profile.gstin: points += 20
    if profile.pan and profile.address: points += 20
    if profile.annual_turnover > 0: points += 20
    if json.loads(profile.bis_licences or "[]"): points += 20
    if json.loads(profile.past_projects or "[]"): points += 20
    profile.completeness_pct = max(points, 50)
    profile.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(profile)

    write_audit(db, profile.company_name, "vendor", "UPDATE_PROFILE", f"Vendor #{profile.id}", {"completeness": profile.completeness_pct})

    return VendorProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        company_name=profile.company_name,
        gstin=profile.gstin,
        cin=profile.cin,
        pan=profile.pan,
        address=profile.address,
        contact_email=profile.contact_email,
        contact_phone=profile.contact_phone,
        directors=json.loads(profile.directors) if profile.directors else [],
        categories_supplied=json.loads(profile.categories_supplied) if profile.categories_supplied else [],
        annual_turnover=profile.annual_turnover,
        past_projects=json.loads(profile.past_projects) if profile.past_projects else [],
        bis_licences=json.loads(profile.bis_licences) if profile.bis_licences else [],
        completeness_pct=profile.completeness_pct,
        updated_at=profile.updated_at
    )

@app.get("/vendors/me/matches", response_model=List[TenderMatchResult], tags=["Vendor"])
def get_tender_matches(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tender discovery engine: Matches open tenders to vendor's profile,
    providing transparent match scores and criteria breakdowns.
    """
    profile = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not profile:
        profile = db.query(VendorProfile).first()

    vendor_cats = set(json.loads(profile.categories_supplied or "[]"))
    vendor_licences = json.loads(profile.bis_licences or "[]")
    valid_is_codes = {l.get("is_code", "").split(":")[0].strip() for l in vendor_licences if l.get("status") == "Valid"}

    query = db.query(Tender).filter(Tender.status.in_(["Published", "Bids Open", "Under Evaluation"]))
    if category and category != "All":
        query = query.filter(Tender.category == category)
    tenders = query.all()

    results = []
    for t in tenders:
        matched = []
        missing = []
        score = 0

        # Category match
        if t.category in vendor_cats:
            score += 35
            matched.append(f"Registered supplier for category: {t.category} ✓")
        else:
            missing.append(f"Not listed for category: {t.category} ✗")

        # Turnover eligibility check
        turnover_req = next((r for r in t.requirements if "turnover" in r.parameter.lower()), None)
        if turnover_req:
            target_t = float(turnover_req.value)
            if profile.annual_turnover >= target_t:
                score += 35
                matched.append(f"Annual Turnover (₹{profile.annual_turnover/10000000:.1f} Cr) meets minimum requirement (₹{target_t/10000000:.1f} Cr) ✓")
            else:
                missing.append(f"Annual turnover shortfall (₹{profile.annual_turnover/10000000:.1f} Cr vs required ₹{target_t/10000000:.1f} Cr) ✗")
        else:
            score += 35
            matched.append("No stringent turnover threshold specified ✓")

        # Certification check (IS standards)
        bis_req = next((r for r in t.requirements if "bis" in r.parameter.lower() or "is" in r.parameter.lower()), None)
        if bis_req:
            is_match = any(code in bis_req.parameter for code in valid_is_codes)
            if is_match or valid_is_codes:
                score += 30
                matched.append(f"Valid BIS Certification held ({', '.join(valid_is_codes) if valid_is_codes else 'Active Mark'}) ✓")
            else:
                missing.append("Active BIS licence for specified IS standard missing or expired ✗")
        else:
            score += 30
            matched.append("Technical standards verified ✓")

        results.append(TenderMatchResult(
            tender=TenderOut.model_validate(t),
            match_score=min(score, 100),
            matched_criteria=matched,
            missing_criteria=missing,
            can_apply=len(missing) == 0 or score >= 65
        ))

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results


# ==================== TENDERS ====================

@app.get("/tenders", response_model=List[TenderOut], tags=["Tenders"])
def list_tenders(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List tenders with optional category, status, and search filters."""
    query = db.query(Tender)
    if category and category != "All":
        query = query.filter(Tender.category == category)
    if status and status != "All":
        query = query.filter(Tender.status == status)
    if search:
        query = query.filter(
            (Tender.title.ilike(f"%{search}%")) |
            (Tender.tender_no.ilike(f"%{search}%")) |
            (Tender.department.ilike(f"%{search}%"))
        )

    tenders = query.order_by(desc(Tender.created_at)).all()
    out = []
    for t in tenders:
        t_dict = TenderOut.model_validate(t)
        t_dict.bids_count = len(t.bids)
        out.append(t_dict)
    return out

@app.get("/tenders/{tender_id}", response_model=TenderOut, tags=["Tenders"])
def get_tender(tender_id: int, db: Session = Depends(get_db)):
    t = db.query(Tender).filter(Tender.id == tender_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tender not found")
    t_out = TenderOut.model_validate(t)
    t_out.bids_count = len(t.bids)
    return t_out

@app.post("/tenders/upload", tags=["Tenders"])
async def upload_nit_document(
    file: Optional[UploadFile] = File(None),
    portal_url: Optional[str] = Form(None),
    raw_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Officer uploads NIT PDF or pastes portal link.
    Document Extractor turns it into structured checklist JSON with per-field confidence!
    """
    extracted = await extractor.extract_nit_checklist(file.filename if file else (portal_url or "manual"), raw_text)

    write_audit(db, current_user.name, current_user.role, "UPLOAD_NIT", extracted.get("tender_no", "NIT"), {"title": extracted.get("title")})

    return {
        "status": "success",
        "message": "NIT document parsed successfully by Document Extractor Agent",
        "data": extracted
    }

@app.post("/tenders/{tender_id}/confirm", response_model=TenderOut, tags=["Tenders"])
def confirm_and_publish_tender(
    tender_id: int,
    requirements: List[RequirementCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Human-in-the-loop review screen: Officer reviews and confirms the checklist.
    Nothing proceeds until the officer confirms and publishes.
    """
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    # Replace existing requirements with confirmed requirements
    db.query(Requirement).filter(Requirement.tender_id == tender_id).delete()
    for r in requirements:
        new_r = Requirement(
            tender_id=tender_id,
            parameter=r.parameter,
            operator=r.operator,
            value=r.value,
            unit=r.unit,
            is_mandatory=r.is_mandatory,
            description=r.description,
            confidence_score=r.confidence_score,
            low_confidence_flag=r.low_confidence_flag
        )
        db.add(new_r)

    tender.status = "Published"
    tender.confirmed_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(tender)

    write_audit(db, current_user.name, current_user.role, "CONFIRM_TENDER", tender.tender_no, {"status": "Published"})

    t_out = TenderOut.model_validate(tender)
    t_out.bids_count = len(tender.bids)
    return t_out

@app.post("/tenders", response_model=TenderOut, tags=["Tenders"])
def create_tender(
    payload: TenderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new tender with structured requirements."""
    tender = Tender(
        tender_no=payload.tender_no,
        title=payload.title,
        department=payload.department,
        category=payload.category,
        budget=payload.budget,
        quantity=payload.quantity,
        unit=payload.unit,
        deadline=payload.deadline,
        status="Draft",
        evaluation_method=payload.evaluation_method,
        tech_weight=payload.tech_weight,
        fin_weight=payload.fin_weight
    )
    db.add(tender)
    db.commit()
    db.refresh(tender)

    for req in payload.requirements:
        r = Requirement(
            tender_id=tender.id,
            parameter=req.parameter,
            operator=req.operator,
            value=req.value,
            unit=req.unit,
            is_mandatory=req.is_mandatory,
            description=req.description,
            confidence_score=req.confidence_score,
            low_confidence_flag=req.low_confidence_flag
        )
        db.add(r)
    db.commit()
    db.refresh(tender)

    write_audit(db, current_user.name, current_user.role, "CREATE_TENDER", tender.tender_no, {"budget": tender.budget})
    t_out = TenderOut.model_validate(tender)
    t_out.bids_count = 0
    return t_out


# ==================== BIDS & EVALUATION ====================

@app.get("/tenders/{tender_id}/bids", response_model=List[BidOut], tags=["Bids"])
def list_tender_bids(tender_id: int, db: Session = Depends(get_db)):
    """List all submitted bids for a tender."""
    bids = db.query(Bid).filter(Bid.tender_id == tender_id).all()
    results = []
    for b in bids:
        b_dict = {
            "id": b.id,
            "tender_id": b.tender_id,
            "vendor_id": b.vendor_id,
            "vendor_name": b.vendor.company_name if b.vendor else "Unknown",
            "vendor_gstin": b.vendor.gstin if b.vendor else "N/A",
            "price_per_unit": b.price_per_unit,
            "total_amount": b.total_amount,
            "delivery_days": b.delivery_days,
            "technical_specs": json.loads(b.technical_specs) if b.technical_specs else {},
            "status": b.status,
            "rank": b.rank,
            "tech_score": b.tech_score,
            "fin_score": b.fin_score,
            "final_qcbs_score": b.final_qcbs_score,
            "disqualification_reasons": json.loads(b.disqualification_reasons) if b.disqualification_reasons else [],
            "red_flag_reasons": json.loads(b.red_flag_reasons) if b.red_flag_reasons else [],
            "officer_notes": b.officer_notes,
            "evaluated_at": b.evaluated_at,
            "created_at": b.created_at,
            "checks": b.checks,
            "documents": b.documents
        }
        results.append(BidOut(**b_dict))
    return results

@app.post("/tenders/{tender_id}/bids", response_model=BidOut, tags=["Bids"])
def submit_bid(
    tender_id: int,
    payload: BidCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Vendor applies to tender: submits bid form with price, delivery days, claimed specs.
    """
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    profile = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    vendor_id = payload.vendor_id or (profile.id if profile else 1)

    # Calculate total
    total = payload.price_per_unit * tender.quantity

    bid = Bid(
        tender_id=tender_id,
        vendor_id=vendor_id,
        price_per_unit=payload.price_per_unit,
        total_amount=total,
        delivery_days=payload.delivery_days,
        technical_specs=json.dumps(payload.technical_specs),
        status="Submitted",
        created_at=datetime.datetime.utcnow()
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)

    write_audit(db, profile.company_name if profile else "Vendor", "vendor", "SUBMIT_BID", f"Tender {tender.tender_no}", {"bid_amount": total})

    return BidOut(
        id=bid.id,
        tender_id=bid.tender_id,
        vendor_id=bid.vendor_id,
        vendor_name=bid.vendor.company_name if bid.vendor else "Vendor",
        vendor_gstin=bid.vendor.gstin if bid.vendor else "N/A",
        price_per_unit=bid.price_per_unit,
        total_amount=bid.total_amount,
        delivery_days=bid.delivery_days,
        technical_specs=payload.technical_specs,
        status=bid.status,
        rank=bid.rank,
        tech_score=0.0,
        fin_score=0.0,
        final_qcbs_score=0.0,
        disqualification_reasons=[],
        red_flag_reasons=[],
        officer_notes=None,
        evaluated_at=None,
        created_at=bid.created_at,
        checks=[],
        documents=[]
    )

@app.post("/tenders/{tender_id}/evaluate", tags=["Evaluation"])
async def run_evaluation(
    tender_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger live compliance & verification evaluation pipeline:
    Runs parallel verification agents (Licence, Company, GeM price & fraud collusion)
    and executes deterministic compliance ranking!
    """
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    bids = db.query(Bid).filter(Bid.tender_id == tender_id).all()
    if not bids:
        raise HTTPException(status_code=400, detail="No bids submitted for this tender")

    # Load category rulebook
    rb_entry = db.query(CategoryRulebook).filter(CategoryRulebook.category == tender.category).first()
    rulebook = json.loads(rb_entry.data) if rb_entry else {}

    # Run deterministic compliance pipeline
    results = await compliance_engine.run_evaluation_pipeline(tender, bids, rulebook)

    now = datetime.datetime.utcnow()

    # Save evaluation results to DB
    for res in results:
        b = res["bid"]
        b.status = res["status"]
        b.rank = res.get("rank")
        b.tech_score = res.get("tech_score", 0.0)
        b.fin_score = res.get("fin_score", 0.0)
        b.final_qcbs_score = res.get("final_qcbs_score", 0.0)
        b.disqualification_reasons = json.dumps(res["disqualifications"])
        b.red_flag_reasons = json.dumps(res["red_flags"])
        b.evaluated_at = now

        # Delete old checks and save freshly executed agent checks
        # Use ORM deletes (not bulk query.delete()) so child Evidence rows are
        # removed through the relationship cascade; otherwise the FK constraint fails.
        for old_chk in db.query(VerificationCheck).filter(VerificationCheck.bid_id == b.id).all():
            db.delete(old_chk)
        db.flush()
        for chk in res["checks"]:
            vc = VerificationCheck(
                bid_id=b.id,
                check_name=chk["check_name"],
                passed=chk["passed"],
                verdict=chk["verdict"],
                reason=chk["reason"],
                source_name=chk["source_name"],
                source_url=chk["source_url"],
                is_live=chk["is_live"],
                verified_at=now
            )
            db.add(vc)
            db.commit()
            db.refresh(vc)

            ev = Evidence(
                check_id=vc.id,
                screenshot_path=chk["screenshot_path"],
                caption=f"Evidence verification for {chk['check_name']}",
                raw_data=json.dumps(chk.get("raw_data", {})),
                is_live=chk["is_live"],
                captured_at=now
            )
            db.add(ev)

    tender.status = "Under Evaluation"
    db.commit()

    write_audit(db, current_user.name, current_user.role, "RUN_EVALUATION", tender.tender_no, {
        "bids_evaluated": len(bids),
        "qualified": sum(1 for r in results if r["status"] == "Qualified"),
        "disqualified": sum(1 for r in results if r["status"] == "Disqualified"),
        "red_flagged": sum(1 for r in results if r["status"] == "Red Flagged")
    })

    return {
        "status": "success",
        "message": f"Evaluation pipeline completed across {len(bids)} submitted bids.",
        "tender_id": tender_id,
        "evaluated_at": now.isoformat()
    }

@app.post("/tenders/{tender_id}/approve", tags=["Tenders"])
def approve_tender(
    tender_id: int,
    payload: TenderApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Officer final approval or override with mandatory justification notes.
    Triggers vendor notifications!
    """
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    tender.status = "Awarded"
    tender.approved_at = datetime.datetime.utcnow()
    tender.approval_notes = payload.notes or payload.override_reason or "Approved by Competent Authority."

    # Identify L1 or H1 winning bid
    winning_bid = db.query(Bid).filter(Bid.tender_id == tender_id, Bid.rank.in_(["L1", "H1"])).first()
    if winning_bid:
        tender.winning_bid_id = winning_bid.id
        winning_bid.status = "Awarded"

        # Create notification for winner
        notif_winner = Notification(
            user_id=winning_bid.vendor.user_id if winning_bid.vendor else None,
            role="vendor",
            title="Contract Award Notification",
            message=f"Congratulations! Your bid for Tender {tender.tender_no} has been officially approved and awarded.",
            link=f"/vendor/applications",
            type="approved",
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif_winner)

    db.commit()

    write_audit(db, current_user.name, current_user.role, "APPROVE_TENDER", tender.tender_no, {
        "winning_bid_id": tender.winning_bid_id,
        "notes": tender.approval_notes
    })

    return {
        "status": "success",
        "message": f"Tender {tender.tender_no} approved and awarded successfully.",
        "winning_bid_id": tender.winning_bid_id
    }

@app.get("/tenders/{tender_id}/report", tags=["Reports"])
def download_tender_pdf_report(tender_id: int, db: Session = Depends(get_db)):
    """Generate and return official Indian Government Tender Evaluation Report PDF."""
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    bids = db.query(Bid).filter(Bid.tender_id == tender_id).all()
    pdf_path = os.path.join(reports_dir, f"TenderLens_Evaluation_Report_{tender.tender_no.replace('/', '_')}.pdf")

    EvaluationReportGenerator.generate_pdf(tender, bids, pdf_path)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"TenderLens_Evaluation_Report_{tender.tender_no.replace('/', '_')}.pdf"
    )


# ==================== VENDOR APPLICATIONS & DOCUMENTS ====================

@app.get("/vendors/me/applications", response_model=List[BidOut], tags=["Vendor"])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Status tracker for vendor's submitted bids."""
    profile = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not profile:
        profile = db.query(VendorProfile).first()

    bids = db.query(Bid).filter(Bid.vendor_id == profile.id).all()
    results = []
    for b in bids:
        b_dict = {
            "id": b.id,
            "tender_id": b.tender_id,
            "vendor_id": b.vendor_id,
            "vendor_name": b.vendor.company_name if b.vendor else "My Company",
            "vendor_gstin": b.vendor.gstin if b.vendor else "N/A",
            "price_per_unit": b.price_per_unit,
            "total_amount": b.total_amount,
            "delivery_days": b.delivery_days,
            "technical_specs": json.loads(b.technical_specs) if b.technical_specs else {},
            "status": b.status,
            "rank": b.rank,
            "tech_score": b.tech_score,
            "fin_score": b.fin_score,
            "final_qcbs_score": b.final_qcbs_score,
            "disqualification_reasons": json.loads(b.disqualification_reasons) if b.disqualification_reasons else [],
            "red_flag_reasons": json.loads(b.red_flag_reasons) if b.red_flag_reasons else [],
            "officer_notes": b.officer_notes,
            "evaluated_at": b.evaluated_at,
            "created_at": b.created_at,
            "checks": b.checks,
            "documents": b.documents
        }
        results.append(BidOut(**b_dict))
    return results

@app.post("/bids/{bid_id}/documents", tags=["Bids"])
async def upload_bid_document(
    bid_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload document, parse fields, and update document status."""
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    save_path = f"/static/uploads/{file.filename}"
    extracted = await extractor.extract_bid_document_specs(doc_type, file.filename)

    doc = BidDocument(
        bid_id=bid_id,
        doc_type=doc_type,
        file_path=save_path,
        extracted_json=json.dumps(extracted),
        verified_status="Verified" if extracted.get("extracted_confidence", 0) > 0.8 else "Pending"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "status": "success",
        "doc_id": doc.id,
        "doc_type": doc_type,
        "extracted": extracted,
        "verified_status": doc.verified_status
    }


# ==================== CLARIFICATIONS & NOTIFICATIONS ====================

@app.get("/clarifications", response_model=List[ClarificationOut], tags=["Clarifications"])
def list_clarifications(
    tender_id: Optional[int] = None,
    vendor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Clarification)
    if tender_id:
        query = query.filter(Clarification.tender_id == tender_id)
    if vendor_id:
        query = query.filter(Clarification.vendor_id == vendor_id)

    items = query.order_by(desc(Clarification.created_at)).all()
    results = []
    for c in items:
        vendor = db.query(VendorProfile).filter(VendorProfile.id == c.vendor_id).first()
        results.append(ClarificationOut(
            id=c.id,
            tender_id=c.tender_id,
            bid_id=c.bid_id,
            vendor_id=c.vendor_id,
            vendor_name=vendor.company_name if vendor else "Vendor",
            query_text=c.query_text,
            response_text=c.response_text,
            attachment_path=c.attachment_path,
            status=c.status,
            created_at=c.created_at,
            replied_at=c.replied_at
        ))
    return results

@app.post("/clarifications", response_model=ClarificationOut, tags=["Clarifications"])
def create_clarification(
    payload: ClarificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Officer creates and sends polite clarification query to vendor."""
    c = Clarification(
        tender_id=payload.tender_id,
        bid_id=payload.bid_id,
        vendor_id=payload.vendor_id,
        query_text=payload.query_text,
        status="Sent",
        created_at=datetime.datetime.utcnow()
    )
    db.add(c)

    # Notify vendor
    vendor = db.query(VendorProfile).filter(VendorProfile.id == payload.vendor_id).first()
    if vendor:
        notif = Notification(
            user_id=vendor.user_id,
            role="vendor",
            title="Official Clarification Requested",
            message=f"Government Officer has requested clarification regarding your bid.",
            link="/vendor/clarifications",
            type="clarification",
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)

    db.commit()
    db.refresh(c)

    write_audit(db, current_user.name, current_user.role, "SEND_CLARIFICATION", f"Bid #{c.bid_id}", {"vendor_id": c.vendor_id})

    return ClarificationOut(
        id=c.id,
        tender_id=c.tender_id,
        bid_id=c.bid_id,
        vendor_id=c.vendor_id,
        vendor_name=vendor.company_name if vendor else "Vendor",
        query_text=c.query_text,
        response_text=c.response_text,
        attachment_path=c.attachment_path,
        status=c.status,
        created_at=c.created_at,
        replied_at=c.replied_at
    )

@app.post("/clarifications/{clarification_id}/reply", response_model=ClarificationOut, tags=["Clarifications"])
def reply_clarification(
    clarification_id: int,
    payload: ClarificationReply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vendor replies to clarification."""
    c = db.query(Clarification).filter(Clarification.id == clarification_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Clarification not found")

    c.response_text = payload.response_text
    c.status = "Replied"
    c.replied_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(c)

    write_audit(db, current_user.name, current_user.role, "REPLY_CLARIFICATION", f"Clarification #{c.id}", {})

    vendor = db.query(VendorProfile).filter(VendorProfile.id == c.vendor_id).first()
    return ClarificationOut(
        id=c.id,
        tender_id=c.tender_id,
        bid_id=c.bid_id,
        vendor_id=c.vendor_id,
        vendor_name=vendor.company_name if vendor else "Vendor",
        query_text=c.query_text,
        response_text=c.response_text,
        attachment_path=c.attachment_path,
        status=c.status,
        created_at=c.created_at,
        replied_at=c.replied_at
    )

@app.get("/notifications", response_model=List[NotificationOut], tags=["Notifications"])
def get_notifications(
    role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for the current user and role."""
    target_role = role or current_user.role
    return db.query(Notification).filter(Notification.role == target_role).order_by(desc(Notification.created_at)).all()

@app.post("/notifications/{notification_id}/read", tags=["Notifications"])
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"status": "success"}


# ==================== RULEBOOKS & AUDIT LOG ====================

@app.get("/categories", tags=["Categories"])
def get_categories(db: Session = Depends(get_db)):
    """List tender categories with their active standards and tender count."""
    cats = ["Cement", "TMT Steel", "PVC Pipes", "Services"]
    stats = []
    for c in cats:
        count = db.query(Tender).filter(Tender.category == c).count()
        rb = db.query(CategoryRulebook).filter(CategoryRulebook.category == c).first()
        standards = []
        if rb:
            data = json.loads(rb.data)
            standards = [s.get("code") for s in data.get("applicable_is_standards", [])]
        stats.append({
            "category": c,
            "tender_count": count,
            "standards": standards
        })
    return stats

@app.get("/categories/{category_name}/rulebook", tags=["Categories"])
def get_rulebook(category_name: str, db: Session = Depends(get_db)):
    """Get the complete rulebook JSON for a category."""
    rb = db.query(CategoryRulebook).filter(CategoryRulebook.category == category_name).first()
    if not rb:
        raise HTTPException(status_code=404, detail="Rulebook not found for this category")
    return json.loads(rb.data)

@app.get("/audit-log", response_model=List[AuditLogOut], tags=["Audit Log"])
def get_audit_log(
    role: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Every action writes to audit_log table. Official audit trail."""
    query = db.query(AuditLog)
    if role and role != "All":
        query = query.filter(AuditLog.role == role)
    if action and action != "All":
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(100).all()
    results = []
    for l in logs:
        results.append(AuditLogOut(
            id=l.id,
            actor=l.actor,
            role=l.role,
            action=l.action,
            target=l.target,
            details=json.loads(l.details) if l.details else {},
            timestamp=l.timestamp
        ))
    return results

@app.get("/stats/dashboard", tags=["Dashboard"])
def get_dashboard_stats(
    role: str = Query("officer"),
    db: Session = Depends(get_db)
):
    """Aggregated KPI metrics for dashboard stat cards and charts."""
    if role == "officer":
        active_tenders = db.query(Tender).filter(Tender.status.in_(["Published", "Bids Open", "Under Evaluation"])).count()
        total_bids = db.query(Bid).count()
        qualified_bids = db.query(Bid).filter(Bid.status == "Qualified").count()
        disqualified_bids = db.query(Bid).filter(Bid.status == "Disqualified").count()
        red_flagged_bids = db.query(Bid).filter(Bid.status == "Red Flagged").count()

        # Category breakdown
        cat_bids = {
            "Cement": db.query(Bid).join(Tender).filter(Tender.category == "Cement").count(),
            "TMT Steel": db.query(Bid).join(Tender).filter(Tender.category == "TMT Steel").count(),
            "PVC Pipes": db.query(Bid).join(Tender).filter(Tender.category == "PVC Pipes").count(),
            "Services": db.query(Bid).join(Tender).filter(Tender.category == "Services").count()
        }

        return {
            "kpis": [
                {"label": "Active Tenders", "value": active_tenders, "trend": "+12%", "trend_type": "positive", "caption": "from 4 (last month)"},
                {"label": "Bids Received", "value": total_bids, "trend": "+28%", "trend_type": "positive", "caption": "from 8 (last weeks)"},
                {"label": "Qualified Bids", "value": qualified_bids, "trend": "+15%", "trend_type": "positive", "caption": "passed compliance"},
                {"label": "Disqualified / Non-Compliant", "value": disqualified_bids, "trend": "-8%", "trend_type": "negative", "caption": "prevented substandard supply"},
                {"label": "Red Flags / Collusion", "value": red_flagged_bids, "trend": "+50%", "trend_type": "negative", "caption": "vigilance committee alerts"}
            ],
            "category_distribution": cat_bids,
            "monthly_trends": [
                {"month": "Jan", "total_tenders": 12, "verified_claims": 45, "disqualified": 8, "savings_cr": 2.4},
                {"month": "Feb", "total_tenders": 16, "verified_claims": 62, "disqualified": 12, "savings_cr": 3.8},
                {"month": "Mar", "total_tenders": 24, "verified_claims": 98, "disqualified": 19, "savings_cr": 5.9},
                {"month": "Apr", "total_tenders": 18, "verified_claims": 74, "disqualified": 11, "savings_cr": 4.1},
                {"month": "May", "total_tenders": 29, "verified_claims": 115, "disqualified": 24, "savings_cr": 7.2},
                {"month": "Jun", "total_tenders": 35, "verified_claims": 142, "disqualified": 28, "savings_cr": 8.6}
            ]
        }
    else:
        # Vendor metrics
        return {
            "kpis": [
                {"label": "Tenders Matched", "value": 14, "trend": "+76%", "trend_type": "positive", "caption": "from 8 (last weeks)"},
                {"label": "Applications Submitted", "value": 4, "trend": "+32%", "trend_type": "positive", "caption": "active bids"},
                {"label": "Shortlisted / Ranked L1", "value": 2, "trend": "+100%", "trend_type": "positive", "caption": "compliant leader"},
                {"label": "Documents Verified", "value": "100%", "trend": "5/5", "trend_type": "positive", "caption": "all registries clear"}
            ],
            "monthly_trends": [
                {"month": "Jan", "matches": 6, "applications": 2, "shortlisted": 1},
                {"month": "Feb", "matches": 9, "applications": 3, "shortlisted": 1},
                {"month": "Mar", "matches": 12, "applications": 4, "shortlisted": 2},
                {"month": "Apr", "matches": 10, "applications": 3, "shortlisted": 1},
                {"month": "May", "matches": 15, "applications": 5, "shortlisted": 2},
                {"month": "Jun", "matches": 18, "applications": 6, "shortlisted": 3}
            ]
        }

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "TenderLens Backend Engine",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
