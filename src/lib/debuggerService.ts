
import { supabase, logSupabaseResponse } from './supabase';

export interface DebuggingSession {
  id?: string;
  user_id: string;
  code: string;
  name: string;
  created_at?: string;
  last_accessed?: string;
}

export interface Checkpoint {
  id?: string;
  session_id: string;
  line_number: number;
  variables: string;
  notes?: string;
  created_at?: string;
}

export const debuggerService = {
  // Session operations
  async saveSession(session: DebuggingSession) {
    const { data, error } = await supabase
      .from('debugging_sessions')
      .upsert(session, { onConflict: 'id' })
      .select();
    
    return { data: data?.[0], error };
  },
  
  async getSessions(userId: string) {
    return await supabase
      .from('debugging_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_accessed', { ascending: false });
  },
  
  async getSession(id: string) {
    return await supabase
      .from('debugging_sessions')
      .select('*')
      .eq('id', id)
      .single();
  },
  
  async deleteSession(id: string) {
    return await supabase
      .from('debugging_sessions')
      .delete()
      .eq('id', id);
  },
  
  // Checkpoint operations
  async saveCheckpoint(checkpoint: Checkpoint) {
    const { data, error } = await supabase
      .from('checkpoints')
      .upsert(checkpoint, { onConflict: 'id' })
      .select();
    
    return { data: data?.[0], error };
  },
  
  async getCheckpoints(sessionId: string) {
    return await supabase
      .from('checkpoints')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
  },
  
  async deleteCheckpoint(id: string) {
    return await supabase
      .from('checkpoints')
      .delete()
      .eq('id', id);
  }
};
