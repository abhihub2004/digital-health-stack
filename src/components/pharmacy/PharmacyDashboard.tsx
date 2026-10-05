import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Pill, Check, Package, Clock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const PharmacyDashboard: React.FC = () => {
  const { currentPharmacy, data, dispensePrescription } = useApp();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEW' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'DISPENSED'>('ALL');

  if (!currentPharmacy) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <p className="text-slate-600">Please switch to Pharmacy persona from top bar.</p>
      </div>
    );
  }

  const allPrescriptions = data.prescriptions;
  const filteredRx = filterStatus === 'ALL'
    ? allPrescriptions
    : allPrescriptions.filter(p => p.pharmacyStatus === filterStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Pharmacy Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-800 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
            <Pill className="w-7 h-7 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{currentPharmacy.name}</h1>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Licensed Dispensary
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Pharmacist In-Charge: <strong>{currentPharmacy.pharmacistInCharge}</strong> · License: <span className="font-mono">{currentPharmacy.licenseNumber}</span>
            </p>
          </div>
        </div>

        {/* Privacy Guard Notice */}
        <div className="text-xs bg-amber-50/70 border border-amber-200 p-3 rounded-xl max-w-sm text-amber-950">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Prescription Isolation Active</span>
          </div>
          <p className="text-[11px] mt-0.5 text-amber-800 leading-tight">
            Pharmacies receive only prescribed medication items and dosage guidelines. Diagnostic lab tests and confidential clinical history are securely withheld.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium">
        {[
          { id: 'ALL', label: `All Orders (${allPrescriptions.length})` },
          { id: 'NEW', label: 'New Electronic Orders' },
          { id: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
          { id: 'DISPENSED', label: 'Dispensed & Completed' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === tab.id ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {filteredRx.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
            No prescriptions matching selected filter.
          </div>
        ) : (
          filteredRx.map(rx => (
            <div key={rx.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Patient: {rx.patientName}</span>
                    <span className="font-mono text-slate-500 font-semibold">({rx.uhid})</span>
                  </div>
                  <div className="text-slate-500 mt-0.5 font-mono">
                    Prescribed by {rx.doctorName} ({rx.doctorSpecialty}) · Order ID: {rx.id}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-bold ${
                    rx.pharmacyStatus === 'DISPENSED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    rx.pharmacyStatus === 'READY_FOR_PICKUP' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {rx.pharmacyStatus}
                  </span>
                </div>
              </div>

              {/* Medicines Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rx.medicines.map(med => (
                  <div key={med.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-bold">{med.medicineName}</strong>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-700">
                        {med.dosage}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Frequency: <strong className="text-slate-800">{med.frequency}</strong> · Duration: <strong>{med.durationDays} Days</strong>
                    </div>
                    <div className="text-slate-600">
                      Timings: <span className="font-mono font-medium text-amber-900">{med.timings.join(', ')}</span> ({med.timingRelation})
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      Label: {med.instructions}
                    </p>
                  </div>
                ))}
              </div>

              {/* Dispense Actions */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  Prescription Created: {new Date(rx.createdAt).toLocaleString()}
                </span>

                {rx.pharmacyStatus !== 'DISPENSED' ? (
                  <button
                    onClick={() => dispensePrescription(rx.id)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Package className="w-4 h-4" />
                    <span>Fulfill & Mark Dispensed</span>
                  </button>
                ) : (
                  <span className="text-emerald-700 font-bold font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Dispensed by {rx.dispensedBy}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
