'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Building2, CreditCard, LogOut, Menu, X,
  Package, Shield, Tag, ChevronRight
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

const NAV = [
  { href: '/superadmin',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/superadmin/organisations', label: 'Organisations', icon: Building2 },
  { href: '/superadmin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/superadmin/plans',         label: 'Plans',         icon: Tag },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'superadmin') router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
          <Shield className="absolute inset-0 m-auto h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground tracking-widest uppercase">Authenticating</p>
      </div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          border-r border-border/60 bg-sidebar
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"
              style={{ boxShadow: '0 0 12px oklch(0.82 0.20 80 / 0.3)' }}>
              <Shield className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight" style={{ background: 'linear-gradient(135deg, oklch(0.82 0.20 80), oklch(0.72 0.20 195))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SuperAdmin
              </p>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Control Panel</p>
            </div>
          </div>
          <button className="lg:hidden p-1 rounded text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        <div className="mx-3 my-2 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Root Access</p>
          <p className="text-xs font-medium truncate mt-0.5">{user.name}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto futuristic-scroll">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/superadmin' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                  transition-all duration-150 relative
                  ${active
                    ? 'nav-active text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                  }
                `}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-primary' : 'group-hover:text-primary/70'}`} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="h-3 w-3 text-primary/50" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border/60">
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="flex-1 h-8 text-muted-foreground hover:text-foreground hover:bg-primary/5"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              {resolvedTheme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5" onClick={logout}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 border-b border-border/60 flex items-center px-4 gap-4 shrink-0">
          <button className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <Package className="h-3.5 w-3.5" />
            <span>Org View</span>
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-6 futuristic-scroll">{children}</main>
      </div>
    </div>
  );
}
