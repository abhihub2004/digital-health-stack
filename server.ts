import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import {
  AppStateData,
  getSeedData,
  generateUhid
} from './src/services/storage';

import { parseLaboratoryReport } from './src/services/ocrParser';

import {
  testDatabaseConnection,
  loadAppState,
  saveAppState
} from './src/database/db';

import {
  PatientConsent,
  MedicalAccessLog,
  LabReport,
  Prescription,
  MedicineSchedule,
  AppNotification,
  Appointment,
  User,
  AccessScope
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------------------------------------------------
// APPLICATION STATE
// -------------------------------------------------------------

let db: AppStateData = getSeedData();

// Current active session identity for simulation
let currentUserId = 'user_patient_1';

// -------------------------------------------------------------
// CURRENT USER
// -------------------------------------------------------------

function getCurrentUser(): User | undefined {
  return db.users.find(u => u.id === currentUserId);
}

// -------------------------------------------------------------
// POSTGRESQL STATE PERSISTENCE
// -------------------------------------------------------------

/**
 * Persist the complete application state to PostgreSQL.
 *
 * When DATABASE_URL is not configured, local development
 * continues using the in-memory application state.
 */
async function persistDbState(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    return;
  }

  try {
    await saveAppState(db);
    console.log('Application state persisted to PostgreSQL.');
  } catch (error) {
    console.error(
      'Failed to persist application state to PostgreSQL:',
      error
    );
  }
}

// -------------------------------------------------------------
// AUDIT LOGGING
// -------------------------------------------------------------

function logAccess(
  patientId: string,
  patientUhid: string,
  actor: User,
  action: MedicalAccessLog['action'],
  resource: string,
  reason: string,
  accessGranted: boolean,
  consentId?: string,
  req?: Request
): MedicalAccessLog {
  const ip = req
    ? (
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        '127.0.0.1'
      ).toString()
    : '127.0.0.1';

  const newLog: MedicalAccessLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    patientId,
    patientUhid,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    resource,
    timestamp: new Date().toISOString(),
    ipAddress: `${ip}`,
    reason,
    consentId,
    accessGranted
  };

  db.accessLogs.unshift(newLog);

  return newLog;
}

// -------------------------------------------------------------
// CREATE EXPRESS APP
// -------------------------------------------------------------

