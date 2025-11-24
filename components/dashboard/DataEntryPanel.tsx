// components/dashboard/DataEntryPanel.tsx
'use client';

import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

interface Process {
  id: number;
  name: string;
  cycleTime: string;
  changeoverTime: string;
  uptime: string;
  operators: string;
  shifts: string;
  availableTime: string;
  inventoryAfter: string;
  isAutoFilled?: boolean;
}

interface DataEntryPanelProps {
  projectName: string;
  taskName: string;
  customerDemand: string;
  workingHours: string;
  breakTime: string;
  processes: Process[];
  onTaskNameChange: (value: string) => void;
  onCustomerDemandChange: (value: string) => void;
  onWorkingHoursChange: (value: string) => void;
  onBreakTimeChange: (value: string) => void;
  onProcessesChange: (processes: Process[]) => void;
  onCsvDataChange?: (data: any[], dataType: string) => void;
  onDatasetUploaded?: (datasetType: string) => void;
}

export default function DataEntryPanel({
  projectName,
  taskName,
  customerDemand,
  workingHours,
  breakTime,
  processes,
  onTaskNameChange,
  onCustomerDemandChange,
  onWorkingHoursChange,
  onBreakTimeChange,
  onProcessesChange,
  onCsvDataChange,
  onDatasetUploaded,
}: DataEntryPanelProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const detectDataType = (headers: string[]): string => {
    // Detect dataset type based on column headers
    if (headers.includes('FaultDuration') || headers.includes('Fault Duration')) return 'fault';
    if (headers.includes('UnblockingTable')) return 'performance';
    if (headers.includes('FaultyCount') || headers.includes('Faulty Count')) return 'quality';
    if (headers.includes('H00_00_00')) return 'production';
    return 'process';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus('loading');
      setUploadMessage('Parsing file...');
      
      console.log('📂 Reading file:', file.name);
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV is empty or has no data rows');
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      console.log('📋 Headers found:', headers);

      // Detect data type
      const dataType = detectDataType(headers);
      console.log('🔍 Detected data type:', dataType);

      // Parse all data rows for AI-Analytics
      const allData: any[] = [];
      const newProcesses: Process[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
        
        // Skip empty rows
        if (values.every(v => !v)) continue;
        
        // Create row object
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });

        allData.push(row);
        console.log(`Row ${i}:`, row);

        // Map to Process for VSM (only if it's process data)
        if (dataType === 'process') {
          const process: Process = {
            id: Date.now() + i + Math.random(),
            name: row['Process Step'] || row['Process Name'] || row['Process'] || row['Step'] || row['Operation'] || `Process ${i}`,
            cycleTime: row['Cycle Time (min)'] || row['Cycle Time'] || row['CT'] || row['C/T'] || row['CycleTime'] || '',
            changeoverTime: row['Changeover Time (min)'] || row['Changeover Time'] || row['Changeover'] || row['Setup Time'] || row['C/O'] || row['CO'] || '',
            uptime: row['Uptime %'] || row['Uptime'] || row['Availability'] || row['Available %'] || '',
            operators: row['Operators'] || row['Number of Operators'] || row['Workers'] || row['People'] || '1',
            shifts: row['Shifts'] || row['Number of Shifts'] || '2',
            availableTime: row['Available Time'] || row['Available Time (sec)'] || ((parseInt(workingHours) * 60 - parseInt(breakTime)) * 60).toString(),
            inventoryAfter: row['WIP Inventory'] || row['Inventory'] || row['Stock'] || row['Quantity'] || row['WIP'] || '',
            isAutoFilled: true
          };
          
          newProcesses.push(process);
          console.log(`✅ Process ${i} mapped:`, process);
        }
      }

      console.log('🎉 Total data rows:', allData.length);
      console.log('📊 Full dataset:', allData);
      
      // Pass raw CSV data to AI-Analytics
      if (onCsvDataChange) {
        onCsvDataChange(allData, dataType);
        console.log('📤 Data passed to AI-Analytics');
      }

      // Pass dataset type notification
      if (onDatasetUploaded) {
        onDatasetUploaded(dataType);
        console.log('🔔 Dataset type notification sent:', dataType);
      }

      // Update processes for VSM (only if process data)
      if (dataType === 'process' && newProcesses.length > 0) {
        onProcessesChange(newProcesses);
        console.log('✅ Processes updated for VSM');
      }
      
      // Success feedback
      setUploadStatus('success');
      const message = dataType === 'process' 
        ? `Successfully loaded ${newProcesses.length} processes from ${file.name}`
        : `Successfully loaded ${allData.length} ${dataType} records from ${file.name}`;
      setUploadMessage(message);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);
      
      // Reset file input
      event.target.value = '';

    } catch (error: any) {
      console.error('❌ CSV parsing error:', error);
      setUploadStatus('error');
      setUploadMessage(error.message || 'Failed to parse CSV file. Please check the format.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);
    }
  };

  const handleAddProcess = () => {
    const newProcess: Process = {
      id: Date.now(),
      name: '',
      cycleTime: '',
      changeoverTime: '',
      uptime: '',
      operators: '1',
      shifts: '2',
      availableTime: '27000',
      inventoryAfter: '',
      isAutoFilled: false
    };
    onProcessesChange([...processes, newProcess]);
  };

  const handleRemoveProcess = (id: number) => {
    onProcessesChange(processes.filter(p => p.id !== id));
  };

  const handleProcessChange = (id: number, field: keyof Process, value: string) => {
    onProcessesChange(processes.map(p => 
      p.id === id ? { ...p, [field]: value, isAutoFilled: false } : p
    ));
  };

  const availableTimeCalc = ((parseInt(workingHours) || 8) * 60 - (parseInt(breakTime) || 30)) * 60;

  return (
    <div className="h-full overflow-y-auto bg-white border-l">
      <div className="p-6">
        {/* Header with Upload */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">VSM Data Entry</h2>
          <label className="cursor-pointer flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Upload className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">Upload CSV</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Upload Status Messages */}
        {uploadStatus === 'loading' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <span className="text-sm text-blue-800">{uploadMessage}</span>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">{uploadMessage}</span>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Upload Error</p>
              <p className="text-sm text-red-700 mt-1">{uploadMessage}</p>
            </div>
            <button 
              onClick={() => {
                setUploadStatus('idle');
                setUploadMessage('');
              }} 
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Task Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => onTaskNameChange(e.target.value)}
            placeholder="e.g., Assembly Line VSM 2024"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
          />
        </div>

        {/* Customer Demand */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Demand (units/day) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={customerDemand}
            onChange={(e) => onCustomerDemandChange(e.target.value)}
            placeholder="e.g., 480"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
          />
          {customerDemand && availableTimeCalc && (
            <p className="text-xs text-gray-500 mt-1">
              Takt time: {(availableTimeCalc / parseInt(customerDemand)).toFixed(1)} seconds/unit
            </p>
          )}
        </div>

        {/* Working Schedule */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Working Schedule</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Hours/Shift
              </label>
              <input
                type="number"
                value={workingHours}
                onChange={(e) => onWorkingHoursChange(e.target.value)}
                placeholder="8"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Break (min)
              </label>
              <input
                type="number"
                value={breakTime}
                onChange={(e) => onBreakTimeChange(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Available time: {availableTimeCalc.toLocaleString()} seconds/shift
          </p>
        </div>

        {/* Process Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Process Steps ({processes.length})
            </h3>
            <button
              onClick={handleAddProcess}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              + Add Process
            </button>
          </div>

          {processes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-1">No processes yet</p>
              <p className="text-xs text-gray-400">Upload CSV or click "+ Add Process"</p>
            </div>
          ) : (
            <div className="space-y-4">
              {processes.map((process, index) => (
                <div key={process.id} className={`p-4 border rounded-lg ${
                  process.isAutoFilled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        Process {String.fromCharCode(65 + index)}
                      </h4>
                      {process.isAutoFilled && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                          Auto-filled
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveProcess(process.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={process.name}
                      onChange={(e) => handleProcessChange(process.id, 'name', e.target.value)}
                      placeholder="Process name (e.g., Stamping)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">C/T (sec)</label>
                        <input
                          type="number"
                          value={process.cycleTime}
                          onChange={(e) => handleProcessChange(process.id, 'cycleTime', e.target.value)}
                          placeholder="300"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">C/O (min)</label>
                        <input
                          type="number"
                          value={process.changeoverTime}
                          onChange={(e) => handleProcessChange(process.id, 'changeoverTime', e.target.value)}
                          placeholder="60"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Uptime %</label>
                        <input
                          type="number"
                          value={process.uptime}
                          onChange={(e) => handleProcessChange(process.id, 'uptime', e.target.value)}
                          placeholder="85"
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Operators</label>
                        <input
                          type="number"
                          value={process.operators}
                          onChange={(e) => handleProcessChange(process.id, 'operators', e.target.value)}
                          placeholder="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Inventory After (pieces)</label>
                      <input
                        type="number"
                        value={process.inventoryAfter}
                        onChange={(e) => handleProcessChange(process.id, 'inventoryAfter', e.target.value)}
                        placeholder="1200"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {customerDemand && process.inventoryAfter && parseInt(process.inventoryAfter) > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          ≈ {(parseInt(process.inventoryAfter) / parseInt(customerDemand)).toFixed(1)} days
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button 
          className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!taskName || !customerDemand || processes.length === 0}
        >
          Generate VSM Preview
        </button>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">Required fields:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Task Name</li>
            <li>• Customer Demand</li>
            <li>• At least one Process with C/T, C/O, Uptime</li>
          </ul>
        </div>
      </div>
    </div>
  );
}