
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  StepBack, 
  StepForward, 
  Play, 
  Pause, 
  RotateCcw,
  Flag
} from 'lucide-react';

interface ControlPanelProps {
  onStepBack: () => void;
  onStepForward: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onCheckpoint: () => void;
  isPlaying: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onStepBack,
  onStepForward,
  onPlay,
  onPause,
  onReset,
  onCheckpoint,
  isPlaying
}) => {
  return (
    <div className="glass-panel p-4 rounded-lg flex items-center gap-2 animate-slide-up">
      <Button
        variant="outline"
        size="icon"
        onClick={onStepBack}
        className="control-button"
      >
        <StepBack className="h-4 w-4" />
      </Button>
      
      {isPlaying ? (
        <Button
          variant="outline"
          size="icon"
          onClick={onPause}
          className="control-button"
        >
          <Pause className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={onPlay}
          className="control-button"
        >
          <Play className="h-4 w-4" />
        </Button>
      )}
      
      <Button
        variant="outline"
        size="icon"
        onClick={onStepForward}
        className="control-button"
      >
        <StepForward className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-2" />
      
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        className="control-button"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={onCheckpoint}
        className="control-button"
      >
        <Flag className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ControlPanel;
