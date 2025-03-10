
import React, { useState } from 'react';
import ControlPanel from '@/components/ControlPanel';
import CodeViewer from '@/components/CodeViewer';
import StateViewer from '@/components/StateViewer';

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
  const [variables, setVariables] = useState([
    { name: 'n', value: 5, changed: false },
    { name: 'result', value: null, changed: false },
  ]);

  const handleStepBack = () => {
    setCurrentLine((prev) => Math.max(1, prev - 1));
  };

  const handleStepForward = () => {
    setCurrentLine((prev) => Math.min(sampleCode.split('\n').length, prev + 1));
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setCurrentLine(1);
    setIsPlaying(false);
  };
  const handleCheckpoint = () => {
    console.log('Checkpoint created at line', currentLine);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">Interactive Reversible Debugger</h1>
          <p className="text-muted-foreground">
            Step through your code forwards and backwards with precision
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <CodeViewer code={sampleCode} currentLine={currentLine} />
            <ControlPanel
              onStepBack={handleStepBack}
              onStepForward={handleStepForward}
              onPlay={handlePlay}
              onPause={handlePause}
              onReset={handleReset}
              onCheckpoint={handleCheckpoint}
              isPlaying={isPlaying}
            />
          </div>
          
          <StateViewer variables={variables} />
        </div>
      </div>
    </div>
  );
};

export default Index;
