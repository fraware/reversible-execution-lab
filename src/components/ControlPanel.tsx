
import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  StepBack, 
  StepForward, 
  Play, 
  Pause, 
  RotateCcw,
  Flag,
  FastForward,
  Download,
  Camera
} from 'lucide-react';

interface ControlPanelProps {
  onStepBack: () => void;
  onStepForward: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onCheckpoint: () => void;
  isPlaying: boolean;
  onExport?: () => void;
  onScreenshot?: () => void;
  onFastForward?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onStepBack,
  onStepForward,
  onPlay,
  onPause,
  onReset,
  onCheckpoint,
  isPlaying,
  onExport,
  onScreenshot,
  onFastForward
}) => {
  return (
    <div className="glass-panel p-4 rounded-lg flex flex-wrap items-center gap-2 animate-slide-up">
      <div className="flex items-center gap-2 mr-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onStepBack}
          className="control-button"
          title="Step Backward"
        >
          <StepBack className="h-4 w-4" />
        </Button>
        
        {isPlaying ? (
          <Button
            variant="outline"
            size="icon"
            onClick={onPause}
            className="control-button"
            title="Pause Execution"
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={onPlay}
            className="control-button"
            title="Start Execution"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={onStepForward}
          className="control-button"
          title="Step Forward"
        >
          <StepForward className="h-4 w-4" />
        </Button>
        
        {onFastForward && (
          <Button
            variant="outline"
            size="icon"
            onClick={onFastForward}
            className="control-button"
            title="Fast Forward to Next Checkpoint"
          >
            <FastForward className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
      
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        className="control-button"
        title="Reset Execution"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={onCheckpoint}
        className="control-button"
        title="Create Checkpoint"
      >
        <Flag className="h-4 w-4" />
      </Button>
      
      {onExport && (
        <Button
          variant="outline"
          size="icon"
          onClick={onExport}
          className="control-button"
          title="Export Debugging Data"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
      
      {onScreenshot && (
        <Button
          variant="outline"
          size="icon"
          onClick={onScreenshot}
          className="control-button"
          title="Take Execution Screenshot"
        >
          <Camera className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ControlPanel;
