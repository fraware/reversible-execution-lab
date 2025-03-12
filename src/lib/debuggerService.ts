
import { supabase, logSupabaseResponse } from './supabase';
import { DebuggingSession, CheckpointData, ExecutionState, ExecutionStatistics } from '@/types/debugger';

export interface SessionResponse {
  data?: DebuggingSession;
  error?: Error;
}

export interface CheckpointResponse {
  data?: CheckpointData;
  error?: Error;
}

export const debuggerService = {
  // Session operations
  async saveSession(session: Partial<DebuggingSession>): Promise<SessionResponse> {
    const { data, error } = await supabase
      .from('debugging_sessions')
      .upsert({
        user_id: session.userId,
        code: session.code,
        name: session.name,
        language: session.language || 'python',
        last_accessed: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select();
    
    return { 
      data: data?.[0] ? {
        id: data[0].id,
        userId: data[0].user_id,
        code: data[0].code,
        name: data[0].name,
        language: data[0].language,
        createdAt: new Date(data[0].created_at),
        lastAccessed: new Date(data[0].last_accessed),
        checkpoints: []
      } : undefined, 
      error: error as Error | undefined 
    };
  },
  
  async getSessions(userId: string) {
    const { data, error } = await supabase
      .from('debugging_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed', { ascending: false });
    
    if (error) return { data: null, error };
    
    return { 
      data: data.map(session => ({
        id: session.id,
        userId: session.user_id,
        code: session.code,
        name: session.name,
        language: session.language || 'python',
        createdAt: new Date(session.created_at),
        lastAccessed: new Date(session.last_accessed),
        checkpoints: []
      })), 
      error: null 
    };
  },
  
  async getSession(id: string): Promise<SessionResponse> {
    const { data, error } = await supabase
      .from('debugging_sessions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return { error: error as Error };
    
    // Get checkpoints for this session
    const checkpointsResult = await this.getCheckpoints(id);
    
    return { 
      data: {
        id: data.id,
        userId: data.user_id,
        code: data.code,
        name: data.name,
        language: data.language || 'python',
        createdAt: new Date(data.created_at),
        lastAccessed: new Date(data.last_accessed),
        checkpoints: checkpointsResult.data || []
      }
    };
  },
  
  async deleteSession(id: string) {
    // Delete all checkpoints first
    await supabase
      .from('checkpoints')
      .delete()
      .eq('session_id', id);
      
    // Then delete the session
    return await supabase
      .from('debugging_sessions')
      .delete()
      .eq('id', id);
  },
  
  // Checkpoint operations
  async saveCheckpoint(checkpoint: Partial<CheckpointData>): Promise<CheckpointResponse> {
    const { data, error } = await supabase
      .from('checkpoints')
      .upsert({
        session_id: checkpoint.sessionId,
        line_number: checkpoint.lineNumber,
        variables: checkpoint.state || '{}',
        notes: checkpoint.notes || `Checkpoint at line ${checkpoint.lineNumber}`,
        memory_snapshot: checkpoint.memorySnapshot || 0
      }, { onConflict: 'id' })
      .select();
    
    return { 
      data: data?.[0] ? {
        id: data[0].id,
        sessionId: data[0].session_id,
        lineNumber: data[0].line_number,
        state: data[0].variables,
        timestamp: new Date(data[0].created_at),
        notes: data[0].notes,
        memorySnapshot: data[0].memory_snapshot
      } : undefined, 
      error: error as Error | undefined 
    };
  },
  
  async getCheckpoints(sessionId: string) {
    const { data, error } = await supabase
      .from('checkpoints')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) return { data: null, error };
    
    return { 
      data: data.map(cp => ({
        id: cp.id,
        sessionId: cp.session_id,
        lineNumber: cp.line_number,
        state: cp.variables,
        timestamp: new Date(cp.created_at),
        notes: cp.notes,
        memorySnapshot: cp.memory_snapshot
      })), 
      error: null 
    };
  },
  
  async deleteCheckpoint(id: string) {
    return await supabase
      .from('checkpoints')
      .delete()
      .eq('id', id);
  },
  
  // Performance analysis
  async saveExecutionStatistics(
    sessionId: string, 
    stats: ExecutionStatistics
  ) {
    return await supabase
      .from('execution_statistics')
      .upsert({
        session_id: sessionId,
        total_execution_time: stats.totalExecutionTime,
        peak_memory_usage: stats.peakMemoryUsage,
        variable_changes: JSON.stringify(stats.variableChanges),
        line_execution_count: JSON.stringify(stats.lineExecutionCount),
        created_at: new Date().toISOString()
      }, { onConflict: 'session_id' })
      .select();
  },
  
  async getExecutionStatistics(sessionId: string) {
    const { data, error } = await supabase
      .from('execution_statistics')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error) return { data: null, error };
    
    return {
      data: {
        totalExecutionTime: data.total_execution_time,
        peakMemoryUsage: data.peak_memory_usage,
        variableChanges: JSON.parse(data.variable_changes || '{}'),
        lineExecutionCount: JSON.parse(data.line_execution_count || '{}')
      },
      error: null
    };
  },
  
  // Compare checkpoints
  compareCheckpoints(checkpoint1: CheckpointData, checkpoint2: CheckpointData) {
    try {
      const state1 = JSON.parse(checkpoint1.state) as ExecutionState;
      const state2 = JSON.parse(checkpoint2.state) as ExecutionState;
      
      const differences = {
        variables: {} as Record<string, { old: any, new: any }>,
        memoryDifference: state2.memory - state1.memory,
        timeDifference: new Date(state2.timestamp).getTime() - new Date(state1.timestamp).getTime()
      };
      
      // Compare variables
      const allVarNames = new Set<string>();
      state1.variables.forEach(v => allVarNames.add(v.name));
      state2.variables.forEach(v => allVarNames.add(v.name));
      
      allVarNames.forEach(name => {
        const var1 = state1.variables.find(v => v.name === name);
        const var2 = state2.variables.find(v => v.name === name);
        
        if (!var1 || !var2 || JSON.stringify(var1.value) !== JSON.stringify(var2.value)) {
          differences.variables[name] = {
            old: var1?.value,
            new: var2?.value
          };
        }
      });
      
      return differences;
    } catch (e) {
      console.error('Error comparing checkpoints:', e);
      return null;
    }
  }
};

// Add SQL to create the execution_statistics table
// This would be run once during app initialization
export async function createExecutionStatisticsTable() {
  const { error } = await supabase.rpc('create_execution_statistics_table', {});
  
  if (error) {
    console.error('Error creating execution_statistics table:', error);
    return false;
  }
  return true;
}
