import {
  User,
  PatientProfile,
  DoctorProfile,
  DiagnosticCentre,
  Pharmacy,
  PatientConsent,
  MedicalAccessLog,
  LabReport,
  Prescription,
  MedicineSchedule,
  AppNotification,
  Appointment,
  Referral
} from '../types';
import { parseLaboratoryReport, SAMPLE_LAB_REPORTS } from './ocrParser';

const STORAGE_KEY = 'digital_health_stack_v1';

export interface AppStateData {
  users: User[];
  patients: PatientProfile[];
  doctors: DoctorProfile[];
  labs: DiagnosticCentre[];
  pharmacies: Pharmacy[];
  consents: PatientConsent[];
  accessLogs: MedicalAccessLog[];
  labReports: LabReport[];
  prescriptions: Prescription[];
  medicineSchedules: MedicineSchedule[];
  notifications: AppNotification[];
  appointments: Appointment[];
  referrals: Referral[];
}

export function generateUhid(): string {
  const chars = '0123456789ABCDEF';
  let segmentA = '';
  let segmentB = '';
  for (let i = 0; i < 4; i++) {
    segmentA += chars.charAt(Math.floor(Math.random() * chars.length));
    segmentB += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `UHID-${segmentA}-${segmentB}`;
}

const initialSeedUsers: User[] = [
  {
    id: 'user_patient_1',
    name: 'Arun Kumar',
    email: 'arun.kumar@gmail.com',
    phone: '+91 98765 43210',
    role: 'PATIENT',
    isVerified: true,
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'user_doc_rahul',
    name: 'Dr. Rahul Sharma',
    email: 'dr.rahul.sharma@apollo.org',
    phone: '+91 94455 11223',
    role: 'DOCTOR',
    isVerified: true,
    createdAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'user_doc_ananya',
    name: 'Dr. Ananya Rao',
    email: 'dr.ananya.rao@fortis.org',
    phone: '+91 94455 33445',
    role: 'DOCTOR',
    isVerified: true,
    createdAt: '2026-08-20T09:00:00Z'
  },
  {
    id: 'user_doc_priya',
    name: 'Dr. Priya Nair',
    email: 'dr.priya.nair@maxhealth.org',
    phone: '+91 94455 55667',
    role: 'DOCTOR',
    isVerified: true,
    createdAt: '2026-08-22T09:00:00Z'
  },
  {
    id: 'user_doc_arjun',
    name: 'Dr. Arjun Kumar',
    email: 'dr.arjun.kumar@aiims.edu',
    phone: '+91 94455 77889',
    role: 'DOCTOR',
    isVerified: true,
    createdAt: '2026-08-25T09:00:00Z'
  },
  {
    id: 'user_lab_apex',
    name: 'Apex Diagnostic Centre',
    email: 'reports@apexdiagnostics.com',
    phone: '+91 80 4455 6677',
    role: 'LAB',
    isVerified: true,
    createdAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 'user_pharm_city',
    name: 'CityMed Central Pharmacy',
    email: 'dispensary@citymed.com',
    phone: '+91 80 2233 4455',
    role: 'PHARMACY',
    isVerified: true,
    createdAt: '2026-08-12T11:00:00Z'
  },
  {
    id: 'user_admin_sys',
    name: 'System Super Administrator',
    email: 'admin@digitalhealth.gov.in',
    phone: '+91 11 2300 0001',
    role: 'ADMIN',
    isVerified: true,
    createdAt: '2026-08-01T00:00:00Z'
  }
];

const initialSeedPatients: PatientProfile[] = [
  {
    id: 'pat_arun',
    userId: 'user_patient_1',
    uhid: 'UHID-ACEA-031D',
    fullName: 'Arun Kumar',
    dob: '1994-06-14',
    age: 32,
    gender: 'Male',
    bloodGroup: 'B Positive (B+)',
    phone: '+91 98765 43210',
    email: 'arun.kumar@gmail.com',
    emergencyContact: {
      name: 'Sunita Kumar',
      relationship: 'Spouse',
      phone: '+91 98765 43211'
    },
    allergies: ['Penicillin', 'Sulfonamides'],
    chronicConditions: ['Migraine with aura', 'Mild essential hypertension'],
    emergencyAccessAllowed: true,
    registeredDate: '2026-09-01'
  }
];

const initialSeedDoctors: DoctorProfile[] = [
  {
    id: 'doc_rahul',
    userId: 'user_doc_rahul',
    name: 'Dr. Rahul Sharma',
    specialization: 'Neurology',
    hospital: 'Apollo Health City, Department of Neurosciences',
    licenseNumber: 'MCI-REG-482910',
    qualifications: 'MBBS, MD (Gen Med), DM (Neurology), FICP',
    consultationFee: 500,
    rating: 4.9,
    experienceYears: 14,
    availabilityDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availabilityHours: '09:00 AM - 02:00 PM',
    isVerified: true,
    verificationNotes: 'Medical Council Credentials verified by State Health Authority'
  },
  {
    id: 'doc_ananya',
    userId: 'user_doc_ananya',
    name: 'Dr. Ananya Rao',
    specialization: 'General Medicine',
    hospital: 'Fortis Memorial Research Institute',
    licenseNumber: 'MCI-REG-391204',
    qualifications: 'MBBS, MD (Internal Medicine)',
    consultationFee: 600,
    rating: 4.8,
    experienceYears: 10,
    availabilityDays: ['Mon', 'Wed', 'Fri', 'Sat'],
    availabilityHours: '10:00 AM - 04:00 PM',
    isVerified: true
  },
  {
    id: 'doc_priya',
    userId: 'user_doc_priya',
    name: 'Dr. Priya Nair',
    specialization: 'Dermatology',
    hospital: 'Max Super Specialty Hospital',
    licenseNumber: 'MCI-REG-520194',
    qualifications: 'MBBS, DVD, MD (Dermatology, Venereology & Leprosy)',
    consultationFee: 700,
    rating: 4.9,
    experienceYears: 12,
    availabilityDays: ['Tue', 'Thu', 'Sat'],
    availabilityHours: '02:00 PM - 07:00 PM',
    isVerified: true
  },
  {
    id: 'doc_arjun',
    userId: 'user_doc_arjun',
    name: 'Dr. Arjun Kumar',
    specialization: 'Orthopedics',
    hospital: 'AIIMS New Delhi, Orthopedic Trauma Center',
    licenseNumber: 'MCI-REG-619283',
    qualifications: 'MBBS, MS (Orthopedics), MCh (Joint Replacement)',
    consultationFee: 800,
    rating: 4.7,
    experienceYears: 16,
    availabilityDays: ['Mon', 'Tue', 'Thu', 'Fri'],
    availabilityHours: '09:30 AM - 01:30 PM',
    isVerified: true
  }
];

const initialSeedLabs: DiagnosticCentre[] = [
  {
    id: 'lab_apex',
    userId: 'user_lab_apex',
    name: 'Apex Diagnostic Centre & Pathology Labs',
    licenseNumber: 'NABL-MED-LAB-2024-998',
    accreditedBy: 'NABL & NABH Accredited Laboratory',
    address: 'Plot 42, Health City Boulevard, Bangalore 560068',
    phone: '+91 80 4455 6677',
    isVerified: true
  }
];

const initialSeedPharmacies: Pharmacy[] = [
  {
    id: 'pharm_city',
    userId: 'user_pharm_city',
    name: 'CityMed Central Pharmacy & Dispensary',
    licenseNumber: 'DRUG-LIC-KAR-2023-4412',
    pharmacistInCharge: 'Ramesh Varma, B.Pharm, Registered Pharmacist',
    address: 'Ground Floor, Medical Arts Center, Bangalore 560068',
    phone: '+91 80 2233 4455',
    isVerified: true
  }
];

// Initial seeded Lab Reports parsed with full test names (preserving Total Leukocyte Count, Absolute Neutrophil Count, etc.)
const parsedCbc = parseLaboratoryReport(SAMPLE_LAB_REPORTS[0].rawText);
const initialLabReports: LabReport[] = [
  {
    id: 'rep_cbc_01',
    patientId: 'pat_arun',
    uhid: 'UHID-ACEA-031D',
    labId: 'lab_apex',
    labName: 'Apex Diagnostic Centre & Pathology Labs',
    reportName: 'Complete Blood Count (CBC) with Differential',
    reportType: 'HEMATOLOGY',
    uploadedAt: '2026-09-28T10:30:00Z',
    fileName: 'CBC_Report_UHID-ACEA-031D.pdf',
    fileSize: '348 KB',
    ocrRawText: SAMPLE_LAB_REPORTS[0].rawText,
    testResults: parsedCbc.testResults,
    statusSummary: parsedCbc.overallStatus
  }
];

const initialPrescriptions: Prescription[] = [
  {
    id: 'rx_neuro_01',
    patientId: 'pat_arun',
    uhid: 'UHID-ACEA-031D',
    patientName: 'Arun Kumar',
    doctorId: 'doc_rahul',
    doctorName: 'Dr. Rahul Sharma',
    doctorSpecialty: 'Neurology',
    hospital: 'Apollo Health City',
    diagnosis: 'Recurrent Tension-Type Migraine with Photophobia',
    clinicalNotes: 'Patient complains of unilateral temporal throbbing episodes. Recommended hydration, sleep hygiene, and short-term prophylactic regimen.',
    vitals: {
      bloodPressure: '128/84',
      heartRate: 74,
      temperature: '98.4°F',
      spo2: 99
    },
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
        instructions: 'Take 1 tablet twice daily after meals. Maintain plenty of water intake.'
      },
      {
        id: 'med_naproxen',
        medicineName: 'Naproxen Sodium 250 mg',
        dosage: '1 tablet (250 mg)',
        form: 'Tablet',
        frequency: 'Once daily',
        durationDays: 3,
        timings: ['09:00 PM'],
        timingRelation: 'After food',
        instructions: 'Take with full glass of water. Avoid on empty stomach.'
      }
    ],
    createdAt: '2026-09-29T11:45:00Z',
    pharmacyStatus: 'READY_FOR_PICKUP'
  }
];

