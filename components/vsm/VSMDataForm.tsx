// components/dashboard/DataEntryPanel.tsx
'use client';

import { useState } from 'react';
import { Upload, X, Edit2, Save, XCircle, Plus, Trash2 } from 'lucide-react';

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
  onSaveData?: () => void;
  onProcessData?: () => void;
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
  onSaveData,
  onProcessData,
}: DataEntryPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState({
    taskName,
    customerDemand,
    workingHours,
    breakTime,
    processes: [...processes]
  });

  // Enter edit mode
  const handleEditToggle = () => {
    if (!isEditing) {
      // Save current state to temp
      setTempData({
        taskName,
        customerDemand,
        workingHours,
        breakTime,
        processes: JSON.parse(JSON.stringify(processes))
      });
    }
    setIsEditing(!isEditing);
  };

  // Save changes
  const handleSave = () => {
    onTaskNameChange(tempData.taskName);
    onCustomerDemandChange(tempData.customerDemand);
    onWorkingHoursChange(tempData.workingHours);
    onBreakTimeChange(tempData.breakTime);
    onProcessesChange(tempData.processes);
    
    if (onSaveData) {
      onSaveData();
    }
    
    setIsEditing(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setTempData({
      taskName,
      customerDemand,
      workingHours,
      breakTime,
      processes: [...processes]
    });
    setIsEditing(false);
  };

  // Process data
  const handleProcessData = () => {
    if (isEditing) {
      handleSave();
    }
    if (onProcessData) {
      onProcessData();
    }
  };

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
    
    if (isEditing) {
      setTempData(prev => ({
        ...prev,
        processes: [...prev.processes, newProcess]
      }));
    } else {
      onProcessesChange([...processes, newProcess]);
    }
  };

  const handleRemoveProcess = (id: number) => {
    if (isEditing) {
      setTempData(prev => ({
        ...prev,
        processes: prev.processes.filter(p => p.id !== id)
      }));
    } else {
      onProcessesChange(processes.filter(p => p.id !== id));
    }
  };

  const handleProcessChange = (id: number, field: keyof Process, value: string) => {
    if (isEditing) {
      setTempData(prev => ({
        ...prev,
        processes: prev.processes.map(p => 
          p.id === id ? { ...p, [field]: value, isAutoFilled: false } : p
        )
      }));
    } else {
      onProcessesChange(processes.map(p => 
        p.id === id ? { ...p, [field]: value, isAutoFilled: false } : p
      ));
    }
  };

  // Use temp data if editing, otherwise use props
  const displayData = isEditing ? tempData : {
    taskName,
    customerDemand,
    workingHours,
    breakTime,
    processes
  };

  const availableTimeCalc = ((parseInt(displayData.workingHours) || 8) * 60 - (parseInt(displayData.breakTime) || 30)) * 60;
  const isDisabled = !isEditing;

  return (
    <div className="h-full overflow-y-auto bg-white border-l">
      <div className="p-6">
        {/* Header with Edit/Process buttons */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">VSM Data Entry</h2>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleProcessData}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Process Data
                </button>
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <Upload className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">Upload</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit Mode Banner */}
        {isEditing && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Edit Mode:</strong> Make your changes and click "Save" to persist them.
            </p>
          </div>
        )}

        {/* Task Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={displayData.taskName}
            onChange={(e) => {
              if (isEditing) {
                setTempData(prev => ({ ...prev, taskName: e.target.value }));
              } else {
                onTaskNameChange(e.target.value);
              }
            }}
            placeholder="e.g., Assembly Line VSM 2024"
            disabled={isDisabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm ${
              isDisabled ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
          />
        </div>

        {/* Customer Demand */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Demand (units/day) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={displayData.customerDemand}
            onChange={(e) => {
              if (isEditing) {
                setTempData(prev => ({ ...prev, customerDemand: e.target.value }));
              } else {
                onCustomerDemandChange(e.target.value);
              }
            }}
            placeholder="e.g., 480"
            disabled={isDisabled}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm ${
              isDisabled ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
          />
          {displayData.customerDemand && availableTimeCalc && (
            <p className="text-xs text-gray-500 mt-1">
              Takt time: {(availableTimeCalc / parseInt(displayData.customerDemand)).toFixed(1)} seconds/unit
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
                value={displayData.workingHours}
                onChange={(e) => {
                  if (isEditing) {
                    setTempData(prev => ({ ...prev, workingHours: e.target.value }));
                  } else {
                    onWorkingHoursChange(e.target.value);
                  }
                }}
                placeholder="8"
                disabled={isDisabled}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                  isDisabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Break (min)
              </label>
              <input
                type="number"
                value={displayData.breakTime}
                onChange={(e) => {
                  if (isEditing) {
                    setTempData(prev => ({ ...prev, breakTime: e.target.value }));
                  } else {
                    onBreakTimeChange(e.target.value);
                  }
                }}
                placeholder="30"
                disabled={isDisabled}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                  isDisabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                }`}
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
              Process Steps ({displayData.processes.length})
            </h3>
            <button
              onClick={handleAddProcess}
              disabled={isDisabled}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                isEditing
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Process
            </button>
          </div>

          {displayData.processes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-1">No processes yet</p>
              <p className="text-xs text-gray-400">
                {isEditing ? 'Click "+ Add Process" to start' : 'Click "Edit" to add processes'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayData.processes.map((process, index) => (
                <div key={process.id} className={`p-4 border rounded-lg transition-colors ${
                  isEditing 
                    ? 'border-blue-200 bg-blue-50/30' 
                    : process.isAutoFilled 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
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
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveProcess(process.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={process.name}
                      onChange={(e) => handleProcessChange(process.id, 'name', e.target.value)}
                      placeholder="Process name (e.g., Stamping)"
                      disabled={isDisabled}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                        isDisabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                      }`}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">C/T (sec)</label>
                        <input
                          type="number"
                          value={process.cycleTime}
                          onChange={(e) => handleProcessChange(process.id, 'cycleTime', e.target.value)}
                          placeholder="300"
                          disabled={isDisabled}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                            isDisabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">C/O (min)</label>
                        <input
                          type="number"
                          value={process.changeoverTime}
                          onChange={(e) => handleProcessChange(process.id, 'changeoverTime', e.target.value)}
                          placeholder="60"
                          disabled={isDisabled}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                            isDisabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
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
                          disabled={isDisabled}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                            isDisabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Operators</label>
                        <input
                          type="number"
                          value={process.operators}
                          onChange={(e) => handleProcessChange(process.id, 'operators', e.target.value)}
                          placeholder="1"
                          disabled={isDisabled}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                            isDisabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                          }`}
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
                        disabled={isDisabled}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                          isDisabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                        }`}
                      />
                      {displayData.customerDemand && process.inventoryAfter && parseInt(process.inventoryAfter) > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          ≈ {(parseInt(process.inventoryAfter) / parseInt(displayData.customerDemand)).toFixed(1)} days
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
          disabled={!displayData.taskName || !displayData.customerDemand || displayData.processes.length === 0}
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