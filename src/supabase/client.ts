'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const url = supabaseConfig.url || 'https://placeholder.supabase.co';
    const key = supabaseConfig.anonKey || 'placeholder-key';
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}
