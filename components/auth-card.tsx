'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

/** Centered card layout used by login / signup / subscribe screens. */
export function AuthCard({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-secondary/30 to-background">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            E
          </div>
          <span className="font-semibold text-foreground">EquipTrack Pro</span>
        </Link>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-md'}`}>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
