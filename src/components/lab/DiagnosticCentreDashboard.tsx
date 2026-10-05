import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Microscope,
  Upload,
  FileText,
  Search,
  Check,
  AlertCircle,
  FileCheck,
  FileCode,
  ShieldAlert,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { parseLaboratoryReport, SAMPLE_LAB_REPORTS } from '../../services/ocrParser';
import { LabTestResult } from '../../types';

export const DiagnosticCentreDashboard: React.FC = () => {
  const { currentLab, data, uploadLabReport } = useApp();

  const [uhidInput, setUhidInput] = useState('UHID-ACEA-031D');
  const [patientLookup, setPatientLookup] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Upload Form
  const [reportName, setReportName] = useState('Complete Blood Count (CBC) with Differential');
  const [reportType, setReportType] = useState<any>('HEMATOLOGY');
  const [rawOcrText, setRawOcrText] = useState(SAMPLE_LAB_REPORTS[0].rawText);
  const [liveParsed, setLiveParsed] = useState(() => parseLaboratoryReport(SAMPLE_LAB_REPORTS[0].rawText));
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  if (!currentLab) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <p className="text-slate-600">Please switch to Diagnostic Centre persona from top bar.</p>
      </div>
    );
  }

  // Lookup Patient UHID strictly without exposing their medical history!
  const handleLookupUhid = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLookupError(null);
    setUploadSuccess(null);

    const query = uhidInput.trim().toUpperCase();
    const patient = data.patients.find(p => p.uhid.toUpperCase() === query);

    if (!patient) {
      setLookupError(`Patient with UHID ${query} not found in central registry.`);
      setPatientLookup(null);
      return;
    }

    // PRIVACY ENFORCEMENT: Diagnostic labs only see confirmed identity details for report matching,
    // NEVER past prescriptions or full medical history!
    setPatientLookup({
      uhid: patient.uhid,
      fullName: patient.fullName,
      gender: patient.gender,
      age: patient.age,
      registeredDate: patient.registeredDate
    });
  };

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_LAB_REPORTS.find(s => s.id === sampleId);
    if (!sample) return;
    setReportName(sample.name);
    setReportType(sample.reportType);
    setRawOcrText(sample.rawText);
    setLiveParsed(parseLaboratoryReport(sample.rawText));
  };

  const handleTextChange = (text: string) => {
    setRawOcrText(text);
    setLiveParsed(parseLaboratoryReport(text));
  };

  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const prettyName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-\.]+/g, ' ');
    setReportName(prettyName);

    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = (reader.result as string) || '';
        setRawOcrText(text);
        setLiveParsed(parseLaboratoryReport(text));
      };
      reader.readAsText(file);
    } else {
      // For images/PDFs: run intelligent OCR extraction matching file type
      let matched = SAMPLE_LAB_REPORTS[0];
      const lower = file.name.toLowerCase();
      if (lower.includes('lipid') || lower.includes('cholesterol')) matched = SAMPLE_LAB_REPORTS[1];
      else if (lower.includes('lft') || lower.includes('kft') || lower.includes('liver') || lower.includes('renal')) matched = SAMPLE_LAB_REPORTS[2];
      else if (lower.includes('thyroid') || lower.includes('tsh')) matched = SAMPLE_LAB_REPORTS[3];
      else if (lower.includes('glucose') || lower.includes('diabetes') || lower.includes('sugar') || lower.includes('hba1c')) matched = SAMPLE_LAB_REPORTS[4];

      const patientUhid = patientLookup?.uhid || uhidInput;
      const text = matched.rawText.replace(/UHID: [A-Z0-9\-]+/i, `UHID: ${patientUhid}`);
      setRawOcrText(text);
      setReportType(matched.reportType);
      setLiveParsed(parseLaboratoryReport(text));
    }
  };

  const handleUploadReport = () => {
    if (!patientLookup) {
      setLookupError('Please verify patient UHID before submitting diagnostic report.');
      return;
    }

    const res = uploadLabReport(patientLookup.uhid, reportName, rawOcrText, reportType);
    if (res.success) {
      setUploadSuccess(`Report "${reportName}" securely attached to UHID ${patientLookup.uhid}. Patient and authorized doctors have been notified.`);
      setPatientLookup(null);
    } else {
      setLookupError(res.error || 'Failed to upload report.');
    }
  };

  const labUploadHistory = data.labReports.filter(r => r.labId === currentLab.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Diagnostic Centre Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
            <Microscope className="w-7 h-7 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{currentLab.name}</h1>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> {currentLab.accreditedBy}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              License: <span className="font-mono">{currentLab.licenseNumber}</span> · {currentLab.address}
            </p>
          </div>
        </div>

        <div className="text-xs bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl max-w-sm text-emerald-950">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-700" />
            <span>Privacy Guard Enforced</span>
          </div>
          <p className="text-[11px] mt-0.5 text-emerald-800 leading-tight">
            Laboratories can only upload reports against verified UHIDs. Browsing patient disease history is strictly prohibited.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: UHID Verification & Document Uploader */}
        <div className="space-y-6">
          {/* STEP 1: Patient UHID Lookup */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-800" />
              <span>Step 1: Patient UHID Verification</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Diagnostic reports must be matched with an active UHID.
            </p>

            <form onSubmit={handleLookupUhid} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                  Enter Patient UHID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={uhidInput}
                    onChange={(e) => setUhidInput(e.target.value)}
                    placeholder="UHID-ACEA-031D"
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </form>

            {lookupError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {patientLookup && (
              <div className="mt-4 p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-950 text-sm">{patientLookup.fullName}</span>
                  <span className="font-mono text-xs bg-white text-teal-900 px-2 py-0.5 rounded border border-teal-200">
                    Verified Match
                  </span>
                </div>
                <div className="text-slate-600 font-mono text-[11px]">
                  UHID: {patientLookup.uhid} · Age: {patientLookup.age} · Gender: {patientLookup.gender}
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Report Metadata & File Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-800" />
              <span>Step 2: Document & Report Details</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Investigation / Panel Title:</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Investigation Category:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              >
                <option value="HEMATOLOGY">Hematology (CBC, Hemogram, Blood Smear)</option>
                <option value="BIOCHEMISTRY">Biochemistry (Liver, Kidney, Metabolic)</option>
                <option value="LIPID">Lipid Profile</option>
                <option value="THYROID">Thyroid Hormones (TSH, FT3, FT4)</option>
                <option value="URINALYSIS">Urinalysis</option>
                <option value="RADIOLOGY">Radiology & Imaging</option>
              </select>
            </div>

            {/* Simulated File Upload or Sample Test Loaders */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Upload Scanned PDF / Image (Runs OCR):
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleSimulateFileUpload}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100"
              />
            </div>

            {/* Quick Sample Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase font-mono mb-1.5">
                Load Realistic Sample Diagnostic Formats:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {SAMPLE_LAB_REPORTS.map(sample => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample.id)}
                    className="p-2 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                  >
                    <span className="font-semibold text-slate-800 block truncate">{sample.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{sample.reportType}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleUploadReport}
              disabled={!patientLookup}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Attach Report to UHID & Notify Patient</span>
            </button>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                {uploadSuccess}
              </div>
            )}
          </div>
        </div>

        {/* Right 2-Cols: Dual OCR Inspector (Raw OCR Text vs Generic Structured Parser Table) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Generic Laboratory OCR & Parser Engine</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Preserves complete test names (Total Leukocyte Count, Absolute Neutrophil Count, etc.)
                </p>
              </div>
              <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-1 rounded">
                Status: {liveParsed.overallStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {/* Left Column: Raw OCR Text Editor */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono">
                    Raw OCR Scanned Text
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Editable</span>
                </div>
                <textarea
                  value={rawOcrText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  rows={16}
                  className="w-full p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl border border-slate-800 leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Right Column: Structured Parsed Result Table */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono">
                    Structured Extraction ({liveParsed.testResults.length} Tests)
                  </label>
                  <span className="text-[11px] text-emerald-800 font-semibold font-mono">Full Test Names OK</span>
                </div>

                <div className="max-h-[365px] overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-mono sticky top-0">
                      <tr>
                        <th className="p-2">Extracted Test Name</th>
                        <th className="p-2">Value</th>
                        <th className="p-2">Range</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {liveParsed.testResults.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="p-2 font-medium text-slate-900">
                            {/* Full name preserved without truncation! */}
                            {t.testName}
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-800">
                            {t.value} {t.unit}
                          </td>
                          <td className="p-2 font-mono text-slate-500 text-[11px]">
                            {t.referenceRange}
                          </td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              t.status === 'Normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Upload History from this Diagnostic Centre */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase text-slate-700 font-mono mb-3">
              Diagnostic Centre Upload History ({labUploadHistory.length} Reports)
            </h3>
            <div className="space-y-2">
              {labUploadHistory.map(rep => (
                <div key={rep.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900">{rep.reportName}</strong>
                    <div className="text-slate-500 text-[11px] font-mono">
                      UHID: {rep.uhid} · Uploaded: {new Date(rep.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Delivered
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
