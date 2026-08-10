import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  let body: { fullName?: string; answer?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const fullName = (body.fullName || '').trim();
  const answer = (body.answer || '').trim();
  const newPassword = body.newPassword || '';

  if (!fullName || !answer) {
    return NextResponse.json({ error: 'Name and answer are required.' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  // Answer verification happens inside Postgres (verify_security_answer) —
  // the hash never leaves the database, and this route never sees it.
  const { data: userId, error: verifyError } = await supabase.rpc('verify_security_answer', {
    p_full_name: fullName,
    p_answer: answer,
  });
  if (verifyError) {
    // Distinguish "not set up yet" (missing migration) from a genuine mismatch,
    // so this doesn't silently masquerade as a wrong answer.
    if (verifyError.code === 'PGRST202') {
      return NextResponse.json({ error: 'Password reset isn\'t set up yet — sql/security_question_reset.sql needs to be run.' }, { status: 500 });
    }
    return NextResponse.json({ error: verifyError.message }, { status: 500 });
  }
  if (!userId) {
    return NextResponse.json({ error: 'That name and answer combination doesn\'t match an account.' }, { status: 401 });
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server misconfigured.' }, { status: 500 });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
