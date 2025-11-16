import React from 'react';

// ==================== ICON INTERFACES ====================

interface CustomerSupplierProps {
  label?: string;
  width?: number;
  height?: number;
  showLabel?: boolean;
}

interface ProcessProps {
  label?: string;
  width?: number;
  height?: number;
  showOperator?: boolean;
  showLabel?: boolean;
}

interface ArrowProps {
  length?: number;
  showLabel?: boolean;
}

interface TruckProps {
  width?: number;
  showLabel?: boolean;
}

interface ProductionControlProps {
  label?: string;
  width?: number;
  height?: number;
  showLabel?: boolean;
}

interface DataTableProps {
  width?: number;
  height?: number;
  rows?: number;
  showLabel?: boolean;
}

interface InventoryProps {
  size?: number;
  showLabel?: boolean;
}

interface FIFOLaneProps {
  width?: number;
  showLabel?: boolean;
}

interface KaizenBurstProps {
  size?: number;
  showLabel?: boolean;
}

interface KanbanProps {
  width?: number;
  height?: number;
  showLabel?: boolean;
}

interface KanbanPostProps {
  width?: number;
  height?: number;
  showLabel?: boolean;
}

interface SupermarketProps {
  width?: number;
  height?: number;
  showLabel?: boolean;
}

interface PhysicalPullProps {
  size?: number;
  showLabel?: boolean;
}

interface SimpleArrowProps {
  length?: number;
  direction?: 'left' | 'right';
}

// ==================== ICON COMPONENTS ====================

// 1. Customer/Supplier Icon
export const CustomerSupplier: React.FC<CustomerSupplierProps> = ({ 
  label = "Customer", 
  width = 120, 
  height = 80,
  showLabel = true 
}) => (
  <svg width={width} height={height + (showLabel ? 25 : 0)} viewBox={`0 0 ${width} ${height + (showLabel ? 25 : 0)}`}>
    <defs>
      <linearGradient id={`blueGradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    
    <rect x="5" y="20" width={width - 10} height={height - 25} fill={`url(#blueGradient-${label})`} stroke="black" strokeWidth="2"/>
    
    <path 
      d={`M 5 20 L ${width/4} 5 L ${width/4} 20 L ${width/2} 5 L ${width/2} 20 L ${3*width/4} 5 L ${3*width/4} 20 L ${width-5} 5 L ${width-5} 20`}
      fill={`url(#blueGradient-${label})`}
      stroke="black" 
      strokeWidth="2"
    />
    
    {showLabel && (
      <text 
        x={width/2} 
        y={height + 15} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    )}
  </svg>
);

// 2. Process Box
export const Process: React.FC<ProcessProps> = ({ 
  label = "Process", 
  width = 100, 
  height = 80,
  showOperator = true,
  showLabel = true 
}) => (
  <svg width={width} height={height + (showLabel ? 25 : 0)} viewBox={`0 0 ${width} ${height + (showLabel ? 25 : 0)}`}>
    <rect x="5" y="5" width={width - 10} height={height - 10} fill="white" stroke="black" strokeWidth="2"/>
    
    {showOperator && (
      <g transform="translate(12, 65)">
        <circle cx="5" cy="3" r="3" fill="black"/>
        <circle cx="5" cy="10" r="5" fill="black"/>
      </g>
    )}
    
    {showLabel && (
      <text 
        x={width/2} 
        y={height + 15} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    )}
  </svg>
);

// 3. Push Arrow
export const PushArrow: React.FC<ArrowProps> = ({ 
  length = 100, 
  showLabel = true 
}) => (
  <svg width={length} height={showLabel ? 50 : 30} viewBox={`0 0 ${length} ${showLabel ? 50 : 30}`}>
    <rect x="0" y="12" width={length - 20} height="6" fill="black" stroke="black" strokeWidth="1"/>
    
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect 
        key={i}
        x={8 + i * 15} 
        y="12" 
        width="6" 
        height="6" 
        fill="white"
        stroke="black"
        strokeWidth="1"
      />
    ))}
    
    <polygon 
      points={`${length - 20},8 ${length},15 ${length - 20},22`}
      fill="black"
    />
    
    {showLabel && (
      <text 
        x={length/2} 
        y={40} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        Push Arrow
      </text>
    )}
  </svg>
);

// 4. Shipment Arrow
export const ShipmentArrow: React.FC<ArrowProps> = ({ 
  length = 100, 
  showLabel = true 
}) => (
  <svg width={length} height={showLabel ? 50 : 30} viewBox={`0 0 ${length} ${showLabel ? 50 : 30}`}>
    <line x1="0" y1="15" x2={length - 20} y2="15" stroke="black" strokeWidth="2" fill="none"/>
    
    <path 
      d={`M ${length - 20} 5 L ${length} 15 L ${length - 20} 25`}
      fill="white"
      stroke="black"
      strokeWidth="2"
    />
    
    {showLabel && (
      <text 
        x={length/2} 
        y={40} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        Shipment Arrow
      </text>
    )}
  </svg>
);

