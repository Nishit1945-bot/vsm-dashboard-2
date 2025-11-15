// lib/column-mapper.ts

export interface ColumnMapping {
  csvColumn: string;
  vsmField: VSMField | null;
  confidence: number; // 0-100
  matchType: 'exact' | 'fuzzy' | 'position' | 'none';
}

export type VSMField = 
  | 'processName'
  | 'cycleTime'
  | 'changeoverTime'
  | 'uptime'
  | 'operators'
  | 'shifts'
  | 'availableTime'
  | 'inventory'
  | 'batchSize';

interface FieldPattern {
  field: VSMField;
  exactMatches: string[];
  fuzzyKeywords: string[];
  dataTypeHint: 'string' | 'number' | 'percentage';
  typicalRange?: [number, number];
}

const FIELD_PATTERNS: FieldPattern[] = [
  {
    field: 'processName',
    exactMatches: ['Process Name', 'Process', 'Step', 'Operation', 'Station'],
    fuzzyKeywords: ['process', 'step', 'operation', 'name', 'station'],
    dataTypeHint: 'string',
  },
  {
    field: 'cycleTime',
    exactMatches: ['Cycle Time', 'C/T', 'CT', 'Cycle Time (sec)', 'Processing Time'],
    fuzzyKeywords: ['cycle', 'c/t', 'ct', 'processing time', 'process time'],
    dataTypeHint: 'number',
    typicalRange: [1, 3600], // 1 second to 1 hour
  },
  {
    field: 'changeoverTime',
    exactMatches: ['Changeover Time', 'C/O', 'CO', 'Setup Time', 'Changeover'],
    fuzzyKeywords: ['changeover', 'c/o', 'co', 'setup', 'change over'],
    dataTypeHint: 'number',
    typicalRange: [0, 1440], // 0 to 24 hours
  },
  {
    field: 'uptime',
    exactMatches: ['Uptime', 'Availability', 'Uptime %', 'Available %'],
    fuzzyKeywords: ['uptime', 'availability', 'available', 'up time'],
    dataTypeHint: 'percentage',
    typicalRange: [0, 100],
  },
  {
    field: 'operators',
    exactMatches: ['Operators', 'Number of Operators', '# Operators', 'Workers'],
    fuzzyKeywords: ['operator', 'workers', 'people', 'staff', 'labor'],
    dataTypeHint: 'number',
    typicalRange: [1, 20],
  },
  {
    field: 'inventory',
    exactMatches: ['Inventory', 'WIP', 'Stock', 'Quantity', 'Inventory After'],
    fuzzyKeywords: ['inventory', 'wip', 'stock', 'qty', 'quantity'],
    dataTypeHint: 'number',
    typicalRange: [0, 100000],
  },
  {
    field: 'shifts',
    exactMatches: ['Shifts', 'Number of Shifts', 'Shifts/Day'],
    fuzzyKeywords: ['shift', 'shifts'],
    dataTypeHint: 'number',
    typicalRange: [1, 3],
  },
];

/**
 * Map CSV columns to VSM fields using smart matching
 */
export function mapColumns(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<VSMField>();

  for (const header of headers) {
    const mapping = findBestMatch(header, usedFields);
    mappings.push(mapping);
    
    if (mapping.vsmField) {
      usedFields.add(mapping.vsmField);
    }
  }

  return mappings;
}

/**
 * Find best matching VSM field for a CSV column
 */
function findBestMatch(csvColumn: string, usedFields: Set<VSMField>): ColumnMapping {
  const cleanColumn = csvColumn.toLowerCase().trim();
  
  let bestMatch: ColumnMapping = {
    csvColumn,
    vsmField: null,
    confidence: 0,
    matchType: 'none',
  };

  for (const pattern of FIELD_PATTERNS) {
    // Skip if field already mapped
    if (usedFields.has(pattern.field)) continue;

    // Check exact matches (case-insensitive)
    for (const exact of pattern.exactMatches) {
      if (exact.toLowerCase() === cleanColumn) {
        return {
          csvColumn,
          vsmField: pattern.field,
          confidence: 95,
          matchType: 'exact',
        };
      }
    }

    // Check fuzzy keyword matches
    let keywordScore = 0;
    for (const keyword of pattern.fuzzyKeywords) {
      if (cleanColumn.includes(keyword)) {
        keywordScore += 20;
      }
    }

    if (keywordScore > bestMatch.confidence) {
      bestMatch = {
        csvColumn,
        vsmField: pattern.field,
        confidence: Math.min(keywordScore, 85),
        matchType: 'fuzzy',
      };
    }
  }

  return bestMatch;
}

