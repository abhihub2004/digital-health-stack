import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Bell,
  Activity,
  UserCheck,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  LogOut,
  LogIn
} from 'lucide-react';

interface HeaderProps {
  onOpenTriage: () => void;
  onOpenNotifications: () => void;
  onOpenWalkthrough: () => void;
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTriage,
  onOpenNotifications,
  onOpenWalkthrough,
  onOpenLogin
}) => {
  const {
    currentUser,
    currentRole,
    data,
    switchUser,
    unreadNotifsCount,
    resetSystemData,
    isAuthenticated,
    logout
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roleLabels: Record<string, { label: string; desc: string }> = {
    PATIENT: { label: 'Patient Portal', desc: 'Arun Kumar · UHID-ACEA-031D' },
    DOCTOR: { label: 'Doctor Clinical Desk', desc: 'Dr. Rahul Sharma · Neurology' },
    LAB: { label: 'Diagnostic Laboratory', desc: 'Apex Diagnostic Centre (NABL)' },
    PHARMACY: { label: 'Pharmacy Dispensary', desc: 'CityMed Central Pharmacy' },
    ADMIN: { label: 'System Administrator', desc: 'National Health Stack Admin' }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Wordmark Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <ShieldCheck className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                Digital Health Stack
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Consent-Governed Health Network
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links / Fast Switchers */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {data.users.slice(0, 5).map(u => {
              const isActive = u.id === currentUser.id;
              const shortRole = u.role === 'PATIENT' ? 'Patient' :
                                u.role === 'DOCTOR' ? 'Doctor' :
                                u.role === 'LAB' ? 'Lab / OCR' :
                                u.role === 'PHARMACY' ? 'Pharmacy' : 'Admin';
              return (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    isActive && isAuthenticated
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {shortRole}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2">
            {/* Interactive Walkthrough Demo */}
            <button
              onClick={onOpenWalkthrough}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap"
              title="Run interactive 10-step Privacy & Consent Demonstration"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Consent Test Walkthrough</span>
            </button>

            {/* AI Symptom Triage Button */}
            <button
              onClick={onOpenTriage}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Symptom Triage</span>
            </button>

            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Notifications & SMS/WhatsApp Alerts"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-teal-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                {/* Role Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-xs">
                      <div className="font-semibold text-slate-800 truncate max-w-[120px]">{currentUser.name}</div>
                      <div className="text-[11px] text-teal-800 font-mono font-medium">{roleLabels[currentRole]?.label}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {roleMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <div className="text-xs font-semibold text-slate-400">Switch Active Identity</div>
                        <div className="text-xs text-slate-500 mt-0.5">Test real RBAC permissions & consent limits</div>
                      </div>
                      {data.users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setRoleMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                            u.id === currentUser.id ? 'bg-teal-50 text-teal-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-500">{roleLabels[u.role]?.label}</div>
                          </div>
                          <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {u.role}
                          </span>
                        </button>
                      ))}
                      <div className="border-t border-slate-100 mt-2 pt-2 space-y-1">
                        <button
                          onClick={() => {
                            logout();
                            setRoleMenuOpen(false);
                            if (onOpenLogin) onOpenLogin();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5 text-slate-500" />
                          <span>Log Out / Switch Login Portal</span>
                        </button>
                        <button
                          onClick={() => {
                            resetSystemData();
                            setRoleMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Demo Data to Initial</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Log Out Button */}
                <button
                  onClick={() => {
                    logout();
                    if (onOpenLogin) onOpenLogin();
                  }}
                  className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Log out and return to 3-login selection portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* If Not Authenticated */
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white rounded-lg transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-teal-200" />
                <span>3 Logins Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