// 5. Shipment Truck
export const ShipmentTruck: React.FC<TruckProps> = ({ 
  width = 60, 
  showLabel = true 
}) => (
  <svg width={width} height={showLabel ? 60 : 40} viewBox={`0 0 ${width} ${showLabel ? 60 : 40}`}>
    <rect x="15" y="8" width="35" height="15" fill="white" stroke="black" strokeWidth="2"/>
    <rect x="5" y="13" width="15" height="10" fill="white" stroke="black" strokeWidth="2"/>
    <circle cx="15" cy="25" r="4" fill="white" stroke="black" strokeWidth="2"/>
    <circle cx="42" cy="25" r="4" fill="white" stroke="black" strokeWidth="2"/>
    
    {showLabel && (
      <text 
        x={width/2} 
        y={45} 
        textAnchor="middle" 
        fontSize="11" 
        fontFamily="Arial, sans-serif"
      >
        Shipment Truck
      </text>
    )}
  </svg>
);

// 6. Production Control - Updated to match reference
export const ProductionControl: React.FC<ProductionControlProps> = ({ 
  label = "Production Control", 
  width = 160, 
  height = 120,
  showLabel = true 
}) => (
  <svg width={width} height={height + (showLabel ? 25 : 0)} viewBox={`0 0 ${width} ${height + (showLabel ? 25 : 0)}`}>
    {/* Outer box */}
    <rect x="5" y="5" width={width - 10} height={height - 10} fill="white" stroke="black" strokeWidth="2"/>
    
    {/* Inner box for Admin */}
    <rect x="15" y="15" width={width - 30} height="40" fill="#E5E7EB" stroke="black" strokeWidth="2"/>
    <text 
      x={width / 2} 
      y="40" 
      textAnchor="middle" 
      fontSize="16" 
      fontFamily="Arial, sans-serif"
      fontWeight="bold"
    >
      Admin
    </text>
    
    {/* Production Control text */}
    <text 
      x={width / 2} 
      y="80" 
      textAnchor="middle" 
      fontSize="14" 
      fontFamily="Arial, sans-serif"
      fontWeight="bold"
    >
      Production
    </text>
    <text 
      x={width / 2} 
      y="98" 
      textAnchor="middle" 
      fontSize="14" 
      fontFamily="Arial, sans-serif"
      fontWeight="bold"
    >
      Control
    </text>
  </svg>
);

// 7. Manual Information Arrow
export const ManualInformation: React.FC<ArrowProps> = ({ 
  length = 100, 
  showLabel = true 
}) => (
  <svg width={length} height={showLabel ? 50 : 30} viewBox={`0 0 ${length} ${showLabel ? 50 : 30}`}>
    <line x1="0" y1="15" x2={length - 15} y2="15" stroke="black" strokeWidth="2"/>
    
    <polygon 
      points={`${length - 15},8 ${length},15 ${length - 15},22`}
      fill="black"
    />
    
    {showLabel && (
      <text 
        x={length/2} 
        y={40} 
        textAnchor="middle" 
        fontSize="11" 
        fontFamily="Arial, sans-serif"
      >
        Manual Information
      </text>
    )}
  </svg>
);

// 8. Electronic Information Arrow (Thunder Icon)
export const ElectronicInformation: React.FC<ArrowProps> = ({ 
  length = 100, 
  showLabel = true 
}) => (
  <svg width={length} height={showLabel ? 50 : 30} viewBox={`0 0 ${length} ${showLabel ? 50 : 30}`}>
    <line x1="0" y1="15" x2={length - 50} y2="15" stroke="black" strokeWidth="2"/>
    
    <g transform={`translate(${length - 45}, 3)`}>
      <path 
        d="M 12 0 L 2 12 L 10 12 L 8 24 L 22 8 L 14 8 L 16 0 Z"
        fill="black"
        stroke="black"
        strokeWidth="1"
      />
    </g>
    
    <line x1={length - 20} y1="15" x2={length - 15} y2="15" stroke="black" strokeWidth="2"/>
    
    <polygon 
      points={`${length - 15},8 ${length},15 ${length - 15},22`}
      fill="black"
    />
    
    {showLabel && (
      <text 
        x={length/2} 
        y={40} 
        textAnchor="middle" 
        fontSize="11" 
        fontFamily="Arial, sans-serif"
      >
        Electronic Info
      </text>
    )}
  </svg>
);

