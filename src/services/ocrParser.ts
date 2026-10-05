import { LabTestResult, LabTestStatus } from '../types';

/**
 * Generic Laboratory Report OCR Parser
 * Designed to parse raw OCR output from various diagnostic centers and report formats.
 * 
 * CRITICAL ARCHITECTURAL REQUIREMENT:
 * Preserves the full multipart test name (e.g. "Total Leukocyte Count (TLC)",
 * "Absolute Neutrophil Count (ANC)", "Absolute Lymphocyte Count (ALC)") without
 * truncating prematurely to "Total" or "Absolute".
 */

export interface ParsedReportData {
  reportName: string;
  reportType: 'HEMATOLOGY' | 'BIOCHEMISTRY' | 'THYROID' | 'LIPID' | 'URINALYSIS' | 'RADIOLOGY' | 'OTHER';
  diagnosticCenterName?: string;
  patientUhid?: string;
  testResults: LabTestResult[];
  rawText: string;
  overallStatus: 'Normal' | 'Abnormal Values Detected' | 'Critical Values Detected';
}

/**
 * Parse an OCR line or block into a structured lab test result.
 */
export function parseLaboratoryReport(rawOcrText: string): ParsedReportData {
  const lines = rawOcrText.split('\n').map(l => l.trim()).filter(Boolean);
  const testResults: LabTestResult[] = [];

  // Determine report category
  let reportType: ParsedReportData['reportType'] = 'OTHER';
  let detectedReportName = 'Laboratory Diagnostic Report';

  const lowerText = rawOcrText.toLowerCase();
  if (lowerText.includes('complete blood count') || lowerText.includes('cbc') || lowerText.includes('hemogram') || lowerText.includes('hematology')) {
    reportType = 'HEMATOLOGY';
    detectedReportName = 'Complete Blood Count (CBC) with Differential';
  } else if (lowerText.includes('lipid profile') || lowerText.includes('cholesterol') || lowerText.includes('triglycerides')) {
    reportType = 'LIPID';
    detectedReportName = 'Lipid Profile Screen';
  } else if (lowerText.includes('liver function') || lowerText.includes('lft') || lowerText.includes('bilirubin') || lowerText.includes('sgot') || lowerText.includes('sgpt')) {
    reportType = 'BIOCHEMISTRY';
    detectedReportName = 'Liver Function Test (LFT) Panel';
  } else if (lowerText.includes('kidney function') || lowerText.includes('kft') || lowerText.includes('renal') || lowerText.includes('creatinine')) {
    reportType = 'BIOCHEMISTRY';
    detectedReportName = 'Kidney Function Test (KFT) Panel';
  } else if (lowerText.includes('thyroid') || lowerText.includes('tsh') || lowerText.includes('ft3') || lowerText.includes('ft4')) {
    reportType = 'THYROID';
    detectedReportName = 'Thyroid Function Profile (TSH / FT3 / FT4)';
  } else if (lowerText.includes('glucose') || lowerText.includes('hba1c') || lowerText.includes('diabetes') || lowerText.includes('glycemic')) {
    reportType = 'BIOCHEMISTRY';
    detectedReportName = 'Glycemic Profile (HbA1c & Fasting Glucose)';
  } else if (lowerText.includes('urine') || lowerText.includes('urinalysis')) {
    reportType = 'URINALYSIS';
    detectedReportName = 'Comprehensive Urinalysis & Microscopy';
  }

  // Known full test name prefixes to protect from truncation
  const compoundTestPatterns = [
    'Total Leukocyte Count (TLC)',
    'Total Leukocyte Count',
    'Total White Blood Cell Count',
    'Total WBC Count',
    'Absolute Neutrophil Count (ANC)',
    'Absolute Neutrophil Count',
    'Absolute Lymphocyte Count (ALC)',
    'Absolute Lymphocyte Count',
    'Absolute Monocyte Count (AMC)',
    'Absolute Monocyte Count',
    'Absolute Eosinophil Count (AEC)',
    'Absolute Eosinophil Count',
    'Absolute Basophil Count (ABC)',
    'Absolute Basophil Count',
    'Packed Cell Volume (PCV)',
    'Packed Cell Volume',
    'Mean Corpuscular Volume (MCV)',
    'Mean Corpuscular Volume',
    'Mean Corpuscular Hemoglobin Conc (MCHC)',
    'Mean Corpuscular Hemoglobin Conc',
    'Mean Corpuscular Hemoglobin (MCH)',
    'Mean Corpuscular Hemoglobin',
    'Red Cell Distribution Width (RDW)',
    'Red Cell Distribution Width',
    'Platelet Distribution Width',
    'Platelet Count',
    'Platelets',
    'Total Bilirubin',
    'Direct Bilirubin',
    'Indirect Bilirubin',
    'Total Cholesterol',
    'High Density Lipoprotein (HDL)',
    'High Density Lipoprotein',
    'Low Density Lipoprotein (LDL)',
    'Low Density Lipoprotein',
    'Very Low Density Lipoprotein (VLDL)',
    'Very Low Density Lipoprotein',
    'HDL Cholesterol',
    'LDL Cholesterol',
    'VLDL Cholesterol',
    'Serum Triglycerides',
    'Triglycerides',
    'Blood Urea Nitrogen (BUN)',
    'Blood Urea Nitrogen',
    'Blood Urea',
    'Serum Creatinine',
    'Serum Uric Acid',
    'Thyroid Stimulating Hormone (TSH)',
    'Thyroid Stimulating Hormone',
    'Free Triiodothyronine (FT3)',
    'Free Triiodothyronine',
    'Free Thyroxine (FT4)',
    'Free Thyroxine',
    'Fasting Plasma Glucose (FPG)',
    'Fasting Plasma Glucose',
    'Fasting Blood Sugar (FBS)',
    'Fasting Blood Sugar',
    'Post Prandial Plasma Glucose (PPG)',
    'Post Prandial Blood Sugar (PPBS)',
    'Random Blood Sugar (RBS)',
    'Glycosylated Hemoglobin (HbA1c)',
    'Glycosylated Hemoglobin',
    'Glycated Hemoglobin',
    'Alkaline Phosphatase (ALP)',
    'Alkaline Phosphatase',
    'Alanine Aminotransferase (ALT/SGPT)',
    'Alanine Aminotransferase',
    'Aspartate Aminotransferase (AST/SGOT)',
    'Aspartate Aminotransferase',
    'Gamma Glutamyl Transferase (GGT)',
    'Gamma Glutamyl Transferase',
    'Serum Albumin',
    'Serum Globulin',
    'Albumin / Globulin Ratio',
    'A/G Ratio',
    'Hemoglobin (Hb)',
    'Hemoglobin',
    'Erythrocyte Sedimentation Rate (ESR)',
    'Erythrocyte Sedimentation Rate',
    'C-Reactive Protein (CRP)',
    'Serum Ferritin',
    'Vitamin D3 (25-OH)',
    'Vitamin D3',
    'Vitamin B12',
    'Serum Calcium',
    'Serum Potassium',
    'Serum Sodium',
    'Serum Chloride',
    'Serum Phosphorus'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip non-test metadata lines
    if (
      line.length < 4 ||
      line.startsWith('===') ||
      line.startsWith('---') ||
      line.toLowerCase().startsWith('patient:') ||
      line.toLowerCase().startsWith('patient name:') ||
      line.toLowerCase().startsWith('uhid:') ||
      line.toLowerCase().startsWith('age:') ||
      line.toLowerCase().startsWith('gender:') ||
      line.toLowerCase().startsWith('doctor:') ||
      line.toLowerCase().startsWith('ref doctor:') ||
      line.toLowerCase().startsWith('sample:') ||
      line.toLowerCase().startsWith('date:') ||
      line.toLowerCase().startsWith('page ') ||
      line.toLowerCase().startsWith('test method:') ||
      line.toLowerCase().startsWith('comments:') ||
      line.toLowerCase().startsWith('interpretation:') ||
      line.toLowerCase().startsWith('remarks:') ||
      line.toLowerCase().startsWith('pathologist:') ||
      line.toLowerCase().includes('pathology laboratory') ||
      (line.toLowerCase().includes('investigation') && line.toLowerCase().includes('result')) ||
      (line.toLowerCase().includes('test name') && line.toLowerCase().includes('result'))
    ) {
      continue;
    }

    let parsedResult: LabTestResult | null = null;

    // 1. Try finding one of the compound known test patterns first
    let matchedCompoundName: string | null = null;
    for (const pattern of compoundTestPatterns) {
      if (line.toLowerCase().includes(pattern.toLowerCase())) {
        matchedCompoundName = pattern;
        break;
      }
    }

    if (matchedCompoundName) {
      parsedResult = extractFromLineTokens(line, matchedCompoundName);
    }

    // 2. If not matched or extraction returned null, try colon separator: "Test Name: Value Unit (Ref)"
    if (!parsedResult) {
      parsedResult = parseColonFormat(line);
    }

    // 3. Tabular column format (2+ spaces or tabs)
    if (!parsedResult) {
      parsedResult = parseTabularFormat(line);
    }

    // 4. Fallback delimiter format
    if (!parsedResult) {
      parsedResult = parseByDelimiter(line);
    }

    if (parsedResult && parsedResult.testName.length >= 2) {
      // Avoid duplicate tests in the same report
      const exists = testResults.some(
        t => t.testName.toLowerCase() === parsedResult!.testName.toLowerCase()
      );
      if (!exists) {
        testResults.push(parsedResult);
      }
    }
  }

  // Calculate overall status
  const hasCritical = testResults.some(t => t.status === 'Critical');
  const hasAbnormal = testResults.some(t => t.status === 'Low' || t.status === 'High');
  const overallStatus = hasCritical ? 'Critical Values Detected' : (hasAbnormal ? 'Abnormal Values Detected' : 'Normal');

  return {
    reportName: detectedReportName,
    reportType,
    testResults,
    rawText: rawOcrText,
    overallStatus
  };
}

