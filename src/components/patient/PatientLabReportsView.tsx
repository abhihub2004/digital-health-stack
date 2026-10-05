import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  FileCode,
  Microscope,
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UploadLabReportModal } from '../lab/UploadLabReportModal';
import { LabReport } from '../../types';

export const PatientLabReportsView: React.FC = () => {
  const { currentPatient, data } = useApp();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOcrId, setExpandedOcrId] = useState<string | null>(null);

  if (!currentPatient) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
        Please sign in to view laboratory reports.
      </div>
    );
  }

  const patientReports = data.labReports.filter(
    r => r.uhid.toLowerCase() === currentPatient.uhid.toLowerCase()
  );

  const filteredReports = patientReports.filter(rep => {
    if (selectedCategory !== 'ALL' && rep.reportType !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rep.reportName.toLowerCase().includes(q);
      const matchLab = rep.labName.toLowerCase().includes(q);
      const matchParam = rep.testResults.some(t => t.testName.toLowerCase().includes(q));
      return matchName || matchLab || matchParam;
    }
    return true;
  });

  const abnormalCount = patientReports.filter(r => r.statusSummary !== 'Normal').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Diagnostic & Laboratory Reports</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
                {patientReports.length} Reports
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generic OCR parsed parameters preserving complete test names, values, and reference ranges.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>+ Upload Personal Lab Report</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Total Reports in Health Vault</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
            {patientReports.length}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Linked to {currentPatient.uhid}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Abnormal Parameters Flagged</span>
          <div className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5">
            {abnormalCount}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Clinical correlation recommended</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Privacy Vault Status</span>
          <div className="text-sm font-bold text-emerald-700 mt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sealed under Patient Consent</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Doctors cannot view without your approval</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          {['ALL', 'HEMATOLOGY', 'BIOCHEMISTRY', 'LIPID', 'THYROID', 'URINALYSIS'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap capitalize ${
                selectedCategory === cat
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report, parameter..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No laboratory reports found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No reports matching "${searchQuery}".`
              : 'Upload a personal lab report or let diagnostic centres record results against your UHID.'}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Personal Report</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReports.map(rep => {
            const isOcrOpen = expandedOcrId === rep.id;

            return (
              <div
                key={rep.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4 hover:border-blue-200 transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-lg shrink-0">
                      <Microscope className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{rep.reportName}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
                          {rep.reportType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Laboratory / Source: <strong className="text-slate-800">{rep.labName}</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(rep.uploadedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-slate-400">{rep.fileName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 self-start sm:self-auto">
                    <span
                      className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                        rep.statusSummary === 'Normal'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : rep.statusSummary.includes('Critical')
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {rep.statusSummary}
                    </span>
                  </div>
                </div>

                {/* Structured Investigation Parameters Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Extracted Investigation Parameters ({rep.testResults.length} parameters)
                    </span>
                    <button
                      onClick={() => setExpandedOcrId(isOcrOpen ? null : rep.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>{isOcrOpen ? 'Hide Raw OCR' : 'View Raw OCR Text'}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs bg-white">
                      <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">Investigation Parameter</th>
                          <th className="p-3">Observed Value</th>
                          <th className="p-3">Reference Range</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Clinical Advisory</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rep.testResults.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-3">
                              <strong className="text-slate-900 block">{t.testName}</strong>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-900">
                              {t.value} {t.unit}
                            </td>
                            <td className="p-3 font-mono text-slate-500 text-[11px]">
                              {t.referenceRange}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                                  t.status === 'Normal'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : t.status === 'Critical'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 text-[11px]">
                              {t.clinicalNote || 'Within expected biological interval.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Optional Raw OCR Accordion */}
                {isOcrOpen && rep.ocrRawText && (
                  <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-bold">
                      Raw OCR Document Dump:
                    </span>
                    <pre className="whitespace-pre-wrap">{rep.ocrRawText}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Personal Lab Report Modal */}
      <UploadLabReportModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultUhid={currentPatient.uhid}
      />
    </div>
  );
};
