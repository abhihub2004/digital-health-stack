import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Pill,
  Droplet,
  ShieldCheck,
  HeartPulse,
  ChevronRight,
  Search,
  Stethoscope,
  MoreHorizontal,
  Lock,
  Unlock,
  Check,
  FileText,
  Clock,
  QrCode,
  Copy,
  History,
  ShieldAlert,
  ArrowRight,
  Upload,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { triageSymptoms } from '../../services/triageEngine';
import { SymptomTriageResult } from '../../types';
import { UploadLabReportModal } from '../lab/UploadLabReportModal';

interface PatientDashboardProps {
  onOpenBooking: () => void;
  onOpenTriage: () => void;
  onOpenConsentModal: (consentId: string) => void;
  activeNavTab?: string;
  setActiveNavTab?: (tab: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onOpenBooking,
  onOpenTriage,
  onOpenConsentModal,
  activeNavTab = 'dashboard',
  setActiveNavTab
}) => {
  const {
    currentPatient,
    data,
    activeConsents,
    pendingConsentRequestsForMe,
    revokeConsent,
    updateMedicineSchedule,
    cdsAlerts
  } = useApp();

  const [copiedUhid, setCopiedUhid] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isUploadReportOpen, setIsUploadReportOpen] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Quick symptom input in dashboard hero card matching image.png
  const [symptomQuery, setSymptomQuery] = useState('');
  const [inlineTriageResult, setInlineTriageResult] = useState<SymptomTriageResult | null>(null);

  if (!currentPatient) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <p className="text-slate-600">No patient profile active. Please select patient login.</p>
      </div>
    );
  }

  const patientLabReports = data.labReports.filter(r => r.uhid === currentPatient.uhid);
  const patientPrescriptions = data.prescriptions.filter(p => p.uhid === currentPatient.uhid);
  const patientAppointments = data.appointments.filter(a => a.uhid === currentPatient.uhid);
  const patientSchedules = data.medicineSchedules.filter(s => s.patientId === currentPatient.id);
  const patientAccessLogs = data.accessLogs.filter(l => l.patientId === currentPatient.id || l.patientUhid === currentPatient.uhid);
  const myActiveConsents = activeConsents.filter(c => c.patientId === currentPatient.id);

  const selectedReport = patientLabReports.find(r => r.id === selectedReportId) || patientLabReports[0];

  const handleCopyUhid = () => {
    navigator.clipboard?.writeText(currentPatient.uhid);
    setCopiedUhid(true);
    setTimeout(() => setCopiedUhid(false), 2000);
  };

  const handleInlineTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomQuery.trim()) return;
    const res = triageSymptoms(symptomQuery);
    setInlineTriageResult(res);
  };

  const upcomingAppointments = patientAppointments.filter(
    a => a.status !== 'CANCELLED' && a.status !== 'REJECTED' && a.status !== 'COMPLETED'
  );
  const nextAppointment = upcomingAppointments[0];

  return (
    <div className="space-y-6">
      {/* Pending Consent Request Banner (If doctor requested access) */}
      {pendingConsentRequestsForMe.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse-once">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-xs shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-mono">
                  ACTION REQUIRED
                </span>
                <span className="text-xs text-amber-800 font-semibold">Doctor Clinical Access Request</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                {pendingConsentRequestsForMe[0].doctorName} ({pendingConsentRequestsForMe[0].doctorSpecialty})
              </h3>
              <p className="text-xs text-slate-700 mt-0.5">
                Stated Reason: "{pendingConsentRequestsForMe[0].reason}". Scopes: {pendingConsentRequestsForMe[0].accessScope.join(', ')}.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenConsentModal(pendingConsentRequestsForMe[0].id)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Lock className="w-4 h-4 text-blue-200" />
            <span>Review & Authorize</span>
          </button>
        </div>
      )}

      {/* ==============================================================
          HERO BANNER EXACTLY MATCHING image.png
      ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50/95 via-indigo-50/50 to-blue-100/60 border border-blue-100/80 p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          {/* Left Text Block */}
          <div className="max-w-xl space-y-4">
            {/* Tag matching image.png */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-xs text-blue-600 rounded-full text-xs font-semibold border border-blue-200/60 shadow-2xs">
              <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
              <span>Your health, connected</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Welcome to your <br />
              <span className="text-blue-600">Digital Health Stack</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Manage your healthcare journey, medical records, appointments and more — all in one secure place.
            </p>

            {/* Primary Action Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={onOpenTriage}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all"
              >
                <span>Check Your Health</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* UHID Pill Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/80 border border-blue-200/80 rounded-2xl text-xs font-mono">
                <span className="text-slate-400">UHID:</span>
                <strong className="text-slate-900 font-bold">{currentPatient.uhid}</strong>
                <button onClick={handleCopyUhid} className="text-blue-600 hover:text-blue-800 ml-1">
                  {copiedUhid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right Circular Ripple Graphic matching image.png */}
          <div className="relative flex items-center justify-center shrink-0 lg:mr-8">
            {/* Outer concentric ring */}
            <div className="w-56 h-56 rounded-full border border-blue-200/40 flex items-center justify-center">
              {/* Middle concentric ring */}
              <div className="w-44 h-44 rounded-full border border-blue-200/70 flex items-center justify-center">
                {/* Inner white circle */}
                <div className="w-28 h-28 rounded-full bg-white shadow-xl shadow-blue-500/10 border border-blue-200/80 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      <path d="M8 12h2.5l1.5-3 2 6 1.5-3H16" stroke="#2563EB" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          4 METRIC CARDS ROW EXACTLY MATCHING image.png (INTERACTIVE)
      ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Upcoming Appointments */}
        <div
          onClick={() => setActiveNavTab?.('appointments')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-3xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
          title="Click to view all appointments"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                Upcoming Appointments
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                {upcomingAppointments.length}
              </div>
              <span className="text-[11px] text-blue-600 font-semibold block mt-0.5 flex items-center gap-0.5">
                <span>View appointments</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Prescriptions */}
        <div
          onClick={() => setActiveNavTab?.('prescriptions')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-3xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:border-purple-400 hover:shadow-md cursor-pointer transition-all group"
          title="Click to view prescriptions and dosages"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                Active Prescriptions
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                {patientPrescriptions.reduce((acc, p) => acc + (p.medicines?.length || 0), 0)}
              </div>
              <span className="text-[11px] text-purple-600 font-semibold block mt-0.5 flex items-center gap-0.5">
                <span>View prescriptions</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Blood Group */}
        <div
          onClick={() => setActiveNavTab?.('blood_bank')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-3xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:border-rose-400 hover:shadow-md cursor-pointer transition-all group"
          title="Click to view Blood Bank inventory"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Droplet className="w-5 h-5 fill-rose-400 group-hover:fill-white" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                Blood Group
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                {currentPatient.bloodGroup.includes('(') ? currentPatient.bloodGroup.split('(')[1].replace(')', '') : 'O+'}
              </div>
              <span className="text-[11px] text-rose-600 font-semibold block mt-0.5 flex items-center gap-0.5">
                <span>Blood bank network</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Health Record */}
        <div
          onClick={() => setActiveNavTab?.('consent_center')}
          role="button"
          tabIndex={0}
          className="bg-white rounded-3xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group"
          title="Click to manage doctor consents and access logs"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">
                Health Record
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                Protected
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5 flex items-center gap-0.5">
                <span>Manage consents</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          LOWER SECTION MATCHING image.png (AI Assistant + Next Appointment)
      ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Wide): AI Health Assistant */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <HeartPulse className="w-4 h-4 text-blue-600" />
              <span>AI Health Assistant</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">How are you feeling today?</h2>
            <p className="text-xs text-slate-500 mt-1">
              Describe your symptoms and get guidance on the appropriate medical specialty.
            </p>
          </div>

          {/* Search bar matching image.png */}
          <form onSubmit={handleInlineTriage} className="relative">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={symptomQuery}
                onChange={(e) => setSymptomQuery(e.target.value)}
                placeholder="e.g. headache, fever, joint pain..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-sm shadow-blue-500/20"
              >
                Check
              </button>
            </div>
          </form>

          {/* Triage Output if entered */}
          {inlineTriageResult && (
            <div className="pt-2">
              {inlineTriageResult.isEmergency ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-1">
                  <div className="flex items-center gap-2 text-rose-700 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>EMERGENCY WARNING</span>
                  </div>
                  <p className="font-medium">{inlineTriageResult.emergencyWarning}</p>
                </div>
              ) : (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">Suggested Department:</span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-white text-blue-700 border border-blue-200">
                      {inlineTriageResult.suggestedDepartment}
                    </span>
                  </div>
                  <p className="text-slate-600">{inlineTriageResult.notes}</p>
                  <button
                    onClick={onOpenBooking}
                    className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    <span>Book consultation with specialist</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Next Appointment matching image.png */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 space-y-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Next Appointment</span>
              </div>
              <MoreHorizontal className="w-4 h-4 cursor-pointer" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mt-3">Upcoming</h3>

            {/* Doctor Consultation Card matching image.png */}
            {nextAppointment ? (
              <div
                onClick={() => setActiveNavTab?.('appointments')}
                role="button"
                tabIndex={0}
                className="mt-4 p-4 bg-slate-50/80 hover:bg-blue-50/60 border border-slate-100 hover:border-blue-200 rounded-2xl flex items-center gap-3.5 cursor-pointer transition-all group"
                title="Click to view appointment details"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {nextAppointment.doctorName}
                    </h4>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {nextAppointment.doctorSpecialty} · Token: <strong className="font-mono text-blue-700">{nextAppointment.tokenNumber}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {nextAppointment.date} at {nextAppointment.time}
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setActiveNavTab?.('appointments')}
                role="button"
                tabIndex={0}
                className="mt-4 p-4 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 rounded-2xl flex items-center gap-3.5 cursor-pointer transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Doctor Consultation</h4>
                  <div className="text-[11px] text-slate-500">General Medicine / Neurology</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Available for booking</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => setActiveNavTab?.('appointments')}
              className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs text-center flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>View Appointments</span>
            </button>
            <button
              onClick={onOpenBooking}
              className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs text-center flex items-center justify-center gap-1.5"
            >
              <span>+ Book New</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==============================================================
          CORE PATIENT PRIVACY: CONSENT MANAGER & ACTIVE DOCTORS
      ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Active Doctor Consents & Access Controls</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Only authorized doctors can view your records. You can revoke access immediately with one click.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-mono text-xs font-bold rounded-xl">
              {myActiveConsents.length} Granted
            </span>
            <button
              onClick={() => setActiveNavTab?.('consent_center')}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
            >
              <span>Manage Consents</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {myActiveConsents.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
            <Lock className="w-6 h-6 mx-auto text-slate-400 mb-1" />
            No doctors currently hold active consent. Your health records are completely sealed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myActiveConsents.map(c => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-blue-100 bg-blue-50/30 text-xs space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <strong className="text-slate-900 text-sm block font-bold">{c.doctorName}</strong>
                    <span className="text-slate-500">{c.doctorSpecialty} · {c.hospital}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ACTIVE
                  </span>
                </div>

                <div className="text-slate-600">
                  <span className="text-slate-400 text-[11px] block">Granted Scope:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {c.accessScope.map(sc => (
                      <span key={sc} className="px-2 py-0.5 bg-white border border-blue-200 text-blue-900 rounded font-mono text-[10px]">
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-blue-100/80">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Expires: {c.expiresAt ? new Date(c.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Consultation'}
                  </span>
                  <button
                    onClick={() => revokeConsent(c.id, 'Revoked by patient via consent manager')}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-[11px] transition-colors"
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==============================================================
          RECENT LAB REPORTS & GENERIC OCR RESULTS
      ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Laboratory & Diagnostic Reports</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Parsed via generic OCR preserving complete parameters (Total Leukocyte Count, Absolute counts, etc.)
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setActiveNavTab?.('lab_reports')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
            >
              <span>View All Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsUploadReportOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Upload Personal Report</span>
            </button>
          </div>
        </div>

        {patientLabReports.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No laboratory reports uploaded yet.</p>
            <p className="mt-0.5">You can upload personal reports or have accredited diagnostic centres upload against your UHID.</p>
            <button
              onClick={() => setIsUploadReportOpen(true)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Personal Lab Report</span>
            </button>
          </div>
        ) : (
          patientLabReports.map(rep => {
            const isExpanded = expandedReportId === rep.id;
            const displayedResults = isExpanded ? rep.testResults : rep.testResults.slice(0, 4);

            return (
              <div key={rep.id} className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <strong className="text-slate-900 text-sm font-bold">{rep.reportName}</strong>
                    <div className="text-slate-500 text-[11px]">{rep.labName} · {new Date(rep.uploadedAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold self-start sm:self-auto ${
                    rep.statusSummary === 'Normal' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {rep.statusSummary}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white rounded-xl border border-slate-200">
                    <thead className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2.5">Investigation Parameter</th>
                        <th className="p-2.5">Observed Value</th>
                        <th className="p-2.5">Reference Range</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedResults.map((t, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-semibold text-slate-900">{t.testName}</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{t.value} {t.unit}</td>
                          <td className="p-2.5 font-mono text-slate-500 text-[11px]">{t.referenceRange}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
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

                {rep.testResults.length > 4 && (
                  <div className="pt-1 text-center">
                    <button
                      onClick={() => setExpandedReportId(isExpanded ? null : rep.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      <span>{isExpanded ? 'Show Less' : `View All ${rep.testResults.length} Parameters`}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ==============================================================
          TODAY'S MEDICATION REMINDERS
      ============================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-4 h-4 text-purple-600" />
            <span>Today's Medicine Schedule & Dosage Reminders</span>
          </h3>
          <button
            onClick={() => setActiveNavTab?.('prescriptions')}
            className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 hover:underline"
          >
            <span>View All Prescriptions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          {patientSchedules.map(sched => (
            <div
              key={sched.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                sched.status === 'TAKEN'
                  ? 'bg-slate-50/60 border-slate-200 text-slate-400'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl text-xs">
                  {sched.timing}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{sched.medicineName} ({sched.dosage})</div>
                  <div className="text-slate-500 text-[11px]">Instruction: {sched.timingRelation}</div>
                </div>
              </div>

              {sched.status === 'TAKEN' ? (
                <span className="font-mono text-emerald-700 text-xs font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Taken
                </span>
              ) : (
                <button
                  onClick={() => updateMedicineSchedule(sched.id, 'TAKEN')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Mark Taken
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Personal Lab Report Modal */}
      <UploadLabReportModal
        isOpen={isUploadReportOpen}
        onClose={() => setIsUploadReportOpen(false)}
        defaultUhid={currentPatient.uhid}
      />
    </div>
  );
};
