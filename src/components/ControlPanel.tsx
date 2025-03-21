
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  StepBack, 
  StepForward, 
  Play, 
  Pause, 
  RotateCcw,
  Flag,
  FastForward,
  Download,
  Camera,
  Bookmark
} from 'lucide-react';

interface ControlPanelProps {
  onStepBack: () => void;
  onStepForward: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onCheckpoint: () => void;
  onJumpToCheckpoint?: () => void;
  isPlaying: boolean;
  onExport?: () => void;
  onScreenshot?: () => void;
  onFastForward?: () => void;
  isDisabled?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onStepBack,
  onStepForward,
  onPlay,
  onPause,
  onReset,
  onCheckpoint,
  onJumpToCheckpoint,
  isPlaying,
  onExport,
  onScreenshot,
  onFastForward,
  isDisabled = false
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
          disabled={isDisabled}
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
            disabled={isDisabled}
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
            disabled={isDisabled}
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
          disabled={isDisabled}
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
            disabled={isDisabled}
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
        disabled={isDisabled}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={onCheckpoint}
        className="control-button"
        title="Create Checkpoint"
        disabled={isDisabled}
      >
        <Flag className="h-4 w-4" />
      </Button>
      
      {onJumpToCheckpoint && (
        <Button
          variant="outline"
          size="icon"
          onClick={onJumpToCheckpoint}
          className="control-button"
          title="Jump to Checkpoint"
          disabled={isDisabled}
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      )}
      
      {onExport && (
        <Button
          variant="outline"
          size="icon"
          onClick={onExport}
          className="control-button"
          title="Export Debugging Data"
          disabled={isDisabled}
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
          disabled={isDisabled}
        >
          <Camera className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ControlPanel;
