
import React, { useState } from 'react';
import { Variable } from '@/types/debugger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes } from '@/lib/utils';

interface StateViewerProps {
  variables: Variable[];
  memoryUsage: number;
  executionTime: number;
}

const StateViewer: React.FC<StateViewerProps> = ({ 
  variables, 
  memoryUsage, 
  executionTime 
}) => {
  const [activeTab, setActiveTab] = useState("variables");
  
  return (
    <div className="glass-panel rounded-lg p-4 h-[400px] overflow-auto">
      <Tabs defaultValue="variables" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Execution State</h2>
          <TabsList>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="variables">
          {variables.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Value</th>
                  <th className="text-left p-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((v, idx) => (
                  <tr key={idx} className={v.changed ? "bg-yellow-50 animate-highlight" : ""}>
                    <td className="p-2 font-mono">{v.name}</td>
                    <td className="p-2 font-mono">
                      {v.value === null 
                        ? <span className="text-gray-400">null</span>
                        : typeof v.value === 'object' 
                          ? JSON.stringify(v.value)
                          : String(v.value)
                      }
                    </td>
                    <td className="p-2 text-xs text-gray-500">
                      {v.type || typeof v.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No variables to display yet
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="performance">
          <div className="space-y-4">
            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Memory Usage</h3>
              <div className="text-2xl font-bold mb-1">{formatBytes(memoryUsage)}</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${Math.min((memoryUsage / 1000000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Execution Time</h3>
              <div className="text-2xl font-bold mb-1">
                {executionTime.toFixed(2)} ms
              </div>
              <div className="text-sm text-muted-foreground">
                {executionTime > 1000 
                  ? 'Consider optimizing your code for better performance' 
                  : 'Good performance'}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StateViewer;
