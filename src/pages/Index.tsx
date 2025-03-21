
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ControlPanel from '@/components/ControlPanel';
import CodeViewer from '@/components/CodeViewer';
import StateViewer from '@/components/StateViewer';
import DebugChat from '@/components/DebugChat';
import ExecutionTraceVisualizer from '@/components/ExecutionTraceVisualizer';
import ObjectRelationshipView from '@/components/ObjectRelationshipView';
import QuantumCircuitVisualizer from '@/components/QuantumCircuitVisualizer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { debuggerService, createExecutionStatisticsTable } from '@/lib/debuggerService';
import { executeCode, createCheckpoint, restoreFromCheckpoint, analyzeCode } from '@/lib/executionEngine';
import { ExecutionState, CheckpointData, Variable } from '@/types/debugger';
import { parseQuantumCode, sampleQuantumCodes } from '@/lib/quantumCodeParser';
import { QuantumCircuit } from '@/types/quantum';
import { useToast } from '@/components/ui/use-toast';
import { Code, Play, Pause, Save, FileDown, Bookmark, RotateCcw, Share2, Cpu } from 'lucide-react';

const samplePythonCode = `def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

result = fibonacci(5)
print(result)`;

const sampleJsCode = `function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

let result = factorial(5);
console.log(result);`;

const sampleDataStructureCode = `// Linked List implementation
function createNode(value) {
  return { value, next: null };
}

let head = createNode(1);
head.next = createNode(2);
head.next.next = createNode(3);
head.next.next.next = createNode(4);

// Traverse the list
let current = head;
while (current !== null) {
  console.log(current.value);
  current = current.next;
}`;

