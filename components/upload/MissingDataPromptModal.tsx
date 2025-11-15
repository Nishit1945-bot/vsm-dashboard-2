// components/upload/MissingDataPromptModal.tsx
'use client';
import { getFieldDisplayName, getFieldDescription } from '@/lib/field-helpers';
import { useState } from 'react';
import { X, AlertCircle, ArrowRight } from 'lucide-react';

interface MissingFieldInfo {
  processIndex: number;
  processName: string;
  field: string;
  fieldLabel: string;
  defaultValue?: string;
  isRequired: boolean;
}

interface MissingDataPromptModalProps {
  isOpen: boolean;
  missingFields: MissingFieldInfo[];
  onComplete: (filledData: Record<string, Record<string, any>>) => void;
  onSkipAndUseDefaults: () => void;
  onCancel: () => void;
}

export default function MissingDataPromptModal({
  isOpen,
  missingFields,
  onComplete,
  onSkipAndUseDefaults,
  onCancel,
}: MissingDataPromptModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filledData, setFilledData] = useState<Record<string, Record<string, any>>>({});
  const [currentValue, setCurrentValue] = useState('');

  if (!isOpen || missingFields.length === 0) return null;

  const currentField = missingFields[currentIndex];
  const isLastField = currentIndex === missingFields.length - 1;
  const requiredFields = missingFields.filter(f => f.isRequired);
  const canSkip = !currentField.isRequired;

  const handleNext = () => {
    // Save current value
    if (currentValue.trim() || currentField.defaultValue) {
      const processKey = `process_${currentField.processIndex}`;
      setFilledData(prev => ({
        ...prev,
        [processKey]: {
          ...prev[processKey],
          [currentField.field]: currentValue || currentField.defaultValue,
        }
      }));
    }

    if (isLastField) {
      // Done with all fields
      onComplete(filledData);
    } else {
      // Move to next field
      setCurrentIndex(currentIndex + 1);
      setCurrentValue('');
    }
  };

  const handleSkipField = () => {
    if (canSkip) {
      if (isLastField) {
        onComplete(filledData);
      } else {
        setCurrentIndex(currentIndex + 1);
        setCurrentValue('');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900">Complete Missing Data</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-600">
              Field {currentIndex + 1} of {missingFields.length}
            </p>
            <div className="flex items-center space-x-2">
              {requiredFields.length > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                  {requiredFields.length} required
                </span>
              )}
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / missingFields.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Process Context */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Process</p>
            <p className="text-sm font-semibold text-gray-900">
              {currentField.processName || `Process ${currentField.processIndex + 1}`}
            </p>
          </div>

          {/* Field Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {currentField.fieldLabel}
              {currentField.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <input
              type="text"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder={currentField.defaultValue 
                ? `Default: ${currentField.defaultValue}` 
                : `Enter ${currentField.fieldLabel.toLowerCase()}`}
              className={`w-full px-4 py-3 border ${
                currentField.isRequired ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 ${
                currentField.isRequired ? 'focus:ring-red-400' : 'focus:ring-gray-400'
              }`}
              autoFocus
            />

            {currentField.defaultValue && (
              <p className="text-xs text-gray-500 mt-2">
                💡 Leave empty to use default: {currentField.defaultValue}
              </p>
            )}
          </div>

          {/* Field Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">What is this?</p>
                <p>{getFieldDescription(currentField.field as any)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {missingFields.length - currentIndex - 1} more field(s) after this
          </div>
          <div className="flex items-center space-x-3">
            {canSkip && (
              <button
                onClick={handleSkipField}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Skip (use default)
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={currentField.isRequired && !currentValue.trim()}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>{isLastField ? 'Complete' : 'Next'}</span>
              {!isLastField && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}