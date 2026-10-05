import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Building,
  Microscope,
  Pill,
  Lock,
  Check,
  X,
  History,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Search,
  Clock,
  MapPin
} from 'lucide-react';
import { BloodBankView } from '../patient/BloodBankView';

interface AdminDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab = 'dashboard',
  setActiveTab
}) => {
  const { data, verifyProvider, resetSystemData, updateAppointmentStatus } = useApp();

  const getInitialTab = (): 'APPOINTMENTS' | 'VERIFICATIONS' | 'AUDIT_LOGS' | 'FRAUD_MONITOR' => {
    if (activeTab === 'appointments') return 'APPOINTMENTS';
    if (activeTab === 'audit_logs') return 'AUDIT_LOGS';
    if (activeTab === 'fraud_monitor') return 'FRAUD_MONITOR';
    return 'VERIFICATIONS';
  };

  const [activeAdminTab, setActiveAdminTab] = useState<'APPOINTMENTS' | 'VERIFICATIONS' | 'AUDIT_LOGS' | 'FRAUD_MONITOR'>(getInitialTab);
  const [aptStatusFilter, setAptStatusFilter] = useState<'ALL' | 'EMERGENCY' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [aptSearchQuery, setAptSearchQuery] = useState('');

  React.useEffect(() => {
    if (activeTab === 'appointments') setActiveAdminTab('APPOINTMENTS');
    else if (activeTab === 'verifications') setActiveAdminTab('VERIFICATIONS');
    else if (activeTab === 'audit_logs') setActiveAdminTab('AUDIT_LOGS');
    else if (activeTab === 'fraud_monitor') setActiveAdminTab('FRAUD_MONITOR');
    else if (activeTab === 'dashboard') setActiveAdminTab('VERIFICATIONS');
  }, [activeTab]);

  if (activeTab === 'blood_bank') {
    return <BloodBankView />;
  }

  // Suspicious queries / security alerts
  const blockedAttempts = data.accessLogs.filter(l => !l.accessGranted);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-900 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
            <ShieldCheck className="w-7 h-7 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">HealthStack Platform Administrator</h1>
              <span className="text-xs font-mono bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full font-bold">
                System Governance
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Practitioner Licensing, Diagnostic Accreditation, and Immutable Security Audit Logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetSystemData}
            className="px-3.5 py-2 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-medium overflow-x-auto">
        {[
          { id: 'APPOINTMENTS', label: `Appointments Roster (${data.appointments.length})` },
          { id: 'VERIFICATIONS', label: 'Practitioner & Facility Verifications' },
          { id: 'AUDIT_LOGS', label: `System-Wide Audit Trail (${data.accessLogs.length})` },
          { id: 'FRAUD_MONITOR', label: `Abuse & Blocked Access Alerts (${blockedAttempts.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveAdminTab(tab.id as any);
              if (tab.id === 'APPOINTMENTS') setActiveTab?.('appointments');
              else if (tab.id === 'VERIFICATIONS') setActiveTab?.('verifications');
              else if (tab.id === 'AUDIT_LOGS') setActiveTab?.('audit_logs');
              else if (tab.id === 'FRAUD_MONITOR') setActiveTab?.('fraud_monitor');
            }}
            className={`px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap ${
              activeAdminTab === tab.id ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 0: SYSTEM-WIDE APPOINTMENTS ROSTER */}
      {activeAdminTab === 'APPOINTMENTS' && (() => {
        const filtered = data.appointments.filter(apt => {
          if (aptStatusFilter === 'EMERGENCY' && !apt.isEmergency) return false;
          if (aptStatusFilter === 'CONFIRMED' && apt.status !== 'CONFIRMED' && apt.status !== 'SCHEDULED' && apt.status !== 'IN_QUEUE') return false;
          if (aptStatusFilter === 'COMPLETED' && apt.status !== 'COMPLETED') return false;
          if (aptStatusFilter === 'CANCELLED' && apt.status !== 'CANCELLED') return false;

          if (aptSearchQuery.trim()) {
            const q = aptSearchQuery.toLowerCase();
            const matchPatient = apt.patientName.toLowerCase().includes(q) || apt.uhid.toLowerCase().includes(q);
            const matchDoc = apt.doctorName.toLowerCase().includes(q);
            const matchHosp = apt.hospital.toLowerCase().includes(q);
            return matchPatient || matchDoc || matchHosp;
          }
          return true;
        });

        const emergencyCount = data.appointments.filter(a => a.isEmergency).length;
        const activeCount = data.appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'SCHEDULED' || a.status === 'IN_QUEUE' || a.status === 'IN_CONSULTATION').length;
        const completedCount = data.appointments.filter(a => a.status === 'COMPLETED').length;

        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-900" />
                  <span>National Health Stack — Clinical Consultation Roster</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete ledger of patient bookings, queue tokens, practitioner assignments, and emergency prioritizations.
                </p>
              </div>
              <span className="font-mono text-xs bg-purple-50 text-purple-900 px-3 py-1.5 rounded-lg font-bold border border-purple-200 self-start sm:self-auto">
                {data.appointments.length} Total Bookings Recorded
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-slate-500 text-xs font-medium block">Active in Clinical Queues</span>
                <div className="text-2xl font-mono font-bold text-blue-600 mt-0.5">{activeCount}</div>
                <span className="text-[11px] text-slate-400 block mt-0.5">Scheduled or consulting</span>
              </div>
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
                <span className="text-rose-700 text-xs font-medium block">Critical / Emergency Flagged</span>
                <div className="text-2xl font-mono font-bold text-rose-700 mt-0.5">{emergencyCount}</div>
                <span className="text-[11px] text-rose-600 block mt-0.5">Transfusion or acute distress</span>
              </div>
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <span className="text-emerald-700 text-xs font-medium block">Completed Consultations</span>
                <div className="text-2xl font-mono font-bold text-emerald-700 mt-0.5">{completedCount}</div>
                <span className="text-[11px] text-emerald-600 block mt-0.5">Full audit trail preserved</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setAptStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    aptStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({data.appointments.length})
                </button>
                <button
                  onClick={() => setAptStatusFilter('CONFIRMED')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    aptStatusFilter === 'CONFIRMED' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active / In Queue ({activeCount})
                </button>
                <button
                  onClick={() => setAptStatusFilter('EMERGENCY')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    aptStatusFilter === 'EMERGENCY' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Emergency ({emergencyCount})
                </button>
                <button
                  onClick={() => setAptStatusFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    aptStatusFilter === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Completed ({completedCount})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={aptSearchQuery}
                  onChange={(e) => setAptSearchQuery(e.target.value)}
                  placeholder="Search patient, UHID, doctor..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-700"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-mono text-[11px]">
                  <tr>
                    <th className="p-3">Token & Time</th>
                    <th className="p-3">Patient (UHID)</th>
                    <th className="p-3">Practitioner & Specialty</th>
                    <th className="p-3">Facility</th>
                    <th className="p-3">Reason / Chief Complaint</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No appointments match current filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(apt => (
                      <tr key={apt.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono">
                          <span className="font-bold text-purple-900 block">Token #{apt.tokenNumber}</span>
                          <span className="text-slate-400 text-[11px]">{apt.date} · {apt.time}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{apt.patientName}</span>
                          <span className="font-mono text-[11px] text-blue-600">{apt.uhid}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{apt.doctorName}</span>
                          <span className="text-slate-500 text-[11px]">{apt.doctorSpecialty}</span>
                        </td>
                        <td className="p-3 text-slate-600 text-[11px]">
                          {apt.hospital}
                        </td>
                        <td className="p-3">
                          <span className="text-slate-700 block truncate max-w-xs">{apt.reasonForVisit}</span>
                          {apt.isEmergency && (
                            <span className="mt-0.5 inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              EMERGENCY PRIORITY
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                            apt.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : apt.status === 'CANCELLED'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB 1: VERIFICATIONS */}
      {activeAdminTab === 'VERIFICATIONS' && (
        <div className="space-y-6">
          {/* Doctors */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-800" />
              <span>Medical Practitioners (Doctors)</span>
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {data.doctors.map(doc => (
                <div key={doc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 text-sm">{doc.name}</strong>
                      <span className="font-mono text-slate-500 text-[11px]">({doc.licenseNumber})</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">{doc.specialization} · {doc.hospital}</div>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">{doc.qualifications}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                      doc.isVerified ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {doc.isVerified ? 'LICENSED' : 'PENDING'}
                    </span>
                    <button
                      onClick={() => verifyProvider('DOCTOR', doc.id, !doc.isVerified)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                        doc.isVerified ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-teal-800 text-white hover:bg-teal-900'
                      }`}
                    >
                      {doc.isVerified ? 'Revoke License' : 'Verify & Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Laboratories & Diagnostic Centres */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Microscope className="w-4 h-4 text-emerald-800" />
              <span>Diagnostic Centres & Laboratories</span>
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {data.labs.map(lab => (
                <div key={lab.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <strong className="text-slate-900 text-sm">{lab.name}</strong>
                    <div className="text-slate-600 mt-0.5">{lab.accreditedBy} · License: {lab.licenseNumber}</div>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">{lab.address}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                      lab.isVerified ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {lab.isVerified ? 'ACCREDITED' : 'UNDER REVIEW'}
                    </span>
                    <button
                      onClick={() => verifyProvider('LAB', lab.id, !lab.isVerified)}
                      className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Toggle Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM-WIDE AUDIT TRAIL */}
      {activeAdminTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-800" />
              <span>Immutable System Access Log Register</span>
            </h3>
            <span className="font-mono text-xs text-slate-500">{data.accessLogs.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">Actor</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Target UHID</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">IP Address</th>
                  <th className="p-2.5">Access Granted?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.accessLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">{log.actorName}</td>
                    <td className="p-2.5 text-slate-600">{log.actorRole}</td>
                    <td className="p-2.5 font-bold text-teal-900">{log.patientUhid}</td>
                    <td className="p-2.5 font-semibold text-slate-800">{log.action}</td>
                    <td className="p-2.5 text-slate-400">{log.ipAddress}</td>
                    <td className="p-2.5">
                      {log.accessGranted ? (
                        <span className="text-emerald-700 font-bold">ALLOWED</span>
                      ) : (
                        <span className="text-rose-700 font-bold">BLOCKED (403)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ABUSE & BLOCKED ATTEMPTS */}
      {activeAdminTab === 'FRAUD_MONITOR' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <span>Security Intrusion & Unauthorized Probes Monitor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every unauthorized attempt to bypass patient consent is intercepted and logged.
              </p>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full font-bold">
              {blockedAttempts.length} Incidents Intercepted
            </span>
          </div>

          {blockedAttempts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No blocked access attempts detected.
            </div>
          ) : (
            <div className="space-y-3">
              {blockedAttempts.map(att => (
                <div key={att.id} className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <strong className="text-rose-900 text-sm font-sans">{att.action}</strong>
                    <span className="text-slate-400 text-[11px]">{new Date(att.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-700 font-sans">
                    <strong>Practitioner:</strong> {att.actorName} ({att.actorRole}) · <strong>Patient UHID:</strong> {att.patientUhid}
                  </div>
                  <div className="text-slate-600 font-sans italic">
                    Reason logged: "{att.reason}"
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-rose-100 flex items-center justify-between">
                    <span>Target: {att.resource}</span>
                    <span>Origin: {att.ipAddress}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