/**
 * Extract tokens when a known compound test name was identified in the line
 */
function extractFromLineTokens(line: string, knownName: string): LabTestResult | null {
  const nameIdx = line.toLowerCase().indexOf(knownName.toLowerCase());
  if (nameIdx === -1) return null;

  const remainder = line.substring(nameIdx + knownName.length).trim();

  let cleanName = knownName;
  let scanText = remainder;

  // Check if abbreviation in parentheses immediately follows
  const parenMatch = remainder.match(/^\s*\(([A-Za-z0-9\/\-]+)\)/);
  if (parenMatch && !knownName.includes('(')) {
    cleanName = `${knownName} (${parenMatch[1]})`;
    scanText = scanText.substring(parenMatch[0].length).trim();
  }

  // Strip leading colons or equal signs
  scanText = scanText.replace(/^[:\=\-\t\s]+/, '').trim();

  // Try matching value, unit, and reference range
  // e.g., "11.2 g/dL 13.0 - 17.0" or "8,400 /cumm 4,000 - 11,000" or "238 mg/dL < 200" or "5.85 µIU/mL 0.35 - 4.50"
  const tokens = scanText.split(/\s{2,}|\t/).map(t => t.trim()).filter(Boolean);
  if (tokens.length >= 2) {
    const valWithUnit = tokens[0];
    const range = tokens[1] || '';
    const { val, unit } = splitValAndUnit(valWithUnit);
    return evaluateTestResult(cleanName, val, unit, range);
  }

  // Single-space / flexible regex on scanText
  const numMatch = scanText.match(/([<>]?\s*[0-9]+(?:[\,\.][0-9]+)?)\s*([a-zA-Z\/\%\^0-9\u00B5\u03BC]+(?:\/[a-zA-Z\^0-9]+)?)?(?:\s*[\(\[]?(?:(?:Ref(?:\.|erence)?\s*(?:Range|Interval)?:?\s*)?([<>]?\s*[0-9]+(?:\.[0-9]+)?\s*(?:-|–|to)\s*[0-9]+(?:\.[0-9]+)?|<[0-9\.]+|>[0-9\.]+))?[\)\]]?)?/i);
  if (numMatch) {
    const val = numMatch[1].replace(/,/g, '').trim();
    const unit = numMatch[2] || '';
    const range = numMatch[3] || '';
    return evaluateTestResult(cleanName, val, unit, range);
  }

  return null;
}

