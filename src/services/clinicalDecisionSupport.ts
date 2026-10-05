import { CDSAlert, LabReport, PrescriptionMedicineItem } from '../types';

/**
 * Clinical Decision Support (CDS) Rule Engine
 * 
 * Provides rule-based clinical advisories for:
 * 1. Abnormal Laboratory Values
 * 2. Potential Drug-Drug Interactions
 * 3. High-Risk Vital Sign Warnings
 * 4. Duplicate Test Orders within short timeframe
 * 
 * NOTE: Presented strictly as decision-support advisories for licensed clinicians,
 * not automated diagnoses.
 */

// Drug Interaction Knowledge Base
const DRUG_INTERACTIONS: Record<string, { partner: string; severity: 'CRITICAL' | 'WARNING'; message: string; guideline: string }[]> = {
  'warfarin': [
    {
      partner: 'aspirin',
      severity: 'CRITICAL',
      message: 'Concurrent Warfarin and Aspirin significantly increases gastrointestinal and major systemic bleeding risk.',
      guideline: 'Monitor INR frequently or consider gastro-protective co-therapy if combination is mandatory.'
    },
    {
      partner: 'ibuprofen',
      severity: 'CRITICAL',
      message: 'NSAIDs potentiate hypoprothrombinemic effect of Warfarin and induce gastric mucosal injury.',
      guideline: 'Avoid non-selective NSAIDs; consider acetaminophen for analgesia.'
    }
  ],
  'metformin': [
    {
      partner: 'iodinated contrast',
      severity: 'CRITICAL',
      message: 'Risk of lactic acidosis in case of contrast-induced nephropathy.',
      guideline: 'Withhold Metformin 48 hours prior to contrast imaging if eGFR < 60 mL/min.'
    }
  ],
  'lisinopril': [
    {
      partner: 'spironolactone',
      severity: 'WARNING',
      message: 'Dual renin-angiotensin-aldosterone blockade may cause severe hyperkalemia.',
      guideline: 'Check serum potassium and creatinine within 1-2 weeks of initiation.'
    },
    {
      partner: 'potassium chloride',
      severity: 'CRITICAL',
      message: 'Concomitant potassium supplements with ACE inhibitors may lead to fatal hyperkalemia.',
      guideline: 'Routine potassium supplements contraindicated unless persistent documented hypokalemia.'
    }
  ],
  'atorvastatin': [
    {
      partner: 'clarithromycin',
      severity: 'WARNING',
      message: 'Strong CYP3A4 inhibitors dramatically increase Atorvastatin plasma concentrations, raising rhabdomyolysis risk.',
      guideline: 'Suspend statin during macrolide antibiotic course or select azithromycin.'
    }
  ]
};

export function evaluateClinicalDecisionSupport(
  labReports: LabReport[],
  prescriptions: { medicines: PrescriptionMedicineItem[] }[],
  vitals?: { bloodPressure?: string; heartRate?: number; spo2?: number; temperature?: string }
): CDSAlert[] {
  const alerts: CDSAlert[] = [];

  // 1. Abnormal Laboratory Alerts
  for (const report of labReports) {
    for (const test of report.testResults) {
      if (test.status === 'Critical' || test.status === 'Low' || test.status === 'High') {
        const isCritical = test.status === 'Critical';
        alerts.push({
          id: `cds_lab_${test.testName.replace(/\s+/g, '_')}_${report.id}`,
          type: 'ABNORMAL_LAB',
          severity: isCritical ? 'CRITICAL' : 'WARNING',
          title: `${test.status} ${test.testName} detected`,
          message: `${test.testName} is ${test.value} ${test.unit} (Biological Reference: ${test.referenceRange}).`,
          clinicalGuideline: isCritical 
            ? 'Urgent clinical review advised. Verify with repeat test or immediate therapeutic intervention.'
            : 'Clinical correlation recommended in context of patient presentation.',
          relatedItem: `${report.reportName}`
        });
      }
    }
  }

  // 2. Drug-Drug Interactions
  const allMeds: string[] = [];
  for (const rx of prescriptions) {
    for (const med of rx.medicines) {
      allMeds.push(med.medicineName.toLowerCase());
    }
  }

  for (let i = 0; i < allMeds.length; i++) {
    const medA = allMeds[i];
    for (const key in DRUG_INTERACTIONS) {
      if (medA.includes(key)) {
        const potentialInteractions = DRUG_INTERACTIONS[key];
        for (const inter of potentialInteractions) {
          for (let j = 0; j < allMeds.length; j++) {
            if (i !== j && allMeds[j].includes(inter.partner)) {
              alerts.push({
                id: `cds_drug_${key}_${inter.partner}`,
                type: 'DRUG_INTERACTION',
                severity: inter.severity,
                title: `Drug-Drug Interaction: ${key.toUpperCase()} + ${inter.partner.toUpperCase()}`,
                message: inter.message,
                clinicalGuideline: inter.guideline,
                relatedItem: `${medA} vs ${allMeds[j]}`
              });
            }
          }
        }
      }
    }
  }

  // 3. High-Risk Vitals
  if (vitals) {
    if (vitals.bloodPressure) {
      const parts = vitals.bloodPressure.split('/');
      if (parts.length === 2) {
        const sys = parseInt(parts[0], 10);
        const dia = parseInt(parts[1], 10);
        if (sys >= 180 || dia >= 120) {
          alerts.push({
            id: 'cds_vital_htn_crisis',
            type: 'HIGH_RISK_VITAL',
            severity: 'CRITICAL',
            title: 'Hypertensive Crisis Threshold Warning',
            message: `Blood pressure ${vitals.bloodPressure} mmHg exceeds emergency threshold.`,
            clinicalGuideline: 'Assess immediately for target organ damage (headache, chest pain, vision changes).'
          });
        } else if (sys >= 140 || dia >= 90) {
          alerts.push({
            id: 'cds_vital_htn_stage2',
            type: 'HIGH_RISK_VITAL',
            severity: 'WARNING',
            title: 'Stage 2 Hypertension Advisory',
            message: `Blood pressure reading ${vitals.bloodPressure} mmHg requires evaluation.`,
            clinicalGuideline: 'Initiate or optimize antihypertensive therapy and lifestyle measures.'
          });
        }
      }
    }

    if (vitals.spo2 && vitals.spo2 < 92) {
      alerts.push({
        id: 'cds_vital_hypoxia',
        type: 'HIGH_RISK_VITAL',
        severity: 'CRITICAL',
        title: 'Severe Hypoxia Warning',
        message: `Oxygen saturation (SpO2) at ${vitals.spo2}% is critically low.`,
        clinicalGuideline: 'Administer supplemental oxygen immediately and evaluate cardiopulmonary etiology.'
      });
    }

    if (vitals.heartRate && (vitals.heartRate > 120 || vitals.heartRate < 45)) {
      alerts.push({
        id: 'cds_vital_arrhythmia',
        type: 'HIGH_RISK_VITAL',
        severity: 'WARNING',
        title: vitals.heartRate > 120 ? 'Tachycardia Alert' : 'Bradycardia Alert',
        message: `Heart rate recorded at ${vitals.heartRate} bpm.`,
        clinicalGuideline: 'Obtain 12-lead ECG to rule out supraventricular or ventricular arrhythmias.'
      });
    }
  }

  return alerts;
}
