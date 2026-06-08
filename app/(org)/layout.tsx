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
  UserCheck, ChevronRight, Cpu, Layers,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard, color: 'oklch(0.70 0.28 270)' },
  { href: '/equipment',   label: 'Equipment',   icon: Package,         color: 'oklch(0.78 0.22 195)' },
  { href: '/fleet',       label: 'Fleet',       icon: Layers,          color: 'oklch(0.72 0.26 280)' },
  { href: '/categories',  label: 'Categories',  icon: Tag,             color: 'oklch(0.76 0.26 50)'  },
  { href: '/customers',   label: 'Customers',   icon: UserCheck,       color: 'oklch(0.76 0.22 155)' },
  { href: '/bookings',    label: 'Bookings',    icon: CalendarDays,    color: 'oklch(0.68 0.26 250)' },
  { href: '/calendar',    label: 'Calendar',    icon: CalendarDays,    color: 'oklch(0.74 0.20 178)' },
  { href: '/penalties',   label: 'Penalties',   icon: AlertTriangle,   color: 'oklch(0.68 0.26 30)'  },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench,          color: 'oklch(0.84 0.22 75)'  },
  { href: '/reports',     label: 'Reports',     icon: BarChart3,       color: 'oklch(0.76 0.26 350)' },
  { href: '/users',       label: 'Users',       icon: Users,           color: 'oklch(0.66 0.26 295)' },
  { href: '/settings',    label: 'Settings',    icon: Settings,        color: 'oklch(0.55 0.04 255)'  },
];

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
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))', opacity: 0.2 }} />
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'oklch(0.70 0.28 270) transparent transparent transparent' }} />
          <Cpu className="absolute inset-0 m-auto h-5 w-5" style={{ color: 'oklch(0.70 0.28 270)' }} />
        </div>
        <p className="text-sm text-muted-foreground tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background futuristic-scroll">

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        border-r border-border/60
      `}>
        {/* Rainbow top bar */}
        <div className="h-1 w-full shrink-0" style={{
          background: 'linear-gradient(90deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195), oklch(0.76 0.22 155), oklch(0.84 0.22 75), oklch(0.76 0.26 350))'
        }} />

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/60">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}>
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold gradient-text leading-tight">EquipTrack</p>
              <p className="text-[10px] text-muted-foreground tracking-widest">PRO SUITE</p>
            </div>
          </Link>
          <button className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Org pill */}
        {org && (
          <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl border border-border/60 bg-muted/40">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'oklch(0.76 0.22 155)', boxShadow: '0 0 6px oklch(0.76 0.22 155)' }} />
              <p className="text-xs font-semibold truncate">{org.name}</p>
            </div>
            <div className="mt-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'oklch(0.70 0.28 270 / 0.15)', color: 'oklch(0.70 0.28 270)', border: '1px solid oklch(0.70 0.28 270 / 0.25)' }}>
                {org.plan_name || 'Trial'}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 futuristic-scroll">
          {NAV.map(({ href, label, icon: Icon, color }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                  transition-all duration-150
                  ${active ? 'nav-active font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}
                `}
                style={active ? { paddingLeft: '10px' } : {}}
              >
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${active ? 'shadow-md' : 'opacity-60 group-hover:opacity-100'}`}
                  style={active
                    ? { background: `linear-gradient(135deg, ${color}, ${color}aa)`, boxShadow: `0 4px 12px ${color}50` }
                    : { background: `${color}18` }
                  }>
                  <Icon className="h-3.5 w-3.5" style={{ color: active ? 'white' : color }} />
                </div>
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-50" style={{ color }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-2 px-1 mb-2">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.76 0.26 350))' }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <Badge variant="secondary" className="text-[10px] capitalize shrink-0 px-1.5">{user.role}</Badge>
          </div>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="flex-1 h-8 rounded-lg text-muted-foreground hover:bg-muted"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              {resolvedTheme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 h-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              onClick={logout}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 border-b border-border/60 flex items-center px-4 gap-4 shrink-0">
          <button className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span className="gradient-text font-semibold">SYS</span>
            <ChevronRight className="h-3 w-3" />
            <span className="capitalize">{pathname.split('/')[1] || 'dashboard'}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 futuristic-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
