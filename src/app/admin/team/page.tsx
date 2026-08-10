'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dataService, supabase } from '@/lib/supabaseClient';
import AdminSidebar from '../AdminSidebar';

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function AdminTeam() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState('');
  const [adminName, setAdminName] = useState('');

  const [admins, setAdmins] = useState<any[]>([]);
  const [schoolsMap, setSchoolsMap] = useState<Record<string, { id: string; name: string }[]>>({});
  const [schools, setSchools] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');

  // Add Admin modal
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'YI_ADMIN' | 'SUPER_ADMIN'>('YI_ADMIN');
  const [newSchoolIds, setNewSchoolIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit schools modal
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editSchoolIds, setEditSchoolIds] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const admin = await dataService.getActiveStudent();
        if (!admin || admin.role !== 'SUPER_ADMIN') { router.push('/login'); return; }
        setAdminRole(admin.role);
        setAdminName(admin.fullName || 'Admin');
        await refresh();
      } catch (e: any) {
        setLoadError(e?.message || 'Failed to load team.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function refresh() {
    try {
      const [adminList, map, dir] = await Promise.all([
        dataService.getAdmins(),
        dataService.getAdminSchoolsMap(),
        dataService.getSchoolsDirectory(),
      ]);
      setAdmins(adminList);
      setSchoolsMap(map);
      setSchools(dir);
      setLoadError('');
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to load team. Has sql/admin_schools.sql been run yet?');
    }
  }

  const openAdd = () => {
    setFormError('');
    setNewName(''); setNewPassword(generatePassword()); setNewRole('YI_ADMIN'); setNewSchoolIds([]);
    setAddOpen(true);
  };

  const toggleSchool = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter(s => s !== id) : [...list, id]);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { setFormError('Name is required.'); return; }
    if (newPassword.length < 6) { setFormError('Password must be at least 6 characters.'); return; }
    setCreating(true);
    setFormError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired — please log in again.');
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ fullName: newName.trim(), password: newPassword, role: newRole, schoolIds: newSchoolIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create admin.');
      setAddOpen(false);
      await refresh();
    } catch (e: any) {
      setFormError(e?.message || 'Failed to create admin.');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (admin: any) => {
    setEditTarget(admin);
    setEditSchoolIds((schoolsMap[admin.id] ?? []).map(s => s.id));
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      await dataService.setAdminSchools(editTarget.id, editSchoolIds);
      setEditTarget(null);
      await refresh();
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to save school assignments.');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
        <span className="animate-spin text-4xl">⏳</span>
        <span>Loading Team...</span>
      </div>
    </div>
  );

  return (
    <div className="flex overflow-hidden h-screen bg-neutral-50 font-body text-neutral-900">
      <AdminSidebar role={adminRole} adminName={adminName} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <main className="px-8 pt-8 pb-12 space-y-8 max-w-5xl">
          <section className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tight">Team</h1>
              <p className="text-neutral-500 text-sm mt-1">Add organizers and assign them to the schools they cover.</p>
            </div>
            <button onClick={openAdd}
              className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center gap-2 text-sm hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md">
              <span className="material-symbols-outlined text-sm">person_add</span>
              Add Admin
            </button>
          </section>

          {loadError && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100 font-bold">{loadError}</div>
          )}

          <section className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100">
              <h3 className="font-bold font-headline text-base">Admin Accounts ({admins.length})</h3>
            </div>
            {admins.length === 0 ? (
              <p className="p-10 text-center text-sm text-neutral-400">No admin accounts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 font-bold font-label uppercase text-[10px] tracking-wider border-b border-neutral-100">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Schools</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {admins.map(a => (
                      <tr key={a.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold">{a.full_name}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider ${
                            a.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>{a.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Yi Admin'}</span>
                        </td>
                        <td className="px-6 py-4 text-neutral-600 max-w-xs">
                          {(schoolsMap[a.id]?.length ?? 0) === 0
                            ? <span className="text-neutral-300">— none assigned —</span>
                            : (schoolsMap[a.id] ?? []).map(s => s.name).join(', ')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => openEdit(a)} title="Edit school assignments"
                            className="p-2 rounded-xl text-neutral-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                            <span className="material-symbols-outlined text-lg">edit_location_alt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ── Add Admin modal ── */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-headline font-black text-lg mb-5">Add Admin</h3>
            {formError && <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 rounded-xl border border-red-100 font-bold">{formError}</div>}
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Full Name (this is their login name) *</label>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Priya Organiser"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
              </div>
              <div className="flex flex-col">
                <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Password *</label>
                <div className="flex gap-2">
                  <input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm font-mono transition-all" />
                  <button type="button" onClick={() => setNewPassword(generatePassword())}
                    className="px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-bold rounded-xl transition-all shrink-0">
                    Regenerate
                  </button>
                </div>
                <p className="text-xs text-neutral-400 mt-1.5">Share this with them directly — it won&apos;t be shown again.</p>
              </div>
              <div className="flex flex-col">
                <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value as 'YI_ADMIN' | 'SUPER_ADMIN')}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm appearance-none transition-all">
                  <option value="YI_ADMIN">Yi Admin (organizer)</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              {newRole === 'YI_ADMIN' && (
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Assigned Schools</label>
                  {schools.length === 0 ? (
                    <p className="text-xs text-neutral-400">No schools in the directory yet — add some from the Schools page first.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-3 space-y-1">
                      {schools.map(s => (
                        <label key={s.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-50 cursor-pointer">
                          <input type="checkbox" checked={newSchoolIds.includes(s.id)}
                            onChange={() => toggleSchool(s.id, newSchoolIds, setNewSchoolIds)}
                            className="w-4 h-4 accent-orange-500 rounded" />
                          <span className="text-sm text-neutral-700">{s.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-6">
              <button onClick={() => setAddOpen(false)} className="w-1/3 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">Cancel</button>
              <button onClick={handleCreate} disabled={creating}
                className="w-2/3 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
                {creating ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit school assignments modal ── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-headline font-black text-lg mb-1">{editTarget.full_name}</h3>
            <p className="text-xs text-neutral-400 mb-5">Assigned Schools</p>
            {schools.length === 0 ? (
              <p className="text-sm text-neutral-400">No schools in the directory yet.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-xl p-3 space-y-1">
                {schools.map(s => (
                  <label key={s.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-neutral-50 cursor-pointer">
                    <input type="checkbox" checked={editSchoolIds.includes(s.id)}
                      onChange={() => toggleSchool(s.id, editSchoolIds, setEditSchoolIds)}
                      className="w-4 h-4 accent-orange-500 rounded" />
                    <span className="text-sm text-neutral-700">{s.name}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-6">
              <button onClick={() => setEditTarget(null)} className="w-1/3 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">Cancel</button>
              <button onClick={handleSaveEdit} disabled={savingEdit}
                className="w-2/3 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
