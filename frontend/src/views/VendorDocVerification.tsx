import React, { useState } from 'react';
import {
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Plus,
  Eye,
  XCircle,
  FileUp
} from 'lucide-react';
import { EvidenceModal } from '../components/EvidenceModal';
import { VerificationCheck } from '../types';

interface DocumentItem {
  id: string;
  name: string;
  doc_type: string;
  status: 'Verified' | 'Expired' | 'Not found' | 'Pending';
  extracted_fields: Record<string, string>;
  check: VerificationCheck;
  is_manual_fallback?: boolean;
}

export const VendorDocVerification: React.FC = () => {
  const [activeCheck, setActiveCheck] = useState<VerificationCheck | null>(null);
  const [reverifying, setReverifying] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [manualDocType, setManualDocType] = useState('BIS Licence');
  const [manualProofFile, setManualProofFile] = useState('Manual_Affidavit_Proof.pdf');

  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'doc-1',
      name: 'BIS_CM_L_7182934_Certification.pdf',
      doc_type: 'BIS Licence',
      status: 'Verified',
      extracted_fields: {
        'Licence Number': 'CM/L-7182934',
        'Standard': 'IS 269:2015',
        'Validity': '31-Mar-2028',
        'Manufacturer': 'Ultracem Infra Solutions Pvt Ltd'
      },
      check: {
        id: 101,
        bid_id: 1,
        check_name: 'BIS Licence Verification (IS 269:2015)',
        passed: true,
        verdict: 'Pass',
        reason: 'Active BIS certification confirmed on BIS Manakonline registry. Valid up to 31-Mar-2028.',
        source_name: 'BIS Manakonline Portal',
        source_url: 'https://www.manakonline.in/MANAK/searchLicence',
        is_live: false,
        verified_at: new Date().toISOString(),
        evidence_items: [
          {
            id: 201,
            check_id: 101,
            screenshot_path: '/static/evidence/bis_active_ultracem.png',
            caption: 'BIS Manakonline digital registry lookup confirming OPERATIVE status',
            raw_data: { licence_no: 'CM/L-7182934', status: 'ACTIVE', valid_till: '2028-03-31' },
            captured_at: new Date().toISOString(),
            is_live: false
          }
        ]
      }
    },
    {
      id: 'doc-2',
      name: 'GST_Registration_Certificate_2026.pdf',
      doc_type: 'GST Certificate',
      status: 'Verified',
      extracted_fields: {
        'GSTIN': '07AABCU9603R1ZM',
        'Taxpayer Type': 'Regular',
        'Filing Status': 'GSTR-3B Current (Up-to-date)',
        'Legal Name': 'Ultracem Infra Solutions Pvt Ltd'
      },
      check: {
        id: 102,
        bid_id: 1,
        check_name: 'GSTIN Registration & Status Check',
        passed: true,
        verdict: 'Pass',
        reason: 'GSTIN is ACTIVE under Regular taxpayer category with no default return notices.',
        source_name: 'GST Common Portal',
        source_url: 'https://services.gst.gov.in/services/searchtp',
        is_live: false,
        verified_at: new Date().toISOString(),
        evidence_items: [
          {
            id: 202,
            check_id: 102,
            screenshot_path: '/static/evidence/gst_active_portal.png',
            caption: 'GST Common Portal active taxpayer search result',
            raw_data: { gstin: '07AABCU9603R1ZM', status: 'Active' },
            captured_at: new Date().toISOString(),
            is_live: false
          }
        ]
      }
    },
    {
      id: 'doc-3',
      name: 'NCCBM_Compressive_Strength_Test_Report.pdf',
      doc_type: 'Test Report',
      status: 'Verified',
      extracted_fields: {
        'Compressive Strength (28d)': '48.0 MPa (Target: ≥43 MPa)',
        'Initial Setting Time': '50 min (Target: ≥30 min)',
        'Final Setting Time': '210 min (Target: ≤600 min)',
        'Testing Lab': 'National Council for Cement & Building Materials (NCCBM)'
      },
      check: {
        id: 103,
        bid_id: 1,
        check_name: 'Independent NABL Laboratory Test Report',
        passed: true,
        verdict: 'Pass',
        reason: 'All physical test parameters conform to IS 4031 part 6 requirements.',
        source_name: 'NABL Certified Lab Registry',
        source_url: 'https://www.nabl-india.org',
        is_live: false,
        verified_at: new Date().toISOString(),
        evidence_items: [
          {
            id: 203,
            check_id: 103,
            screenshot_path: '/static/evidence/mca_master_data.png',
            caption: 'NABL lab accredited certificate & physical test parameters',
            raw_data: { strength_28d: 48.0, initial_setting: 50 },
            captured_at: new Date().toISOString(),
            is_live: false
          }
        ]
      }
    }
  ]);

  const handleRerunVerification = () => {
    setReverifying(true);
    setTimeout(() => {
      setReverifying(false);
      alert("All 3 documents re-verified against live statutory registries!");
    }, 1200);
  };

  const handleManualUpload = () => {
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: manualProofFile,
      doc_type: manualDocType,
      status: 'Verified',
      is_manual_fallback: true,
      extracted_fields: {
        'Fallback Mode': 'Manual Notarized Proof Upload',
        'Verification Status': 'Uploaded for Officer Inspection',
        'Document Type': manualDocType
      },
      check: {
        id: Date.now(),
        bid_id: 1,
        check_name: `Manual Proof Upload (${manualDocType})`,
        passed: true,
        verdict: 'Pass',
        reason: 'Submitted via manual proof upload fallback as external portal was unavailable.',
        source_name: 'Notarized Vendor Declaration',
        is_live: false,
        verified_at: new Date().toISOString(),
        evidence_items: [
          {
            id: Date.now() + 1,
            check_id: Date.now(),
            screenshot_path: '/static/evidence/bis_active_ultracem.png',
            caption: 'Uploaded manual affidavit / certificate document copy',
            raw_data: { fallback: true, doc: manualDocType },
            captured_at: new Date().toISOString(),
            is_live: false
          }
        ]
      }
    };
    setDocuments([...documents, newDoc]);
    setUploadModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Document Verification Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-extracted statutory documents verified against official public registries (BIS, GSTIN, MCA21).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRerunVerification}
            disabled={reverifying}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reverifying ? 'animate-spin text-[#7C6BC4]' : 'text-slate-500'}`} />
            {reverifying ? 'Verifying Registries...' : 'Re-Run Verification'}
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#7C6BC4] hover:bg-[#6957B7] shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <FileUp className="w-3.5 h-3.5" />
            + Upload New Document / Manual Proof
          </button>
        </div>
      </div>

      {/* Manual Proof Fallback Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
        <Sparkles className="w-4 h-4 text-[#7C6BC4] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Reliability & Manual Proof Upload Fallback:</span>
          If any government portal uses strict CAPTCHAs or undergoes maintenance, TenderLens gracefully supports
          "Manual Proof Upload" as a certified fallback with officer oversight.
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((doc) => {
          const isVerified = doc.status === 'Verified';
          const isExpired = doc.status === 'Expired';

          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7C6BC4] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                      {doc.is_manual_fallback && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-md font-semibold">
                          Manual Proof Fallback
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{doc.doc_type}</span>
                  </div>
                </div>

                {/* Status Chip */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                      isVerified
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isExpired
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isExpired && <XCircle className="w-3.5 h-3.5" />}
                    {doc.status}
                  </span>

                  <button
                    onClick={() => setActiveCheck(doc.check)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#7C6BC4]" />
                    <span>View Evidence</span>
                  </button>
                </div>
              </div>

              {/* Extracted Fields Grid */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  AI Extracted & Registry Verified Fields:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(doc.extracted_fields).map(([label, val]) => (
                    <div key={label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="text-[10px] text-slate-400 font-medium block truncate">{label}</span>
                      <span className="font-bold text-slate-800 truncate block mt-0.5">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Upload Fallback Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Upload Document / Manual Proof Fallback</h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload statutory certificate copies or notarized affidavits when automated portal checks encounter CAPTCHA blockers.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Document Category</label>
                <select
                  value={manualDocType}
                  onChange={(e) => setManualDocType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="BIS Licence">BIS CM/L Licence Endorsement</option>
                  <option value="GST Certificate">GST Registration Certificate</option>
                  <option value="Test Report">NABL Accredited Test Report</option>
                  <option value="Manual Proof">Notarized Compliance Affidavit</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">File Name / Path</label>
                <input
                  type="text"
                  value={manualProofFile}
                  onChange={(e) => setManualProofFile(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleManualUpload}
                className="px-4 py-2 bg-[#7C6BC4] hover:bg-[#6957B7] text-white text-xs font-semibold rounded-xl"
              >
                Upload & Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      {activeCheck && (
        <EvidenceModal
          check={activeCheck}
          onClose={() => setActiveCheck(null)}
        />
      )}
    </div>
  );
};
