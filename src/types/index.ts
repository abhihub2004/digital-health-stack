export type UserRole = 'PATIENT' | 'DOCTOR' | 'LAB' | 'PHARMACY' | 'ADMIN';

export type ConsentStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'REVOKED' | 'EXPIRED';

export type AccessScope = 
  | 'BASIC_PROFILE'
  | 'MEDICAL_HISTORY'
  | 'LAB_REPORTS'
  | 'PRESCRIPTIONS'
  | 'DIAGNOSTIC_REPORTS'
  | 'FULL_RECORD';

export type ConsentDuration = '1_HOUR' | '24_HOURS' | '7_DAYS' | 'THIS_CONSULTATION';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  uhid: string; // e.g. UHID-ACEA-031D
  fullName: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: string[];
  chronicConditions: string[];
  emergencyAccessAllowed: boolean;
  registeredDate: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  hospital: string;
  licenseNumber: string;
  qualifications: string;
  consultationFee: number;
  rating: number;
  experienceYears: number;
  availabilityDays: string[];
  availabilityHours: string;
  isVerified: boolean;
  verificationNotes?: string;
}

export interface DiagnosticCentre {
  id: string;
  userId: string;
  name: string;
  licenseNumber: string;
  accreditedBy: string; // e.g. NABL, CAP
  address: string;
  phone: string;
  isVerified: boolean;
}

export interface Pharmacy {
  id: string;
  userId: string;
  name: string;
  licenseNumber: string;
  pharmacistInCharge: string;
  address: string;
  phone: string;
  isVerified: boolean;
}

export interface PatientConsent {
  id: string;
  patientId: string;
  patientName: string;
  uhid: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospital: string;
  requestedAt: string;
  approvedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  status: ConsentStatus;
  accessScope: AccessScope[];
  reason: string;
  duration: ConsentDuration;
  revokedReason?: string;
}

export type AccessAction =
  | 'SEARCH_PATIENT'
  | 'REQUEST_CONSENT'
  | 'APPROVE_CONSENT'
  | 'DENY_CONSENT'
  | 'REVOKE_CONSENT'
  | 'VIEW_BASIC_PROFILE'
  | 'VIEW_MEDICAL_HISTORY'
  | 'VIEW_LAB_REPORTS'
  | 'VIEW_PRESCRIPTIONS'
  | 'VIEW_DIAGNOSTIC_REPORTS'
  | 'VIEW_FULL_RECORD'
  | 'UNAUTHORIZED_ACCESS_BLOCKED'
  | 'CREATE_PRESCRIPTION'
  | 'UPLOAD_LAB_REPORT'
  | 'DISPENSE_MEDICINE'
  | 'BOOK_APPOINTMENT'
  | 'VERIFY_PROVIDER';

export interface MedicalAccessLog {
  id: string;
  patientId: string;
  patientUhid: string;
  patientName?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: AccessAction;
  resource: string;
  timestamp: string;
  ipAddress: string;
  reason: string;
  consentId?: string;
  accessGranted: boolean;
}

export type LabTestStatus = 'Normal' | 'Low' | 'High' | 'Critical';

export interface LabTestResult {
  testName: string;
  value: number | string;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  status: LabTestStatus;
  clinicalNote?: string;
}

export interface LabReport {
  id: string;
  patientId: string;
  uhid: string;
  labId: string;
  labName: string;
  reportName: string;
  reportType: 'HEMATOLOGY' | 'BIOCHEMISTRY' | 'THYROID' | 'LIPID' | 'URINALYSIS' | 'RADIOLOGY' | 'OTHER';
  uploadedAt: string;
  fileName: string;
  fileSize: string;
  ocrRawText: string;
  testResults: LabTestResult[];
  statusSummary: 'Normal' | 'Abnormal Values Detected' | 'Critical Values Detected';
}

export interface PrescriptionMedicineItem {
  id: string;
  medicineName: string;
  dosage: string; // e.g. "500 mg"
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Inhaler' | 'Drops';
  frequency: 'Once daily' | 'Twice daily' | 'Thrice daily' | 'Four times daily' | 'As needed (SOS)';
  durationDays: number;
  timings: string[]; // e.g. ["08:00 AM", "08:00 PM"]
  timingRelation: 'Before food' | 'After food' | 'With food' | 'Empty stomach';
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  uhid: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospital: string;
  diagnosis: string;
  clinicalNotes: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: string;
    spo2?: number;
  };
  medicines: PrescriptionMedicineItem[];
  createdAt: string;
  prescribedAt?: string;
  pharmacyStatus: 'NEW' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'DISPENSED';
  dispensedAt?: string;
  dispensedBy?: string;
}

export interface MedicineSchedule {
  id: string;
  prescriptionId: string;
  patientId: string;
  medicineName: string;
  dosage: string;
  timing: string; // e.g. "08:00 AM"
  timingRelation: string; // e.g. "After food"
  date: string;
  status: 'PENDING' | 'TAKEN' | 'SKIPPED' | 'SNOOZED';
  takenAt?: string;
  notificationSent: boolean;
}

export type NotificationCategory =
  | 'APPOINTMENT'
  | 'PRESCRIPTION'
  | 'MEDICINE'
  | 'LAB_REPORT'
  | 'CONSENT'
  | 'REFERRAL'
  | 'SYSTEM'
  | 'EMERGENCY';

export interface AppNotification {
  id: string;
  recipientUserId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  scheduledTime: string;
  sentTime: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED';
  channels: ('IN_APP' | 'SMS' | 'WHATSAPP')[];
  isRead: boolean;
  metadata?: {
    uhid?: string;
    consentId?: string;
    appointmentId?: string;
    prescriptionId?: string;
    reportId?: string;
    doctorId?: string;
    actionRequired?: boolean;
    isEmergency?: boolean;
    smsPreview?: string;
    whatsappPreview?: string;
  };
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SCHEDULED'
  | 'IN_QUEUE'
  | 'IN_CONSULTATION'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  uhid: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospital: string;
  consultationFee: number;
  date: string;
  time: string;
  tokenNumber: string; // e.g. "A-24"
  queuePosition: number;
  estimatedWaitMinutes: number;
  isEmergency: boolean;
  status: AppointmentStatus;
  reasonForVisit: string;
  confirmedAt?: string;
  cancelledAt?: string;
}

export interface Referral {
  id: string;
  patientId: string;
  uhid: string;
  patientName: string;
  referringDoctorId: string;
  referringDoctorName: string;
  referringSpecialty: string;
  receivingDoctorId: string;
  receivingDoctorName: string;
  receivingSpecialty: string;
  reason: string;
  clinicalNotes: string;
  requestedRecords: string[];
  status: 'PENDING_CONSENT' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  createdAt: string;
}

export interface CDSAlert {
  id: string;
  type: 'ABNORMAL_LAB' | 'DRUG_INTERACTION' | 'HIGH_RISK_VITAL' | 'DUPLICATE_TEST';
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  title: string;
  message: string;
  clinicalGuideline: string;
  relatedItem?: string;
}

export interface SymptomTriageResult {
  suggestedDepartment: string;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  isEmergency: boolean;
  emergencyWarning?: string;
  recommendedDoctors: string[];
  notes: string;
}
