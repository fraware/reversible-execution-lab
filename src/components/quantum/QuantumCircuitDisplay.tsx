
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuantumCircuitVisualizer from '@/components/QuantumCircuitVisualizer';
import { QuantumCircuit, QuantumCircuitName } from '@/types/quantum';

interface SampleCircuitsType {
  [key: string]: QuantumCircuit;
}

interface QuantumCircuitDisplayProps {
  isQuantumMode: boolean;
  quantumCircuit: QuantumCircuit | null;
  currentQuantumCircuit: string;
  setCurrentQuantumCircuit: (value: string) => void;
  sampleQuantumCircuits: SampleCircuitsType;
  currentStep?: number;
  highlightGate?: number;
}

export const QuantumCircuitDisplay: React.FC<QuantumCircuitDisplayProps> = ({
  isQuantumMode,
  quantumCircuit,
  currentQuantumCircuit,
  setCurrentQuantumCircuit,
  sampleQuantumCircuits,
  currentStep = 0,
  highlightGate
}) => {
  // Calculate which gates to show based on current step
  const visibleCircuit = React.useMemo(() => {
    if (!quantumCircuit) return null;
    
    // In step mode, only show gates up to the current step
    if (highlightGate !== undefined && isQuantumMode) {
      return {
        ...quantumCircuit,
        gates: quantumCircuit.gates.slice(0, highlightGate + 1),
        highlightGate: highlightGate
      };
    }
    
    return quantumCircuit;
  }, [quantumCircuit, highlightGate, isQuantumMode]);
  
  return (
    <div className="glass-panel rounded-lg p-4 h-[400px] overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Quantum Circuit Visualization</h2>
      
      {isQuantumMode ? (
        <div className="space-y-4">
          {visibleCircuit ? (
            <>
              <QuantumCircuitVisualizer 
                circuit={visibleCircuit} 
                className="h-[200px] mb-4"
                highlightGate={highlightGate}
              />
              <p className="text-sm text-muted-foreground">
                {visibleCircuit.description || 'No description provided for this circuit.'}
              </p>
              {currentStep > 0 && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Visualizing up to step {currentStep}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] border border-dashed rounded-lg">
              <p className="text-muted-foreground">Invalid quantum circuit code</p>
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue={currentQuantumCircuit} onValueChange={(value) => setCurrentQuantumCircuit(value as QuantumCircuitName)}>
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-4">
            <TabsTrigger value="bell">Bell State</TabsTrigger>
            <TabsTrigger value="teleportation">Teleportation</TabsTrigger>
            <TabsTrigger value="grover">Grover's</TabsTrigger>
          </TabsList>
          
          <div className="mt-2">
            <QuantumCircuitVisualizer 
              circuit={sampleQuantumCircuits[currentQuantumCircuit]} 
              className="h-[200px] mb-4"
            />
            <p className="text-sm text-muted-foreground">
              {sampleQuantumCircuits[currentQuantumCircuit].description}
              {currentQuantumCircuit === 'bell' && ' This demonstrates quantum entanglement, a fundamental concept in quantum computing.'}
              {currentQuantumCircuit === 'teleportation' && ' Quantum teleportation enables moving quantum information between distant qubits.'}
              {currentQuantumCircuit === 'grover' && ' Grover\'s algorithm provides a quadratic speedup for searching unstructured databases.'}
            </p>
          </div>
        </Tabs>
      )}
    </div>
  );
};

export default QuantumCircuitDisplay;
