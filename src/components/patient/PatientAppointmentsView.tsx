import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Plus,
  ShieldCheck,
  MapPin,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../../types';

interface PatientAppointmentsViewProps {
  onOpenBooking: () => void;
  onOpenConsentModal?: (consentId: string) => void;
}

export const PatientAppointmentsView: React.FC<PatientAppointmentsViewProps> = ({
  onOpenBooking,
  onOpenConsentModal
}) => {
  const { currentPatient, data, updateAppointmentStatus, activeConsents } = useApp();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!currentPatient) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
        Please sign in to view your appointments.
      </div>
    );
  }

  const patientAppointments = data.appointments.filter(
    a => a.uhid.toLowerCase() === currentPatient.uhid.toLowerCase()
  );

  const filteredAppointments = patientAppointments.filter(app => {
    // Status filter
    if (statusFilter === 'UPCOMING') {
      if (app.status === 'COMPLETED' || app.status === 'CANCELLED' || app.status === 'REJECTED') {
        return false;
      }
    } else if (statusFilter === 'COMPLETED') {
      if (app.status !== 'COMPLETED') return false;
    } else if (statusFilter === 'CANCELLED') {
      if (app.status !== 'CANCELLED' && app.status !== 'REJECTED') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDoc = app.doctorName.toLowerCase().includes(q);
      const matchSpec = app.doctorSpecialty.toLowerCase().includes(q);
      const matchHosp = app.hospital.toLowerCase().includes(q);
      const matchReason = app.reasonForVisit.toLowerCase().includes(q);
      return matchDoc || matchSpec || matchHosp || matchReason;
    }

    return true;
  });

  const handleCancelAppointment = (id: string) => {
    updateAppointmentStatus(id, 'CANCELLED');
    setActionMessage('Appointment cancelled successfully.');
    setTimeout(() => setActionMessage(null), 3500);
  };

  const upcomingCount = patientAppointments.filter(
    a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && a.status !== 'REJECTED'
  ).length;
  const completedCount = patientAppointments.filter(a => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>My Clinical Appointments</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
                {patientAppointments.length} Total
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultation queue with verified practitioners, tokens, and live status.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenBooking}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Consultation</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)}>
            <X className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Upcoming Appointments</span>
          <div className="text-2xl font-extrabold text-blue-600 font-mono mt-0.5">
            {upcomingCount}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Ready for consultation</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Completed Visits</span>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">
            {completedCount}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Consultations completed</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Patient Health ID</span>
          <div className="text-lg font-extrabold text-slate-900 font-mono mt-1">
            {currentPatient.uhid}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">{currentPatient.fullName}</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Appointments ({patientAppointments.length})
          </button>
          <button
            onClick={() => setStatusFilter('UPCOMING')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'UPCOMING' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'COMPLETED' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'CANCELLED' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctor, hospital..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No appointments matching "${searchQuery}". Try a different keyword.`
              : 'You do not have any appointments under this status filter.'}
          </p>
          <button
            onClick={onOpenBooking}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book New Consultation</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map(app => {
            const isUpcoming = app.status === 'SCHEDULED' || app.status === 'IN_QUEUE' || app.status === 'IN_CONSULTATION';
            const hasConsent = activeConsents.some(
              c => c.patientId === currentPatient.id && c.doctorId === app.doctorId
            );

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs hover:border-blue-200 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-lg shrink-0">
                      <Stethoscope className="w-6 h-6 text-teal-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{app.doctorName}</h3>
                        <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                          {app.doctorSpecialty}
                        </span>
                        {app.isEmergency && (
                          <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            Emergency Transfusion / Critical
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.hospital}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full font-mono text-xs font-bold self-start sm:self-auto ${
                        app.status === 'SCHEDULED'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : app.status === 'IN_QUEUE'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : app.status === 'IN_CONSULTATION'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : app.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                    <div className="font-mono text-xs text-slate-500 font-bold mt-0.5">
                      Token #{app.tokenNumber}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Appointment Date:</span>
                    <strong className="text-slate-800 font-mono flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {app.date}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Time Slot:</span>
                    <strong className="text-slate-800 font-mono flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {app.time}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Reason for Consultation:</span>
                    <strong className="text-slate-800 block mt-0.5 truncate">
                      {app.reasonForVisit || 'Routine Consultation'}
                    </strong>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    {hasConsent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Doctor holds active record consent</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Medical records locked until consent granted</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isUpcoming && (
                      <button
                        onClick={() => handleCancelAppointment(app.id)}
                        className="px-3.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold transition-colors"
                      >
                        Cancel Appointment
                      </button>
                    )}
                    <button
                      onClick={onOpenBooking}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors"
                    >
                      Book Another Slot
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
