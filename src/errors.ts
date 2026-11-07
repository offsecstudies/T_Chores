/** Supabase/PostgREST errors can be plain objects rather than Error instances. */
export function connectionError(error: unknown): string {
 const value = error && typeof error === 'object' ? error as Record<string, unknown> : {};
 const code = typeof value.code === 'string' ? value.code : '';
 const message = typeof value.message === 'string' ? value.message : '';
 if (code === 'PGRST205' || code === '42P01') return 'The chores database table is missing. Run supabase/schema.sql in your Supabase project’s SQL Editor, then tap Retry.';
 if (code === '42501') return 'The database denied access. Run supabase/schema.sql in your Supabase project’s SQL Editor to restore account permissions, then tap Retry.';
 if (code === 'PGRST301' || code === 'PGRST303') return 'Your sign-in session is invalid or expired. Sign out, then sign in again.';
 return message ? `${message}${code ? ` (${code})` : ''}` : 'Could not reach Supabase. Check your connection and project settings, then tap Retry.';
}
