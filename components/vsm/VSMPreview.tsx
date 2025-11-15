// components/vsm/VSMPreview.tsx
'use client';

import {
  FactoryBox,
  ProcessBox,
  InventoryTriangle,
  TruckIcon,
  ProductionControl,
  PushArrow,
  ManualInfoArrow,
  ElectronicInfoArrow,
  ShipmentArrow,
  DataTable as VSMDataBox,
} from './VSMIcons';

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
}

interface VSMPreviewProps {
  taskName: string;
  customerDemand: string;
  processes: Process[];
  workingHours: string;
  breakTime: string;
}

export default function VSMPreview({
  taskName,
  customerDemand,
  processes,
  workingHours,
  breakTime,
}: VSMPreviewProps) {
  if (processes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No VSM data available</p>
          <p className="text-gray-400 text-sm">Add processes in the Chat tab to generate your Value Stream Map</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const availableTime = ((parseInt(workingHours) || 8) * 60 - (parseInt(breakTime) || 30)) * 60;
  const taktTime = customerDemand ? availableTime / parseInt(customerDemand) : 0;
  const totalCycleTime = processes.reduce((sum, p) => sum + (parseFloat(p.cycleTime) || 0), 0);
  const totalInventoryDays = processes.reduce((sum, p) => {
    const inv = parseFloat(p.inventoryAfter) || 0;
    return sum + (customerDemand ? inv / parseInt(customerDemand) : 0);
  }, 0);

  // SVG Layout calculations
  const processCount = processes.length;
  const processSpacing = 240;
  const startX = 120;
  const processY = 420;
  const width = Math.max(1800, startX + (processCount + 1) * processSpacing + 300);
  const height = 900;

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="p-6">
        {/* Header with export */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{taskName || 'Value Stream Mapping'}</h2>
            <p className="text-gray-600 text-sm mt-1">Current State Map</p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            Export PDF
          </button>
        </div>

        {/* VSM Diagram */}
        <div className="bg-white border border-gray-300 rounded-lg overflow-auto">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Dashed purple outer border */}
            <rect
              x="25"
              y="25"
              width={width - 50}
              height={height - 50}
              fill="none"
              stroke="#9333EA"
              strokeWidth="3"
              strokeDasharray="15,8"
              rx="8"
            />

            {/* Green curve at top */}
            <path
              d={`M 60 45 Q ${width/2} 25 ${width - 60} 45`}
              stroke="#84CC16"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Supplier */}
            <FactoryBox x={80} y={80} label="Supplier" />

            {/* Supplier truck */}
            <TruckIcon x={90} y={180} label="Weekly" />

            {/* Production Control */}
            <ProductionControl x={width/2 - 90} y={70} />

            {/* Customer */}
            <FactoryBox x={width - 230} y={80} label="Customer" />

            {/* Customer truck */}
            <TruckIcon x={width - 200} y={180} label="Monthly" />

            {/* Information flow: Supplier → Production Control */}
            <ElectronicInfoArrow
              x1={230}
              y1={120}
              x2={width/2 - 90}
              y2={110}
              label="Weekly order"
            />

            {/* Information flow: Customer → Production Control */}
            <ElectronicInfoArrow
              x1={width - 230}
              y1={120}
              x2={width/2 + 90}
              y2={110}
              label="Monthly order"
            />

            {/* INFORMATION FLOWS label */}
            <text 
              x={width/2} 
              y="270" 
              textAnchor="middle" 
              className="text-4xl font-bold fill-green-600"
              style={{ letterSpacing: '2px' }}
            >
              Information flows
            </text>

            {/* Green dashed separator */}
            <line
              x1="60"
              y1="290"
              x2={width - 60}
              y2="290"
              stroke="#84CC16"
              strokeWidth="2"
              strokeDasharray="12,6"
            />

            {/* MATERIAL FLOWS label */}
            <text 
              x={width/2} 
              y="340" 
              textAnchor="middle" 
              className="text-4xl font-bold fill-purple-600"
              style={{ letterSpacing: '2px' }}
            >
              Material flows
            </text>

            {/* Shipment from supplier to first process */}
            <ShipmentArrow x1={160} y1={180} x2={startX + 20} y2={processY + 50} />

            {/* Process boxes and material flow */}
            {processes.map((process, index) => {
              const x = startX + (index * processSpacing);
              const ct = parseFloat(process.cycleTime) || 0;
              const co = parseFloat(process.changeoverTime) || 0;
              const up = parseFloat(process.uptime) || 0;
              const inv = parseFloat(process.inventoryAfter) || 0;
              const invDays = customerDemand ? (inv / parseInt(customerDemand)) : 0;
              const shifts = process.shifts || '2';
              const availTime = process.availableTime || '27000';

              const processData = [
                `C/T = ${ct} sec`,
                `C/O = ${co} min`,
                `Uptime = ${up}%`,
                `${shifts} Shifts`,
                `${availTime} sec available`,
              ];

              return (
                <g key={process.id}>
                  {/* Inventory triangle before process (except first) */}
                  {index > 0 && (
                    <InventoryTriangle
                      x={x - 80}
                      y={processY + 20}
                      quantity={processes[index - 1].inventoryAfter || '0'}
                    />
                  )}

                  {/* Process box */}
                  <ProcessBox
                    x={x}
                    y={processY}
                    name={process.name || `Process ${String.fromCharCode(65 + index)}`}
                    data={processData}
                  />

                  {/* Push arrow to next process */}
                  {index < processes.length - 1 && (
                    <PushArrow
                      x1={x + 140}
                      y1={processY + 50}
                      x2={x + processSpacing - 90}
                      y2={processY + 50}
                    />
                  )}

                  {/* Waiting time (orange line with days) */}
                  {index > 0 && (
                    <g transform={`translate(${x - 80}, ${processY + 180})`}>
                      <line x1="0" y1="35" x2="80" y2="35" stroke="#FF8C00" strokeWidth="4" />
                      <text x="40" y="25" textAnchor="middle" className="text-sm font-bold fill-orange-600">
                        {invDays.toFixed(0)} days
                      </text>
                    </g>
                  )}

                  {/* Processing time box */}
                  <g transform={`translate(${x}, ${processY + 180})`}>
                    <rect width="140" height="50" fill="white" stroke="black" strokeWidth="2" />
                    <text x="70" y="32" textAnchor="middle" className="font-bold text-base">
                      {ct} sec
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Last inventory triangle */}
            <InventoryTriangle
              x={startX + (processes.length * processSpacing) - 80}
              y={processY + 20}
              quantity={processes[processes.length - 1]?.inventoryAfter || '0'}
            />

            {/* Shipping box */}
            <g transform={`translate(${startX + (processes.length * processSpacing)}, ${processY})`}>
              <rect width="140" height="100" fill="white" stroke="black" strokeWidth="2" />
              <text x="70" y="55" textAnchor="middle" className="font-bold text-lg">Shipping</text>
            </g>

            {/* Shipment to customer */}
            <ShipmentArrow 
              x1={startX + (processes.length * processSpacing) + 140} 
              y1={processY + 50} 
              x2={width - 180} 
              y2={200}
            />

            {/* Orange dashed separator above timeline */}
            <line
              x1="60"
              y1={processY + 170}
              x2={width - 60}
              y2={processY + 170}
              stroke="#FF8C00"
              strokeWidth="2"
              strokeDasharray="12,6"
            />

            {/* LEAD TIME LADDER label */}
            <text 
              x={width/2} 
              y={processY + 310} 
              textAnchor="middle" 
              className="text-5xl font-bold fill-orange-500"
              style={{ letterSpacing: '3px' }}
            >
              Lead time ladder
            </text>

            {/* Summary data box (bottom right) - RENAMED */}
            <VSMDataBox
              x={width - 380}
              y={processY + 180}
              width={300}
              data={[
                `Production lead time = ${totalInventoryDays.toFixed(0)} days`,
                `Processing time = ${totalCycleTime.toFixed(0)} sec`,
              ]}
            />

            {/* Orange curve at bottom */}
            <path
              d={`M 60 ${height - 45} Q ${width/2} ${height - 25} ${width - 60} ${height - 45}`}
              stroke="#FF8C00"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-bold text-gray-900 mb-3">VSM Metrics Summary</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Takt Time:</span>
              <span className="ml-2 font-semibold">{taktTime.toFixed(1)}s</span>
            </div>
            <div>
              <span className="text-gray-600">Total Cycle Time:</span>
              <span className="ml-2 font-semibold">{totalCycleTime.toFixed(0)}s</span>
            </div>
            <div>
              <span className="text-gray-600">Lead Time:</span>
              <span className="ml-2 font-semibold">{totalInventoryDays.toFixed(1)} days</span>
            </div>
            <div>
              <span className="text-gray-600">VA Ratio:</span>
              <span className="ml-2 font-semibold">
                {totalInventoryDays > 0 ? ((totalCycleTime / (totalInventoryDays * 86400)) * 100).toFixed(3) : '0'}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}