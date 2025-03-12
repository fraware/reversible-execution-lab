
import { ExecutionState, Variable, StackFrame, CheckpointData } from '@/types/debugger';
import { analyzeObjectRelationships, generateGraphData } from './objectRelationshipAnalyzer';
import { GraphData } from '@/types/graph';

// For performance optimization with large datasets or complex algorithms
const EXECUTION_THROTTLE_MS = 50;

/**
 * Analyzes code to extract variable declarations and scope information
 */
export function analyzeCode(code: string): { 
  variables: string[], 
  functions: string[], 
  loops: {start: number, end: number}[] 
} {
  // Simple static analysis - in a real implementation, this would use a proper parser
  const variables: string[] = [];
  const functions: string[] = [];
  const loops: {start: number, end: number}[] = [];
  
  // Extract variable names (simplified implementation)
  const varRegex = /\b(let|var|const)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let match;
  while ((match = varRegex.exec(code)) !== null) {
    variables.push(match[2]);
  }
  
  // Extract function names (simplified)
  const fnRegex = /\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;
  while ((match = fnRegex.exec(code)) !== null) {
    functions.push(match[1]);
  }
  
  // Detect loops (simplified)
  const lines = code.split('\n');
  let openLoops: number[] = [];
  
  lines.forEach((line, index) => {
    if (line.includes('for (') || line.includes('while (')) {
      openLoops.push(index);
    }
    if (line.includes('}') && openLoops.length > 0) {
      const start = openLoops.pop()!;
      loops.push({start, end: index});
    }
  });
  
  return { variables, functions, loops };
}

/**
 * Execute code with state tracking for reversible debugging
 */
export function executeCode(
  code: string,
  onStateChange: (state: ExecutionState) => void,
  targetLine?: number
): Promise<ExecutionState[]> {
  return new Promise((resolve) => {
    const states: ExecutionState[] = [];
    const lines = code.split('\n');
    const { variables } = analyzeCode(code);
    
    // Scope management for nested function calls and blocks
    const callStack: StackFrame[] = [
      { name: 'global', variables: {}, startLine: 0, returnLine: -1 }
    ];
    
    // Initial execution environment
    let currentScope = callStack[0];
    let lineIndex = 0;
    let isComplete = false;
    let previousGraphData: GraphData | null = null;

    // For handling recursive functions with clean tracking
    const executionContext = {
      variables: {} as Record<string, any>,
      lineMapping: new Map<number, number>(),
      executionCount: 0
    };
    
    // Process execution line by line
    const processNextLine = () => {
      if (lineIndex >= lines.length || isComplete) {
        isComplete = true;
        resolve(states);
        return;
      }
      
      if (targetLine !== undefined && lineIndex > targetLine) {
        resolve(states);
        return;
      }
      
      const line = lines[lineIndex].trim();
      
      // Skip empty lines and comments
      if (line === '' || line.startsWith('//')) {
        lineIndex++;
        setTimeout(processNextLine, 0);
        return;
      }
      
      // Simple execution simulation for variable assignments
      // In a real implementation, this would use a proper interpreter
      if (line.includes('=')) {
        const parts = line.split('=').map(p => p.trim());
        const varName = parts[0].replace('var ', '').replace('let ', '').replace('const ', '');
        
        try {
          // Simplified evaluation - would be more sophisticated in real implementation
          let value = parts[1].replace(';', '');
          
          // Handle simple numeric expressions
          if (value.match(/^[\d\+\-\*\/\(\)\s]+$/)) {
            value = eval(value);
          }
          
          // Store variable in current scope
          currentScope.variables[varName] = value;
          
          // Track if this variable changed from its previous value
          const variableChanged = 
            states.length > 0 && 
            currentScope.variables[varName] !== 
            (states[states.length - 1].callStack[states[states.length - 1].callStack.length - 1].variables[varName]);
          
          // Build variable state for this execution step
          const variableState: Variable[] = Object.entries(currentScope.variables).map(([name, value]) => ({
            name,
            value,
            changed: name === varName && variableChanged
          }));
          
          // Generate object relationship graph
          const relationships = analyzeObjectRelationships(variableState);
          const graphData = generateGraphData(relationships);
          
          // Create execution state snapshot
          const newState: ExecutionState = {
            line: lineIndex + 1,
            variables: variableState,
            callStack: JSON.parse(JSON.stringify(callStack)),
            timestamp: new Date(),
            memory: calculateMemoryUsage(currentScope.variables),
            objectGraph: graphData
          };
          
          states.push(newState);
          
          // Notify listener of state change
          onStateChange(newState);
          
          // Update previous graph data for comparison
          previousGraphData = graphData;
        } catch (e) {
          console.error(`Execution error at line ${lineIndex + 1}:`, e);
        }
      }
      
      // Handle function calls (simplified)
      if (line.includes('function')) {
        const match = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/.exec(line);
        if (match) {
          const fnName = match[1];
          
          // Create new stack frame for function
          const newFrame: StackFrame = {
            name: fnName,
            variables: {},
            startLine: lineIndex,
            returnLine: -1, // Will be set when function returns
          };
          
          callStack.push(newFrame);
          currentScope = newFrame;
        }
      }
      
      // Handle function returns (simplified)
      if (line.includes('return')) {
        if (callStack.length > 1) {
          const returningFrame = callStack.pop()!;
          returningFrame.returnLine = lineIndex;
          currentScope = callStack[callStack.length - 1];
          
          // In real implementation: handle return value assignment
        }
      }
      
      lineIndex++;
      
      // Use throttling for performance with complex code
      setTimeout(processNextLine, EXECUTION_THROTTLE_MS);
    };
    
    // Start execution process
    processNextLine();
  });
}

