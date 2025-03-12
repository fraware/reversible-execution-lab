
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ControlPanel from '@/components/ControlPanel';
import CodeViewer from '@/components/CodeViewer';
import StateViewer from '@/components/StateViewer';
import DebugChat from '@/components/DebugChat';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { debuggerService, createExecutionStatisticsTable } from '@/lib/debuggerService';
import { executeCode, createCheckpoint, restoreFromCheckpoint, analyzeCode } from '@/lib/executionEngine';
import { ExecutionState, CheckpointData, Variable } from '@/types/debugger';
import { useToast } from '@/components/ui/use-toast';
import { Code, Play, Pause, Save, FileDown, Bookmark, RotateCcw } from 'lucide-react';

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

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkpoints, setCheckpoints] = useState<CheckpointData[]>([]);
  const [code, setCode] = useState(samplePythonCode);
  const [language, setLanguage] = useState<string>('python');
  const [currentState, setCurrentState] = useState<ExecutionState | null>(null);
  const [allStates, setAllStates] = useState<ExecutionState[]>([]);
  const [executionSpeed, setExecutionSpeed] = useState<number>(500); // ms between steps
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [isCodeAnalyzed, setIsCodeAnalyzed] = useState(false);
  const [isSessionSaving, setIsSessionSaving] = useState(false);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize or load a debugging session
  useEffect(() => {
    if (user) {
      const initSession = async () => {
        // Create statistics table if needed
        await createExecutionStatisticsTable();
        
        try {
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
            
            // Load existing checkpoints
            const checkpointsResponse = await debuggerService.getCheckpoints(data.id);
            if (checkpointsResponse.data) {
              setCheckpoints(checkpointsResponse.data);
            }
            
            // Initialize state with variables from code analysis
            analyzeAndUpdateState();
          }
        } catch (err) {
          console.error('Failed to initialize session:', err);
          toast({
            title: 'Session Error',
            description: 'Failed to initialize debugging session',
            variant: 'destructive',
          });
        }
      };
      
      initSession();
    }
  }, [user, toast]);
  
  // Analyze code and update state
  const analyzeAndUpdateState = useCallback(() => {
    try {
      const { variables } = analyzeCode(code);
      
      // Create initial variables state
      const initialVariables = variables.map(name => ({
        name,
        value: null,
        changed: false,
        type: 'undefined'
      }));
      
      // Set initial state
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
        memory: 0
      });
      
      setIsCodeAnalyzed(true);
    } catch (err) {
      console.error('Failed to analyze code:', err);
      setIsCodeAnalyzed(false);
    }
  }, [code]);
  
  // Effect to analyze code whenever it changes
  useEffect(() => {
    analyzeAndUpdateState();
  }, [code, analyzeAndUpdateState]);
  
  // Handle play/pause for code execution
  useEffect(() => {
    if (!isPlaying || !isCodeAnalyzed) return;
    
    let executionTimer: number;
    
    const runExecution = async () => {
      const startTime = performance.now();
      let peakMemory = 0;
      
      // Execute the code, tracking states
      const states = await executeCode(code, (state) => {
        setCurrentState(state);
        setCurrentLine(state.line);
        peakMemory = Math.max(peakMemory, state.memory || 0);
        setMemoryUsage(peakMemory);
      }, undefined);
      
      const endTime = performance.now();
      setExecutionTime(endTime - startTime);
      setAllStates(states);
      setIsPlaying(false);
      
      // Save execution statistics
      if (sessionId) {
        // Calculate statistics
        const variableChanges: Record<string, number> = {};
        const lineExecutionCount: Record<number, number> = {};
        
        states.forEach(state => {
          // Count line executions
          lineExecutionCount[state.line] = (lineExecutionCount[state.line] || 0) + 1;
          
          // Count variable changes
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
    
    // Start execution
    runExecution();
    
    return () => {
      clearTimeout(executionTimer);
    };
  }, [isPlaying, code, isCodeAnalyzed, sessionId]);
  
  const handleStepBack = () => {
    if (allStates.length === 0) return;
    
    // Find previous state
    const prevLineIndex = allStates.findIndex(state => state.line === currentLine) - 1;
    if (prevLineIndex >= 0) {
      setCurrentState(allStates[prevLineIndex]);
      setCurrentLine(allStates[prevLineIndex].line);
    } else {
      setCurrentLine(1);
    }
  };

  const handleStepForward = () => {
    if (allStates.length === 0) {
      // Execute just one step
      executeCode(code, (state) => {
        setCurrentState(state);
        setCurrentLine(state.line);
        setMemoryUsage(state.memory || 0);
      }, currentLine + 1).then(states => {
        setAllStates(prevStates => {
          const newStates = [...prevStates];
          // Avoid duplicates
          states.forEach(state => {
            if (!newStates.some(s => s.line === state.line)) {
              newStates.push(state);
            }
          });
          return newStates;
        });
      });
    } else {
      // Use existing states
      const nextLineIndex = allStates.findIndex(state => state.line === currentLine) + 1;
      if (nextLineIndex < allStates.length) {
        setCurrentState(allStates[nextLineIndex]);
        setCurrentLine(allStates[nextLineIndex].line);
      }
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setCurrentLine(1);
    setIsPlaying(false);
    setAllStates([]);
    analyzeAndUpdateState();
  };
  
  const handleCheckpoint = async () => {
    if (!sessionId || !user || !currentState) return;
    
    try {
      setIsSessionSaving(true);
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
        description: 'Failed to save checkpoint',
        variant: 'destructive',
      });
      setIsSessionSaving(false);
    }
  };
  
  const handleRestoreCheckpoint = (checkpoint: CheckpointData) => {
    try {
      const state = restoreFromCheckpoint(checkpoint);
      setCurrentState(state);
      setCurrentLine(state.line);
      
      toast({
        title: 'Checkpoint Restored',
        description: `Successfully restored execution state to line ${state.line}`,
      });
    } catch (err) {
      console.error('Failed to restore checkpoint:', err);
      toast({
        title: 'Restore Error',
        description: 'Failed to restore execution state',
        variant: 'destructive',
      });
    }
  };
  
  const handleSwitchLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // Set appropriate sample code
    if (newLanguage === 'python') {
      setCode(samplePythonCode);
    } else if (newLanguage === 'javascript') {
      setCode(sampleJsCode);
    }
    
    setAllStates([]);
    setCurrentLine(1);
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
                variant={language === 'python' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleSwitchLanguage('python')}
                className="flex items-center gap-1"
              >
                <Code size={16} />
                Python
              </Button>
              
              <Button 
                variant={language === 'javascript' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleSwitchLanguage('javascript')}
                className="flex items-center gap-1"
              >
                <Code size={16} />
                JavaScript
              </Button>
            </div>
            
            <Tabs defaultValue="code">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="code">Code Editor</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="code" className="mt-2">
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono text-sm h-[400px] resize-none"
                  placeholder="Enter your code here..."
                />
              </TabsContent>
              
              <TabsContent value="execution" className="mt-2">
                <CodeViewer code={code} currentLine={currentLine} />
              </TabsContent>
            </Tabs>
            
            <ControlPanel
              onStepBack={handleStepBack}
              onStepForward={handleStepForward}
              onPlay={handlePlay}
              onPause={handlePause}
              onReset={handleReset}
              onCheckpoint={handleCheckpoint}
              isPlaying={isPlaying}
            />
            
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
            
            {checkpoints.length > 0 && (
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
            <StateViewer 
              variables={currentState?.variables || []}
              memoryUsage={memoryUsage}
              executionTime={executionTime}
            />
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Export Debugging Data
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                              value: v.value
                            }))
                          })) : []
                      }, null, 2)}
                    </pre>
                  </div>
                  <Button className="w-full">
                    <FileDown size={16} className="mr-2" />
                    Download Full Session
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      {/* Add the debug chat component */}
      <DebugChat 
        code={code}
        variables={currentState?.variables || []}
        currentLine={currentLine}
      />
    </div>
  );
};

export default Index;
