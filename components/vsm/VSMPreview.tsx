// components/vsm/VSMPreview.tsx
'use client';

import React, { useRef, useMemo } from 'react';

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
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate metrics
  const totalCycleTime = processes.reduce((sum, p) => sum + (parseFloat(p.cycleTime) || 0), 0);
  const totalLeadTime = processes.reduce((sum, p) => {
    const inv = parseFloat(p.inventoryAfter) || 0;
    const demand = parseInt(customerDemand) || 1;
    return sum + (inv / demand);
  }, 0);

  // Dynamic width calculation based on number of processes
  const { totalWidth, totalHeight, PROCESS_SPACING } = useMemo(() => {
    const minWidth = 1600;
    const baseSpacing = 200;
    const processCount = processes.length;
    
    // Calculate required width: processes + shipping + margins
    // Left margin (250) + processes (340 each) + shipping area (300) + right margin (200)
    const calculatedWidth = Math.max(
      minWidth,
      250 + (processCount * 340) + 300 + 200
    );
    
    return {
      totalWidth: calculatedWidth,
      totalHeight: 900,
      PROCESS_SPACING: baseSpacing
    };
  }, [processes.length]);

  // Process layout constants
  const PROCESS_WIDTH = 140;
  const PROCESS_HEIGHT = 80;
  const DATA_BOX_HEIGHT = 90;
  const MATERIAL_FLOW_Y = 450;

  // Calculate shipping box X position (aligned with where arrow points)
  const shippingBoxX = 300 + (processes.length - 1) * PROCESS_SPACING + PROCESS_WIDTH + 60;

  // Scroll functions for vertical navigation
  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToMiddle = () => {
    if (containerRef.current) {
      const middlePosition = containerRef.current.scrollHeight / 2 - containerRef.current.clientHeight / 2;
      containerRef.current.scrollTo({ top: middlePosition, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  // Export function
  const exportAsJPG = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Set canvas size to match dynamic SVG size
    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Create blob from SVG
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Fill white background
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Convert to JPG and download
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `VSM-${taskName || 'diagram'}.jpg`;
            link.click();
            URL.revokeObjectURL(downloadUrl);
          }
        }, 'image/jpeg', 0.95);
      }

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

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
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{taskName || 'Value Stream Map'}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete VSM with all three sections • {processes.length} processes
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportAsJPG}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-600 rounded-lg hover:bg-gray-900 hover:text-white transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Image
            </button>
          </div>
        </div>
      </div>

      {/* Floating Navigation Buttons */}
      <div className="absolute left-0 top-32 z-10 flex flex-col gap-2">
        <button
          onClick={scrollToTop}
          className="p-3 bg-white border-2 border-green-100 rounded-lg shadow-lg hover:bg-green-50 transition-colors"
          title="Information flows"
        >
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
        <button
          onClick={scrollToMiddle}
          className="p-3 bg-white border-2 border-purple-100 rounded-lg shadow-lg hover:bg-purple-50 transition-colors"
          title="Material flows"
        >
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
        <button
          onClick={scrollToBottom}
          className="p-3 bg-white border-2 border-orange-100 rounded-lg shadow-lg hover:bg-orange-50 transition-colors"
          title="Lead time ladder"
        >
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      {/* VSM Canvas - Pure SVG with horizontal scroll */}
      <div className="overflow-auto p-8 h-[calc(100%-88px)]" ref={containerRef}>
        <svg ref={svgRef} width={totalWidth} height={totalHeight} className="mx-auto bg-white">
          <defs>
            {/* Blue gradient for factory boxes */}
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            {/* Arrow marker definition */}
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="black"/>
            </marker>
          </defs>

          {/* ========== SECTION 1: INFORMATION FLOWS ========== */}
          
          {/* Information flows title */}
            <text 
              x={(40 + (shippingBoxX + 600 - 40)) / 2} y="30" textAnchor="middle" fontSize="22" fontFamily="Arial" fontWeight="bold" fill="#22C55E" 
            >
              Information flows
            </text>

          {/* Green dashed border around information flow section */}
          <rect 
            x="40" 
            y="50" 
            width={shippingBoxX + 250 + 150 + 50 - 80} 
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
          <g transform={`translate(${((shippingBoxX + 600) / 2) - 110}, 100)`}>
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

          {/* Customer (RIGHT) - ALIGNED WITH SHIPPING BOX */}
          <g transform={`translate(${shippingBoxX + 250}, 120)`}>
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
          <g transform={`translate(${((shippingBoxX + 600) / 2) + 110}, 155)`}>
            {(() => {
              const distance = (shippingBoxX + 210) - (((shippingBoxX + 600) / 2) + 110);
              const zigzagWidth = Math.min(650, Math.max(50, distance * 0.4)); // Dynamic width between 50-250
              const straightWidth = Math.max(20, distance - zigzagWidth - 20); // Remaining distance
              
              return (
                <>
                  <path 
                    d={`M ${distance} -10 L ${zigzagWidth} -10 L ${zigzagWidth + 20} 10 L 0 10`} 
                    stroke="black" 
                    strokeWidth="2" 
                    fill="none"
                  />
                  <polygon points="20,3 0,10 20,17" fill="black"/>
                </>
              );
            })()}
          </g>

         {/* Arrow: Admin → Supplier */}
        <g transform={`translate(${80 + 150}, 155)`}>
          {(() => {
            const distance = ((shippingBoxX + 600) / 2) - 110 - (80 + 150);
            const zigzagWidth = Math.min(220, Math.max(50, distance * 0.4)); // Dynamic width between 50-220
            const diagonalOffset = Math.min(20, distance * 0.08); // Dynamic diagonal offset
            
            return (
              <>
                <path 
                  d={`M ${distance} -10 L ${zigzagWidth} -10 L ${zigzagWidth + diagonalOffset} 10 L 0 10`}
                  stroke="black" 
                  strokeWidth="2" 
                  fill="none"
                />
                <polygon points="20,3 0,10 20,17" fill="black"/>
              </>
            );
          })()}
        </g>

          {/* ========== SECTION 2: MATERIAL FLOWS ========== */}
          
          {/* Material flows title */}
          <text 
            x={(40 + (shippingBoxX + 600 - 40)) / 2} y="320" textAnchor="middle" fontSize="22" fontFamily="Arial" fontWeight="bold" fill="#9333EA">
            Material flows
          </text>

          {/* Purple dashed border around material flow section */}
          <rect 
            x="40" 
            y="340" 
            width={shippingBoxX + 250 + 150 + 50 - 80} 
            height="280" 
            fill="none" 
            stroke="#9333EA" 
            strokeWidth="3" 
            strokeDasharray="10,5" 
            rx="15"
          />

          {/* Truck under Supplier (left) */}
          <g transform="translate(60, 370)">
            <rect x="15" y="8" width="35" height="15" fill="black" stroke="black" strokeWidth="2"/>
            <rect x="5" y="13" width="15" height="10" fill="black" stroke="black" strokeWidth="2"/>
            <circle cx="15" cy="25" r="4" fill="white" stroke="black" strokeWidth="2"/>
            <circle cx="42" cy="25" r="4" fill="white" stroke="black" strokeWidth="2"/>
            <text x="30" y="45" textAnchor="middle" fontSize="11" fontFamily="Arial" fontWeight="bold">
              Weekly
            </text>
          </g>

          {/* DOWN ARROW: Supplier → First Process */}
          <g transform="translate(155, 210)">
            <path
              d="M 0 0 L 0 200 L 60 200 L 60 180 L 100 220 L 60 260 L 60 240 L -20 240 L -20 0 Z"  
              fill="grey"
              stroke="black"
              strokeWidth="2"
            />
          </g>

          {/* Truck under Customer (right) - ALIGNED WITH CUSTOMER */}
          <g transform={`translate(${shippingBoxX + 180}, 370)`}>
            <rect x="15" y="8" width="35" height="15" fill="black" stroke="black" strokeWidth="2"/>
            <rect x="5" y="13" width="15" height="10" fill="black" stroke="black" strokeWidth="2"/>
            <circle cx="15" cy="25" r="4" fill="white" stroke="black" strokeWidth="2"/>
            <circle cx="42" cy="25" r="4" fill="white" stroke="black" strokeWidth="2"/>
            <text x="30" y="45" textAnchor="middle" fontSize="11" fontFamily="Arial" fontWeight="bold">
              Monthly
            </text>
          </g>

          {/* Processes */}
          {processes.map((process, index) => {
            const x = 300 + index * PROCESS_SPACING;
            const y = MATERIAL_FLOW_Y - PROCESS_HEIGHT / 2;

            return (
              <g key={process.id}>
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

                {/* White box below */}
                <rect 
                  x={x} 
                  y={y + 35} 
                  width={PROCESS_WIDTH} 
                  height={45} 
                  fill="white" 
                  stroke="black" 
                  strokeWidth="2"
                />
                
                {/* Data Box below process */}
                <g transform={`translate(${x}, ${y + PROCESS_HEIGHT + 10})`}>
                  <rect width={PROCESS_WIDTH} height={DATA_BOX_HEIGHT} fill="white" stroke="black" strokeWidth="2"/>
                  <line x1="0" y1="22" x2={PROCESS_WIDTH} y2="22" stroke="black" strokeWidth="1"/>
                  <line x1="0" y1="44" x2={PROCESS_WIDTH} y2="44" stroke="black" strokeWidth="1"/>
                  <line x1="0" y1="66" x2={PROCESS_WIDTH} y2="66" stroke="black" strokeWidth="1"/>
                  
                  <text x="10" y="15" fontSize="11" fontFamily="Arial">C/T = {process.cycleTime} sec</text>
                  <text x="10" y="37" fontSize="11" fontFamily="Arial">C/O = {process.changeoverTime} min</text>
                  <text x="10" y="59" fontSize="11" fontFamily="Arial">Uptime = {process.uptime}%</text>
                  <text x="10" y="81" fontSize="11" fontFamily="Arial">{process.operators} operators</text>
                </g>

                {/* Elements between processes */}
                {index < processes.length - 1 && (
                  <>
                    {/* Inventory Triangle */}
                    <polygon 
                      points={`${x + PROCESS_WIDTH + 30},${MATERIAL_FLOW_Y + 55} ${x + PROCESS_WIDTH + 10},${MATERIAL_FLOW_Y + 95} ${x + PROCESS_WIDTH + 50},${MATERIAL_FLOW_Y + 95}`}
                      fill="yellow"
                      stroke="black"
                      strokeWidth="2"
                    />
                    <text x={x + PROCESS_WIDTH + 30} y={MATERIAL_FLOW_Y + 115} textAnchor="middle" fontSize="12" fontFamily="Arial" fontWeight="bold">
                      {process.inventoryAfter}
                    </text>

                    {/* Push Arrow */}
                    <g transform={`translate(${x + PROCESS_WIDTH + 60}, ${MATERIAL_FLOW_Y - 8})`}>
                      <rect x="0" y="0" width="60" height="6" fill="black"/>
                      {[0, 1, 2, 3].map((i) => (
                        <rect key={i} x={8 + i * 15} y="0" width="6" height="6" fill="white" stroke="black" strokeWidth="1"/>
                      ))}
                      <polygon 
                        points="60,-7 80,0 60,7" 
                        fill="black"
                      />
                    </g>

                    {/* Horizontal Push Arrow  */}
                    <g transform={`translate(${x + PROCESS_WIDTH + 5}, ${y + 40})`}>
                      <rect x="-5" y="-3" width="40" height="6" fill="black" />
                      <rect x="4"  y="-3" width="10" height="6" fill="white" stroke="black" strokeWidth="1" />
                      <rect x="22" y="-3" width="10" height="6" fill="white" stroke="black" strokeWidth="1" />
                      <rect x="36" y="-3" width="10" height="6" fill="white" stroke="black" strokeWidth="1" />
                      <rect x="35" y="-3" width="10" height="6" fill="white" stroke="black" strokeWidth="1" />
                      <polygon points="35,-10 55,0 35,10" fill="black" />
                    </g>
                  </>
                )}
              </g>
            );
          })}

          {/* Inventory Triangle AFTER LAST PROCESS */}
          {processes.length > 0 && (
            <>
              <polygon 
                points={`${300 + (processes.length - 1) * PROCESS_SPACING + PROCESS_WIDTH + 30},${MATERIAL_FLOW_Y + 55} ${300 + (processes.length - 1) * PROCESS_SPACING + PROCESS_WIDTH + 10},${MATERIAL_FLOW_Y + 95} ${300 + (processes.length - 1) * PROCESS_SPACING + PROCESS_WIDTH + 50},${MATERIAL_FLOW_Y + 95}`}
                fill="yellow"
                stroke="black"
                strokeWidth="2"
              />
              <text 
                x={300 + (processes.length - 1) * PROCESS_SPACING + PROCESS_WIDTH + 30} 
                y={MATERIAL_FLOW_Y + 115} 
                textAnchor="middle" 
                fontSize="12" 
                fontFamily="Arial" 
                fontWeight="bold"
              >
                {processes[processes.length - 1]?.inventoryAfter || '0'}
              </text>
            </>
          )}

          {/* Shipping Box - using calculated position */}
          <g transform={`translate(${shippingBoxX}, ${MATERIAL_FLOW_Y - 30})`}>
            <rect width="120" height="60" fill="white" stroke="black" strokeWidth="2"/>
            <text x="60" y="35" textAnchor="middle" fontSize="14" fontFamily="Arial" fontWeight="bold">
              Shipping
            </text>
          </g>

          {/* DOWN ARROW: Customer → Shipping - ALIGNED */}
          <g transform={`translate(${shippingBoxX + 160}, 450)`}>
            <path
              d="M 0 0 L 100 0 L 100 -180 L 80 -180 L 120 -240 L 160 -180 L 140 -180 L 140 20 L 0 20 Z"
              fill="grey"
              stroke="black"
              strokeWidth="2"
            />
          </g>

          {/* Arrow from last process to Shipping */}
          <g transform={`translate(${300 + (processes.length - 1) * PROCESS_SPACING + PROCESS_WIDTH + 5}, ${MATERIAL_FLOW_Y})`}>
            {(() => {
              const distance = 50; // Fixed short distance to shipping
              const numBlocks = 2;
              
              return (
                <>
                  <rect x="0" y="-3" width={distance} height="6" fill="black" />
                  {Array.from({ length: numBlocks }).map((_, i) => (
                    <rect 
                      key={i}
                      x={10 + i * 18} 
                      y="-3" 
                      width="10" 
                      height="6" 
                      fill="white" 
                      stroke="black" 
                      strokeWidth="1" 
                    />
                  ))}
                  <polygon points={`${distance},-10 ${distance + 20},0 ${distance},10`} fill="black" />
                </>
              );
            })()}
          </g>
          
          {/* ========== SECTION 3: LEAD TIME LADDER ========== */}
          <text x={(40 + (shippingBoxX + 600 - 40)) / 2} y="660" textAnchor="middle" fontSize="22" fontFamily="Arial" fontWeight="bold" fill="#F97316">
            Lead time ladder
          </text>

          {/* Orange dashed border around lead time section */}
          <rect 
            x="40" 
            y="680" 
            width={shippingBoxX + 250 + 150 + 50 - 80} 
            height="180" 
            fill="none" 
            stroke="#F97316" 
            strokeWidth="3" 
            strokeDasharray="10,5" 
            rx="15"
          />

          {/* Main timeline horizontal line (baseline) */}
          <line 
            x1="250" 
            y1="760" 
            x2={250 + processes.length * 140 + 100} 
            y2="760" 
            stroke="black" 
            strokeWidth="2"
          />

          {/* Build the lead time ladder */}
          {(() => {
            const baselineY = 760;
            const upY = 720;
            const downY = 800;
            
            let pathData = `M 250 ${baselineY}`;
            let currentX = 250;

            processes.forEach((process, index) => {
              const leadTimeWidth = 70;
              const processingWidth = 70;

              pathData += ` L ${currentX} ${downY}`;
              pathData += ` L ${currentX + leadTimeWidth} ${downY}`;
              pathData += ` L ${currentX + leadTimeWidth} ${baselineY}`;
              currentX += leadTimeWidth;

              pathData += ` L ${currentX} ${upY}`;
              pathData += ` L ${currentX + processingWidth} ${upY}`;
              pathData += ` L ${currentX + processingWidth} ${baselineY}`;
              currentX += processingWidth;
            });

            return (
              <>
                <path 
                  d={pathData}
                  fill="none"
                  stroke="black" 
                  strokeWidth="2"
                />

                {processes.map((process, index) => {
                  const baseX = 250 + index * 140;
                  const leadTimeDays = (parseFloat(process.inventoryAfter) || 0) / (parseInt(customerDemand) || 1);
                  const cycleTimeSec = parseFloat(process.cycleTime) || 0;

                  return (
                    <g key={`timeline-${process.id}`}>
                      <text 
                        x={baseX + 35} 
                        y={upY + 25} 
                        textAnchor="middle" 
                        fontSize="13" 
                        fontFamily="Arial" 
                        fontWeight="bold"
                      >
                        {leadTimeDays.toFixed(1)} days
                      </text>
                      <text 
                        x={baseX + 105} 
                        y={downY - 10} 
                        textAnchor="middle" 
                        fontSize="13" 
                        fontFamily="Arial" 
                        fontWeight="bold"
                      >
                        {cycleTimeSec} sec
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}

          {/* Summary box */}
          <g transform={`translate(${250 + processes.length * 140 + 100}, ${740})`}>
            <rect 
              x="0" 
              y="-30" 
              width="300" 
              height="90" 
              fill="white" 
              stroke="black" 
              strokeWidth="2"
            />
            <text x="150" y="0" textAnchor="middle" fontSize="13" fontFamily="Arial" fontWeight="bold">
              Production lead time = {totalLeadTime.toFixed(1)} days
            </text>
            <text x="150" y="30" textAnchor="middle" fontSize="13" fontFamily="Arial" fontWeight="bold">
              Processing time = {totalCycleTime} sec
            </text>
          </g>

        </svg>
      </div>
    </div>
  );
}