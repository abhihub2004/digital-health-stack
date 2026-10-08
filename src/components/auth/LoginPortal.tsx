import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

import {
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Lock,
  Building,
  Microscope,
  Pill,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  X,
  UserPlus
} from 'lucide-react';

import { UserRole } from '../../types';

interface LoginPortalProps {
  onSuccess?: () => void;
  onOpenWalkthrough?: () => void;
}

type MainRoleTab =
  | 'PATIENT'
  | 'DOCTOR'
  | 'PROVIDER'
  | 'ADMIN';

type ProviderSubRole =
  | 'HOSPITAL'
  | 'DIAGNOSTIC'
  | 'PHARMACY';

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onSuccess,
  onOpenWalkthrough
}) => {
  const {
    data,
    login,
    createNewPatient,
    createNewDoctor,
    createNewProvider
  } = useApp();

  const [selectedRole, setSelectedRole] =
    useState<MainRoleTab>('PATIENT');

  const [providerType, setProviderType] =
    useState<ProviderSubRole>('DIAGNOSTIC');

  const [patientMode, setPatientMode] =
    useState<'LOGIN' | 'REGISTER'>('LOGIN');

  const [doctorMode, setDoctorMode] =
    useState<'LOGIN' | 'REGISTER'>('LOGIN');

  const [providerMode, setProviderMode] =
    useState<'LOGIN' | 'REGISTER'>('LOGIN');

  const [identifier, setIdentifier] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [regFullName, setRegFullName] =
    useState('');

  const [regPassword, setRegPassword] =
    useState('');

  const [regPhone, setRegPhone] =
    useState('+91 ');

  const [regEmail, setRegEmail] =
    useState('');

  const [regAge, setRegAge] =
    useState<number | ''>(28);

  const [regGender, setRegGender] =
    useState<'Male' | 'Female' | 'Other'>('Male');

  const [regBloodGroup, setRegBloodGroup] =
    useState('O Positive (O+)');

  const [regAllergies, setRegAllergies] =
    useState('None');

  const [regConditions, setRegConditions] =
    useState('None');

  const [docRegName, setDocRegName] =
    useState('');

  const [docRegEmail, setDocRegEmail] =
    useState('');

  const [docRegPassword, setDocRegPassword] =
    useState('');

  const [docRegSpecialty, setDocRegSpecialty] =
    useState('Cardiology');

  const [docRegHospital, setDocRegHospital] =
    useState('Apollo Health City');

  const [docRegLicense, setDocRegLicense] =
    useState('');

  const [provRegName, setProvRegName] =
    useState('');

  const [provRegLicense, setProvRegLicense] =
    useState('');

  const [provRegExtra, setProvRegExtra] =
    useState('');

  const [provRegAddress, setProvRegAddress] =
    useState('');

  const [provRegPhone, setProvRegPhone] =
    useState('+91 ');

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [infoMessage, setInfoMessage] =
    useState<string | null>(null);

  const [showPrivacyModal, setShowPrivacyModal] =
    useState(false);

  const [showHelpModal, setShowHelpModal] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleRoleSelect = (
    role: MainRoleTab
  ) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setInfoMessage(null);
    setIdentifier('');
    setPassword('');
  };

  const handleLoginSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMessage(null);
    setInfoMessage(null);

    const cleanId = identifier.trim();

    if (!cleanId) {
      setErrorMessage(
        'Please enter your identifier or registered ID.'
      );
      return;
    }

    setIsSubmitting(true);

    let targetRole: UserRole = 'PATIENT';

    let targetUserId:
      | string
      | undefined = undefined;

    if (selectedRole === 'PATIENT') {
      targetRole = 'PATIENT';

      const patient =
        data.patients.find(
          p =>
            p.uhid.toLowerCase() ===
              cleanId.toLowerCase() ||
            p.email.toLowerCase() ===
              cleanId.toLowerCase() ||
            p.phone
              .replace(/\s+/g, '')
              .includes(
                cleanId.replace(/\s+/g, '')
              )
        );

      if (patient) {
        targetUserId = patient.userId;
      } else {
        setIsSubmitting(false);

        setErrorMessage(
          `No registered patient record found for "${cleanId}". Please verify your UHID/Mobile or register as a new patient.`
        );

        return;
      }
    } else if (
      selectedRole === 'DOCTOR'
    ) {
      targetRole = 'DOCTOR';

      const doc =
        data.doctors.find(
          d =>
            d.userId.toLowerCase() ===
              cleanId.toLowerCase() ||
            d.licenseNumber.toLowerCase() ===
              cleanId.toLowerCase() ||
            d.name
              .toLowerCase()
              .includes(
                cleanId.toLowerCase()
              )
        );

      const user =
        data.users.find(
          u =>
            u.role === 'DOCTOR' &&
            (
              u.id === cleanId ||
              u.email.toLowerCase() ===
                cleanId.toLowerCase()
            )
        );

      if (doc) {
        targetUserId = doc.userId;
      } else if (user) {
        targetUserId = user.id;
      } else {
        setIsSubmitting(false);

        setErrorMessage(
          `No registered doctor account found for "${cleanId}". Please verify your Doctor ID/email or register as a new doctor.`
        );

        return;
      }
    } else if (
      selectedRole === 'PROVIDER'
    ) {
      if (
        providerType === 'DIAGNOSTIC' ||
        providerType === 'HOSPITAL'
      ) {
        targetRole = 'LAB';

        const lab =
          data.labs.find(
            l =>
              l.userId.toLowerCase() ===
                cleanId.toLowerCase() ||
              l.name.toLowerCase() ===
                cleanId.toLowerCase()
          );

        const labUser =
          data.users.find(
            u =>
              u.role === 'LAB' &&
              (
                u.id.toLowerCase() ===
                  cleanId.toLowerCase() ||
                u.email.toLowerCase() ===
                  cleanId.toLowerCase()
              )
          );

        if (lab) {
          targetUserId = lab.userId;
        } else if (labUser) {
          targetUserId = labUser.id;
        } else {
          setIsSubmitting(false);

          setErrorMessage(
            `No registered provider account found for "${cleanId}". Please verify the provider ID/email or register the facility.`
          );

          return;
        }
      } else {
        targetRole = 'PHARMACY';

        const pharmacy =
          data.pharmacies.find(
            p =>
              p.userId.toLowerCase() ===
                cleanId.toLowerCase() ||
              p.name.toLowerCase() ===
                cleanId.toLowerCase()
          );

        const pharmacyUser =
          data.users.find(
            u =>
              u.role === 'PHARMACY' &&
              (
                u.id.toLowerCase() ===
                  cleanId.toLowerCase() ||
                u.email.toLowerCase() ===
                  cleanId.toLowerCase()
              )
          );

        if (pharmacy) {
          targetUserId = pharmacy.userId;
        } else if (pharmacyUser) {
          targetUserId = pharmacyUser.id;
        } else {
          setIsSubmitting(false);

          setErrorMessage(
            `No registered provider account found for "${cleanId}". Please verify the pharmacy ID/email or register the facility.`
          );

          return;
        }
      }
    } else if (
      selectedRole === 'ADMIN'
    ) {
      targetRole = 'ADMIN';

      const ADMIN_EMAIL =
        'admin@digitalhealth.gov.in';

      const ADMIN_PASSKEY =
        'Admin@12345';

      if (
        cleanId.toLowerCase() !==
          ADMIN_EMAIL.toLowerCase() ||
        password !== ADMIN_PASSKEY
      ) {
        setIsSubmitting(false);

        setErrorMessage(
          'Invalid administrator email/ID or security passkey.'
        );

        return;
      }

      const adminUser =
        data.users.find(
          u =>
            u.role === 'ADMIN' &&
            u.email.toLowerCase() ===
              ADMIN_EMAIL.toLowerCase()
        );

      if (!adminUser) {
        setIsSubmitting(false);

        setErrorMessage(
          'Initial administrator account is not configured.'
        );

        return;
      }

      targetUserId = adminUser.id;
    }

    setTimeout(() => {
      const res = login(
        targetRole,
        targetUserId,
        {
          identifier: cleanId,
          password
        }
      );

      setIsSubmitting(false);

      if (res.success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMessage(
          res.error ||
            'Authentication failed. Please verify your credentials.'
        );
      }
    }, 250);
  };

  const handleRegisterSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMessage(null);

    if (!regFullName.trim()) {
      setErrorMessage(
        'Please enter your legal full name.'
      );
      return;
    }

    if (
      !regPassword.trim() ||
      regPassword.length < 4
    ) {
      setErrorMessage(
        'Please enter a secure password or PIN (at least 4 characters).'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const created =
        createNewPatient({
          fullName:
            regFullName.trim(),

          email:
            regEmail.trim() ||
            `${regFullName
              .toLowerCase()
              .replace(/\s+/g, '')}@healthstack.local`,

          phone:
            regPhone.trim(),

          age:
            Number(regAge) || 28,

          gender:
            regGender,

          bloodGroup:
            regBloodGroup,

          allergies:
            regAllergies !== 'None'
              ? regAllergies
                  .split(',')
                  .map(
                    s => s.trim()
                  )
              : [],

          chronicConditions:
            regConditions !== 'None'
              ? regConditions
                  .split(',')
                  .map(
                    s => s.trim()
                  )
              : []
        });

      const res =
        login(
          'PATIENT',
          created.userId
        );

      setIsSubmitting(false);

      if (
        res.success &&
        onSuccess
      ) {
        onSuccess();
      }
    } catch {
      setIsSubmitting(false);

      setErrorMessage(
        'Failed to generate patient registration. Please try again.'
      );
    }
  };

  const handleDoctorRegisterSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMessage(null);

    if (!docRegName.trim()) {
      setErrorMessage(
        'Please enter doctor full legal name.'
      );
      return;
    }

    if (
      !docRegPassword.trim() ||
      docRegPassword.length < 4
    ) {
      setErrorMessage(
        'Please enter a secure password (at least 4 characters).'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      createNewDoctor({
        name:
          docRegName.trim(),

        email:
          docRegEmail.trim() ||
          `${docRegName
            .toLowerCase()
            .replace(/\s+/g, '')}@healthstack.local`,

        specialization:
          docRegSpecialty,

        hospital:
          docRegHospital,

        licenseNumber:
          docRegLicense.trim() ||
          `MCI-2026-${Math.floor(
            1000 +
              Math.random() * 9000
          )}`
      });

      setIsSubmitting(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setIsSubmitting(false);

      setErrorMessage(
        'Failed to register doctor profile. Please try again.'
      );
    }
  };

  const handleProviderRegisterSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMessage(null);

    if (!provRegName.trim()) {
      setErrorMessage(
        'Please enter facility or centre name.'
      );
      return;
    }

    if (providerType === 'HOSPITAL') {
      setErrorMessage(
        'Hospital portal registration is managed by system administrators.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      createNewProvider({
        type:
          providerType === 'DIAGNOSTIC'
            ? 'LAB'
            : 'PHARMACY',

        name:
          provRegName.trim(),

        licenseNumber:
          provRegLicense.trim() ||
          `LIC-${Math.floor(
            1000 +
              Math.random() * 9000
          )}`,

        accreditationOrPharmacist:
          provRegExtra.trim() ||
          (
            providerType ===
            'PHARMACY'
              ? 'Registered Pharmacist'
              : 'NABL Accredited'
          ),

        address:
          provRegAddress.trim() ||
          'Medical District, City Center',

        phone:
          provRegPhone.trim() ||
          '+91 98765 11223'
      });

      setIsSubmitting(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setIsSubmitting(false);

      setErrorMessage(
        'Failed to register provider facility. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-[#F8FAFC] to-slate-100 font-sans antialiased text-slate-800">
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                <path
                  d="M8 12h2.5l1.5-3 2 6 1.5-3H16"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <span className="text-2xl font-black tracking-tight text-slate-900">
              HealthStack
            </span>
          </div>

          <p className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
            Digital Healthcare Management Platform
          </p>

          <h2 className="text-xl font-bold tracking-tight text-slate-900 pt-1">
            Secure Healthcare Access
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() =>
              handleRoleSelect('PATIENT')
            }
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedRole === 'PATIENT'
                ? 'bg-teal-50/80 border-teal-300 shadow-md shadow-teal-500/10 ring-2 ring-teal-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                selectedRole === 'PATIENT'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-teal-100 text-teal-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
            </div>

            <div className="mt-2.5">
              <span className="block text-xs font-bold text-slate-900">
                Patient
              </span>

              <span className="block text-[10px] text-slate-500 font-medium">
                Vault & Consents
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleRoleSelect('DOCTOR')
            }
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedRole === 'DOCTOR'
                ? 'bg-blue-50/80 border-blue-300 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                selectedRole === 'DOCTOR'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
            </div>

            <div className="mt-2.5">
              <span className="block text-xs font-bold text-slate-900">
                Doctor
              </span>

              <span className="block text-[10px] text-slate-500 font-medium">
                Clinical Desk
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleRoleSelect('PROVIDER')
            }
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedRole === 'PROVIDER'
                ? 'bg-emerald-50/80 border-emerald-300 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                selectedRole === 'PROVIDER'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Building className="w-4 h-4" />
            </div>

            <div className="mt-2.5">
              <span className="block text-xs font-bold text-slate-900">
                Provider
              </span>

              <span className="block text-[10px] text-slate-500 font-medium">
                Labs & Pharma
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleRoleSelect('ADMIN')
            }
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
              selectedRole === 'ADMIN'
                ? 'bg-purple-50/80 border-purple-300 shadow-md shadow-purple-500/10 ring-2 ring-purple-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                selectedRole === 'ADMIN'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>

            <div className="mt-2.5">
              <span className="block text-xs font-bold text-slate-900">
                Admin
              </span>

              <span className="block text-[10px] text-slate-500 font-medium">
                Governance
              </span>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-7 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-medium flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {selectedRole === 'PATIENT' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span>Patient Portal</span>
                </h3>

                <p className="text-xs text-slate-500 mt-0.5">
                  Securely access your health records and control who can view them.
                </p>
              </div>

              {patientMode === 'LOGIN' ? (
                <form
                  onSubmit={handleLoginSubmit}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      UHID / Registered Mobile Number
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={identifier}
                        onChange={e =>
                          setIdentifier(
                            e.target.value
                          )
                        }
                        placeholder="e.g. UHID-XXXX-XXXX or registered mobile"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition-colors"
                        required
                      />

                      <Fingerprint className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password / PIN
                    </label>

                    <input
                      type="password"
                      value={password}
                      onChange={e =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter your PIN or password"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5 text-teal-200" />
                    <span>
                      {isSubmitting
                        ? 'Authenticating...'
                        : 'Secure Login'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setInfoMessage(
                          'To recover or reset your security PIN, please verify via registered mobile SMS or consult your hospital registration desk.'
                        )
                      }
                      className="text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Forgot PIN?
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPatientMode(
                          'REGISTER'
                        );
                        setErrorMessage(null);
                        setInfoMessage(null);
                      }}
                      className="text-teal-700 hover:text-teal-900 font-bold transition-colors"
                    >
                      Register as New Patient
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handleRegisterSubmit}
                  className="space-y-3"
                >
                  <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-950 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-teal-700 shrink-0" />

                    <span>
                      Generates a verified Unique Health ID (UHID) upon registration.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Full Legal Name
                    </label>

                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={e =>
                        setRegFullName(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Meera Iyer"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Password / Security PIN
                    </label>

                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={e =>
                        setRegPassword(
                          e.target.value
                        )
                      }
                      placeholder="Create a password or PIN (min 4 chars)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Mobile Number
                      </label>

                      <input
                        type="text"
                        value={regPhone}
                        onChange={e =>
                          setRegPhone(
                            e.target.value
                          )
                        }
                        placeholder="+91 98765 00000"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Age
                      </label>

                      <input
                        type="number"
                        value={regAge}
                        onChange={e =>
                          setRegAge(
                            Number(
                              e.target.value
                            )
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Gender
                      </label>

                      <select
                        value={regGender}
                        onChange={e =>
                          setRegGender(
                            e.target.value as any
                          )
                        }
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      >
                        <option value="Male">
                          Male
                        </option>

                        <option value="Female">
                          Female
                        </option>

                        <option value="Other">
                          Other
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Blood Group
                      </label>

                      <select
                        value={regBloodGroup}
                        onChange={e =>
                          setRegBloodGroup(
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      >
                        <option value="O Positive (O+)">
                          O Positive (O+)
                        </option>

                        <option value="A Positive (A+)">
                          A Positive (A+)
                        </option>

                        <option value="B Positive (B+)">
                          B Positive (B+)
                        </option>

                        <option value="AB Positive (AB+)">
                          AB Positive (AB+)
                        </option>

                        <option value="O Negative (O-)">
                          O Negative (O-)
                        </option>
                      </select>
                    </div>
                  </div>
                                    <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-200" />

                    <span>
                      {isSubmitting
                        ? 'Registering...'
                        : 'Register & Enter Dashboard'}
                    </span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPatientMode('LOGIN')
                      }
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Already have an account?{' '}
                      <span className="text-teal-700 font-bold">
                        Log In
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {selectedRole === 'DOCTOR' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />

                  <span>Doctor Portal</span>
                </h3>

                <p className="text-xs text-slate-500 mt-0.5">
                  Access patient information only after authorization and consent.
                </p>
              </div>

              {doctorMode === 'LOGIN' ? (
                <form
                  onSubmit={handleLoginSubmit}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Doctor ID / Registered Email
                    </label>

                    <input
                      type="text"
                      value={identifier}
                      onChange={e =>
                        setIdentifier(
                          e.target.value
                        )
                      }
                      placeholder="Enter Doctor ID or registered email"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>

                    <input
                      type="password"
                      value={password}
                      onChange={e =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter clinical session password"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-colors"
                      required
                    />
                  </div>

                  <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-[11px] text-blue-900">
                    <strong>Notice:</strong>{' '}
                    Authentication does not grant automatic record access. Patient records require explicit digital consent during consultation.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5 text-blue-200" />

                    <span>
                      {isSubmitting
                        ? 'Verifying...'
                        : 'Secure Login'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setInfoMessage(
                          'To recover or reset your clinician password, please contact hospital IT administration.'
                        )
                      }
                      className="text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Forgot Password?
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDoctorMode(
                          'REGISTER'
                        );

                        setErrorMessage(null);
                        setInfoMessage(null);
                      }}
                      className="text-blue-700 hover:text-blue-900 font-bold transition-colors"
                    >
                      Register as New Doctor
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={
                    handleDoctorRegisterSubmit
                  }
                  className="space-y-3"
                >
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-950 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-blue-700 shrink-0" />

                    <span>
                      Registers a verified medical license (MCI / NMC credentials).
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Full Legal Name
                    </label>

                    <input
                      type="text"
                      required
                      value={docRegName}
                      onChange={e =>
                        setDocRegName(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Dr. Ananya Rao"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Password / Security PIN
                    </label>

                    <input
                      type="password"
                      required
                      value={docRegPassword}
                      onChange={e =>
                        setDocRegPassword(
                          e.target.value
                        )
                      }
                      placeholder="Create a password (min 4 chars)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Specialization
                      </label>

                      <input
                        type="text"
                        required
                        value={docRegSpecialty}
                        onChange={e =>
                          setDocRegSpecialty(
                            e.target.value
                          )
                        }
                        placeholder="e.g. Cardiology"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        License Number
                      </label>

                      <input
                        type="text"
                        value={docRegLicense}
                        onChange={e =>
                          setDocRegLicense(
                            e.target.value
                          )
                        }
                        placeholder="MCI-2026-XXXX"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Hospital / Affiliation
                    </label>

                    <input
                      type="text"
                      value={docRegHospital}
                      onChange={e =>
                        setDocRegHospital(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Apollo Health City"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />

                    <span>
                      {isSubmitting
                        ? 'Registering...'
                        : 'Register & Enter Clinical Desk'}
                    </span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setDoctorMode('LOGIN')
                      }
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Already have an account?{' '}
                      <span className="text-blue-700 font-bold">
                        Log In
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
                    {selectedRole === 'PROVIDER' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />

                  <span>
                    Healthcare Provider Portal
                  </span>
                </h3>

                <p className="text-xs text-slate-500 mt-0.5">
                  Select provider type and authenticate with your verified facility license.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setProviderType(
                      'HOSPITAL'
                    )
                  }
                  className={`py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    providerType ===
                    'HOSPITAL'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hospital
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setProviderType(
                      'DIAGNOSTIC'
                    )
                  }
                  className={`py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    providerType ===
                    'DIAGNOSTIC'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Diagnostic
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setProviderType(
                      'PHARMACY'
                    )
                  }
                  className={`py-1.5 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                    providerType ===
                    'PHARMACY'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pharmacy
                </button>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {providerType ===
                  'DIAGNOSTIC' &&
                  'Diagnostic Centre: Upload lab reports to patient records using verified UHID.'}

                {providerType ===
                  'PHARMACY' &&
                  'Pharmacy: Verify electronic prescriptions and dispense medications with schedule tracking.'}

                {providerType ===
                  'HOSPITAL' &&
                  'Hospital: Clinical administration, triage management, and facility coordination.'}
              </div>

              {providerMode === 'LOGIN' ? (
                <form
                  onSubmit={
                    handleLoginSubmit
                  }
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Provider ID / License Number
                    </label>

                    <input
                      type="text"
                      value={identifier}
                      onChange={e =>
                        setIdentifier(
                          e.target.value
                        )
                      }
                      placeholder="Enter Provider ID or license number"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>

                    <input
                      type="password"
                      value={password}
                      onChange={e =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter facility password"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-200" />

                    <span>
                      {isSubmitting
                        ? 'Authenticating...'
                        : 'Secure Login'}
                    </span>
                  </button>

                  {providerType !==
                    'HOSPITAL' && (
                    <div className="text-right pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProviderMode(
                            'REGISTER'
                          );

                          setErrorMessage(
                            null
                          );
                        }}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-bold transition-colors"
                      >
                        Register as New{' '}
                        {providerType ===
                        'DIAGNOSTIC'
                          ? 'Diagnostic Centre'
                          : 'Pharmacy'}
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <form
                  onSubmit={
                    handleProviderRegisterSubmit
                  }
                  className="space-y-3"
                >
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-emerald-700 shrink-0" />

                    <span>
                      Registering a new verified{' '}
                      {providerType ===
                      'DIAGNOSTIC'
                        ? 'Diagnostic Laboratory'
                        : 'Pharmacy Outlet'}
                      .
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Facility / Centre Name
                    </label>

                    <input
                      type="text"
                      required
                      value={provRegName}
                      onChange={e =>
                        setProvRegName(
                          e.target.value
                        )
                      }
                      placeholder={
                        providerType ===
                        'DIAGNOSTIC'
                          ? 'e.g. Metropolis Diagnostics'
                          : 'e.g. Apollo Pharmacy #402'
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        License Number
                      </label>

                      <input
                        type="text"
                        value={provRegLicense}
                        onChange={e =>
                          setProvRegLicense(
                            e.target.value
                          )
                        }
                        placeholder={
                          providerType ===
                          'DIAGNOSTIC'
                            ? 'NABL-2026-XXXX'
                            : 'DL-2026-XXXX'
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        {providerType ===
                        'DIAGNOSTIC'
                          ? 'Accreditation'
                          : 'Pharmacist in Charge'}
                      </label>

                      <input
                        type="text"
                        value={provRegExtra}
                        onChange={e =>
                          setProvRegExtra(
                            e.target.value
                          )
                        }
                        placeholder={
                          providerType ===
                          'DIAGNOSTIC'
                            ? 'NABL / CAP'
                            : 'Rajesh Kumar, B.Pharm'
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Address & Location
                    </label>

                    <input
                      type="text"
                      value={provRegAddress}
                      onChange={e =>
                        setProvRegAddress(
                          e.target.value
                        )
                      }
                      placeholder="e.g. MG Road, Medical Hub, City"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />

                    <span>
                      {isSubmitting
                        ? 'Registering...'
                        : 'Register & Enter Dashboard'}
                    </span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setProviderMode(
                          'LOGIN'
                        )
                      }
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Already have an account?{' '}
                      <span className="text-emerald-700 font-bold">
                        Log In
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
                    {selectedRole === 'ADMIN' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />

                  <span>
                    Administrator Portal
                  </span>
                </h3>

                <p className="text-xs text-slate-500 mt-0.5">
                  System governance, verification, and audit monitoring.
                </p>
              </div>

              <form
                onSubmit={handleLoginSubmit}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Administrator Email / ID
                  </label>

                  <input
                    type="text"
                    value={identifier}
                    onChange={e =>
                      setIdentifier(
                        e.target.value
                      )
                    }
                    placeholder="admin@digitalhealth.gov.in"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Passkey
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={e =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter security passkey"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 transition-colors"
                    required
                  />
                </div>

                <div className="p-2.5 bg-purple-50/70 border border-purple-200/80 rounded-xl text-[11px] text-purple-900">
                  <strong>
                    Access Policy:
                  </strong>{' '}
                  Administrator privileges supervise system licensing and audit logs. Access to private patient diagnoses is strictly restricted.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5 text-purple-200" />

                  <span>
                    {isSubmitting
                      ? 'Authenticating...'
                      : 'Secure Login'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="bg-white/70 border border-slate-200 rounded-2xl p-4 text-center space-y-1.5 shadow-2xs">
          <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5">
            <span>
              🔐 Your health records are private.
            </span>
          </div>

          <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed">
            Doctors and healthcare providers can access your health information only when authorized according to your consent and the system's access policies.
          </p>

          <div className="pt-1.5 flex items-center justify-center gap-2.5 text-[10px] font-semibold text-slate-500 font-mono flex-wrap">
            <span>
              Secure Authentication
            </span>

            <span>•</span>

            <span>
              Consent-Controlled Access
            </span>

            <span>•</span>

            <span>
              Audit Logged
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-medium">
          <button
            type="button"
            onClick={() =>
              setShowPrivacyModal(true)
            }
            className="hover:text-blue-600 hover:underline transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>

          <span>|</span>

          <button
            type="button"
            onClick={() =>
              setShowHelpModal(true)
            }
            className="hover:text-blue-600 hover:underline transition-colors cursor-pointer"
          >
            Help
          </button>
        </div>

        {onOpenWalkthrough && (
          <div className="pt-2 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onOpenWalkthrough}
              className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />

              <span>
                Run Automated Walkthrough Test
              </span>
            </button>
          </div>
        )}
      </div>

      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />

                <h3 className="font-bold text-slate-900 text-base">
                  HealthStack Privacy Constitution
                </h3>
              </div>

              <button
                onClick={() =>
                  setShowPrivacyModal(false)
                }
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong>
                  1. Patient Data Sovereignty:
                </strong>{' '}
                You own your health records. Healthcare providers and clinicians cannot browse or read your medical records without your explicit digital consent.
              </p>

              <p>
                <strong>
                  2. Purpose & Duration Scoping:
                </strong>{' '}
                Whenever a clinician requests access, they must provide a valid medical reason, requested duration, and specific data scopes (e.g. lab reports only, prescriptions only).
              </p>

              <p>
                <strong>
                  3. Instant Revocation:
                </strong>{' '}
                You can revoke granted access at any moment from your Patient Privacy & Consent Center. Access terminates immediately.
              </p>

              <p>
                <strong>
                  4. Immutable Audit Logging:
                </strong>{' '}
                Every request, view, approval, denial, and emergency access is cryptographically recorded with timestamps and clinician identities for full transparency.
              </p>

              <p>
                <strong>
                  5. Emergency Access Protocols:
                </strong>{' '}
                Emergency overrides require verified medical clinician credentials, justification, and trigger immediate high-priority audit alerts to the patient.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() =>
                  setShowPrivacyModal(false)
                }
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />

                <h3 className="font-bold text-slate-900 text-base">
                  HealthStack Help & Support
                </h3>
              </div>

              <button
                onClick={() =>
                  setShowHelpModal(false)
                }
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <strong className="text-slate-900 block">
                  What is a UHID?
                </strong>

                <p className="text-[11px] mt-0.5">
                  A Unique Health ID (e.g. UHID-XXXX-XXXX) is your unique identifier linking your health records across hospitals, diagnostic centers, and pharmacies.
                </p>
              </div>

              <div>
                <strong className="text-slate-900 block">
                  How does a doctor access my records?
                </strong>

                <p className="text-[11px] mt-0.5">
                  The doctor searches your UHID and clicks "Request Access". You will receive an instant consent prompt where you choose exactly what records to share and for how long.
                </p>
              </div>

              <div>
                <strong className="text-slate-900 block">
                  Forgot your PIN or credentials?
                </strong>

                <p className="text-[11px] mt-0.5">
                  Please consult the health desk at your registered hospital or contact support at support@healthstack.local.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() =>
                  setShowHelpModal(false)
                }
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-[11px] text-slate-400 pt-4">
        HealthStack · Patient-Centric Digital Health Platform
      </footer>
    </div>
  );
};