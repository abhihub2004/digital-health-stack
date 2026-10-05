import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Pill,
  Clock,
  Check,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Stethoscope,
  Activity,
  Package,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Prescription, MedicineSchedule } from '../../types';

export const PatientPrescriptionsView: React.FC = () => {
  const { currentPatient, data, updateMedicineSchedule } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'SCHEDULES' | 'PRESCRIPTIONS'>('SCHEDULES');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!currentPatient) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
        Please sign in to view prescriptions.
      </div>
    );
  }

  const patientPrescriptions = data.prescriptions.filter(
    p => p.uhid.toLowerCase() === currentPatient.uhid.toLowerCase()
  );

  const patientSchedules = data.medicineSchedules.filter(
    s => s.patientId === currentPatient.id
  );

  const handleMarkTaken = (id: string) => {
    updateMedicineSchedule(id, 'TAKEN');
    setActionSuccess('Dose marked as taken.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleMarkSkipped = (id: string) => {
    updateMedicineSchedule(id, 'SKIPPED');
    setActionSuccess('Dose marked as skipped.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const takenCount = patientSchedules.filter(s => s.status === 'TAKEN').length;
  const pendingCount = patientSchedules.filter(s => s.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Prescriptions & Medication Schedules</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800">
                {patientPrescriptions.length} Active Rx
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Doctor-issued dosage plans with automated timing reminders and pharmacy sync.
            </p>
          </div>
        </div>

        {/* Sub-tab Pill Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('SCHEDULES')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSubTab === 'SCHEDULES'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today's Doses ({pendingCount} pending)
          </button>
          <button
            onClick={() => setActiveSubTab('PRESCRIPTIONS')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeSubTab === 'PRESCRIPTIONS'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Prescriptions ({patientPrescriptions.length})
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* METRIC ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Doses Taken Today</span>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">
            {takenCount} / {patientSchedules.length}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Adherence tracked</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Active Prescriptions</span>
          <div className="text-2xl font-extrabold text-purple-600 font-mono mt-0.5">
            {patientPrescriptions.length}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Authorized by verified doctors</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Known Drug Allergies</span>
          <div className="text-sm font-bold text-rose-800 mt-1 flex flex-wrap gap-1">
            {currentPatient.allergies.length > 0 ? (
              currentPatient.allergies.map(a => (
                <span key={a} className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded-md font-mono text-[11px]">
                  {a}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-xs">No known allergies</span>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: DAILY DOSAGE SCHEDULES */}
      {activeSubTab === 'SCHEDULES' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Today's Medicine Schedule & Dosage Reminders</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically generated from doctor's electronic prescription instructions.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 font-semibold">
              Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {patientSchedules.length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
              <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No active medication schedules for today.</p>
              <p className="mt-0.5">New prescriptions from doctors automatically generate timing reminders here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patientSchedules.map(sched => (
                <div
                  key={sched.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    sched.status === 'TAKEN'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : sched.status === 'SKIPPED'
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 shadow-2xs hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs shrink-0 ${
                      sched.status === 'TAKEN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {sched.timing}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-sm">{sched.medicineName}</strong>
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {sched.dosage}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Instruction: <strong className="text-slate-700">{sched.timingRelation}</strong></span>
                        <span>·</span>
                        <span>Scheduled Date: {sched.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs">
                    {sched.status === 'TAKEN' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Taken</span>
                      </span>
                    ) : sched.status === 'SKIPPED' ? (
                      <span className="px-3 py-1 bg-slate-200 text-slate-600 font-bold rounded-xl">
                        Skipped
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleMarkSkipped(sched.id)}
                          className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium transition-colors"
                        >
                          Skip
                        </button>
                        <button
                          onClick={() => handleMarkTaken(sched.id)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Taken</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DETAILED DOCTOR PRESCRIPTIONS */}
      {activeSubTab === 'PRESCRIPTIONS' && (
        <div className="space-y-4">
          {patientPrescriptions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Prescriptions Issued</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Electronic prescriptions written by authorized doctors following consultations will be stored here.
              </p>
            </div>
          ) : (
            patientPrescriptions.map(rx => (
              <div
                key={rx.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-lg shrink-0">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">Diagnosis: {rx.diagnosis}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200">
                          Prescription #{rx.id.slice(-6)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Prescribed by: <strong className="text-slate-800">{rx.doctorName}</strong> ({rx.doctorSpecialty} · {rx.hospital})
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-mono sm:text-right shrink-0">
                    <div>Issued: {new Date(rx.prescribedAt || rx.createdAt || Date.now()).toLocaleDateString()}</div>
                    <div className="mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                        rx.pharmacyStatus === 'DISPENSED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : rx.pharmacyStatus === 'READY_FOR_PICKUP'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        Pharmacy: {rx.pharmacyStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vitals Recorded */}
                {rx.vitals && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-2xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Blood Pressure:</span>
                      <strong className="text-slate-800 font-mono">{rx.vitals.bloodPressure || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Heart Rate:</span>
                      <strong className="text-slate-800 font-mono">{rx.vitals.heartRate ? `${rx.vitals.heartRate} bpm` : 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Temperature:</span>
                      <strong className="text-slate-800 font-mono">{rx.vitals.temperature || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">SpO2 Oxygen:</span>
                      <strong className="text-slate-800 font-mono">{rx.vitals.spo2 ? `${rx.vitals.spo2}%` : 'N/A'}</strong>
                    </div>
                  </div>
                )}

                {/* Medicines Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-slate-50/60 rounded-2xl border border-slate-200">
                    <thead className="bg-slate-100 text-slate-600 font-mono text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Medicine & Form</th>
                        <th className="p-3">Dosage</th>
                        <th className="p-3">Frequency</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Timing & Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rx.medicines.map((m, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="p-3">
                            <strong className="text-slate-900 block">{m.medicineName}</strong>
                            <span className="text-slate-400 text-[11px]">{m.form}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-800">{m.dosage}</td>
                          <td className="p-3 text-slate-700">{m.frequency}</td>
                          <td className="p-3 font-mono text-slate-700">{m.durationDays} Days</td>
                          <td className="p-3">
                            <div className="text-slate-900 font-medium">{m.timingRelation}</div>
                            <div className="text-slate-500 text-[11px] mt-0.5">{m.instructions}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Clinical Notes */}
                {rx.clinicalNotes && (
                  <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs text-purple-950">
                    <strong className="font-bold text-purple-900 block mb-0.5">Doctor's Clinical Notes:</strong>
                    <span>{rx.clinicalNotes}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
