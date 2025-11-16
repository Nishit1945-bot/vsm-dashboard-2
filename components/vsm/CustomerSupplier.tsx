import React from 'react';

interface CustomerSupplierProps {
  label?: string;
  width?: number;
  height?: number;
  showLabel?: boolean;
}

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
    
    {/* Factory/Building shape with sawtooth roof */}
    <rect x="5" y="20" width={width - 10} height={height - 25} fill={`url(#blueGradient-${label})`} stroke="black" strokeWidth="2"/>
    
    {/* Sawtooth roof - 3 peaks */}
    <path 
      d={`M 5 20 L ${width/4} 5 L ${width/4} 20 L ${width/2} 5 L ${width/2} 20 L ${3*width/4} 5 L ${3*width/4} 20 L ${width-5} 5 L ${width-5} 20`}
      fill={`url(#blueGradient-${label})`}
      stroke="black" 
      strokeWidth="2"
    />
    
    {/* Label */}
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