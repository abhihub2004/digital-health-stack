import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Droplet, AlertTriangle, Search, Check, Plus, Heart, Phone, MapPin } from 'lucide-react';

export const BloodBankView: React.FC = () => {
  const { currentPatient } = useApp();
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqUnits, setReqUnits] = useState(2);
  const [reqHospital, setReqHospital] = useState('Apollo Health City Trauma Center');
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const bloodStock = [
    { group: 'O+', units: 28, status: 'AVAILABLE', shelfLifeDays: 32 },
    { group: 'O-', units: 4, status: 'CRITICAL_LOW', shelfLifeDays: 28 },
    { group: 'A+', units: 19, status: 'AVAILABLE', shelfLifeDays: 35 },
    { group: 'A-', units: 6, status: 'MODERATE', shelfLifeDays: 29 },
    { group: 'B+', units: 24, status: 'AVAILABLE', shelfLifeDays: 34 },
    { group: 'B-', units: 5, status: 'MODERATE', shelfLifeDays: 30 },
    { group: 'AB+', units: 12, status: 'AVAILABLE', shelfLifeDays: 36 },
    { group: 'AB-', units: 3, status: 'CRITICAL_LOW', shelfLifeDays: 27 }
  ];

  const donors = [
    { name: 'Kavita Menon', group: 'O+', phone: '+91 98450 11223', lastDonated: '3 months ago', city: 'Bangalore Central' },
    { name: 'Rajesh Varma', group: 'B+', phone: '+91 98450 33445', lastDonated: '2 months ago', city: 'Indiranagar' },
    { name: 'Sunil Rao', group: 'O-', phone: '+91 98450 55667', lastDonated: '4 months ago', city: 'Koramangala' },
    { name: 'Ananya Sen', group: 'A+', phone: '+91 98450 77889', lastDonated: '1 month ago', city: 'Whitefield' }
  ];

  const filteredStock = selectedGroup === 'ALL'
    ? bloodStock
    : bloodStock.filter(s => s.group === selectedGroup);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSuccess(`Emergency requisition for ${reqUnits} units of ${currentPatient?.bloodGroup || 'O+'} sent to Central Red Cross Blood Bank. Dispatch ETA: 25 minutes.`);
    setShowRequestModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold text-xl shrink-0">
            <Droplet className="w-6 h-6 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">National Blood Bank & Donor Network</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live inventory and emergency transfusion matching connected to patient UHID.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm shadow-rose-600/20 flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Emergency Blood Request</span>
        </button>
      </div>

      {requestSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{requestSuccess}</span>
        </div>
      )}

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {filteredStock.map(b => (
          <div
            key={b.group}
            className={`p-4 rounded-3xl border transition-all ${
              b.status === 'CRITICAL_LOW'
                ? 'bg-rose-50/50 border-rose-200'
                : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold font-mono text-slate-900">{b.group}</span>
              <Droplet className={`w-4 h-4 ${b.status === 'CRITICAL_LOW' ? 'text-rose-500 fill-rose-500' : 'text-slate-300'}`} />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-mono text-slate-900">{b.units}</span>
              <span className="text-xs text-slate-400 font-medium ml-1">Units in Stock</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
              <span className={b.status === 'CRITICAL_LOW' ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'}>
                {b.status === 'CRITICAL_LOW' ? 'CRITICAL LOW' : 'STABLE'}
              </span>
              <span className="text-slate-400">{b.shelfLifeDays}d Shelf</span>
            </div>
          </div>
        ))}
      </div>

      {/* Verified Donor Directory */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Emergency Voluntary Donors On-Call</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {donors.map((d, i) => (
            <div key={i} className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-slate-900 font-bold">{d.name}</strong>
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-rose-100 text-rose-800 text-[10px]">
                    {d.group}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{d.city} · Last donated {d.lastDonated}</span>
                </div>
              </div>
              <a
                href={`tel:${d.phone}`}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 text-blue-600 rounded-xl font-medium transition-colors flex items-center gap-1.5"
              >
                <Phone className="w-3 h-3" />
                <span>Contact</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900">Request Emergency Blood Units</h3>
            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Blood Group:</label>
                <input
                  type="text"
                  disabled
                  value={currentPatient?.bloodGroup || 'O+'}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Units Required:</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={reqUnits}
                  onChange={(e) => setReqUnits(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Receiving Facility / Hospital:</label>
                <input
                  type="text"
                  value={reqHospital}
                  onChange={(e) => setReqHospital(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Emergency Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
