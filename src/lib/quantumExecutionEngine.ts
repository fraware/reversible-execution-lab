
import { QuantumCircuit, QuantumState, Gate, Complex, QuantumExecutionResult } from '@/types/quantum';

/**
 * Execute a quantum circuit step by step
 */
export function executeQuantumCircuit(
  circuit: QuantumCircuit,
  onStateChange?: (state: QuantumState, step: number) => void
): Promise<QuantumExecutionResult> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    // Initialize quantum state with all qubits at |0⟩
    const initialState = createInitialState(circuit.qubits);
    let currentState = { ...initialState };
    const intermediateStates: QuantumState[] = [];
    
    // Process each gate in sequence
    const processGate = (gateIndex: number) => {
      if (gateIndex >= circuit.gates.length) {
        const endTime = performance.now();
        resolve({
          initialState,
          finalState: currentState,
          intermediateStates,
          executionTime: endTime - startTime
        });
        return;
      }
      
      const gate = circuit.gates[gateIndex];
      currentState = applyGate(currentState, gate);
      
      // Store intermediate state
      intermediateStates.push({ ...currentState });
      
      // Notify about state change
      if (onStateChange) {
        onStateChange(currentState, gateIndex);
      }
      
      // Process next gate with small delay for visualization
      setTimeout(() => processGate(gateIndex + 1), 300);
    };
    
    // Start processing gates
    processGate(0);
  });
}

/**
 * Create initial quantum state with all qubits in |0⟩ state
 */
function createInitialState(qubitCount: number): QuantumState {
  // For n qubits, we need 2^n amplitudes
  const stateSize = Math.pow(2, qubitCount);
  const statevector: Complex[] = Array(stateSize).fill(null).map(() => ({ real: 0, imag: 0 }));
  
  // Set |0⟩ state amplitude to 1
  statevector[0] = { real: 1, imag: 0 };
  
  return {
    statevector,
    qubitCount
  };
}

/**
 * Apply a quantum gate to the current state
 */
function applyGate(state: QuantumState, gate: Gate): QuantumState {
  const { statevector, qubitCount } = state;
  let newStatevector = [...statevector];
  
  switch (gate.type) {
    case 'H': // Hadamard gate
      newStatevector = applyHadamard(statevector, qubitCount, gate.control);
      break;
    case 'X': // Pauli-X gate (NOT)
      newStatevector = applyPauliX(statevector, qubitCount, gate.control);
      break;
    case 'Y': // Pauli-Y gate
      newStatevector = applyPauliY(statevector, qubitCount, gate.control);
      break;
    case 'Z': // Pauli-Z gate
      newStatevector = applyPauliZ(statevector, qubitCount, gate.control);
      break;
    case 'CNOT': // Controlled-NOT gate
      if (gate.target !== undefined) {
        newStatevector = applyCNOT(statevector, qubitCount, gate.control, gate.target);
      }
      break;
    case 'SWAP': // SWAP gate
      if (gate.target !== undefined) {
        newStatevector = applySWAP(statevector, qubitCount, gate.control, gate.target);
      }
      break;
  }
  
  return {
    statevector: newStatevector,
    qubitCount
  };
}

/**
 * Apply Hadamard gate to a specific qubit
 */
function applyHadamard(statevector: Complex[], qubitCount: number, qubit: number): Complex[] {
  const newStatevector = [...statevector];
  const stateSize = Math.pow(2, qubitCount);
  const factor = 1 / Math.sqrt(2);
  
  for (let i = 0; i < stateSize; i++) {
    // Check if this basis state has qubit set to 0 or 1
    const mask = 1 << qubit;
    const hasQubitSet = (i & mask) !== 0;
    const pairedIndex = i ^ mask; // Flip the qubit bit
    
    // Save original values
    const originalI = { ...newStatevector[i] };
    const originalPaired = { ...newStatevector[pairedIndex] };
    
    if (hasQubitSet) {
      // |1⟩ -> |0⟩ - |1⟩
      newStatevector[i] = {
        real: factor * (originalPaired.real - originalI.real),
        imag: factor * (originalPaired.imag - originalI.imag)
      };
    } else {
      // |0⟩ -> |0⟩ + |1⟩
      newStatevector[i] = {
        real: factor * (originalI.real + originalPaired.real),
        imag: factor * (originalI.imag + originalPaired.imag)
      };
    }
  }
  
  return newStatevector;
}

/**
 * Apply Pauli-X gate (NOT) to a specific qubit
 */
