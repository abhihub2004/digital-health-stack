import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, Stethoscope, Check, X, ShieldCheck } from 'lucide-react';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose
}) => {
  const { data, bookAppointment } = useApp();
  const [selectedDoctorId, setSelectedDoctorId] = useState(data.doctors[0]?.id || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:30 AM');
  const [reason, setReason] = useState('Persistent migraine headache and sensory sensitivity');
  const [isEmergency, setIsEmergency] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setBookingSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const res = bookAppointment({
      doctorId: selectedDoctorId,
      date,
      time,
      reasonForVisit: reason,
      isEmergency
    });

    if (res.success && res.appointment) {
      setBookingSuccess(res.appointment);
    }
  };

  const selectedDoctor = data.doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-800 text-teal-200 rounded-xl">
              <Calendar className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Book Clinical Specialist Consultation</h3>
              <p className="text-xs text-slate-300">Verified doctor directory with queue token</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {bookingSuccess ? (
            <div className="p-5 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">Appointment Request Dispatched!</h4>
                <p className="text-slate-600 mt-1">
                  Doctor notified. Your queue token number has been generated.
                </p>
              </div>

              <div className="p-4 bg-teal-900 text-white rounded-xl inline-block max-w-xs w-full">
                <span className="text-[11px] uppercase font-mono text-teal-300">Your Queue Token</span>
                <span className="text-3xl font-mono font-bold block my-1">{bookingSuccess.tokenNumber}</span>
                <span className="text-[11px] text-teal-200 font-mono">
                  Estimated Waiting: ~{bookingSuccess.estimatedWaitMinutes} minutes
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold"
                >
                  Done & View on Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBook} className="space-y-4">
              {/* Doctor Selection */}
              <div>
                <label className="block font-bold text-slate-900 mb-1.5">
                  Select Specialist Doctor:
                </label>
                <div className="space-y-2">
                  {data.doctors.map(doc => (
                    <label
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        selectedDoctorId === doc.id
                          ? 'bg-teal-50/70 border-teal-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="doctorSelect"
                          checked={selectedDoctorId === doc.id}
                          onChange={() => {}}
                          className="text-teal-800"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{doc.name}</div>
                          <div className="text-slate-500 text-[11px]">{doc.specialization} · {doc.hospital}</div>
                          <div className="text-slate-400 font-mono text-[10px] mt-0.5">Hours: {doc.availabilityHours}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">₹{doc.consultationFee}</span>
                        <span className="text-[10px] text-emerald-700 font-medium">★ {doc.rating}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Appointment Date:</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Preferred Time Slot:</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-900 mb-1">Reason for Visit:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="rounded text-rose-700"
                />
                <span className="font-semibold text-rose-800">
                  Priority Emergency Consultation (Prioritizes queue token)
                </span>
              </label>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg transition-colors shadow-xs"
                >
                  Confirm Booking Request
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
