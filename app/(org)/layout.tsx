'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Package, CalendarDays, Users, Wrench,
  BarChart3, Settings, LogOut, Menu, X, Tag, AlertTriangle,
  UserCheck, ChevronRight, Layers, Bell, HeartPulse,
  LifeBuoy, Activity, FileBarChart2, Shield, Cpu,
  Moon, Sun, ChevronDown,
} from 'lucide-react';
import { useTheme } from 'next-themes';

/* ─── Navigation structure ───────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard, color: 'oklch(0.70 0.26 268)' },
      { href: '/equipment',   label: 'Equipment',   icon: Package,          color: 'oklch(0.76 0.20 196)' },
      { href: '/fleet',       label: 'Fleet',        icon: Layers,           color: 'oklch(0.70 0.24 252)' },
      { href: '/categories',  label: 'Categories',   icon: Tag,              color: 'oklch(0.74 0.22  50)' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/customers',   label: 'Customers',   icon: UserCheck,        color: 'oklch(0.74 0.20 156)' },
      { href: '/bookings',    label: 'Bookings',    icon: CalendarDays,     color: 'oklch(0.67 0.24 250)' },
      { href: '/calendar',    label: 'Calendar',    icon: CalendarDays,     color: 'oklch(0.72 0.18 178)' },
      { href: '/penalties',   label: 'Penalties',   icon: AlertTriangle,    color: 'oklch(0.67 0.24  28)' },
      { href: '/maintenance', label: 'Maintenance', icon: Wrench,           color: 'oklch(0.82 0.20  76)' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/analytics',        label: 'Analytics',      icon: BarChart3,    color: 'oklch(0.74 0.24 348)' },
      { href: '/reports',          label: 'Reports',        icon: FileBarChart2, color: 'oklch(0.72 0.22 160)' },
      { href: '/equipment-health', label: 'Equip. Health',  icon: HeartPulse,   color: 'oklch(0.67 0.26  20)' },
      { href: '/damage-reports',   label: 'Damage Reports', icon: Shield,       color: 'oklch(0.64 0.24  28)' },
    ],
  },
  {
    label: 'Team',
    items: [
      { href: '/notifications', label: 'Notifications', icon: Bell,     color: 'oklch(0.80 0.20  90)' },
      { href: '/support',       label: 'Support',       icon: LifeBuoy, color: 'oklch(0.70 0.22 240)' },
      { href: '/activity',      label: 'Activity',      icon: Activity, color: 'oklch(0.70 0.20 156)' },
      { href: '/users',         label: 'Users',         icon: Users,    color: 'oklch(0.65 0.24 296)' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings, color: 'oklch(0.52 0.022 256)' },
    ],
  },
];

const NAV = NAV_SECTIONS.flatMap(s => s.items);

/* ─── Layout ─────────────────────────────────────────────────────────── */
export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { user, org, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user?.role === 'superadmin') router.push('/superadmin');
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--violet) transparent transparent transparent' }} />
          <Cpu className="absolute inset-0 m-auto h-5 w-5" style={{ color: 'var(--violet)' }} />
        </div>
        <p className="text-sm text-muted-foreground font-medium tracking-wide">Loading workspace…</p>
      </div>
    </div>
  );
  if (!user) return null;

  const pageLabel = pathname.split('/')[1]?.replace(/-/g, ' ') || 'dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ══════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col
        border-r border-border/70 bg-background
        transform transition-transform duration-250 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'var(--crm-sidebar-bg)' }}>

        {/* ── Logo ── */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border/60 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--violet), oklch(0.67 0.24 252))' }}>
              <Package className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold gradient-text leading-none truncate">EquipTrack</p>
              <p className="text-[10px] text-muted-foreground/60 tracking-[0.1em] uppercase mt-0.5">Pro Suite</p>
            </div>
          </Link>
          <button className="lg:hidden p-1 rounded-md text-muted-foreground hover:bg-muted/60 transition-colors"
            onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Org pill ── */}
        {org && (
          <div className="mx-3 mt-2.5 px-3 py-2 rounded-lg border border-border/60"
            style={{ background: 'oklch(0.70 0.26 268 / 0.06)' }}>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse"
                style={{ background: 'var(--green)', boxShadow: '0 0 4px var(--green)' }} />
              <p className="text-xs font-semibold truncate leading-none">{org.name}</p>
            </div>
            <span className="inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: 'oklch(0.70 0.26 268 / 0.15)', color: 'var(--violet)' }}>
              {org.plan_name || 'Trial'}
            </span>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 futuristic-scroll space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {/* Section label */}
              <p className="px-2 mb-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/45 select-none">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon, color }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[0.8125rem]
                        transition-all duration-120 relative
                        ${active
                          ? 'nav-active'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                      `}
                    >
                      {/* Icon box */}
                      <div className={`
                        h-6 w-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-150
                        ${active ? 'shadow-sm' : 'opacity-55 group-hover:opacity-85'}
                      `}
                        style={active
                          ? { background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 2px 8px ${color}40` }
                          : { background: `${color}14` }
                        }>
                        <Icon className="h-3 w-3" style={{ color: active ? 'white' : color }} />
                      </div>
                      <span className="flex-1 font-medium">{label}</span>
                      {active && (
                        <ChevronRight className="h-3 w-3 shrink-0 opacity-40" style={{ color }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer (user + actions) ── */}
        <div className="p-3 border-t border-border/60 space-y-2 shrink-0">
          {/* User row */}
          <div className="flex items-center gap-2 px-1 py-1.5 rounded-md">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--violet), oklch(0.74 0.24 348))' }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-muted-foreground/70 truncate">{user.email}</p>
            </div>
            <Badge variant="secondary"
              className="text-[9px] capitalize shrink-0 px-1.5 py-0 h-4 font-semibold">
              {user.role}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm"
              className="flex-1 h-8 rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground text-xs gap-1.5"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              {resolvedTheme === 'dark'
                ? <><Sun className="h-3.5 w-3.5" /><span className="text-[11px]">Light</span></>
                : <><Moon className="h-3.5 w-3.5" /><span className="text-[11px]">Dark</span></>
              }
            </Button>
            <Button variant="ghost" size="sm"
              className="flex-1 h-8 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/8 text-xs gap-1.5"
              onClick={logout}>
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-[11px]">Sign out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Top bar ── */}
        <header className="h-14 border-b border-border/60 flex items-center px-5 gap-4 shrink-0"
          style={{ background: 'var(--crm-header-bg)' }}>

          {/* Mobile hamburger */}
          <button className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted/60 transition-colors"
            onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 text-sm">
            <span className="font-semibold gradient-text">EquipTrack</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="font-medium text-foreground/75 capitalize">{pageLabel}</span>
          </div>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Notifications bell */}
            <Link href="/notifications"
              className="relative flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              <Bell className="h-4 w-4" />
            </Link>

            {/* Theme toggle */}
            <button
              className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2 ml-1 pl-3 border-l border-border/60">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--violet), oklch(0.74 0.24 348))' }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto p-6 futuristic-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
