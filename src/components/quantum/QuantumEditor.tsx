
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { parseQuantumCode, sampleQuantumCodes } from '@/lib/quantumCodeParser';
import { QuantumCircuit } from '@/types/quantum';

interface QuantumEditorProps {
  quantumCode: string;
  setQuantumCode: (code: string) => void;
  updateQuantumCircuit: () => void;
}

export const QuantumEditor: React.FC<QuantumEditorProps> = ({
  quantumCode,
  setQuantumCode,
  updateQuantumCircuit
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setQuantumCode(sampleQuantumCodes.bell);
            updateQuantumCircuit();
          }}
          className="flex items-center gap-1"
        >
          Bell State
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setQuantumCode(sampleQuantumCodes.teleportation);
            updateQuantumCircuit();
          }}
          className="flex items-center gap-1"
        >
          Teleportation
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setQuantumCode(sampleQuantumCodes.grover);
            updateQuantumCircuit();
          }}
          className="flex items-center gap-1"
        >
          Grover's
        </Button>
      </div>
      
      <Textarea
        value={quantumCode}
        onChange={(e) => setQuantumCode(e.target.value)}
        className="font-mono text-sm h-[400px] resize-none"
        placeholder="Enter your quantum code here..."
      />
    </div>
  );
};

export default QuantumEditor;