/**
 * Detect missing critical fields
 */
export interface MissingFieldAnalysis {
  critical: VSMField[]; // Must have
  important: VSMField[]; // Should have
  optional: VSMField[]; // Nice to have
}

export function detectMissingFields(mappings: ColumnMapping[]): MissingFieldAnalysis {
  const mappedFields = new Set(
    mappings
      .filter(m => m.vsmField !== null)
      .map(m => m.vsmField as VSMField)
  );

  const critical: VSMField[] = [];
  const important: VSMField[] = [];
  const optional: VSMField[] = [];

  // Critical fields
  if (!mappedFields.has('processName')) critical.push('processName');
  if (!mappedFields.has('cycleTime')) critical.push('cycleTime');

  // Important fields
  if (!mappedFields.has('changeoverTime')) important.push('changeoverTime');
  if (!mappedFields.has('uptime')) important.push('uptime');
  if (!mappedFields.has('inventory')) important.push('inventory');

  // Optional fields
  if (!mappedFields.has('operators')) optional.push('operators');
  if (!mappedFields.has('shifts')) optional.push('shifts');

  return { critical, important, optional };
}

/**
 * Get default value for a field
 */
export function getDefaultValue(field: VSMField, industry?: string): any {
  const industryDefaults: Record<string, Record<VSMField, any>> = {
    foundry: {
      processName: '',
      cycleTime: 0,
      changeoverTime: 90,
      uptime: 75,
      operators: 1,
      shifts: 2,
      availableTime: 27000,
      inventory: 0,
      batchSize: 1,
    },
    automotive: {
      processName: '',
      cycleTime: 0,
      changeoverTime: 60,
      uptime: 85,
      operators: 1,
      shifts: 2,
      availableTime: 27000,
      inventory: 0,
      batchSize: 1,
    },
  };

  const defaults = industry && industryDefaults[industry] 
    ? industryDefaults[industry]
    : {
        processName: '',
        cycleTime: 0,
        changeoverTime: 0,
        uptime: 85,
        operators: 1,
        shifts: 2,
        availableTime: 27000,
        inventory: 0,
        batchSize: 1,
      };

  return defaults[field];
}

/**
 * Validate field value
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export function validateField(field: VSMField, value: any): ValidationResult {
  // Type validation
  if (field === 'processName') {
    if (!value || value.trim() === '') {
      return { isValid: false, error: 'Process name is required' };
    }
    return { isValid: true };
  }

  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: 'Must be a number' };
  }

  // Range validation
  switch (field) {
    case 'cycleTime':
      if (numValue <= 0) {
        return { isValid: false, error: 'Must be greater than 0' };
      }
      if (numValue > 3600) {
        return { isValid: true, warning: 'Very long cycle time (>1 hour). Is this correct?' };
      }
      break;

    case 'uptime':
      if (numValue < 0 || numValue > 100) {
        return { isValid: false, error: 'Must be between 0 and 100' };
      }
      if (numValue < 50) {
        return { isValid: true, warning: 'Very low uptime (<50%). Is this correct?' };
      }
      break;

    case 'changeoverTime':
      if (numValue < 0) {
        return { isValid: false, error: 'Cannot be negative' };
      }
      if (numValue > 480) {
        return { isValid: true, warning: 'Very long changeover (>8 hours). Is this correct?' };
      }
      break;

    case 'operators':
      if (numValue < 0) {
        return { isValid: false, error: 'Cannot be negative' };
      }
      if (!Number.isInteger(numValue)) {
        return { isValid: false, error: 'Must be a whole number' };
      }
      break;

    case 'inventory':
      if (numValue < 0) {
        return { isValid: false, error: 'Cannot be negative' };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Auto-detect units (seconds vs minutes)
 */
export function detectUnits(values: number[], field: VSMField): 'seconds' | 'minutes' | 'unknown' {
  if (field !== 'cycleTime' && field !== 'changeoverTime') return 'unknown';

  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  if (field === 'cycleTime') {
    // Cycle times typically 10-600 seconds
    if (avg >= 10 && avg <= 600) return 'seconds';
    // If values like 1.5, 2.5 → probably minutes
    if (avg < 10) return 'minutes';
  }

  if (field === 'changeoverTime') {
    // Changeovers typically 5-180 minutes
    if (avg >= 5 && avg <= 180) return 'minutes';
    // Very high values → probably seconds
    if (avg > 1000) return 'seconds';
  }

  return 'unknown';
}