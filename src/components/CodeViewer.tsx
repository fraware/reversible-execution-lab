import React, { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CodeViewerProps {
  code: string;
  currentLine: number;
  heatmap?: Record<number, number>;  // For execution frequency visualization
  breakpoints?: number[];
  onSetBreakpoint?: (line: number) => void;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ 
  code, 
  currentLine,
  heatmap,
  breakpoints = [],
  onSetBreakpoint
}) => {
  const lines = code.split('\n');
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to keep current line in view
  useEffect(() => {
    if (currentLineRef.current && scrollRef.current) {
      currentLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLine]);
  
  // Get line execution heat for color intensity
  const getHeatmapColor = (line: number) => {
    if (!heatmap || !heatmap[line]) return '';
    
    // Find the max execution count
    const maxCount = Math.max(...Object.values(heatmap));
    const ratio = heatmap[line] / maxCount;
    
    // Return appropriate color intensity
    if (ratio > 0.75) return 'bg-orange-500/10';
    if (ratio > 0.5) return 'bg-orange-400/10';
    if (ratio > 0.25) return 'bg-orange-300/10';
    return 'bg-orange-200/10';
  };
  
  // Syntax highlighting (simplified)
  const highlightSyntax = (line: string) => {
    // Keywords
    line = line.replace(/\b(function|const|let|var|if|else|return|for|while|import|from|export|class|new|this)\b/g, 
      '<span class="text-blue-500">$1</span>');
    
    // Strings
    line = line.replace(/(["'])(.*?)\1/g, 
      '<span class="text-green-500">$1$2$1</span>');
    
    // Numbers
    line = line.replace(/\b(\d+)\b/g, 
      '<span class="text-orange-500">$1</span>');
    
    // Function calls
    line = line.replace(/(\w+)(\()/g, 
      '<span class="text-purple-500">$1</span>$2');
    
    return line;
  };

  return (
    <div className="glass-panel rounded-lg p-4 animate-fade-in">
      <div className="mb-2 flex justify-between items-center">
        <h3 className="text-sm font-medium">Code Execution</h3>
        <Badge variant="outline">Line {currentLine}</Badge>
      </div>
      
      <div ref={scrollRef}>
        <ScrollArea className="h-[400px] w-full font-mono text-sm">
          <pre className="p-4">
            {lines.map((line, index) => (
              <div
                key={index}
                ref={index + 1 === currentLine ? currentLineRef : undefined}
                className={`relative px-4 py-1 -mx-4 group ${
                  index + 1 === currentLine
                    ? 'bg-primary/15 border-l-2 border-primary'
                    : getHeatmapColor(index + 1)
                }`}
                onClick={() => onSetBreakpoint && onSetBreakpoint(index + 1)}
              >
                <div className="flex">
                  <span className="inline-block w-8 text-muted-foreground select-none">
                    {index + 1}
                  </span>
                  
                  {/* Left gutter for breakpoints */}
                  <div className="relative -ml-8 w-4 mr-4">
                    {breakpoints.includes(index + 1) && (
                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500" />
                    )}
                    {!breakpoints.includes(index + 1) && onSetBreakpoint && (
                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-muted-foreground/0 group-hover:bg-muted-foreground/30 transition-colors" />
                    )}
                  </div>
                  
                  <span 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSyntax(line) 
                    }} 
                  />
                </div>
              </div>
            ))}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CodeViewer;