export async function createApp() {
  const app = express();

  // -------------------------------------------------------------
  // RENDER HEALTH CHECK
  // -------------------------------------------------------------

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok'
    });
  });

  // -------------------------------------------------------------
  // BODY PARSER
  // -------------------------------------------------------------

  app.use(express.json({ limit: '10mb' }));

  // -------------------------------------------------------------
  // AUTOMATIC DATABASE PERSISTENCE
  // -------------------------------------------------------------
  //
  // Any successful non-GET API request that changes application
  // state will automatically be persisted to PostgreSQL.
  //
  // This avoids having to manually add saveAppState() to every
  // existing mutation endpoint.
  // -------------------------------------------------------------

  app.use((req, res, next) => {
    res.on('finish', () => {
      if (
        req.path.startsWith('/api/') &&
        req.method !== 'GET' &&
        req.method !== 'HEAD' &&
        req.method !== 'OPTIONS' &&
        res.statusCode >= 200 &&
        res.statusCode < 400
      ) {
        void persistDbState();
      }
    });

    next();
  });

  // -------------------------------------------------------------
  // AUTHENTICATION MIDDLEWARE
  // -------------------------------------------------------------

  const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const user = getCurrentUser();

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized. Please sign in.'
      });
    }

    (req as any).currentUser = user;

    next();
  };

  // -------------------------------------------------------------
  // AUTH & SESSION ENDPOINTS
  // -------------------------------------------------------------

  app.get('/api/auth/current-user', (req, res) => {
    const user = getCurrentUser();

    if (!user) {
      return res.status(401).json({
        error: 'Not logged in'
      });
    }

    let profile: any = null;

    if (user.role === 'PATIENT') {
      profile = db.patients.find(
        p => p.userId === user.id
      );
    } else if (user.role === 'DOCTOR') {
      profile = db.doctors.find(
        d => d.userId === user.id
      );
    } else if (user.role === 'LAB') {
      profile = db.labs.find(
        l => l.userId === user.id
      );
    } else if (user.role === 'PHARMACY') {
      profile = db.pharmacies.find(
        p => p.userId === user.id
      );
    }

    res.json({
      user,
      profile,
      allUsers: db.users
    });
  });

  app.post('/api/auth/switch-role', (req, res) => {
    const { userId } = req.body;

    const targetUser = db.users.find(
      u => u.id === userId
    );

    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    currentUserId = targetUser.id;

    res.json({
      success: true,
      user: targetUser
    });
  });

  // -------------------------------------------------------------
  // PATIENT DIRECTORY & UHID SEARCH
  // -------------------------------------------------------------

  app.get(
    '/api/patients/search',
    authMiddleware,
    (req, res) => {
      const user = (req as any).currentUser as User;
      const { uhid } = req.query;

      if (!uhid || typeof uhid !== 'string') {
        return res.status(400).json({
          error: 'UHID parameter is required.'
        });
      }

      const patient = db.patients.find(
        p =>
          p.uhid.toLowerCase() ===
          uhid.toLowerCase().trim()
      );

      if (!patient) {
        return res.status(404).json({
          error: `No patient found with UHID: ${uhid}`
        });
      }

      // ---------------------------------------------------------
      // CHECK ACTIVE DOCTOR CONSENT
      // ---------------------------------------------------------

      let hasActiveConsent = false;
      let activeConsent: PatientConsent | undefined =
        undefined;

      if (user.role === 'DOCTOR') {
        const doctorProfile = db.doctors.find(
          d => d.userId === user.id
        );

        if (doctorProfile) {
          activeConsent = db.consents.find(
            c =>
              c.patientId === patient.id &&
              c.doctorId === doctorProfile.id &&
              c.status === 'APPROVED' &&
              (!c.expiresAt ||
                new Date(c.expiresAt) > new Date())
          );

          hasActiveConsent = !!activeConsent;
        }
      }

      // ---------------------------------------------------------
      // MASK PATIENT NAME WITHOUT ACTIVE CONSENT
      // ---------------------------------------------------------

      const nameParts = patient.fullName.split(' ');

      const maskedName = hasActiveConsent
        ? patient.fullName
        : nameParts
            .map(
              part =>
                part.charAt(0) +
                '*'.repeat(
                  Math.max(part.length - 1, 2)
                )
            )
            .join(' ');

      logAccess(
        patient.id,
        patient.uhid,
        user,
        'SEARCH_PATIENT',
        `UHID Directory Query (${uhid})`,
        'UHID patient lookup in clinical directory',
        true,
        activeConsent?.id,
        req
      );

      // ---------------------------------------------------------
      // DO NOT RETURN MEDICAL DETAILS HERE
      // ---------------------------------------------------------

      res.json({
        isFound: true,
        uhid: patient.uhid,
        patientId: patient.id,
        maskedName,
        gender: patient.gender,
        age: patient.age,
        hasActiveConsent,
        consentStatus: activeConsent
          ? activeConsent.status
          : 'NO_CONSENT',
        activeConsentId:
          activeConsent?.id || null,
        activeScopes: activeConsent
          ? activeConsent.accessScope
          : []
      });
    }
  );

  // -------------------------------------------------------------
  // PATIENT CONSENT SYSTEM
  // -------------------------------------------------------------

  app.post(
    '/api/consent/request',
    authMiddleware,
    (req, res) => {
      const user = (req as any).currentUser as User;

      if (user.role !== 'DOCTOR') {
        return res.status(403).json({
          error:
            'Only verified doctors can request patient record access.'
        });
      }

      const doctor = db.doctors.find(
        d => d.userId === user.id
      );

      if (!doctor) {
        return res.status(404).json({
          error: 'Doctor profile not found.'
        });
      }

      if (!doctor.isVerified) {
        return res.status(403).json({
          error:
            'Doctor license is pending administrator verification.'
        });
      }

      const {
        uhid,
        reason,
        accessScope,
        duration
      } = req.body;

      const patient = db.patients.find(
        p => p.uhid === uhid
      );

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found.'
        });
      }

      const newConsent: PatientConsent = {
        id: `consent_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 6)}`,
        patientId: patient.id,
        patientName: patient.fullName,
        uhid: patient.uhid,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialization,
        hospital: doctor.hospital,
        requestedAt: new Date().toISOString(),
        status: 'PENDING',
        accessScope:
          accessScope && accessScope.length > 0
            ? accessScope
            : ['BASIC_PROFILE', 'LAB_REPORTS'],
        reason:
          reason ||
          'Clinical evaluation and diagnostic review.',
        duration: duration || '24_HOURS'
      };

      db.consents.unshift(newConsent);

      // ---------------------------------------------------------
      // NOTIFY PATIENT
      // ---------------------------------------------------------

      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        recipientUserId: patient.userId,
        category: 'CONSENT',
        title: `Access Request: ${doctor.name}`,
        message: `${doctor.name} (${doctor.specialization} at ${doctor.hospital}) has requested access to your health records. Reason: "${newConsent.reason}".`,
        scheduledTime: new Date().toISOString(),
        sentTime: new Date().toISOString(),
        deliveryStatus: 'DELIVERED',
        channels: ['IN_APP', 'SMS', 'WHATSAPP'],
        isRead: false,
        metadata: {
          consentId: newConsent.id,
          uhid: patient.uhid,
          doctorId: doctor.id,
          actionRequired: true,
          smsPreview: `Health Stack Alert: ${doctor.name} has requested access to your medical records for ${newConsent.reason}. Reply ALLOW or log in to manage.`,
          whatsappPreview: `🔒 *Consent Authorization Request*
*Doctor*: ${doctor.name}
*Hospital*: ${doctor.hospital}
*Reason*: ${newConsent.reason}
*Scope Requested*: ${newConsent.accessScope.join(', ')}

_Review and authorize on Digital Health Stack._`
        }
      };

      db.notifications.unshift(notif);

      logAccess(
        patient.id,
        patient.uhid,
        user,
        'REQUEST_CONSENT',
        `Consent Request (${newConsent.accessScope.join(', ')})`,
        newConsent.reason,
        true,
        newConsent.id,
        req
      );

      res.json({
        success: true,
        consent: newConsent,
        message: 'Consent request sent to patient.'
      });
    }
  );

  // -------------------------------------------------------------
  // CONSENT RESPONSE
  // -------------------------------------------------------------

  app.post(
    '/api/consent/respond',
    authMiddleware,
    (req, res) => {
      const user = (req as any).currentUser as User;

      const {
        consentId,
        decision,
        approvedScopes,
        duration
      } = req.body;

      const consent = db.consents.find(
        c => c.id === consentId
      );

      if (!consent) {
        return res.status(404).json({
          error: 'Consent request not found.'
        });
      }

      const patient = db.patients.find(
        p => p.id === consent.patientId
      );

      if (
        !patient ||
        (user.role === 'PATIENT' &&
          patient.userId !== user.id)
      ) {
        return res.status(403).json({
          error:
            'Only the patient can authorize or deny consent.'
        });
      }

      if (decision === 'ALLOW') {
        consent.status = 'APPROVED';
        consent.approvedAt =
          new Date().toISOString();

        if (
          approvedScopes &&
          approvedScopes.length > 0
        ) {
          consent.accessScope = approvedScopes;
        }

        if (duration) {
          consent.duration = duration;
        }

        // -------------------------------------------------------
        // CALCULATE EXPIRATION
        // -------------------------------------------------------

        const expDate = new Date();

        if (consent.duration === '1_HOUR') {
          expDate.setHours(
            expDate.getHours() + 1
          );
        } else if (
          consent.duration === '24_HOURS' ||
          consent.duration === 'THIS_CONSULTATION'
        ) {
          expDate.setHours(
            expDate.getHours() + 24
          );
        } else if (
          consent.duration === '7_DAYS'
        ) {
          expDate.setDate(
            expDate.getDate() + 7
          );
        }

        consent.expiresAt =
          expDate.toISOString();

        // -------------------------------------------------------
        // NOTIFY DOCTOR
        // -------------------------------------------------------

        const doctorProfile = db.doctors.find(
          d => d.id === consent.doctorId
        );

        if (doctorProfile) {
          const notif: AppNotification = {
            id: `notif_${Date.now()}`,
            recipientUserId: doctorProfile.userId,
            category: 'CONSENT',
            title: 'Patient Granted Consent',
            message: `${patient.fullName} (${patient.uhid}) has granted access to records (${consent.accessScope.join(', ')}). Valid until ${expDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}.`,
            scheduledTime:
              new Date().toISOString(),
            sentTime:
              new Date().toISOString(),
            deliveryStatus: 'DELIVERED',
            channels: ['IN_APP'],
            isRead: false,
            metadata: {
              consentId: consent.id,
              uhid: patient.uhid
            }
          };

          db.notifications.unshift(notif);
        }

        logAccess(
          patient.id,
          patient.uhid,
          user,
          'APPROVE_CONSENT',
          `Approved scope: ${consent.accessScope.join(', ')}`,
          `Patient granted consent for duration ${consent.duration}`,
          true,
          consent.id,
          req
        );

        return res.json({
          success: true,
          consent,
          message:
            'Patient has granted access.'
        });
      } else {
        consent.status = 'DENIED';

        logAccess(
          patient.id,
          patient.uhid,
          user,
          'DENY_CONSENT',
          'Consent Request Refused',
          'Patient declined access request',
          true,
          consent.id,
          req
        );

        return res.json({
          success: true,
          consent,
          message:
            'Consent request was denied.'
        });
      }
    }
  );

  // -------------------------------------------------------------
  // CONSENT REVOKE
  // -------------------------------------------------------------

  app.post(
    '/api/consent/revoke',
    authMiddleware,
    (req, res) => {
      const user = (req as any).currentUser as User;

      const {
        consentId,
        reason
      } = req.body;

      const consent = db.consents.find(
        c => c.id === consentId
      );

      if (!consent) {
        return res.status(404).json({
          error: 'Consent not found.'
        });
      }

      const patient = db.patients.find(
        p => p.id === consent.patientId
      );

      if (
        !patient ||
        (user.role === 'PATIENT' &&
          patient.userId !== user.id)
      ) {
        return res.status(403).json({
          error:
            'Only the patient can revoke access.'
        });
      }

      consent.status = 'REVOKED';
      consent.revokedAt =
        new Date().toISOString();
      consent.revokedReason =
        reason ||
        'Revoked by patient via consent manager';

      // ---------------------------------------------------------
      // NOTIFY DOCTOR
      // ---------------------------------------------------------

      const doctorProfile = db.doctors.find(
        d => d.id === consent.doctorId
      );

      if (doctorProfile) {
        db.notifications.unshift({
          id: `notif_${Date.now()}`,
          recipientUserId:
            doctorProfile.userId,
          category: 'CONSENT',
          title: 'Consent Access Revoked',
          message: `${patient.fullName} (${patient.uhid}) has revoked your clinical data access privileges.`,
          scheduledTime:
            new Date().toISOString(),
          sentTime:
            new Date().toISOString(),
          deliveryStatus: 'DELIVERED',
          channels: ['IN_APP'],
          isRead: false,
          metadata: {
            consentId: consent.id,
            uhid: patient.uhid
          }
        });
      }

      logAccess(
        patient.id,
        patient.uhid,
        user,
        'REVOKE_CONSENT',
        'Clinical Access Rights Revocation',
        consent.revokedReason ||
          'Revoked by patient via consent manager',
        true,
        consent.id,
        req
      );

      res.json({
        success: true,
        consent,
        message:
          'Consent revoked successfully. Doctor immediately loses access.'
      });
    }
  );

  // -------------------------------------------------------------
  // SENSITIVE CLINICAL RECORD ACCESS
  // -------------------------------------------------------------

  app.get(
    '/api/patients/records',
    authMiddleware,
    (req, res) => {
      const user = (req as any).currentUser as User;
      const { uhid } = req.query;

      if (!uhid || typeof uhid !== 'string') {
        return res.status(400).json({
          error: 'UHID parameter is required.'
        });
      }

      const patient = db.patients.find(
        p =>
          p.uhid.toLowerCase() ===
          uhid.toLowerCase().trim()
      );

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found.'
        });
      }

      // ---------------------------------------------------------
      // CASE 1: PATIENT ACCESSING OWN RECORD
      // ---------------------------------------------------------

      if (
        user.role === 'PATIENT' &&
        patient.userId === user.id
      ) {
        const reports =
          db.labReports.filter(
            r => r.uhid === patient.uhid
          );

        const prescriptions =
          db.prescriptions.filter(
            p => p.uhid === patient.uhid
          );

        const appointments =
          db.appointments.filter(
            a => a.uhid === patient.uhid
          );

        const schedules =
          db.medicineSchedules.filter(
            s => s.patientId === patient.id
          );

        logAccess(
          patient.id,
          patient.uhid,
          user,
          'VIEW_FULL_RECORD',
          'Patient Self-Portal Clinical Records',
          'Self personal health record access',
          true,
          undefined,
          req
        );

        return res.json({
          patient,
          labReports: reports,
          prescriptions,
          appointments,
          medicineSchedules: schedules,
          grantedScope: ['FULL_RECORD'],
          isPatientOwner: true
        });
      }

      // ---------------------------------------------------------
      // CASE 2: DOCTOR ACCESSING PATIENT RECORD
      // ---------------------------------------------------------

      if (user.role === 'DOCTOR') {
        const doctor = db.doctors.find(
          d => d.userId === user.id
        );

        if (!doctor) {
          return res.status(404).json({
            error: 'Doctor profile not found.'
          });
        }

        if (!doctor.isVerified) {
          logAccess(
            patient.id,
            patient.uhid,
            user,
            'UNAUTHORIZED_ACCESS_BLOCKED',
            'Clinical Record Vault',
            'Unverified doctor attempted patient access',
            false,
            undefined,
            req
          );

          return res.status(403).json({
            error:
              'Doctor verification pending.',
            message:
              'Only verified doctors can view patient records.'
          });
        }

        // -------------------------------------------------------
        // CHECK ACTIVE CONSENT
        // -------------------------------------------------------

        const consent = db.consents.find(
          c =>
            c.patientId === patient.id &&
            c.doctorId === doctor.id &&
            c.status === 'APPROVED' &&
            (!c.expiresAt ||
              new Date(c.expiresAt) > new Date())
        );

        // -------------------------------------------------------
        // MANDATORY PRIVACY CHECK
        // -------------------------------------------------------

        if (!consent) {
          logAccess(
            patient.id,
            patient.uhid,
            user,
            'UNAUTHORIZED_ACCESS_BLOCKED',
            'Clinical Record Vault',
            'Doctor attempted query without active patient consent token',
            false,
            undefined,
            req
          );

          return res.status(403).json({
            error: 'Patient consent required.',
            message:
              'A doctor cannot access medical details without explicit, active patient consent.',
            code: 'CONSENT_REQUIRED',
            uhid: patient.uhid,
            patientFound: true
          });
        }

        // -------------------------------------------------------
        // FILTER DATA BASED ON CONSENT SCOPE
        // -------------------------------------------------------

        const scopes = consent.accessScope;

        const isFull =
          scopes.includes('FULL_RECORD');

        const responsePayload: any = {
          patient: {
            uhid: patient.uhid,
            fullName: patient.fullName,
            age: patient.age,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            allergies:
              isFull ||
              scopes.includes('MEDICAL_HISTORY')
                ? patient.allergies
                : [
                    'Access not granted in consent scope'
                  ],
            chronicConditions:
              isFull ||
              scopes.includes('MEDICAL_HISTORY')
                ? patient.chronicConditions
                : [
                    'Access not granted in consent scope'
                  ]
          },

          grantedScope: scopes,
          consentExpiresAt: consent.expiresAt,
          consentId: consent.id
        };

        if (
          isFull ||
          scopes.includes('LAB_REPORTS') ||
          scopes.includes('DIAGNOSTIC_REPORTS')
        ) {
          responsePayload.labReports =
            db.labReports.filter(
              r => r.uhid === patient.uhid
            );
        } else {
          responsePayload.labReports = [];
        }

        if (
          isFull ||
          scopes.includes('PRESCRIPTIONS')
        ) {
          responsePayload.prescriptions =
            db.prescriptions.filter(
              p => p.uhid === patient.uhid
            );
        } else {
          responsePayload.prescriptions = [];
        }

        responsePayload.appointments =
          db.appointments.filter(
            a =>
              a.uhid === patient.uhid &&
              a.doctorId === doctor.id
          );

        logAccess(
          patient.id,
          patient.uhid,
          user,
          'VIEW_LAB_REPORTS',
          `Patient Record Viewer [Scope: ${scopes.join(', ')}]`,
          consent.reason,
          true,
          consent.id,
          req
        );

        return res.json(responsePayload);
      }

      // ---------------------------------------------------------
      // CASE 3: ADMIN / PHARMACY / LAB
      // ---------------------------------------------------------

      if (
        user.role === 'ADMIN' ||
        user.role === 'PHARMACY' ||
        user.role === 'LAB'
      ) {
        logAccess(
          patient.id,
          patient.uhid,
          user,
          'UNAUTHORIZED_ACCESS_BLOCKED',
          'Clinical Record Vault',
          `${user.role} attempted direct browse of complete patient medical history`,
          false,
          undefined,
          req
        );

        return res.status(403).json({
          error: 'Access Denied.',
          message:
            'Strict RBAC prohibits browsing patient medical history.'
        });
      }

      return res.status(403).json({
        error: 'Patient consent required.'
      });
    }
  );

  // -------------------------------------------------------------
  // DIAGNOSTIC LAB REPORT UPLOAD & OCR
  // -------------------------------------------------------------

  app.post(
    '/api/labs/parse-raw',
    (req, res) => {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          error: 'Raw report text is required.'
        });
      }

      const parsed =
        parseLaboratoryReport(text);

      return res.json({
        success: true,
        parsed
      });
    }
  );

  app.post(
    '/api/labs/upload',
    authMiddleware,
    (req, res) => {
      const user = (req as any).currentUser as User;

      const isLab = user.role === 'LAB';
      const isPatient = user.role === 'PATIENT';

      if (!isLab && !isPatient) {
        return res.status(403).json({
          error:
            'Only authorized diagnostic centres or patients can upload laboratory reports.'
        });
      }

      const {
        uhid,
        reportName,
        reportType,
        ocrRawText,
        fileName,
        fileSize,
        customLabName,
        customResults
      } = req.body;

      const patient = db.patients.find(
        p =>
          p.uhid.toLowerCase() ===
          (uhid || '').toLowerCase().trim()
      );

      if (!patient) {
        return res.status(404).json({
          error: `Patient with UHID ${uhid} not found.`
        });
      }

      if (isPatient) {
        const patientSelf = db.patients.find(
          p => p.userId === user.id
        );

        if (
          !patientSelf ||
          patientSelf.uhid.toLowerCase() !==
            patient.uhid.toLowerCase()
        ) {
          return res.status(403).json({
            error:
              'Patients can only upload personal reports to their own UHID.'
          });
        }
      }

      let labId =
        'patient_personal_upload';

      let labName =
        customLabName ||
        'Personal Health Record / Patient Upload';

      if (isLab) {
        const lab = db.labs.find(
          l => l.userId === user.id
        );

        if (!lab) {
          return res.status(404).json({
            error:
              'Diagnostic centre profile not found.'
          });
        }

        labId = lab.id;
        labName = lab.name;
      }

      // ---------------------------------------------------------
      // PARSE REPORT
      // ---------------------------------------------------------

      const parsed =
        parseLaboratoryReport(
          ocrRawText || ''
        );

      const finalResults =
        customResults &&
        Array.isArray(customResults) &&
        customResults.length > 0
          ? customResults
          : parsed.testResults;

      const hasCritical =
        finalResults.some(
          (t: any) => t.status === 'Critical'
        );

      const hasAbnormal =
        finalResults.some(
          (t: any) =>
            t.status === 'Low' ||
            t.status === 'High'
        );

      const computedStatus = hasCritical
        ? 'Critical Values Detected'
        : hasAbnormal
        ? 'Abnormal Values Detected'
        : 'Normal';

      const newReport: LabReport = {
        id: `rep_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 6)}`,
        patientId: patient.id,
        uhid: patient.uhid,
        labId,
        labName,
        reportName:
          reportName || parsed.reportName,
        reportType:
          reportType || parsed.reportType,
        uploadedAt:
          new Date().toISOString(),
        fileName:
          fileName ||
          `${(
            reportName ||
            'Diagnostic_Report'
          ).replace(/\s+/g, '_')}_${patient.uhid}.pdf`,
        fileSize:
          fileSize || '420 KB',
        ocrRawText:
          ocrRawText || '',
        testResults: finalResults,
        statusSummary: computedStatus
      };

      db.labReports.unshift(newReport);

      // ---------------------------------------------------------
      // NOTIFY PATIENT
      // ---------------------------------------------------------

      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        recipientUserId: patient.userId,
        category: 'LAB_REPORT',
        title: isPatient
          ? 'Personal Lab Report Uploaded'
          : 'New Diagnostic Report Uploaded',
        message: `${labName} recorded "${newReport.reportName}" to your health profile.`,
        scheduledTime:
          new Date().toISOString(),
        sentTime:
          new Date().toISOString(),
        deliveryStatus: 'DELIVERED',
        channels: [
          'IN_APP',
          'SMS',
          'WHATSAPP'
        ],
        isRead: false,
        metadata: {
          reportId: newReport.id,
          uhid: patient.uhid,
          smsPreview: `Health Stack: New lab report (${newReport.reportName}) recorded by ${labName} for UHID: ${patient.uhid}.`,
          whatsappPreview: `🔬 *New Laboratory Report Available*
*Source*: ${labName}
*Report*: ${newReport.reportName}
*Status*: ${newReport.statusSummary}
*UHID*: ${patient.uhid}

_View structured results and reference ranges in your health vault._`
        }
      };

      db.notifications.unshift(notif);

      logAccess(
        patient.id,
        patient.uhid,
        user,
        'UPLOAD_LAB_REPORT',
        `Diagnostic Report: ${newReport.reportName}`,
        isPatient
          ? 'Personal lab report uploaded by patient'
          : 'Laboratory report uploaded against patient UHID',
        true,
        undefined,
        req
      );

      res.json({
        success: true,
        report: newReport,
        parsedSummary: parsed
      });
    }
  );

  // -------------------------------------------------------------
  // PRESCRIPTION & MEDICINE REMINDER GENERATOR
  // -------------------------------------------------------------

  app.post(
    '/api/prescriptions/create',
    authMiddleware,
    (req, res) => {
      const user = (req as any).currentUser as User;

      if (user.role !== 'DOCTOR') {
        return res.status(403).json({
          error:
            'Only doctors can create prescriptions.'
        });
      }

      const doctor = db.doctors.find(
        d => d.userId === user.id
      );

      if (!doctor) {
        return res.status(404).json({
          error: 'Doctor not found.'
        });
      }

      const {
        uhid,
        diagnosis,
        clinicalNotes,
        medicines,
        vitals
      } = req.body;

      const patient = db.patients.find(
        p =>
          p.uhid.toLowerCase() ===
          uhid.toLowerCase().trim()
      );

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found.'
        });
      }

      // ---------------------------------------------------------
      // VERIFY ACTIVE CONSENT
      // ---------------------------------------------------------

      const consent = db.consents.find(
        c =>
          c.patientId === patient.id &&
          c.doctorId === doctor.id &&
          c.status === 'APPROVED' &&
          (!c.expiresAt ||
            new Date(c.expiresAt) > new Date())
      );

      if (!consent) {
        return res.status(403).json({
          error:
            'Active patient consent is required to issue prescription.'
        });
      }

      const newPrescription: Prescription = {
        id: `rx_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 6)}`,
        patientId: patient.id,
        uhid: patient.uhid,
        patientName: patient.fullName,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty:
          doctor.specialization,
        hospital: doctor.hospital,
        diagnosis:
          diagnosis || 'Clinical evaluation',
        clinicalNotes:
          clinicalNotes || '',
        vitals,
        medicines: medicines || [],
        createdAt:
          new Date().toISOString(),
        pharmacyStatus: 'NEW'
      };

      db.prescriptions.unshift(
        newPrescription
      );

      // ---------------------------------------------------------
      // GENERATE MEDICINE SCHEDULES
      // ---------------------------------------------------------

      const today =
        new Date()
          .toISOString()
          .split('T')[0];

      const generatedSchedules: MedicineSchedule[] =
        [];

      for (
        const med of newPrescription.medicines
      ) {
        for (const time of med.timings) {
          const scheduleItem: MedicineSchedule = {
            id: `sched_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 6)}`,
            prescriptionId:
              newPrescription.id,
            patientId: patient.id,
            medicineName:
              med.medicineName,
            dosage: med.dosage,
            timing: time,
            timingRelation:
              med.timingRelation,
            date: today,
            status: 'PENDING',
            notificationSent: true
          };

          db.medicineSchedules.push(
            scheduleItem
          );

          generatedSchedules.push(
            scheduleItem
          );

          // -------------------------------------------------------
          // MEDICINE NOTIFICATION
          // -------------------------------------------------------

          db.notifications.unshift({
            id: `notif_med_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 5)}`,
            recipientUserId:
              patient.userId,
            category: 'MEDICINE',
            title: `Medicine Reminder: ${med.medicineName}`,
            message: `Take ${med.dosage} ${med.timingRelation.toLowerCase()} at ${time}.`,
            scheduledTime:
              new Date().toISOString(),
            sentTime:
              new Date().toISOString(),
            deliveryStatus: 'DELIVERED',
            channels: [
              'IN_APP',
              'SMS',
              'WHATSAPP'
            ],
            isRead: false,
            metadata: {
              prescriptionId:
                newPrescription.id,
              smsPreview: `Rx Reminder: ${med.medicineName} (${med.dosage}) - ${med.timingRelation} at ${time}. Digital Health Stack.`,
              whatsappPreview: `💊 *Prescription Dose Reminder*
*Medicine*: ${med.medicineName}
*Dose*: ${med.dosage}
*Schedule*: ${time} (${med.timingRelation})
*Doctor*: ${doctor.name}`
            }
          });
        }
      }

      logAccess(
        patient.id,
        patient.uhid,
        user,
        'CREATE_PRESCRIPTION',
        `Prescription (${newPrescription.medicines
          .map(
            (m: any) => m.medicineName
          )
          .join(', ')})`,
        `Diagnosis: ${diagnosis}`,
        true,
        consent.id,
        req
      );

      res.json({
        success: true,
        prescription:
          newPrescription,
        schedulesGenerated:
          generatedSchedules.length
      });
    }
  );

  // -------------------------------------------------------------
  // APPOINTMENTS - BOOK
  // -------------------------------------------------------------

  app.post(
    '/api/appointments/book',
    authMiddleware,
    (req, res) => {
      const user = (req as any).currentUser as User;

      const {
        doctorId,
        date,
        time,
        reasonForVisit,
        isEmergency
      } = req.body;

      const patient = db.patients.find(
        p => p.userId === user.id
      );

      if (!patient) {
        return res.status(404).json({
          error:
            'Patient profile not found.'
        });
      }

      const doctor = db.doctors.find(
        d => d.id === doctorId
      );

      if (!doctor) {
        return res.status(404).json({
          error: 'Doctor not found.'
        });
      }

      // ---------------------------------------------------------
      // TOKEN GENERATION
      // ---------------------------------------------------------

      const tokenLetter =
        isEmergency ? 'E' : 'A';

      const tokenNumber =
        `${tokenLetter}-${Math.floor(
          Math.random() * 30
        ) + 10}`;

      const newApt: Appointment = {
        id: `apt_${Date.now()}`,
        patientId: patient.id,
        patientName: patient.fullName,
        uhid: patient.uhid,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty:
          doctor.specialization,
        hospital: doctor.hospital,
        consultationFee:
          doctor.consultationFee,
        date:
          date ||
          new Date()
            .toISOString()
            .split('T')[0],
        time:
          time || '10:30 AM',
        tokenNumber,
        queuePosition:
          isEmergency ? 1 : 3,
        estimatedWaitMinutes:
          isEmergency ? 5 : 35,
        isEmergency: !!isEmergency,
        status: 'PENDING',
        reasonForVisit:
          reasonForVisit ||
          'General Consultation'
      };

      db.appointments.unshift(newApt);

      // ---------------------------------------------------------
      // NOTIFY DOCTOR
      // ---------------------------------------------------------

      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        recipientUserId: doctor.userId,
        category: 'APPOINTMENT',
        title:
          'New Appointment Booking Request',
        message: `${patient.fullName} (${patient.uhid}) requested an appointment for ${newApt.date} at ${newApt.time}. Reason: ${newApt.reasonForVisit}.`,
        scheduledTime:
          new Date().toISOString(),
        sentTime:
          new Date().toISOString(),
        deliveryStatus: 'DELIVERED',
        channels: ['IN_APP'],
        isRead: false,
        metadata: {
          appointmentId: newApt.id,
          uhid: patient.uhid
        }
      });

      logAccess(
        patient.id,
        patient.uhid,
        user,
        'BOOK_APPOINTMENT',
        `Appointment Booking with ${doctor.name}`,
        newApt.reasonForVisit,
        true,
        undefined,
        req
      );

      res.json({
        success: true,
        appointment: newApt
      });
    }
  );

  // -------------------------------------------------------------
  // APPOINTMENTS - UPDATE STATUS
  // -------------------------------------------------------------

  app.post(
    '/api/appointments/update-status',
    authMiddleware,
    (req, res) => {
      const user = (req as any).currentUser as User;

      const {
        appointmentId,
        status
      } = req.body;

      const apt = db.appointments.find(
        a => a.id === appointmentId
      );

      if (!apt) {
        return res.status(404).json({
          error: 'Appointment not found.'
        });
      }

      apt.status = status;

      if (status === 'CONFIRMED') {
        apt.confirmedAt =
          new Date().toISOString();

        // -------------------------------------------------------
        // NOTIFY PATIENT
        // -------------------------------------------------------

        const patient = db.patients.find(
          p => p.id === apt.patientId
        );

        if (patient) {
          db.notifications.unshift({
            id: `notif_${Date.now()}`,
            recipientUserId:
              patient.userId,
            category: 'APPOINTMENT',
            title: `Appointment Confirmed with ${apt.doctorName}`,
            message: `Your appointment is confirmed for ${apt.date} at ${apt.time} (${apt.doctorSpecialty}, ${apt.hospital}). Token: ${apt.tokenNumber}. Please arrive 10 minutes early.`,
            scheduledTime:
              new Date().toISOString(),
            sentTime:
              new Date().toISOString(),
            deliveryStatus: 'DELIVERED',
            channels: [
              'IN_APP',
              'SMS',
              'WHATSAPP'
            ],
            isRead: false,
            metadata: {
              appointmentId: apt.id,
              smsPreview: `Appt Confirmed: ${apt.doctorName} (${apt.doctorSpecialty}) on ${apt.date}, ${apt.time}. Token: ${apt.tokenNumber}. Arrive 10m early. Digital Health Stack.`,
              whatsappPreview: `🗓️ *Appointment Confirmation*
*Doctor*: ${apt.doctorName}
*Specialty*: ${apt.doctorSpecialty}
*Token*: ${apt.tokenNumber}
*Date & Time*: ${apt.date} at ${apt.time}
*Hospital*: ${apt.hospital}`
            }
          });
        }
      }

      res.json({
        success: true,
        appointment: apt
      });
    }
  );

  // -------------------------------------------------------------
  // AUDIT LOGS
  // -------------------------------------------------------------

  app.get(
    '/api/audit-logs',
    authMiddleware,
    (req, res) => {
      const user =
        (req as any).currentUser as User;

      if (user.role === 'PATIENT') {
        const patient =
          db.patients.find(
            p => p.userId === user.id
          );

        if (!patient) {
          return res.status(404).json({
            error:
              'Patient profile not found.'
          });
        }

        const patientLogs =
          db.accessLogs.filter(
            l =>
              l.patientId === patient.id ||
              l.patientUhid === patient.uhid
          );

        return res.json({
          logs: patientLogs
        });
      }

      if (user.role === 'ADMIN') {
        return res.json({
          logs: db.accessLogs
        });
      }

      return res.status(403).json({
        error: 'Access denied.'
      });
    }
  );

  // -------------------------------------------------------------
  // FULL DATABASE SYNC
  // -------------------------------------------------------------
  //
  // IMPORTANT:
  // This endpoint is now protected by authMiddleware.
  // -------------------------------------------------------------

  app.get(
    '/api/sync',
    authMiddleware,
    (_req, res) => {
      res.json(db);
    }
  );

  return app;
}

