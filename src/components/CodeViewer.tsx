
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeViewerProps {
  code: string;
  currentLine: number;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ code, currentLine }) => {
  const lines = code.split('\n');

  return (
    <div className="glass-panel rounded-lg p-4 animate-fade-in">
      <ScrollArea className="h-[400px] w-full font-mono text-sm">
        <pre className="p-4">
          {lines.map((line, index) => (
            <div
              key={index}
              className={`px-4 py-1 -mx-4 ${
                index + 1 === currentLine
                  ? 'bg-primary/10 border-l-2 border-primary'
                  : ''
              }`}
            >
              <span className="inline-block w-8 text-muted-foreground">
                {index + 1}
              </span>
              {line}
            </div>
          ))}
        </pre>
      </ScrollArea>
    </div>
  );
};

export default CodeViewer;
