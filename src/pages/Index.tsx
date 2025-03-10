import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ControlPanel from '@/components/ControlPanel';
import CodeViewer from '@/components/CodeViewer';
import StateViewer from '@/components/StateViewer';
import DebugChat from '@/components/DebugChat';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { debuggerService } from '@/lib/debuggerService';
import { useToast } from '@/components/ui/use-toast';

const sampleCode = `def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

result = fibonacci(5)
print(result)`;

const Index = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [checkpoints, setCheckpoints] = useState<Array<{ id: string, line: number }>>([]);
  const [code, setCode] = useState(sampleCode);
  const [variables, setVariables] = useState([
    { name: 'n', value: 5, changed: false },
    { name: 'result', value: null, changed: false },
  ]);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize or load a debugging session
  useEffect(() => {
    if (user) {
      const initSession = async () => {
        // For simplicity, we're creating a new session every time
        // In a real app, you might want to load the last session or list available sessions
        try {
          const { data, error } = await debuggerService.saveSession({
            user_id: user.id,
            code: code,
            name: 'Fibonacci Example',
            last_accessed: new Date().toISOString(),
          });
          
          if (error) throw error;
          if (data) {
            setSessionId(data.id);
            // Load existing checkpoints
            const checkpointsResponse = await debuggerService.getCheckpoints(data.id);
            if (checkpointsResponse.data) {
              setCheckpoints(
                checkpointsResponse.data.map(cp => ({
                  id: cp.id || '',
                  line: cp.line_number
                }))
              );
            }
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
  }, [user, toast, code]);

  const handleStepBack = () => {
    setCurrentLine((prev) => Math.max(1, prev - 1));
  };

  const handleStepForward = () => {
    setCurrentLine((prev) => Math.min(code.split('\n').length, prev + 1));
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setCurrentLine(1);
    setIsPlaying(false);
  };
  
  const handleCheckpoint = async () => {
    if (!sessionId || !user) return;
    
    try {
      const { data, error } = await debuggerService.saveCheckpoint({
        session_id: sessionId,
        line_number: currentLine,
        variables: JSON.stringify(variables),
        notes: `Checkpoint at line ${currentLine}`,
      });
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: 'Checkpoint Created',
          description: `Successfully saved checkpoint at line ${currentLine}`,
        });
        
        setCheckpoints(prev => [...prev, { id: data.id || '', line: currentLine }]);
      }
    } catch (err) {
      console.error('Failed to create checkpoint:', err);
      toast({
        title: 'Checkpoint Error',
        description: 'Failed to save checkpoint',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2">Interactive Reversible Debugger</h1>
            <p className="text-muted-foreground">
              Step through your code forwards and backwards with precision
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <CodeViewer code={code} currentLine={currentLine} />
            <ControlPanel
              onStepBack={handleStepBack}
              onStepForward={handleStepForward}
              onPlay={handlePlay}
              onPause={handlePause}
              onReset={handleReset}
              onCheckpoint={handleCheckpoint}
              isPlaying={isPlaying}
            />
            {checkpoints.length > 0 && (
              <div className="glass-panel rounded-lg p-4 animate-fade-in">
                <h3 className="text-lg font-semibold mb-2">Checkpoints</h3>
                <div className="flex flex-wrap gap-2">
                  {checkpoints.map((cp) => (
                    <Button 
                      key={cp.id}
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentLine(cp.line)}
                    >
                      Line {cp.line}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <StateViewer variables={variables} />
        </div>
      </div>
      
      {/* Add the debug chat component */}
      <DebugChat 
        code={code}
        variables={variables}
        currentLine={currentLine}
      />
    </div>
  );
};

export default Index;
