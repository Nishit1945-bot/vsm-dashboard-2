// components/upload/ColumnMappingModal.tsx
'use client';

import { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { getFieldDisplayName } from '@/lib/field-helpers';

// Define types locally to avoid import issues
export interface ColumnMapping {
  csvColumn: string;
  vsmField: string | null;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'position' | 'none';
}

interface ColumnMappingModalProps {
  isOpen: boolean;
  mappings: ColumnMapping[];
  onConfirm: (updatedMappings: ColumnMapping[]) => void;
  onCancel: () => void;
}

export default function ColumnMappingModal({
  isOpen,
  mappings,
  onConfirm,
  onCancel,
}: ColumnMappingModalProps) {
  const [editedMappings, setEditedMappings] = useState<ColumnMapping[]>(mappings);

  if (!isOpen) return null;

  const handleFieldChange = (index: number, newField: string | null) => {
    const updated = [...editedMappings];
    updated[index] = {
      ...updated[index],
      vsmField: newField,
      confidence: newField ? 100 : 0,
      matchType: newField ? 'exact' : 'none',
    };
    setEditedMappings(updated);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return { bg: 'bg-green-100', text: 'text-green-600', icon: '✓' };
    if (confidence >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: '⚠' };
    if (confidence >= 30) return { bg: 'bg-orange-100', text: 'text-orange-600', icon: '?' };
    return { bg: 'bg-red-100', text: 'text-red-600', icon: '✗' };
  };

  const allVSMFields = [
    { value: '', label: '-- Skip this column --' },
    { value: 'processName', label: 'Process Name' },
    { value: 'cycleTime', label: 'Cycle Time (C/T)' },
    { value: 'changeoverTime', label: 'Changeover Time (C/O)' },
    { value: 'uptime', label: 'Uptime %' },
    { value: 'operators', label: 'Number of Operators' },
    { value: 'shifts', label: 'Shifts per Day' },
    { value: 'availableTime', label: 'Available Time (sec)' },
    { value: 'inventory', label: 'Inventory After Process' },
    { value: 'batchSize', label: 'Batch Size' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Column Mapping</h2>
            <p className="text-sm text-gray-600 mt-1">
              Verify that CSV columns are mapped correctly to VSM fields
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {editedMappings.map((mapping, index) => {
              const conf = getConfidenceColor(mapping.confidence);
              
              return (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${conf.bg} ${conf.text}`}>
                    <span className="text-sm font-bold">{conf.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {mapping.csvColumn}
                    </p>
                    <p className="text-xs text-gray-500">CSV Column</p>
                  </div>

                  <div className="text-gray-400">→</div>

                  <div className="flex-1">
                    <select
                      value={mapping.vsmField || ''}
                      onChange={(e) => handleFieldChange(index, e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      {allVSMFields.map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                    mapping.confidence >= 90 ? 'bg-green-100 text-green-700' :
                    mapping.confidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    mapping.confidence >= 30 ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {mapping.confidence}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Mapping Summary
            </h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>• High confidence: {editedMappings.filter(m => m.confidence >= 90).length} columns</p>
              <p>• Medium confidence: {editedMappings.filter(m => m.confidence >= 60 && m.confidence < 90).length} columns</p>
              <p>• Low/No match: {editedMappings.filter(m => m.confidence < 60).length} columns</p>
              <p>• Unmapped: {editedMappings.filter(m => !m.vsmField).length} columns</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(editedMappings)}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Mapping</span>
          </button>
        </div>
      </div>
    </div>
  );
}