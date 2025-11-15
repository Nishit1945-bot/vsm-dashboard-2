// hooks/useCSVUpload.ts
import { useState } from 'react';
import { parseCSV, parseExcel, ParsedCSVData, VSMField, getDefaultValue, detectMissingFields, MissingFieldAnalysis } from '@/lib/csv-parser';
import { mapColumns, ColumnMapping } from '@/lib/column-mapper';

export type UploadStage = 
  | 'idle'
  | 'parsing'
  | 'mapping'
  | 'missing-data'
  | 'complete'
  | 'error';

export function useCSVUpload() {
  const [stage, setStage] = useState<UploadStage>('idle');
  const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [missingFields, setMissingFields] = useState<MissingFieldAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedProcesses, setExtractedProcesses] = useState<any[]>([]);

  const handleFileUpload = async (file: File) => {
    try {
      setStage('parsing');
      setError(null);

      let data: ParsedCSVData;

      if (file.name.endsWith('.csv')) {
        data = await parseCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const excelData = await parseExcel(file);
        if (excelData.sheets.length === 0) {
          throw new Error('No sheets found in Excel file');
        }
        data = {
          headers: excelData.sheets[0].headers,
          rows: excelData.sheets[0].rows,
          fileName: file.name,
          rowCount: excelData.sheets[0].rows.length,
        };
      } else {
        throw new Error('Unsupported file type');
      }

      setParsedData(data);

      const mappings = mapColumns(data.headers);
      setColumnMappings(mappings);

      //const highConfidence = mappings.filter(m => m.confidence >= 90);
      
      //if (highConfidence.length === mappings.length) {
      //  await processData(mappings, data);
     // } else {
       // setStage('mapping');
      //}

    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
      setStage('error');
    }
  };

  const handleMappingConfirm = async (confirmedMappings: ColumnMapping[]) => {
    setColumnMappings(confirmedMappings);
    await processData(confirmedMappings, parsedData!);
  };

  const processData = async (mappings: ColumnMapping[], data: ParsedCSVData) => {
    try {
      const processes: any[] = [];

      for (const row of data.rows) {
        const process: any = {};

        mappings.forEach(mapping => {
          if (mapping.vsmField) {
            process[mapping.vsmField] = row[mapping.csvColumn];
          }
        });

        if (process.processName || process.cycleTime) {
          processes.push(process);
        }
      }

      setExtractedProcesses(processes);

      // Phase 5: Detect missing critical data
      // FIX: Convert mappings to Set<VSMField>
      const mappedFields = new Set<VSMField>(
        mappings
          .filter(m => m.vsmField !== null)
          .map(m => m.vsmField as VSMField)
      );
      
      const missing = detectMissingFields(mappedFields);
      setMissingFields(missing);

      //if (missing.critical.length > 0) {
        //setStage('missing-data');
      //} else {
        //applyDefaults(processes, missing);
        //setStage('complete');

    } catch (err: any) {
      setError(err.message || 'Failed to process data');
      setStage('error');
    }
  };

  const handleMissingDataComplete = (providedData: Record<string, any>) => {
    const updatedProcesses = extractedProcesses.map((process, index) => {
      const processKey = `process_${index}`;
      const provided = providedData[processKey] || {};
      
      return { ...process, ...provided };
    });

    applyDefaults(updatedProcesses, missingFields!);
    setExtractedProcesses(updatedProcesses);
    setStage('complete');
  };

  const handleUseDefaults = () => {
    applyDefaults(extractedProcesses, missingFields!);
    setStage('complete');
  };

  const applyDefaults = (processes: any[], missing: MissingFieldAnalysis) => {
    const allMissing = [...missing.important, ...missing.optional];

    processes.forEach(process => {
      allMissing.forEach(field => {
        if (!process[field] || process[field] === '') {
          process[field] = getDefaultValue(field);
          process[`${field}_isDefault`] = true;
        }
      });
    });

    setExtractedProcesses(processes);
  };

  const reset = () => {
    setStage('idle');
    setParsedData(null);
    setColumnMappings([]);
    setMissingFields(null);
    setError(null);
    setExtractedProcesses([]);
  };

  return {
    stage,
    parsedData,
    columnMappings,
    missingFields,
    extractedProcesses,
    error,
    handleFileUpload,
    handleMappingConfirm,
    handleMissingDataComplete,
    handleUseDefaults,
    reset,
  };
}