// -------------------------------------------------------------
// START SERVER
// -------------------------------------------------------------

async function startServer() {
  const app = await createApp();

  const PORT =
    Number(process.env.PORT) || 3000;

  // -------------------------------------------------------------
  // LOAD APPLICATION STATE FROM POSTGRESQL
  // -------------------------------------------------------------

  if (process.env.DATABASE_URL) {
    try {
      db = await loadAppState(db);

      console.log(
        'Application state loaded from PostgreSQL.'
      );
    } catch (error) {
      console.error(
        'Failed to load application state from PostgreSQL:',
        error
      );

      process.exitCode = 1;
      return;
    }
  } else {
    console.log(
      'DATABASE_URL not set; using in-memory seed application state.'
    );
  }

  // -------------------------------------------------------------
  // TEST POSTGRESQL CONNECTION
  // -------------------------------------------------------------

  if (process.env.DATABASE_URL) {
    try {
      await testDatabaseConnection();

      console.log(
        'PostgreSQL database connection successful.'
      );
    } catch (error) {
      console.error(
        'PostgreSQL database connection failed:',
        error
      );

      process.exitCode = 1;
      return;
    }
  }

  // -------------------------------------------------------------
  // VITE DEVELOPMENT SERVER
  // -------------------------------------------------------------

  if (
    process.env.NODE_ENV !== 'production'
  ) {
    const vite =
      await createViteServer({
        server: {
          middlewareMode: true
        },
        appType: 'spa'
      });

    app.use(vite.middlewares);
  } else {
    // -----------------------------------------------------------
    // PRODUCTION STATIC FILES
    // -----------------------------------------------------------

    app.use(
      express.static(
        path.join(__dirname, 'dist')
      )
    );

    app.get('*', (_req, res) => {
      res.sendFile(
        path.join(
          __dirname,
          'dist',
          'index.html'
        )
      );
    });
  }

  // -------------------------------------------------------------
  // START HTTP SERVER
  // -------------------------------------------------------------

  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `Digital Health Stack running on port ${PORT}`
      );
    }
  );
}

// -------------------------------------------------------------
// START SERVER IF EXECUTED DIRECTLY
// -------------------------------------------------------------

if (
  process.env.NODE_ENV !== 'test'
) {
  startServer();
}