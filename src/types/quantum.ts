
export interface Gate {
  type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'SWAP';
  position: number;
  control: number;  // Qubit index for single-qubit gates or control qubit for two-qubit gates
  target?: number;  // Target qubit for two-qubit gates
}

export interface QuantumCircuit {
  qubits: number;
  gates: Gate[];
  name?: string;
  description?: string;
}

export interface QuantumState {
  statevector: Complex[];
  qubitCount: number;
}

export interface Complex {
  real: number;
  imag: number;
}

export interface QuantumExecutionState {
  circuit: QuantumCircuit;
  currentStep: number;
  states: QuantumState[];
}
