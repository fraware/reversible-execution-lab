
import React, { useEffect, useRef, useState } from 'react';
import { useResizeObserver } from '@/hooks/use-resize-observer';

interface Gate {
  type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'SWAP';
  position: number;
  control?: number; // For controlled gates like CNOT
  target?: number;  // For controlled gates or SWAP
}

interface QuantumCircuit {
  qubits: number;
  gates: Gate[];
  name?: string;
  description?: string;
  highlightGate?: number; // Index of gate to highlight
}

interface QuantumCircuitVisualizerProps {
  circuit: QuantumCircuit;
  className?: string;
  highlightGate?: number; // Gate index to highlight
}

export const QuantumCircuitVisualizer: React.FC<QuantumCircuitVisualizerProps> = ({
  circuit,
  className = '',
  highlightGate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Track container size changes
  useResizeObserver(containerRef, (entry) => {
    const { width, height } = entry.contentRect;
    setDimensions({ width, height });
  });

  useEffect(() => {
    if (!canvasRef.current || !dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for sharp rendering
    canvas.width = dimensions.width * 2;
    canvas.height = dimensions.height * 2;
    ctx.scale(2, 2);

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Use either prop highlightGate or circuit's highlightGate
    const activeHighlightGate = highlightGate !== undefined ? 
      highlightGate : 
      circuit.highlightGate;

    drawQuantumCircuit(ctx, circuit, dimensions, activeHighlightGate);
  }, [circuit, dimensions, highlightGate]);

  return (
    <div 
      ref={containerRef} 
      className={`relative border border-muted rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: '200px' }}
    >
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block' 
        }}
      />
      {circuit.name && (
        <div className="absolute top-2 left-2 bg-background/80 px-2 py-1 rounded text-sm font-medium">
          {circuit.name}
        </div>
      )}
    </div>
  );
};

// Helper function to draw the quantum circuit
function drawQuantumCircuit(
  ctx: CanvasRenderingContext2D,
  circuit: QuantumCircuit,
  dimensions: { width: number; height: number },
  highlightGateIndex?: number
) {
  const { qubits, gates } = circuit;
  const { width, height } = dimensions;
  
  // Calculate layout parameters
  const padding = 20;
  const qubitSpacing = (height - padding * 2) / Math.max(2, qubits - 1);
  const maxGatePosition = Math.max(...gates.map(g => g.position), 10);
  const gateSpacing = (width - padding * 2) / maxGatePosition;
  
  // Draw qubit lines
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < qubits; i++) {
    const y = padding + i * qubitSpacing;
    
    // Qubit label (|0⟩, |1⟩, etc.)
    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`|q${i}⟩`, padding - 8, y + 5);
    
    // Qubit line
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
  
  // Draw gates
  for (let i = 0; i < gates.length; i++) {
    const gate = gates[i];
    const x = padding + gate.position * gateSpacing;
    
    // Check if this gate should be highlighted
    const isHighlighted = highlightGateIndex !== undefined && i === highlightGateIndex;
    
    switch (gate.type) {
      case 'H':
      case 'X':
      case 'Y':
      case 'Z':
        drawSingleQubitGate(ctx, gate.type, x, padding + gate.control * qubitSpacing, isHighlighted);
        break;
      case 'CNOT':
        if (typeof gate.control === 'number' && typeof gate.target === 'number') {
          drawCNOTGate(
            ctx, 
            x, 
            padding + gate.control * qubitSpacing, 
            padding + gate.target * qubitSpacing,
            isHighlighted
          );
        }
        break;
      case 'SWAP':
        if (typeof gate.control === 'number' && typeof gate.target === 'number') {
          drawSWAPGate(
            ctx, 
            x, 
            padding + gate.control * qubitSpacing, 
            padding + gate.target * qubitSpacing,
            isHighlighted
          );
        }
        break;
    }
  }
}

function drawSingleQubitGate(
  ctx: CanvasRenderingContext2D, 
  gateType: 'H' | 'X' | 'Y' | 'Z', 
  x: number, 
  y: number,
  highlight: boolean = false
) {
  // Draw gate box
  ctx.fillStyle = getGateColor(gateType);
  ctx.strokeStyle = highlight ? '#f59e0b' : '#000';
  ctx.lineWidth = highlight ? 2 : 1;
  
  const size = 24;
  
  // Draw highlight glow if needed
  if (highlight) {
    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
  }
  
  ctx.fillRect(x - size/2, y - size/2, size, size);
  ctx.strokeRect(x - size/2, y - size/2, size, size);
  
  if (highlight) {
    ctx.restore();
  }
  
  // Draw gate label
  ctx.fillStyle = '#000';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(gateType, x, y);
}

function drawCNOTGate(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  controlY: number, 
  targetY: number,
  highlight: boolean = false
) {
  // Draw vertical line connecting control and target
  ctx.strokeStyle = highlight ? '#f59e0b' : '#000';
  ctx.lineWidth = highlight ? 2 : 1;
  
  // Draw highlight glow if needed
  if (highlight) {
    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
  }
  
  ctx.beginPath();
  ctx.moveTo(x, controlY);
  ctx.lineTo(x, targetY);
  ctx.stroke();
  
  // Draw control point (filled circle)
  ctx.fillStyle = highlight ? '#f59e0b' : '#000';
  ctx.beginPath();
  ctx.arc(x, controlY, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw target (circle with plus)
  const targetSize = 12;
  ctx.beginPath();
  ctx.arc(x, targetY, targetSize, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw the "plus" inside the target
  ctx.beginPath();
  ctx.moveTo(x - targetSize, targetY);
  ctx.lineTo(x + targetSize, targetY);
  ctx.moveTo(x, targetY - targetSize);
  ctx.lineTo(x, targetY + targetSize);
  ctx.stroke();
  
  if (highlight) {
    ctx.restore();
  }
}

function drawSWAPGate(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y1: number, 
  y2: number,
  highlight: boolean = false
) {
  // Draw vertical line connecting the swap points
  ctx.strokeStyle = highlight ? '#f59e0b' : '#000';
  ctx.lineWidth = highlight ? 2 : 1;
  
  // Draw highlight glow if needed
  if (highlight) {
    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
  }
  
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
  
  // Draw X for first qubit
  const size = 8;
  ctx.beginPath();
  ctx.moveTo(x - size, y1 - size);
  ctx.lineTo(x + size, y1 + size);
  ctx.moveTo(x + size, y1 - size);
  ctx.lineTo(x - size, y1 + size);
  ctx.stroke();
  
  // Draw X for second qubit
  ctx.beginPath();
  ctx.moveTo(x - size, y2 - size);
  ctx.lineTo(x + size, y2 + size);
  ctx.moveTo(x + size, y2 - size);
  ctx.lineTo(x - size, y2 + size);
  ctx.stroke();
  
  if (highlight) {
    ctx.restore();
  }
}

function getGateColor(gateType: 'H' | 'X' | 'Y' | 'Z'): string {
  const colors = {
    'H': '#91caff', // Light blue
    'X': '#ffccc7', // Light red
    'Y': '#b7eb8f', // Light green
    'Z': '#d3adf7'  // Light purple
  };
  return colors[gateType];
}

export default QuantumCircuitVisualizer;
