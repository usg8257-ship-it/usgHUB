'use client';
// components/Sidebar.tsx — Shared navigation for all protected pages
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';
import type { UserProfile } from '@/types';
import {
  Users, UserPlus, ClipboardList, FileText,
  Settings, BarChart2, LogOut, Shield, Briefcase
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',    icon: BarChart2,    roles: ['SUPER_ADMIN','HR_OFFICER','STAFF','EMPLOYEE'] },
    { href: '/tracker',    label: 'Centralized Trcker', icon: ClipboardList,roles: ['SUPER_ADMIN','HR_OFFICER','STAFF'] },
   { href: '/onboarding', label: 'Arrivals - Intl/Local',   icon: UserPlus,     roles: ['SUPER_ADMIN','HR_OFFICER','STAFF'] },
  { href: '/employees',  label: 'Active Employees',    icon: Users,        roles: ['SUPER_ADMIN','HR_OFFICER','STAFF'] },
 
  { href: '/hr-docs',    label: 'Docs Genertor',      icon: FileText,     roles: ['SUPER_ADMIN','HR_OFFICER'] },
  { href: '/recruitment',label: 'Recruitment',  icon: Briefcase,    roles: ['SUPER_ADMIN','HR_OFFICER'] },
  { href: '/admin',      label: 'Admin',        icon: Shield,       roles: ['SUPER_ADMIN'] },
  { href: '/settings',   label: 'Settings',     icon: Settings,     roles: ['SUPER_ADMIN','HR_OFFICER'] },
];

interface Props {
  profile: UserProfile;
}

export default function Sidebar({ profile }: Props) {
  const pathname = usePathname();
  const visibleNav = NAV.filter(n => n.roles.includes(profile.role));

  return (
    <aside
      style={{ background: 'var(--navy-dk)', width: 220, minHeight: '100vh' }}
      className="flex flex-col py-6 px-3 flex-shrink-0"
    >
      {/* Logo */}
      <div className="px-3 mb-8">
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>
          United Security Group
        </div>
        <div style={{ color: 'var(--teal)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
          Centralized HUB
        </div>
        <div style={{ height: 2, background: 'linear-gradient(90deg,var(--navy),var(--teal))', borderRadius: 1, marginTop: 8 }} />
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           10,
                padding:       '8px 12px',
                borderRadius:  8,
                fontSize:      13,
                fontWeight:    active ? 600 : 400,
                color:         active ? '#fff' : 'rgba(255,255,255,0.65)',
                background:    active ? 'rgba(255,255,255,0.12)' : 'transparent',
                textDecoration:'none',
                transition:    'all .15s',
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 8 }}>
        <div style={{ padding: '0 12px', marginBottom: 8 }}>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{profile.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{profile.role}</div>
        </div>
        <button
          onClick={authApi.logout}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         8,
            width:       '100%',
            padding:     '8px 12px',
            borderRadius:8,
            fontSize:    13,
            color:       'rgba(255,255,255,0.6)',
            background:  'transparent',
            border:      'none',
            cursor:      'pointer',
          }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