/**
 * Parses lines formatted with a colon: "Test Name: 14.2 g/dL (13.0 - 17.0)"
 */
function parseColonFormat(line: string): LabTestResult | null {
  const colonMatch = line.match(/^([^:\t]+)[:=]\s*([<>]?\s*[0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z\/\%\^0-9\u00B5\u03BC]+(?:\/[a-zA-Z\^0-9]+)?)?(?:\s*[\(\[]?(?:(?:Ref(?:\.|erence)?\s*(?:Range|Interval)?:?\s*)?([<>]?\s*[0-9]+(?:\.[0-9]+)?\s*(?:-|–|to)\s*[0-9]+(?:\.[0-9]+)?|<[0-9\.]+|>[0-9\.]+))?[\)\]]?)?/i);
  if (colonMatch) {
    const rawName = cleanTestName(colonMatch[1]);
    if (isNonTestWord(rawName)) return null;

    const val = colonMatch[2].replace(/,/g, '').trim();
    const unit = colonMatch[3] || '';
    const range = colonMatch[4] || '';
    return evaluateTestResult(rawName, val, unit, range);
  }
  return null;
}

/**
 * Parses column-aligned tabular lines
 */
function parseTabularFormat(line: string): LabTestResult | null {
  const tabularRegex = /^([A-Za-z0-9\s\/\(\)\,\-\.\+\%]+?)\s{2,}?(\d+\.?\d*|<|>|<=|>=|\d+\.\d+)\s*([a-zA-Z\/\%\^0-9\u00B5\u03BC]+(?:\/[a-zA-Z\^0-9]+)?|\%)?\s+(?:(?:Ref(?:\.|erence)?\s*(?:Range|Interval)?:?\s*)?([<>]?\s*\d+(?:\.\d+)?\s*(?:-|–|to)\s*\d+(?:\.\d+)?|<[0-9\.]+|>[0-9\.]+))?/i;
  const match = line.match(tabularRegex);
  if (match) {
    const rawName = cleanTestName(match[1]);
    const rawVal = match[2];
    const unit = match[3] || '';
    const range = match[4] || '';

    if (rawName && rawVal && !isNonTestWord(rawName)) {
      return evaluateTestResult(rawName, rawVal, unit, range);
    }
  }
  return null;
}

