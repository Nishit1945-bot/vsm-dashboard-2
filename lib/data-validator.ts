// lib/data-validator.ts

import { VSMField, validateField } from './csv-parser';

export interface ProcessData {
  name: string;
  cycleTime: number;
  changeoverTime: number;
  uptime: number;
  operators?: number;
  shifts?: number;
  availableTime?: number;
  inventory?: number;
}

export interface ValidationIssue {
  field: VSMField | 'customerDemand';
  processIndex?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

/**
 * Validate complete VSM data
 */
export function validateVSMData(
  processes: ProcessData[],
  customerDemand?: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Validate customer demand
  if (!customerDemand || customerDemand <= 0) {
    issues.push({
      field: 'customerDemand',
      severity: 'error',
      message: 'Customer demand is required and must be greater than 0',
    });
  }

  // Validate each process
  processes.forEach((process, index) => {
    // Process name
    if (!process.name || process.name.trim() === '') {
      issues.push({
        field: 'processName',
        processIndex: index,
        severity: 'error',
        message: `Process ${index + 1}: Name is required`,
      });
    }

    // Cycle time
    const ctValidation = validateField('cycleTime', process.cycleTime);
    if (!ctValidation.isValid) {
      issues.push({
        field: 'cycleTime',
        processIndex: index,
        severity: 'error',
        message: `Process ${index + 1}: ${ctValidation.error}`,
      });
    } else if (ctValidation.warning) {
      issues.push({
        field: 'cycleTime',
        processIndex: index,
        severity: 'warning',
        message: `Process ${index + 1}: ${ctValidation.warning}`,
      });
    }

    // Changeover time
    const coValidation = validateField('changeoverTime', process.changeoverTime);
    if (!coValidation.isValid) {
      issues.push({
        field: 'changeoverTime',
        processIndex: index,
        severity: 'error',
        message: `Process ${index + 1}: ${coValidation.error}`,
      });
    }

    // Uptime
    const uptimeValidation = validateField('uptime', process.uptime);
    if (!uptimeValidation.isValid) {
      issues.push({
        field: 'uptime',
        processIndex: index,
        severity: 'error',
        message: `Process ${index + 1}: ${uptimeValidation.error}`,
      });
    } else if (uptimeValidation.warning) {
      issues.push({
        field: 'uptime',
        processIndex: index,
        severity: 'warning',
        message: `Process ${index + 1}: ${uptimeValidation.warning}`,
      });
    }
  });

  // Check for bottlenecks vs takt time
  if (customerDemand && customerDemand > 0) {
    const availableTime = 27000; // Default 8-hour shift
    const taktTime = availableTime / customerDemand;

    processes.forEach((process, index) => {
      if (process.cycleTime > taktTime) {
        issues.push({
          field: 'cycleTime',
          processIndex: index,
          severity: 'warning',
          message: `Process ${index + 1}: Cycle time (${process.cycleTime}s) exceeds takt time (${taktTime.toFixed(1)}s) - BOTTLENECK`,
        });
      }
    });
  }

  return issues;
}

/**
 * Calculate completeness percentage
 */
export function calculateCompleteness(
  processes: ProcessData[],
  hasCustomerDemand: boolean
): number {
  if (processes.length === 0) return 0;

  let totalFields = 0;
  let filledFields = 0;

  // Customer demand
  totalFields += 1;
  if (hasCustomerDemand) filledFields += 1;

  // Each process
  processes.forEach(process => {
    totalFields += 4; // name, CT, CO, uptime
    if (process.name) filledFields += 1;
    if (process.cycleTime > 0) filledFields += 1;
    if (process.changeoverTime >= 0) filledFields += 1;
    if (process.uptime > 0) filledFields += 1;

    // Optional fields (worth less)
    totalFields += 2; // operators, inventory
    if (process.operators) filledFields += 0.5;
    if (process.inventory) filledFields += 0.5;
  });

  return Math.round((filledFields / totalFields) * 100);
}