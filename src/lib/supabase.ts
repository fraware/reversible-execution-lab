
import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const supabaseUrl = 'https://ttawpzjougjsfkwwydgv.supabase.co';
// Replace with the correct anon key from your Supabase project
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0YXdwempvdWdqc2Zrd3d5ZGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MjA0NDUsImV4cCI6MjA1NzE5NjQ0NX0.adq3x-3ZiERdq8E8NMp4-Aq1etfshxFP1LdBhs0XN2g';

// Initialize the Supabase client
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

// Check if Supabase is correctly initialized
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Supabase connection exception:', err);
    return false;
  }
};
