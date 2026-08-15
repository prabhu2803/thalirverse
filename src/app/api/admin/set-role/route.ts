import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const VALID_ROLES = ['STUDENT', 'TEACHER_ADMIN', 'SUPER_ADMIN'];

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

  // Only Super Admin can (re)assign roles.
  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!callerProfile || callerProfile.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Not authorized to change roles.' }, { status: 403 });
  }

  let body: { userId?: string; role?: string; schoolIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const userId = body.userId || '';
  const role = body.role || '';
  const schoolIds = Array.isArray(body.schoolIds) ? body.schoolIds : [];

  if (!userId || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'A valid userId and role are required.' }, { status: 400 });
  }
  if (userId === user.id && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: "You can't change your own role." }, { status: 400 });
  }

  const { data: target } = await admin.from('profiles').select('id, full_name, role').eq('id', userId).single();
  if (!target) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const { error: updateError } = await admin.from('profiles').update({ role }).eq('id', userId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Demoted away from an admin role — their school assignments are meaningless now.
  if (role === 'STUDENT' && target.role !== 'STUDENT') {
    await admin.from('admin_schools').delete().eq('admin_id', userId);
  }

  // Promoted (or re-scoped) to TEACHER_ADMIN with schools supplied — replace their assignment set.
  if (role === 'TEACHER_ADMIN' && schoolIds.length > 0) {
    await admin.from('admin_schools').delete().eq('admin_id', userId);
    const { error: schoolsError } = await admin.from('admin_schools').insert(
      schoolIds.map(schoolId => ({ admin_id: userId, school_id: schoolId }))
    );
    if (schoolsError) {
      return NextResponse.json({ error: `Role changed but school assignment failed: ${schoolsError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
