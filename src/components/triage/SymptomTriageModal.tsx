import React, { useState } from 'react';
import { triageSymptoms } from '../../services/triageEngine';
import { SymptomTriageResult } from '../../types';
import { Activity, AlertTriangle, X, Check, ArrowRight, ShieldAlert, Stethoscope } from 'lucide-react';

interface SymptomTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctor?: (specialty: string) => void;
}

export const SymptomTriageModal: React.FC<SymptomTriageModalProps> = ({
  isOpen,
  onClose,
  onSelectDoctor
}) => {
  const [symptomsInput, setSymptomsInput] = useState('');
  const [triageResult, setTriageResult] = useState<SymptomTriageResult | null>(null);

  if (!isOpen) return null;

  const handleTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;
    const res = triageSymptoms(symptomsInput);
    setTriageResult(res);
  };

  const sampleQueries = [
    'Persistent throbbing headache with light sensitivity',
    'Severe chest pain radiating to left arm with difficulty breathing',
    'Red itchy skin rash with small blisters on forearm',
    'Sharp right knee pain after twisting during sports'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-800 text-teal-200 rounded-xl">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">AI Clinical Symptom Triage</h3>
              <p className="text-xs text-slate-300">Department guidance & emergency red flag detection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <form onSubmit={handleTriage} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Describe Your Current Symptoms:
              </label>
              <textarea
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                placeholder="e.g. Severe headache with nausea or sharp knee pain..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700"
              />
            </div>

            {/* Quick Prompt Presets */}
            <div>
              <span className="text-[11px] text-slate-400 font-mono block mb-1.5">Try sample clinical presentations:</span>
              <div className="space-y-1">
                {sampleQueries.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSymptomsInput(q);
                      setTriageResult(triageSymptoms(q));
                    }}
                    className="w-full text-left text-[11px] p-2 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 transition-colors truncate block"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Evaluate Symptoms & Triage Department</span>
            </button>
          </form>

          {/* Result Presentation */}
          {triageResult && (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              {triageResult.isEmergency ? (
                /* RED FLAG EMERGENCY WARNING */
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2 text-rose-950">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
                    <span>EMERGENCY WARNING</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {triageResult.emergencyWarning}
                  </p>
                  <div className="text-[11px] text-rose-700 font-mono pt-1 border-t border-rose-200">
                    Emergency Hotline: 108 / 911 / 112 · Proceed to Nearest Casualty Immediately
                  </div>
                </div>
              ) : (
                /* ROUTINE DEPARTMENT GUIDANCE */
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2 text-xs text-teal-950">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-teal-800 font-bold">
                      Recommended Specialty:
                    </span>
                    <span className="font-bold text-sm bg-white px-2.5 py-0.5 rounded-full border border-teal-200 text-teal-900">
                      {triageResult.suggestedDepartment}
                    </span>
                  </div>
                  <p className="text-slate-700">{triageResult.notes}</p>

                  <div className="pt-2 border-t border-teal-200/60">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Recommended Specialists On Duty:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {triageResult.recommendedDoctors.map((doc, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-teal-200 rounded text-[11px] font-medium text-teal-950">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Notice: AI Symptom Triage provides algorithmic routing guidance for health services and does not replace professional clinical diagnosis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