/**
 * Calculate approximate memory usage of variables
 * For scientific debugging, memory tracking is important
 */
function calculateMemoryUsage(variables: Record<string, any>): number {
  let bytes = 0;
  
  Object.entries(variables).forEach(([key, value]) => {
    // Account for property name
    bytes += key.length * 2;
    
    // Handle different types of values
    if (typeof value === 'string') {
      bytes += value.length * 2;
    } else if (typeof value === 'number') {
      bytes += 8; // 64-bit number
    } else if (typeof value === 'boolean') {
      bytes += 4;
    } else if (Array.isArray(value)) {
      // Simplified array size calculation
      bytes += 8 + (value.length * 8);
    } else if (typeof value === 'object' && value !== null) {
      // Recursive calculation for nested objects
      bytes += 8 + calculateMemoryUsage(value);
    }
  });
  
  return bytes;
}

/**
 * Create a checkpoint with full state information
 */
export function createCheckpoint(
  state: ExecutionState,
  sessionId: string,
  notes?: string
): CheckpointData {
  if (!state || !sessionId) {
    throw new Error('Cannot create checkpoint: Missing execution state or session ID');
  }
  
  try {
    // Create a deep copy of the state to prevent reference issues
    const stateCopy = JSON.parse(JSON.stringify(state));
    
    return {
      id: `cp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId: sessionId,
      lineNumber: state.line,
      state: JSON.stringify(stateCopy),
      timestamp: new Date(),
      notes: notes || `Checkpoint at line ${state.line}`,
      memorySnapshot: state.memory || 0
    };
  } catch (err) {
    console.error('Error creating checkpoint:', err);
    throw new Error('Failed to create checkpoint: ' + (err instanceof Error ? err.message : 'Unknown error'));
  }
}

/**
 * Restore execution state from a checkpoint
 */
export function restoreFromCheckpoint(
  checkpoint: CheckpointData
): ExecutionState {
  try {
    if (!checkpoint || !checkpoint.state) {
      throw new Error('Invalid checkpoint data');
    }
    
    const state = JSON.parse(checkpoint.state) as ExecutionState;
    return state;
  } catch (e) {
    console.error('Error restoring from checkpoint:', e);
    throw new Error('Failed to restore execution state from checkpoint');
  }
}
