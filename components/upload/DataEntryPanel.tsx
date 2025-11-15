// components/dashboard/DataEntryPanel.tsx
'use client';

import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useCSVUpload } from '@/hooks/useCSVUpload';
import ColumnMappingModal from '@/components/upload/ColumnMappingModal';
import MissingDataPromptModal from '@/components/upload/MissingDataPromptModal';

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
}

export default function DataEntryPanel({ projectName }: DataEntryPanelProps) {
  const [taskName, setTaskName] = useState('');
  const [customerDemand, setCustomerDemand] = useState('');
  const [workingHours, setWorkingHours] = useState('8');
  const [breakTime, setBreakTime] = useState('30');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const {
    stage,
    columnMappings,
    missingFields,
    extractedProcesses,
    error,
    handleFileUpload,
    handleMappingConfirm,
    handleMissingDataComplete,
    handleUseDefaults,
    reset,
  } = useCSVUpload();

  // Handle file input change
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadSuccess(false);
    await handleFileUpload(file);
  };

  // When upload completes successfully
  const onUploadComplete = () => {
    // Convert extracted processes to form format
    const formProcesses: Process[] = extractedProcesses.map((proc, index) => ({
      id: Date.now() + index,
      name: proc.processName || '',
      cycleTime: proc.cycleTime?.toString() || '',
      changeoverTime: proc.changeoverTime?.toString() || '',
      uptime: proc.uptime?.toString() || '',
      operators: proc.operators?.toString() || '1',
      shifts: proc.shifts?.toString() || '2',
      availableTime: proc.availableTime?.toString() || '27000',
      inventoryAfter: proc.inventory?.toString() || '',
      isAutoFilled: proc.processName_isDefault || false,
    }));

    setProcesses(formProcesses);
    setUploadSuccess(true);
    reset();
  };

  // Check if upload is complete
  if (stage === 'complete' && !uploadSuccess) {
    onUploadComplete();
  }

  const handleAddProcess = () => {
    setProcesses([...processes, {
      id: Date.now(),
      name: '',
      cycleTime: '',
      changeoverTime: '',
      uptime: '',
      operators: '1',
      shifts: '2',
      availableTime: '27000',
      inventoryAfter: '',
    }]);
  };

  const handleRemoveProcess = (id: number) => {
    setProcesses(processes.filter(p => p.id !== id));
  };

  const handleProcessChange = (id: number, field: keyof Process, value: string) => {
    setProcesses(processes.map(p => 
      p.id === id ? { ...p, [field]: value, isAutoFilled: false } : p
    ));
  };

  return (
    <>
      <div className="h-full overflow-y-auto bg-white border-l">
        <div className="p-6">
          {/* Header with Upload */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">VSM Data Entry</h2>
            <label className="cursor-pointer flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Upload className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Upload</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload Status */}
          {stage === 'parsing' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              <span className="text-sm text-blue-800">Parsing file...</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">
                Data imported successfully! {processes.length} processes loaded.
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Upload Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button onClick={reset} className="text-red-600 hover:text-red-800">
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
              onChange={(e) => setTaskName(e.target.value)}
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
              onChange={(e) => setCustomerDemand(e.target.value)}
              placeholder="e.g., 480"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
            />
          </div>

          {/* Working Schedule */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Working Schedule</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Hours/Shift
                </label>
                <input
                  type="number"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Break (min)
                </label>
                <input
                  type="number"
                  value={breakTime}
                  onChange={(e) => setBreakTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Process Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Process Steps</h3>
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
                <p className="text-sm text-gray-500 mb-1">
                  No processes yet
                </p>
                <p className="text-xs text-gray-400">
                  Upload CSV/Excel or click "+ Add Process"
                </p>
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
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            Auto-filled
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveProcess(process.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={process.name}
                        onChange={(e) => handleProcessChange(process.id, 'name', e.target.value)}
                        placeholder="Process name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={process.cycleTime}
                          onChange={(e) => handleProcessChange(process.id, 'cycleTime', e.target.value)}
                          placeholder="C/T (sec)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          value={process.changeoverTime}
                          onChange={(e) => handleProcessChange(process.id, 'changeoverTime', e.target.value)}
                          placeholder="C/O (min)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={process.uptime}
                          onChange={(e) => handleProcessChange(process.id, 'uptime', e.target.value)}
                          placeholder="Uptime %"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          value={process.operators}
                          onChange={(e) => handleProcessChange(process.id, 'operators', e.target.value)}
                          placeholder="Operators"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <input
                        type="number"
                        value={process.inventoryAfter}
                        onChange={(e) => handleProcessChange(process.id, 'inventoryAfter', e.target.value)}
                        placeholder="Inventory after (pieces)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button 
            className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            disabled={!taskName || !customerDemand || processes.length === 0}
          >
            Generate VSM Preview
          </button>
        </div>
      </div>

      {/* Modals */}
      <ColumnMappingModal
        isOpen={stage === 'mapping'}
        mappings={columnMappings}
        onConfirm={handleMappingConfirm}
        onCancel={reset}
      />

      <MissingDataPromptModal
        isOpen={stage === 'missing-data'}
        missingFields={
          missingFields?.critical.map((field, idx) => ({
            processIndex: idx,
            processName: extractedProcesses[idx]?.processName || `Process ${idx + 1}`,
            field: field,
            fieldLabel: getFieldDisplayName(field),
            isRequired: true,
          })) || []
        }
        onComplete={handleMissingDataComplete}
        onSkipAndUseDefaults={handleUseDefaults}
        onCancel={reset}
      />
    </>
  );
}