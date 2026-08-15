import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { makePlaceholderEmail } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
  }

  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server misconfigured.' }, { status: 500 });
  }

  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  // Only Super Admin can create new admin accounts.
  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!callerProfile || callerProfile.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Not authorized to create admin accounts.' }, { status: 403 });
  }

  let body: { fullName?: string; password?: string; role?: string; schoolIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const fullName = (body.fullName || '').trim();
  const password = body.password || '';
  const role = body.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TEACHER_ADMIN';
  const schoolIds = Array.isArray(body.schoolIds) ? body.schoolIds : [];

  if (!fullName) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const { data: existing } = await admin.from('profiles').select('id').ilike('full_name', fullName).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'An account with this exact name already exists — login names must be unique.' }, { status: 409 });
  }

  const email = makePlaceholderEmail(fullName);
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { fullName },
  });
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || 'Failed to create account.' }, { status: 500 });
  }

  const newAdminId = created.user.id;

  const { error: roleError } = await admin.from('profiles').update({ role }).eq('id', newAdminId);
  if (roleError) {
    return NextResponse.json({ error: `Account created but role assignment failed: ${roleError.message}` }, { status: 500 });
  }

  if (schoolIds.length > 0) {
    const { error: schoolsError } = await admin.from('admin_schools').insert(
      schoolIds.map(schoolId => ({ admin_id: newAdminId, school_id: schoolId }))
    );
    if (schoolsError) {
      return NextResponse.json({ error: `Account created but school assignment failed: ${schoolsError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
