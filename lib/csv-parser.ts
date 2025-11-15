// lib/csv-parser.ts

export interface ParsedCSVData {
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
  rowCount: number;
}

export interface ExcelSheet {
  name: string;
  headers: string[];
  rows: Record<string, any>[];
}

export interface ParsedExcelData {
  sheets: ExcelSheet[];
  fileName: string;
  sheetCount: number;
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

export interface MissingFieldAnalysis {
  critical: VSMField[];
  important: VSMField[];
  optional: VSMField[];
}

/**
 * Parse CSV file
 */
export async function parseCSV(file: File): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('Empty CSV file'));
          return;
        }

        // Parse headers
        const headers = parseCSVLine(lines[0]);
        
        // Parse rows
        const rows: Record<string, any>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          rows.push(row);
        }

        resolve({
          headers,
          rows,
          fileName: file.name,
          rowCount: rows.length,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse a single CSV line (handles quotes)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse Excel file (requires xlsx library)
 */
export async function parseExcel(file: File): Promise<ParsedExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // Dynamically import xlsx to avoid bloating bundle
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets: ExcelSheet[] = [];
        
        // Parse each sheet
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length === 0) continue;
          
          const headers = jsonData[0].map(h => String(h || '').trim());
          const rows: Record<string, any>[] = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row: Record<string, any> = {};
            headers.forEach((header, index) => {
              row[header] = jsonData[i][index] || '';
            });
            rows.push(row);
          }
          
          sheets.push({ name: sheetName, headers, rows });
        }
        
        resolve({
          sheets,
          fileName: file.name,
          sheetCount: sheets.length,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get default value for a field
 */
export function getDefaultValue(field: VSMField, industry?: string): any {
  const defaults: Record<VSMField, any> = {
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
 * Detect missing critical fields
 */
export function detectMissingFields(mappedFields: Set<VSMField>): MissingFieldAnalysis {
  const critical: VSMField[] = [];
  const important: VSMField[] = [];
  const optional: VSMField[] = [];

  // Critical - cannot proceed without
  if (!mappedFields.has('processName')) critical.push('processName');
  if (!mappedFields.has('cycleTime')) critical.push('cycleTime');

  // Important - should have
  if (!mappedFields.has('changeoverTime')) important.push('changeoverTime');
  if (!mappedFields.has('uptime')) important.push('uptime');
  if (!mappedFields.has('inventory')) important.push('inventory');

  // Optional - nice to have
  if (!mappedFields.has('operators')) optional.push('operators');
  if (!mappedFields.has('shifts')) optional.push('shifts');
  if (!mappedFields.has('availableTime')) optional.push('availableTime');

  return { critical, important, optional };
}