const initialMedicineSchedules: MedicineSchedule[] = [
  {
    id: 'sched_1',
    prescriptionId: 'rx_neuro_01',
    patientId: 'pat_arun',
    medicineName: 'Paracetamol 500 mg',
    dosage: '1 tablet (500 mg)',
    timing: '08:00 AM',
    timingRelation: 'After food',
    date: '2026-10-01',
    status: 'TAKEN',
    takenAt: '2026-10-01T08:15:00Z',
    notificationSent: true
  },
  {
    id: 'sched_2',
    prescriptionId: 'rx_neuro_01',
    patientId: 'pat_arun',
    medicineName: 'Paracetamol 500 mg',
    dosage: '1 tablet (500 mg)',
    timing: '08:00 PM',
    timingRelation: 'After food',
    date: '2026-10-01',
    status: 'PENDING',
    notificationSent: true
  },
  {
    id: 'sched_3',
    prescriptionId: 'rx_neuro_01',
    patientId: 'pat_arun',
    medicineName: 'Naproxen Sodium 250 mg',
    dosage: '1 tablet (250 mg)',
    timing: '09:00 PM',
    timingRelation: 'After food',
    date: '2026-10-01',
    status: 'PENDING',
    notificationSent: false
  }
];

const initialAppointments: Appointment[] = [
  {
    id: 'apt_101',
    patientId: 'pat_arun',
    patientName: 'Arun Kumar',
    uhid: 'UHID-ACEA-031D',
    doctorId: 'doc_rahul',
    doctorName: 'Dr. Rahul Sharma',
    doctorSpecialty: 'Neurology',
    hospital: 'Apollo Health City',
    consultationFee: 500,
    date: '2026-10-01',
    time: '10:30 AM',
    tokenNumber: 'A-24',
    queuePosition: 2,
    estimatedWaitMinutes: 25,
    isEmergency: false,
    status: 'CONFIRMED',
    reasonForVisit: 'Follow-up consultation for persistent temporal headache and photophobia.',
    confirmedAt: '2026-09-30T16:00:00Z'
  }
];

