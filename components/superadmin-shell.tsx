'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Building2, CreditCard, LogOut, ShieldCheck } from 'lucide-react';

const links = [
  { href: '/superadmin', label: 'Overview', icon: LayoutDashboard },
  { href: '/superadmin/organizations', label: 'Organizations', icon: Building2 },
  { href: '/superadmin/subscriptions', label: 'Subscriptions', icon: CreditCard },
];

/** Platform-owner shell. Only super admins may pass the guard. */
export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (user.role !== 'superadmin') router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'superadmin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">Platform Admin</span>
            <span className="text-xs text-muted-foreground">EquipTrack Pro</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground">
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex gap-4 lg:hidden">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cn('text-sm', pathname === l.href ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground lg:hidden">Logout</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
