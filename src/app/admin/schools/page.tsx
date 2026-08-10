'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dataService, supabase } from '@/lib/supabaseClient';
import AdminSidebar from '../AdminSidebar';

export default function AdminSchools() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState('');
  const [adminName, setAdminName] = useState('');

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');

  // Organization modal
  const [orgModal, setOrgModal] = useState<{ id?: string; name: string } | null>(null);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgDeleteTarget, setOrgDeleteTarget] = useState<any>(null);

  // School modal
  const [schoolModal, setSchoolModal] = useState<any | null>(null);
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [schoolDeleteTarget, setSchoolDeleteTarget] = useState<any>(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    async function load() {
      const admin = await dataService.getActiveStudent();
      if (!admin || !['YI_ADMIN', 'SUPER_ADMIN'].includes(admin.role)) { router.push('/login'); return; }
      setAdminRole(admin.role);
      setAdminName(admin.fullName || 'Admin');
      await refresh();
      setLoading(false);
    }
    load();
  }, []);

  async function refresh() {
    const [orgs, dir, students] = await Promise.all([
      dataService.getOrganizations(),
      dataService.getSchoolsDirectory(),
      dataService.getStudents(),
    ]);
    setOrganizations(orgs);
    setSchools(dir);
    const counts: Record<string, number> = {};
    students.forEach((s: any) => { if (s.school_id) counts[s.school_id] = (counts[s.school_id] ?? 0) + 1; });
    setStudentCounts(counts);
  }

  useEffect(() => {
    // Chapters directory for the school form's dropdown — fetched once.
    supabase.from('chapters').select('id, name').order('name').then(({ data }) => setChapters(data ?? []));
  }, []);

  const filteredSchools = schools.filter(s =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.district?.toLowerCase().includes(search.toLowerCase()) ||
    s.organizations?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveOrg = async () => {
    if (!orgModal?.name.trim()) return;
    setOrgSaving(true);
    try {
      if (orgModal.id) await dataService.updateOrganization(orgModal.id, orgModal.name);
      else await dataService.createOrganization(orgModal.name);
      setOrgModal(null);
      await refresh();
    } catch (e: any) {
      setFormError(e?.message || 'Failed to save.');
    } finally {
      setOrgSaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!orgDeleteTarget) return;
    await dataService.deleteOrganization(orgDeleteTarget.id);
    setOrgDeleteTarget(null);
    await refresh();
  };

  const handleSaveSchool = async () => {
    if (!schoolModal?.name?.trim() || !schoolModal?.district?.trim()) {
      setFormError('Name and district are required.');
      return;
    }
    setSchoolSaving(true);
    setFormError('');
    try {
      const fields = {
        name: schoolModal.name.trim(),
        city: (schoolModal.city || schoolModal.district).trim(),
        district: schoolModal.district.trim(),
        chapter_id: schoolModal.chapter_id || null,
        organization_id: schoolModal.organization_id || null,
        coordinator_name: schoolModal.coordinator_name || null,
        coordinator_mobile: schoolModal.coordinator_mobile || null,
      };
      if (schoolModal.id) await dataService.updateSchool(schoolModal.id, fields);
      else await dataService.createSchool(fields);
      setSchoolModal(null);
      await refresh();
    } catch (e: any) {
      setFormError(e?.message || 'Failed to save — the school name may already exist.');
    } finally {
      setSchoolSaving(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!schoolDeleteTarget) return;
    await dataService.deleteSchool(schoolDeleteTarget.id);
    setSchoolDeleteTarget(null);
    await refresh();
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="text-orange-500 font-bold flex flex-col items-center gap-2">
        <span className="animate-spin text-4xl">⏳</span>
        <span>Loading Schools...</span>
      </div>
    </div>
  );

  return (
    <div className="flex overflow-hidden h-screen bg-neutral-50 font-body text-neutral-900">
      <AdminSidebar role={adminRole} adminName={adminName} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <main className="px-8 pt-8 pb-12 space-y-8 max-w-6xl">
          <section>
            <h1 className="text-3xl font-black font-headline tracking-tight">Schools & Organizations</h1>
            <p className="text-neutral-500 text-sm mt-1">
              Group multiple campuses of the same brand under one organization, or manage standalone schools.
            </p>
          </section>

          {/* Organizations */}
          <section className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline font-black text-lg">Organizations</h2>
              <button onClick={() => { setFormError(''); setOrgModal({ name: '' }); }}
                className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">add</span>
                New Organization
              </button>
            </div>
            {organizations.length === 0 ? (
              <p className="text-sm text-neutral-400">No organizations yet — most schools are standalone and don't need one.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {organizations.map(org => {
                  const campusCount = schools.filter(s => s.organization_id === org.id).length;
                  return (
                    <div key={org.id} className="flex items-center justify-between p-4 border border-neutral-100 rounded-2xl bg-neutral-50/50">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-neutral-800 truncate">{org.name}</p>
                        <p className="text-xs text-neutral-400">{campusCount} campus{campusCount !== 1 ? 'es' : ''}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setFormError(''); setOrgModal({ id: org.id, name: org.name }); }}
                          className="p-1.5 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onClick={() => setOrgDeleteTarget(org)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Schools */}
          <section className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-neutral-100">
              <div>
                <h2 className="font-headline font-black text-lg">Schools ({schools.length})</h2>
                <p className="text-xs text-neutral-400 mt-0.5">One row per physical campus.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schools..."
                  className="flex-1 sm:w-56 px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                <button onClick={() => { setFormError(''); setSchoolModal({ name: '', city: '', district: '', chapter_id: '', organization_id: '' }); }}
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0">
                  <span className="material-symbols-outlined text-sm">add</span>
                  New School
                </button>
              </div>
            </div>

            {filteredSchools.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 font-bold font-label uppercase text-[10px] tracking-wider border-b border-neutral-100">
                      <th className="px-6 py-3">School</th>
                      <th className="px-6 py-3">Organization</th>
                      <th className="px-6 py-3">Location</th>
                      <th className="px-6 py-3 text-center">Students</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredSchools.map(s => (
                      <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold">{s.name}</div>
                          {s.coordinator_name && <div className="text-xs text-neutral-400 mt-0.5">{s.coordinator_name}</div>}
                        </td>
                        <td className="px-6 py-4 text-neutral-600">{s.organizations?.name || '—'}</td>
                        <td className="px-6 py-4 text-neutral-600">{s.district || '—'}</td>
                        <td className="px-6 py-4 text-center font-bold">{studentCounts[s.id] ?? 0}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setFormError(''); setSchoolModal(s); }}
                              title="Edit" className="p-2 rounded-xl text-neutral-400 hover:text-orange-500 hover:bg-orange-50 transition-all">
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button onClick={() => setSchoolDeleteTarget(s)}
                              title="Delete" className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-10 text-center text-sm text-neutral-400">No schools match your search.</p>
            )}
          </section>
        </main>
      </div>

      {/* ── Organization modal ── */}
      {orgModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl border border-slate-100">
            <h3 className="font-headline font-black text-lg mb-5">{orgModal.id ? 'Rename' : 'New'} Organization</h3>
            {formError && <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 rounded-xl border border-red-100 font-bold">{formError}</div>}
            <input autoFocus value={orgModal.name} onChange={e => setOrgModal({ ...orgModal, name: e.target.value })}
              placeholder="e.g. Greenwood High School"
              className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all mb-5" />
            <div className="flex gap-3">
              <button onClick={() => setOrgModal(null)} className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">Cancel</button>
              <button onClick={handleSaveOrg} disabled={orgSaving} className="w-1/2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
                {orgSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Organization delete confirm ── */}
      {orgDeleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-500">domain_disabled</span>
              </div>
              <div>
                <h3 className="font-headline font-black text-lg">Delete Organization?</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  <span className="font-bold text-neutral-700">{orgDeleteTarget.name}</span> will be removed. Its campuses stay, just unassigned from any organization.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setOrgDeleteTarget(null)} className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">Cancel</button>
                <button onClick={handleDeleteOrg} className="w-1/2 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── School modal ── */}
      {schoolModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-headline font-black text-lg mb-5">{schoolModal.id ? 'Edit' : 'New'} School</h3>
            {formError && <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 rounded-xl border border-red-100 font-bold">{formError}</div>}
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="font-label font-semibold text-xs text-neutral-500 mb-2">School / Campus Name *</label>
                <input value={schoolModal.name} onChange={e => setSchoolModal({ ...schoolModal, name: e.target.value })}
                  placeholder="e.g. Greenwood High School — Chennai Campus"
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
              </div>
              <div className="flex flex-col">
                <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Organization (optional)</label>
                <select value={schoolModal.organization_id || ''} onChange={e => setSchoolModal({ ...schoolModal, organization_id: e.target.value || null })}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm appearance-none transition-all">
                  <option value="">Standalone (no organization)</option>
                  {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-xs text-neutral-500 mb-2">District / City *</label>
                  <input value={schoolModal.district || ''} onChange={e => setSchoolModal({ ...schoolModal, district: e.target.value })}
                    placeholder="Madurai"
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                </div>
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Chapter</label>
                  <select value={schoolModal.chapter_id || ''} onChange={e => setSchoolModal({ ...schoolModal, chapter_id: e.target.value || null })}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm appearance-none transition-all">
                    <option value="">None</option>
                    {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Coordinator Name</label>
                  <input value={schoolModal.coordinator_name || ''} onChange={e => setSchoolModal({ ...schoolModal, coordinator_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                </div>
                <div className="flex flex-col">
                  <label className="font-label font-semibold text-xs text-neutral-500 mb-2">Coordinator Mobile</label>
                  <input value={schoolModal.coordinator_mobile || ''} onChange={e => setSchoolModal({ ...schoolModal, coordinator_mobile: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 text-sm transition-all" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-6">
              <button onClick={() => setSchoolModal(null)} className="w-1/3 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">Cancel</button>
              <button onClick={handleSaveSchool} disabled={schoolSaving} className="w-2/3 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
                {schoolSaving ? 'Saving...' : 'Save School'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── School delete confirm ── */}
      {schoolDeleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-500">delete_forever</span>
              </div>
              <div>
                <h3 className="font-headline font-black text-lg">Delete School?</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  <span className="font-bold text-neutral-700">{schoolDeleteTarget.name}</span> will be removed.
                  {(studentCounts[schoolDeleteTarget.id] ?? 0) > 0 && (
                    <> {studentCounts[schoolDeleteTarget.id]} student(s) linked to it will keep their free-text school name but lose the school link.</>
                  )}
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setSchoolDeleteTarget(null)} className="w-1/2 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-sm transition-all">Cancel</button>
                <button onClick={handleDeleteSchool} className="w-1/2 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
