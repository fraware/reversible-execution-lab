
import React from 'react';
import QuantumCircuitVisualizer from './QuantumCircuitVisualizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Sample quantum circuits for demonstration
const sampleCircuits = {
  bell: {
    name: 'Bell State',
    description: 'Creates a maximally entangled state |00⟩ + |11⟩',
    qubits: 2,
    gates: [
      { type: 'H', position: 1, control: 0 },
      { type: 'CNOT', position: 2, control: 0, target: 1 }
    ]
  },
  teleportation: {
    name: 'Quantum Teleportation',
    description: 'Protocol to transfer quantum state using entanglement',
    qubits: 3,
    gates: [
      { type: 'H', position: 1, control: 1 },
      { type: 'CNOT', position: 2, control: 1, target: 2 },
      { type: 'CNOT', position: 3, control: 0, target: 1 },
      { type: 'H', position: 4, control: 0 },
      { type: 'X', position: 5, control: 1 },
      { type: 'Z', position: 5, control: 0 }
    ]
  },
  grover: {
    name: 'Grover\'s Algorithm',
    description: 'Quantum search algorithm for unstructured databases',
    qubits: 3,
    gates: [
      { type: 'H', position: 1, control: 0 },
      { type: 'H', position: 1, control: 1 },
      { type: 'H', position: 1, control: 2 },
      { type: 'X', position: 2, control: 0 },
      { type: 'X', position: 2, control: 1 },
      { type: 'X', position: 2, control: 2 },
      { type: 'H', position: 3, control: 2 },
      { type: 'CNOT', position: 4, control: 0, target: 2 },
      { type: 'H', position: 5, control: 2 },
      { type: 'X', position: 6, control: 0 },
      { type: 'X', position: 6, control: 1 },
      { type: 'X', position: 6, control: 2 },
      { type: 'H', position: 7, control: 0 },
      { type: 'H', position: 7, control: 1 },
      { type: 'H', position: 7, control: 2 }
    ]
  }
};

const QuantumDemoSection: React.FC = () => {
  return (
    <div className="container mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Quantum Algorithm Visualization</h2>
      <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-10">
        Explore how quantum algorithms work with our interactive visualizer. 
        Debug and analyze quantum circuits with our specialized tools.
      </p>
      
      <Tabs defaultValue="bell" className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
          <TabsTrigger value="bell">Bell State</TabsTrigger>
          <TabsTrigger value="teleportation">Teleportation</TabsTrigger>
          <TabsTrigger value="grover">Grover's</TabsTrigger>
        </TabsList>
        
        <div className="mt-8">
          <TabsContent value="bell">
            <Card>
              <CardHeader>
                <CardTitle>{sampleCircuits.bell.name}</CardTitle>
                <CardDescription>{sampleCircuits.bell.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <QuantumCircuitVisualizer circuit={sampleCircuits.bell} className="h-[200px] mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  The Bell state demonstrates quantum entanglement, where measuring one qubit
                  immediately determines the state of the other, regardless of distance.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="teleportation">
            <Card>
              <CardHeader>
                <CardTitle>{sampleCircuits.teleportation.name}</CardTitle>
                <CardDescription>{sampleCircuits.teleportation.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <QuantumCircuitVisualizer circuit={sampleCircuits.teleportation} className="h-[250px] mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Quantum teleportation allows the transfer of quantum information between qubits
                  using classical communication and shared entanglement.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="grover">
            <Card>
              <CardHeader>
                <CardTitle>{sampleCircuits.grover.name}</CardTitle>
                <CardDescription>{sampleCircuits.grover.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <QuantumCircuitVisualizer circuit={sampleCircuits.grover} className="h-[250px] mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Grover's algorithm provides a quadratic speedup for searching unstructured databases,
                  demonstrating quantum advantage for common computing tasks.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
      
      <div className="flex justify-center mt-8">
        <Button size="lg" className="group" asChild>
          <Link to="/login">
            Try Quantum Debugging <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default QuantumDemoSection;
