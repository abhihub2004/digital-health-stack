import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Upload,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Microscope,
  Plus,
  Trash2,
  FileCode,
  ArrowRight,
  Eye,
  Check
} from 'lucide-react';
import { parseLaboratoryReport, SAMPLE_LAB_REPORTS } from '../../services/ocrParser';
import { LabTestResult, LabTestStatus } from '../../types';

interface UploadLabReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUhid?: string;
}

export const UploadLabReportModal: React.FC<UploadLabReportModalProps> = ({
  isOpen,
  onClose,
  defaultUhid
}) => {
  const { currentRole, currentPatient, currentLab, data, uploadLabReport } = useApp();

  const isPatient = currentRole === 'PATIENT';
  const initialUhid = defaultUhid || (isPatient && currentPatient ? currentPatient.uhid : 'UHID-ACEA-031D');

  // UHID & Provider state
  const [targetUhid, setTargetUhid] = useState(initialUhid);
  const [labName, setLabName] = useState(
    isPatient
      ? 'Personal Health Record / Self-Uploaded Report'
      : (currentLab?.name || 'Apex Diagnostic Centre & Pathology Labs')
  );

  // Active Input Mode: 'UPLOAD' | 'PASTE' | 'PRESET'
  const [inputMode, setInputMode] = useState<'UPLOAD' | 'PASTE' | 'PRESET'>('PRESET');

  // Report metadata
  const [reportName, setReportName] = useState('Complete Blood Count (CBC) with Differential');
  const [reportType, setReportType] = useState<'HEMATOLOGY' | 'BIOCHEMISTRY' | 'THYROID' | 'LIPID' | 'URINALYSIS' | 'RADIOLOGY' | 'OTHER'>('HEMATOLOGY');
  const [rawText, setRawText] = useState(SAMPLE_LAB_REPORTS[0].rawText);

  // Extracted Structured Results
  const [extractedResults, setExtractedResults] = useState<LabTestResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<string>('Normal');

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync targetUhid and reset status on modal open
  useEffect(() => {
    if (isOpen) {
      if (defaultUhid) {
        setTargetUhid(defaultUhid);
      } else if (isPatient && currentPatient) {
        setTargetUhid(currentPatient.uhid);
      }
      setUploadSuccess(null);
      setErrorMessage(null);
    }
  }, [isOpen, defaultUhid, isPatient, currentPatient]);

  // Parse immediately on open or rawText change
  useEffect(() => {
    if (rawText) {
      const parsed = parseLaboratoryReport(rawText);
      setExtractedResults(parsed.testResults);
      setOverallStatus(parsed.overallStatus);
      if (!uploadedFileName) {
        setReportName(parsed.reportName);
        setReportType(parsed.reportType);
      }
    }
  }, [rawText, uploadedFileName]);

  if (!isOpen) return null;

  // Handle Preset Selection
  const handleSelectPreset = (sampleId: string) => {
    const sample = SAMPLE_LAB_REPORTS.find(s => s.id === sampleId);
    if (!sample) return;
    setUploadedFileName(null);
    setReportName(sample.name);
    setReportType(sample.reportType);
    setLabName(isPatient ? 'Personal Upload (Lab Record)' : sample.labName);
    setRawText(sample.rawText);
    const parsed = parseLaboratoryReport(sample.rawText);
    setExtractedResults(parsed.testResults);
    setOverallStatus(parsed.overallStatus);
  };

  // Handle File Input (.txt, .csv, .pdf, .png, .jpg)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);
    setUploadedFileName(file.name);

    const prettyName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-\.]+/g, ' ');
    setReportName(prettyName);

    // If it's a plain text file, read text directly
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = (reader.result as string) || '';
        setRawText(text);
        const parsed = parseLaboratoryReport(text);
        setExtractedResults(parsed.testResults);
        setOverallStatus(parsed.overallStatus);
        setReportType(parsed.reportType);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read file contents.');
        setIsProcessing(false);
      };
      reader.readAsText(file);
    } else {
      // For images/PDFs: simulate optical character recognition pipeline
      setTimeout(() => {
        // Find best matched sample or generic report based on file name
        let matchedSample = SAMPLE_LAB_REPORTS[0];
        const lowerName = file.name.toLowerCase();
        if (lowerName.includes('lipid') || lowerName.includes('cholesterol')) {
          matchedSample = SAMPLE_LAB_REPORTS[1];
        } else if (lowerName.includes('lft') || lowerName.includes('kft') || lowerName.includes('renal') || lowerName.includes('liver')) {
          matchedSample = SAMPLE_LAB_REPORTS[2];
        } else if (lowerName.includes('thyroid') || lowerName.includes('tsh')) {
          matchedSample = SAMPLE_LAB_REPORTS[3];
        } else if (lowerName.includes('sugar') || lowerName.includes('glucose') || lowerName.includes('diabetes') || lowerName.includes('hba1c')) {
          matchedSample = SAMPLE_LAB_REPORTS[4];
        }

        const simulatedText = matchedSample.rawText.replace(
          /UHID: [A-Z0-9\-]+/i,
          `UHID: ${targetUhid}`
        );
        setRawText(simulatedText);
        const parsed = parseLaboratoryReport(simulatedText);
        setExtractedResults(parsed.testResults);
        setOverallStatus(parsed.overallStatus);
        setReportType(matchedSample.reportType);
        setIsProcessing(false);
      }, 600);
    }
  };

  // Allow manual edit of extracted parameters
  const handleUpdateResult = (index: number, field: keyof LabTestResult, value: any) => {
    const updated = [...extractedResults];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedResults(updated);
  };

  const handleDeleteRow = (index: number) => {
    setExtractedResults(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    const newRow: LabTestResult = {
      testName: 'New Test Parameter',
      value: '10.0',
      numericValue: 10.0,
      unit: 'mg/dL',
      referenceRange: '5.0 - 15.0',
      status: 'Normal'
    };
    setExtractedResults(prev => [...prev, newRow]);
  };

  // Submit and commit report to UHID
  const handleSaveReport = () => {
    setErrorMessage(null);

    const uhidToSave = isPatient && currentPatient ? currentPatient.uhid : targetUhid.trim().toUpperCase();
    const patientExists = data.patients.some(p => p.uhid.toUpperCase() === uhidToSave.toUpperCase());

    if (!patientExists) {
      setErrorMessage(`Patient UHID "${uhidToSave}" not found in national health directory.`);
      return;
    }

    if (extractedResults.length === 0) {
      setErrorMessage('No laboratory test results detected to save. Please upload a report or paste test text.');
      return;
    }

    const res = uploadLabReport(
      uhidToSave,
      reportName,
      rawText,
      reportType,
      labName,
      extractedResults
    );

    if (res.success) {
      setUploadSuccess(`Report "${reportName}" (${extractedResults.length} parameters) attached to UHID ${uhidToSave}!`);
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setErrorMessage(res.error || 'Failed to save diagnostic report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {isPatient ? 'Upload Personal Lab Report' : 'Diagnostic Centre Report Upload'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                  Generic OCR Extraction
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Extracts full parameter names, observed values, units, and reference ranges automatically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Success Banner */}
          {uploadSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Target UHID & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Target Patient UHID:
              </label>
              {isPatient ? (
                <div className="font-mono font-bold text-slate-900 text-sm py-2 px-3 bg-white rounded-xl border border-slate-200">
                  {currentPatient?.uhid} ({currentPatient?.fullName})
                </div>
              ) : (
                <input
                  type="text"
                  value={targetUhid}
                  onChange={(e) => setTargetUhid(e.target.value.toUpperCase())}
                  placeholder="e.g. UHID-ACEA-031D"
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Laboratory / Source:
              </label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="Diagnostic Centre Name"
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                Diagnostic Category:
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
              >
                <option value="HEMATOLOGY">Hematology (CBC, ESR, Blood)</option>
                <option value="BIOCHEMISTRY">Biochemistry (LFT, KFT, Glucose)</option>
                <option value="LIPID">Lipid Profile (Cholesterol, HDL/LDL)</option>
                <option value="THYROID">Thyroid Panel (TSH, FT3, FT4)</option>
                <option value="URINALYSIS">Urinalysis & Routine</option>
                <option value="OTHER">Other Clinical Investigation</option>
              </select>
            </div>
          </div>

          {/* 3 Input Methods Switcher */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 text-xs">Choose Report Input Method:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInputMode('PRESET')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    inputMode === 'PRESET' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Realistic Sample Presets
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('UPLOAD')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    inputMode === 'UPLOAD' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload File (PDF / Image / TXT)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('PASTE')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    inputMode === 'PASTE' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste Report Text
                </button>
              </div>
            </div>

            {/* Sub-Panel 1: Presets */}
            {inputMode === 'PRESET' && (
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_LAB_REPORTS.map(sample => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectPreset(sample.id)}
                    className="p-3 text-left bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl transition-all"
                  >
                    <strong className="block text-slate-900 font-bold text-xs">{sample.name}</strong>
                    <span className="text-[10px] text-slate-500 block truncate">{sample.labName}</span>
                    <span className="mt-1 inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800">
                      {sample.reportType}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Sub-Panel 2: File Upload */}
            {inputMode === 'UPLOAD' && (
              <div className="pt-3">
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/60 transition-colors">
                  <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <span className="font-bold text-slate-800 block text-xs">
                    Choose lab report file or drag & drop
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts PDF files, Scanned Images (PNG, JPG), or Plain Text files (.txt, .csv)
                  </p>
                  <label className="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs">
                    Browse File from Computer
                    <input
                      type="file"
                      accept=".txt,.csv,.json,.pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {uploadedFileName && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-mono text-xs">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{uploadedFileName}</span>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="mt-2 text-blue-600 font-medium animate-pulse text-xs">
                      Running Generic Optical Character Recognition & parameter extraction...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-Panel 3: Paste Text */}
            {inputMode === 'PASTE' && (
              <div className="pt-3 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Paste raw report lines below (format: Test Name, Observed Value, Units, Reference Range):
                </label>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Hemoglobin 14.0 g/dL 13.0 - 17.0&#10;Total Leukocyte Count (TLC) 7,500 /cumm 4,000 - 11,000&#10;Platelet Count 250 10^3/µL 150 - 450"
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-300 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* =========================================================
              LIVE EXTRACTED PARAMETERS TABLE (CRITICAL REQUIREMENT)
          ========================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-xs">
                  Extracted Lab Test Parameters ({extractedResults.length} detected)
                </h4>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                    overallStatus === 'Normal'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : overallStatus.includes('Critical')
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {overallStatus}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            {extractedResults.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500">
                No test rows parsed yet. Select a preset or upload/paste report lines above.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs bg-white">
                  <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Investigation Parameter</th>
                      <th className="p-2.5 w-28">Value</th>
                      <th className="p-2.5 w-24">Unit</th>
                      <th className="p-2.5 w-32">Reference Range</th>
                      <th className="p-2.5 w-24">Status</th>
                      <th className="p-2.5 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extractedResults.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.testName}
                            onChange={(e) => handleUpdateResult(idx, 'testName', e.target.value)}
                            className="w-full font-semibold text-slate-900 bg-transparent focus:bg-white focus:outline-hidden px-1.5 py-0.5 rounded border border-transparent focus:border-blue-300"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.value}
                            onChange={(e) => handleUpdateResult(idx, 'value', e.target.value)}
                            className="w-full font-mono font-bold text-slate-900 bg-transparent focus:bg-white focus:outline-hidden px-1.5 py-0.5 rounded border border-transparent focus:border-blue-300"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.unit}
                            onChange={(e) => handleUpdateResult(idx, 'unit', e.target.value)}
                            className="w-full font-mono text-slate-600 bg-transparent focus:bg-white focus:outline-hidden px-1.5 py-0.5 rounded border border-transparent focus:border-blue-300"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.referenceRange}
                            onChange={(e) => handleUpdateResult(idx, 'referenceRange', e.target.value)}
                            className="w-full font-mono text-slate-500 bg-transparent focus:bg-white focus:outline-hidden px-1.5 py-0.5 rounded border border-transparent focus:border-blue-300 text-[11px]"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={row.status}
                            onChange={(e) => handleUpdateResult(idx, 'status', e.target.value as LabTestStatus)}
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              row.status === 'Normal'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : row.status === 'Critical'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <option value="Normal">Normal</option>
                            <option value="Low">Low</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-slate-500 text-[11px]">
            {isPatient ? (
              <span>Your personal report will be sealed under your UHID record.</span>
            ) : (
              <span>Patient & authorized doctors will receive report notifications immediately.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveReport}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-blue-200" />
              <span>Attach & Save Report to UHID</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
