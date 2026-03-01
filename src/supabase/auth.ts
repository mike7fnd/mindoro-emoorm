'use client';

import { SupabaseClient } from '@supabase/supabase-js';

/** Sign up with email/password. Returns user and whether email confirmation is needed. */
export async function initiateEmailSignUp(supabase: SupabaseClient, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined,
    },
  });
  if (error) throw error;
  return {
    user: data.user,
    needsConfirmation: !!(data.user && !data.session),
  };
}

/** Sign in with email/password. */
export async function initiateEmailSignIn(supabase: SupabaseClient, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user };
}

/** Google OAuth sign-in (redirect-based). */
export async function initiateGoogleSignIn(supabase: SupabaseClient) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
}