const sampleQuantumCircuits = {
  bell: {
    name: 'Bell State',
    description: 'Creates a maximally entangled state |00⟩ + |11⟩',
    qubits: 2,
    gates: [
      { type: 'H' as const, position: 1, control: 0 },
      { type: 'CNOT' as const, position: 2, control: 0, target: 1 }
    ]
  },
  teleportation: {
    name: 'Quantum Teleportation',
    description: 'Protocol to transfer quantum state using entanglement',
    qubits: 3,
    gates: [
      { type: 'H' as const, position: 1, control: 1 },
      { type: 'CNOT' as const, position: 2, control: 1, target: 2 },
      { type: 'CNOT' as const, position: 3, control: 0, target: 1 },
      { type: 'H' as const, position: 4, control: 0 },
      { type: 'X' as const, position: 5, control: 1 },
      { type: 'Z' as const, position: 5, control: 0 }
    ]
  },
  grover: {
    name: 'Grover\'s Algorithm',
    description: 'Quantum search algorithm for unstructured databases',
    qubits: 3,
    gates: [
      { type: 'H' as const, position: 1, control: 0 },
      { type: 'H' as const, position: 1, control: 1 },
      { type: 'H' as const, position: 1, control: 2 },
      { type: 'X' as const, position: 2, control: 0 },
      { type: 'X' as const, position: 2, control: 1 },
      { type: 'X' as const, position: 2, control: 2 },
      { type: 'H' as const, position: 3, control: 2 },
      { type: 'CNOT' as const, position: 4, control: 0, target: 2 },
      { type: 'H' as const, position: 5, control: 2 },
      { type: 'X' as const, position: 6, control: 0 },
      { type: 'X' as const, position: 6, control: 1 },
      { type: 'X' as const, position: 6, control: 2 },
      { type: 'H' as const, position: 7, control: 0 },
      { type: 'H' as const, position: 7, control: 1 },
      { type: 'H' as const, position: 7, control: 2 }
    ]
  }
};

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkpoints, setCheckpoints] = useState<CheckpointData[]>([]);
  const [code, setCode] = useState(sampleDataStructureCode);
  const [language, setLanguage] = useState<string>('javascript');
  const [currentState, setCurrentState] = useState<ExecutionState | null>(null);
  const [allStates, setAllStates] = useState<ExecutionState[]>([]);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [executionSpeed, setExecutionSpeed] = useState<number>(500); // ms between steps
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [isCodeAnalyzed, setIsCodeAnalyzed] = useState(false);
  const [isSessionSaving, setIsSessionSaving] = useState(false); // Fixed: Initialize with a boolean value instead of using the variable itself
  const [activeTab, setActiveTab] = useState("code");
  const [showCheckpointsDialog, setShowCheckpointsDialog] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState<'state' | 'trace' | 'graph' | 'quantum'>('state');
  const [currentQuantumCircuit, setCurrentQuantumCircuit] = useState<string>('bell');

  // Add new state variables for quantum debugging
  const [quantumCode, setQuantumCode] = useState<string>(sampleQuantumCodes.bell);
  const [quantumCircuit, setQuantumCircuit] = useState<QuantumCircuit | null>(null);
  const [isQuantumMode, setIsQuantumMode] = useState<boolean>(false);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const initSession = async () => {
        try {
          await createExecutionStatisticsTable();
          
          const { data, error } = await debuggerService.saveSession({
            userId: user.id,
            code: code,
            name: 'Debugging Session',
            language: language,
            lastAccessed: new Date()
          });
          
          if (error) {
            console.warn('Session initialization warning:', error.message);
            if (process.env.NODE_ENV === 'development') {
              console.log('Development mode: Using mock session ID');
              setSessionId(`mock-session-${Date.now()}`);
            } else {
              throw error;
            }
          } else if (data) {
            setSessionId(data.id);
            
            const checkpointsResponse = await debuggerService.getCheckpoints(data.id);
            if (checkpointsResponse.data) {
              setCheckpoints(checkpointsResponse.data);
            }
          }
          
          analyzeAndUpdateState();
        } catch (err) {
          console.error('Failed to initialize session:', err);
          toast({
            title: 'Session Notice',
            description: 'Running in local mode due to database connection issues.',
            variant: 'default',
          });
          
          if (process.env.NODE_ENV === 'development') {
            setSessionId(`mock-session-${Date.now()}`);
          }
        }
      };
      
      initSession();
    }
  }, [user, toast, code, language]);
  
  const analyzeAndUpdateState = useCallback(() => {
    try {
      const { variables } = analyzeCode(code);
      
      const initialVariables = variables.map(name => ({
        name,
        value: null,
        changed: false,
        type: 'undefined'
      }));
      
      setCurrentState({
        line: 1,
        variables: initialVariables,
        callStack: [{
          name: 'global',
          variables: {},
          startLine: 0,
          returnLine: -1
        }],
        timestamp: new Date(),
        memory: 0,
        objectGraph: { nodes: [], edges: [] }
      });
      
      setIsCodeAnalyzed(true);
    } catch (err) {
      console.error('Failed to analyze code:', err);
      setIsCodeAnalyzed(false);
    }
  }, [code]);
  
  useEffect(() => {
    analyzeAndUpdateState();
  }, [code, analyzeAndUpdateState]);
  
  useEffect(() => {
    if (!isPlaying || !isCodeAnalyzed) return;
    
    let executionTimer: number;
    
    const runExecution = async () => {
      const startTime = performance.now();
      let peakMemory = 0;
      
      const states = await executeCode(code, (state) => {
        setCurrentState(state);
        setCurrentLine(state.line);
        peakMemory = Math.max(peakMemory, state.memory || 0);
        setMemoryUsage(peakMemory);
      }, undefined);
      
      const endTime = performance.now();
      setExecutionTime(endTime - startTime);
      setAllStates(states);
      setCurrentStateIndex(states.length - 1);
      setIsPlaying(false);
      
      if (sessionId) {
        const variableChanges: Record<string, number> = {};
        const lineExecutionCount: Record<number, number> = {};
        
        states.forEach(state => {
          lineExecutionCount[state.line] = (lineExecutionCount[state.line] || 0) + 1;
          
          state.variables.forEach(v => {
            if (v.changed) {
              variableChanges[v.name] = (variableChanges[v.name] || 0) + 1;
            }
          });
        });
        
        await debuggerService.saveExecutionStatistics(sessionId, {
          totalExecutionTime: endTime - startTime,
          peakMemoryUsage: peakMemory,
          variableChanges,
          lineExecutionCount
        });
      }
    };
    
    runExecution();
    
    return () => {
      clearTimeout(executionTimer);
    };
  }, [isPlaying, code, isCodeAnalyzed, sessionId]);
  
  const handleStepBack = () => {
    if (allStates.length === 0) return;
    
    const prevLineIndex = allStates.findIndex(state => state.line === currentLine) - 1;
    if (prevLineIndex >= 0) {
      setCurrentState(allStates[prevLineIndex]);
      setCurrentLine(allStates[prevLineIndex].line);
      setCurrentStateIndex(prevLineIndex);
    } else {
      setCurrentLine(1);
      setCurrentStateIndex(0);
    }
  };

  const handleStepForward = () => {
    if (allStates.length === 0) {
      executeCode(code, (state) => {
        const prevVariables = currentState?.variables || [];
        const newVariables = state.variables.map(v => {
          const prevVar = prevVariables.find(pv => pv.name === v.name);
          const hasChanged = prevVar ? 
            JSON.stringify(prevVar.value) !== JSON.stringify(v.value) : 
            v.value !== null;
          
          return {
            ...v,
            changed: hasChanged
          };
        });
        
        const updatedState = {
          ...state,
          variables: newVariables
        };
        
        setCurrentState(updatedState);
        setCurrentLine(state.line);
        setMemoryUsage(state.memory || 0);
      }, currentLine + 1).then(states => {
        setAllStates(prevStates => {
          const newStates = [...prevStates];
          states.forEach(state => {
            if (!newStates.some(s => s.line === state.line)) {
              newStates.push(state);
            }
          });
          return newStates;
        });
        
        if (states.length > 0) {
          setCurrentStateIndex(states.length - 1);
        }
      });
    } else {
      const nextLineIndex = allStates.findIndex(state => state.line === currentLine) + 1;
      if (nextLineIndex < allStates.length) {
        const nextState = allStates[nextLineIndex];
        const currentVars = currentState?.variables || [];
        
        const updatedVars = nextState.variables.map(v => {
          const currentVar = currentVars.find(cv => cv.name === v.name);
          const hasChanged = currentVar ? 
            JSON.stringify(currentVar.value) !== JSON.stringify(v.value) : 
            v.value !== null;
          
          return {
            ...v,
            changed: hasChanged
          };
        });
        
        const updatedState = {
          ...nextState,
          variables: updatedVars
        };
        
        setCurrentState(updatedState);
        setCurrentLine(nextState.line);
        setCurrentStateIndex(nextLineIndex);
      }
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setCurrentLine(1);
    setIsPlaying(false);
    setAllStates([]);
    setCurrentStateIndex(0);
    analyzeAndUpdateState();
  };
  
  const handleCheckpoint = async () => {
    if (!currentState) {
      toast({
        title: 'Checkpoint Error',
        description: 'Unable to create checkpoint: No execution state available',
        variant: 'destructive',
      });
      return;
    }
    
    if (!sessionId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating checkpoint in development mode with mock session ID');
        const mockSessionId = `mock-session-${Date.now()}`;
        setSessionId(mockSessionId);
        
        try {
          setIsSessionSaving(true);
          const checkpointData = createCheckpoint(currentState, mockSessionId, `Checkpoint at line ${currentLine}`);
          
          const newCheckpoint = {
            ...checkpointData,
            timestamp: new Date()
          };
          
          setCheckpoints(prev => [...prev, newCheckpoint]);
          
          toast({
            title: 'Checkpoint Created',
            description: `Successfully saved checkpoint at line ${currentLine}`,
          });
          setIsSessionSaving(false);
        } catch (err) {
          console.error('Failed to create checkpoint:', err);
          toast({
            title: 'Checkpoint Error',
            description: err instanceof Error ? err.message : 'Failed to save checkpoint',
            variant: 'destructive',
          });
          setIsSessionSaving(false);
        }
        return;
      }
      
      toast({
        title: 'Checkpoint Error',
        description: 'Unable to create checkpoint: No active session',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSessionSaving(true);
      console.log('Creating checkpoint with session ID:', sessionId);
      console.log('Current state:', currentState);
      
      const checkpointData = createCheckpoint(currentState, sessionId, `Checkpoint at line ${currentLine}`);
      
      const { data, error } = await debuggerService.saveCheckpoint(checkpointData);
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: 'Checkpoint Created',
          description: `Successfully saved checkpoint at line ${currentLine}`,
        });
        
        setCheckpoints(prev => [...prev, data]);
      }
      setIsSessionSaving(false);
    } catch (err) {
      console.error('Failed to create checkpoint:', err);
      toast({
        title: 'Checkpoint Error',
        description: err instanceof Error ? err.message : 'Failed to save checkpoint',
        variant: 'destructive',
      });
      setIsSessionSaving(false);
    }
  };
  
  const handleJumpToCheckpoint = () => {
    setShowCheckpointsDialog(true);
  };
  
  const handleRestoreCheckpoint = (checkpoint: CheckpointData) => {
    try {
      console.log('Restoring checkpoint:', checkpoint);
      const state = restoreFromCheckpoint(checkpoint);
      
      if (currentState) {
        const updatedVars = state.variables.map(v => {
          const currentVar = currentState.variables.find(cv => cv.name === v.name);
          return {
            ...v,
            changed: currentVar ? 
              JSON.stringify(currentVar.value) !== JSON.stringify(v.value) : 
              false
          };
        });
        
        state.variables = updatedVars;
      }
      
      setCurrentState(state);
      setCurrentLine(state.line);
      setShowCheckpointsDialog(false);
      
      // Find matching state in allStates by line number
      const stateIndex = allStates.findIndex(s => s.line === state.line);
      if (stateIndex >= 0) {
        setCurrentStateIndex(stateIndex);
      }
      
      toast({
        title: 'Checkpoint Restored',
        description: `Successfully restored execution state to line ${state.line}`,
      });
    } catch (err) {
      console.error('Failed to restore checkpoint:', err);
      toast({
        title: 'Restore Error',
        description: err instanceof Error ? err.message : 'Failed to restore execution state',
        variant: 'destructive',
      });
    }
  };
  
  const handleSwitchLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    if (newLanguage === 'python') {
      setCode(samplePythonCode);
    } else if (newLanguage === 'javascript') {
      if (code === samplePythonCode) {
        setCode(sampleJsCode);
      }
    }
    
    setAllStates([]);
    setCurrentLine(1);
    setCurrentStateIndex(0);
  };
  
  const handleSelectExecutionState = (index: number) => {
    if (index >= 0 && index < allStates.length) {
      const state = allStates[index];
      setCurrentState(state);
      setCurrentLine(state.line);
      setCurrentStateIndex(index);
    }
  };
  
  const handleSaveSession = async () => {
    if (!user) return;
    
    try {
      setIsSessionSaving(true);
      const { data, error } = await debuggerService.saveSession({
        userId: user.id,
        code: code,
        name: 'Debugging Session',
        language: language,
        lastAccessed: new Date()
      });
      
      if (error) throw error;
      
      if (data) {
        setSessionId(data.id);
        
        toast({
          title: 'Session Saved',
          description: 'Your debugging session has been saved',
        });
      }
      setIsSessionSaving(false);
    } catch (err) {
      console.error('Failed to save session:', err);
      toast({
        title: 'Save Error',
        description: 'Failed to save debugging session',
        variant: 'destructive',
      });
      setIsSessionSaving(false);
    }
  };

  // Add new functions for quantum debugging
  const handleUpdateQuantumCircuit = useCallback(() => {
    try {
      const parsedCircuit = parseQuantumCode(quantumCode);
      if (parsedCircuit) {
        setQuantumCircuit(parsedCircuit);
      } else {
        toast({
          title: 'Parsing Error',
          description: 'Failed to parse quantum code',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Failed to parse quantum code:', err);
      toast({
        title: 'Parsing Error',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [quantumCode, toast]);

  // Parse quantum code when it changes
  useEffect(() => {
    handleUpdateQuantumCircuit();
  }, [quantumCode, handleUpdateQuantumCircuit]);

  // Toggle quantum mode
  const handleToggleQuantumMode = () => {
    setIsQuantumMode(!isQuantumMode);
    if (!isQuantumMode) {
      // Entering quantum mode
      setActiveTab("code");
      setVisualizationMode('quantum');
    }
  };

  // Load sample quantum code
  const handleLoadSampleQuantumCode = (sampleName: keyof typeof sampleQuantumCodes) => {
    setQuantumCode(sampleQuantumCodes[sampleName]);
    handleUpdateQuantumCircuit();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Interactive Reversible Debugger</h1>
            <p className="text-muted-foreground">
              Step through your code forwards and backwards with precision
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleSaveSession}
              disabled={isSessionSaving}
            >
              <Save size={16} />
              {isSessionSaving ? 'Saving...' : 'Save'}
            </Button>
            
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
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
              
              {isQuantumMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadSampleQuantumCode('bell')}
                    className="flex items-center gap-1"
                  >
                    Bell State
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadSampleQuantumCode('teleportation')}
                    className="flex items-center gap-1"
                  >
                    Teleportation
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadSampleQuantumCode('grover')}
                    className="flex items-center gap-1"
                  >
                    Grover's
                  </Button>
                </>
              )}
            </div>
            
            <Tabs defaultValue="code" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="code">Code Editor</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="code" className="mt-2">
                {isQuantumMode ? (
                  <Textarea
                    value={quantumCode}
                    onChange={(e) => setQuantumCode(e.target.value)}
                    className="font-mono text-sm h-[400px] resize-none"
                    placeholder="Enter your quantum code here..."
                  />
                ) : (
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono text-sm h-[400px] resize-none"
                    placeholder="Enter your code here..."
                  />
                )}
              </TabsContent>
              
              <TabsContent value="execution" className="mt-2">
                {isQuantumMode ? (
                  <div className="font-mono text-sm h-[400px] overflow-auto border p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-2">Quantum Circuit Execution</h3>
                    <pre className="text-xs">
                      {quantumCircuit ? (
                        <>
                          <p>Circuit: {quantumCircuit.name}</p>
                          <p>Qubits: {quantumCircuit.qubits}</p>
                          <p>Gates: {quantumCircuit.gates.length}</p>
                        </>
                      ) : (
                        'No valid quantum circuit'
                      )}
                    </pre>
                  </div>
                ) : (
                  <CodeViewer 
                    code={code} 
                    currentLine={currentLine}
                    heatmap={allStates.reduce((acc, state) => {
                      acc[state.line] = (acc[state.line] || 0) + 1;
                      return acc;
                    }, {} as Record<number, number>)}
                  />
                )}
              </TabsContent>
            </Tabs>
            
            <ControlPanel
              onStepBack={isQuantumMode ? handleUpdateQuantumCircuit : handleStepBack}
              onStepForward={isQuantumMode ? handleUpdateQuantumCircuit : handleStepForward}
              onPlay={isQuantumMode ? handleUpdateQuantumCircuit : handlePlay}
              onPause={isQuantumMode ? handleUpdateQuantumCircuit : handlePause}
              onReset={isQuantumMode ? handleUpdateQuantumCircuit : handleReset}
              onCheckpoint={isQuantumMode ? handleUpdateQuantumCircuit : handleCheckpoint}
              onJumpToCheckpoint={isQuantumMode ? handleUpdateQuantumCircuit : handleJumpToCheckpoint}
              isPlaying={isPlaying}
            />
            
            {!isQuantumMode && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Execution Speed</span>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="100"
                  value={executionSpeed}
                  onChange={(e) => setExecutionSpeed(parseInt(e.target.value))}
                  className="w-1/2"
                />
                <span className="text-sm">{executionSpeed}ms</span>
              </div>
            )}
            
            {!isQuantumMode && checkpoints.length > 0 && (
              <div className="glass-panel rounded-lg p-4 animate-fade-in">
                <h3 className="text-lg font-semibold mb-2">Checkpoints</h3>
                <div className="flex flex-wrap gap-2">
                  {checkpoints.map((cp) => (
                    <Button 
                      key={cp.id}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleRestoreCheckpoint(cp)}
                    >
                      <Bookmark size={14} />
                      Line {cp.lineNumber}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {!isQuantumMode && (
                <>
                  <Button 
                    variant={visualizationMode === 'state' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setVisualizationMode('state')}
                  >
                    Variable State
                  </Button>
                  
                  <Button 
                    variant={visualizationMode === 'trace' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setVisualizationMode('trace')}
                  >
                    Execution Trace
                  </Button>
                  
                  <Button 
                    variant={visualizationMode === 'graph' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setVisualizationMode('graph')}
                  >
                    Object Relationships
                  </Button>
                </>
              )}
              
              <Button 
                variant={visualizationMode === 'quantum' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setVisualizationMode('quantum')}
              >
                Quantum Circuits
              </Button>
            </div>
            
            {!isQuantumMode && visualizationMode === 'state' && currentState && (
              <StateViewer 
                variables={currentState.variables || []}
                memoryUsage={memoryUsage}
                executionTime={executionTime}
              />
            )}
            
            {!isQuantumMode && visualizationMode === 'trace' && allStates.length > 0 && (
              <ExecutionTraceVisualizer
                executionStates={allStates}
                currentStateIndex={currentStateIndex}
                onStateSelect={handleSelectExecutionState}
              />
            )}
            
            {!isQuantumMode && visualizationMode === 'graph' && currentState && (
              <ObjectRelationshipView executionState={currentState} />
            )}
            
            {visualizationMode === 'quantum' && (
              <div className="glass-panel rounded-lg p-4 h-[400px] overflow-auto">
                <h2 className="text-xl font-semibold mb-4">Quantum Circuit Visualization</h2>
                
                {isQuantumMode ? (
                  <div className="space-y-4">
                    {quantumCircuit ? (
                      <>
                        <QuantumCircuitVisualizer 
                          circuit={quantumCircuit} 
                          className="h-[200px] mb-4"
                        />
                        <p className="text-sm text-muted-foreground">
                          {quantumCircuit.description || 'No description provided for this circuit.'}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] border border-dashed rounded-lg">
                        <p className="text-muted-foreground">Invalid quantum circuit code</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Tabs defaultValue={currentQuantumCircuit} onValueChange={setCurrentQuantumCircuit}>
                    <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-4">
                      <TabsTrigger value="bell">Bell State</TabsTrigger>
                      <TabsTrigger value="teleportation">Teleportation</TabsTrigger>
                      <TabsTrigger value="grover">Grover's</TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-2">
                      <QuantumCircuitVisualizer 
                        circuit={sampleQuantumCircuits[currentQuantumCircuit as keyof typeof sampleQuantumCircuits]} 
                        className="h-[200px] mb-4"
                      />
                      <p className="text-sm text-muted-foreground">
                        {sampleQuantumCircuits[currentQuantumCircuit as keyof typeof sampleQuantumCircuits].description}
                        {currentQuantumCircuit === 'bell' && ' This demonstrates quantum entanglement, a fundamental concept in quantum computing.'}
                        {currentQuantumCircuit === 'teleportation' && ' Quantum teleportation enables moving quantum information between distant qubits.'}
                        {currentQuantumCircuit === 'grover' && ' Grover\'s algorithm provides a quadratic speedup for searching unstructured databases.'}
                      </p>
                    </div>
                  </Tabs>
                )}
              </div>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Export Debugging Data
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Export Debugging Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 border rounded bg-muted/50">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-[200px]">
                      {JSON.stringify({
                        code,
                        language,
                        executionTime,
                        memoryUsage,
                        checkpoints: checkpoints.map(cp => ({
                          line: cp.lineNumber,
                          timestamp: cp.timestamp,
                          memory: cp.memorySnapshot
                        })),
                        states: allStates.length > 0 ? 
                          allStates.slice(0, 5).map(s => ({
                            line: s.line,
                            variables: s.variables.map(v => ({
                              name: v.name,
                              value: v.value,
                              type: v.type
                            }))
                          })) : []
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
