// components/dashboard/DataTable.tsx
'use client';

import { useState } from 'react';
import { Edit2, Save, X, Download, Plus, Trash2 } from 'lucide-react';

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

interface DataTableProps {
  projectName: string;
  taskName: string;
  customerDemand: string;
  workingHours: string;
  breakTime: string;
  processes: Process[];
  onUpdateProcess: (id: number, field: keyof Process, value: string) => void;
  onRemoveProcess: (id: number) => void;
}

export default function DataTable({
  projectName,
  taskName,
  customerDemand,
  workingHours,
  breakTime,
  processes,
  onUpdateProcess,
  onRemoveProcess,
}: DataTableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempProcesses, setTempProcesses] = useState<Process[]>([]);

  // Calculate metrics
  const availableTime = ((parseInt(workingHours) || 8) * 60 - (parseInt(breakTime) || 30)) * 60;
  const taktTime = customerDemand ? (availableTime / parseInt(customerDemand)).toFixed(1) : '0';
  
  const totalCycleTime = processes.reduce((sum, p) => sum + (parseFloat(p.cycleTime) || 0), 0);
  const totalInventoryDays = processes.reduce((sum, p) => {
    if (p.inventoryAfter && customerDemand) {
      return sum + (parseInt(p.inventoryAfter) / parseInt(customerDemand));
    }
    return sum;
  }, 0);

  // Edit mode handlers
  const handleEditToggle = () => {
    if (!isEditing) {
      setTempProcesses(JSON.parse(JSON.stringify(processes)));
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    tempProcesses.forEach(tempProcess => {
      const originalProcess = processes.find(p => p.id === tempProcess.id);
      if (originalProcess) {
        // Update existing process
        Object.keys(tempProcess).forEach(key => {
          if (tempProcess[key as keyof Process] !== originalProcess[key as keyof Process]) {
            onUpdateProcess(tempProcess.id, key as keyof Process, tempProcess[key as keyof Process] as string);
          }
        });
      }
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempProcesses([]);
    setIsEditing(false);
  };

  const handleTempProcessChange = (id: number, field: keyof Process, value: string) => {
    setTempProcesses(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
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
    setTempProcesses(prev => [...prev, newProcess]);
  };

  const handleRemoveTempProcess = (id: number) => {
    setTempProcesses(prev => prev.filter(p => p.id !== id));
    onRemoveProcess(id);
  };

  const handleProcessData = () => {
    if (isEditing) {
      handleSave();
    }
    alert('Processing VSM data...\nCalculating metrics and updating analytics.');
  };

  // Export functions
  const exportToExcel = () => {
    const headers = ['Process', 'Name', 'C/T (sec)', 'C/O (min)', 'Uptime %', 'Operators', 'Inventory', 'Days'];
    const rows = processes.map((p, idx) => [
      String.fromCharCode(65 + idx),
      p.name || '',
      p.cycleTime || '',
      p.changeoverTime || '',
      p.uptime || '',
      p.operators || '',
      p.inventoryAfter || '',
      customerDemand && p.inventoryAfter ? (parseInt(p.inventoryAfter) / parseInt(customerDemand)).toFixed(1) : ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${taskName || 'vsm-data'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    window.print();
  };

  const displayProcesses = isEditing ? tempProcesses : processes;

  if (!processes || processes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Add processes in the Chat tab to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {taskName || 'Process Data Overview'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">View and edit your VSM process data</p>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleEditToggle}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit Data
              </button>
              <button
                onClick={handleProcessData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Process Data
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
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
            <strong>Edit Mode:</strong> Make your changes and click "Save Changes" to persist them.
          </p>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="text-sm text-gray-600 block mb-1">Customer Demand</label>
          <div className="text-2xl font-bold text-gray-900">
            {customerDemand || '-'}
          </div>
          <span className="text-xs text-gray-500">units/day</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <label className="text-sm text-gray-600 block mb-1">Takt Time</label>
          <div className="text-2xl font-bold text-gray-900">
            {taktTime}
          </div>
          <span className="text-xs text-gray-500">seconds/unit</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <label className="text-sm text-gray-600 block mb-1">Total Processes</label>
          <div className="text-2xl font-bold text-gray-900">
            {processes.length}
          </div>
          <span className="text-xs text-gray-500">steps</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <label className="text-sm text-gray-600 block mb-1">Total Inventory</label>
          <div className="text-2xl font-bold text-gray-900">
            {totalInventoryDays > 0 ? totalInventoryDays.toFixed(1) : '-'}
          </div>
          <span className="text-xs text-gray-500">days</span>
        </div>
      </div>

      {/* Process Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Process Details</h3>
          {isEditing && (
            <button
              onClick={handleAddProcess}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Process
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">C/T (sec)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">C/O (min)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operators</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                {isEditing && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayProcesses.map((process, index) => {
                const inventoryDays = customerDemand && process.inventoryAfter
                  ? (parseInt(process.inventoryAfter) / parseInt(customerDemand)).toFixed(1)
                  : '-';

                return (
                  <tr key={process.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {String.fromCharCode(65 + index)}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={process.name}
                          onChange={(e) => handleTempProcessChange(process.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Process name"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{process.name || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={process.cycleTime}
                          onChange={(e) => handleTempProcessChange(process.id, 'cycleTime', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{process.cycleTime || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={process.changeoverTime}
                          onChange={(e) => handleTempProcessChange(process.id, 'changeoverTime', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{process.changeoverTime || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={process.uptime}
                          onChange={(e) => handleTempProcessChange(process.id, 'uptime', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{process.uptime || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={process.operators}
                          onChange={(e) => handleTempProcessChange(process.id, 'operators', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="1"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{process.operators || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={process.inventoryAfter}
                          onChange={(e) => handleTempProcessChange(process.id, 'inventoryAfter', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{process.inventoryAfter || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{inventoryDays}</span>
                    </td>
                    {isEditing && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveTempProcess(process.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete process"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VSM Metrics */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">VSM Metrics</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Total Cycle Time</label>
            <div className="text-2xl font-bold text-gray-900">
              {totalCycleTime > 0 ? `${totalCycleTime.toFixed(1)}s` : '-'}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Total Lead Time</label>
            <div className="text-2xl font-bold text-gray-900">
              {totalInventoryDays > 0 ? `${totalInventoryDays.toFixed(2)} days` : '-'}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Value-Added Ratio</label>
            <div className="text-2xl font-bold text-gray-900">
              {totalInventoryDays > 0 && totalCycleTime > 0
                ? `${((totalCycleTime / (totalInventoryDays * 86400)) * 100).toFixed(3)}%`
                : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}