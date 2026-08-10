'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { dataService } from '@/lib/supabaseClient';

const YI_ADMIN_NAV = [
  { label: 'Analytics',  href: '/admin/analytics', icon: 'insights' },
  { label: 'Students',   href: '/admin',           icon: 'group' },
  { label: 'Schools',    href: '/admin/schools',   icon: 'apartment' },
];

const SUPER_ADMIN_NAV = [
  { label: 'Analytics',      href: '/admin/analytics', icon: 'insights' },
  { label: 'Students',       href: '/admin',           icon: 'group' },
  { label: 'Schools',        href: '/admin/schools',   icon: 'apartment' },
  { label: 'Team',           href: '/admin/team',      icon: 'admin_panel_settings' },
  { label: 'Course Builder', href: '/admin/modules',   icon: 'auto_stories' },
  { label: 'Quiz Builder',   href: '/admin/quizzes',   icon: 'quiz' },
];

interface Props {
  role: string;
  adminName: string;
}

export default function AdminSidebar({ role, adminName }: Props) {
  const pathname = usePathname();
  const router   = useRouter();

  const links  = role === 'SUPER_ADMIN' ? SUPER_ADMIN_NAV : YI_ADMIN_NAV;
  const initials = adminName.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="w-64 bg-white border-r border-neutral-100 flex-col h-screen hidden lg:flex shrink-0">
      {/* Logo + role tag */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-orange-500" style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}>school</span>
          <span className="text-2xl font-headline font-black text-orange-500 tracking-tight">ThalirVerse</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-8 ml-9">
          {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Organiser'}
        </p>

        <nav className="space-y-1">
          {links.map(link => {
            const isActive = link.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(link.href);
            return (
              <Link key={link.label} href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-label font-semibold transition-all ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 font-bold'
                    : 'text-neutral-500 hover:bg-orange-50 hover:text-orange-500'
                }`}>
                <span className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User chip + logout */}
      <div className="mt-auto p-6 border-t border-neutral-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-black shrink-0">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{adminName}</p>
            <p className="text-[10px] text-neutral-400 font-label">
              {role === 'SUPER_ADMIN' ? 'Super Admin' : 'YI Admin'}
            </p>
          </div>
        </div>
        <button
          onClick={async () => { await dataService.signOut(); router.push('/login'); }}
          className="flex items-center gap-3 px-4 py-2 text-neutral-500 hover:text-red-500 transition-colors w-full">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label text-sm font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  );
}
