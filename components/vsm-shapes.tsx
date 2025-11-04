"use client"

// Standard VSM Shape Components

export const ProcessBox = ({ x, y, width = 120, height = 80, label, data }: any) => (
  <g>
    <rect x={x} y={y} width={width} height={height} fill="white" stroke="#111827" strokeWidth={2} />
    <text x={x + width / 2} y={y + 25} textAnchor="middle" fontSize={14} fontWeight="600" fill="#111827">
      {label}
    </text>
    {data && (
      <g>
        <line x1={x} y1={y + 35} x2={x + width} y2={y + 35} stroke="#d1d5db" strokeWidth={1} />
        <text x={x + 10} y={y + 50} fontSize={10} fill="#374151">
          C/T = {data.cycleTime}
        </text>
        <text x={x + 10} y={y + 62} fontSize={10} fill="#374151">
          C/O = {data.changeover}
        </text>
        <text x={x + 10} y={y + 74} fontSize={10} fill="#374151">
          Uptime = {data.uptime}
        </text>
      </g>
    )}
  </g>
)

export const InventoryTriangle = ({ x, y, size = 40, value }: any) => (
  <g>
    <polygon
      points={`${x},${y - size} ${x - size / 2},${y} ${x + size / 2},${y}`}
      fill="#fbbf24"
      stroke="#f59e0b"
      strokeWidth={2}
    />
    <text x={x} y={y + 20} textAnchor="middle" fontSize={12} fontWeight="600" fill="#78350f">
      {value}
    </text>
  </g>
)

export const TruckIcon = ({ x, y, label }: any) => (
  <g>
    <rect x={x} y={y} width={50} height={30} fill="#111827" />
    <rect x={x + 30} y={y - 10} width={20} height={10} fill="#111827" />
    <circle cx={x + 15} cy={y + 35} r={5} fill="#374151" />
    <circle cx={x + 40} cy={y + 35} r={5} fill="#374151" />
    <text x={x + 25} y={y + 55} textAnchor="middle" fontSize={10} fill="#111827">
      {label}
    </text>
  </g>
)

export const PushArrow = ({ x1, y1, x2, y2 }: any) => (
  <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111827" strokeWidth={4} />
    <rect x={(x1 + x2) / 2 - 8} y={y1 - 6} width={16} height={12} fill="white" stroke="#111827" strokeWidth={2} />
    <polygon points={`${x2},${y2} ${x2 - 15},${y2 - 8} ${x2 - 15},${y2 + 8}`} fill="#111827" />
  </g>
)

export const DataBox = ({ x, y, width = 100, height = 80, data }: any) => (
  <g>
    <rect x={x} y={y} width={width} height={height} fill="white" stroke="#111827" strokeWidth={1.5} />
    {data.map((item: string, idx: number) => (
      <text key={idx} x={x + 8} y={y + 18 + idx * 14} fontSize={10} fill="#374151">
        {item}
      </text>
    ))}
  </g>
)

export const KaizenBurst = ({ x, y, size = 30 }: any) => {
  const points = []
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8
    const radius = i % 2 === 0 ? size : size / 2
    points.push(`${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`)
  }
  return <polygon points={points.join(" ")} fill="#fef08a" stroke="#eab308" strokeWidth={2} />
}

export const InformationArrow = ({ x1, y1, x2, y2, label }: any) => (
  <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111827" strokeWidth={2} />
    <polygon points={`${x2},${y2} ${x2 - 10},${y2 - 6} ${x2 - 10},${y2 + 6}`} fill="#111827" />
    {label && (
      <text x={(x1 + x2) / 2} y={y1 - 8} textAnchor="middle" fontSize={10} fill="#111827">
        {label}
      </text>
    )}
  </g>
)

export const SupplierCustomerBox = ({ x, y, width = 120, height = 80, label, icon }: any) => (
  <g>
    <rect x={x} y={y} width={width} height={height} fill="white" stroke="#111827" strokeWidth={2} />
    {icon === "factory" && (
      <g>
        <polygon
          points={`${x + 20},${y + 25} ${x + 40},${y + 15} ${x + 60},${y + 15} ${x + 80},${y + 25}`}
          fill="none"
          stroke="#111827"
          strokeWidth={2}
        />
        <rect x={x + 35} y={y + 25} width={10} height={15} fill="none" stroke="#111827" strokeWidth={1} />
        <rect x={x + 55} y={y + 25} width={10} height={15} fill="none" stroke="#111827" strokeWidth={1} />
      </g>
    )}
    <text x={x + width / 2} y={y + height - 15} textAnchor="middle" fontSize={12} fontWeight="600" fill="#111827">
      {label}
    </text>
  </g>
)
