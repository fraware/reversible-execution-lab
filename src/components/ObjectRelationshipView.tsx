
import React, { useState } from 'react';
import GraphVisualizer from './GraphVisualizer';
import { GraphNode, GraphOptions } from '@/types/graph';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExecutionState } from '@/types/debugger';

interface ObjectRelationshipViewProps {
  executionState: ExecutionState;
}

const ObjectRelationshipView: React.FC<ObjectRelationshipViewProps> = ({ executionState }) => {
  const [options, setOptions] = useState<GraphOptions>({
    layout: 'force',
    showObjectProperties: true,
    showPrimitiveValues: true,
    highlightChanges: true
  });
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setShowNodeDetails(true);
  };
  
  const graphData = executionState.objectGraph || { nodes: [], edges: [] };
  
  return (
    <div className="glass-panel rounded-lg p-4 h-[350px]">
      <Tabs defaultValue="graph">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Object Relationships</h2>
          <TabsList>
            <TabsTrigger value="graph">Graph View</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="graph" className="h-[290px]">
          {graphData.nodes.length > 0 ? (
            <GraphVisualizer 
              graphData={graphData} 
              options={options}
              onNodeClick={handleNodeClick}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No object relationships to display
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="options">
          <div className="space-y-4 p-2">
            <div>
              <label className="text-sm font-medium">Layout</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(['force', 'tree', 'radial', 'hierarchical'] as const).map(layout => (
                  <button
                    key={layout}
                    className={`p-2 border rounded text-sm ${options.layout === layout ? 'bg-primary/10 border-primary' : ''}`}
                    onClick={() => setOptions(prev => ({ ...prev, layout }))}
                  >
                    {layout.charAt(0).toUpperCase() + layout.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showObjectProperties"
                  checked={options.showObjectProperties}
                  onChange={e => setOptions(prev => ({ ...prev, showObjectProperties: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="showObjectProperties" className="text-sm">Show object properties</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPrimitiveValues"
                  checked={options.showPrimitiveValues}
                  onChange={e => setOptions(prev => ({ ...prev, showPrimitiveValues: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="showPrimitiveValues" className="text-sm">Show primitive values</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="highlightChanges"
                  checked={options.highlightChanges}
                  onChange={e => setOptions(prev => ({ ...prev, highlightChanges: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="highlightChanges" className="text-sm">Highlight changes</label>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showNodeDetails} onOpenChange={setShowNodeDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Node Details: {selectedNode?.label}</DialogTitle>
          </DialogHeader>
          
          {selectedNode && (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Type</h3>
                  <div className="text-sm bg-muted/50 p-2 rounded">{selectedNode.type}</div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">ID</h3>
                  <div className="text-sm bg-muted/50 p-2 rounded font-mono">{selectedNode.id}</div>
                </div>
                
                {selectedNode.metadata?.size && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Size</h3>
                    <div className="text-sm bg-muted/50 p-2 rounded">{selectedNode.metadata.size} bytes</div>
                  </div>
                )}
                
                {selectedNode.type === 'primitive' && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Value</h3>
                    <div className="text-sm bg-muted/50 p-2 rounded font-mono">
                      {String(selectedNode.data)}
                    </div>
                  </div>
                )}
                
                {selectedNode.type === 'object' && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Properties</h3>
                    <div className="text-sm bg-muted/50 p-2 rounded">
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {JSON.stringify(selectedNode.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedNode.type === 'array' && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Elements</h3>
                    <div className="text-sm bg-muted/50 p-2 rounded">
                      <div className="font-medium mb-1">Length: {selectedNode.data?.length || 0}</div>
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {JSON.stringify(selectedNode.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ObjectRelationshipView;
