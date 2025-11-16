// components/vsm/VSMPreview.tsx
'use client';

import React, { useRef } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  if (processes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center p-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No VSM Data Available</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add processes in the form to generate your Value Stream Map
          </p>
          <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100">
            Start by filling the form on the right →
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalCycleTime = processes.reduce((sum, p) => sum + (parseFloat(p.cycleTime) || 0), 0);
  const totalLeadTime = processes.reduce((sum, p) => {
    const inv = parseFloat(p.inventoryAfter) || 0;
    const demand = parseInt(customerDemand) || 1;
    return sum + (inv / demand);
  }, 0);

  const totalWidth = 1600;
  const totalHeight = 900;

  // Process layout constants
  const PROCESS_WIDTH = 140;
  const PROCESS_HEIGHT = 80;
  const DATA_BOX_HEIGHT = 90;
  const PROCESS_SPACING = 200;
  const MATERIAL_FLOW_Y = 450;

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{taskName || 'Value Stream Map'}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete VSM with all three sections
            </p>
          </div>
        </div>
      </div>

      {/* VSM Canvas - Pure SVG */}
      <div className="overflow-auto p-8" ref={containerRef}>
        <svg width={totalWidth} height={totalHeight} className="mx-auto bg-white">
          <defs>
            {/* Blue gradient for factory boxes */}
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>

          {/* ========== SECTION 1: INFORMATION FLOWS ========== */}
          
          {/* Information flows title */}
          <text x="800" y="30" textAnchor="middle" fontSize="22" fontFamily="Arial" fontWeight="bold" fill="#22C55E">
            Information flows
          </text>

          {/* Green dashed border around information flow section */}
          <rect 
            x="40" 
            y="50" 
            width="1520" 
            height="230" 
            fill="none" 
            stroke="#22C55E" 
            strokeWidth="3" 
            strokeDasharray="10,5" 
            rx="15"
          />

          {/* Supplier (LEFT) */}
          <g transform="translate(80, 120)">
            <rect x="0" y="20" width="150" height="60" fill="url(#blueGradient)" stroke="black" strokeWidth="3"/>
            <path 
              d="M 0 20 L 37.5 5 L 37.5 20 L 75 5 L 75 20 L 112.5 5 L 112.5 20 L 150 5 L 150 20"
              fill="url(#blueGradient)" 
              stroke="black" 
              strokeWidth="3"
            />
            <text x="75" y="60" textAnchor="middle" fontSize="18" fontFamily="Arial" fontWeight="bold">
              Supplier
            </text>
          </g>

          {/* Production Control / Admin (CENTER) */}
          <g transform="translate(680, 100)">
            <rect x="0" y="0" width="220" height="130" fill="white" stroke="black" strokeWidth="3"/>
            <rect x="15" y="15" width="190" height="45" fill="#E5E7EB" stroke="black" strokeWidth="2"/>
            <text x="110" y="45" textAnchor="middle" fontSize="18" fontFamily="Arial" fontWeight="bold">
              Production control
            </text>
            <text x="110" y="85" textAnchor="middle" fontSize="14" fontFamily="Arial" fontWeight="bold">
              Production
            </text>
            <text x="110" y="108" textAnchor="middle" fontSize="14" fontFamily="Arial" fontWeight="bold">
              Control
            </text>
          </g>

         {/* Customer (RIGHT) */}
          <g transform="translate(1430, 120)">
            <rect x="-40" y="20" width="150" height="60" fill="url(#blueGradient)" stroke="black" strokeWidth="3"/>
            <path 
              d="M -40 20 L -2.5 5 L -2.5 20 L 35 5 L 35 20 L 72.5 5 L 72.5 20 L 110 5 L 110 20"
              fill="url(#blueGradient)" 
              stroke="black" 
              strokeWidth="3"
            />
            <text x="35" y="60" textAnchor="middle" fontSize="18" fontFamily="Arial" fontWeight="bold">
              Customer
            </text>
          </g>

          {/* Arrow: Customer → Admin */}
          <g transform="translate(910, 155)">
            <path d="M 480 -10 L 250 -10 L 270 10 L 0 10" stroke="black" strokeWidth="2" fill="none"/>
            <polygon points="20,3 0,10 20,17" fill="black"/>
            
          </g>

          {/* Arrow: Admin → Supplier */}
          <g transform="translate(240, 155)">
            <path d="M 440 -10 L 220 -10 L 240 10 L 0 10" stroke="black" strokeWidth="2" fill="none"/>
            <polygon points="20,3 0,10 20,17" fill="black"/>
          </g>

          {/* ========== SECTION 2: MATERIAL FLOWS ========== */}
          
          {/* Material flows title */}
          <text x="800" y="320" textAnchor="middle" fontSize="22" fontFamily="Arial" fontWeight="bold" fill="#9333EA">
            Material flows
          </text>

          {/* Purple dashed border around material flow section */}
          <rect 
            x="40" 
            y="340" 
            width="1520" 
            height="280" 
            fill="none" 
            stroke="#9333EA" 
            strokeWidth="3" 
            strokeDasharray="10,5" 
            rx="15"
          />

          {/* Truck under Supplier (left) */}
          <g transform="translate(120, 370)">
            <rect x="15" y="8" width="35" height="15" fill="black" stroke="black" strokeWidth="2"/>
            <rect x="5" y="13" width="15" height="10" fill="black" stroke="black" strokeWidth="2"/>
            <circle cx="15" cy="25" r="4" fill="white" stroke="black" strokeWidth="2"/>
            <circle cx="42" cy="25" r="4" fill="white" stroke="black" strokeWidth="2"/>
            <text x="30" y="45" textAnchor="middle" fontSize="11" fontFamily="Arial" fontWeight="bold">
              Weekly
            </text>
          </g>

          {/* Truck under Customer (right) */}
          <g transform="translate(1460, 370)">
            <rect x="15" y="8" width="35" height="15" fill="black" stroke="black" strokeWidth="2"/>
            <rect x="5" y="13" width="15" height="10" fill="black" stroke="black" strokeWidth="2"/>
            <circle cx="15" cy="25" r="4" fill="white" stroke="black" strokeWidth="2"/>
            <circle cx="42" cy="25" r="4" fill="white" stroke="black" strokeWidth="2"/>
            <text x="30" y="45" textAnchor="middle" fontSize="11" fontFamily="Arial" fontWeight="bold">
              Monthly
            </text>
          </g>

          {/* Arrow from Supplier to first process */}
          <g transform="translate(120, 450)">
            <line x1="80" y1="0" x2="160" y2="0" stroke="black" strokeWidth="2"/>
            <polygon points="160,-7 180,0 160,7" fill="black"/>
          </g>

          {/* Processes */}
          {processes.map((process, index) => {
            const x = 300 + index * PROCESS_SPACING;
            const y = MATERIAL_FLOW_Y - PROCESS_HEIGHT / 2;

            return (
              <g key={process.id}>
                {/* Information flow arrow from Production Control to Process */}
                {/* ========================================== 
                <line
                  x1="790"
                  y1="230"
                  x2={x + PROCESS_WIDTH / 2}
                  y2={y - 10}
                  stroke="black"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                 ========================================== */}
                {/* Process Box - Blue gradient header */}
                <rect 
                  x={x} 
                  y={y} 
                  width={PROCESS_WIDTH} 
                  height={35} 
                  fill="url(#blueGradient)" 
                  stroke="black" 
                  strokeWidth="2"
                />
                
                {/* Process name in blue header */}
                <text 
                  x={x + PROCESS_WIDTH / 2} 
                  y={y + 23} 
                  textAnchor="middle" 
                  fontSize="16" 
                  fontFamily="Arial" 
                  fontWeight="bold"
                >
                  {process.name}
                </text>

                {/* White box below with description */}
                <rect 
                  x={x} 
                  y={y + 35} 
                  width={PROCESS_WIDTH} 
                  height={45} 
                  fill="white" 
                  stroke="black" 
                  strokeWidth="2"
                />
                
                
              
                {/* Operator icon at bottom 
                <circle cx={x + 15} cy={y + PROCESS_HEIGHT - 7} r="3" fill="black"/>
                <circle cx={x + 15} cy={y + PROCESS_HEIGHT} r="5" fill="black"/> */}
                
                
                


                {/* Data Box below process */}
                <g transform={`translate(${x}, ${y + PROCESS_HEIGHT + 10})`}>
                  <rect width={PROCESS_WIDTH} height={DATA_BOX_HEIGHT} fill="white" stroke="black" strokeWidth="2"/>
                  <line x1="0" y1="22" x2={PROCESS_WIDTH} y2="22" stroke="black" strokeWidth="1"/>
                  <line x1="0" y1="44" x2={PROCESS_WIDTH} y2="44" stroke="black" strokeWidth="1"/>
                  <line x1="0" y1="66" x2={PROCESS_WIDTH} y2="66" stroke="black" strokeWidth="1"/>
                  
                  <text x="10" y="15" fontSize="15" fontFamily="Arial">C/T = {process.cycleTime} sec</text>
                  <text x="10" y="37" fontSize="15" fontFamily="Arial">C/O = {process.changeoverTime} min</text>
                  <text x="10" y="59" fontSize="15" fontFamily="Arial">Uptime = {process.uptime}%</text>
                  <text x="10" y="81" fontSize="15" fontFamily="Arial">{process.operators} operators</text>
                </g>

                {/* Inventory Triangle and Push Arrow (between processes) */}
                {index < processes.length - 1 && (
                  <>
                    {/* Inventory Triangle */}
                    <polygon 
                      points={`${x + PROCESS_WIDTH + 30},${MATERIAL_FLOW_Y - 25} ${x + PROCESS_WIDTH + 10},${MATERIAL_FLOW_Y + 20} ${x + PROCESS_WIDTH + 50},${MATERIAL_FLOW_Y + 20}`}
                      fill="white"
                      stroke="black"
                      strokeWidth="2"
                    />
                    <text x={x + PROCESS_WIDTH + 30} y={MATERIAL_FLOW_Y + 35} textAnchor="middle" fontSize="12" fontFamily="Arial" fontWeight="bold">
                      {process.inventoryAfter}
                    </text>

                    {/* Push Arrow */}
                    <g transform={`translate(${x + PROCESS_WIDTH + 60}, ${MATERIAL_FLOW_Y - 8})`}>
                      <rect x="0" y="0" width="60" height="6" fill="black"/>
                      {[0, 1, 2, 3].map((i) => (
                        <rect key={i} x={8 + i * 15} y="0" width="6" height="6" fill="white" stroke="black" strokeWidth="1"/>
                      ))}
                      <polygon points="60,-7 80,0 60,7" fill="black"/>
                    </g>
                  </>
                )}
              </g>
            );
          })}

          {/* Shipping Box */}
          <g transform={`translate(${300 + processes.length * PROCESS_SPACING}, ${MATERIAL_FLOW_Y - 40})`}>
            <rect width="120" height="60" fill="white" stroke="black" strokeWidth="2"/>
            <text x="60" y="35" textAnchor="middle" fontSize="14" fontFamily="Arial" fontWeight="bold">
              Shipping
            </text>
          </g>

          {/* Arrow from last process to Shipping */}
          <line
            x1={300 + (processes.length - 1) * PROCESS_SPACING + PROCESS_WIDTH}
            y1={MATERIAL_FLOW_Y}
            x2={300 + processes.length * PROCESS_SPACING}
            y2={MATERIAL_FLOW_Y}
            stroke="black"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />

          {/* Arrow from Shipping to Customer */}
          <line
            x1={300 + processes.length * PROCESS_SPACING + 120}
            y1={MATERIAL_FLOW_Y - 10}
            x2={1460}
            y2={MATERIAL_FLOW_Y - 10}
            stroke="black"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />

          {/* ========== SECTION 3: LEAD TIME LADDER ========== */}
          
          {/* Lead time ladder title */}
          <text x="800" y="660" textAnchor="middle" fontSize="22" fontFamily="Arial" fontWeight="bold" fill="#F97316">
            Lead time ladder
          </text>

          {/* Orange dashed border around lead time section */}
          <rect 
            x="40" 
            y="680" 
            width="1520" 
            height="180" 
            fill="none" 
            stroke="#F97316" 
            strokeWidth="3" 
            strokeDasharray="10,5" 
            rx="15"
          />

          {/* Timeline boxes for each process */}
          {processes.map((process, index) => {
            const x = 300 + index * PROCESS_SPACING;
            const leadTimeDays = (parseFloat(process.inventoryAfter) || 0) / (parseInt(customerDemand) || 1);

            return (
              <g key={`timeline-${process.id}`}>
                {/* Lead time box (days) */}
                <rect x={x} y="710" width={PROCESS_WIDTH} height="50" fill="white" stroke="black" strokeWidth="2"/>
                <text x={x + PROCESS_WIDTH / 2} y="740" textAnchor="middle" fontSize="13" fontFamily="Arial" fontWeight="bold">
                  {leadTimeDays.toFixed(1)} days
                </text>

                {/* Process time box (seconds) */}
                <rect x={x} y="770" width={PROCESS_WIDTH} height="40" fill="white" stroke="black" strokeWidth="2"/>
                <text x={x + PROCESS_WIDTH / 2} y="795" textAnchor="middle" fontSize="13" fontFamily="Arial" fontWeight="bold">
                  {process.cycleTime} sec
                </text>

                {/* Connecting line to next process */}
                {index < processes.length - 1 && (
                  <line x1={x + PROCESS_WIDTH} y1="735" x2={x + PROCESS_SPACING} y2="735" stroke="black" strokeWidth="2"/>
                )}
              </g>
            );
          })}

          {/* Summary box */}
          <g transform={`translate(${300 + processes.length * PROCESS_SPACING + 50}, 710)`}>
            <rect width="200" height="100" fill="#FEF3C7" stroke="black" strokeWidth="2"/>
            <text x="10" y="25" fontSize="12" fontFamily="Arial" fontWeight="bold">
              Production lead time =
            </text>
            <text x="100" y="45" textAnchor="middle" fontSize="14" fontFamily="Arial" fontWeight="bold">
              {totalLeadTime.toFixed(1)} days
            </text>
            <text x="10" y="70" fontSize="12" fontFamily="Arial" fontWeight="bold">
              Processing time =
            </text>
            <text x="100" y="90" textAnchor="middle" fontSize="14" fontFamily="Arial" fontWeight="bold">
              {totalCycleTime} sec
            </text>
          </g>

          {/* Arrow marker definition */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="black"/>
            </marker>
          </defs>

        </svg>
      </div>
    </div>
  );
}