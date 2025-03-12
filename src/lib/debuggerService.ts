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
    try {
      // First check if the table exists
      const { error: checkError } = await supabase
        .from('debugging_sessions')
        .select('id')
        .limit(1);
      
      // If table doesn't exist yet, we'll create it or handle accordingly
      if (checkError) {
        console.log('Debugging sessions table may not exist yet:', checkError.message);
        // Here we could try to create the table, but for now we'll just return an error
        return { 
          error: new Error('Database setup incomplete. Please ensure debugging_sessions table exists.') 
        };
      }
      
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
      
      if (error) {
        console.error('Error saving session:', error);
        return { error: error as Error };
      }
      
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
        error: undefined 
      };
    } catch (err) {
      console.error('Unexpected error saving session:', err);
      return { error: err as Error };
    }
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
    try {
      // Check if checkpoints table exists
      const { error: checkError } = await supabase
        .from('checkpoints')
        .select('id')
        .limit(1);
      
      if (checkError) {
        console.log('Checkpoints table may not exist yet:', checkError.message);
        // For now we'll simulate a successful save with mock data in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Simulating checkpoint save');
          return {
            data: {
              id: checkpoint.id || `mock-${Date.now()}`,
              sessionId: checkpoint.sessionId || 'mock-session',
              lineNumber: checkpoint.lineNumber || 0,
              state: checkpoint.state || '{}',
              timestamp: new Date(),
              notes: checkpoint.notes || 'Development mode checkpoint',
              memorySnapshot: checkpoint.memorySnapshot || 0
            }
          };
        }
        
        return { error: new Error('Database setup incomplete. Please ensure checkpoints table exists.') };
      }
      
      const { data, error } = await supabase
        .from('checkpoints')
        .upsert({
          id: checkpoint.id,
          session_id: checkpoint.sessionId,
          line_number: checkpoint.lineNumber,
          variables: checkpoint.state || '{}',
          notes: checkpoint.notes || `Checkpoint at line ${checkpoint.lineNumber}`,
          memory_snapshot: checkpoint.memorySnapshot || 0
        }, { onConflict: 'id' })
        .select();
      
      if (error) {
        console.error('Error saving checkpoint:', error);
        return { error: error as Error };
      }
      
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
        error: undefined 
      };
    } catch (err) {
      console.error('Unexpected error saving checkpoint:', err);
      return { error: err as Error };
    }
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
    // First, check if the table exists
    const { error: checkError } = await supabase.from('execution_statistics').select('session_id').limit(1);
    
    // If table doesn't exist, create it by using SQL directly
    if (checkError) {
      console.log("Attempting to create execution_statistics table");
      const { error: createError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.execution_statistics (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            session_id uuid REFERENCES public.debugging_sessions(id) ON DELETE CASCADE,
            total_execution_time float8 NOT NULL,
            peak_memory_usage int8 NOT NULL,
            variable_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
            line_execution_count jsonb NOT NULL DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now() NOT NULL,
            UNIQUE(session_id)
          );
        `
      });
      
      if (createError) {
        console.error("Failed to create execution_statistics table:", createError);
        return { error: createError };
      }
    }
    
    // Now insert/update the statistics
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

// Replace the SQL query execution with a simpler approach
export async function createExecutionStatisticsTable() {
  try {
    // Check if table exists first
    const { error: checkError } = await supabase
      .from('execution_statistics')
      .select('session_id')
      .limit(1);
    
    // We'll just log the error and continue. In a real app, we would create
    // the table through a migration script or Supabase dashboard
    if (checkError) {
      console.log("Table execution_statistics doesn't exist. This is expected on first run.");
      console.log("You can create this table via the Supabase dashboard with this SQL:");
      console.log(`
        CREATE TABLE IF NOT EXISTS public.execution_statistics (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          session_id uuid REFERENCES public.debugging_sessions(id) ON DELETE CASCADE,
          total_execution_time float8 NOT NULL,
          peak_memory_usage int8 NOT NULL,
          variable_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
          line_execution_count jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamp with time zone DEFAULT now() NOT NULL,
          UNIQUE(session_id)
        );
      `);
    }
    
    return true; // Continue execution even if table doesn't exist
  } catch (err) {
    console.error("Error checking execution_statistics table:", err);
    return false;
  }
}
