import { SymptomTriageResult } from '../types';

/**
 * AI-Assisted Clinical Symptom Triage Engine
 * 
 * Rules-based with semantic keywords, department mapping, and emergency red-flag safeguards.
 * Never provides a definitive medical diagnosis; triages patients to the appropriate department
 * or alerts them to immediate emergency care.
 */

interface TriageRule {
  keywords: string[];
  department: string;
  isEmergency?: boolean;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  warning?: string;
  recommendedDoctors: string[];
  notes: string;
}

const TRIAGE_RULES: TriageRule[] = [
  {
    keywords: ['chest pain', 'heart attack', 'left arm pain', 'crushing chest', 'difficulty breathing', 'shortness of breath', 'choking', 'cyanosis'],
    department: 'Emergency & Cardiology',
    isEmergency: true,
    urgency: 'EMERGENCY',
    warning: 'EMERGENCY WARNING: Potential Acute Coronary Syndrome or Respiratory Distress. Please proceed to the nearest Emergency Department immediately or call emergency medical services (108 / 911 / 112). Do NOT drive yourself.',
    recommendedDoctors: ['Emergency Medical Officer', 'Dr. Rahul Sharma (Neurology On-Call)'],
    notes: 'Immediate triage required. Do not delay emergency consultation.'
  },
  {
    keywords: ['sudden weakness', 'facial drooping', 'slurred speech', 'arm numbness', 'loss of consciousness', 'thunderclap headache'],
    department: 'Neurology & Stroke Emergency',
    isEmergency: true,
    urgency: 'EMERGENCY',
    warning: 'CRITICAL STROKE ALERT: Fast assessment required (Face, Arms, Speech, Time). Golden hour intervention window.',
    recommendedDoctors: ['Dr. Rahul Sharma (Neurology)'],
    notes: 'Patient directed to acute stroke unit.'
  },
  {
    keywords: ['headache', 'migraine', 'dizziness', 'vertigo', 'tremor', 'seizure', 'tingling', 'memory loss'],
    department: 'Neurology',
    isEmergency: false,
    urgency: 'ROUTINE',
    recommendedDoctors: ['Dr. Rahul Sharma (Neurology)'],
    notes: 'Comprehensive neurological examination recommended.'
  },
  {
    keywords: ['rash', 'itching', 'skin', 'acne', 'eczema', 'psoriasis', 'hives', 'mole', 'dermatitis'],
    department: 'Dermatology',
    isEmergency: false,
    urgency: 'ROUTINE',
    recommendedDoctors: ['Dr. Priya Nair (Dermatology)'],
    notes: 'Visual dermatological evaluation recommended.'
  },
  {
    keywords: ['joint pain', 'knee pain', 'back pain', 'fracture', 'bone', 'sprain', 'arthritis', 'shoulder', 'ligament'],
    department: 'Orthopedics',
    isEmergency: false,
    urgency: 'ROUTINE',
    recommendedDoctors: ['Dr. Arjun Kumar (Orthopedics)'],
    notes: 'Musculoskeletal evaluation and potential X-ray imaging recommended.'
  },
  {
    keywords: ['fever', 'cough', 'cold', 'flu', 'weakness', 'fatigue', 'body ache', 'sore throat', 'nausea', 'vomiting', 'diarrhea'],
    department: 'General Medicine',
    isEmergency: false,
    urgency: 'ROUTINE',
    recommendedDoctors: ['Dr. Ananya Rao (General Medicine)'],
    notes: 'Primary care clinical assessment advised.'
  }
];

export function triageSymptoms(symptomText: string): SymptomTriageResult {
  const normalized = symptomText.toLowerCase().trim();

  if (!normalized) {
    return {
      suggestedDepartment: 'General Medicine',
      urgency: 'ROUTINE',
      isEmergency: false,
      recommendedDoctors: ['Dr. Ananya Rao (General Medicine)'],
      notes: 'Please describe specific symptoms to receive tailored triage guidance.'
    };
  }

  // Check emergency keywords first
  for (const rule of TRIAGE_RULES) {
    if (rule.isEmergency) {
      for (const kw of rule.keywords) {
        if (normalized.includes(kw)) {
          return {
            suggestedDepartment: rule.department,
            urgency: rule.urgency,
            isEmergency: true,
            emergencyWarning: rule.warning,
            recommendedDoctors: rule.recommendedDoctors,
            notes: rule.notes
          };
        }
      }
    }
  }

  // Check routine department matches
  for (const rule of TRIAGE_RULES) {
    for (const kw of rule.keywords) {
      if (normalized.includes(kw)) {
        return {
          suggestedDepartment: rule.department,
          urgency: rule.urgency,
          isEmergency: false,
          recommendedDoctors: rule.recommendedDoctors,
          notes: rule.notes
        };
      }
    }
  }

  // Default fallback
  return {
    suggestedDepartment: 'General Medicine',
    urgency: 'ROUTINE',
    isEmergency: false,
    recommendedDoctors: ['Dr. Ananya Rao (General Medicine)'],
    notes: 'Based on the entered symptoms, an initial consultation with General Medicine is recommended for baseline clinical assessment.'
  };
}
