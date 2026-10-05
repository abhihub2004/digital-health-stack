import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Stethoscope,
  Search,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  FilePlus,
  Share2,
  Calendar,
  Clock,
  Check,
  Pill,
  FileText,
  User,
  Plus,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { AccessScope, ConsentDuration, PrescriptionMedicineItem } from '../../types';
import { BloodBankView } from '../patient/BloodBankView';

interface DoctorDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  activeTab = 'dashboard',
  setActiveTab
}) => {
  const {
    currentDoctor,
    data,
    activeConsents,
    requestConsent,
    requestEmergencyAccess,
    createPrescription,
    updateAppointmentStatus,
    cdsAlerts
  } = useApp();

  // Search state
  const [searchUhid, setSearchUhid] = useState('UHID-ACEA-031D');
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    uhid: string;
    patientId: string;
    patientName: string;
    maskedName: string;
    gender: string;
    age: number;
    hasActiveConsent: boolean;
    activeConsentId?: string;
    activeScopes: AccessScope[];
    expiresAt?: string;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Request Access Modal
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [requestReason, setRequestReason] = useState('Consultation for persistent headache and neurological review');
  const [requestedScopes, setRequestedScopes] = useState<AccessScope[]>(['BASIC_PROFILE', 'LAB_REPORTS', 'MEDICAL_HISTORY', 'PRESCRIPTIONS']);
  const [requestedDuration, setRequestedDuration] = useState<ConsentDuration>('24_HOURS');
  const [requestSuccessMsg, setRequestSuccessMsg] = useState<string | null>(null);

  // Emergency Access Modal
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('Acute trauma/unconscious patient requiring emergency resuscitation');
  const [emergencyFacility, setEmergencyFacility] = useState(currentDoctor?.hospital || 'Emergency Department, AIIMS Hospital');

  // Prescription Modal
  const [showRxModal, setShowRxModal] = useState(false);
  const [rxDiagnosis, setRxDiagnosis] = useState('Acute Tension-Type Headache / Migraine with Photophobia');
  const [rxNotes, setRxNotes] = useState('Advised hydration, regular sleep schedule, and prophylactic therapy.');
  const [rxMedicines, setRxMedicines] = useState<PrescriptionMedicineItem[]>([
    {
      id: 'm1',
      medicineName: 'Paracetamol 500 mg',
      dosage: '1 tablet (500 mg)',
      form: 'Tablet',
      frequency: 'Twice daily',
      durationDays: 5,
      timings: ['08:00 AM', '08:00 PM'],
      timingRelation: 'After food',
      instructions: 'Take after meals. Do not exceed 4g in 24 hours.'
    }
  ]);
  const [rxSuccessMsg, setRxSuccessMsg] = useState<string | null>(null);

  // Referral Modal
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [refDoctorId, setRefDoctorId] = useState(data.doctors[2]?.id || '');
  const [refReason, setRefReason] = useState('Specialist evaluation for associated dermatological and allergic findings.');

  // View state
  const getInitialDoctorTab = (): 'CLINICAL_PORTAL' | 'QUEUE' | 'CDS_ALERTS' | 'PRESCRIPTIONS' => {
    if (activeTab === 'appointments' || activeTab === 'queue') return 'QUEUE';
    if (activeTab === 'cds_alerts') return 'CDS_ALERTS';
    if (activeTab === 'prescriptions') return 'PRESCRIPTIONS';
    if (activeTab === 'uhid_search') return 'CLINICAL_PORTAL';
    return 'CLINICAL_PORTAL';
  };

  const [activeDoctorTab, setActiveDoctorTab] = useState<'CLINICAL_PORTAL' | 'QUEUE' | 'CDS_ALERTS' | 'PRESCRIPTIONS'>(getInitialDoctorTab);
  const [queueStatusFilter, setQueueStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'EMERGENCY'>('ALL');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');

  React.useEffect(() => {
    if (activeTab === 'uhid_search') setActiveDoctorTab('CLINICAL_PORTAL');
    else if (activeTab === 'appointments' || activeTab === 'queue') setActiveDoctorTab('QUEUE');
    else if (activeTab === 'cds_alerts') setActiveDoctorTab('CDS_ALERTS');
    else if (activeTab === 'prescriptions') setActiveDoctorTab('PRESCRIPTIONS');
    else if (activeTab === 'dashboard') setActiveDoctorTab('CLINICAL_PORTAL');
  }, [activeTab]);

  if (activeTab === 'blood_bank') {
    return <BloodBankView />;
  }

  if (!currentDoctor) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <p className="text-slate-600">Please switch to a Doctor persona to view this clinical desk.</p>
      </div>
    );
  }

  // Handle Search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setRequestSuccessMsg(null);

    const query = searchUhid.trim().toUpperCase();
    const patient = data.patients.find(p => p.uhid.toUpperCase() === query);

    if (!patient) {
      setSearchError(`No patient found with UHID: ${query}. Please verify identification.`);
      setSearchResult(null);
      return;
    }

    // Check if this doctor currently has active approved consent
    const consent = activeConsents.find(c => c.patientId === patient.id && c.doctorId === currentDoctor.id);

    // Mask name if no consent
    const nameParts = patient.fullName.split(' ');
    const masked = consent
      ? patient.fullName
      : nameParts.map(p => p[0] + '*'.repeat(Math.max(p.length - 1, 3))).join(' ');

    setSearchResult({
      found: true,
      uhid: patient.uhid,
      patientId: patient.id,
      patientName: patient.fullName,
      maskedName: masked,
      gender: patient.gender,
      age: patient.age,
      hasActiveConsent: !!consent,
      activeConsentId: consent?.id,
      activeScopes: consent ? consent.accessScope : [],
      expiresAt: consent?.expiresAt
    });
  };

  const handleSendConsentRequest = () => {
    if (!searchResult) return;
    const res = requestConsent(searchResult.uhid, requestReason, requestedScopes, requestedDuration);
    if (res.success) {
      setRequestSuccessMsg(`Consent request dispatched to ${searchResult.maskedName}. Waiting for patient approval.`);
      setShowConsentModal(false);
    } else {
      setSearchError(res.error || 'Failed to send consent request.');
    }
  };

  const handleAddMedicineRow = () => {
    setRxMedicines(prev => [
      ...prev,
      {
        id: `m_${Date.now()}`,
        medicineName: 'Naproxen 250 mg',
        dosage: '1 tablet (250 mg)',
        form: 'Tablet',
        frequency: 'Once daily',
        durationDays: 3,
        timings: ['09:00 PM'],
        timingRelation: 'After food',
        instructions: 'Take with food and full glass of water.'
      }
    ]);
  };

  const handleRemoveMedicineRow = (id: string) => {
    setRxMedicines(prev => prev.filter(m => m.id !== id));
  };

  const handleSavePrescription = () => {
    if (!searchResult) return;
    const res = createPrescription({
      uhid: searchResult.uhid,
      diagnosis: rxDiagnosis,
      clinicalNotes: rxNotes,
      medicines: rxMedicines,
      vitals: { bloodPressure: '128/84', heartRate: 76, temperature: '98.6°F', spo2: 99 }
    });

    if (res.success) {
      setRxSuccessMsg('Prescription generated successfully! Medicine schedules auto-created for patient.');
      setShowRxModal(false);
    } else {
      setSearchError(res.error || 'Failed to issue prescription.');
    }
  };

  // Find records for the selected searched patient if consent is active
  const targetPatient = searchResult ? data.patients.find(p => p.id === searchResult.patientId) : null;
  const isConsentApproved = searchResult?.hasActiveConsent;
  const allowedScopes = searchResult?.activeScopes || [];

  const canSeeProfile = allowedScopes.includes('FULL_RECORD') || allowedScopes.includes('BASIC_PROFILE');
  const canSeeHistory = allowedScopes.includes('FULL_RECORD') || allowedScopes.includes('MEDICAL_HISTORY');
  const canSeeLabs = allowedScopes.includes('FULL_RECORD') || allowedScopes.includes('LAB_REPORTS') || allowedScopes.includes('DIAGNOSTIC_REPORTS');
  const canSeeRx = allowedScopes.includes('FULL_RECORD') || allowedScopes.includes('PRESCRIPTIONS');

  const patientReports = (isConsentApproved && canSeeLabs && targetPatient)
    ? data.labReports.filter(r => r.uhid === targetPatient.uhid)
    : [];

  const patientPrescriptions = (isConsentApproved && canSeeRx && targetPatient)
    ? data.prescriptions.filter(p => p.uhid === targetPatient.uhid)
    : [];

  // Appointments for this doctor
  const todayAppointments = data.appointments.filter(a => a.doctorId === currentDoctor.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Doctor Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
            <Stethoscope className="w-7 h-7 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{currentDoctor.name}</h1>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Verified Specialist
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {currentDoctor.specialization} · {currentDoctor.hospital}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
              <span>License: {currentDoctor.licenseNumber}</span>
              <span>·</span>
              <span>Fee: ₹{currentDoctor.consultationFee}</span>
              <span>·</span>
              <span>Rating: ★ {currentDoctor.rating}</span>
            </div>
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start md:self-center overflow-x-auto">
          <button
            onClick={() => {
              setActiveDoctorTab('CLINICAL_PORTAL');
              setActiveTab?.('uhid_search');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeDoctorTab === 'CLINICAL_PORTAL' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            UHID Search & Consent Gateway
          </button>
          <button
            onClick={() => {
              setActiveDoctorTab('QUEUE');
              setActiveTab?.('appointments');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeDoctorTab === 'QUEUE' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today's Queue & Appointments ({todayAppointments.length})
          </button>
          <button
            onClick={() => {
              setActiveDoctorTab('CDS_ALERTS');
              setActiveTab?.('cds_alerts');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeDoctorTab === 'CDS_ALERTS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clinical Decision Support
          </button>
          <button
            onClick={() => {
              setActiveDoctorTab('PRESCRIPTIONS');
              setActiveTab?.('prescriptions');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeDoctorTab === 'PRESCRIPTIONS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Prescriptions ({data.prescriptions.filter(p => p.doctorId === currentDoctor.id).length})
          </button>
        </div>
      </div>

      {/* 1. CLINICAL PORTAL TAB */}
      {activeDoctorTab === 'CLINICAL_PORTAL' && (
        <div className="space-y-6">
          {/* UHID Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-800" />
              <span>Patient Directory Search by Unique Health ID (UHID)</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter the patient's UHID to lookup their record. Note: Medical details remain locked until the patient explicitly approves your access request.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchUhid}
                  onChange={(e) => setSearchUhid(e.target.value)}
                  placeholder="e.g. UHID-ACEA-031D"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Search Patient</span>
              </button>
            </form>

            {searchError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {requestSuccessMsg && (
              <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{requestSuccessMsg}</span>
              </div>
            )}

            {rxSuccessMsg && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{rxSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Search Result & Privacy Lockout Gate */}
          {searchResult && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              {/* Patient Basic Identity Bar */}
              <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold font-mono text-base ${
                    isConsentApproved ? 'bg-emerald-800' : 'bg-slate-700'
                  }`}>
                    {isConsentApproved ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6 text-amber-300" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">
                        {searchResult.maskedName}
                      </h3>
                      <span className="font-mono text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {searchResult.uhid}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 font-mono">
                      <span>Age: {searchResult.age} Yrs</span>
                      <span>·</span>
                      <span>Gender: {searchResult.gender}</span>
                      <span>·</span>
                      <span>Consent Status: <strong className={isConsentApproved ? 'text-emerald-700' : 'text-amber-800 font-bold'}>{isConsentApproved ? 'APPROVED & ACTIVE' : 'CONSENT REQUIRED'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center gap-2">
                  {!isConsentApproved ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowConsentModal(true)}
                        className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-4 h-4 text-teal-200" />
                        <span>Request Access</span>
                      </button>
                      <button
                        onClick={() => setShowEmergencyModal(true)}
                        className="px-3.5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Override access under documented emergency clinical protocols. All emergency access is immutably logged."
                      >
                        <AlertTriangle className="w-4 h-4 text-rose-200" />
                        <span>Request Emergency Access</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowRxModal(true)}
                        className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <FilePlus className="w-4 h-4" />
                        <span>Create Prescription</span>
                      </button>
                      <button
                        onClick={() => setShowReferralModal(true)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Refer Patient</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* LOCKED STATE BANNER */}
              {!isConsentApproved ? (
                <div className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
                  <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto border-2 border-amber-200">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Medical Records Locked: Consent Required
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      In accordance with the Digital Healthcare Platform privacy architecture, a doctor cannot view medical history, diagnostic reports, or prescriptions merely by possessing a UHID.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2 text-slate-700">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-800" />
                      <span>Mandatory Consent Workflow:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                      <li>Doctor clicks "Request Access" specifying clinical reason and scopes.</li>
                      <li>Patient receives an instant authorization alert on their dashboard / WhatsApp.</li>
                      <li>Upon patient approval, this desk automatically unlocks only the granted records.</li>
                    </ol>
                  </div>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => setShowConsentModal(true)}
                      className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Send Access Request to Patient</span>
                    </button>
                    <button
                      onClick={() => setShowEmergencyModal(true)}
                      className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Emergency Access Override</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* UNLOCKED CLINICAL RECORDS (SCOPED ACCESS) */
                <div className="p-6 space-y-6">
                  {/* Scopes & Expiration Notice */}
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Active Consent: <strong>{allowedScopes.join(', ')}</strong></span>
                    </div>
                    <span className="font-mono text-emerald-800 text-[11px]">
                      Expires: {searchResult.expiresAt ? new Date(searchResult.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'End of Consultation'}
                    </span>
                  </div>

                  {/* Clinical Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Patient Medical History (if scoped) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-teal-800" />
                        <span>Clinical Profile & Allergies</span>
                      </h4>

                      {canSeeHistory && targetPatient ? (
                        <div className="space-y-2 text-slate-700">
                          <div>
                            <span className="text-slate-500 block text-[11px]">Known Drug Allergies:</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {targetPatient.allergies.map(a => (
                                <span key={a} className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[11px] font-bold">
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Chronic Medical Conditions:</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {targetPatient.chronicConditions.map(c => (
                                <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[11px]">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Emergency Contact:</span>
                            <span className="font-medium text-slate-900">{targetPatient.emergencyContact.name} ({targetPatient.emergencyContact.relationship}) - {targetPatient.emergencyContact.phone}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-lg text-slate-400 text-center italic">
                          Medical history not disclosed in current consent scope.
                        </div>
                      )}
                    </div>

                    {/* Prescriptions History (if scoped) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-emerald-800" />
                        <span>Prescriptions History</span>
                      </h4>

                      {canSeeRx ? (
                        patientPrescriptions.length === 0 ? (
                          <div className="p-3 bg-white rounded-lg text-slate-400 text-center">
                            No prior prescriptions recorded.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {patientPrescriptions.map(rx => (
                              <div key={rx.id} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                                <div className="font-bold text-slate-900">{rx.diagnosis}</div>
                                <div className="text-[11px] text-slate-500">
                                  {rx.doctorName} · {new Date(rx.createdAt).toLocaleDateString()}
                                </div>
                                <div className="text-[11px] text-slate-700">
                                  {rx.medicines.map(m => m.medicineName).join(', ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <div className="p-3 bg-white rounded-lg text-slate-400 text-center italic">
                          Prescription records not authorized in current consent scope.
                        </div>
                      )}
                    </div>

                    {/* Action Panel */}
                    <div className="bg-teal-900 text-white p-4 rounded-xl space-y-3 text-xs">
                      <h4 className="font-bold text-teal-200 uppercase font-mono">
                        Clinical Consultation Tools
                      </h4>
                      <p className="text-slate-200 text-[11px]">
                        Issue an electronic prescription with automated medicine schedules or refer patient to a colleague.
                      </p>
                      <button
                        onClick={() => setShowRxModal(true)}
                        className="w-full py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <FilePlus className="w-4 h-4" />
                        <span>Issue Electronic Prescription</span>
                      </button>
                      <button
                        onClick={() => setShowReferralModal(true)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Create Colleague Referral</span>
                      </button>
                    </div>
                  </div>

                  {/* Laboratory Reports Table (Scoped) */}
                  {canSeeLabs && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Laboratory Reports & Structured OCR Results</h4>
                          <p className="text-xs text-slate-500">Full parameter names preserved from diagnostic centre</p>
                        </div>
                        <span className="text-xs font-mono bg-teal-50 text-teal-900 px-2 py-0.5 rounded font-bold">
                          {patientReports.length} Reports Accessible
                        </span>
                      </div>

                      {patientReports.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                          No laboratory reports uploaded yet for this patient.
                        </div>
                      ) : (
                        patientReports.map(rep => (
                          <div key={rep.id} className="p-4 border-b border-slate-100 last:border-0 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-900 text-sm">{rep.reportName}</span>
                                <span className="text-xs text-slate-500 ml-2 font-mono">({rep.labName})</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded font-mono text-xs font-semibold ${
                                rep.statusSummary === 'Normal' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                              }`}>
                                {rep.statusSummary}
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono">
                                  <tr>
                                    <th className="p-2.5">Investigation / Test Name</th>
                                    <th className="p-2.5">Observed Value</th>
                                    <th className="p-2.5">Biological Reference Range</th>
                                    <th className="p-2.5">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {rep.testResults.map((t, i) => (
                                    <tr key={i} className="hover:bg-slate-50/70">
                                      <td className="p-2.5 font-semibold text-slate-900">{t.testName}</td>
                                      <td className="p-2.5 font-mono font-bold text-slate-800">{t.value} {t.unit}</td>
                                      <td className="p-2.5 font-mono text-slate-600">{t.referenceRange}</td>
                                      <td className="p-2.5">
                                        <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                                          t.status === 'Normal' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
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
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. QUEUE & APPOINTMENTS TAB */}
      {activeDoctorTab === 'QUEUE' && (() => {
        const filteredQueue = todayAppointments.filter(apt => {
          if (queueStatusFilter === 'PENDING' && apt.status !== 'PENDING') return false;
          if (queueStatusFilter === 'CONFIRMED' && (apt.status !== 'CONFIRMED' && apt.status !== 'IN_QUEUE' && apt.status !== 'IN_CONSULTATION')) return false;
          if (queueStatusFilter === 'EMERGENCY' && !apt.isEmergency) return false;

          if (queueSearchQuery.trim()) {
            const q = queueSearchQuery.toLowerCase();
            const matchName = apt.patientName.toLowerCase().includes(q);
            const matchUhid = apt.uhid.toLowerCase().includes(q);
            const matchReason = apt.reasonForVisit.toLowerCase().includes(q);
            return matchName || matchUhid || matchReason;
          }
          return true;
        });

        const pendingCount = todayAppointments.filter(a => a.status === 'PENDING').length;
        const confirmedCount = todayAppointments.filter(a => a.status === 'CONFIRMED' || a.status === 'IN_QUEUE' || a.status === 'IN_CONSULTATION').length;
        const emergencyCount = todayAppointments.filter(a => a.isEmergency).length;

        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-800" />
                  <span>Clinical Appointments & Token Roster</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage patient consultation queue, confirm bookings, triage emergencies, and launch clinical encounters.
                </p>
              </div>
              <span className="font-mono text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold self-start sm:self-auto">
                {confirmedCount} Active in Queue · {todayAppointments.length} Total Today
              </span>
            </div>

            {/* Filter and Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setQueueStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    queueStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({todayAppointments.length})
                </button>
                <button
                  onClick={() => setQueueStatusFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    queueStatusFilter === 'PENDING' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setQueueStatusFilter('CONFIRMED')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    queueStatusFilter === 'CONFIRMED' ? 'bg-white text-teal-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Confirmed / In Queue ({confirmedCount})
                </button>
                <button
                  onClick={() => setQueueStatusFilter('EMERGENCY')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    queueStatusFilter === 'EMERGENCY' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Critical / Emergency ({emergencyCount})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={queueSearchQuery}
                  onChange={(e) => setQueueSearchQuery(e.target.value)}
                  placeholder="Search patient name, UHID..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            {/* List */}
            {filteredQueue.length === 0 ? (
              <div className="p-10 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No appointments found matching filter.</p>
                <p className="mt-0.5">Check other filter tabs or reset the search query.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQueue.map(apt => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-center shrink-0">
                        <span className="text-[10px] uppercase font-mono text-teal-800 block">TOKEN</span>
                        <span className="text-xl font-mono font-bold text-teal-900">{apt.tokenNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm">{apt.patientName}</h3>
                          <span className="font-mono text-slate-500 text-[11px]">({apt.uhid})</span>
                          {apt.isEmergency && (
                            <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
                              EMERGENCY PRIORITY
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1 italic">Reason: "{apt.reasonForVisit}"</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono flex-wrap">
                          <span>Time: {apt.time}</span>
                          <span>·</span>
                          <span>Wait Time: ~{apt.estimatedWaitMinutes} mins</span>
                          <span>·</span>
                          <span>Fee: ₹{apt.consultationFee}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {apt.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'CONFIRMED')}
                            className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg text-xs transition-colors"
                          >
                            Confirm Appointment
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'REJECTED')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                            apt.status === 'COMPLETED'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {apt.status}
                          </span>
                          {apt.status !== 'COMPLETED' && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'COMPLETED')}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                              title="Mark appointment finished"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSearchUhid(apt.uhid);
                              setActiveDoctorTab('CLINICAL_PORTAL');
                              setActiveTab?.('uhid_search');
                              handleSearch();
                            }}
                            className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 font-semibold rounded-lg text-xs transition-colors"
                          >
                            Open Clinical File
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* 3. CLINICAL DECISION SUPPORT TAB */}
      {activeDoctorTab === 'CDS_ALERTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-teal-800" />
              <span>Rule-Based Clinical Decision Support (CDS) Advisories</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Advisories for abnormal lab indicators, drug-drug interactions, and high-risk vital thresholds. Note: Decision support only; not an automated diagnosis.
            </p>
          </div>

          <div className="space-y-4">
            {cdsAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                    : 'bg-amber-50/70 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${alert.severity === 'CRITICAL' ? 'text-rose-700' : 'text-amber-700'}`} />
                    <span className="font-bold text-sm">{alert.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="font-medium">{alert.message}</p>
                <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                  <strong>Clinical Guideline:</strong> {alert.clinicalGuideline}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. DOCTOR PRESCRIPTIONS TAB */}
      {activeDoctorTab === 'PRESCRIPTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-800" />
                <span>Prescriptions Issued by {currentDoctor.name}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Electronic prescriptions generated during clinical consultations with auto-calculated dosages and timings.
              </p>
            </div>
            <button
              onClick={() => {
                if (searchResult && isConsentApproved) {
                  setShowRxModal(true);
                } else {
                  setActiveDoctorTab('CLINICAL_PORTAL');
                  setSearchError('Search patient UHID and ensure consent is active before creating prescription.');
                }
              }}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <FilePlus className="w-4 h-4" />
              <span>+ Issue New Prescription</span>
            </button>
          </div>

          {data.prescriptions.filter(p => p.doctorId === currentDoctor.id).length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
              <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No prescriptions issued yet.</p>
              <p className="mt-0.5">Search a patient UHID, obtain consent, and issue a prescription during consultation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.prescriptions
                .filter(p => p.doctorId === currentDoctor.id)
                .map(rx => (
                  <div key={rx.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 text-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 text-sm font-bold">Patient UHID: {rx.uhid}</strong>
                          <span className="font-mono text-[11px] text-slate-400">({rx.patientName || 'Patient'})</span>
                        </div>
                        <div className="text-slate-700 mt-1 font-semibold">
                          Diagnosis: <span className="text-teal-900">{rx.diagnosis}</span>
                        </div>
                      </div>
                      <div className="sm:text-right font-mono text-[11px] text-slate-500">
                        <div>Prescribed: {new Date(rx.prescribedAt || rx.createdAt || Date.now()).toLocaleDateString()}</div>
                        <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          rx.pharmacyStatus === 'DISPENSED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          Pharmacy: {rx.pharmacyStatus}
                        </span>
                      </div>
                    </div>

                    {/* Medicines List */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Medicine Name</th>
                            <th className="p-2.5">Dosage</th>
                            <th className="p-2.5">Frequency</th>
                            <th className="p-2.5">Duration</th>
                            <th className="p-2.5">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rx.medicines.map((m, idx) => (
                            <tr key={idx}>
                              <td className="p-2.5 font-bold text-slate-900">{m.medicineName}</td>
                              <td className="p-2.5 font-mono text-slate-700">{m.dosage}</td>
                              <td className="p-2.5 text-slate-700">{m.frequency}</td>
                              <td className="p-2.5 font-mono text-slate-700">{m.durationDays} Days</td>
                              <td className="p-2.5 text-slate-500">{m.timingRelation} · {m.instructions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {rx.clinicalNotes && (
                      <div className="text-[11px] text-slate-600">
                        <strong>Advice:</strong> {rx.clinicalNotes}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* REQUEST CONSENT MODAL */}
      {showConsentModal && searchResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-800" />
                <span>Request Patient Medical Consent</span>
              </h3>
              <button onClick={() => setShowConsentModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Requesting access for: <strong className="text-slate-900">{searchResult.maskedName}</strong> ({searchResult.uhid})
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Clinical Reason for Access:
              </label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                placeholder="e.g. Consultation for persistent headache and neurological review"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Requested Information Scopes:
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'BASIC_PROFILE', label: 'Basic Patient Demographics' },
                  { id: 'LAB_REPORTS', label: 'Laboratory & Diagnostic Reports' },
                  { id: 'MEDICAL_HISTORY', label: 'Medical History & Allergies' },
                  { id: 'PRESCRIPTIONS', label: 'Past Prescriptions & Medications' },
                  { id: 'FULL_RECORD', label: 'Full Clinical Record' }
                ].map(s => (
                  <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requestedScopes.includes(s.id as any)}
                      onChange={(e) => {
                        if (e.target.checked) setRequestedScopes([...requestedScopes, s.id as any]);
                        else setRequestedScopes(requestedScopes.filter(sc => sc !== s.id));
                      }}
                      className="rounded text-teal-800"
                    />
                    <span className="text-slate-800">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Requested Validity Duration:
              </label>
              <select
                value={requestedDuration}
                onChange={(e) => setRequestedDuration(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="1_HOUR">1 Hour (Single Check)</option>
                <option value="THIS_CONSULTATION">This Consultation Session</option>
                <option value="24_HOURS">24 Hours</option>
                <option value="7_DAYS">7 Days (Follow-up)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowConsentModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSendConsentRequest}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg text-xs transition-colors"
              >
                Dispatch Consent Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PRESCRIPTION MODAL */}
      {showRxModal && searchResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-emerald-800" />
                <span>Issue Electronic Prescription</span>
              </h3>
              <button onClick={() => setShowRxModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500">Patient:</span> <strong>{searchResult.patientName}</strong>
              </div>
              <div>
                <span className="text-slate-500">UHID:</span> <span className="font-mono font-bold">{searchResult.uhid}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Diagnosis / Clinical Impression:</label>
              <input
                type="text"
                value={rxDiagnosis}
                onChange={(e) => setRxDiagnosis(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Clinical Notes & Patient Advice:</label>
              <textarea
                value={rxNotes}
                onChange={(e) => setRxNotes(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Medicines List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase font-mono">
                  Prescribed Medicines (Auto-generates Reminders)
                </label>
                <button
                  type="button"
                  onClick={handleAddMedicineRow}
                  className="text-xs text-teal-800 hover:text-teal-900 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medicine
                </button>
              </div>

              {rxMedicines.map((med, index) => (
                <div key={med.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Medicine #{index + 1}</span>
                    {rxMedicines.length > 1 && (
                      <button
                        onClick={() => handleRemoveMedicineRow(med.id)}
                        className="text-rose-600 hover:text-rose-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500">Medicine Name:</span>
                      <input
                        type="text"
                        value={med.medicineName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRxMedicines(prev => prev.map(m => m.id === med.id ? { ...m, medicineName: val } : m));
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Dosage:</span>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRxMedicines(prev => prev.map(m => m.id === med.id ? { ...m, dosage: val } : m));
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Duration (Days):</span>
                      <input
                        type="number"
                        value={med.durationDays}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setRxMedicines(prev => prev.map(m => m.id === med.id ? { ...m, durationDays: val } : m));
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500">Timings (e.g. 08:00 AM, 08:00 PM):</span>
                      <input
                        type="text"
                        value={med.timings.join(', ')}
                        onChange={(e) => {
                          const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          setRxMedicines(prev => prev.map(m => m.id === med.id ? { ...m, timings: val } : m));
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Food Relation:</span>
                      <select
                        value={med.timingRelation}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setRxMedicines(prev => prev.map(m => m.id === med.id ? { ...m, timingRelation: val } : m));
                        }}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="After food">After food</option>
                        <option value="Before food">Before food</option>
                        <option value="With food">With food</option>
                        <option value="Empty stomach">Empty stomach</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowRxModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrescription}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
              >
                Generate & Dispatch Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFERRAL MODAL */}
      {showReferralModal && searchResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-teal-800" />
                <span>Refer Patient to Colleague</span>
              </h3>
              <button onClick={() => setShowReferralModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Note: The receiving doctor will still require explicit patient consent before accessing protected clinical records.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Select Receiving Doctor:</label>
              <select
                value={refDoctorId}
                onChange={(e) => setRefDoctorId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                {data.doctors.filter(d => d.id !== currentDoctor.id).map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization} · {d.hospital})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Referral Reason & Clinical Notes:</label>
              <textarea
                value={refReason}
                onChange={(e) => setRefReason(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowReferralModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReferralModal(false);
                  setRequestSuccessMsg('Referral created. Receiving doctor alerted.');
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs"
              >
                Submit Referral
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Access Protocol Modal */}
      {showEmergencyModal && searchResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-rose-300">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Emergency Access Protocol</h3>
                  <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wide">Statutory Medical Override</span>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Mandatory Legal & Audit Disclosure:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Emergency access temporarily bypasses normal patient consent for acute trauma or unconscious emergency cases. This override is permanently and immutably recorded in the Audit Log with your clinician identity, facility, exact timestamp, and documented justification.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Patient UHID:</label>
                <input
                  type="text"
                  readOnly
                  value={searchResult.uhid}
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emergency Medical Justification (Required):</label>
                <textarea
                  rows={3}
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  placeholder="Document clinical trauma, unconsciousness, or urgent medical necessity..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Practitioner Identity:</span>
                  <strong className="text-slate-800 font-mono">{currentDoctor.name} ({currentDoctor.licenseNumber})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Facility Location:</span>
                  <strong className="text-slate-800 font-mono">{emergencyFacility}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Override Duration:</span>
                  <strong className="text-slate-800 font-mono">2 Hours (Auto-Expiry)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Audit Tracking:</span>
                  <strong className="text-rose-700 font-mono">Full Record Scope + SMS Alert</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const res = requestEmergencyAccess(searchResult.uhid, emergencyReason, emergencyFacility);
                  if (res.success) {
                    setRequestSuccessMsg(`🚨 Emergency access authorized. Override active for 2 hours. Event logged in audit register.`);
                    setShowEmergencyModal(false);
                    if (res.consent) {
                      setSearchResult(prev => prev ? {
                        ...prev,
                        hasActiveConsent: true,
                        activeConsentId: res.consent?.id,
                        activeScopes: res.consent?.accessScope || ['FULL_RECORD'],
                        expiresAt: res.consent?.expiresAt,
                        maskedName: prev.patientName
                      } : null);
                    }
                  } else {
                    setSearchError(res.error || 'Failed to trigger emergency override.');
                  }
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-rose-200" />
                <span>Confirm Emergency Override & Enter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
