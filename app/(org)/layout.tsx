'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Package, CalendarDays, Users, Wrench,
  BarChart3, Settings, LogOut, Menu, X, Tag, AlertTriangle,
  UserCheck, Layers, Bell, HeartPulse, LifeBuoy, Activity,
  FileBarChart2, Shield, Cpu, Moon, Sun, ChevronRight,
} from 'lucide-react';
import { useTheme } from 'next-themes';

/* ─── Navigation ─────────────────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
      { href: '/equipment',   label: 'Equipment',   icon: Package          },
      { href: '/fleet',       label: 'Fleet',       icon: Layers           },
      { href: '/categories',  label: 'Categories',  icon: Tag              },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/customers',   label: 'Customers',   icon: UserCheck   },
      { href: '/bookings',    label: 'Bookings',    icon: CalendarDays },
      { href: '/calendar',    label: 'Calendar',    icon: CalendarDays },
      { href: '/penalties',   label: 'Penalties',   icon: AlertTriangle },
      { href: '/maintenance', label: 'Maintenance', icon: Wrench       },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/analytics',        label: 'Analytics',      icon: BarChart3    },
      { href: '/reports',          label: 'Reports',        icon: FileBarChart2 },
      { href: '/equipment-health', label: 'Equipment Health', icon: HeartPulse  },
      { href: '/damage-reports',   label: 'Damage Reports', icon: Shield       },
    ],
  },
  {
    label: 'Team',
    items: [
      { href: '/notifications', label: 'Notifications', icon: Bell     },
      { href: '/support',       label: 'Support',       icon: LifeBuoy },
      { href: '/activity',      label: 'Activity',      icon: Activity },
      { href: '/users',         label: 'Users',         icon: Users    },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const NAV = NAV_SECTIONS.flatMap(s => s.items);

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { user, org, logout, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme }   = useTheme();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user?.role === 'superadmin') router.push('/superadmin');
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent-color) transparent transparent transparent' }} />
          <Cpu className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
  if (!user) return null;

  const pageLabel = pathname.split('/')[1]?.replace(/-/g, ' ') || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          w-56 border-r border-border bg-sidebar
          transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-color)' }}>
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none text-foreground truncate">EquipTrack</p>
              <p className="text-[10px] text-muted-foreground/60 tracking-widest mt-0.5">PRO</p>
            </div>
          </Link>
          <button className="lg:hidden p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Org badge */}
        {org && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-md border border-border bg-muted/40">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
              <p className="text-xs font-medium truncate text-foreground">{org.name}</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 pl-3.5">
              {org.plan_name || 'Trial plan'}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 futuristic-scroll">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 select-none">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm
                        transition-colors duration-100
                        ${active
                          ? 'nav-active'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}
                      `}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? '' : 'opacity-70'}`} />
                      <span className="flex-1">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-3 shrink-0">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
              style={{ background: 'var(--accent-color)' }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              {resolvedTheme === 'dark'
                ? <><Sun className="h-3.5 w-3.5" /> Light</>
                : <><Moon className="h-3.5 w-3.5" /> Dark</>}
            </button>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/8 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ════════════════════════════════════════
          MAIN
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-5 gap-4 shrink-0 bg-background">
          <button className="lg:hidden p-1.5 rounded text-muted-foreground hover:bg-muted"
            onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-foreground">EquipTrack</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-muted-foreground capitalize">{pageLabel}</span>
          </div>

          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-1">
            <Link href="/notifications"
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              <Bell className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-border">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                style={{ background: 'var(--accent-color)' }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 futuristic-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
