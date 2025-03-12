
import React, { useState } from 'react';
import { ExecutionState } from '@/types/debugger';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Activity, ArrowLeft, ArrowRight } from 'lucide-react';

interface ExecutionTraceVisualizerProps {
  executionStates: ExecutionState[];
  currentStateIndex: number;
  onStateSelect: (index: number) => void;
}

const ExecutionTraceVisualizer: React.FC<ExecutionTraceVisualizerProps> = ({
  executionStates,
  currentStateIndex,
  onStateSelect
}) => {
  const [view, setView] = useState<'timeline' | 'diff'>('timeline');
  
  const handlePrevState = () => {
    if (currentStateIndex > 0) {
      onStateSelect(currentStateIndex - 1);
    }
  };
  
  const handleNextState = () => {
    if (currentStateIndex < executionStates.length - 1) {
      onStateSelect(currentStateIndex + 1);
    }
  };
  
  const currentState = executionStates[currentStateIndex];
  const prevState = currentStateIndex > 0 ? executionStates[currentStateIndex - 1] : null;
  
  const getChangedVariables = () => {
    if (!prevState) return [];
    
    return currentState.variables.filter(variable => {
      const prevVariable = prevState.variables.find(v => v.name === variable.name);
      if (!prevVariable) return true; // New variable
      
      return JSON.stringify(prevVariable.value) !== JSON.stringify(variable.value);
    });
  };
  
  const changedVariables = getChangedVariables();
  
  return (
    <div className="glass-panel rounded-lg p-4 h-[350px] animate-fade-in">
      <Tabs defaultValue="timeline" value={view} onValueChange={(v) => setView(v as 'timeline' | 'diff')}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Execution Trace</h2>
          <TabsList>
            <TabsTrigger value="timeline" className="flex items-center gap-1">
              <Clock size={14} />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="diff" className="flex items-center gap-1">
              <Activity size={14} />
              Changes
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePrevState}
            disabled={currentStateIndex <= 0}
          >
            <ArrowLeft size={14} className="mr-1" />
            Previous
          </Button>
          
          <Badge variant="outline">
            Step {currentStateIndex + 1} of {executionStates.length}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextState}
            disabled={currentStateIndex >= executionStates.length - 1}
          >
            Next
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
        
        <TabsContent value="timeline">
          <ScrollArea className="h-[220px]">
            <div className="space-y-1">
              {executionStates.map((state, index) => (
                <div
                  key={index}
                  className={`relative p-2 rounded cursor-pointer transition-colors ${
                    index === currentStateIndex
                      ? 'bg-primary/10 border-l-2 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onStateSelect(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        Line {state.line}
                      </Badge>
                      
                      {state.variables.some(v => v.changed) && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Changes
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(state.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="diff">
          <ScrollArea className="h-[220px]">
            {prevState ? (
              changedVariables.length > 0 ? (
                <div className="space-y-2">
                  {changedVariables.map(variable => {
                    const prevVariable = prevState.variables.find(v => v.name === variable.name);
                    const prevValue = prevVariable ? prevVariable.value : 'undefined';
                    
                    return (
                      <div key={variable.name} className="p-2 border rounded">
                        <div className="font-medium">{variable.name}</div>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="text-xs">
                            <div className="text-muted-foreground mb-1">Before:</div>
                            <div className="bg-muted/50 p-1 rounded font-mono">
                              {JSON.stringify(prevValue, null, 2)}
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="text-muted-foreground mb-1">After:</div>
                            <div className="bg-muted/50 p-1 rounded font-mono">
                              {JSON.stringify(variable.value, null, 2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No variable changes in this step
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Initial state - no previous values to compare
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutionTraceVisualizer;
