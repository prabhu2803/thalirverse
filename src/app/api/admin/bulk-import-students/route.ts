import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getRegionFromDistrict, makePlaceholderEmail } from '@/lib/supabaseClient';

const MAX_ROWS = 300;
const CONCURRENCY = 5;

interface ImportRow {
  fullName: string;
  school: string;
  standard: string;
  section: string;
  district: string;
  gender: string;
}

interface ImportResult {
  fullName: string;
  status: 'created' | 'skipped' | 'failed';
  password?: string;
  reason?: string;
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

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

  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!callerProfile || !['TEACHER_ADMIN', 'SUPER_ADMIN'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Not authorized to bulk-import students.' }, { status: 403 });
  }

  let rows: ImportRow[];
  try {
    const body = await request.json();
    rows = Array.isArray(body.rows) ? body.rows : [];
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided.' }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows — max ${MAX_ROWS} per import.` }, { status: 400 });
  }

  // Existing names, for cross-batch duplicate detection (login is name-based and
  // must resolve to exactly one account, so we can't create ambiguous names).
  const { data: existingProfiles } = await admin.from('profiles').select('full_name');
  const existingNames = new Set((existingProfiles ?? []).map(p => p.full_name.trim().toLowerCase()));

  const seenInBatch = new Set<string>();
  const results: ImportResult[] = new Array(rows.length);
  const toCreate: { index: number; row: ImportRow }[] = [];

  rows.forEach((row, index) => {
    const fullName = (row.fullName || '').trim();
    if (!fullName) {
      results[index] = { fullName: fullName || `Row ${index + 1}`, status: 'failed', reason: 'Missing name.' };
      return;
    }
    if (!row.school?.trim() || !row.standard?.trim()) {
      results[index] = { fullName, status: 'failed', reason: 'Missing school or standard.' };
      return;
    }
    const key = fullName.toLowerCase();
    if (existingNames.has(key)) {
      results[index] = { fullName, status: 'skipped', reason: 'An account with this exact name already exists.' };
      return;
    }
    if (seenInBatch.has(key)) {
      results[index] = { fullName, status: 'skipped', reason: 'Duplicate name within this import file.' };
      return;
    }
    seenInBatch.add(key);
    toCreate.push({ index, row: { ...row, fullName } });
  });

  // Bounded-concurrency creation so we don't hammer the Auth API.
  let cursor = 0;
  async function worker() {
    while (cursor < toCreate.length) {
      const item = toCreate[cursor++];
      const { row, index } = item;
      const password = generatePassword();
      const email = makePlaceholderEmail(row.fullName);
      const region = getRegionFromDistrict(row.district || '');
      const { error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          fullName: row.fullName,
          school: row.school,
          standard: row.standard,
          section: row.section || 'A',
          district: row.district || '',
          region,
          gender: row.gender || 'male',
        },
      });
      results[index] = error
        ? { fullName: row.fullName, status: 'failed', reason: error.message }
        : { fullName: row.fullName, status: 'created', password };
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toCreate.length) }, worker));

  return NextResponse.json({ results });
}
