import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ControlPanel from '@/components/ControlPanel';
import CodeViewer from '@/components/CodeViewer';
import StateViewer from '@/components/StateViewer';
import DebugChat from '@/components/DebugChat';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
  const [activeTab, setActiveTab] = useState("code");
  const [showCheckpointsDialog, setShowCheckpointsDialog] = useState(false);
  
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
        memory: 0
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
    } else {
      setCurrentLine(1);
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
        const mockSessionId = `mock-session-${Date.now()}`;
        setSessionId(mockSessionId);
        toast({
          title: 'Development Mode',
          description: 'Using mock session for checkpoint creation',
        });
        
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
  
  const handleRestoreCheckpoint = (checkpoint: CheckpointData) => {
    try {
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

  const handleJumpToCheckpoint = () => {
    setShowCheckpointsDialog(true);
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
            
            <Tabs defaultValue="code" value={activeTab} onValueChange={setActiveTab}>
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
              onJumpToCheckpoint={handleJumpToCheckpoint}
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
            
            <Dialog open={showCheckpointsDialog} onOpenChange={setShowCheckpointsDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Jump to Checkpoint</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[300px] overflow-auto">
                  {checkpoints.length > 0 ? (
                    checkpoints.map((cp) => (
                      <Button 
                        key={cp.id}
                        variant="outline"
                        className="w-full justify-start text-left"
                        onClick={() => handleRestoreCheckpoint(cp)}
                      >
                        <div className="flex items-center gap-2">
                          <Bookmark size={16} />
                          <div>
                            <div>Line {cp.lineNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(cp.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No checkpoints available
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      <DebugChat 
        code={code}
        variables={currentState?.variables || []}
        currentLine={currentLine}
      />
    </div>
  );
};

export default Index;
