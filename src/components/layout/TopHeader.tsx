import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  User,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  LogOut,
  RotateCcw,
  Activity,
  Layers
} from 'lucide-react';

interface TopHeaderProps {
  activeTab: string;
  onOpenNotifications: () => void;
  onOpenWalkthrough: () => void;
  onOpenTriage: () => void;
  onOpenLogin: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenNotifications,
  onOpenWalkthrough,
  onOpenTriage,
  onOpenLogin,
  onNavigateTab
}) => {
  const {
    currentUser,
    currentRole,
    currentPatient,
    currentDoctor,
    data,
    switchUser,
    logout,
    unreadNotifsCount,
    resetSystemData
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const getBreadcrumbLabel = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'appointments': return 'Appointments';
      case 'prescriptions': return 'Prescriptions';
      case 'lab_reports': return 'Lab Reports & OCR';
      case 'consent_center': return 'Patient Consent Manager';
      case 'blood_bank': return 'Blood Bank';
      case 'uhid_search': return 'UHID Directory Lookup';
      case 'queue': return 'Consultation Queue';
      case 'cds_alerts': return 'Clinical Decision Support';
      case 'verifications': return 'Practitioner Verifications';
      case 'audit_logs': return 'System Audit Trail';
      case 'fraud_monitor': return 'Security & Abuse Monitor';
      case 'profile': return 'My Profile';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const roleLabel = currentRole === 'PATIENT' ? 'Patient' :
                    currentRole === 'DOCTOR' ? 'Doctor' :
                    currentRole === 'ADMIN' ? 'Admin' :
                    currentRole === 'LAB' ? 'Lab Centre' : 'Pharmacy';

  const subLabel = currentRole === 'PATIENT' && currentPatient ? currentPatient.uhid :
                   currentRole === 'DOCTOR' && currentDoctor ? currentDoctor.specialization : 'My Health';

  return (
    <header className="h-18 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumb matching image.png: HealthStack / Dashboard */}
      <div className="flex items-center gap-1.5 text-sm">
        <button
          onClick={() => onNavigateTab?.('dashboard')}
          className="text-slate-400 hover:text-blue-600 font-medium transition-colors"
        >
          HealthStack
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="font-bold text-slate-900 text-base tracking-tight">
          {getBreadcrumbLabel(activeTab)}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Interactive Walkthrough Demo */}
        {currentRole !== 'ADMIN' && (
          <button
            onClick={onOpenWalkthrough}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 rounded-xl hover:bg-blue-100 transition-colors whitespace-nowrap"
            title="Run 10-step Privacy & Consent Verification"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Walkthrough Test</span>
          </button>
        )}



        {/* Exit / Return to First Page Login Portal */}
        <button
          onClick={() => {
            logout();
            onOpenLogin();
          }}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-xl transition-colors cursor-pointer"
          title="Sign out and return to the First Page Login Portal"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-500" />
          <span>Exit / Sign Out</span>
        </button>

        {/* Notification Bell matching image.png */}
        <button
          onClick={onOpenNotifications}
          className="relative w-10 h-10 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* User Profile Pill matching image.png */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-xs">
              <div className="font-bold text-slate-900 leading-tight flex items-center gap-1">
                <span>{roleLabel}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono leading-tight">{subLabel}</div>
            </div>
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
              <div className="p-3 border-b border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                  Logged In Identity
                </span>
                <strong className="text-slate-900 text-sm block mt-0.5">{currentUser.name}</strong>
                <span className="text-slate-500 font-mono text-[11px]">{currentUser.email}</span>
              </div>



              <div className="border-t border-slate-100 pt-1 space-y-1">
                <button
                  onClick={() => {
                    logout();
                    setRoleMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out / Switch Portal</span>
                </button>

                <button
                  onClick={() => {
                    resetSystemData();
                    setRoleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-500 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-[11px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Seed Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
