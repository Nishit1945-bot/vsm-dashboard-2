// lib/field-helpers.ts

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

/**
 * Get human-readable field name
 */
export function getFieldDisplayName(field: VSMField | string): string {
  const names: Record<string, string> = {
    processName: 'Process Name',
    cycleTime: 'Cycle Time (C/T)',
    changeoverTime: 'Changeover Time (C/O)',
    uptime: 'Uptime %',
    operators: 'Number of Operators',
    shifts: 'Shifts per Day',
    availableTime: 'Available Time (sec)',
    inventory: 'Inventory After Process',
    batchSize: 'Batch Size',
  };
  return names[field] || field;
}

/**
 * Get field description/help text
 */
export function getFieldDescription(field: VSMField | string): string {
  const descriptions: Record<string, string> = {
    processName: 'Name of the process step (e.g., Welding, Assembly)',
    cycleTime: 'Time to complete one unit at this process (in seconds)',
    changeoverTime: 'Time to switch between products/setups (in minutes)',
    uptime: 'Percentage of time process is available (0-100%)',
    operators: 'Number of people working at this station',
    shifts: 'Number of shifts per day',
    availableTime: 'Available production time per shift (in seconds)',
    inventory: 'Quantity of WIP after this process (pieces)',
    batchSize: 'Number of units processed in one batch',
  };
  return descriptions[field] || 'VSM data field';
}

/**
 * Get confidence level styling
 */
export function getConfidenceLevel(confidence: number): {
  level: 'high' | 'medium' | 'low' | 'none';
  color: string;
  icon: string;
} {
  if (confidence >= 90) return { level: 'high', color: 'green', icon: '✓' };
  if (confidence >= 60) return { level: 'medium', color: 'yellow', icon: '⚠' };
  if (confidence >= 30) return { level: 'low', color: 'orange', icon: '?' };
  return { level: 'none', color: 'red', icon: '✗' };
}