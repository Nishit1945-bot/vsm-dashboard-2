"use client"

import { useMemo, forwardRef } from "react"

type VSMProcess = {
  id: string
  name: string
  cycleTimeSec?: number
  changeoverSec?: number
  uptimePct?: number
  wipUnits?: number
}

type VSMDataset = {
  customerDemandPerDay?: number
  processes: VSMProcess[]
}

function hashString(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return (h >>> 0) & 0x7fffffff
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normalizeDataset(ds: VSMDataset): string {
  const copy = {
    customerDemandPerDay: ds.customerDemandPerDay ?? 0,
    processes: [...ds.processes]
      .map((p) => ({
        id: p.id,
        name: p.name.trim().toLowerCase(),
        cycleTimeSec: p.cycleTimeSec ?? 0,
        changeoverSec: p.changeoverSec ?? 0,
        uptimePct: p.uptimePct ?? 100,
        wipUnits: p.wipUnits ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }
  return JSON.stringify(copy)
}

interface VSMGraphProps {
  dataset: VSMDataset
  width?: number
  height?: number
}

export const VSMGraph = forwardRef<SVGSVGElement, VSMGraphProps>(({ dataset, width = 1200, height = 600 }, ref) => {
  const layout = useMemo(() => {
    const seed = hashString(normalizeDataset(dataset))
    const rnd = mulberry32(seed)

    const PADDING = 60
    const PROCESS_WIDTH = 160
    const PROCESS_HEIGHT = 120
    const VERTICAL_CENTER = height / 2

    // Calculate positions for process boxes
    const processCount = dataset.processes.length
    const totalWidth = width - 2 * PADDING
    const spacing = processCount > 1 ? (totalWidth - PROCESS_WIDTH) / (processCount - 1) : 0

    const nodes = dataset.processes.map((p, idx) => {
      const x = PADDING + idx * spacing
      const y = VERTICAL_CENTER - PROCESS_HEIGHT / 2
      return {
        id: p.id,
        name: p.name,
        x,
        y,
        width: PROCESS_WIDTH,
        height: PROCESS_HEIGHT,
        data: p,
      }
    })

    // Calculate edges (material flow arrows)
    const edges = nodes.slice(0, -1).map((n, i) => {
      const nextNode = nodes[i + 1]
      return {
        from: n.id,
        to: nextNode.id,
        x1: n.x + n.width,
        y1: n.y + n.height / 2,
        x2: nextNode.x,
        y2: nextNode.y + nextNode.height / 2,
        wip: dataset.processes[i + 1]?.wipUnits ?? 0,
      }
    })

    // Calculate takt time
    const taktSec =
      dataset.customerDemandPerDay && dataset.customerDemandPerDay > 0
        ? Math.round((8 * 60 * 60) / dataset.customerDemandPerDay)
        : undefined

    // Calculate total lead time and process time
    const totalProcessTime = dataset.processes.reduce((sum, p) => sum + (p.cycleTimeSec ?? 0), 0)
    const totalLeadTime = dataset.processes.reduce(
      (sum, p, i) =>
        sum + (p.cycleTimeSec ?? 0) + (i > 0 ? (p.wipUnits ?? 0) * (dataset.processes[i - 1].cycleTimeSec ?? 0) : 0),
      0,
    )

    return { nodes, edges, taktSec, totalProcessTime, totalLeadTime }
  }, [dataset, width, height])

  return (
    <svg ref={ref} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white">
      {/* Title and metrics */}
      <g>
        <text x={20} y={35} fontSize={24} fontWeight="bold" fill="#111827">
          Value Stream Map - Foundry Process
        </text>
        {layout.taktSec && (
          <text x={20} y={60} fontSize={14} fill="#6b7280">
            Takt Time: {layout.taktSec}s | Process Time: {layout.totalProcessTime}s | Lead Time:{" "}
            {Math.round(layout.totalLeadTime)}s
          </text>
        )}
      </g>

      {/* Customer/Supplier boxes at top */}
      <g>
        {/* Supplier */}
        <rect x={50} y={100} width={100} height={60} rx={8} fill="#f3f4f6" stroke="#111827" strokeWidth={2} />
        <text x={100} y={125} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#111827">
          Supplier
        </text>
        <text x={100} y={145} textAnchor="middle" fontSize={10} fill="#6b7280">
          Raw Materials
        </text>

        {/* Customer */}
        <rect x={width - 150} y={100} width={100} height={60} rx={8} fill="#f3f4f6" stroke="#111827" strokeWidth={2} />
        <text x={width - 100} y={125} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#111827">
          Customer
        </text>
        {dataset.customerDemandPerDay && (
          <text x={width - 100} y={145} textAnchor="middle" fontSize={10} fill="#6b7280">
            {dataset.customerDemandPerDay} units/day
          </text>
        )}
      </g>

      {/* Information flow (top) */}
      <g>
        <line
          x1={150}
          y1={130}
          x2={width - 150}
          y2={130}
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5,5"
          markerEnd="url(#info-arrow)"
        />
        <text x={width / 2} y={120} textAnchor="middle" fontSize={11} fill="#3b82f6" fontWeight="500">
          Information Flow
        </text>
      </g>

      {/* Process boxes */}
      {layout.nodes.map((node) => (
        <g key={node.id}>
          {/* Main process box */}
          <rect
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            rx={12}
            fill="#ffffff"
            stroke="#111827"
            strokeWidth={2.5}
          />

          {/* Process name */}
          <text
            x={node.x + node.width / 2}
            y={node.y + 28}
            textAnchor="middle"
            fontSize={15}
            fontWeight="bold"
            fill="#111827"
          >
            {node.name}
          </text>

          {/* Data box below process name */}
          <rect
            x={node.x + 10}
            y={node.y + 40}
            width={node.width - 20}
            height={70}
            rx={6}
            fill="#f9fafb"
            stroke="#d1d5db"
            strokeWidth={1}
          />

          {/* Metrics */}
          <text x={node.x + 20} y={node.y + 58} fontSize={11} fill="#374151">
            C/T: <tspan fontWeight="600">{node.data.cycleTimeSec ?? "-"}s</tspan>
          </text>
          <text x={node.x + 20} y={node.y + 75} fontSize={11} fill="#374151">
            C/O: <tspan fontWeight="600">{node.data.changeoverSec ?? "-"}s</tspan>
          </text>
          <text x={node.x + 20} y={node.y + 92} fontSize={11} fill="#374151">
            Uptime: <tspan fontWeight="600">{node.data.uptimePct ?? "-"}%</tspan>
          </text>

          {/* Connection to information flow */}
          <line
            x1={node.x + node.width / 2}
            y1={160}
            x2={node.x + node.width / 2}
            y2={node.y}
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="3,3"
          />
        </g>
      ))}

      {/* Material flow arrows and WIP */}
      {layout.edges.map((edge, idx) => (
        <g key={`edge-${idx}`}>
          {/* Arrow */}
          <line
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke="#111827"
            strokeWidth={3}
            markerEnd="url(#material-arrow)"
          />

          {/* WIP triangle */}
          {edge.wip > 0 && (
            <g>
              <polygon
                points={`${(edge.x1 + edge.x2) / 2},${edge.y1 - 25} ${(edge.x1 + edge.x2) / 2 - 15},${edge.y1 - 5} ${(edge.x1 + edge.x2) / 2 + 15},${edge.y1 - 5}`}
                fill="#fbbf24"
                stroke="#f59e0b"
                strokeWidth={2}
              />
              <text
                x={(edge.x1 + edge.x2) / 2}
                y={edge.y1 - 12}
                textAnchor="middle"
                fontSize={11}
                fontWeight="bold"
                fill="#78350f"
              >
                {edge.wip}
              </text>
            </g>
          )}
        </g>
      ))}

      {/* Timeline at bottom */}
      <g>
        <line
          x1={60}
          y1={height - 60}
          x2={width - 60}
          y2={height - 60}
          stroke="#6b7280"
          strokeWidth={2}
          markerEnd="url(#timeline-arrow)"
        />
        <text x={60} y={height - 70} fontSize={12} fontWeight="600" fill="#374151">
          Material Flow Timeline
        </text>

        {/* Timeline segments for each process */}
        {layout.nodes.map((node, idx) => {
          const segmentStart = 60 + (idx * (width - 120)) / layout.nodes.length
          const segmentWidth = (width - 120) / layout.nodes.length
          return (
            <g key={`timeline-${idx}`}>
              <rect
                x={segmentStart}
                y={height - 55}
                width={segmentWidth - 10}
                height={8}
                fill="#3b82f6"
                opacity={0.6}
              />
              <text
                x={segmentStart + segmentWidth / 2}
                y={height - 35}
                textAnchor="middle"
                fontSize={10}
                fill="#374151"
              >
                {node.data.cycleTimeSec ?? 0}s
              </text>
            </g>
          )
        })}
      </g>

      {/* Arrow markers */}
      <defs>
        <marker
          id="material-arrow"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#111827" />
        </marker>
        <marker
          id="info-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L7,3 z" fill="#3b82f6" />
        </marker>
        <marker
          id="timeline-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L7,3 z" fill="#6b7280" />
        </marker>
      </defs>
    </svg>
  )
})

VSMGraph.displayName = "VSMGraph"
