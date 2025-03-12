
import { GraphData } from './graph';

export interface Variable {
  name: string;
  value: any;
  changed: boolean;
  type?: string;  // For type information
  scope?: string; // For scope tracking
}

export interface StackFrame {
  name: string;
  variables: Record<string, any>;
  startLine: number;
  returnLine: number;
}

export interface ExecutionState {
  line: number;
  variables: Variable[];
  callStack: StackFrame[];
  timestamp: Date;
  memory: number;  // Memory usage in bytes
  objectGraph?: GraphData; // Graph representation of object relationships
}

export interface CheckpointData {
  id: string;
  sessionId: string;
  lineNumber: number;
  state: string;  // Serialized execution state
  timestamp: Date;
  notes?: string;
  memorySnapshot: number;
}

export interface DebuggingSession {
  id: string;
  userId: string;
  code: string;
  name: string;
  language: string;
  createdAt: Date;
  lastAccessed: Date;
  checkpoints: CheckpointData[];
}

export interface ExecutionStatistics {
  totalExecutionTime: number;
  peakMemoryUsage: number;
  variableChanges: Record<string, number>;
  lineExecutionCount: Record<number, number>;
}
