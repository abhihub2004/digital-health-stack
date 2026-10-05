import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ConsentModal } from './components/common/ConsentModal';
import { SymptomTriageModal } from './components/triage/SymptomTriageModal';
import { AppointmentBookingModal } from './components/patient/AppointmentBookingModal';
import { AcceptanceWalkthroughModal } from './components/demo/AcceptanceWalkthroughModal';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { PatientAppointmentsView } from './components/patient/PatientAppointmentsView';
import { PatientPrescriptionsView } from './components/patient/PatientPrescriptionsView';
import { PatientLabReportsView } from './components/patient/PatientLabReportsView';
import { PatientConsentView } from './components/patient/PatientConsentView';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { DiagnosticCentreDashboard } from './components/lab/DiagnosticCentreDashboard';
import { PharmacyDashboard } from './components/pharmacy/PharmacyDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { BloodBankView } from './components/patient/BloodBankView';
import { LoginPortal } from './components/auth/LoginPortal';
import { SupportModal } from './components/common/SupportModal';
import { Lock, FileText, Pill, Calendar, User, ShieldCheck } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentRole, currentPatient, currentDoctor, currentLab, currentPharmacy, isAuthenticated } = useApp();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals state
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [activeConsentModalId, setActiveConsentModalId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Automatically adjust activeTab if the new role does not support it
  React.useEffect(() => {
    const roleTabs: Record<string, string[]> = {
      PATIENT: ['dashboard', 'appointments', 'prescriptions', 'lab_reports', 'consent_center', 'blood_bank', 'ai_triage', 'profile', 'settings'],
      DOCTOR: ['dashboard', 'appointments', 'queue', 'uhid_search', 'prescriptions', 'cds_alerts', 'blood_bank', 'profile', 'settings'],
      ADMIN: ['dashboard', 'appointments', 'verifications', 'audit_logs', 'fraud_monitor', 'blood_bank', 'profile', 'settings'],
      LAB: ['dashboard', 'lab_reports', 'blood_bank', 'profile', 'settings'],
      PHARMACY: ['dashboard', 'prescriptions', 'blood_bank', 'profile', 'settings']
    };

    const validTabs = roleTabs[currentRole] || ['dashboard'];
    if (!validTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentRole]);

  const handleOpenConsent = (consentId: string) => {
    setActiveConsentModalId(consentId);
  };

  // If user is not authenticated or explicitly wants the 3-login portal
  if (!isAuthenticated || showLoginModal) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
        <LoginPortal
          onSuccess={() => setShowLoginModal(false)}
          onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
        />

        <AcceptanceWalkthroughModal
          isOpen={isWalkthroughOpen}
          onClose={() => setIsWalkthroughOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans selection:bg-blue-100 selection:text-blue-900 antialiased">
      {/* 1. Left Sidebar matching image.png */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTriage={() => setIsTriageOpen(true)}
        onOpenBooking={() => setIsBookingOpen(true)}
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header matching image.png */}
        <TopHeader
          activeTab={activeTab}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
          onOpenTriage={() => setIsTriageOpen(true)}
          onOpenLogin={() => setShowLoginModal(true)}
          onNavigateTab={setActiveTab}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {/* Patient Views */}
          {currentRole === 'PATIENT' && (
            <>
              {activeTab === 'dashboard' && (
                <PatientDashboard
                  onOpenBooking={() => setIsBookingOpen(true)}
                  onOpenTriage={() => setIsTriageOpen(true)}
                  onOpenConsentModal={handleOpenConsent}
                  activeNavTab={activeTab}
                  setActiveNavTab={setActiveTab}
                />
              )}

              {activeTab === 'appointments' && (
                <PatientAppointmentsView
                  onOpenBooking={() => setIsBookingOpen(true)}
                  onOpenConsentModal={handleOpenConsent}
                />
              )}

              {activeTab === 'prescriptions' && (
                <PatientPrescriptionsView />
              )}

              {activeTab === 'lab_reports' && (
                <PatientLabReportsView />
              )}

              {activeTab === 'consent_center' && (
                <PatientConsentView
                  onOpenConsentModal={handleOpenConsent}
                />
              )}

              {activeTab === 'blood_bank' && <BloodBankView />}

              {(activeTab === 'profile' || activeTab === 'settings') && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-6 max-w-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl">
                      {currentPatient?.fullName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{currentPatient?.fullName}</h2>
                      <div className="font-mono text-xs font-bold text-blue-600 mt-0.5">{currentPatient?.uhid}</div>
                      <span className="text-xs text-slate-400">Registered Patient Profile</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Age / Gender:</span>
                      <strong className="text-slate-900 font-mono">{currentPatient?.age} Yrs · {currentPatient?.gender}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Blood Group:</span>
                      <strong className="text-slate-900 font-mono">{currentPatient?.bloodGroup}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Mobile:</span>
                      <strong className="text-slate-900 font-mono">{currentPatient?.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Emergency Contact:</span>
                      <strong className="text-slate-900">{currentPatient?.emergencyContact.name} ({currentPatient?.emergencyContact.phone})</strong>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-slate-400 block text-xs mb-1">Documented Drug Allergies:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPatient?.allergies.map(a => (
                        <span key={a} className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Doctor Views */}
          {currentRole === 'DOCTOR' && (
            <>
              {activeTab === 'blood_bank' ? (
                <BloodBankView />
              ) : (activeTab === 'profile' || activeTab === 'settings') ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-6 max-w-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold text-2xl">
                      {currentDoctor?.name.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{currentDoctor?.name}</h2>
                      <div className="font-mono text-xs font-bold text-teal-700 mt-0.5">{currentDoctor?.licenseNumber}</div>
                      <span className="text-xs text-slate-400">{currentDoctor?.specialization} · {currentDoctor?.hospital}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-100 font-mono">
                    <div>
                      <span className="text-slate-400 block font-sans">Consultation Fee:</span>
                      <strong className="text-slate-900 font-bold">₹{currentDoctor?.consultationFee}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">Practitioner Rating:</span>
                      <strong className="text-slate-900 font-bold">★ {currentDoctor?.rating} / 5.0</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">Qualifications:</span>
                      <strong className="text-slate-900 font-bold">{currentDoctor?.qualifications}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">Verified Status:</span>
                      <strong className="text-emerald-700 font-bold">LICENSED PRACTITIONER</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <DoctorDashboard
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              )}
            </>
          )}

          {/* Admin Views */}
          {currentRole === 'ADMIN' && (
            <>
              {activeTab === 'blood_bank' ? (
                <BloodBankView />
              ) : (
                <AdminDashboard
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              )}
            </>
          )}

          {/* Facility Views */}
          {currentRole === 'LAB' && (
            <>
              {activeTab === 'blood_bank' ? (
                <BloodBankView />
              ) : (activeTab === 'profile' || activeTab === 'settings') ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4 max-w-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-2xl">
                      {currentLab?.name.charAt(0) || 'L'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{currentLab?.name}</h2>
                      <div className="font-mono text-xs font-bold text-emerald-700 mt-0.5">License: {currentLab?.licenseNumber}</div>
                      <span className="text-xs text-slate-400">Accredited by {currentLab?.accreditedBy}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 text-xs text-slate-600">
                    <span className="font-bold text-slate-900">Address:</span> {currentLab?.address}
                  </div>
                </div>
              ) : (
                <DiagnosticCentreDashboard />
              )}
            </>
          )}

          {currentRole === 'PHARMACY' && (
            <>
              {activeTab === 'blood_bank' ? (
                <BloodBankView />
              ) : (activeTab === 'profile' || activeTab === 'settings') ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4 max-w-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-800 text-white flex items-center justify-center font-bold text-2xl">
                      {currentPharmacy?.name.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{currentPharmacy?.name}</h2>
                      <div className="font-mono text-xs font-bold text-amber-700 mt-0.5">License: {currentPharmacy?.licenseNumber}</div>
                      <span className="text-xs text-slate-400">Pharmacist: {currentPharmacy?.pharmacistInCharge}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <PharmacyDashboard />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenConsentModal={handleOpenConsent}
      />

      <SymptomTriageModal
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
      />

      <AppointmentBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      <AcceptanceWalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
      />

      {activeConsentModalId && (
        <ConsentModal
          consentId={activeConsentModalId}
          onClose={() => setActiveConsentModalId(null)}
        />
      )}

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
