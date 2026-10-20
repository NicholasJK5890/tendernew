import os
import json
import datetime
from database import engine, SessionLocal, Base
from models import (
    User, VendorProfile, Tender, Requirement, Bid, BidDocument,
    VerificationCheck, Evidence, Notification, Clarification, AuditLog, CategoryRulebook
)

def seed_database(drop_existing: bool = True):
    if drop_existing:
        print("Dropping and recreating database tables...")
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Rulebooks
        rulebooks_dir = os.path.join(os.path.dirname(__file__), "rulebooks")
        for filename in ["cement.json", "steel.json", "pipes.json", "services.json"]:
            filepath = os.path.join(rulebooks_dir, filename)
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    data = json.loads(content)
                    rb = CategoryRulebook(category=data["category"], data=content)
                    db.add(rb)
        db.commit()

        # 2. Users
        # Officer
        officer = User(
            name="Rajesh Sharma",
            email="officer@cpwd.gov.in",
            role="officer",
            department="Central Public Works Department (CPWD), New Delhi",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
        )
        db.add(officer)

        # Vendors
        vendor_user_a = User(
            name="Kailash Sharma",
            email="vendor_a@shreeram.com",
            role="vendor",
            department="Shree Ram Cement Ltd",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
        )
        vendor_user_b = User(
            name="Vikram Malhotra",
            email="vendor_b@ultracem.com",
            role="vendor",
            department="Ultracem Infra Solutions Pvt Ltd",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"
        )
        vendor_user_c = User(
            name="Harpreet Singh",
            email="vendor_c@ambuja.com",
            role="vendor",
            department="Ambuja & Bharat Cements Corp",
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80"
        )
        vendor_user_d = User(
            name="Mohit Singhania",
            email="vendor_d@apex.com",
            role="vendor",
            department="Apex Buildtech Enterprises",
            avatar_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80"
        )
        db.add_all([vendor_user_a, vendor_user_b, vendor_user_c, vendor_user_d])
        db.commit()

        # 3. Vendor Profiles
        vp_a = VendorProfile(
            user_id=vendor_user_a.id,
            company_name="Shree Ram Cement Ltd",
            gstin="08AABCS4819Q1ZP",
            cin="L26940RJ2012PLC041920",
            pan="AABCS4819Q",
            address="Plot 44-48, Industrial Area Phase II, Bhiwadi, Rajasthan - 301019",
            contact_email="procurement@shreeramcement.in",
            contact_phone="+91 1493 251820",
            directors=json.dumps(["Kailash Chand Sharma", "Rameshwar Dayal"]),
            categories_supplied=json.dumps(["Cement"]),
            annual_turnover=250000000.0,
            past_projects=json.dumps([
                {"client": "Rajasthan PWD", "project": "State Highway Supply", "value": 45000000, "year": "2024"},
                {"client": "DMRC", "project": "Metro Phase 3 Bulk Supply", "value": 85000000, "year": "2023"}
            ]),
            bis_licences=json.dumps([
                {
                    "licence_no": "CM/L-4829103",
                    "is_code": "IS 269:2015",
                    "product_name": "Ordinary Portland Cement 43 Grade",
                    "valid_upto": "2025-12-31",
                    "status": "Expired"
                }
            ]),
            completeness_pct=95
        )

        vp_b = VendorProfile(
            user_id=vendor_user_b.id,
            company_name="Ultracem Infra Solutions Pvt Ltd",
            gstin="07AABCU9603R1ZM",
            cin="U26940HR2016PTC063291",
            pan="AABCU9603R",
            address="Sector 18, Industrial Hub, Gurugram, Haryana - 122015",
            contact_email="govbids@ultraceminfra.com",
            contact_phone="+91 124 4921000",
            directors=json.dumps(["Vikram Malhotra", "Sunita Malhotra"]),
            categories_supplied=json.dumps(["Cement", "TMT Steel"]),
            annual_turnover=420000000.0,
            past_projects=json.dumps([
                {"client": "NHAI Northern Region", "project": "Delhi-Mumbai Expressway Package 4", "value": 120000000, "year": "2025"},
                {"client": "CPWD Central Zone", "project": "New Secretariat Campus", "value": 95000000, "year": "2024"}
            ]),
            bis_licences=json.dumps([
                {
                    "licence_no": "CM/L-7182934",
                    "is_code": "IS 269:2015",
                    "product_name": "Ordinary Portland Cement (43 & 53 Grade)",
                    "valid_upto": "2028-03-31",
                    "status": "Valid"
                },
                {
                    "licence_no": "CM/L-7182999",
                    "is_code": "IS 1786:2008",
                    "product_name": "High Strength Deformed Steel Bars",
                    "valid_upto": "2027-10-15",
                    "status": "Valid"
                }
            ]),
            completeness_pct=100
        )

        vp_c = VendorProfile(
            user_id=vendor_user_c.id,
            company_name="Ambuja & Bharat Cements Corp",
            gstin="03AABCA1290M1Z8",
            cin="L26940PB2010PLC039182",
            pan="AABCA1290M",
            address="G.T. Road, Near Focal Point, Ludhiana, Punjab - 141010",
            contact_email="tenders@ambujabharat.com",
            contact_phone="+91 161 5038100",
            directors=json.dumps(["Harpreet Singh Sodhi", "Amanpreet Kaur"]),
            categories_supplied=json.dumps(["Cement"]),
            annual_turnover=380000000.0,
            past_projects=json.dumps([
                {"client": "Punjab PWD (B&R)", "project": "Bridge Construction Ludhiana", "value": 65000000, "year": "2024"}
            ]),
            bis_licences=json.dumps([
                {
                    "licence_no": "CM/L-8291045",
                    "is_code": "IS 269:2015",
                    "product_name": "Ordinary Portland Cement 43 Grade",
                    "valid_upto": "2027-09-30",
                    "status": "Valid"
                }
            ]),
            completeness_pct=95
        )

        vp_d = VendorProfile(
            user_id=vendor_user_d.id,
            company_name="Apex Buildtech Enterprises",
            gstin="08AABCA9912F1Z1",
            cin="U45201RJ2022PTC082910",
            pan="AABCA9912F",
            address="Plot 44-48, Industrial Area Phase II, Bhiwadi, Rajasthan - 301019",  # Common address with Vendor A!
            contact_email="sales@apexbuildtech.in",
            contact_phone="+91 1493 251829",
            directors=json.dumps(["Kailash Chand Sharma", "Mohit Singhania"]),  # Common director with Vendor A!
            categories_supplied=json.dumps(["Cement"]),
            annual_turnover=85000000.0,
            past_projects=json.dumps([
                {"client": "Local Nagar Nigam", "project": "Drainage Works", "value": 15000000, "year": "2024"}
            ]),
            bis_licences=json.dumps([
                {
                    "licence_no": "CM/L-6182901",
                    "is_code": "IS 269:2015",
                    "product_name": "Ordinary Portland Cement",
                    "valid_upto": "2027-11-15",
                    "status": "Valid"
                }
            ]),
            completeness_pct=90
        )

        db.add_all([vp_a, vp_b, vp_c, vp_d])
        db.commit()

        # 4. Tenders
        now = datetime.datetime.utcnow()
        # Tender 1: Cement (Main Demo)
        tender_cement = Tender(
            tender_no="CPWD/ND-II/2026/C-409",
            title="Supply of 50,000 Bags 43-Grade Ordinary Portland Cement (OPC) for Delhi AIIMS Extension",
            department="Central Public Works Department (CPWD), New Delhi",
            category="Cement",
            budget=18500000.0,
            quantity=50000.0,
            unit="Bags (50kg each)",
            deadline=now + datetime.timedelta(days=14),
            status="Under Evaluation",
            evaluation_method="L1",
            nit_document_path="/static/sample_nit_cement.pdf",
            created_at=now - datetime.timedelta(days=5),
            confirmed_at=now - datetime.timedelta(days=4)
        )
        db.add(tender_cement)
        db.commit()

        # Requirements for Tender 1
        reqs = [
            Requirement(
                tender_id=tender_cement.id,
                parameter="BIS Licence IS 269 Certification",
                operator="eq",
                value="VALID",
                unit="status",
                is_mandatory=True,
                description="Active BIS CM/L licence mark under IS 269:2015",
                confidence_score=0.99,
                low_confidence_flag=False
            ),
            Requirement(
                tender_id=tender_cement.id,
                parameter="Compressive Strength 28 Days",
                operator="min",
                value="43",
                unit="MPa",
                is_mandatory=True,
                description="28-day compressive strength minimum 43 MPa as per IS 4031",
                confidence_score=0.96,
                low_confidence_flag=False
            ),
            Requirement(
                tender_id=tender_cement.id,
                parameter="Initial Setting Time",
                operator="min",
                value="30",
                unit="minutes",
                is_mandatory=True,
                description="Initial setting time not less than 30 minutes",
                confidence_score=0.74,
                low_confidence_flag=True
            ),
            Requirement(
                tender_id=tender_cement.id,
                parameter="Final Setting Time",
                operator="max",
                value="600",
                unit="minutes",
                is_mandatory=True,
                description="Final setting time not exceeding 600 minutes",
                confidence_score=0.92,
                low_confidence_flag=False
            ),
            Requirement(
                tender_id=tender_cement.id,
                parameter="Soundness (Le-Chatelier)",
                operator="max",
                value="10",
                unit="mm",
                is_mandatory=True,
                description="Expansion shall not exceed 10 mm",
                confidence_score=0.95,
                low_confidence_flag=False
            ),
            Requirement(
                tender_id=tender_cement.id,
                parameter="Annual Financial Turnover",
                operator="min",
                value="20000000",
                unit="INR",
                is_mandatory=True,
                description="Minimum average annual turnover of ₹2.00 Crore for past 3 financial years",
                confidence_score=0.98,
                low_confidence_flag=False
            )
        ]
        db.add_all(reqs)
        db.commit()

        # Seed Bids for Tender 1
        # Vendor A: ₹340.00 (Cheapest, but BIS licence expired -> Disqualified!)
        bid_a = Bid(
            tender_id=tender_cement.id,
            vendor_id=vp_a.id,
            price_per_unit=340.0,
            total_amount=340.0 * 50000,
            delivery_days=10,
            technical_specs=json.dumps({
                "bis_licence": "CM/L-4829103",
                "compressive_strength_28d": 44.5,
                "initial_setting_time": 40,
                "final_setting_time": 230,
                "soundness": 3.0
            }),
            status="Disqualified",
            rank=None,
            disqualification_reasons=json.dumps([
                "Non-compliant BIS Certification: BIS Licence CM/L-4829103 expired on 31-Dec-2025. Status listed as 'EXPIRED / CANCELLED' on BIS Manakonline."
            ]),
            red_flag_reasons=json.dumps([]),
            officer_notes="Cheapest bid rejected strictly on non-compliance with mandatory BIS safety certification as per GFR Rule 144.",
            evaluated_at=now
        )

        # Vendor B: ₹365.00 (All pass -> L1!)
        bid_b = Bid(
            tender_id=tender_cement.id,
            vendor_id=vp_b.id,
            price_per_unit=365.0,
            total_amount=365.0 * 50000,
            delivery_days=7,
            technical_specs=json.dumps({
                "bis_licence": "CM/L-7182934",
                "compressive_strength_28d": 48.0,
                "initial_setting_time": 50,
                "final_setting_time": 210,
                "soundness": 1.8
            }),
            status="Qualified",
            rank="L1",
            disqualification_reasons=json.dumps([]),
            red_flag_reasons=json.dumps([]),
            officer_notes="Substantively responsive bid. Holds active IS 269 BIS certification and verified test parameters.",
            evaluated_at=now
        )

        # Vendor C: ₹372.00 (All pass -> L2!)
        bid_c = Bid(
            tender_id=tender_cement.id,
            vendor_id=vp_c.id,
            price_per_unit=372.0,
            total_amount=372.0 * 50000,
            delivery_days=12,
            technical_specs=json.dumps({
                "bis_licence": "CM/L-8291045",
                "compressive_strength_28d": 46.2,
                "initial_setting_time": 45,
                "final_setting_time": 240,
                "soundness": 2.5
            }),
            status="Qualified",
            rank="L2",
            disqualification_reasons=json.dumps([]),
            red_flag_reasons=json.dumps([]),
            officer_notes="Responsive bid; ranked second behind Ultracem Infra.",
            evaluated_at=now
        )

        # Vendor D: ₹290.00 (Far below benchmark and shares address & director with Vendor A -> Red Flagged!)
        bid_d = Bid(
            tender_id=tender_cement.id,
            vendor_id=vp_d.id,
            price_per_unit=290.0,
            total_amount=290.0 * 50000,
            delivery_days=5,
            technical_specs=json.dumps({
                "bis_licence": "CM/L-6182901",
                "compressive_strength_28d": 45.0,
                "initial_setting_time": 35,
                "final_setting_time": 260,
                "soundness": 2.8
            }),
            status="Red Flagged",
            rank=None,
            disqualification_reasons=json.dumps([]),
            red_flag_reasons=json.dumps([
                "Abnormally Low Tender (ALT) Alert: Quoted price ₹290.0 is significantly below GeM market floor threshold (₹300.0). High risk of contractor abandonment.",
                "Collusion Risk Detected: Shares registered physical address 'Plot 44-48, Industrial Area Phase II, Bhiwadi, Rajasthan - 301019' with competing bidder(s): Shree Ram Cement Ltd.",
                "Common Directorship Alert: Interlocking board directorship identified with competing bidder(s): Shree Ram Cement Ltd (Common: Kailash Chand Sharma)."
            ]),
            officer_notes="Suspended pending vigilance committee scrutiny due to multiple collusion and predatory bidding signals.",
            evaluated_at=now
        )

        db.add_all([bid_a, bid_b, bid_c, bid_d])
        db.commit()

        # Seed Verification Checks and Evidence for Bids
        # Bid A Checks
        chk_a1 = VerificationCheck(
            bid_id=bid_a.id,
            check_name="BIS Licence Verification (IS 269:2015)",
            passed=False,
            verdict="Fail",
            reason="BIS Licence CM/L-4829103 expired on 31-Dec-2025. Status listed as 'EXPIRED / CANCELLED' on BIS Manakonline.",
            source_name="BIS Manakonline Portal (Cached Demo Evidence)",
            source_url="https://www.manakonline.in/MANAK/searchLicence",
            is_live=False,
            verified_at=now
        )
        db.add(chk_a1)
        db.commit()
        ev_a1 = Evidence(
            check_id=chk_a1.id,
            screenshot_path="/static/evidence/bis_expired_shree_ram.png",
            caption="BIS Manakonline verification showing EXPIRED licence status",
            raw_data=json.dumps({"licence_no": "CM/L-4829103", "status": "EXPIRED", "expiry_date": "2025-12-31"}),
            is_live=False,
            captured_at=now
        )
        db.add(ev_a1)

        # Bid B Checks
        chk_b1 = VerificationCheck(
            bid_id=bid_b.id,
            check_name="BIS Licence Verification (IS 269:2015)",
            passed=True,
            verdict="Pass",
            reason="Active BIS certification confirmed for IS 269:2015. Licence valid through 31-Mar-2028. Factory audit cleared.",
            source_name="BIS Manakonline Portal (Cached Demo Evidence)",
            source_url="https://www.manakonline.in/MANAK/searchLicence",
            is_live=False,
            verified_at=now
        )
        chk_b2 = VerificationCheck(
            bid_id=bid_b.id,
            check_name="GSTIN Registration & Status Check",
            passed=True,
            verdict="Pass",
            reason="GSTIN 07AABCU9603R1ZM is ACTIVE under Regular taxpayer category. GSTR-3B filings current up to last month.",
            source_name="GST Common Portal (Cached Demo Evidence)",
            source_url="https://services.gst.gov.in/services/searchtp",
            is_live=False,
            verified_at=now
        )
        db.add_all([chk_b1, chk_b2])
        db.commit()

        ev_b1 = Evidence(
            check_id=chk_b1.id,
            screenshot_path="/static/evidence/bis_active_ultracem.png",
            caption="BIS Manakonline verification confirming OPERATIVE status",
            raw_data=json.dumps({"licence_no": "CM/L-7182934", "status": "ACTIVE", "valid_till": "2028-03-31"}),
            is_live=False,
            captured_at=now
        )
        ev_b2 = Evidence(
            check_id=chk_b2.id,
            screenshot_path="/static/evidence/gst_active_portal.png",
            caption="GST Common Portal search confirming ACTIVE Regular status",
            raw_data=json.dumps({"gstin": "07AABCU9603R1ZM", "status": "Active"}),
            is_live=False,
            captured_at=now
        )
        db.add_all([ev_b1, ev_b2])

        # Bid D Check & Evidence (Collusion)
        chk_d1 = VerificationCheck(
            bid_id=bid_d.id,
            check_name="Price Benchmark & Cross-Bid Collusion Audit",
            passed=False,
            verdict="Red Flag",
            reason="Abnormally Low Tender (ALT) Alert: Quoted ₹290 vs ₹300 minimum benchmark | Common directorship & shared registered office with Shree Ram Cement Ltd.",
            source_name="GeM Price Index & Inter-Bid Collusion Graph",
            source_url="https://gem.gov.in/market-prices",
            is_live=False,
            verified_at=now
        )
        db.add(chk_d1)
        db.commit()
        ev_d1 = Evidence(
            check_id=chk_d1.id,
            screenshot_path="/static/evidence/gem_price_collusion_graph.png",
            caption="GeM price index floor & collusion entity overlap graph",
            raw_data=json.dumps({"quoted_price": 290.0, "benchmark_median": 368.5, "shared_director": "Kailash Chand Sharma"}),
            is_live=False,
            captured_at=now
        )
        db.add(ev_d1)

        # 5. Additional Seed Tenders (Steel, Pipes, Services)
        tender_steel = Tender(
            tender_no="NHAI/TECH/2026/STEEL-112",
            title="Procurement of 1,200 MT Fe 500D TMT Rebars for Expressway Flyover Construction",
            department="National Highways Authority of India (NHAI)",
            category="TMT Steel",
            budget=68400000.0,
            quantity=1200.0,
            unit="Metric Tonnes",
            deadline=now + datetime.timedelta(days=21),
            status="Bids Open",
            evaluation_method="L1",
            nit_document_path="/static/sample_nit_steel.pdf",
            created_at=now - datetime.timedelta(days=3),
            confirmed_at=now - datetime.timedelta(days=2)
        )
        req_steel = [
            Requirement(tender_id=tender_steel.id, parameter="BIS Licence IS 1786 Certification", operator="eq", value="VALID", unit="status", is_mandatory=True, description="Active BIS certification for Fe 500D rebars"),
            Requirement(tender_id=tender_steel.id, parameter="0.2% Proof Stress / Yield Strength", operator="min", value="500", unit="MPa", is_mandatory=True, description="Yield stress minimum 500 MPa"),
            Requirement(tender_id=tender_steel.id, parameter="Elongation at Break", operator="min", value="16.0", unit="%", is_mandatory=True, description="Percentage elongation minimum 16.0%")
        ]

        tender_pipes = Tender(
            tender_no="JJM/UP/2026/PVC-804",
            title="Supply of 50,000 Meters 110mm Class 3 uPVC Pressure Pipes for Rural Water Grid",
            department="Jal Jeevan Mission, Uttar Pradesh",
            category="PVC Pipes",
            budget=24500000.0,
            quantity=50000.0,
            unit="Meters",
            deadline=now + datetime.timedelta(days=19),
            status="Bids Open",
            evaluation_method="L1",
            nit_document_path="/static/sample_nit_pipes.pdf",
            created_at=now - datetime.timedelta(days=2),
            confirmed_at=now - datetime.timedelta(days=1)
        )
        req_pipes = [
            Requirement(tender_id=tender_pipes.id, parameter="BIS Licence IS 4985 Certification", operator="eq", value="VALID", unit="status", is_mandatory=True, description="Active BIS certification under IS 4985:2021"),
            Requirement(tender_id=tender_pipes.id, parameter="Short-Term Hydrostatic Pressure (1h)", operator="min", value="4.19", unit="MPa", is_mandatory=True, description="Pressure resistance at 27 deg C")
        ]

        tender_services = Tender(
            tender_no="NIC/PROJ/2026/QCBS-092",
            title="Cloud Architecture Audit & Security Review Consultancy Services",
            department="National Informatics Centre (NIC)",
            category="Services",
            budget=12000000.0,
            quantity=24.0,
            unit="Consultant Man-Months",
            deadline=now + datetime.timedelta(days=25),
            status="Bids Open",
            evaluation_method="QCBS",
            tech_weight=0.70,
            fin_weight=0.30,
            nit_document_path="/static/sample_nit_services.pdf",
            created_at=now - datetime.timedelta(days=1),
            confirmed_at=now
        )
        req_services = [
            Requirement(tender_id=tender_services.id, parameter="ISO 9001 & 27001 Certification", operator="eq", value="VALID", unit="status", is_mandatory=True, description="Accredited certifications"),
            Requirement(tender_id=tender_services.id, parameter="Annual IT Turnover", operator="min", value="50000000", unit="INR", is_mandatory=True, description="Minimum ₹5.00 Crore turnover")
        ]

        db.add_all([tender_steel, tender_pipes, tender_services])
        db.commit()

        for r in req_steel:
            r.tender_id = tender_steel.id
            db.add(r)
        for r in req_pipes:
            r.tender_id = tender_pipes.id
            db.add(r)
        for r in req_services:
            r.tender_id = tender_services.id
            db.add(r)
        db.commit()

        # 6. Seed Notifications
        notifications = [
            Notification(
                user_id=vendor_user_b.id,
                role="vendor",
                title="Technical Evaluation Completed: Ranked L1",
                message="Your bid for Tender CPWD/ND-II/2026/C-409 has been verified and qualified as L1 (Lowest Compliant Bidder).",
                link="/vendor/applications",
                type="shortlisted",
                is_read=False,
                created_at=now - datetime.timedelta(hours=2)
            ),
            Notification(
                user_id=vendor_user_a.id,
                role="vendor",
                title="Bid Disqualification Notice",
                message="Your bid for Tender CPWD/ND-II/2026/C-409 was disqualified due to expired BIS Licence CM/L-4829103.",
                link="/vendor/applications",
                type="disqualified",
                is_read=False,
                created_at=now - datetime.timedelta(hours=2)
            ),
            Notification(
                user_id=officer.id,
                role="officer",
                title="Evaluation Pipeline Ready for Tender C-409",
                message="All 4 bidder verification checks completed. 1 bid disqualified, 1 red-flagged for collusion.",
                link="/officer/tenders/1",
                type="info",
                is_read=False,
                created_at=now - datetime.timedelta(hours=1)
            )
        ]
        db.add_all(notifications)

        # 7. Seed Clarifications
        clarif = Clarification(
            tender_id=tender_cement.id,
            bid_id=bid_a.id,
            vendor_id=vp_a.id,
            query_text="Dear Vendor, verification on the BIS Manakonline portal indicates that your licence CM/L-4829103 expired on 31-Dec-2025. Please provide an active renewal endorsement copy.",
            response_text="We have applied for renewal under application RN-2026-8910 and are awaiting inspection. Attached acknowledgement receipt.",
            status="Replied",
            created_at=now - datetime.timedelta(days=1),
            replied_at=now - datetime.timedelta(hours=6)
        )
        db.add(clarif)

        # 8. Seed Audit Log entries
        audit_entries = [
            AuditLog(
                actor="System Extractor",
                role="system",
                action="PARSE_NIT",
                target="Tender CPWD/ND-II/2026/C-409",
                details=json.dumps({"fields_extracted": 7, "confidence": 0.94}),
                timestamp=now - datetime.timedelta(days=5)
            ),
            AuditLog(
                actor="Rajesh Sharma",
                role="officer",
                action="CONFIRM_CHECKLIST",
                target="Tender CPWD/ND-II/2026/C-409",
                details=json.dumps({"action": "Approved 6 mandatory parameters for bidding"}),
                timestamp=now - datetime.timedelta(days=4)
            ),
            AuditLog(
                actor="TinyFish Agent",
                role="agent",
                action="VERIFY_BIS_MANAKONLINE",
                target="Vendor A (Shree Ram Cement)",
                details=json.dumps({"licence": "CM/L-4829103", "status": "EXPIRED", "source": "manakonline.in"}),
                timestamp=now - datetime.timedelta(hours=2)
            ),
            AuditLog(
                actor="Compliance Engine",
                role="system",
                action="FRAUD_CHECK_ALT",
                target="Vendor D (Apex Buildtech)",
                details=json.dumps({"flag": "Predatory Pricing (₹290) & Common Director with Vendor A"}),
                timestamp=now - datetime.timedelta(hours=2)
            )
        ]
        db.add_all(audit_entries)
        db.commit()

        print("Database successfully seeded with realistic Indian procurement data!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
