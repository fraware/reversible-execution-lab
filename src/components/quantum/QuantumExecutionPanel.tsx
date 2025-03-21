
import React from 'react';
import { QuantumCircuit } from '@/types/quantum';

interface QuantumExecutionPanelProps {
  quantumCircuit: QuantumCircuit | null;
}

export const QuantumExecutionPanel: React.FC<QuantumExecutionPanelProps> = ({
  quantumCircuit
}) => {
  return (
    <div className="font-mono text-sm h-[400px] overflow-auto border p-4 rounded-md">
      <h3 className="text-lg font-medium mb-2">Quantum Circuit Execution</h3>
      <pre className="text-xs">
        {quantumCircuit ? (
          <>
            <p>Circuit: {quantumCircuit.name}</p>
            <p>Qubits: {quantumCircuit.qubits}</p>
            <p>Gates: {quantumCircuit.gates.length}</p>
          </>
        ) : (
          'No valid quantum circuit'
        )}
      </pre>
    </div>
  );
};

export default QuantumExecutionPanel;
