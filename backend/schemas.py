import datetime
import json
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

# User
class UserBase(BaseModel):
    name: str
    email: str
    role: str
    department: Optional[str] = None
    avatar_url: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# Vendor Profile
class VendorProfileBase(BaseModel):
    company_name: str
    gstin: str
    cin: Optional[str] = None
    pan: str
    address: str
    contact_email: str
    contact_phone: str
    directors: List[str] = []
    categories_supplied: List[str] = []
    annual_turnover: float = 0.0
    past_projects: List[Dict[str, Any]] = []
    bis_licences: List[Dict[str, Any]] = []

class VendorProfileCreate(VendorProfileBase):
    user_id: int

class VendorProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    gstin: Optional[str] = None
    cin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    directors: Optional[List[str]] = None
    categories_supplied: Optional[List[str]] = None
    annual_turnover: Optional[float] = None
    past_projects: Optional[List[Dict[str, Any]]] = None
    bis_licences: Optional[List[Dict[str, Any]]] = None

class VendorProfileOut(VendorProfileBase):
    id: int
    user_id: int
    completeness_pct: int
    updated_at: datetime.datetime
    class Config:
        from_attributes = True

# Requirements
class RequirementBase(BaseModel):
    parameter: str
    operator: str = "eq"  # min, max, eq, contains, required
    value: str
    unit: Optional[str] = None
    is_mandatory: bool = True
    description: Optional[str] = None
    confidence_score: float = 1.0
    low_confidence_flag: bool = False

class RequirementCreate(RequirementBase):
    pass

class RequirementOut(RequirementBase):
    id: int
    tender_id: int
    class Config:
        from_attributes = True

# Tender
class TenderBase(BaseModel):
    tender_no: str
    title: str
    department: str
    category: str
    budget: float
    quantity: float
    unit: str
    deadline: datetime.datetime
    evaluation_method: str = "L1"
    tech_weight: float = 0.7
    fin_weight: float = 0.3

class TenderCreate(TenderBase):
    requirements: List[RequirementCreate] = []

class TenderOut(TenderBase):
    id: int
    status: str
    nit_document_path: Optional[str] = None
    winning_bid_id: Optional[int] = None
    approval_notes: Optional[str] = None
    confirmed_at: Optional[datetime.datetime] = None
    approved_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    requirements: List[RequirementOut] = []
    bids_count: Optional[int] = 0
    class Config:
        from_attributes = True

# Evidence & Verification Checks
class EvidenceOut(BaseModel):
    id: int
    check_id: int
    screenshot_path: str
    caption: Optional[str] = None
    raw_data: Dict[str, Any] = {}
    captured_at: datetime.datetime
    is_live: bool = False

    # raw_data is persisted as a JSON string in the DB; parse it on the way out.
    @field_validator("raw_data", mode="before")
    @classmethod
    def _parse_raw_data(cls, v):
        if v is None or v == "":
            return {}
        if isinstance(v, (str, bytes)):
            try:
                parsed = json.loads(v)
            except (ValueError, TypeError):
                return {}
            return parsed if isinstance(parsed, dict) else {"value": parsed}
        return v

    class Config:
        from_attributes = True

class VerificationCheckOut(BaseModel):
    id: int
    bid_id: int
    check_name: str
    passed: bool
    verdict: str
    reason: str
    source_name: str
    source_url: Optional[str] = None
    is_live: bool = False
    verified_at: datetime.datetime
    evidence_items: List[EvidenceOut] = []
    class Config:
        from_attributes = True

# Bid Document
class BidDocumentOut(BaseModel):
    id: int
    bid_id: int
    doc_type: str
    file_path: str
    extracted_json: Dict[str, Any] = {}
    verified_status: str
    uploaded_at: datetime.datetime
    class Config:
        from_attributes = True

# Bid
class BidCreate(BaseModel):
    tender_id: int
    vendor_id: int
    price_per_unit: float
    delivery_days: int = 14
    technical_specs: Dict[str, Any] = {}

class BidOut(BaseModel):
    id: int
    tender_id: int
    vendor_id: int
    vendor_name: Optional[str] = None
    vendor_gstin: Optional[str] = None
    price_per_unit: float
    total_amount: float
    delivery_days: int
    technical_specs: Dict[str, Any] = {}
    status: str
    rank: Optional[str] = None
    tech_score: float = 0.0
    fin_score: float = 0.0
    final_qcbs_score: float = 0.0
    disqualification_reasons: List[str] = []
    red_flag_reasons: List[str] = []
    officer_notes: Optional[str] = None
    evaluated_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    checks: List[VerificationCheckOut] = []
    documents: List[BidDocumentOut] = []
    class Config:
        from_attributes = True

# Match result for Vendor
class TenderMatchResult(BaseModel):
    tender: TenderOut
    match_score: int  # 0 to 100
    matched_criteria: List[str]
    missing_criteria: List[str]
    can_apply: bool

# Clarification
class ClarificationCreate(BaseModel):
    tender_id: int
    bid_id: int
    vendor_id: int
    query_text: str

class ClarificationReply(BaseModel):
    response_text: str

class ClarificationOut(BaseModel):
    id: int
    tender_id: int
    bid_id: int
    vendor_id: int
    vendor_name: Optional[str] = None
    query_text: str
    response_text: Optional[str] = None
    attachment_path: Optional[str] = None
    status: str
    created_at: datetime.datetime
    replied_at: Optional[datetime.datetime] = None
    class Config:
        from_attributes = True

# Notification
class NotificationOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    role: str
    title: str
    message: str
    link: Optional[str] = None
    type: str
    is_read: bool
    created_at: datetime.datetime
    class Config:
        from_attributes = True

# Audit Log
class AuditLogOut(BaseModel):
    id: int
    actor: str
    role: str
    action: str
    target: str
    details: Dict[str, Any] = {}
    timestamp: datetime.datetime
    class Config:
        from_attributes = True

# Tender Approval Request
class TenderApprovalRequest(BaseModel):
    override_reason: Optional[str] = None
    notes: Optional[str] = None
