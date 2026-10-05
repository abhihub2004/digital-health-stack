import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  Pill,
  FileText,
  Droplet,
  HeartPulse,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Lock,
  Search,
  Users,
  ShieldAlert,
  Sparkles,
  Layers
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTriage: () => void;
  onOpenBooking: () => void;
  onOpenLogin: () => void;
  onOpenSupport?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenTriage,
  onOpenBooking,
  onOpenLogin,
  onOpenSupport
}) => {
  const { currentRole, currentUser, logout, currentPatient } = useApp();

  // Patient Nav Items (matching image.png)
  const patientMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'lab_reports', label: 'Lab Reports', icon: FileText },
    { id: 'consent_center', label: 'Consent Center', icon: Lock },
    { id: 'blood_bank', label: 'Blood Bank', icon: Droplet },
    { id: 'ai_triage', label: 'AI Health Assistant', icon: HeartPulse }
  ];

  // Doctor Nav Items
  const doctorMenuItems = [
    { id: 'dashboard', label: 'Doctor Desk', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments & Queue', icon: Calendar },
    { id: 'uhid_search', label: 'UHID Directory', icon: Search },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'cds_alerts', label: 'CDS Advisories', icon: HeartPulse },
    { id: 'blood_bank', label: 'Blood Bank', icon: Droplet }
  ];

  // Admin Nav Items
  const adminMenuItems = [
    { id: 'dashboard', label: 'Admin Console', icon: LayoutDashboard },
    { id: 'appointments', label: 'Appointments Roster', icon: Calendar },
    { id: 'verifications', label: 'Verifications', icon: ShieldCheck },
    { id: 'audit_logs', label: 'Audit Trail', icon: FileText },
    { id: 'fraud_monitor', label: 'Security Monitor', icon: ShieldAlert },
    { id: 'blood_bank', label: 'Blood Bank', icon: Droplet }
  ];

  // Facility Nav Items (Lab)
  const labMenuItems = [
    { id: 'dashboard', label: 'Diagnostic Desk', icon: LayoutDashboard },
    { id: 'lab_reports', label: 'Reports & OCR', icon: FileText },
    { id: 'blood_bank', label: 'Blood Bank', icon: Droplet }
  ];

  // Facility Nav Items (Pharmacy)
  const pharmacyMenuItems = [
    { id: 'dashboard', label: 'Pharmacy Desk', icon: LayoutDashboard },
    { id: 'prescriptions', label: 'Prescription Orders', icon: Pill },
    { id: 'blood_bank', label: 'Blood Bank', icon: Droplet }
  ];

  const menuItems = currentRole === 'PATIENT' ? patientMenuItems :
                    currentRole === 'DOCTOR' ? doctorMenuItems :
                    currentRole === 'ADMIN' ? adminMenuItems :
                    currentRole === 'LAB' ? labMenuItems : pharmacyMenuItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-30">
      <div className="p-5 flex flex-col h-full overflow-y-auto">
        {/* Brand Lockup matching image.png */}
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              <path d="M8 12h2.5l1.5-3 2 6 1.5-3H16" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
              HealthStack
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Digital Healthcare
            </span>
          </div>
        </div>

        {/* Section: MAIN MENU */}
        <div className="mt-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-mono">
            MAIN MENU
          </div>
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'ai_triage') {
                      onOpenTriage();
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section: ACCOUNT */}
        <div className="mt-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-mono">
            ACCOUNT
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom Help Box & Sign Out matching image.png */}
        <div className="mt-auto pt-6 space-y-3">
          {/* Need Help? Box (Interactive) */}
          <button
            onClick={onOpenSupport}
            className="w-full text-left p-3.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100 hover:border-blue-200 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
            title="Click to talk to support or view help center"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100/80 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Need Help?</div>
                <div className="text-[11px] text-slate-500">Talk to support</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Sign Out Button */}
          <button
            onClick={() => {
              logout();
              onOpenLogin();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