// Seeded Consents: Start with a clear slate or active demo consent
const initialConsents: PatientConsent[] = [
  {
    id: 'consent_req_01',
    patientId: 'pat_arun',
    patientName: 'Arun Kumar',
    uhid: 'UHID-ACEA-031D',
    doctorId: 'doc_rahul',
    doctorName: 'Dr. Rahul Sharma',
    doctorSpecialty: 'Neurology',
    hospital: 'Apollo Health City',
    requestedAt: '2026-09-29T10:00:00Z',
    approvedAt: '2026-09-29T10:05:00Z',
    expiresAt: '2026-10-06T10:05:00Z',
    status: 'APPROVED',
    accessScope: ['BASIC_PROFILE', 'MEDICAL_HISTORY', 'LAB_REPORTS', 'PRESCRIPTIONS'],
    reason: 'Clinical consultation and diagnosis for recurrent migraine episodes.',
    duration: '7_DAYS'
  }
];

const initialAccessLogs: MedicalAccessLog[] = [
  {
    id: 'log_001',
    patientId: 'pat_arun',
    patientUhid: 'UHID-ACEA-031D',
    patientName: 'Arun Kumar',
    actorId: 'doc_rahul',
    actorName: 'Dr. Rahul Sharma',
    actorRole: 'DOCTOR',
    action: 'SEARCH_PATIENT',
    resource: 'Patient Directory Lookup (UHID-ACEA-031D)',
    timestamp: '2026-09-29T09:58:12Z',
    ipAddress: '192.168.10.45 (Apollo Health City LAN)',
    reason: 'Patient arrived for OPD Neurological consultation',
    accessGranted: true
  },
  {
    id: 'log_002',
    patientId: 'pat_arun',
    patientUhid: 'UHID-ACEA-031D',
    patientName: 'Arun Kumar',
    actorId: 'doc_rahul',
    actorName: 'Dr. Rahul Sharma',
    actorRole: 'DOCTOR',
    action: 'REQUEST_CONSENT',
    resource: 'Consent Request Module',
    timestamp: '2026-09-29T10:00:00Z',
    ipAddress: '192.168.10.45',
    reason: 'Clinical consultation and diagnosis for recurrent migraine episodes',
    consentId: 'consent_req_01',
    accessGranted: true
  },
  {
    id: 'log_003',
    patientId: 'pat_arun',
    patientUhid: 'UHID-ACEA-031D',
    patientName: 'Arun Kumar',
    actorId: 'pat_arun',
    actorName: 'Arun Kumar',
    actorRole: 'PATIENT',
    action: 'APPROVE_CONSENT',
    resource: 'Patient Consent Security Gateway',
    timestamp: '2026-09-29T10:05:00Z',
    ipAddress: '49.207.198.112 (Mobile 5G)',
    reason: 'Patient granted 7-day scoped access for Dr. Rahul Sharma',
    consentId: 'consent_req_01',
    accessGranted: true
  },
  {
    id: 'log_004',
    patientId: 'pat_arun',
    patientUhid: 'UHID-ACEA-031D',
    patientName: 'Arun Kumar',
    actorId: 'doc_rahul',
    actorName: 'Dr. Rahul Sharma',
    actorRole: 'DOCTOR',
    action: 'VIEW_LAB_REPORTS',
    resource: 'CBC Report (CBC_Report_UHID-ACEA-031D.pdf)',
    timestamp: '2026-09-29T10:12:30Z',
    ipAddress: '192.168.10.45',
    reason: 'Reviewed Hemoglobin & Platelets prior to prescription',
    consentId: 'consent_req_01',
    accessGranted: true
  },
  {
    id: 'log_005',
    patientId: 'pat_arun',
    patientUhid: 'UHID-ACEA-031D',
    actorId: 'doc_arjun',
    actorName: 'Dr. Arjun Kumar',
    actorRole: 'DOCTOR',
    action: 'UNAUTHORIZED_ACCESS_BLOCKED',
    resource: 'Patient Full Clinical Records',
    timestamp: '2026-09-30T14:22:10Z',
    ipAddress: '172.16.4.19 (AIIMS Clinical Portal)',
    reason: 'Doctor attempted direct clinical record query without active consent token',
    accessGranted: false
  }
];

