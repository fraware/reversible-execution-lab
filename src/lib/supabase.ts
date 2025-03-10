
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ttawpzjougjsfkwwydgv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0YXdwempvdWdqc2Zrd3d5ZGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU2MzE5ODYsImV4cCI6MjAzMTIwNzk4Nn0.XrU5kGSTnDSGEZM0lj--rfz5SMKcpjKrjMJtODnb_R4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debugging helper
export const logSupabaseResponse = (response: any, operation: string) => {
  if (response.error) {
    console.error(`Supabase ${operation} error:`, response.error);
    return false;
  }
  console.log(`Supabase ${operation} success:`, response.data);
  return true;
};