// 9. Data Table
export const DataTable: React.FC<DataTableProps> = ({ 
  width = 80, 
  height = 80,
  rows = 4,
  showLabel = true 
}) => (
  <svg width={width} height={height + (showLabel ? 25 : 0)} viewBox={`0 0 ${width} ${height + (showLabel ? 25 : 0)}`}>
    <rect x="5" y="5" width={width - 10} height={height - 10} fill="white" stroke="black" strokeWidth="2"/>
    
    {Array.from({ length: rows - 1 }).map((_, i) => (
      <line 
        key={i}
        x1="5" 
        y1={5 + (i + 1) * (height - 10) / rows} 
        x2={width - 5} 
        y2={5 + (i + 1) * (height - 10) / rows}
        stroke="black" 
        strokeWidth="1"
      />
    ))}
    
    {showLabel && (
      <text 
        x={width/2} 
        y={height + 15} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        Data Table
      </text>
    )}
  </svg>
);

// 10. Inventory Triangle
export const Inventory: React.FC<InventoryProps> = ({ 
  size = 50, 
  showLabel = true 
}) => (
  <svg width={size} height={size + (showLabel ? 25 : 0)} viewBox={`0 0 ${size} ${size + (showLabel ? 25 : 0)}`}>
    <polygon 
      points={`${size/2},5 5,${size - 5} ${size - 5},${size - 5}`}
      fill="white"
      stroke="black"
      strokeWidth="2"
    />
    
    {showLabel && (
      <text 
        x={size/2} 
        y={size + 15} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        Inventory
      </text>
    )}
  </svg>
);

// 11. FIFO Lane
export const FIFOLane: React.FC<FIFOLaneProps> = ({ 
  width = 100, 
  showLabel = true 
}) => (
  <svg width={width} height={showLabel ? 55 : 35} viewBox={`0 0 ${width} ${showLabel ? 55 : 35}`}>
    <line x1="0" y1="10" x2={width} y2="10" stroke="black" strokeWidth="2"/>
    <line x1="0" y1="20" x2={width} y2="20" stroke="black" strokeWidth="2"/>
    
    <text 
      x={width/2} 
      y="17" 
      textAnchor="middle" 
      fontSize="10" 
      fontFamily="Arial, sans-serif"
      fontWeight="bold"
    >
      FIFO
    </text>
    
    {showLabel && (
      <text 
        x={width/2} 
        y={40} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        FIFO Lane
      </text>
    )}
  </svg>
);

// 12. Kaizen Burst
export const KaizenBurst: React.FC<KaizenBurstProps> = ({ 
  size = 60, 
  showLabel = true 
}) => (
  <svg width={size} height={size + (showLabel ? 25 : 0)} viewBox={`0 0 ${size} ${size + (showLabel ? 25 : 0)}`}>
    <path
      d={`M ${size/2} 5 L ${size/2 + 5} ${size/2 - 8} L ${size - 5} ${size/2 - 5} L ${size/2 + 8} ${size/2 + 5} L ${size/2 + 5} ${size - 5} L ${size/2} ${size/2 + 8} L ${size/2 - 5} ${size - 5} L ${size/2 - 8} ${size/2 + 5} L 5 ${size/2 - 5} L ${size/2 - 5} ${size/2 - 8} Z`}
      fill="#FFD700"
      stroke="black"
      strokeWidth="2"
    />
    
    {showLabel && (
      <text 
        x={size/2} 
        y={size + 15} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        Kaizen Burst
      </text>
    )}
  </svg>
);

// 13. Production Kanban
export const ProductionKanban: React.FC<KanbanProps> = ({ 
  width = 70, 
  height = 40,
  showLabel = true 
}) => (
  <svg width={width} height={height + (showLabel ? 25 : 0)} viewBox={`0 0 ${width} ${height + (showLabel ? 25 : 0)}`}>
    <rect 
      x="5" 
      y="5" 
      width={width - 10} 
      height={height - 10} 
      rx="5"
      fill="white" 
      stroke="black" 
      strokeWidth="2"
    />
    
    {showLabel && (
      <text 
        x={width/2} 
        y={height + 15} 
        textAnchor="middle" 
        fontSize="11" 
        fontFamily="Arial, sans-serif"
      >
        Production Kanban
      </text>
    )}
  </svg>
);

// 14. Withdrawal Kanban
export const WithdrawalKanban: React.FC<KanbanProps> = ({ 
  width = 70, 
  height = 40,
  showLabel = true 
}) => (
  <svg width={width} height={height + (showLabel ? 25 : 0)} viewBox={`0 0 ${width} ${height + (showLabel ? 25 : 0)}`}>
    <path
      d={`M 10 5 L ${width - 10} 5 Q ${width - 5} 5 ${width - 5} 10 L ${width - 5} ${height - 10} Q ${width - 5} ${height - 5} ${width - 10} ${height - 5} L 10 ${height - 5} Q 5 ${height - 5} 5 ${height - 10} L 5 10 Q 5 5 10 5 Z`}
      fill="white"
      stroke="black"
      strokeWidth="2"
    />
    
    {showLabel && (
      <text 
        x={width/2} 
        y={height + 15} 
        textAnchor="middle" 
        fontSize="11" 
        fontFamily="Arial, sans-serif"
      >
        Withdrawal Kanban
      </text>
    )}
  </svg>
);

