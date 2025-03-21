
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { QuantumCircuit, QuantumState } from '@/types/quantum';
import { executeQuantumCircuit, formatQuantumState } from '@/lib/quantumExecutionEngine';
import { useToast } from '@/components/ui/use-toast';

interface QuantumExecutionPanelProps {
  quantumCircuit: QuantumCircuit | null;
}

export const QuantumExecutionPanel: React.FC<QuantumExecutionPanelProps> = ({
  quantumCircuit
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [quantumStates, setQuantumStates] = useState<QuantumState[]>([]);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const { toast } = useToast();

  const handleReset = () => {
    setCurrentStep(0);
    setQuantumStates([]);
    setExecutionTime(0);
    setIsExecuting(false);
  };

  const handleStepForward = () => {
    if (currentStep < quantumStates.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExecute = async () => {
    if (!quantumCircuit) {
      toast({
        title: "Execution Error",
        description: "No valid quantum circuit to execute",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExecuting(true);
      handleReset();

      const states: QuantumState[] = [];
      
      // Add initial state before any gates are applied
      const result = await executeQuantumCircuit(quantumCircuit, (state, step) => {
        states.push({ ...state });
        setQuantumStates([...states]);
        setCurrentStep(step);
      });

      setQuantumStates([result.initialState, ...result.intermediateStates]);
      setExecutionTime(result.executionTime);
      setIsExecuting(false);
      
      toast({
        title: "Execution Complete",
        description: `Executed ${quantumCircuit.gates.length} gates in ${result.executionTime.toFixed(2)}ms`,
      });
    } catch (error) {
      setIsExecuting(false);
      toast({
        title: "Execution Error",
        description: error instanceof Error ? error.message : "Failed to execute quantum circuit",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="font-mono text-sm h-[400px] overflow-auto border p-4 rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Quantum Circuit Execution</h3>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            disabled={isExecuting || quantumStates.length === 0}
          >
            <RotateCcw size={14} className="mr-1" />
            Reset
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleStepBackward}
            disabled={isExecuting || currentStep === 0}
          >
            <ChevronLeft size={14} />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleStepForward}
            disabled={isExecuting || currentStep >= quantumStates.length - 1}
          >
            <ChevronRight size={14} />
          </Button>
          
          <Button 
            variant={isExecuting ? "secondary" : "default"} 
            size="sm" 
            onClick={isExecuting ? () => {} : handleExecute}
            disabled={!quantumCircuit || isExecuting}
          >
            {isExecuting ? (
              <>
                <Pause size={14} className="mr-1" />
                Running...
              </>
            ) : (
              <>
                <Play size={14} className="mr-1" />
                Run Circuit
              </>
            )}
          </Button>
        </div>
      </div>
      
      {quantumCircuit ? (
        <>
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">
              Circuit: {quantumCircuit.name || 'Unnamed Circuit'} ({quantumCircuit.qubits} qubits, {quantumCircuit.gates.length} gates)
            </div>
            
            {/* Execution progress */}
            {quantumStates.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>
                    Step {currentStep}/{quantumStates.length - 1}
                  </span>
                  <span>
                    {executionTime > 0 && `${executionTime.toFixed(2)}ms`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all" 
                    style={{ 
                      width: `${quantumStates.length > 1 
                        ? (currentStep / (quantumStates.length - 1)) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Current quantum state */}
            <div className="border rounded-md p-3 bg-muted/10">
              <div className="text-xs font-semibold mb-2">Quantum State:</div>
              <ScrollArea className="h-[200px]">
                {quantumStates.length > 0 ? (
                  <pre className="text-xs whitespace-pre-wrap">
                    {formatQuantumState(quantumStates[currentStep])}
                  </pre>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Click "Run Circuit" to see the quantum state evolution
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          
          {/* Active gate info */}
          {quantumStates.length > 0 && currentStep > 0 && (
            <div className="mt-4 border-t pt-2">
              <div className="text-xs font-semibold mb-1">Active Gate:</div>
              <div className="text-xs">
                {currentStep > 0 && quantumCircuit.gates[currentStep - 1] && (
                  <div className="flex items-center">
                    <span className="font-bold mr-2">
                      {quantumCircuit.gates[currentStep - 1].type}
                    </span>
                    {quantumCircuit.gates[currentStep - 1].type === 'CNOT' ? (
                      <span>
                        Control: q{quantumCircuit.gates[currentStep - 1].control}, 
                        Target: q{quantumCircuit.gates[currentStep - 1].target}
                      </span>
                    ) : (
                      <span>
                        Qubit: q{quantumCircuit.gates[currentStep - 1].control}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No valid quantum circuit
        </div>
      )}
    </div>
  );
};

export default QuantumExecutionPanel;
