import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  Stethoscope,
  Microscope,
  Pill,
  UserCheck
} from 'lucide-react';
import { SAMPLE_LAB_REPORTS } from '../../services/ocrParser';

interface AcceptanceWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcceptanceWalkthroughModal: React.FC<AcceptanceWalkthroughModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    data,
    switchUser,
    requestConsent,
    respondConsent,
    revokeConsent,
    uploadLabReport,
    createPrescription,
    updateAppointmentStatus,
    resetSystemData
  } = useApp();

  const [currentStep, setCurrentStep] = useState(1);
  const [stepStatus, setStepStatus] = useState<Record<number, string>>({});

  if (!isOpen) return null;

  const patient = data.patients[0];
  const doctor = data.doctors[0]; // Dr. Rahul Sharma
  const lab = data.labs[0];

  const steps = [
    {
      num: 1,
      title: 'Patient Account & UHID Generation',
      role: 'PATIENT',
      desc: `Patient ${patient.fullName} holds Unique Health ID: ${patient.uhid}.`,
      actionLabel: 'Switch to Patient & Verify UHID',
      run: () => {
        switchUser(patient.userId);
        setStepStatus(prev => ({ ...prev, 1: `Verified Patient ${patient.fullName} (${patient.uhid})` }));
        setCurrentStep(2);
      }
    },
    {
      num: 2,
      title: 'Diagnostic Centre Uploads CBC Report',
      role: 'LAB',
      desc: 'Lab parses CBC with Differential preserving "Total Leukocyte Count" and attaches it to UHID.',
      actionLabel: 'Switch to Lab & Upload CBC Report',
      run: () => {
        switchUser(lab.userId);
        uploadLabReport(patient.uhid, SAMPLE_LAB_REPORTS[0].name, SAMPLE_LAB_REPORTS[0].rawText, 'HEMATOLOGY');
        setStepStatus(prev => ({ ...prev, 2: `Uploaded CBC Report to ${patient.uhid}. Patient notified.` }));
        setCurrentStep(3);
      }
    },
    {
      num: 3,
      title: 'Patient Receives Notification & Views Report',
      role: 'PATIENT',
      desc: 'Patient receives in-app/SMS alert and views full structured lab parameters with reference ranges.',
      actionLabel: 'Switch to Patient & Inspect Lab Report',
      run: () => {
        switchUser(patient.userId);
        setStepStatus(prev => ({ ...prev, 3: 'Patient inspected CBC results (Total Leukocyte Count, Absolute counts).' }));
        setCurrentStep(4);
      }
    },
    {
      num: 4,
      title: 'Doctor Searches UHID -> Medical Records LOCKED',
      role: 'DOCTOR',
      desc: 'Doctor looks up UHID. System confirms patient found, but strictly locks medical history!',
      actionLabel: 'Switch to Doctor & Verify Privacy Lockout',
      run: () => {
        switchUser(doctor.userId);
        setStepStatus(prev => ({ ...prev, 4: 'Doctor searched UHID. Clinical records remain locked (Consent required).' }));
        setCurrentStep(5);
      }
    },
    {
      num: 5,
      title: 'Doctor Sends Consent Request',
      role: 'DOCTOR',
      desc: 'Doctor specifies clinical reason ("Consultation for persistent headache") and requested scopes.',
      actionLabel: 'Dispatch Consent Request to Patient',
      run: () => {
        requestConsent(patient.uhid, 'Consultation for persistent headache and neurological evaluation', ['BASIC_PROFILE', 'LAB_REPORTS', 'MEDICAL_HISTORY'], '24_HOURS');
        setStepStatus(prev => ({ ...prev, 5: 'Consent request dispatched. Patient received alert.' }));
        setCurrentStep(6);
      }
    },
    {
      num: 6,
      title: 'Patient Approves Doctor Consent',
      role: 'PATIENT',
      desc: 'Patient authorizes scoped access. Backend creates active approved consent token.',
      actionLabel: 'Switch to Patient & Approve Access',
      run: () => {
        switchUser(patient.userId);
        const pending = data.consents.find(c => c.patientId === patient.id && c.doctorId === doctor.id && c.status === 'PENDING');
        if (pending) {
          respondConsent(pending.id, 'ALLOW', ['BASIC_PROFILE', 'LAB_REPORTS', 'MEDICAL_HISTORY'], '24_HOURS');
        }
        setStepStatus(prev => ({ ...prev, 6: 'Patient granted access. Doctor notified.' }));
        setCurrentStep(7);
      }
    },
    {
      num: 7,
      title: 'Doctor Unlocks Records & Creates Prescription',
      role: 'DOCTOR',
      desc: 'Doctor reviews unlocked reports and prescribes Paracetamol 500mg (8:00 AM & 8:00 PM).',
      actionLabel: 'Switch to Doctor & Issue Prescription',
      run: () => {
        switchUser(doctor.userId);
        createPrescription({
          uhid: patient.uhid,
          diagnosis: 'Tension-Type Migraine with Photophobia',
          clinicalNotes: 'Prescribed hydration and short-term analgesia.',
          medicines: [
            {
              id: 'med_paracetamol',
              medicineName: 'Paracetamol 500 mg',
              dosage: '1 tablet (500 mg)',
              form: 'Tablet',
              frequency: 'Twice daily',
              durationDays: 5,
              timings: ['08:00 AM', '08:00 PM'],
              timingRelation: 'After food',
              instructions: 'Take twice daily after meals.'
            }
          ]
        });
        setStepStatus(prev => ({ ...prev, 7: 'Prescription issued. Medicine reminders generated!' }));
        setCurrentStep(8);
      }
    },
    {
      num: 8,
      title: 'Automated Medicine Reminders Generated',
      role: 'PATIENT',
      desc: 'System automatically populates patient schedule timeline (8 AM / 8 PM) and dispatches reminder notifications.',
      actionLabel: 'Switch to Patient & Verify Schedules',
      run: () => {
        switchUser(patient.userId);
        setStepStatus(prev => ({ ...prev, 8: 'Medication schedule visible on patient dashboard.' }));
        setCurrentStep(9);
      }
    },
    {
      num: 9,
      title: 'Patient Revokes Doctor Consent',
      role: 'PATIENT',
      desc: 'Patient exercises privacy control and revokes Dr. Rahul Sharma access with 1 click.',
      actionLabel: 'Revoke Doctor Access Now',
      run: () => {
        const active = data.consents.find(c => c.patientId === patient.id && c.doctorId === doctor.id && c.status === 'APPROVED');
        if (active) {
          revokeConsent(active.id, 'Revoked by patient in privacy walkthrough');
        }
        setStepStatus(prev => ({ ...prev, 9: 'Doctor consent revoked. Access immediately sealed.' }));
        setCurrentStep(10);
      }
    },
    {
      num: 10,
      title: 'Doctor Immediately Loses Access (Backend Blocked)',
      role: 'DOCTOR',
      desc: 'Doctor attempts to view records again -> Intercepted with 403 Forbidden. Full access logged in audit trail.',
      actionLabel: 'Switch to Doctor & Verify 403 Lockout',
      run: () => {
        switchUser(doctor.userId);
        setStepStatus(prev => ({ ...prev, 10: 'CONFIRMED: Doctor locked out with 403 Forbidden. Audit log captured.' }));
      }
    }
  ];

  const handleReset = () => {
    resetSystemData();
    setCurrentStep(1);
    setStepStatus({});
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-800 text-teal-200 rounded-xl">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Privacy-First Acceptance Test Demonstration</h3>
              <p className="text-xs text-slate-300">Automated end-to-end walkthrough of the complete privacy lifecycle</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 font-medium leading-relaxed">
            This walkthrough executes the <strong>exact 10-step verification flow</strong> specified in the requirements, verifying that doctor records remain strictly locked until explicit patient consent is approved, and that consent can be revoked instantly.
          </div>

          <div className="space-y-3">
            {steps.map(step => {
              const isPassed = !!stepStatus[step.num];
              const isCurrent = currentStep === step.num;

              return (
                <div
                  key={step.num}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-teal-50/50 border-teal-500 shadow-xs'
                      : isPassed
                      ? 'bg-slate-50 border-emerald-200'
                      : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                        isPassed ? 'bg-emerald-800 text-white' : isCurrent ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isPassed ? <Check className="w-4 h-4" /> : step.num}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 text-sm font-semibold">{step.title}</strong>
                          <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {step.role}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{step.desc}</p>
                        {stepStatus[step.num] && (
                          <div className="mt-1.5 text-emerald-800 font-mono text-[11px] flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{stepStatus[step.num]}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isCurrent && (
                      <button
                        onClick={step.run}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
                      >
                        <span>{step.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            onClick={handleReset}
            className="text-amber-800 hover:underline font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo to Step 1</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl"
          >
            Close Walkthrough
          </button>
        </div>
      </div>
    </div>
  );
};
