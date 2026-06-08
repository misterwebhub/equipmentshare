'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { MobileMenuProvider } from '@/components/mobile-menu-context';
import { useAuth } from '@/components/auth-context';
import { Spinner } from '@/components/ui/spinner';

/**
 * Authenticated org workspace shell: sidebar + header + content.
 * Guards access — redirects to /login if unauthenticated, to /subscribe if the
 * org has no active subscription, and to /superadmin for platform owners.
 */
export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, subscription, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'superadmin') {
      router.replace('/superadmin');
      return;
    }
    const active =
      subscription &&
      (subscription.status === 'active' || subscription.status === 'trialing');
    if (!active) {
      router.replace('/subscribe');
    }
  }, [user, subscription, loading, router]);

  const active =
    subscription &&
    (subscription.status === 'active' || subscription.status === 'trialing');

  if (loading || !user || user.role === 'superadmin' || !active) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <MobileMenuProvider>
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col lg:ml-72">
        <AppHeader title={title} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </MobileMenuProvider>
  );
}
