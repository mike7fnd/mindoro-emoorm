'use client';

import { SupabaseClient } from '@supabase/supabase-js';

/** Initiate email/password sign-up. */
export async function initiateEmailSignUp(supabase: SupabaseClient | any, email: string, password: string) {
  const client: SupabaseClient = supabase?.supabase ?? supabase;
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined,
    },
  });
  if (error) throw error;

  // No session means email confirmation is required
  const needsConfirmation = !!(data.user && !data.session);
  return { user: data.user, needsConfirmation };
}

/** Initiate email/password sign-in. */
export async function initiateEmailSignIn(supabase: SupabaseClient | any, email: string, password: string) {
  const client: SupabaseClient = supabase?.supabase ?? supabase;
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return { user: data.user };
}

/** Initiate Google OAuth sign-in (redirect-based). */
export async function initiateGoogleSignIn(supabase: SupabaseClient | any) {
  const client: SupabaseClient = supabase?.supabase ?? supabase;
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
}
