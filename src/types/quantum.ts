
export interface Gate {
  type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'SWAP';
  position: number;
  control: number;  // Qubit index for single-qubit gates or control qubit for two-qubit gates
  target?: number;  // Target qubit for two-qubit gates or SWAP
}

export interface QuantumCircuit {
  qubits: number;
  gates: Gate[];
  name?: string;
  description?: string;
}

export interface Complex {
  real: number;
  imag: number;
}

export interface QuantumState {
  statevector: Complex[];
  qubitCount: number;
}

export interface QuantumExecutionState {
  circuit: QuantumCircuit;
  currentStep: number;
  states: QuantumState[];
}

export type QuantumCircuitName = 'bell' | 'teleportation' | 'grover';

// Quantum execution result for visualization
export interface QuantumExecutionResult {
  initialState: QuantumState;
  finalState: QuantumState;
  intermediateStates: QuantumState[];
  executionTime: number;
}
