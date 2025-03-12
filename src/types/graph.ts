import { Variable } from './debugger';

export interface GraphNode {
  id: string;
  label: string;
  type: 'primitive' | 'object' | 'array' | 'function' | 'execution';
  data: any;
  metadata?: {
    address?: string;
    size?: number;
    changed?: boolean;
  };
  // D3 force simulation properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  // Additional properties that D3 might add
  vx?: number;
  vy?: number;
  index?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'reference' | 'property' | 'element' | 'execution' | 'call';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ExecutionTracePoint {
  id: string;
  lineNumber: number;
  timestamp: Date;
  variables: Variable[];
  graphState: GraphData;
}

export interface ObjectRelationshipData {
  variables: Variable[];
  objects: Record<string, any>;
  references: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}

export interface GraphOptions {
  layout: 'force' | 'tree' | 'radial' | 'hierarchical';
  showObjectProperties: boolean;
  showPrimitiveValues: boolean;
  highlightChanges: boolean;
}
