
import { Variable } from '@/types/debugger';
import { GraphNode, GraphEdge, GraphData, ObjectRelationshipData } from '@/types/graph';

// Used to generate unique IDs for objects that don't have natural IDs
let objectIdCounter = 0;

/**
 * Analyzes variables and extracts object relationships
 */
export function analyzeObjectRelationships(variables: Variable[]): ObjectRelationshipData {
  const objects: Record<string, any> = {};
  const references: Array<{ from: string, to: string, type: string }> = [];
  const processed = new Set<any>();

  // Reset counter for each analysis to avoid memory leaks
  objectIdCounter = 0;

  // First pass: collect all objects
  variables.forEach(variable => {
    extractObjects(variable.name, variable.value, objects, references, processed);
  });

  return {
    variables,
    objects,
    references
  };
}

/**
 * Recursively extracts objects and their relationships
 */
function extractObjects(
  path: string,
  value: any,
  objects: Record<string, any>,
  references: Array<{ from: string, to: string, type: string }>,
  processed: Set<any>,
  parentPath?: string
): void {
  // Handle primitives and null
  if (value === null || value === undefined || typeof value !== 'object') {
    return;
  }

  // Avoid circular references
  if (processed.has(value)) {
    if (parentPath) {
      references.push({
        from: parentPath,
        to: getObjectId(value, objects),
        type: 'reference'
      });
    }
    return;
  }

  processed.add(value);
  const objId = getObjectId(value, objects);
  
  // Store the object if not already stored
  if (!objects[objId]) {
    objects[objId] = value;
  }
  
  // Add reference from parent if there is one
  if (parentPath) {
    references.push({
      from: parentPath,
      to: objId,
      type: 'reference'
    });
  }

  // Extract nested objects
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (item !== null && typeof item === 'object') {
        extractObjects(`${objId}[${index}]`, item, objects, references, processed, objId);
      }
    });
  } else {
    // Handle regular objects
    Object.entries(value).forEach(([key, prop]) => {
      if (prop !== null && typeof prop === 'object') {
        extractObjects(`${objId}.${key}`, prop, objects, references, processed, objId);
      }
    });
  }
}

/**
 * Gets or creates a unique ID for an object
 */
function getObjectId(obj: any, objects: Record<string, any>): string {
  // Try to find if this object is already in our registry
  for (const [id, value] of Object.entries(objects)) {
    if (value === obj) return id;
  }
  
  // Create a new ID
  let id = '';
  
  if (Array.isArray(obj)) {
    id = `array_${objectIdCounter++}`;
  } else if (obj instanceof Date) {
    id = `date_${objectIdCounter++}`;
  } else if (typeof obj === 'function') {
    id = `func_${obj.name || 'anonymous'}_${objectIdCounter++}`;
  } else {
    id = `obj_${objectIdCounter++}`;
  }
  
  return id;
}

/**
 * Converts the object relationship data to a graph structure for visualization
 */
export function generateGraphData(data: ObjectRelationshipData): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  
  // Add variable nodes
  data.variables.forEach(variable => {
    const nodeId = `var_${variable.name}`;
    
    nodes.push({
      id: nodeId,
      label: variable.name,
      type: typeof variable.value === 'object' && variable.value !== null ? 'object' : 'primitive',
      data: variable.value,
      metadata: {
        changed: variable.changed
      }
    });
    
    // If the variable references an object, add an edge
    if (typeof variable.value === 'object' && variable.value !== null) {
      const objId = getObjectId(variable.value, data.objects);
      
      edges.push({
        id: `edge_${nodeId}_${objId}`,
        source: nodeId,
        target: objId,
        type: 'reference'
      });
    }
  });
  
  // Add object nodes
  Object.entries(data.objects).forEach(([id, obj]) => {
    const type = Array.isArray(obj) ? 'array' : 
                typeof obj === 'function' ? 'function' : 'object';
    
    const label = Array.isArray(obj) ? `Array(${obj.length})` : 
                 typeof obj === 'function' ? `Function: ${obj.name || 'anonymous'}` :
                 `Object`;
    
    nodes.push({
      id,
      label,
      type,
      data: obj,
      metadata: {
        size: JSON.stringify(obj).length
      }
    });
  });
  
  // Add edges for references
  data.references.forEach((ref, index) => {
    edges.push({
      id: `ref_${index}`,
      source: ref.from,
      target: ref.to,
      label: ref.type,
      type: 'reference'
    });
  });
  
  return { nodes, edges };
}

/**
 * Compare two graph states and mark changed nodes
 */
export function compareGraphStates(prev: GraphData, current: GraphData): GraphData {
  const result = JSON.parse(JSON.stringify(current)) as GraphData;
  
  result.nodes = result.nodes.map(node => {
    const prevNode = prev.nodes.find(n => n.id === node.id);
    
    if (!prevNode) {
      // New node
      return {
        ...node,
        metadata: {
          ...node.metadata,
          changed: true
        }
      };
    }
    
    // Check if data changed
    const dataChanged = JSON.stringify(prevNode.data) !== JSON.stringify(node.data);
    
    return {
      ...node,
      metadata: {
        ...node.metadata,
        changed: dataChanged
      }
    };
  });
  
  return result;
}
