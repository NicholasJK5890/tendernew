export interface User {
  id: number;
  name: string;
  email: string;
  role: 'officer' | 'vendor';
  department?: string;
  avatar_url?: string;
  created_at: string;
}

export interface VendorProfile {
  id: number;
  user_id: number;
  company_name: string;
  gstin: string;
  cin?: string;
  pan: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  directors: string[];
  categories_supplied: string[];
  annual_turnover: number;
  past_projects: Array<{ client: string; project: string; value: number; year: string }>;
  bis_licences: Array<{ licence_no: string; is_code: string; product_name: string; valid_upto: string; status: string }>;
  completeness_pct: number;
  updated_at: string;
}

export interface Requirement {
  id?: number;
  tender_id?: number;
  parameter: string;
  operator: 'min' | 'max' | 'eq' | 'contains' | 'required';
  value: string;
  unit?: string;
  is_mandatory: boolean;
  description?: string;
  confidence_score: number;
  low_confidence_flag: boolean;
}

export interface Evidence {
  id: number;
  check_id: number;
  screenshot_path: string;
  caption?: string;
  raw_data: Record<string, any>;
  captured_at: string;
  is_live: boolean;
}

export interface VerificationCheck {
  id: number;
  bid_id: number;
  check_name: string;
  passed: boolean;
  verdict: 'Pass' | 'Fail' | 'Warning' | 'Red Flag';
  reason: string;
  source_name: string;
  source_url?: string;
  is_live: boolean;
  verified_at: string;
  evidence_items: Evidence[];
}

export interface BidDocument {
  id: number;
  bid_id: number;
  doc_type: string;
  file_path: string;
  extracted_json: Record<string, any>;
  verified_status: 'Verified' | 'Expired' | 'Not found' | 'Pending';
  uploaded_at: string;
}

export interface Bid {
  id: number;
  tender_id: number;
  vendor_id: number;
  vendor_name: string;
  vendor_gstin: string;
  price_per_unit: number;
  total_amount: number;
  delivery_days: number;
  technical_specs: Record<string, any>;
  status: 'Submitted' | 'Under Technical Evaluation' | 'Qualified' | 'Disqualified' | 'Awarded' | 'Red Flagged';
  rank?: string;
  tech_score: number;
  fin_score: number;
  final_qcbs_score: number;
  disqualification_reasons: string[];
  red_flag_reasons: string[];
  officer_notes?: string;
  evaluated_at?: string;
  created_at: string;
  checks: VerificationCheck[];
  documents: BidDocument[];
}

export interface Tender {
  id: number;
  tender_no: string;
  title: string;
  department: string;
  category: 'Cement' | 'TMT Steel' | 'PVC Pipes' | 'Services';
  budget: number;
  quantity: number;
  unit: string;
  deadline: string;
  status: 'Draft' | 'Published' | 'Bids Open' | 'Under Evaluation' | 'Pending Approval' | 'Awarded';
  nit_document_path?: string;
  evaluation_method: 'L1' | 'QCBS';
  tech_weight: number;
  fin_weight: number;
  winning_bid_id?: number;
  approval_notes?: string;
  confirmed_at?: string;
  approved_at?: string;
  created_at: string;
  requirements: Requirement[];
  bids_count?: number;
}

export interface TenderMatchResult {
  tender: Tender;
  match_score: number;
  matched_criteria: string[];
  missing_criteria: string[];
  can_apply: boolean;
}

export interface Clarification {
  id: number;
  tender_id: number;
  bid_id: number;
  vendor_id: number;
  vendor_name: string;
  query_text: string;
  response_text?: string;
  attachment_path?: string;
  status: 'Draft' | 'Sent' | 'Replied' | 'Closed';
  created_at: string;
  replied_at?: string;
}

export interface Notification {
  id: number;
  user_id?: number;
  role: 'officer' | 'vendor';
  title: string;
  message: string;
  link?: string;
  type: 'shortlisted' | 'disqualified' | 'clarification' | 'new_tender' | 'expiring_doc' | 'approved' | 'info';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor: string;
  role: string;
  action: string;
  target: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface Rulebook {
  category: string;
  title: string;
  applicable_is_standards: Array<{ code: string; title: string; mandatory: boolean; authority: string }>;
  verification_sources: Array<{ name: string; type: string; url: string; checks: string[] }>;
  standard_parameters: Array<{ parameter: string; operator: string; target_value: any; unit: string; mandatory: boolean; description: string }>;
  benchmark_price_range?: { min: number; max: number; unit: string; suspect_low_threshold: number };
  evaluation_framework?: { method: string; technical_weight: number; financial_weight: number; formula: string };
}