/**
 * Fallback delimiter parser
 */
function parseByDelimiter(line: string): LabTestResult | null {
  if (!line.includes(':') && !line.includes(' - ') && !line.includes('\t')) return null;
  const parts = line.split(/[:\t]/);
  if (parts.length >= 2) {
    const rawName = cleanTestName(parts[0]);
    if (isNonTestWord(rawName)) return null;
    const { val, unit } = splitValAndUnit(parts[1]);
    const range = parts[2] ? parts[2].trim() : '';
    if (val && !isNaN(parseFloat(val))) {
      return evaluateTestResult(rawName, val, unit, range);
    }
  }
  return null;
}

function splitValAndUnit(text: string): { val: string; unit: string } {
  const match = text.trim().match(/^([<>]?\s*[0-9]+(?:\.[0-9]+)?)\s*(.*)$/);
  if (match) {
    return {
      val: match[1].trim(),
      unit: match[2].trim()
    };
  }
  return { val: text.trim(), unit: '' };
}

function cleanTestName(name: string): string {
  return name.replace(/^[\*\-\#\.\s]+/, '').replace(/[\:\-]+$/, '').trim();
}

function isNonTestWord(word: string): boolean {
  const lower = word.toLowerCase().trim();
  const blacklisted = [
    'signature', 'authorized', 'doctor', 'patient', 'hospital', 'tel', 'phone',
    'report date', 'collection date', 'sample id', 'interpretation', 'notes',
    'referral', 'clinic', 'tested by', 'verified by', 'method', 'page', 'disclaimer',
    'address', 'email', 'name', 'investigation', 'parameter', 'unit', 'units', 'result',
    'reference', 'interval', 'normal', 'remarks', 'comments', 'impression', 'technician'
  ];
  return blacklisted.some(b => lower.startsWith(b) || lower === b);
}

/**
 * Calculates test status based strictly on the reference range provided in the report.
 * Uses clinical thresholds to flag Low, High, or Critical.
 */
function evaluateTestResult(testName: string, rawVal: string, unit: string, referenceRange: string): LabTestResult {
  const cleanRange = referenceRange.replace(/Ref(\.|\s*Range\s*:?)/i, '').replace(/[\(\)\[\]]/g, '').trim();
  const numVal = parseFloat(rawVal.replace(/[<>,\s]/g, ''));
  let status: LabTestStatus = 'Normal';
  let clinicalNote: string | undefined = undefined;

  if (!isNaN(numVal) && cleanRange) {
    const rangeMatch = cleanRange.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|to)\s*([0-9]+(?:\.[0-9]+)?)/);
    const lessThanMatch = cleanRange.match(/<\s*([0-9]+(?:\.[0-9]+)?)/);
    const greaterThanMatch = cleanRange.match(/>\s*([0-9]+(?:\.[0-9]+)?)/);

    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      if (numVal < min) {
        status = (min - numVal) > (min * 0.4) ? 'Critical' : 'Low';
        clinicalNote = `Below reference threshold (${min} ${unit}).`;
      } else if (numVal > max) {
        status = (numVal - max) > (max * 0.5) ? 'Critical' : 'High';
        clinicalNote = `Above reference threshold (${max} ${unit}).`;
      } else {
        status = 'Normal';
      }
    } else if (lessThanMatch) {
      const max = parseFloat(lessThanMatch[1]);
      if (numVal > max) {
        status = numVal > max * 1.5 ? 'Critical' : 'High';
        clinicalNote = `Elevated relative to target < ${max} ${unit}.`;
      } else {
        status = 'Normal';
      }
    } else if (greaterThanMatch) {
      const min = parseFloat(greaterThanMatch[1]);
      if (numVal < min) {
        status = 'Low';
        clinicalNote = `Deficient relative to target > ${min} ${unit}.`;
      } else {
        status = 'Normal';
      }
    }
  }

  return {
    testName,
    value: rawVal,
    numericValue: !isNaN(numVal) ? numVal : undefined,
    unit: unit || '',
    referenceRange: cleanRange || 'As reported',
    status,
    clinicalNote
  };
}

