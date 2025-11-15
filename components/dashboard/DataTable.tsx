// components/dashboard/DataTable.tsx
'use client';

import { Download, Edit2, Save, X } from 'lucide-react';
import { useState } from 'react';

interface Process {
  id: number;
  name: string;
  cycleTime: string;
  changeoverTime: string;
  uptime: string;
  operators: string;
  inventoryAfter: string;
}

interface DataTableProps {
  projectName: string;
  taskName: string;
  customerDemand: string;
  processes: Process[];
  workingHours: string;
  breakTime: string;
  onUpdateProcess: (id: number, field: keyof Process, value: string) => void;
  onRemoveProcess: (id: number) => void;
}

export default function DataTable({
  projectName,
  taskName,
  customerDemand,
  processes,
  workingHours,
  breakTime,
  onUpdateProcess,
  onRemoveProcess,
}: DataTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<Process>>({});

  const availableTime = ((parseInt(workingHours) || 8) * 60 - (parseInt(breakTime) || 30)) * 60;
  const taktTime = customerDemand ? (availableTime / parseInt(customerDemand)) : 0;

  const totalCycleTime = processes.reduce((sum, p) => sum + (parseFloat(p.cycleTime) || 0), 0);
  const totalInventory = processes.reduce((sum, p) => sum + (parseFloat(p.inventoryAfter) || 0), 0);
  const inventoryDays = customerDemand && totalInventory > 0 ? (totalInventory / parseInt(customerDemand)) : 0;
  const vaRatio = inventoryDays > 0 ? ((totalCycleTime / (inventoryDays * 86400)) * 100) : 0;

  const handleEditClick = (process: Process) => {
    setEditingId(process.id);
    setEditValues(process);
  };

  const handleSave = (id: number) => {
    Object.entries(editValues).forEach(([field, value]) => {
      if (value !== undefined) {
        onUpdateProcess(id, field as keyof Process, value as string);
      }
    });
    setEditingId(null);
    setEditValues({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const exportToPDF = () => {
    window.print();
  };

  const exportToExcel = () => {
    const headers = ['Process', 'C/T (sec)', 'C/O (min)', 'Uptime %', 'Operators', 'Inventory', 'Days', 'Status'];
    const rows = processes.map((p, i) => {
      const ct = parseFloat(p.cycleTime) || 0;
      const isBottleneck = ct > taktTime && taktTime > 0;
      const invDays = customerDemand && p.inventoryAfter 
        ? (parseFloat(p.inventoryAfter) / parseInt(customerDemand)).toFixed(1)
        : '-';
      
      return [
        String.fromCharCode(65 + i),
        p.name,
        p.cycleTime,
        p.changeoverTime,
        p.uptime,
        p.operators,
        p.inventoryAfter,
        invDays,
        isBottleneck ? 'Bottleneck' : 'OK'
      ];
    });

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${taskName || 'vsm-data'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header with Export */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{taskName || projectName}</h1>
            <p className="text-gray-600">Process Data Overview</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToExcel}
              disabled={processes.length === 0}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              disabled={processes.length === 0}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Customer Demand</p>
            <p className="text-2xl font-bold text-gray-900">{customerDemand || '-'}</p>
            <p className="text-xs text-gray-500 mt-1">units/day</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Takt Time</p>
            <p className="text-2xl font-bold text-gray-900">{taktTime > 0 ? taktTime.toFixed(1) : '-'}</p>
            <p className="text-xs text-gray-500 mt-1">seconds/unit</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Processes</p>
            <p className="text-2xl font-bold text-gray-900">{processes.length}</p>
            <p className="text-xs text-gray-500 mt-1">steps</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Inventory</p>
            <p className="text-2xl font-bold text-gray-900">{inventoryDays > 0 ? inventoryDays.toFixed(1) : '-'}</p>
            <p className="text-xs text-gray-500 mt-1">days</p>
          </div>
        </div>

        {/* Process Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Process Details</h2>
          </div>

          {processes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No process data available yet</p>
              <p className="text-sm text-gray-400 mt-2">Add processes in the Chat tab form to see data here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Process</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">C/T (sec)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">C/O (min)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uptime %</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operators</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inventory</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processes.map((process, index) => {
                    const ct = parseFloat(process.cycleTime) || 0;
                    const isBottleneck = ct > taktTime && taktTime > 0;
                    const invDays = customerDemand && process.inventoryAfter 
                      ? (parseFloat(process.inventoryAfter) / parseInt(customerDemand)).toFixed(1)
                      : '-';
                    
                    const isEditing = editingId === process.id;

                    return (
                      <tr key={process.id} className={isBottleneck ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {String.fromCharCode(65 + index)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.name ?? process.name}
                              onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            process.name || '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.cycleTime ?? process.cycleTime}
                              onChange={(e) => setEditValues({...editValues, cycleTime: e.target.value})}
                              className="w-20 px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            process.cycleTime || '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.changeoverTime ?? process.changeoverTime}
                              onChange={(e) => setEditValues({...editValues, changeoverTime: e.target.value})}
                              className="w-20 px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            process.changeoverTime || '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.uptime ?? process.uptime}
                              onChange={(e) => setEditValues({...editValues, uptime: e.target.value})}
                              className="w-16 px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            process.uptime ? `${process.uptime}%` : '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.operators ?? process.operators}
                              onChange={(e) => setEditValues({...editValues, operators: e.target.value})}
                              className="w-16 px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            process.operators || '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.inventoryAfter ?? process.inventoryAfter}
                              onChange={(e) => setEditValues({...editValues, inventoryAfter: e.target.value})}
                              className="w-20 px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            process.inventoryAfter || '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{invDays}</td>
                        <td className="px-4 py-3">
                          {isBottleneck ? (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                              Bottleneck
                            </span>
                          ) : ct > 0 ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                              OK
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                              No data
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleSave(process.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditClick(process)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Metrics Summary */}
        {processes.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">VSM Metrics</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Cycle Time</p>
                <p className="text-xl font-bold text-gray-900">{totalCycleTime.toFixed(1)}s</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Lead Time</p>
                <p className="text-xl font-bold text-gray-900">{inventoryDays.toFixed(2)} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Value-Added Ratio</p>
                <p className="text-xl font-bold text-gray-900">{vaRatio.toFixed(3)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}