function applyPauliX(statevector: Complex[], qubitCount: number, qubit: number): Complex[] {
  const newStatevector = [...statevector];
  const stateSize = Math.pow(2, qubitCount);
  
  for (let i = 0; i < stateSize; i += 2) {
    const mask = 1 << qubit;
    const j = i ^ mask; // Flip the bit
    
    // Swap amplitudes
    const temp = { ...newStatevector[i] };
    newStatevector[i] = { ...newStatevector[j] };
    newStatevector[j] = temp;
  }
  
  return newStatevector;
}

/**
 * Apply Pauli-Y gate to a specific qubit
 */
function applyPauliY(statevector: Complex[], qubitCount: number, qubit: number): Complex[] {
  const newStatevector = [...statevector];
  const stateSize = Math.pow(2, qubitCount);
  
  for (let i = 0; i < stateSize; i++) {
    const mask = 1 << qubit;
    const j = i ^ mask; // Flip the bit
    
    if ((i & mask) === 0) { // |0⟩ to i|1⟩
      const temp = { ...newStatevector[i] };
      newStatevector[i] = { real: newStatevector[j].imag, imag: -newStatevector[j].real };
      newStatevector[j] = { real: -temp.imag, imag: temp.real };
    }
  }
  
  return newStatevector;
}

/**
 * Apply Pauli-Z gate to a specific qubit
 */
function applyPauliZ(statevector: Complex[], qubitCount: number, qubit: number): Complex[] {
  const newStatevector = [...statevector];
  const stateSize = Math.pow(2, qubitCount);
  
  for (let i = 0; i < stateSize; i++) {
    const mask = 1 << qubit;
    
    if ((i & mask) !== 0) { // If qubit is |1⟩
      // Apply phase flip
      newStatevector[i] = {
        real: -newStatevector[i].real,
        imag: -newStatevector[i].imag
      };
    }
  }
  
  return newStatevector;
}

/**
 * Apply CNOT gate with control and target qubits
 */
function applyCNOT(
  statevector: Complex[], 
  qubitCount: number, 
  controlQubit: number, 
  targetQubit: number
): Complex[] {
  const newStatevector = [...statevector];
  const stateSize = Math.pow(2, qubitCount);
  
  for (let i = 0; i < stateSize; i++) {
    const controlMask = 1 << controlQubit;
    
    // Only apply if control qubit is |1⟩
    if ((i & controlMask) !== 0) {
      const targetMask = 1 << targetQubit;
      const j = i ^ targetMask; // Flip target bit
      
      // Swap values if control is 1
      const temp = { ...newStatevector[i] };
      newStatevector[i] = { ...newStatevector[j] };
      newStatevector[j] = temp;
    }
  }
  
  return newStatevector;
}

/**
 * Apply SWAP gate between two qubits
 */
function applySWAP(
  statevector: Complex[], 
  qubitCount: number, 
  qubit1: number, 
  qubit2: number
): Complex[] {
  const newStatevector = [...statevector];
  const stateSize = Math.pow(2, qubitCount);
  
  for (let i = 0; i < stateSize; i++) {
    const mask1 = 1 << qubit1;
    const mask2 = 1 << qubit2;
    
    // Only swap if qubits have different values
    const q1val = (i & mask1) !== 0;
    const q2val = (i & mask2) !== 0;
    
    if (q1val !== q2val) {
      const j = i ^ mask1 ^ mask2; // Flip both bits
      
      // Swap amplitudes
      const temp = { ...newStatevector[i] };
      newStatevector[i] = { ...newStatevector[j] };
      newStatevector[j] = temp;
    }
  }
  
  return newStatevector;
}

/**
 * Format quantum state for display
 */
export function formatQuantumState(state: QuantumState): string {
  const { statevector, qubitCount } = state;
  let result = '';
  
  // Only show states with non-zero amplitudes
  for (let i = 0; i < statevector.length; i++) {
    const amplitude = statevector[i];
    const probability = amplitude.real * amplitude.real + amplitude.imag * amplitude.imag;
    
    if (probability > 0.001) {
      const binaryStr = i.toString(2).padStart(qubitCount, '0');
      const formatted = formatComplex(amplitude);
      result += `|${binaryStr}⟩: ${formatted} (${(probability * 100).toFixed(1)}%)\n`;
    }
  }
  
  return result || 'No significant amplitudes';
}

/**
 * Format complex number for display
 */
function formatComplex(complex: Complex): string {
  const { real, imag } = complex;
  
  if (Math.abs(real) < 0.001 && Math.abs(imag) < 0.001) {
    return '0';
  }
  
  if (Math.abs(imag) < 0.001) {
    return real.toFixed(3);
  }
  
  if (Math.abs(real) < 0.001) {
    return `${imag.toFixed(3)}i`;
  }
  
  const sign = imag >= 0 ? '+' : '';
  return `${real.toFixed(3)}${sign}${imag.toFixed(3)}i`;
}
