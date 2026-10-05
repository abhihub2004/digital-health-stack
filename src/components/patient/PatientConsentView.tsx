import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Check,
  X,
  History,
  AlertCircle,
  FileText,
  Stethoscope,
  ChevronRight,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { AccessScope, ConsentDuration } from '../../types';

interface PatientConsentViewProps {
  onOpenConsentModal: (consentId: string) => void;
}

export const PatientConsentView: React.FC<PatientConsentViewProps> = ({
  onOpenConsentModal
}) => {
  const {
    currentPatient,
    data,
    activeConsents,
    pendingConsentRequestsForMe,
    revokeConsent,
    respondConsent
  } = useApp();

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!currentPatient) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
        Please sign in to view consent controls.
      </div>
    );
  }

  const myActiveConsents = activeConsents.filter(c => c.patientId === currentPatient.id);
  const myAccessLogs = data.accessLogs.filter(
    l => l.patientId === currentPatient.id || l.patientUhid === currentPatient.uhid
  );

  const handleRevoke = (id: string, docName: string) => {
    revokeConsent(id, 'Revoked by patient via consent manager');
    setActionSuccess(`Access rights for ${docName} have been revoked immediately.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleQuickApprove = (id: string) => {
    respondConsent(id, 'ALLOW');
    setActionSuccess('Access granted to doctor for this consultation.');
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleQuickDeny = (id: string) => {
    respondConsent(id, 'DENY');
    setActionSuccess('Access request denied. Doctor cannot access records.');
    setTimeout(() => setActionSuccess(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Patient Privacy & Consent Center</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-100 text-teal-900">
                {myActiveConsents.length} Active Authorizations
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Granular access control: doctors cannot browse your health record without your active consent.
            </p>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* PRIVACY CONSTITUTION CARD */}
      <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-5 text-xs text-teal-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-2 text-teal-900 text-sm">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Privacy Rule: UHID Does Not Equal Access</span>
          </div>
          <p className="text-slate-600 leading-relaxed max-w-2xl">
            A doctor knowing your UHID (<strong className="font-mono text-slate-800">{currentPatient.uhid}</strong>) only sees <em>"Patient found"</em>.
            Your medical history, diagnostic reports, and prescriptions remain sealed until you explicitly click <strong>ALLOW</strong>.
          </p>
        </div>
      </div>

      {/* 1. PENDING CONSENT REQUESTS */}
      {pendingConsentRequestsForMe.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
            <h3 className="text-base font-bold text-slate-900">
              Pending Doctor Access Requests ({pendingConsentRequestsForMe.length})
            </h3>
          </div>

          <div className="space-y-3">
            {pendingConsentRequestsForMe.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-amber-200 p-5 shadow-2xs space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <strong className="text-slate-900 text-sm block font-bold">{req.doctorName}</strong>
                    <span className="text-slate-500 font-medium">{req.doctorSpecialty} · {req.hospital}</span>
                    <div className="mt-1 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">Clinical Justification / Reason:</span>
                      <strong className="text-slate-800 font-medium block mt-0.5">"{req.reason}"</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleQuickDeny(req.id)}
                      className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl font-bold transition-colors"
                    >
                      Deny
                    </button>
                    <button
                      onClick={() => onOpenConsentModal(req.id)}
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Review & Allow Access</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Requested Scopes:</span>
                  <div className="flex flex-wrap gap-1">
                    {req.accessScope.map(sc => (
                      <span key={sc} className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-mono">
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ACTIVE AUTHORIZED CONSENTS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-800" />
              <span>Active Doctor Consents</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Doctors currently authorized to access selected parts of your medical record.
            </p>
          </div>
          <span className="px-3 py-1 bg-teal-50 text-teal-900 font-mono text-xs font-bold rounded-xl">
            {myActiveConsents.length} Granted
          </span>
        </div>

        {myActiveConsents.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
            <Lock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-bold text-slate-700">No doctors currently hold active consent.</p>
            <p className="mt-0.5">Your entire health history, lab reports, and prescriptions are completely sealed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myActiveConsents.map(c => (
              <div
                key={c.id}
                className="p-5 rounded-2xl border border-teal-200 bg-teal-50/20 text-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <strong className="text-slate-900 text-sm block font-bold">{c.doctorName}</strong>
                      <span className="text-slate-500">{c.doctorSpecialty} · {c.hospital}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>

                  <div className="text-slate-600 bg-white p-2.5 rounded-xl border border-teal-100">
                    <span className="text-slate-400 text-[11px] block">Approved Scope:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.accessScope.map(sc => (
                        <span key={sc} className="px-2 py-0.5 bg-teal-50 text-teal-900 border border-teal-200 rounded font-mono text-[10px]">
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    <span>Reason: <em>"{c.reason}"</em></span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-teal-100">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Expires: {c.expiresAt ? new Date(c.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Consultation'}
                  </span>
                  <button
                    onClick={() => handleRevoke(c.id, c.doctorName)}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-colors"
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. IMMUTABLE ACCESS AUDIT TRAIL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <span>Medical Access Audit History</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable ledger tracking every practitioner or facility that requested or viewed your records.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold">
            {myAccessLogs.length} Events Logged
          </span>
        </div>

        {myAccessLogs.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
            No audit records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs bg-white">
              <thead className="bg-slate-50 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Actor / Entity</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myAccessLogs.slice(0, 10).map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <strong className="text-slate-900 block">{log.actorName}</strong>
                      <span className="text-slate-400 text-[11px] font-mono">{log.actorRole}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {log.action}
                    </td>
                    <td className="p-3 text-slate-600">{log.resource}</td>
                    <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate">{log.reason}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          log.accessGranted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.accessGranted ? 'GRANTED' : 'BLOCKED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
