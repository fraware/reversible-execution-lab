
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Variable } from '@/types/debugger';

interface StateViewerProps {
  variables: Variable[];
  memoryUsage?: number;
  executionTime?: number;
}

const StateViewer: React.FC<StateViewerProps> = ({ 
  variables, 
  memoryUsage,
  executionTime 
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'tree' | 'chart'>('table');
  
  // Transform variables for chart visualization
  const chartData = variables.map(v => ({
    name: v.name,
    value: typeof v.value === 'number' ? v.value : 
           typeof v.value === 'string' ? v.value.length :
           typeof v.value === 'object' ? Object.keys(v.value || {}).length : 0
  }));
  
  // Group variables by scope
  const variablesByScope: Record<string, Variable[]> = {};
  variables.forEach(v => {
    const scope = v.scope || 'global';
    if (!variablesByScope[scope]) {
      variablesByScope[scope] = [];
    }
    variablesByScope[scope].push(v);
  });

  return (
    <div className="glass-panel rounded-lg p-4 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">State Explorer</h3>
        <Tabs 
          defaultValue="table" 
          onValueChange={(v) => setViewMode(v as 'table' | 'tree' | 'chart')}
          className="w-[300px]"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="tree">Tree</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Stats row */}
      {(memoryUsage !== undefined || executionTime !== undefined) && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {memoryUsage !== undefined && (
            <Card className="p-3 bg-primary/5">
              <div className="text-xs text-muted-foreground">Memory Usage</div>
              <div className="text-lg font-medium">
                {memoryUsage < 1024 ? `${memoryUsage} bytes` : 
                 memoryUsage < 1048576 ? `${(memoryUsage / 1024).toFixed(2)} KB` : 
                 `${(memoryUsage / 1048576).toFixed(2)} MB`}
              </div>
            </Card>
          )}
          
          {executionTime !== undefined && (
            <Card className="p-3 bg-primary/5">
              <div className="text-xs text-muted-foreground">Execution Time</div>
              <div className="text-lg font-medium">
                {executionTime < 1000 ? `${executionTime.toFixed(2)} ms` : 
                 `${(executionTime / 1000).toFixed(2)} s`}
              </div>
            </Card>
          )}
        </div>
      )}
      
      <TabsContent value="table" className="mt-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {Object.entries(variablesByScope).map(([scope, vars]) => (
              <div key={scope} className="mb-3">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                  {scope} Scope
                </h4>
                {vars.map((variable) => (
                  <Card
                    key={variable.name}
                    className={`p-3 mb-2 ${
                      variable.changed ? 'bg-primary/10 border-primary transition-colors duration-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-mono text-sm">{variable.name}</span>
                        {variable.type && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {variable.type}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-sm text-muted-foreground max-w-[180px] truncate">
                        {JSON.stringify(variable.value)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="tree" className="mt-0">
        <ScrollArea className="h-[300px]">
          <div className="p-2 font-mono text-sm">
            {renderVariableTree(variables)}
          </div>
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="chart" className="mt-0">
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                width={500}
                height={300}
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No numeric data available to chart
            </div>
          )}
        </div>
      </TabsContent>
    </div>
  );
};

// Helper function to render variable tree for complex objects
function renderVariableTree(variables: Variable[], level = 0): JSX.Element {
  return (
    <div className="pl-2 border-l border-border">
      {variables.map((variable) => {
        const isObject = 
          variable.value !== null && 
          typeof variable.value === 'object' &&
          !Array.isArray(variable.value);
          
        const isArray = Array.isArray(variable.value);
        
        return (
          <div key={variable.name} className="py-1">
            <div className={`flex items-center ${variable.changed ? 'text-primary font-medium' : ''}`}>
              <span>{variable.name}: </span>
              {!isObject && !isArray ? (
                <span className="ml-2 text-muted-foreground">
                  {JSON.stringify(variable.value)}
                </span>
              ) : (
                <span className="ml-2 text-muted-foreground">
                  {isArray ? `Array(${variable.value.length})` : 'Object'}
                </span>
              )}
            </div>
            
            {(isObject || isArray) && variable.value && (
              <div className="pl-4 mt-1">
                {isObject && 
                  Object.entries(variable.value).map(([key, val]) => (
                    <div key={key} className="py-1">
                      <span>{key}: </span>
                      <span className="text-muted-foreground">
                        {JSON.stringify(val)}
                      </span>
                    </div>
                  ))
                }
                
                {isArray && 
                  variable.value.map((val: any, idx: number) => (
                    <div key={idx} className="py-1">
                      <span>{idx}: </span>
                      <span className="text-muted-foreground">
                        {JSON.stringify(val)}
                      </span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StateViewer;
