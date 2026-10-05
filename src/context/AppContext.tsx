import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
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
  Referral,
  AccessScope,
  ConsentDuration,
  AppointmentStatus,
  CDSAlert,
  LabTestResult
} from '../types';
import { getStoredData, saveStoredData, resetToSeedData, AppStateData, generateUhid } from '../services/storage';
import { parseLaboratoryReport } from '../services/ocrParser';
import { evaluateClinicalDecisionSupport } from '../services/clinicalDecisionSupport';

interface AppContextType {
  data: AppStateData;
  currentUser: User;
  currentRole: UserRole;
  currentPatient?: PatientProfile;
  currentDoctor?: DoctorProfile;
  currentLab?: DiagnosticCentre;
  currentPharmacy?: Pharmacy;
  activeConsents: PatientConsent[];
  pendingConsentRequestsForMe: PatientConsent[];
  notifications: AppNotification[];
  unreadNotifsCount: number;
  cdsAlerts: CDSAlert[];
  
  // Actions
  switchUser: (userId: string) => void;
  requestConsent: (uhid: string, reason: string, scopes: AccessScope[], duration: ConsentDuration) => { success: boolean; error?: string };
  respondConsent: (consentId: string, decision: 'ALLOW' | 'DENY', scopes?: AccessScope[], duration?: ConsentDuration) => void;
  revokeConsent: (consentId: string, reason?: string) => void;
  uploadLabReport: (
    uhid: string,
    reportName: string,
    rawOcrText: string,
    reportType?: any,
    customLabName?: string,
    customResults?: LabTestResult[]
  ) => { success: boolean; error?: string; report?: LabReport };
  createPrescription: (rxData: {
    uhid: string;
    diagnosis: string;
    clinicalNotes: string;
    medicines: any[];
    vitals?: any;
  }) => { success: boolean; error?: string };
  updateMedicineSchedule: (scheduleId: string, status: 'TAKEN' | 'SKIPPED' | 'SNOOZED') => void;
  bookAppointment: (booking: {
    doctorId: string;
    date: string;
    time: string;
    reasonForVisit: string;
    isEmergency?: boolean;
  }) => { success: boolean; appointment?: Appointment };
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  dispensePrescription: (prescriptionId: string) => void;
  verifyProvider: (type: 'DOCTOR' | 'LAB' | 'PHARMACY', id: string, verified: boolean) => void;
  requestEmergencyAccess: (uhid: string, emergencyReason: string, facility?: string) => { success: boolean; error?: string; consent?: PatientConsent };
  isAuthenticated: boolean;
  login: (role: UserRole, userId?: string, credentials?: any) => { success: boolean; error?: string };
  logout: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetSystemData: () => void;
  createNewPatient: (patientData: Partial<PatientProfile>) => PatientProfile;
  createNewDoctor: (docData: Partial<DoctorProfile> & { email?: string }) => DoctorProfile;
  createNewProvider: (provData: {
    type: 'LAB' | 'PHARMACY';
    name: string;
    licenseNumber: string;
    accreditationOrPharmacist: string;
    address: string;
    phone: string;
  }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppStateData>(() => getStoredData());
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('dhs_user_id');
      if (savedUser) return savedUser;
    }
    return 'user_patient_1';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      // Clear legacy permanent auth so first page is always Login
      localStorage.removeItem('dhs_auth_state');
      const sessionAuth = sessionStorage.getItem('dhs_session_auth');
      if (sessionAuth === 'true') return true;
    }
    // Always default to false: First page must be Login Portal
    return false;
  });

  // Sync to localStorage on update
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  const currentUser = data.users.find(u => u.id === currentUserId) || data.users[0];
  const currentRole = currentUser.role;

  const currentPatient = data.patients.find(p => p.userId === currentUser.id);
  const currentDoctor = data.doctors.find(d => d.userId === currentUser.id);
  const currentLab = data.labs.find(l => l.userId === currentUser.id);
  const currentPharmacy = data.pharmacies.find(p => p.userId === currentUser.id);

  // Active consents
  const activeConsents = data.consents.filter(c => {
    if (c.status !== 'APPROVED') return false;
    if (c.expiresAt && new Date(c.expiresAt) <= new Date()) return false;
    return true;
  });

  // Pending consent requests targeting current patient
  const pendingConsentRequestsForMe = data.consents.filter(c => {
    if (currentRole !== 'PATIENT' || !currentPatient) return false;
    return c.patientId === currentPatient.id && c.status === 'PENDING';
  });

  // Notifications for current user
  const userNotifications = data.notifications.filter(n => n.recipientUserId === currentUser.id);
  const unreadNotifsCount = userNotifications.filter(n => !n.isRead).length;

  // Real-time CDS alerts for current patient or doctor's active patient
  const relevantReports = currentPatient 
    ? data.labReports.filter(r => r.uhid === currentPatient.uhid) 
    : data.labReports;
  const relevantRx = currentPatient 
    ? data.prescriptions.filter(p => p.uhid === currentPatient.uhid) 
    : data.prescriptions;
  const cdsAlerts = evaluateClinicalDecisionSupport(relevantReports, relevantRx);

  // Internal Audit Log Helper
  const logAction = (
    patientId: string,
    patientUhid: string,
    action: MedicalAccessLog['action'],
    resource: string,
    reason: string,
    accessGranted: boolean,
    consentId?: string
  ) => {
    const newLog: MedicalAccessLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      patientUhid,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      resource,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.104 (Authenticated Session)',
      reason,
      consentId,
      accessGranted
    };

    setData(prev => ({
      ...prev,
      accessLogs: [newLog, ...prev.accessLogs]
    }));
  };

  const switchUser = (userId: string) => {
    const user = data.users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(user.id);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dhs_session_auth', 'true');
        sessionStorage.setItem('dhs_user_id', user.id);
        localStorage.setItem('dhs_user_id', user.id);
      }
    }
  };

  const login = (role: UserRole, userId?: string, credentials?: any): { success: boolean; error?: string } => {
    let targetUser: User | undefined;
    if (userId) {
      targetUser = data.users.find(u => u.id === userId);
    }
    if (!targetUser && credentials?.identifier) {
      const q = credentials.identifier.trim().toLowerCase();
      // check patient UHID/email/phone
      const pat = data.patients.find(p => p.uhid.toLowerCase() === q || p.email.toLowerCase() === q || p.phone.includes(q));
      if (pat) {
        targetUser = data.users.find(u => u.id === pat.userId);
      }
      // check doctor ID/license/email
      if (!targetUser) {
        const doc = data.doctors.find(d => d.userId.toLowerCase() === q || d.licenseNumber.toLowerCase() === q);
        if (doc) targetUser = data.users.find(u => u.id === doc.userId);
      }
      // check direct user ID or email
      if (!targetUser) {
        targetUser = data.users.find(u => u.id.toLowerCase() === q || u.email.toLowerCase() === q);
      }
    }
    if (!targetUser) {
      targetUser = data.users.find(u => u.role === role);
    }
    if (targetUser) {
      setCurrentUserId(targetUser.id);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dhs_session_auth', 'true');
        sessionStorage.setItem('dhs_user_id', targetUser.id);
        localStorage.setItem('dhs_user_id', targetUser.id);
      }
      return { success: true };
    }
    return { success: false, error: 'User account not found.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dhs_session_auth');
      sessionStorage.removeItem('dhs_user_id');
      localStorage.removeItem('dhs_auth_state');
    }
  };

  const requestConsent = (
    uhid: string,
    reason: string,
    scopes: AccessScope[],
    duration: ConsentDuration
  ): { success: boolean; error?: string } => {
    if (currentRole !== 'DOCTOR' || !currentDoctor) {
      return { success: false, error: 'Only registered doctors can request patient record access.' };
    }

    if (!currentDoctor.isVerified) {
      return { success: false, error: 'Doctor verification pending approval by system administrator.' };
    }

    const patient = data.patients.find(p => p.uhid.toLowerCase() === uhid.toLowerCase().trim());
    if (!patient) {
      return { success: false, error: `Patient with UHID ${uhid} not found.` };
    }

    const newConsent: PatientConsent = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId: patient.id,
      patientName: patient.fullName,
      uhid: patient.uhid,
      doctorId: currentDoctor.id,
      doctorName: currentDoctor.name,
      doctorSpecialty: currentDoctor.specialization,
      hospital: currentDoctor.hospital,
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
      accessScope: scopes.length > 0 ? scopes : ['BASIC_PROFILE', 'LAB_REPORTS'],
      reason: reason.trim() || 'Clinical evaluation and lab report examination.',
      duration
    };

    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      recipientUserId: patient.userId,
      category: 'CONSENT',
      title: `Access Request: ${currentDoctor.name}`,
      message: `${currentDoctor.name} (${currentDoctor.specialization} at ${currentDoctor.hospital}) has requested access to your health records for: "${newConsent.reason}".`,
      scheduledTime: new Date().toISOString(),
      sentTime: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
      channels: ['IN_APP', 'SMS', 'WHATSAPP'],
      isRead: false,
      metadata: {
        consentId: newConsent.id,
        uhid: patient.uhid,
        doctorId: currentDoctor.id,
        actionRequired: true,
        smsPreview: `Health Stack Alert: ${currentDoctor.name} requested access to your medical records for "${newConsent.reason}". Reply ALLOW or log in to manage.`,
        whatsappPreview: `🔒 *Consent Authorization Request*\n*Doctor*: ${currentDoctor.name}\n*Hospital*: ${currentDoctor.hospital}\n*Reason*: ${newConsent.reason}\n*Scope Requested*: ${newConsent.accessScope.join(', ')}\n\n_Review and authorize on Digital Health Stack._`
      }
    };

    setData(prev => ({
      ...prev,
      consents: [newConsent, ...prev.consents],
      notifications: [notif, ...prev.notifications]
    }));

    logAction(
      patient.id,
      patient.uhid,
      'REQUEST_CONSENT',
      `Requested Scope: ${newConsent.accessScope.join(', ')}`,
      newConsent.reason,
      true,
      newConsent.id
    );

    return { success: true };
  };

  const requestEmergencyAccess = (
    uhid: string,
    emergencyReason: string,
    facility?: string
  ): { success: boolean; error?: string; consent?: PatientConsent } => {
    if (currentRole !== 'DOCTOR' || !currentDoctor) {
      return { success: false, error: 'Only authorized medical doctors can invoke emergency access.' };
    }

    const patient = data.patients.find(p => p.uhid.toLowerCase() === uhid.toLowerCase().trim());
    if (!patient) {
      return { success: false, error: `Patient with UHID ${uhid} not found.` };
    }

    const expDate = new Date();
    expDate.setHours(expDate.getHours() + 2); // 2 hours emergency window

    const emergencyConsent: PatientConsent = {
      id: `emergency_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId: patient.id,
      patientName: patient.fullName,
      uhid: patient.uhid,
      doctorId: currentDoctor.id,
      doctorName: currentDoctor.name,
      doctorSpecialty: currentDoctor.specialization,
      hospital: facility || currentDoctor.hospital,
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      expiresAt: expDate.toISOString(),
      status: 'APPROVED',
      accessScope: ['FULL_RECORD'],
      reason: `[EMERGENCY OVERRIDE] ${emergencyReason.trim()}`,
      duration: '1_HOUR'
    };

    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      recipientUserId: patient.userId,
      category: 'CONSENT',
      title: '🚨 EMERGENCY ACCESS OVERRIDE TRIGGERED',
      message: `Dr. ${currentDoctor.name} (${currentDoctor.specialization} at ${facility || currentDoctor.hospital}) accessed your medical records under Emergency Protocol. Reason: "${emergencyReason.trim()}". Valid for 2 hours.`,
      scheduledTime: new Date().toISOString(),
      sentTime: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
      channels: ['IN_APP', 'SMS', 'WHATSAPP'],
      isRead: false,
      metadata: {
        consentId: emergencyConsent.id,
        uhid: patient.uhid,
        doctorId: currentDoctor.id,
        isEmergency: true
      }
    };

    setData(prev => ({
      ...prev,
      consents: [emergencyConsent, ...prev.consents],
      notifications: [notif, ...prev.notifications]
    }));

    logAction(
      patient.id,
      patient.uhid,
      'REQUEST_CONSENT',
      'EMERGENCY_OVERRIDE_FULL_RECORD',
      `[EMERGENCY ACCESS by Dr. ${currentDoctor.name} at ${facility || currentDoctor.hospital}] ${emergencyReason.trim()}`,
      true,
      emergencyConsent.id
    );

    return { success: true, consent: emergencyConsent };
  };

  const respondConsent = (
    consentId: string,
    decision: 'ALLOW' | 'DENY',
    approvedScopes?: AccessScope[],
    duration?: ConsentDuration
  ) => {
    const consent = data.consents.find(c => c.id === consentId);
    if (!consent) return;

    const patient = data.patients.find(p => p.id === consent.patientId);
    const doctor = data.doctors.find(d => d.id === consent.doctorId);

    if (decision === 'ALLOW') {
      const expDate = new Date();
      const dur = duration || consent.duration;
      if (dur === '1_HOUR') expDate.setHours(expDate.getHours() + 1);
      else if (dur === '24_HOURS' || dur === 'THIS_CONSULTATION') expDate.setHours(expDate.getHours() + 24);
      else if (dur === '7_DAYS') expDate.setDate(expDate.getDate() + 7);

      const updatedConsent: PatientConsent = {
        ...consent,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        expiresAt: expDate.toISOString(),
        accessScope: approvedScopes && approvedScopes.length > 0 ? approvedScopes : consent.accessScope,
        duration: dur
      };

      const doctorNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        recipientUserId: doctor ? doctor.userId : '',
        category: 'CONSENT',
        title: 'Patient Granted Consent',
        message: `${consent.patientName} (${consent.uhid}) has granted access to records (${updatedConsent.accessScope.join(', ')}). Valid until ${expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        scheduledTime: new Date().toISOString(),
        sentTime: new Date().toISOString(),
        deliveryStatus: 'DELIVERED',
        channels: ['IN_APP'],
        isRead: false,
        metadata: {
          consentId: consent.id,
          uhid: consent.uhid
        }
      };

      setData(prev => ({
        ...prev,
        consents: prev.consents.map(c => c.id === consentId ? updatedConsent : c),
        notifications: doctor ? [doctorNotif, ...prev.notifications] : prev.notifications
      }));

      logAction(
        consent.patientId,
        consent.uhid,
        'APPROVE_CONSENT',
        `Approved scope: ${updatedConsent.accessScope.join(', ')}`,
        `Patient granted consent for ${updatedConsent.duration}`,
        true,
        consent.id
      );
    } else {
      setData(prev => ({
        ...prev,
        consents: prev.consents.map(c => c.id === consentId ? { ...c, status: 'DENIED' } : c)
      }));

      logAction(
        consent.patientId,
        consent.uhid,
        'DENY_CONSENT',
        'Consent Request Refused',
        'Patient declined access request',
        true,
        consent.id
      );
    }
  };

  const revokeConsent = (consentId: string, reason?: string) => {
    const consent = data.consents.find(c => c.id === consentId);
    if (!consent) return;

    const doctor = data.doctors.find(d => d.id === consent.doctorId);
    const revokeMsg = reason || 'Revoked immediately by patient';

    const updatedConsent: PatientConsent = {
      ...consent,
      status: 'REVOKED',
      revokedAt: new Date().toISOString(),
      revokedReason: revokeMsg
    };

    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      recipientUserId: doctor ? doctor.userId : '',
      category: 'CONSENT',
      title: 'Consent Access Revoked',
      message: `${consent.patientName} (${consent.uhid}) has revoked your clinical data access privileges.`,
      scheduledTime: new Date().toISOString(),
      sentTime: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
      channels: ['IN_APP'],
      isRead: false,
      metadata: {
        consentId: consent.id,
        uhid: consent.uhid
      }
    };

    setData(prev => ({
      ...prev,
      consents: prev.consents.map(c => c.id === consentId ? updatedConsent : c),
      notifications: doctor ? [notif, ...prev.notifications] : prev.notifications
    }));

    logAction(
      consent.patientId,
      consent.uhid,
      'REVOKE_CONSENT',
      'Clinical Access Rights Revocation',
      revokeMsg,
      true,
      consent.id
    );
  };

  const uploadLabReport = (
    uhid: string,
    reportName: string,
    rawOcrText: string,
    reportType?: any,
    customLabName?: string,
    customResults?: LabTestResult[]
  ): { success: boolean; error?: string; report?: LabReport } => {
    const isLab = currentRole === 'LAB' && !!currentLab;
    const isPatient = currentRole === 'PATIENT' && !!currentPatient;

    if (!isLab && !isPatient) {
      return { success: false, error: 'Only authorized diagnostic centres or patients can upload lab reports.' };
    }

    const patient = data.patients.find(p => p.uhid.toLowerCase() === uhid.toLowerCase().trim());
    if (!patient) {
      return { success: false, error: `Patient with UHID ${uhid} not found.` };
    }

    if (isPatient && currentPatient && patient.uhid !== currentPatient.uhid) {
      return { success: false, error: 'Patients can only upload personal reports to their own UHID.' };
    }

    const parsed = parseLaboratoryReport(rawOcrText);
    const finalResults = (customResults && customResults.length > 0) ? customResults : parsed.testResults;

    const hasCritical = finalResults.some(t => t.status === 'Critical');
    const hasAbnormal = finalResults.some(t => t.status === 'Low' || t.status === 'High');
    const computedStatus = hasCritical ? 'Critical Values Detected' : (hasAbnormal ? 'Abnormal Values Detected' : 'Normal');

    const labDisplayName = isLab ? currentLab.name : (customLabName || 'Personal Health Record / Patient Upload');
    const labId = isLab ? currentLab.id : 'patient_personal_upload';

    const newReport: LabReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId: patient.id,
      uhid: patient.uhid,
      labId,
      labName: labDisplayName,
      reportName: reportName.trim() || parsed.reportName,
      reportType: reportType || parsed.reportType,
      uploadedAt: new Date().toISOString(),
      fileName: `${(reportName || 'Diagnostic_Report').replace(/\s+/g, '_')}_${patient.uhid}.pdf`,
      fileSize: '360 KB',
      ocrRawText: rawOcrText,
      testResults: finalResults,
      statusSummary: computedStatus
    };

    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      recipientUserId: patient.userId,
      category: 'LAB_REPORT',
      title: isPatient ? 'Personal Lab Report Uploaded' : 'New Diagnostic Report Uploaded',
      message: `${labDisplayName} uploaded "${newReport.reportName}" to your health profile.`,
      scheduledTime: new Date().toISOString(),
      sentTime: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
      channels: ['IN_APP', 'SMS', 'WHATSAPP'],
      isRead: false,
      metadata: {
        reportId: newReport.id,
        uhid: patient.uhid,
        smsPreview: `Health Stack: New lab report (${newReport.reportName}) recorded by ${labDisplayName} for UHID: ${patient.uhid}.`,
        whatsappPreview: `🔬 *New Laboratory Report Available*\n*Source*: ${labDisplayName}\n*Report*: ${newReport.reportName}\n*Status*: ${newReport.statusSummary}\n*UHID*: ${patient.uhid}\n\n_View structured results and reference ranges in your health vault._`
      }
    };

    setData(prev => ({
      ...prev,
      labReports: [newReport, ...prev.labReports],
      notifications: [notif, ...prev.notifications]
    }));

    logAction(
      patient.id,
      patient.uhid,
      'UPLOAD_LAB_REPORT',
      `Diagnostic Report: ${newReport.reportName}`,
      isPatient ? 'Personal lab report uploaded by patient' : 'Laboratory report uploaded against patient UHID',
      true
    );

    return { success: true, report: newReport };
  };

  const createPrescription = (rxData: {
    uhid: string;
    diagnosis: string;
    clinicalNotes: string;
    medicines: any[];
    vitals?: any;
  }): { success: boolean; error?: string } => {
    if (currentRole !== 'DOCTOR' || !currentDoctor) {
      return { success: false, error: 'Only doctors can create prescriptions.' };
    }

    const patient = data.patients.find(p => p.uhid.toLowerCase() === rxData.uhid.toLowerCase().trim());
    if (!patient) {
      return { success: false, error: `Patient with UHID ${rxData.uhid} not found.` };
    }

    // Check active consent
    const consent = activeConsents.find(c => c.patientId === patient.id && c.doctorId === currentDoctor.id);
    if (!consent) {
      return {
        success: false,
        error: 'Patient consent required. You must request and receive patient consent before issuing a prescription.'
      };
    }

    const newRx: Prescription = {
      id: `rx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId: patient.id,
      uhid: patient.uhid,
      patientName: patient.fullName,
      doctorId: currentDoctor.id,
      doctorName: currentDoctor.name,
      doctorSpecialty: currentDoctor.specialization,
      hospital: currentDoctor.hospital,
      diagnosis: rxData.diagnosis || 'Clinical evaluation',
      clinicalNotes: rxData.clinicalNotes || '',
      vitals: rxData.vitals,
      medicines: rxData.medicines,
      createdAt: new Date().toISOString(),
      pharmacyStatus: 'NEW'
    };

    // Auto-generate medication schedules & reminder notifications
    const today = new Date().toISOString().split('T')[0];
    const newSchedules: MedicineSchedule[] = [];
    const newNotifs: AppNotification[] = [];

    for (const med of newRx.medicines) {
      for (const time of med.timings) {
        const schedItem: MedicineSchedule = {
          id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          prescriptionId: newRx.id,
          patientId: patient.id,
          medicineName: med.medicineName,
          dosage: med.dosage,
          timing: time,
          timingRelation: med.timingRelation,
          date: today,
          status: 'PENDING',
          notificationSent: true
        };
        newSchedules.push(schedItem);

        newNotifs.push({
          id: `notif_med_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          recipientUserId: patient.userId,
          category: 'MEDICINE',
          title: `Medicine Reminder: ${med.medicineName}`,
          message: `Take ${med.dosage} ${med.timingRelation.toLowerCase()} at ${time}.`,
          scheduledTime: new Date().toISOString(),
          sentTime: new Date().toISOString(),
          deliveryStatus: 'DELIVERED',
          channels: ['IN_APP', 'SMS', 'WHATSAPP'],
          isRead: false,
          metadata: {
            prescriptionId: newRx.id,
            smsPreview: `Rx Reminder: ${med.medicineName} (${med.dosage}) - ${med.timingRelation} at ${time}. Digital Health Stack.`,
            whatsappPreview: `💊 *Prescription Dose Reminder*\n*Medicine*: ${med.medicineName}\n*Dose*: ${med.dosage}\n*Schedule*: ${time} (${med.timingRelation})\n*Doctor*: ${currentDoctor.name}`
          }
        });
      }
    }

    // Prescription created notification
    newNotifs.push({
      id: `notif_rx_${Date.now()}`,
      recipientUserId: patient.userId,
      category: 'PRESCRIPTION',
      title: `New Prescription Issued by ${currentDoctor.name}`,
      message: `Prescription created for "${newRx.diagnosis}". Medication schedules have been automatically added to your dashboard.`,
      scheduledTime: new Date().toISOString(),
      sentTime: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
      channels: ['IN_APP', 'SMS', 'WHATSAPP'],
      isRead: false,
      metadata: {
        prescriptionId: newRx.id,
        smsPreview: `Digital Health Stack: Dr. ${currentDoctor.name} has issued an electronic prescription for UHID: ${patient.uhid}. View your schedule online.`,
        whatsappPreview: `📋 *Electronic Prescription Generated*\n*Doctor*: ${currentDoctor.name} (${currentDoctor.specialization})\n*Diagnosis*: ${newRx.diagnosis}\n*Medicines*: ${newRx.medicines.map(m => m.medicineName).join(', ')}\n*Status*: Sent to pharmacy`
      }
    });

    setData(prev => ({
      ...prev,
      prescriptions: [newRx, ...prev.prescriptions],
      medicineSchedules: [...newSchedules, ...prev.medicineSchedules],
      notifications: [...newNotifs, ...prev.notifications]
    }));

    logAction(
      patient.id,
      patient.uhid,
      'CREATE_PRESCRIPTION',
      `Prescription (${newRx.medicines.map(m => m.medicineName).join(', ')})`,
      `Diagnosis: ${newRx.diagnosis}`,
      true,
      consent.id
    );

    return { success: true };
  };

  const updateMedicineSchedule = (scheduleId: string, status: 'TAKEN' | 'SKIPPED' | 'SNOOZED') => {
    setData(prev => ({
      ...prev,
      medicineSchedules: prev.medicineSchedules.map(s =>
        s.id === scheduleId
          ? {
              ...s,
              status,
              takenAt: status === 'TAKEN' ? new Date().toISOString() : undefined
            }
          : s
      )
    }));
  };

  const bookAppointment = (booking: {
    doctorId: string;
    date: string;
    time: string;
    reasonForVisit: string;
    isEmergency?: boolean;
  }): { success: boolean; appointment?: Appointment } => {
    if (currentRole !== 'PATIENT' || !currentPatient) {
      return { success: false };
    }

    const doctor = data.doctors.find(d => d.id === booking.doctorId);
    if (!doctor) return { success: false };

    const tokenLetter = booking.isEmergency ? 'E' : 'A';
    const tokenNumber = `${tokenLetter}-${Math.floor(Math.random() * 30) + 10}`;

    const newApt: Appointment = {
      id: `apt_${Date.now()}`,
      patientId: currentPatient.id,
      patientName: currentPatient.fullName,
      uhid: currentPatient.uhid,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialization,
      hospital: doctor.hospital,
      consultationFee: doctor.consultationFee,
      date: booking.date || new Date().toISOString().split('T')[0],
      time: booking.time || '10:30 AM',
      tokenNumber,
      queuePosition: booking.isEmergency ? 1 : 3,
      estimatedWaitMinutes: booking.isEmergency ? 5 : 35,
      isEmergency: !!booking.isEmergency,
      status: 'PENDING',
      reasonForVisit: booking.reasonForVisit || 'General Consultation'
    };

    const docNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      recipientUserId: doctor.userId,
      category: 'APPOINTMENT',
      title: 'New Appointment Booking Request',
      message: `${currentPatient.fullName} (${currentPatient.uhid}) requested an appointment on ${newApt.date} at ${newApt.time}. Reason: ${newApt.reasonForVisit}.`,
      scheduledTime: new Date().toISOString(),
      sentTime: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
      channels: ['IN_APP'],
      isRead: false,
      metadata: {
        appointmentId: newApt.id,
        uhid: currentPatient.uhid
      }
    };

    setData(prev => ({
      ...prev,
      appointments: [newApt, ...prev.appointments],
      notifications: [docNotif, ...prev.notifications]
    }));

    logAction(
      currentPatient.id,
      currentPatient.uhid,
      'BOOK_APPOINTMENT',
      `Appointment with ${doctor.name}`,
      newApt.reasonForVisit,
      true
    );

    return { success: true, appointment: newApt };
  };

  const updateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    const apt = data.appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    const patient = data.patients.find(p => p.id === apt.patientId);

    const updatedApt: Appointment = {
      ...apt,
      status,
      confirmedAt: status === 'CONFIRMED' ? new Date().toISOString() : apt.confirmedAt,
      cancelledAt: status === 'CANCELLED' ? new Date().toISOString() : apt.cancelledAt
    };

    const newNotifs: AppNotification[] = [];
    if (patient && status === 'CONFIRMED') {
      newNotifs.push({
        id: `notif_${Date.now()}`,
        recipientUserId: patient.userId,
        category: 'APPOINTMENT',
        title: `Appointment Confirmed with ${apt.doctorName}`,
        message: `Your consultation is confirmed for ${apt.date} at ${apt.time} (${apt.doctorSpecialty}, ${apt.hospital}). Token: ${apt.tokenNumber}. Please arrive 10 minutes early.`,
        scheduledTime: new Date().toISOString(),
        sentTime: new Date().toISOString(),
        deliveryStatus: 'DELIVERED',
        channels: ['IN_APP', 'SMS', 'WHATSAPP'],
        isRead: false,
        metadata: {
          appointmentId: apt.id,
          smsPreview: `Appt Confirmed: ${apt.doctorName} (${apt.doctorSpecialty}) on ${apt.date}, ${apt.time}. Token: ${apt.tokenNumber}. Arrive 10m early. Digital Health Stack.`,
          whatsappPreview: `🗓️ *Appointment Confirmation*\n*Doctor*: ${apt.doctorName}\n*Specialty*: ${apt.doctorSpecialty}\n*Token*: ${apt.tokenNumber}\n*Date & Time*: ${apt.date} at ${apt.time}\n*Hospital*: ${apt.hospital}`
        }
      });
    }

    setData(prev => ({
      ...prev,
      appointments: prev.appointments.map(a => a.id === appointmentId ? updatedApt : a),
      notifications: [...newNotifs, ...prev.notifications]
    }));
  };

  const dispensePrescription = (prescriptionId: string) => {
    const rx = data.prescriptions.find(p => p.id === prescriptionId);
    if (!rx) return;

    const patient = data.patients.find(p => p.id === rx.patientId);

    setData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map(p =>
        p.id === prescriptionId
          ? {
              ...p,
              pharmacyStatus: 'DISPENSED',
              dispensedAt: new Date().toISOString(),
              dispensedBy: currentPharmacy?.name || 'CityMed Central Pharmacy'
            }
          : p
      ),
      notifications: patient
        ? [
            {
              id: `notif_${Date.now()}`,
              recipientUserId: patient.userId,
              category: 'PRESCRIPTION',
              title: 'Prescription Ready & Dispensed',
              message: `Your prescription (${rx.medicines.map(m => m.medicineName).join(', ')}) has been verified and dispensed by ${currentPharmacy?.name || 'CityMed Pharmacy'}.`,
              scheduledTime: new Date().toISOString(),
              sentTime: new Date().toISOString(),
              deliveryStatus: 'DELIVERED',
              channels: ['IN_APP', 'SMS', 'WHATSAPP'],
              isRead: false
            },
            ...prev.notifications
          ]
        : prev.notifications
    }));

    if (patient) {
      logAction(
        patient.id,
        patient.uhid,
        'DISPENSE_MEDICINE',
        `Prescription Dispensary (${rx.medicines.map(m => m.medicineName).join(', ')})`,
        'Pharmacy prescription order fulfillment',
        true
      );
    }
  };

  const verifyProvider = (type: 'DOCTOR' | 'LAB' | 'PHARMACY', id: string, verified: boolean) => {
    setData(prev => {
      if (type === 'DOCTOR') {
        return {
          ...prev,
          doctors: prev.doctors.map(d => d.id === id ? { ...d, isVerified: verified } : d)
        };
      } else if (type === 'LAB') {
        return {
          ...prev,
          labs: prev.labs.map(l => l.id === id ? { ...l, isVerified: verified } : l)
        };
      } else {
        return {
          ...prev,
          pharmacies: prev.pharmacies.map(p => p.id === id ? { ...p, isVerified: verified } : p)
        };
      }
    });
  };

  const markNotificationRead = (id: string) => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    }));
  };

  const markAllNotificationsRead = () => {
    setData(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.recipientUserId === currentUser.id ? { ...n, isRead: true } : n)
    }));
  };

  const resetSystemData = () => {
    const fresh = resetToSeedData();
    setData(fresh);
    setCurrentUserId('user_patient_1');
  };

  const createNewPatient = (patientData: Partial<PatientProfile>): PatientProfile => {
    const newUserId = `user_${Date.now()}`;
    const newUhid = generateUhid();
    const newUser: User = {
      id: newUserId,
      name: patientData.fullName || 'New Patient',
      email: patientData.email || 'patient@example.com',
      phone: patientData.phone || '+91 99000 11000',
      role: 'PATIENT',
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    const newProfile: PatientProfile = {
      id: `pat_${Date.now()}`,
      userId: newUserId,
      uhid: newUhid,
      fullName: patientData.fullName || 'New Patient',
      dob: patientData.dob || '1995-01-01',
      age: patientData.age || 30,
      gender: patientData.gender || 'Male',
      bloodGroup: patientData.bloodGroup || 'O Positive (O+)',
      phone: patientData.phone || '+91 99000 11000',
      email: patientData.email || 'patient@example.com',
      emergencyContact: patientData.emergencyContact || {
        name: 'Emergency Contact',
        relationship: 'Guardian',
        phone: '+91 99000 11001'
      },
      allergies: patientData.allergies || [],
      chronicConditions: patientData.chronicConditions || [],
      emergencyAccessAllowed: true,
      registeredDate: new Date().toISOString().split('T')[0]
    };

    setData(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      patients: [...prev.patients, newProfile]
    }));

    setCurrentUserId(newUserId);
    return newProfile;
  };

  const createNewDoctor = (docData: Partial<DoctorProfile> & { email?: string }): DoctorProfile => {
    const newUserId = `user_doc_${Date.now()}`;
    const newDocId = `doc_${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: docData.name || 'Dr. New Doctor',
      email: docData.email || 'doctor@healthstack.local',
      phone: '+91 98765 43210',
      role: 'DOCTOR',
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    const newProfile: DoctorProfile = {
      id: newDocId,
      userId: newUserId,
      name: docData.name || 'Dr. New Doctor',
      specialization: docData.specialization || 'General Medicine',
      hospital: docData.hospital || 'Apollo Health City',
      licenseNumber: docData.licenseNumber || `MCI-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      qualifications: docData.qualifications || 'MBBS, MD',
      consultationFee: 600,
      rating: 5.0,
      experienceYears: docData.experienceYears || 5,
      availabilityDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      availabilityHours: '09:00 AM - 05:00 PM',
      isVerified: true
    };

    setData(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      doctors: [...prev.doctors, newProfile]
    }));

    setCurrentUserId(newUserId);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dhs_session_auth', 'true');
      sessionStorage.setItem('dhs_user_id', newUserId);
      localStorage.setItem('dhs_user_id', newUserId);
    }
    return newProfile;
  };

  const createNewProvider = (provData: {
    type: 'LAB' | 'PHARMACY';
    name: string;
    licenseNumber: string;
    accreditationOrPharmacist: string;
    address: string;
    phone: string;
  }) => {
    const isLab = provData.type === 'LAB';
    const newUserId = `user_${isLab ? 'lab' : 'pharm'}_${Date.now()}`;
    const newId = `${isLab ? 'lab' : 'pharm'}_${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: provData.name,
      email: `${provData.name.toLowerCase().replace(/\s+/g, '')}@healthstack.local`,
      phone: provData.phone || '+91 98765 11223',
      role: isLab ? 'LAB' : 'PHARMACY',
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    if (isLab) {
      const newLab: DiagnosticCentre = {
        id: newId,
        userId: newUserId,
        name: provData.name,
        licenseNumber: provData.licenseNumber || `NABL-${Math.floor(1000 + Math.random() * 9000)}`,
        accreditedBy: provData.accreditationOrPharmacist || 'NABL & CAP Certified',
        address: provData.address || 'Medical District, City Center',
        phone: provData.phone || '+91 98765 11223',
        isVerified: true
      };
      setData(prev => ({
        ...prev,
        users: [...prev.users, newUser],
        labs: [...prev.labs, newLab]
      }));
    } else {
      const newPharm: Pharmacy = {
        id: newId,
        userId: newUserId,
        name: provData.name,
        licenseNumber: provData.licenseNumber || `DL-${Math.floor(1000 + Math.random() * 9000)}`,
        pharmacistInCharge: provData.accreditationOrPharmacist || 'Registered Pharmacist',
        address: provData.address || 'Medical District, City Center',
        phone: provData.phone || '+91 98765 11223',
        isVerified: true
      };
      setData(prev => ({
        ...prev,
        users: [...prev.users, newUser],
        pharmacies: [...prev.pharmacies, newPharm]
      }));
    }

    setCurrentUserId(newUserId);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dhs_session_auth', 'true');
      sessionStorage.setItem('dhs_user_id', newUserId);
      localStorage.setItem('dhs_user_id', newUserId);
    }
  };

  return (
    <AppContext.Provider
      value={{
        data,
        currentUser,
        currentRole,
        currentPatient,
        currentDoctor,
        currentLab,
        currentPharmacy,
        activeConsents,
        pendingConsentRequestsForMe,
        notifications: userNotifications,
        unreadNotifsCount,
        cdsAlerts,
        switchUser,
        requestConsent,
        respondConsent,
        revokeConsent,
        uploadLabReport,
        createPrescription,
        updateMedicineSchedule,
        bookAppointment,
        updateAppointmentStatus,
        dispensePrescription,
        verifyProvider,
        requestEmergencyAccess,
        isAuthenticated,
        login,
        logout,
        markNotificationRead,
        markAllNotificationsRead,
        resetSystemData,
        createNewPatient,
        createNewDoctor,
        createNewProvider
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