// 15. Kanban Post
export const KanbanPost: React.FC<KanbanPostProps> = ({ 
  width = 60, 
  height = 60,
  showLabel = true 
}) => (
  <svg width={width} height={height + (showLabel ? 25 : 0)} viewBox={`0 0 ${width} ${height + (showLabel ? 25 : 0)}`}>
    <path
      d={`M ${width/2 - 3} ${height - 10} L ${width/2 - 3} 15 L ${width/2 - 8} 15 L ${width/2} 5 L ${width/2 + 8} 15 L ${width/2 + 3} 15 L ${width/2 + 3} ${height - 10} Z`}
      fill="white"
      stroke="black"
      strokeWidth="2"
    />
    
    {showLabel && (
      <text 
        x={width/2} 
        y={height + 15} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        Kanban Post
      </text>
    )}
  </svg>
);

// 16. Supermarket
export const Supermarket: React.FC<SupermarketProps> = ({ 
  width = 80, 
  height = 70,
  showLabel = true 
}) => (
  <svg width={width} height={height + (showLabel ? 25 : 0)} viewBox={`0 0 ${width} ${height + (showLabel ? 25 : 0)}`}>
    <line x1="10" y1="10" x2="10" y2={height - 10} stroke="black" strokeWidth="2"/>
    <line x1={width - 10} y1="10" x2={width - 10} y2={height - 10} stroke="black" strokeWidth="2"/>
    
    {[0, 1, 2, 3].map((i) => (
      <line 
        key={i}
        x1="10" 
        y1={10 + i * (height - 20) / 3} 
        x2={width - 10} 
        y2={10 + i * (height - 20) / 3}
        stroke="black" 
        strokeWidth="2"
      />
    ))}
    
    {showLabel && (
      <text 
        x={width/2} 
        y={height + 15} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        Supermarket
      </text>
    )}
  </svg>
);

// 17. Physical Pull
export const PhysicalPull: React.FC<PhysicalPullProps> = ({ 
  size = 50, 
  showLabel = true 
}) => (
  <svg width={size} height={size + (showLabel ? 25 : 0)} viewBox={`0 0 ${size} ${size + (showLabel ? 25 : 0)}`}>
    <path
      d={`M ${size/2} 10 A ${size/3} ${size/3} 0 1 1 ${size/2 + 1} 10`}
      fill="none"
      stroke="black"
      strokeWidth="2"
    />
    
    <polygon 
      points={`${size/2 - 5},8 ${size/2 + 5},8 ${size/2},15`}
      fill="black"
    />
    
    {showLabel && (
      <text 
        x={size/2} 
        y={size + 15} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        Physical Pull
      </text>
    )}
  </svg>
);

// 18. Pull Arrow
export const PullArrow: React.FC<ArrowProps> = ({ 
  length = 100, 
  showLabel = true 
}) => (
  <svg width={length} height={showLabel ? 50 : 30} viewBox={`0 0 ${length} ${showLabel ? 50 : 30}`}>
    <line 
      x1="0" 
      y1="15" 
      x2={length - 15} 
      y2="15" 
      stroke="black" 
      strokeWidth="2"
      strokeDasharray="5,5"
    />
    
    <polygon 
      points={`${length - 15},8 ${length},15 ${length - 15},22`}
      fill="black"
    />
    
    {showLabel && (
      <text 
        x={length/2} 
        y={40} 
        textAnchor="middle" 
        fontSize="12" 
        fontFamily="Arial, sans-serif"
      >
        Pull Arrow
      </text>
    )}
  </svg>
);

// 19. Simple Straight Arrow (for information flow)
export const SimpleArrow: React.FC<SimpleArrowProps> = ({ 
  length = 200,
  direction = 'right' // Always right by default
}) => (
  <svg width={length} height={30} viewBox={`0 0 ${length} 30`}>
    <line 
      x1="0" 
      y1="15" 
      x2={length - 20} 
      y2="15" 
      stroke="black" 
      strokeWidth="2"
    />
    
    {/* Arrow always points right */}
    <polygon 
      points={`${length - 20},8 ${length},15 ${length - 20},22`}
      fill="black"
    />
  </svg>
);

// ==================== EXPORT ALIASES (for backward compatibility) ====================

export const FactoryBox = CustomerSupplier;
export const ProcessBox = Process;
export const InventoryTriangle = Inventory;
export const TruckIcon = ShipmentTruck;
export const ManualInfoArrow = ManualInformation;
export const ElectronicInfoArrow = ElectronicInformation;
export const VSMDataBox = DataTable;