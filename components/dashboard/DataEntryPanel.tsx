// components/dashboard/DataEntryPanel.tsx
'use client';

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
}: DataEntryPanelProps) {

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.log('File uploaded:', file.name);
    // TODO: CSV parsing will be implemented later
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
      inventoryAfter: ''
    };
    onProcessesChange([...processes, newProcess]);
  };

  const handleRemoveProcess = (id: number) => {
    onProcessesChange(processes.filter(p => p.id !== id));
  };

  const handleProcessChange = (id: number, field: keyof Process, value: string) => {
    onProcessesChange(processes.map(p => 
      p.id === id ? { ...p, [field]: value } : p
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
            <span className="text-sm font-medium text-gray-700">Upload</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

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