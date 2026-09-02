import { createClient } from '@supabase/supabase-js';

// Server-only client using the service role key. Never import this file from
// a 'use client' component — that would bundle the key into client-shipped
// JS. Safe to use from API routes (src/app/api/**) or plain (non-'use
// client') Server Components/pages, since both execute server-only.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — add it to .env.local (see .env.example).');
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
