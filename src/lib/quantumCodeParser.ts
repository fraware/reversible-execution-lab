
import { QuantumCircuit, Gate } from '@/types/quantum';

/**
 * Parse quantum code into a circuit representation
 * @param code Quantum code in a simplified syntax
 * @returns Parsed quantum circuit or null if parsing failed
 */
export function parseQuantumCode(code: string): QuantumCircuit | null {
  try {
    // Initialize empty circuit
    const circuit: QuantumCircuit = {
      qubits: 0,
      gates: [],
      name: 'Custom Circuit',
      description: 'Circuit created from code'
    };
    
    const lines = code.trim().split('\n');
    let highestQubitIndex = -1;
    
    // Process each line of code
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('//') || line.trim() === '') continue;
      
      // Match qubit declaration: qubits 3
      if (line.trim().match(/^qubits\s+\d+$/i)) {
        const match = line.trim().match(/^qubits\s+(\d+)$/i);
        if (match && match[1]) {
          circuit.qubits = parseInt(match[1], 10);
        }
        continue;
      }
      
      // Match circuit name: name "Bell State"
      if (line.trim().match(/^name\s+"([^"]+)"$/i)) {
        const match = line.trim().match(/^name\s+"([^"]+)"$/i);
        if (match && match[1]) {
          circuit.name = match[1];
        }
        continue;
      }
      
      // Match circuit description: description "Creates entanglement"
      if (line.trim().match(/^description\s+"([^"]+)"$/i)) {
        const match = line.trim().match(/^description\s+"([^"]+)"$/i);
        if (match && match[1]) {
          circuit.description = match[1];
        }
        continue;
      }
      
      // Match gate applications
      // H(0) - Apply H gate to qubit 0
      // CNOT(0, 1) - Apply CNOT with control qubit 0 and target qubit 1
      
      // Single qubit gates
      const singleQubitMatch = line.trim().match(/^(H|X|Y|Z)\((\d+)\)$/);
      if (singleQubitMatch) {
        const [, gateType, qubitIndex] = singleQubitMatch;
        const position = circuit.gates.length + 1;
        const qubit = parseInt(qubitIndex, 10);
        
        // Track highest qubit index if qubits wasn't explicitly set
        highestQubitIndex = Math.max(highestQubitIndex, qubit);
        
        circuit.gates.push({
          type: gateType as Gate['type'],
          position,
          control: qubit
        });
        continue;
      }
      
      // Two-qubit gates (CNOT, SWAP)
      const twoQubitMatch = line.trim().match(/^(CNOT|SWAP)\((\d+),\s*(\d+)\)$/);
      if (twoQubitMatch) {
        const [, gateType, controlIndex, targetIndex] = twoQubitMatch;
        const position = circuit.gates.length + 1;
        const control = parseInt(controlIndex, 10);
        const target = parseInt(targetIndex, 10);
        
        // Track highest qubit indices
        highestQubitIndex = Math.max(highestQubitIndex, control, target);
        
        circuit.gates.push({
          type: gateType as Gate['type'],
          position,
          control,
          target
        });
        continue;
      }
    }
    
    // If qubits wasn't explicitly set, use the highest qubit index + 1
    if (circuit.qubits === 0 && highestQubitIndex >= 0) {
      circuit.qubits = highestQubitIndex + 1;
    }
    
    // Ensure we have at least one qubit
    circuit.qubits = Math.max(1, circuit.qubits);
    
    return circuit;
  } catch (error) {
    console.error('Failed to parse quantum code:', error);
    return null;
  }
}

// Sample quantum code snippets
export const sampleQuantumCodes = {
  bell: `// Bell State Circuit
qubits 2
name "Bell State"
description "Creates a maximally entangled state |00⟩ + |11⟩"

H(0)
CNOT(0, 1)`,

  teleportation: `// Quantum Teleportation Circuit
qubits 3
name "Quantum Teleportation"
description "Protocol to transfer quantum state using entanglement"

H(1)
CNOT(1, 2)
CNOT(0, 1)
H(0)
X(1)
Z(0)`,

  grover: `// Grover's Algorithm (simplified)
qubits 3
name "Grover's Algorithm"
description "Quantum search algorithm for unstructured databases"

H(0)
H(1)
H(2)
X(0)
X(1)
X(2)
H(2)
CNOT(0, 2)
H(2)
X(0)
X(1)
X(2)
H(0)
H(1)
H(2)`
};
