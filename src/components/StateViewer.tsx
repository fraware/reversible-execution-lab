
import React from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StateViewerProps {
  variables: Array<{
    name: string;
    value: any;
    changed: boolean;
  }>;
}

const StateViewer: React.FC<StateViewerProps> = ({ variables }) => {
  return (
    <div className="glass-panel rounded-lg p-4 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Current State</h3>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {variables.map((variable) => (
            <Card
              key={variable.name}
              className={`p-3 ${
                variable.changed ? 'state-change' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm">{variable.name}</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {JSON.stringify(variable.value)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default StateViewer;
