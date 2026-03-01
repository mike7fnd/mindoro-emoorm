export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Log at startup so you can verify env vars in browser console
if (typeof window !== 'undefined') {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    console.error(
      '[Supabase] MISSING ENV VARS — auth will not work.',
      'NEXT_PUBLIC_SUPABASE_URL:', supabaseConfig.url ? 'OK' : 'MISSING',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseConfig.anonKey ? 'OK' : 'MISSING',
    );
  }
}
