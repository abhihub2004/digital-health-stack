import React from 'react';
import { useApp } from '../../context/AppContext';
import { User, ShieldAlert, Lock, CheckCircle2, UserCheck, Stethoscope, Microscope, Pill, Shield } from 'lucide-react';

export const RoleSwitcher: React.FC<{ onOpenWalkthrough: () => void }> = ({ onOpenWalkthrough }) => {
  const { currentUser, currentRole, data, switchUser, currentPatient } = useApp();

  const roleSpecs: Record<string, { icon: any; title: string; boundary: string; color: string }> = {
    PATIENT: {
      icon: UserCheck,
      title: 'Patient Mode (Arun Kumar)',
      boundary: 'Full control over personal records. Grants or revokes consent to doctors. Diagnostic labs cannot view medical history.',
      color: 'border-teal-500 bg-teal-50/50 text-teal-900'
    },
    DOCTOR: {
      icon: Stethoscope,
      title: 'Doctor Clinical Desk (Dr. Rahul Sharma)',
      boundary: 'Cannot see patient medical records without explicit active patient consent. Access is strictly scoped & revocable.',
      color: 'border-blue-500 bg-blue-50/50 text-blue-900'
    },
    LAB: {
      icon: Microscope,
      title: 'Diagnostic Centre (Apex Pathology)',
      boundary: 'Can only upload diagnostic reports to UHID. Cannot view patient medical history or doctor prescriptions.',
      color: 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
    },
    PHARMACY: {
      icon: Pill,
      title: 'Pharmacy Portal (CityMed Pharmacy)',
      boundary: 'Receives prescription items for dispensing. Does not see unrelated disease history, lab reports, or consultation notes.',
      color: 'border-amber-500 bg-amber-50/50 text-amber-900'
    },
    ADMIN: {
      icon: Shield,
      title: 'System Administrator Console',
      boundary: 'Verifies medical practitioners and laboratories. Monitors security audit logs. Cannot casually browse clinical records.',
      color: 'border-purple-500 bg-purple-50/50 text-purple-900'
    }
  };

  const currentSpec = roleSpecs[currentRole] || roleSpecs['PATIENT'];
  const Icon = currentSpec.icon;

  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-slate-800 text-teal-400 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{currentSpec.title}</span>
              {currentRole === 'PATIENT' && currentPatient && (
                <span className="font-mono text-[11px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800">
                  {currentPatient.uhid}
                </span>
              )}
            </div>
            <p className="text-slate-400 mt-0.5 text-[11px]">
              <strong className="text-slate-300">Privacy Boundary:</strong> {currentSpec.boundary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Role quick-switch:</span>
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            {data.users.slice(0, 5).map(u => (
              <button
                key={u.id}
                onClick={() => switchUser(u.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  u.id === currentUser.id
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {u.role === 'PATIENT' ? 'Patient' :
                 u.role === 'DOCTOR' ? 'Doctor' :
                 u.role === 'LAB' ? 'Lab' :
                 u.role === 'PHARMACY' ? 'Pharmacy' : 'Admin'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