/**
 * Built-in Sample OCR Raw Texts from leading diagnostic laboratories
 */
export const SAMPLE_LAB_REPORTS = [
  {
    id: 'sample_cbc_full',
    name: 'Complete Blood Count (CBC) with Differential',
    labName: 'Apex Diagnostic Centre & Pathology Labs (NABL Accredited)',
    reportType: 'HEMATOLOGY' as const,
    rawText: `================================================================================
APEX DIAGNOSTIC CENTRE & PATHOLOGY LABS
NABH & NABL ACCREDITED MOLECULAR LAB
UHID: UHID-ACEA-031D    Patient Name: Arun Kumar
Age: 32 Yrs / Male       Date of Sample: 2026-09-28
Ref Doctor: Dr. Rahul Sharma (Neurology)
================================================================================
INVESTIGATION                                RESULT       UNITS       REFERENCE RANGE
--------------------------------------------------------------------------------
Hemoglobin                                   11.2         g/dL        13.0 - 17.0
Total Leukocyte Count (TLC)                  8,400        /cumm       4,000 - 11,000
Packed Cell Volume (PCV)                     34.5         %           40.0 - 50.0
Mean Corpuscular Volume (MCV)                82.0         fL          80.0 - 100.0
Mean Corpuscular Hemoglobin (MCH)            27.1         pg          27.0 - 32.0
Mean Corpuscular Hemoglobin Conc (MCHC)      32.4         g/dL        31.5 - 35.0
Platelet Count                               265          10^3/µL     150 - 450

DIFFERENTIAL LEUKOCYTE COUNT (DLC):
Absolute Neutrophil Count (ANC)              5,100        /cumm       2,000 - 7,000
Absolute Lymphocyte Count (ALC)              2,350        /cumm       1,000 - 3,000
Absolute Monocyte Count (AMC)                520          /cumm       200 - 800
Absolute Eosinophil Count (AEC)              380          /cumm       20 - 500
Absolute Basophil Count (ABC)                50           /cumm       0 - 100
--------------------------------------------------------------------------------
Comments: Mild normocytic normochromic anemia. Total Leukocyte Count and Absolute Differential Leukocyte counts are preserved within biological limits.
Pathologist In-Charge: Dr. S. Mukherjee, MD Path.`
  },
  {
    id: 'sample_lipid_panel',
    name: 'Comprehensive Lipid Profile Panel',
    labName: 'MetroPath Speciality Laboratories',
    reportType: 'LIPID' as const,
    rawText: `================================================================================
METROPATH SPECIALITY LABORATORIES
Patient UHID: UHID-ACEA-031D
Sample Type: Fasting Serum (12 hrs fasting)
Report Date: 2026-09-25
================================================================================
TEST NAME                                    RESULT       UNIT        REFERENCE RANGE
--------------------------------------------------------------------------------
Total Cholesterol                            238          mg/dL       < 200
High Density Lipoprotein (HDL)               38           mg/dL       > 40
Low Density Lipoprotein (LDL)                162          mg/dL       < 100
Very Low Density Lipoprotein (VLDL)          38           mg/dL       < 30
Triglycerides                                190          mg/dL       < 150
--------------------------------------------------------------------------------
Remarks: Elevated LDL and Total Cholesterol with sub-optimal HDL. Clinical correlation advised.`
  },
  {
    id: 'sample_metabolic_kft',
    name: 'Renal & Liver Function Test (KFT / LFT)',
    labName: 'CityHealth Central Diagnostic Imaging',
    reportType: 'BIOCHEMISTRY' as const,
    rawText: `================================================================================
CITYHEALTH CENTRAL DIAGNOSTIC IMAGING
UHID: UHID-ACEA-031D
Specimen: Venous Blood Serum
================================================================================
INVESTIGATION                                VALUE        UNITS       NORMAL INTERVAL
--------------------------------------------------------------------------------
Blood Urea Nitrogen                          18.2         mg/dL       7.0 - 20.0
Serum Creatinine                             0.95         mg/dL       0.7 - 1.3
Serum Uric Acid                              5.4          mg/dL       3.5 - 7.2
Total Bilirubin                              0.8          mg/dL       0.2 - 1.2
Direct Bilirubin                             0.2          mg/dL       0.0 - 0.3
Aspartate Aminotransferase (AST/SGOT)        24           U/L         10 - 40
Alanine Aminotransferase (ALT/SGPT)          28           U/L         10 - 45
Alkaline Phosphatase                         88           U/L         40 - 130
Serum Albumin                                4.2          g/dL        3.5 - 5.0
--------------------------------------------------------------------------------
Status: Renal filtration indices and hepatic transaminases are within normal biological limits.`
  },
  {
    id: 'sample_thyroid_profile',
    name: 'Thyroid Function Profile (TSH / FT3 / FT4)',
    labName: 'EndoCare Diagnostics Laboratory',
    reportType: 'THYROID' as const,
    rawText: `================================================================================
ENDOCARE DIAGNOSTICS LABORATORY
UHID: UHID-ACEA-031D
Test Method: Chemiluminescence Immunoassay (CLIA)
================================================================================
PARAMETER                                    VALUE        UNIT        REFERENCE RANGE
--------------------------------------------------------------------------------
Thyroid Stimulating Hormone                  5.85         µIU/mL      0.35 - 4.50
Free Triiodothyronine                        3.1          pg/mL       2.3 - 4.2
Free Thyroxine                               1.12         ng/dL       0.8 - 1.8
--------------------------------------------------------------------------------
Interpretation: Mildly elevated TSH with normal Free T3 and Free T4 suggestive of subclinical hypothyroidism.`
  },
  {
    id: 'sample_diabetes_glycemic',
    name: 'Glycemic Profile (HbA1c & Fasting Glucose)',
    labName: 'Apex Diagnostic Centre & Pathology Labs',
    reportType: 'BIOCHEMISTRY' as const,
    rawText: `================================================================================
APEX DIAGNOSTIC CENTRE & PATHOLOGY LABS
Patient UHID: UHID-ACEA-031D
Report: Diabetic Screening & Glycemic Control
================================================================================
INVESTIGATION                                RESULT       UNITS       REFERENCE RANGE
--------------------------------------------------------------------------------
Fasting Plasma Glucose                       128          mg/dL       70 - 100
Post Prandial Plasma Glucose                 172          mg/dL       < 140
Glycosylated Hemoglobin (HbA1c)              6.8          %           < 5.7
Estimated Average Glucose (eAG)              148          mg/dL       < 117
--------------------------------------------------------------------------------
Impression: Impaired fasting glucose and elevated HbA1c indicative of early diabetic profile.`
  }
];
