import type {
  User,
  PatientProfile,
  DoctorProfile,
  LaboratoryProfile,
  PharmacyProfile,
  ConsentRecord,
  AccessLog,
  LabReport,
  Prescription,
  MedicineSchedule,
  Notification,
  Appointment,
  Referral,
} from '../types';

const STORAGE_KEY = 'digital_health_stack_v2';

export interface AppStateData {
  users: User[];
  patients: PatientProfile[];
  doctors: DoctorProfile[];
  labs: LaboratoryProfile[];
  pharmacies: PharmacyProfile[];
  consents: ConsentRecord[];
  accessLogs: AccessLog[];
  labReports: LabReport[];
  prescriptions: Prescription[];
  medicineSchedules: MedicineSchedule[];
  notifications: Notification[];
  appointments: Appointment[];
  referrals: Referral[];
}

export function generateUhid(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  const generateBlock = (length: number): string => {
    let result = '';

    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return result;
  };

  return `UHID-${generateBlock(4)}-${generateBlock(4)}`;
}

function createInitialAdmin(): User {
  return {
    id: 'admin_initial',
    name: 'Digital Health Stack Administrator',
    email: 'admin@digitalhealth.gov.in',
    phone: '',
    role: 'ADMIN',
    isVerified: true,
    createdAt: new Date().toISOString(),
  };
}

function createEmptyState(): AppStateData {
  return {
    users: [createInitialAdmin()],
    patients: [],
    doctors: [],
    labs: [],
    pharmacies: [],
    consents: [],
    accessLogs: [],
    labReports: [],
    prescriptions: [],
    medicineSchedules: [],
    notifications: [],
    appointments: [],
    referrals: [],
  };
}

function normalizeState(
  parsed: Partial<AppStateData> | null | undefined
): AppStateData {
  const legacySeedIds = new Set([
    'user_patient_1',
    'user_doc_rahul',
    'user_doc_ananya',
    'user_doc_priya',
    'user_doc_arjun',
    'user_lab_apex',
    'user_pharm_city',
    'user_admin_sys',
  ]);

  const users = (
    Array.isArray(parsed?.users) ? parsed.users : []
  ).filter(
    user => !legacySeedIds.has(user.id)
  );

  const hasInitialAdmin = users.some(
    user =>
      user?.role === 'ADMIN' &&
      user?.email?.toLowerCase() ===
        'admin@digitalhealth.gov.in'
  );

  if (!hasInitialAdmin) {
    users.push(createInitialAdmin());
  }

  return {
    users,

    patients: (
      Array.isArray(parsed?.patients)
        ? parsed.patients
        : []
    ).filter(
      patient => !legacySeedIds.has(patient.userId)
    ),

    doctors: (
      Array.isArray(parsed?.doctors)
        ? parsed.doctors
        : []
    ).filter(
      doctor => !legacySeedIds.has(doctor.userId)
    ),

    labs: (
      Array.isArray(parsed?.labs)
        ? parsed.labs
        : []
    ).filter(
      lab => !legacySeedIds.has(lab.userId)
    ),

    pharmacies: (
      Array.isArray(parsed?.pharmacies)
        ? parsed.pharmacies
        : []
    ).filter(
      pharmacy => !legacySeedIds.has(pharmacy.userId)
    ),

    consents: Array.isArray(parsed?.consents)
      ? parsed.consents
      : [],

    accessLogs: Array.isArray(parsed?.accessLogs)
      ? parsed.accessLogs
      : [],

    labReports: Array.isArray(parsed?.labReports)
      ? parsed.labReports
      : [],

    prescriptions: Array.isArray(parsed?.prescriptions)
      ? parsed.prescriptions
      : [],

    medicineSchedules: Array.isArray(
      parsed?.medicineSchedules
    )
      ? parsed.medicineSchedules
      : [],

    notifications: Array.isArray(
      parsed?.notifications
    )
      ? parsed.notifications
      : [],

    appointments: Array.isArray(
      parsed?.appointments
    )
      ? parsed.appointments
      : [],

    referrals: Array.isArray(parsed?.referrals)
      ? parsed.referrals
      : [],
  };
}

export function getStoredData(): AppStateData {
  if (typeof window === 'undefined') {
    return createEmptyState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      const emptyState = createEmptyState();

      saveStoredData(emptyState);

      return emptyState;
    }

    const parsed =
      JSON.parse(raw) as Partial<AppStateData>;

    const normalizedState =
      normalizeState(parsed);

    saveStoredData(normalizedState);

    return normalizedState;
  } catch (error) {
    console.error(
      'Error loading stored health data:',
      error
    );

    return createEmptyState();
  }
}

export function saveStoredData(
  data: AppStateData
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error(
      'Error saving health data:',
      error
    );
  }
}

export function resetToSeedData(): AppStateData {
  const emptyState = createEmptyState();

  saveStoredData(emptyState);

  return emptyState;
}

export function getSeedData(): AppStateData {
  return createEmptyState();
}