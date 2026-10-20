import datetime
import json
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    role = Column(String(30), nullable=False)  # "officer" | "vendor"
    department = Column(String(150), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    vendor_profile = relationship("VendorProfile", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")


class VendorProfile(Base):
    __tablename__ = "vendor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String(200), nullable=False)
    gstin = Column(String(20), index=True, nullable=False)
    cin = Column(String(30), nullable=True)
    pan = Column(String(15), nullable=False)
    address = Column(Text, nullable=False)
    contact_email = Column(String(150), nullable=False)
    contact_phone = Column(String(30), nullable=False)
    directors = Column(Text, default="[]")  # JSON list of strings
    categories_supplied = Column(Text, default="[]")  # JSON list of category names e.g. ["Cement"]
    annual_turnover = Column(Float, default=0.0)  # In INR
    past_projects = Column(Text, default="[]")  # JSON list of project summaries
    bis_licences = Column(Text, default="[]")  # JSON list of dicts: [{licence_no, is_code, product_name, valid_upto, status}]
    completeness_pct = Column(Integer, default=50)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="vendor_profile")
    bids = relationship("Bid", back_populates="vendor")


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    tender_no = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(300), nullable=False)
    department = Column(String(200), nullable=False)
    category = Column(String(50), index=True, nullable=False)  # Cement, TMT Steel, PVC Pipes, Services
    budget = Column(Float, nullable=False)  # Total estimate INR
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)  # Bags, Metric Tonnes, Meters, Man-Months
    deadline = Column(DateTime, nullable=False)
    status = Column(String(50), default="Draft", index=True)  # Draft, Published, Bids Open, Under Evaluation, Pending Approval, Awarded
    nit_document_path = Column(String(255), nullable=True)
    evaluation_method = Column(String(20), default="L1")  # L1 | QCBS
    tech_weight = Column(Float, default=0.7)
    fin_weight = Column(Float, default=0.3)
    winning_bid_id = Column(Integer, nullable=True)
    approval_notes = Column(Text, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    requirements = relationship("Requirement", back_populates="tender", cascade="all, delete-orphan")
    bids = relationship("Bid", back_populates="tender", cascade="all, delete-orphan")
    clarifications = relationship("Clarification", back_populates="tender", cascade="all, delete-orphan")


class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    parameter = Column(String(200), nullable=False)
    operator = Column(String(20), default="eq")  # min, max, eq, contains, required
    value = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=True)
    is_mandatory = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    confidence_score = Column(Float, default=1.0)  # Extraction confidence 0.0 - 1.0
    low_confidence_flag = Column(Boolean, default=False)

    tender = relationship("Tender", back_populates="requirements")


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendor_profiles.id"), nullable=False)
    price_per_unit = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    delivery_days = Column(Integer, default=14)
    technical_specs = Column(Text, default="{}")  # JSON dictionary of claimed values
    status = Column(String(50), default="Submitted", index=True)  # Submitted, Under Technical Evaluation, Qualified, Disqualified, Awarded, Red Flagged
    rank = Column(String(10), nullable=True)  # L1, L2, L3, etc.
    tech_score = Column(Float, default=0.0)
    fin_score = Column(Float, default=0.0)
    final_qcbs_score = Column(Float, default=0.0)
    disqualification_reasons = Column(Text, default="[]")  # JSON list of strings
    red_flag_reasons = Column(Text, default="[]")  # JSON list of strings
    officer_notes = Column(Text, nullable=True)
    evaluated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tender = relationship("Tender", back_populates="bids")
    vendor = relationship("VendorProfile", back_populates="bids")
    documents = relationship("BidDocument", back_populates="bid", cascade="all, delete-orphan")
    checks = relationship("VerificationCheck", back_populates="bid", cascade="all, delete-orphan")
    clarifications = relationship("Clarification", back_populates="bid")


class BidDocument(Base):
    __tablename__ = "bid_documents"

    id = Column(Integer, primary_key=True, index=True)
    bid_id = Column(Integer, ForeignKey("bids.id"), nullable=False)
    doc_type = Column(String(100), nullable=False)  # BIS Licence, GST Certificate, Test Report, Financial Statement, Manual Proof
    file_path = Column(String(255), nullable=False)
    extracted_json = Column(Text, default="{}")  # JSON extracted fields
    verified_status = Column(String(30), default="Pending")  # Verified, Expired, Not found, Pending
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    bid = relationship("Bid", back_populates="documents")


class VerificationCheck(Base):
    __tablename__ = "verification_checks"

    id = Column(Integer, primary_key=True, index=True)
    bid_id = Column(Integer, ForeignKey("bids.id"), nullable=False)
    check_name = Column(String(150), nullable=False)  # e.g. "BIS IS 269 Licence Verification", "GSTIN Active Status"
    passed = Column(Boolean, default=False)
    verdict = Column(String(30), default="Pending")  # Pass, Fail, Warning, Red Flag
    reason = Column(Text, nullable=False)
    source_name = Column(String(100), nullable=False)  # "BIS Manakonline", "GST Portal", "MCA21", "GeM Price Benchmark"
    source_url = Column(String(255), nullable=True)
    is_live = Column(Boolean, default=False)  # True = live automation, False = cached demo evidence
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)

    bid = relationship("Bid", back_populates="checks")
    evidence_items = relationship("Evidence", back_populates="check", cascade="all, delete-orphan")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    check_id = Column(Integer, ForeignKey("verification_checks.id"), nullable=False)
    screenshot_path = Column(String(255), nullable=False)
    caption = Column(String(255), nullable=True)
    raw_data = Column(Text, default="{}")  # JSON of raw payload returned by agent/source
    captured_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_live = Column(Boolean, default=False)

    check = relationship("VerificationCheck", back_populates="evidence_items")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String(30), nullable=False)  # officer | vendor
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    type = Column(String(50), default="info")  # shortlisted, disqualified, clarification, new_tender, expiring_doc, approved
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class Clarification(Base):
    __tablename__ = "clarifications"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    bid_id = Column(Integer, ForeignKey("bids.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendor_profiles.id"), nullable=False)
    query_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=True)
    attachment_path = Column(String(255), nullable=True)
    status = Column(String(30), default="Draft")  # Draft, Sent, Replied, Closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    replied_at = Column(DateTime, nullable=True)

    tender = relationship("Tender", back_populates="clarifications")
    bid = relationship("Bid", back_populates="clarifications")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    target = Column(String(200), nullable=False)
    details = Column(Text, default="{}")  # JSON payload
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class CategoryRulebook(Base):
    __tablename__ = "category_rulebooks"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), unique=True, nullable=False)
    data = Column(Text, nullable=False)  # JSON representation of the rulebook
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
