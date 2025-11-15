// components/vsm/VSMIcons.tsx

// Factory Box (Customer/Supplier with sawtooth roof)
export const FactoryBox = ({ x, y, label }: { x: number; y: number; label: string }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="0" y="20" width="150" height="80" fill="white" stroke="black" strokeWidth="2" />
    <path d="M 0,20 L 30,0 L 60,20 L 90,0 L 120,20 L 150,0 L 150,20 Z" fill="white" stroke="black" strokeWidth="2" />
    <text x="75" y="65" textAnchor="middle" className="font-semibold text-base">{label}</text>
  </g>
);

// Process Box
export const ProcessBox = ({ x, y, name, data }: { x: number; y: number; name: string; data: string[] }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect width="140" height="100" fill="white" stroke="black" strokeWidth="2" />
    <text x="70" y="25" textAnchor="middle" className="font-semibold text-sm">{name}</text>
    
    <g transform="translate(15, 35)">
      <circle cx="10" cy="10" r="10" fill="white" stroke="black" strokeWidth="1.5" />
      <circle cx="10" cy="8" r="3" fill="black" />
      <ellipse cx="10" cy="15" rx="5" ry="4" fill="black" />
    </g>
    
    <g transform="translate(10, 55)">
      <rect width="120" height="40" fill="white" stroke="black" strokeWidth="1" />
      <line x1="0" y1="10" x2="120" y2="10" stroke="black" strokeWidth="0.5" />
      <line x1="0" y1="20" x2="120" y2="20" stroke="black" strokeWidth="0.5" />
      <line x1="0" y1="30" x2="120" y2="30" stroke="black" strokeWidth="0.5" />
      {data.slice(0, 4).map((line, i) => (
        <text key={i} x="5" y={8 + (i * 10)} className="text-[9px]">{line}</text>
      ))}
    </g>
  </g>
);

// Inventory Triangle
export const InventoryTriangle = ({ x, y, quantity }: { x: number; y: number; quantity: string }) => (
  <g transform={`translate(${x}, ${y})`}>
    <polygon points="25,0 0,50 50,50" fill="#FFD700" stroke="black" strokeWidth="2" />
    <text x="25" y="65" textAnchor="middle" className="font-bold text-sm">{quantity}</text>
  </g>
);

// Truck Icon
export const TruckIcon = ({ x, y, label }: { x: number; y: number; label: string }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="0" y="5" width="20" height="20" fill="black" />
    <rect x="20" y="0" width="35" height="25" fill="black" />
    <circle cx="12" cy="30" r="6" fill="black" />
    <circle cx="45" cy="30" r="6" fill="black" />
    <text x="27" y="50" textAnchor="middle" className="text-xs font-medium">{label}</text>
  </g>
);

// Production Control
export const ProductionControl = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect width="180" height="70" fill="white" stroke="black" strokeWidth="2" />
    <text x="90" y="45" textAnchor="middle" className="font-bold text-lg">Production control</text>
  </g>
);

// Push Arrow
export const PushArrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => {
  const midX = (x1 + x2) / 2;
  
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - 12} y2={y2} stroke="black" strokeWidth="4" />
      <polygon points={`${x2-12},${y2-6} ${x2},${y2} ${x2-12},${y2+6}`} fill="black" />
      
      <rect x={midX - 30} y={y1 - 6} width="12" height="12" fill="black" />
      <rect x={midX - 15} y={y1 - 6} width="12" height="12" fill="white" stroke="black" strokeWidth="1" />
      <rect x={midX} y={y1 - 6} width="12" height="12" fill="black" />
    </g>
  );
};

// Manual Info Arrow
export const ManualInfoArrow = ({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label?: string }) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - 10} y2={y2} stroke="black" strokeWidth="2" />
      <polygon points={`${x2-10},${y2-5} ${x2},${y2} ${x2-10},${y2+5}`} fill="black" />
      {label && (
        <text x={midX} y={midY - 8} textAnchor="middle" className="text-xs italic">{label}</text>
      )}
    </g>
  );
};

// Electronic Info Arrow (zigzag)
export const ElectronicInfoArrow = ({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label?: string }) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const zigzagPath = `M ${x1} ${y1} L ${x1 + 20} ${y1 - 10} L ${x1 + 40} ${y1 + 10} L ${x1 + 60} ${y1 - 10} L ${x2 - 10} ${y2}`;
  
  return (
    <g>
      <path d={zigzagPath} stroke="black" strokeWidth="2" fill="none" />
      <polygon points={`${x2-10},${y2-5} ${x2},${y2} ${x2-10},${y2+5}`} fill="black" />
      {label && (
        <text x={midX} y={midY - 12} textAnchor="middle" className="text-xs italic">{label}</text>
      )}
    </g>
  );
};

// Shipment Arrow
export const ShipmentArrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => {
  const midY1 = y1 - 10;
  const midY2 = y1 + 10;
  
  return (
    <g>
      <line x1={x1} y1={y1 - 30} x2={x1} y2={y1} stroke="black" strokeWidth="2" />
      <polygon 
        points={`${x1},${midY1} ${x2-15},${midY1} ${x2-15},${y1-15} ${x2},${y1} ${x2-15},${y1+15} ${x2-15},${midY2} ${x1},${midY2}`}
        fill="white" 
        stroke="black" 
        strokeWidth="2"
      />
    </g>
  );
};

// Data Table (for summary box)
export const DataTable = ({ x, y, width = 120, data }: { x: number; y: number; width?: number; data: string[] }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect width={width} height={data.length * 18 + 10} fill="white" stroke="black" strokeWidth="2" />
    {data.map((line, i) => (
      <g key={i}>
        {i > 0 && <line x1="5" y1={i * 18 + 5} x2={width - 5} y2={i * 18 + 5} stroke="black" strokeWidth="1" />}
        <text x={width/2} y={18 + (i * 18)} textAnchor="middle" className="text-xs font-medium">{line}</text>
      </g>
    ))}
  </g>
);