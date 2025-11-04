"use client"

import { useMemo, forwardRef } from "react"
import {
  ProcessBox,
  InventoryTriangle,
  TruckIcon,
  PushArrow,
  DataBox,
  InformationArrow,
  SupplierCustomerBox,
} from "./vsm-shapes"

type VSMProcess = {
  id: string
  name: string
  cycleTimeSec?: number
  changeoverSec?: number
  uptimePct?: number
  wipUnits?: number
  shifts?: number
  availableTime?: number
}

type VSMDataset = {
  customerDemandPerDay?: number
  processes: VSMProcess[]
}

interface VSMGraphProps {
  dataset: VSMDataset
  width?: number
  height?: number
}

export const VSMGraph = forwardRef<SVGSVGElement, VSMGraphProps>(({ dataset, width = 1400, height = 900 }, ref) => {
  const layout = useMemo(() => {
    const processCount = dataset.processes.length || 1
    const processSpacing = 200
    const startX = 200
    const processY = 400

    const nodes = dataset.processes.map((p, idx) => ({
      id: p.id,
      name: p.name,
      x: startX + idx * processSpacing,
      y: processY,
      data: {
        cycleTime: p.cycleTimeSec ? `${p.cycleTimeSec} sec` : "N/A",
        changeover: p.changeoverSec ? `${p.changeoverSec} min` : "N/A",
        uptime: p.uptimePct ? `${p.uptimePct}%` : "N/A",
        shifts: p.shifts || 2,
        availableTime: p.availableTime || 27000,
      },
      wip: p.wipUnits || 0,
    }))

    // Calculate lead times
    const totalProcessTime = dataset.processes.reduce((sum, p) => sum + (p.cycleTimeSec || 0), 0)
    const leadTimeDays = dataset.processes.map((p, idx) => {
      const wipTime = idx > 0 ? (dataset.processes[idx - 1].wipUnits || 0) * 0.5 : 0
      return Math.max(1, Math.round(wipTime))
    })

    return { nodes, totalProcessTime, leadTimeDays }
  }, [dataset])

  return (
    <svg ref={ref} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white">
      <g>
        <rect
          x={40}
          y={40}
          width={width - 80}
          height={200}
          fill="none"
          stroke="#84cc16"
          strokeWidth={3}
          strokeDasharray="10,5"
          rx={20}
        />
        <text x={width / 2} y={160} textAnchor="middle" fontSize={32} fontWeight="600" fill="#84cc16">
          Information flows
        </text>

        {/* Supplier box */}
        <SupplierCustomerBox x={80} y={70} width={140} height={100} label="Supplier" icon="factory" />

        {/* Production control box */}
        <rect x={width / 2 - 100} y={60} width={200} height={60} fill="white" stroke="#111827" strokeWidth={2} />
        <text x={width / 2} y={95} textAnchor="middle" fontSize={14} fontWeight="600" fill="#111827">
          Production control
        </text>

        {/* Customer box */}
        <SupplierCustomerBox x={width - 220} y={70} width={140} height={100} label="Customer" icon="factory" />

        {/* Information arrows */}
        <InformationArrow x1={220} y1={120} x2={width / 2 - 100} y2={90} label="Weekly order" />
        <InformationArrow x1={width / 2 + 100} y1={90} x2={width - 220} y2={120} label="Monthly order" />
      </g>

      <g>
        <rect
          x={40}
          y={260}
          width={width - 80}
          height={340}
          fill="none"
          stroke="#a855f7"
          strokeWidth={3}
          strokeDasharray="10,5"
          rx={20}
        />
        <text x={width / 2} y={380} textAnchor="middle" fontSize={32} fontWeight="600" fill="#a855f7">
          Material flows
        </text>

        {/* Trucks */}
        <TruckIcon x={80} y={290} label="Weekly" />
        <TruckIcon x={width - 140} y={290} label="Monthly" />

        {/* Vertical lines from supplier/customer to processes */}
        <line x1={150} y1={170} x2={150} y2={420} stroke="#111827" strokeWidth={2} />
        <line x1={width - 150} y1={170} x2={width - 150} y2={420} stroke="#111827" strokeWidth={2} />

        {/* Process boxes with data */}
        {layout.nodes.map((node, idx) => (
          <g key={node.id}>
            <ProcessBox x={node.x} y={node.y} width={140} height={80} label={node.name} />
            <DataBox
              x={node.x}
              y={node.y + 90}
              width={140}
              height={90}
              data={[
                `C/T = ${node.data.cycleTime}`,
                `C/O = ${node.data.changeover}`,
                `Uptime = ${node.data.uptime}`,
                `${node.data.shifts} Shifts`,
                `${node.data.availableTime} sec available`,
              ]}
            />

            {/* Inventory triangle between processes */}
            {idx < layout.nodes.length - 1 && (
              <InventoryTriangle x={node.x + 210} y={node.y + 40} size={35} value={layout.nodes[idx + 1].wip} />
            )}

            {/* Push arrows */}
            {idx < layout.nodes.length - 1 && (
              <PushArrow x1={node.x + 140} y1={node.y + 40} x2={node.x + 180} y2={node.y + 40} />
            )}

            {/* Operator icon */}
            <circle cx={node.x + 20} cy={node.y + 60} r={8} fill="none" stroke="#111827" strokeWidth={1.5} />
          </g>
        ))}

        {/* Arrow to shipping */}
        {layout.nodes.length > 0 && (
          <PushArrow
            x1={layout.nodes[layout.nodes.length - 1].x + 140}
            y1={layout.nodes[layout.nodes.length - 1].y + 40}
            x2={width - 180}
            y2={layout.nodes[layout.nodes.length - 1].y + 40}
          />
        )}
      </g>

      <g>
        <rect
          x={40}
          y={620}
          width={width - 80}
          height={240}
          fill="none"
          stroke="#f97316"
          strokeWidth={3}
          strokeDasharray="10,5"
          rx={20}
        />
        <text x={width / 2} y={840} textAnchor="middle" fontSize={32} fontWeight="600" fill="#f97316">
          Lead time ladder
        </text>

        {/* Timeline segments */}
        {layout.nodes.map((node, idx) => {
          const segmentX = node.x
          const segmentWidth = 140
          const days = layout.leadTimeDays[idx] || 1

          return (
            <g key={`timeline-${idx}`}>
              {/* Lead time bar */}
              <rect
                x={segmentX}
                y={660}
                width={segmentWidth}
                height={40}
                fill="white"
                stroke="#111827"
                strokeWidth={2}
              />
              <text x={segmentX + segmentWidth / 2} y={685} textAnchor="middle" fontSize={12} fill="#111827">
                {node.data.cycleTime}
              </text>

              {/* Days label */}
              <text x={segmentX + segmentWidth / 2} y={730} textAnchor="middle" fontSize={11} fill="#f97316">
                {days} day{days > 1 ? "s" : ""}
              </text>

              {/* Connecting line */}
              {idx < layout.nodes.length - 1 && (
                <line
                  x1={segmentX + segmentWidth}
                  y1={680}
                  x2={segmentX + segmentWidth + 60}
                  y2={680}
                  stroke="#f97316"
                  strokeWidth={2}
                />
              )}
            </g>
          )
        })}

        {/* Summary box */}
        <rect x={width - 320} y={720} width={260} height={80} fill="white" stroke="#111827" strokeWidth={2} />
        <text x={width - 190} y={745} textAnchor="middle" fontSize={12} fill="#111827">
          Production lead time = {layout.leadTimeDays.reduce((a, b) => a + b, 0)} days
        </text>
        <line x1={width - 310} y1={755} x2={width - 70} y2={755} stroke="#d1d5db" strokeWidth={1} />
        <text x={width - 190} y={775} textAnchor="middle" fontSize={12} fill="#111827">
          Processing time = {layout.totalProcessTime} sec
        </text>
      </g>
    </svg>
  )
})

VSMGraph.displayName = "VSMGraph"
