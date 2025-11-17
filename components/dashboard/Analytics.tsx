// components/dashboard/Analytics.tsx
'use client';

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Package, Download } from 'lucide-react';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Process {
  id: number;
  name: string;
  cycleTime: string;
  changeoverTime: string;
  uptime: string;
  operators: string;
  inventoryAfter: string;
}

interface AnalyticsProps {
  taskName: string;
  customerDemand: string;
  processes: Process[];
  workingHours: string;
  breakTime: string;
}

export default function Analytics({
  taskName,
  customerDemand,
  processes,
  workingHours,
  breakTime,
}: AnalyticsProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!contentRef.current) return;

    try {
      setIsExporting(true);

      // Create a print-friendly version
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups for PDF export');
        return;
      }

      // Clone the content
      const contentClone = contentRef.current.cloneNode(true) as HTMLElement;
      
      // Get all stylesheets
      const styles = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch (e) {
            return '';
          }
        })
        .join('\n');

      // Create the print document
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>VSM Analytics - ${taskName}</title>
            <style>
              ${styles}
              
              /* Print-specific styles */
              @page {
                size: A4;
                margin: 1cm;
              }
              
              body {
                margin: 0;
                padding: 0;
                background: white !important;
              }
              
              /* Ensure colors print */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              /* Hide scrollbars */
              ::-webkit-scrollbar {
                display: none;
              }
            </style>
          </head>
          <body>
            ${contentClone.outerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for content to load
      setTimeout(() => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          setIsExporting(false);
        }, 100);
      }, 500);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
      setIsExporting(false);
    }
  };

  if (processes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No analytics data available</p>
          <p className="text-gray-400 text-sm">Add processes to see analytics</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const availableTime = ((parseInt(workingHours) || 8) * 60 - (parseInt(breakTime) || 30)) * 60;
  const taktTime = customerDemand ? availableTime / parseInt(customerDemand) : 0;
  const totalCycleTime = processes.reduce((sum, p) => sum + (parseFloat(p.cycleTime) || 0), 0);
  const totalInventory = processes.reduce((sum, p) => sum + (parseFloat(p.inventoryAfter) || 0), 0);
  const inventoryDays = customerDemand ? totalInventory / parseInt(customerDemand) : 0;
  const vaRatio = inventoryDays > 0 ? (totalCycleTime / (inventoryDays * 86400)) * 100 : 0;

  // Find bottleneck
  const bottleneck = processes.reduce((max, p) => {
    const ct = parseFloat(p.cycleTime) || 0;
    const maxCt = parseFloat(max.cycleTime) || 0;
    return ct > maxCt ? p : max;
  }, processes[0]);

  const bottleneckCT = parseFloat(bottleneck?.cycleTime) || 0;
  const capacityPerShift = bottleneckCT > 0 ? Math.floor(availableTime / bottleneckCT) : 0;
  const requiredCapacity = parseInt(customerDemand) || 0;
  const capacityGap = requiredCapacity - capacityPerShift;

  // Process efficiency scores
  const processEfficiency = processes.map((p, i) => {
    const ct = parseFloat(p.cycleTime) || 0;
    const up = parseFloat(p.uptime) || 0;
    const efficiency = taktTime > 0 ? Math.min((taktTime / ct) * (up / 100) * 100, 100) : 0;
    return {
      name: p.name || `Process ${String.fromCharCode(65 + i)}`,
      efficiency: efficiency.toFixed(1),
      isBottleneck: ct > taktTime,
    };
  });

  // Inventory analysis
  const inventoryByProcess = processes.map((p, i) => {
    const inv = parseFloat(p.inventoryAfter) || 0;
    const days = customerDemand ? inv / parseInt(customerDemand) : 0;
    return {
      name: p.name || `Process ${String.fromCharCode(65 + i)}`,
      quantity: inv,
      days: days,
    };
  });

  const maxInventory = Math.max(...inventoryByProcess.map(i => i.quantity));

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Export Button - Fixed Position */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex justify-end">
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-9√√00 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span className="font-medium">Export as PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Content to be exported */}
      <div ref={contentRef} data-pdf-content className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{taskName || 'VSM Analytics'}</h1>
            <p className="text-gray-600 mt-1">Performance Analysis & Insights</p>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {/* Takt Time */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Takt Time</p>
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{taktTime.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">seconds/unit</p>
            </div>

            {/* Lead Time */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Lead Time</p>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{inventoryDays.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">days</p>
            </div>

            {/* VA Ratio */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase">VA Ratio</p>
                {vaRatio < 5 ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900">{vaRatio.toFixed(3)}</p>
              <p className="text-xs text-gray-500 mt-1">percent</p>
            </div>

            {/* Total Inventory */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Total WIP</p>
                <Package className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalInventory}</p>
              <p className="text-xs text-gray-500 mt-1">units</p>
            </div>
          </div>

          {/* Bottleneck Analysis */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Bottleneck Card */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Bottleneck Analysis
              </h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-red-900 mb-2">Primary Constraint</p>
                <p className="text-2xl font-bold text-red-700">{bottleneck?.name || 'N/A'}</p>
                <p className="text-sm text-red-600 mt-1">Cycle Time: {bottleneckCT}s (vs Takt: {taktTime.toFixed(1)}s)</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Capacity:</span>
                  <span className="font-semibold">{capacityPerShift} units/shift</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Required Capacity:</span>
                  <span className="font-semibold">{requiredCapacity} units/shift</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Capacity Gap:</span>
                  <span className={`font-semibold ${capacityGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {capacityGap > 0 ? `${capacityGap} units short` : 'Sufficient'}
                  </span>
                </div>
              </div>

              {capacityGap > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs font-medium text-yellow-900 mb-1">Recommended Actions:</p>
                  <ul className="text-xs text-yellow-800 space-y-1">
                    <li>• Add parallel capacity (2nd machine)</li>
                    <li>• Reduce cycle time through kaizen</li>
                    <li>• Improve uptime with TPM</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Waste Analysis */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Waste Breakdown</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Value-Added Time</span>
                    <span className="font-semibold text-green-600">{vaRatio.toFixed(3)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full" 
                      style={{ width: `${Math.min(vaRatio * 20, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Waiting (Inventory)</span>
                    <span className="font-semibold text-red-600">{(100 - vaRatio).toFixed(3)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full" 
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Time Distribution</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="font-semibold">{totalCycleTime.toFixed(0)} seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waiting Time:</span>
                    <span className="font-semibold">{inventoryDays.toFixed(1)} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Lead Time:</span>
                    <span className="font-semibold">{inventoryDays.toFixed(1)} days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Process Efficiency Chart */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Process Efficiency Analysis</h3>
            
            <div className="space-y-4">
              {processEfficiency.map((proc, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{proc.name}</span>
                      {proc.isBottleneck && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                          Bottleneck
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{proc.efficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full ${
                        proc.isBottleneck ? 'bg-red-500' : 
                        parseFloat(proc.efficiency) >= 80 ? 'bg-green-500' :
                        parseFloat(proc.efficiency) >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.min(parseFloat(proc.efficiency), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-2">Efficiency Score Legend:</p>
              <div className="grid grid-cols-4 gap-2 text-xs text-blue-800">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>≥80% Excellent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>60-80% Good</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>&lt;60% Poor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Bottleneck</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Analysis */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Inventory Analysis</h3>
            
            <div className="space-y-4">
              {inventoryByProcess.map((inv, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{inv.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{inv.quantity} units</span>
                      <span className="text-xs text-gray-500 ml-2">({inv.days.toFixed(1)} days)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        inv.days >= 5 ? 'bg-red-500' :
                        inv.days >= 3 ? 'bg-orange-500' :
                        inv.days >= 1 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((inv.quantity / maxInventory) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 mb-1">World-class Target</p>
                <p className="text-lg font-bold text-green-900">&lt; 1 day</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700 mb-1">Acceptable</p>
                <p className="text-lg font-bold text-yellow-900">1-3 days</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-700 mb-1">Critical</p>
                <p className="text-lg font-bold text-red-900">&gt; 5 days</p>
              </div>
            </div>
          </div>

          {/* Improvement Opportunities */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Improvement Opportunities</h3>
            
            <div className="space-y-4">
              {/* Bottleneck Improvement */}
              {capacityGap > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-red-600">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">Fix Bottleneck at {bottleneck?.name}</h4>
                      <p className="text-sm text-red-800 mb-2">
                        Current capacity: {capacityPerShift} units/shift. Need: {requiredCapacity} units/shift. 
                        Gap: {capacityGap} units ({((capacityGap / requiredCapacity) * 100).toFixed(0)}% short)
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">High Priority</span>
                        <span className="text-xs text-red-700">Estimated Impact: +{((capacityGap / requiredCapacity) * 100).toFixed(0)}% capacity</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Reduction */}
              {inventoryDays > 3 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-orange-600">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900 mb-1">Reduce Inventory Levels</h4>
                      <p className="text-sm text-orange-800 mb-2">
                        Current: {inventoryDays.toFixed(1)} days of inventory. Target: &lt; 1 day. 
                        Potential lead time reduction: {(inventoryDays - 1).toFixed(1)} days
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">Medium Priority</span>
                        <span className="text-xs text-orange-700">Estimated Impact: -{((inventoryDays - 1) / inventoryDays * 100).toFixed(0)}% lead time</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VA Ratio Improvement */}
              {vaRatio < 5 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-yellow-600">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-1">Improve Value-Added Ratio</h4>
                      <p className="text-sm text-yellow-800 mb-2">
                        Current VA ratio: {vaRatio.toFixed(3)}%. World-class target: 25-30%. 
                        This means {(100 - vaRatio).toFixed(1)}% of time is waste.
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">Medium Priority</span>
                        <span className="text-xs text-yellow-700">Focus: Reduce waiting time, not processing time</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All good state */}
              {capacityGap <= 0 && inventoryDays <= 3 && vaRatio >= 5 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">System Performance: Good</h4>
                      <p className="text-sm text-green-800">
                        Your value stream is performing well. Continue monitoring and pursue incremental improvements.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Benchmark Comparison */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Industry Benchmarks</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 font-semibold text-gray-700">Metric</th>
                    <th className="text-left py-2 font-semibold text-gray-700">Your Value</th>
                    <th className="text-left py-2 font-semibold text-gray-700">World-class</th>
                    <th className="text-left py-2 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-3 text-gray-900">Lead Time</td>
                    <td className="py-3 font-medium">{inventoryDays.toFixed(1)} days</td>
                    <td className="py-3 text-gray-600">&lt; 2 days</td>
                    <td className="py-3">
                      {inventoryDays < 2 ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" /> Excellent
                        </span>
                      ) : inventoryDays < 5 ? (
                        <span className="text-yellow-600 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" /> Good
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <TrendingDown className="w-4 h-4 mr-1" /> Needs Improvement
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-900">Value-Added Ratio</td>
                    <td className="py-3 font-medium">{vaRatio.toFixed(3)}%</td>
                    <td className="py-3 text-gray-600">25-30%</td>
                    <td className="py-3">
                      {vaRatio >= 25 ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" /> World-class
                        </span>
                      ) : vaRatio >= 10 ? (
                        <span className="text-yellow-600 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" /> Average
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <TrendingDown className="w-4 h-4 mr-1" /> Below Average
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-900">Inventory Days</td>
                    <td className="py-3 font-medium">{inventoryDays.toFixed(1)} days</td>
                    <td className="py-3 text-gray-600">&lt; 1 day</td>
                    <td className="py-3">
                      {inventoryDays < 1 ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" /> Excellent
                        </span>
                      ) : inventoryDays < 3 ? (
                        <span className="text-yellow-600 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" /> Acceptable
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <TrendingDown className="w-4 h-4 mr-1" /> High
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-gray-900">Process Count</td>
                    <td className="py-3 font-medium">{processes.length} steps</td>
                    <td className="py-3 text-gray-600">Minimize non-value steps</td>
                    <td className="py-3">
                      <span className="text-gray-600">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}