import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ShieldAlert, X, Check, Stethoscope, Clock, Lock } from 'lucide-react';
import { AccessScope, ConsentDuration } from '../../types';

interface ConsentModalProps {
  consentId: string;
  onClose: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ consentId, onClose }) => {
  const { data, respondConsent } = useApp();
  const consent = data.consents.find(c => c.id === consentId);

  const [selectedScopes, setSelectedScopes] = useState<AccessScope[]>(() => {
    return consent ? consent.accessScope : ['BASIC_PROFILE', 'LAB_REPORTS'];
  });

  const [selectedDuration, setSelectedDuration] = useState<ConsentDuration>(() => {
    return consent ? consent.duration : '24_HOURS';
  });

  if (!consent) return null;

  const scopeOptions: { id: AccessScope; label: string; desc: string }[] = [
    { id: 'BASIC_PROFILE', label: 'Basic Patient Profile', desc: 'Name, age, gender, blood group, emergency contact' },
    { id: 'LAB_REPORTS', label: 'Laboratory Reports', desc: 'Blood counts, biochemistry, thyroid & lipid panels' },
    { id: 'MEDICAL_HISTORY', label: 'Past Medical History', desc: 'Chronic conditions, documented allergies, prior surgeries' },
    { id: 'PRESCRIPTIONS', label: 'Active & Past Prescriptions', desc: 'Medication list, dosages, doctor clinical instructions' },
    { id: 'DIAGNOSTIC_REPORTS', label: 'Diagnostic Imaging & Tests', desc: 'Ultrasound, ECG, radiology examinations' },
    { id: 'FULL_RECORD', label: 'Full Clinical Record (All Data)', desc: 'Complete unrestricted clinical access' }
  ];

  const toggleScope = (scope: AccessScope) => {
    if (scope === 'FULL_RECORD') {
      if (selectedScopes.includes('FULL_RECORD')) {
        setSelectedScopes(['BASIC_PROFILE', 'LAB_REPORTS']);
      } else {
        setSelectedScopes(['FULL_RECORD', 'BASIC_PROFILE', 'LAB_REPORTS', 'MEDICAL_HISTORY', 'PRESCRIPTIONS', 'DIAGNOSTIC_REPORTS']);
      }
      return;
    }

    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scope && s !== 'FULL_RECORD'));
    } else {
      setSelectedScopes([...selectedScopes.filter(s => s !== 'FULL_RECORD'), scope]);
    }
  };

  const handleAllow = () => {
    respondConsent(consent.id, 'ALLOW', selectedScopes, selectedDuration);
    onClose();
  };

  const handleDeny = () => {
    respondConsent(consent.id, 'DENY');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-teal-900 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-800/80 rounded-xl text-teal-300">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Patient Consent Authorization</h3>
                <p className="text-xs text-teal-200 mt-0.5">Control who can access your health data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-teal-300 hover:text-white p-1 rounded-lg hover:bg-teal-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Doctor & Clinical Request Summary */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-slate-500 font-medium block">Requesting Clinician:</span>
                <span className="text-sm font-bold text-slate-900">{consent.doctorName}</span>
                <span className="text-slate-600 block">{consent.doctorSpecialty} · {consent.hospital}</span>
              </div>
              <div className="px-2 py-1 bg-blue-50 text-blue-800 rounded font-medium text-[11px] border border-blue-200">
                Verified Doctor
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 font-medium block">Stated Clinical Reason:</span>
              <p className="text-slate-800 font-medium italic mt-0.5">"{consent.reason}"</p>
            </div>
          </div>

          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2">
              Select Information to Disclose:
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {scopeOptions.map(opt => {
                const isChecked = selectedScopes.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    onClick={() => toggleScope(opt.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-teal-50/70 border-teal-300 text-teal-950 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{opt.label}</div>
                      <div className="text-[11px] text-slate-500">{opt.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Consent Validity Period:</span>
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: '1_HOUR', label: '1 Hour (Single Check)' },
                { id: 'THIS_CONSULTATION', label: 'This Consultation (24h)' },
                { id: '24_HOURS', label: '24 Hours' },
                { id: '7_DAYS', label: '7 Days (Follow-up)' }
              ].map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDuration(d.id as ConsentDuration)}
                  className={`py-2 px-2.5 rounded-lg border text-left transition-colors ${
                    selectedDuration === d.id
                      ? 'bg-teal-900 text-white font-medium border-teal-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              You can revoke this consent at any time from your Patient Consent Manager.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={handleDeny}
            className="px-4 py-2 text-xs font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
          >
            Deny Access
          </button>
          <button
            onClick={handleAllow}
            disabled={selectedScopes.length === 0}
            className="px-5 py-2 text-xs font-semibold bg-teal-800 hover:bg-teal-900 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Authorize Scoped Access</span>
          </button>
        </div>
      </div>
    </div>
  );
};
