
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuantumCircuitVisualizer from '@/components/QuantumCircuitVisualizer';
import { QuantumCircuit } from '@/types/quantum';

interface SampleCircuitsType {
  [key: string]: QuantumCircuit;
}

interface QuantumCircuitDisplayProps {
  isQuantumMode: boolean;
  quantumCircuit: QuantumCircuit | null;
  currentQuantumCircuit: string;
  setCurrentQuantumCircuit: (value: string) => void;
  sampleQuantumCircuits: SampleCircuitsType;
}

export const QuantumCircuitDisplay: React.FC<QuantumCircuitDisplayProps> = ({
  isQuantumMode,
  quantumCircuit,
  currentQuantumCircuit,
  setCurrentQuantumCircuit,
  sampleQuantumCircuits
}) => {
  return (
    <div className="glass-panel rounded-lg p-4 h-[400px] overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Quantum Circuit Visualization</h2>
      
      {isQuantumMode ? (
        <div className="space-y-4">
          {quantumCircuit ? (
            <>
              <QuantumCircuitVisualizer 
                circuit={quantumCircuit} 
                className="h-[200px] mb-4"
              />
              <p className="text-sm text-muted-foreground">
                {quantumCircuit.description || 'No description provided for this circuit.'}
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] border border-dashed rounded-lg">
              <p className="text-muted-foreground">Invalid quantum circuit code</p>
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue={currentQuantumCircuit} onValueChange={setCurrentQuantumCircuit}>
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
