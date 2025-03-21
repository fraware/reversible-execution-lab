
import React from 'react';
import { Button } from "@/components/ui/button";
import { Code, Cpu, Share2 } from 'lucide-react';

interface QuantumModeSelectorProps {
  language: string;
  isQuantumMode: boolean;
  setIsQuantumMode: (value: boolean) => void;
  handleSwitchLanguage: (language: string) => void;
  setCode: (code: string) => void;
  sampleDataStructureCode: string;
}

export const QuantumModeSelector: React.FC<QuantumModeSelectorProps> = ({
  language,
  isQuantumMode,
  setIsQuantumMode,
  handleSwitchLanguage,
  setCode,
  sampleDataStructureCode
}) => {
  const handleToggleQuantumMode = () => {
    setIsQuantumMode(!isQuantumMode);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button 
        variant={language === 'python' && !isQuantumMode ? 'default' : 'outline'} 
        size="sm"
        onClick={() => {
          setIsQuantumMode(false);
          handleSwitchLanguage('python');
        }}
        className="flex items-center gap-1"
      >
        <Code size={16} />
        Python
      </Button>
      
      <Button 
        variant={language === 'javascript' && !isQuantumMode ? 'default' : 'outline'} 
        size="sm"
        onClick={() => {
          setIsQuantumMode(false);
          handleSwitchLanguage('javascript');
        }}
        className="flex items-center gap-1"
      >
        <Code size={16} />
        JavaScript
      </Button>
      
      <Button
        variant={!isQuantumMode ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggleQuantumMode}
        className="flex items-center gap-1"
      >
        <Cpu size={16} />
        Quantum Mode
      </Button>
      
      {!isQuantumMode && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCode(sampleDataStructureCode)}
          className="flex items-center gap-1"
        >
          <Share2 size={16} />
          Use Data Structure Example
        </Button>
      )}
    </div>
  );
};

export default QuantumModeSelector;
