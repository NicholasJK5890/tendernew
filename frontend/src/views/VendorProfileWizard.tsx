import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileCheck,
  Award,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Save
} from 'lucide-react';
import { VendorProfile } from '../types';
import { api } from '../services/api';

interface VendorProfileWizardProps {
  onProfileUpdated: () => void;
}

export const VendorProfileWizard: React.FC<VendorProfileWizardProps> = ({ onProfileUpdated }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<Partial<VendorProfile>>({
    company_name: '',
    gstin: '',
    cin: '',
    pan: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    directors: [],
    categories_supplied: [],
    annual_turnover: 0,
    past_projects: [],
    bis_licences: [],
    completeness_pct: 50
  });

  const [newDirector, setNewDirector] = useState('');
  const [newProject, setNewProject] = useState({ client: '', project: '', value: 10000000, year: '2025' });
  const [newLicence, setNewLicence] = useState({ licence_no: '', is_code: 'IS 269:2015', product_name: 'Ordinary Portland Cement', valid_upto: '2028-03-31', status: 'Valid' });

  useEffect(() => {
    api.getVendorProfile().then((p) => {
      setFormData(p);
      setLoading(false);
    }).catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateVendorProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onProfileUpdated();
    } catch (e) {
      console.error("Failed to save profile:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategory = (cat: string) => {
    const cats = formData.categories_supplied || [];
    if (cats.includes(cat)) {
      setFormData({ ...formData, categories_supplied: cats.filter(c => c !== cat) });
    } else {
      setFormData({ ...formData, categories_supplied: [...cats, cat] });
    }
  };

  const handleAddDirector = () => {
    if (!newDirector.trim()) return;
    setFormData({
      ...formData,
      directors: [...(formData.directors || []), newDirector.trim()]
    });
    setNewDirector('');
  };

  const handleRemoveDirector = (index: number) => {
    setFormData({
      ...formData,
      directors: (formData.directors || []).filter((_, i) => i !== index)
    });
  };

  const handleAddProject = () => {
    if (!newProject.project.trim()) return;
    setFormData({
      ...formData,
      past_projects: [...(formData.past_projects || []), { ...newProject }]
    });
    setNewProject({ client: '', project: '', value: 10000000, year: '2025' });
  };

  const handleRemoveProject = (index: number) => {
    setFormData({
      ...formData,
      past_projects: (formData.past_projects || []).filter((_, i) => i !== index)
    });
  };

  const handleAddLicence = () => {
    if (!newLicence.licence_no.trim()) return;
    setFormData({
      ...formData,
      bis_licences: [...(formData.bis_licences || []), { ...newLicence }]
    });
    setNewLicence({ licence_no: '', is_code: 'IS 269:2015', product_name: 'Ordinary Portland Cement', valid_upto: '2028-03-31', status: 'Valid' });
  };

  const handleRemoveLicence = (index: number) => {
    setFormData({
      ...formData,
      bis_licences: (formData.bis_licences || []).filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading vendor profile builder...</div>;
  }

  const steps = [
    { number: 1, title: 'Company & Statutory IDs', icon: Building2 },
    { number: 2, title: 'Categories & Turnover', icon: Layers },
    { number: 3, title: 'Past Track Record', icon: FileCheck },
    { number: 4, title: 'BIS Certification', icon: Award }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vendor Profile Builder Wizard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete your vendor profile to unlock automatic tender eligibility scoring and instant pre-checks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Completeness Pill */}
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#7C6BC4]" />
            <span className="text-xs font-bold text-[#7C6BC4]">
              {formData.completeness_pct}% Completeness
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#7C6BC4] hover:bg-[#6957B7] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Progress'}
          </button>
        </div>
      </div>

      {/* Stepper Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.number;
          const isDone = currentStep > s.number;

          return (
            <button
              key={s.number}
              onClick={() => setCurrentStep(s.number)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-white border-[#7C6BC4] shadow-xs ring-1 ring-[#7C6BC4]'
                  : isDone
                  ? 'bg-purple-50/40 border-purple-100 text-slate-700'
                  : 'bg-white border-slate-100 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-[#7C6BC4] text-white' : isDone ? 'bg-purple-200 text-[#7C6BC4]' : 'bg-slate-100 text-slate-500'
                }`}>
                  STEP {s.number}
                </span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[#7C6BC4]" />}
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7C6BC4]' : 'text-slate-400'}`} />
                <span className="truncate">{s.title}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP 1: COMPANY & STATUTORY IDS */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Company Master Data & Statutory Registrations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Legal Company / Entity Name *</label>
              <input
                type="text"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold"
                placeholder="e.g. Ultracem Infra Solutions Pvt Ltd"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">GSTIN (15 Digits) *</label>
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-slate-800 uppercase"
                placeholder="07AABCU9603R1ZM"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company PAN *</label>
              <input
                type="text"
                value={formData.pan || ''}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-slate-800 uppercase"
                placeholder="AABCU9603R"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">CIN / MCA Number</label>
              <input
                type="text"
                value={formData.cin || ''}
                onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-slate-800 uppercase"
                placeholder="U26940HR2016PTC063291"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Registered Physical Address *</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800"
                placeholder="Sector 18, Industrial Hub, Gurugram, Haryana - 122015"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Procurement Contact Email *</label>
              <input
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800"
                placeholder="govbids@ultraceminfra.com"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contact Phone *</label>
              <input
                type="text"
                value={formData.contact_phone || ''}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800"
                placeholder="+91 124 4921000"
              />
            </div>
          </div>

          {/* Directors List */}
          <div className="pt-2">
            <label className="font-semibold text-slate-700 block mb-1 text-xs">Directors / Key Executives</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newDirector}
                onChange={(e) => setNewDirector(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="text-xs p-2 rounded-xl border border-slate-200 flex-1"
              />
              <button
                type="button"
                onClick={handleAddDirector}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                + Add Director
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.directors?.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-800 font-medium">
                  {d}
                  <button onClick={() => handleRemoveDirector(i)} className="text-slate-400 hover:text-rose-600">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CATEGORIES & TURNOVER */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-5">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Product Categories Supplied & Financial Turnover
          </h3>

          <div>
            <label className="font-semibold text-slate-700 block mb-2 text-xs">Categories Supplied</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Cement', 'TMT Steel', 'PVC Pipes', 'Services'].map((cat) => {
                const isSelected = formData.categories_supplied?.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-[#7C6BC4] bg-purple-50 text-[#7C6BC4] font-bold shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="text-sm">{cat}</div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {isSelected ? '✓ Selected' : '+ Add'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs">
            <label className="font-semibold text-slate-700 block mb-1">
              Average Annual Financial Turnover (Past 3 Fiscal Years in INR) *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={formData.annual_turnover || 0}
                onChange={(e) => setFormData({ ...formData, annual_turnover: parseFloat(e.target.value) || 0 })}
                className="w-64 p-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold"
              />
              <span className="text-xs font-bold text-[#7C6BC4]">
                = ₹{((formData.annual_turnover || 0) / 10000000).toFixed(2)} Crore
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Used to deterministically evaluate minimum turnover thresholds for major public works tenders.
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: PAST TRACK RECORD */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Past Government & PSU Experience
          </h3>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="font-semibold text-slate-800">Add Completed Government Contract</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Client (e.g. NHAI)"
                value={newProject.client}
                onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                className="p-2 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="text"
                placeholder="Project Description"
                value={newProject.project}
                onChange={(e) => setNewProject({ ...newProject, project: e.target.value })}
                className="p-2 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="number"
                placeholder="Value INR"
                value={newProject.value}
                onChange={(e) => setNewProject({ ...newProject, value: parseFloat(e.target.value) || 0 })}
                className="p-2 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="text"
                placeholder="Year (e.g. 2025)"
                value={newProject.year}
                onChange={(e) => setNewProject({ ...newProject, year: e.target.value })}
                className="p-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddProject}
              className="px-3 py-1.5 bg-[#7C6BC4] text-white rounded-lg font-semibold hover:bg-[#6957B7]"
            >
              + Add Experience Record
            </button>
          </div>

          <div className="space-y-2">
            {formData.past_projects?.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{p.client} — {p.project}</div>
                  <div className="text-slate-500 text-[11px]">Value: ₹{(p.value / 10000000).toFixed(2)} Cr | Completed: {p.year}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProject(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: BIS CERTIFICATION */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Bureau of Indian Standards (BIS) CM/L Licences
          </h3>

          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3 text-xs">
            <div className="font-semibold text-purple-900">Add Product BIS Licence Record</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="CM/L Licence No (e.g. CM/L-7182934)"
                value={newLicence.licence_no}
                onChange={(e) => setNewLicence({ ...newLicence, licence_no: e.target.value })}
                className="p-2 rounded-lg border border-slate-200 bg-white font-mono"
              />
              <select
                value={newLicence.is_code}
                onChange={(e) => setNewLicence({ ...newLicence, is_code: e.target.value })}
                className="p-2 rounded-lg border border-slate-200 bg-white font-semibold"
              >
                <option value="IS 269:2015">IS 269:2015 (Cement)</option>
                <option value="IS 1786:2008">IS 1786:2008 (TMT Steel)</option>
                <option value="IS 4985:2021">IS 4985:2021 (PVC Pipes)</option>
                <option value="ISO 9001:2015">ISO 9001:2015 (Services)</option>
              </select>
              <input
                type="date"
                value={newLicence.valid_upto}
                onChange={(e) => setNewLicence({ ...newLicence, valid_upto: e.target.value })}
                className="p-2 rounded-lg border border-slate-200 bg-white"
              />
              <select
                value={newLicence.status}
                onChange={(e) => setNewLicence({ ...newLicence, status: e.target.value })}
                className="p-2 rounded-lg border border-slate-200 bg-white font-bold"
              >
                <option value="Valid">Valid / Operative</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddLicence}
              className="px-3 py-1.5 bg-[#7C6BC4] text-white rounded-lg font-semibold hover:bg-[#6957B7]"
            >
              + Add Licence
            </button>
          </div>

          <div className="space-y-2">
            {formData.bis_licences?.map((l, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{l.licence_no}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#7C6BC4]">
                      {l.is_code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      l.status === 'Valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Valid up to: {l.valid_upto} | Product: {l.product_name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLicence(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stepper Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(currentStep - 1)}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Previous Step
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            className="px-5 py-2 bg-[#7C6BC4] hover:bg-[#6957B7] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
          >
            Next Step
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete Profile & Save
          </button>
        )}
      </div>
    </div>
  );
};
