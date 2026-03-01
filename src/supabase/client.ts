'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  }
  return supabaseInstance;
}