const initialNotifications: AppNotification[] = [
  {
    id: 'notif_1',
    recipientUserId: 'user_patient_1',
    category: 'LAB_REPORT',
    title: 'New Diagnostic Report Uploaded',
    message: 'Apex Diagnostic Centre uploaded "Complete Blood Count (CBC) with Differential" to your UHID-ACEA-031D.',
    scheduledTime: '2026-09-28T10:30:00Z',
    sentTime: '2026-09-28T10:30:05Z',
    deliveryStatus: 'DELIVERED',
    channels: ['IN_APP', 'SMS', 'WHATSAPP'],
    isRead: false,
    metadata: {
      reportId: 'rep_cbc_01',
      uhid: 'UHID-ACEA-031D',
      smsPreview: 'Govt Health Stack: New lab report (CBC) uploaded by Apex Diagnostics for UHID-ACEA-031D. Log in to view details.',
      whatsappPreview: '🏥 *Digital Health Stack Alert*\nYour laboratory test results for *Complete Blood Count* have been securely attached to your UHID *UHID-ACEA-031D*.\nStatus: Mild normocytic anemia.'
    }
  },
  {
    id: 'notif_2',
    recipientUserId: 'user_patient_1',
    category: 'MEDICINE',
    title: 'Medicine Reminder: Paracetamol 500 mg',
    message: 'Take 1 tablet of Paracetamol 500 mg after food (Evening Dose - 08:00 PM).',
    scheduledTime: '2026-10-01T20:00:00Z',
    sentTime: '2026-10-01T20:00:01Z',
    deliveryStatus: 'DELIVERED',
    channels: ['IN_APP', 'SMS', 'WHATSAPP'],
    isRead: false,
    metadata: {
      smsPreview: 'Rx Reminder: Paracetamol 500 mg - 1 tablet after food. Time: 8:00 PM. Digital Health Stack.',
      whatsappPreview: '💊 *Medication Reminder*\n*Medicine*: Paracetamol 500 mg\n*Dosage*: 1 tablet\n*Instruction*: After food\n*Prescribing Doctor*: Dr. Rahul Sharma'
    }
  },
  {
    id: 'notif_3',
    recipientUserId: 'user_patient_1',
    category: 'APPOINTMENT',
    title: 'Appointment Confirmed with Dr. Rahul Sharma',
    message: 'Your consultation is confirmed for today at 10:30 AM at Apollo Health City. Token: A-24. Please arrive 10 minutes early.',
    scheduledTime: '2026-09-30T16:00:00Z',
    sentTime: '2026-09-30T16:00:02Z',
    deliveryStatus: 'DELIVERED',
    channels: ['IN_APP', 'SMS'],
    isRead: true,
    metadata: {
      appointmentId: 'apt_101',
      smsPreview: 'Appt Confirmed: Dr. Rahul Sharma (Neurology) on 10 Oct, 10:30 AM. Token: A-24. Arrive 10 min early.'
    }
  }
];

export function getStoredData(): AppStateData {
  if (typeof window === 'undefined') {
    return getSeedData();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = getSeedData();
      saveStoredData(seeded);
      return seeded;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading stored health data:', e);
    return getSeedData();
  }
}

export function saveStoredData(data: AppStateData): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving health data:', e);
    }
  }
}

export function resetToSeedData(): AppStateData {
  const seed = getSeedData();
  saveStoredData(seed);
  return seed;
}

export function getSeedData(): AppStateData {
  return {
    users: initialSeedUsers,
    patients: initialSeedPatients,
    doctors: initialSeedDoctors,
    labs: initialSeedLabs,
    pharmacies: initialSeedPharmacies,
    consents: initialConsents,
    accessLogs: initialAccessLogs,
    labReports: initialLabReports,
    prescriptions: initialPrescriptions,
    medicineSchedules: initialMedicineSchedules,
    notifications: initialNotifications,
    appointments: initialAppointments,
    referrals: []
  };
}
