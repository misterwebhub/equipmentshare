'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  LogOut,
  Package,
  Settings,
  Users,
  Wrench,
  BookOpen,
  Briefcase,
  Home,
  X,
  Calendar,
  AlertTriangle,
  Bell,
  MessageSquare,
  TrendingUp,
  UserCircle,
  FileText,
  ClipboardList,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileMenu } from './mobile-menu-context';
import { useAuth } from './auth-context';

export function AppSidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useMobileMenu();
  const { org, user, logout } = useAuth();

  const mainLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/equipment', label: 'Equipment', icon: Package },
    { href: '/rentals', label: 'Rentals', icon: Briefcase },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  ];

  const salesLinks = [
    { href: '/quotations', label: 'Quotations', icon: FileText },
    { href: '/orders', label: 'Orders', icon: ClipboardList },
    { href: '/invoices', label: 'Invoices', icon: Receipt },
  ];

  const engagementLinks = [
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/damage-claims', label: 'Damage & Penalties', icon: AlertTriangle },
    { href: '/notifications', label: 'Notifications', icon: Bell, badge: 4 },
    { href: '/support', label: 'Support Tickets', icon: MessageSquare },
    { href: '/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/equipment-health', label: 'Equipment Health', icon: AlertTriangle },
    { href: '/team', label: 'Team Collaboration', icon: Users },
    { href: '/customer-portal', label: 'Customer Portal', icon: UserCircle },
  ];

  const adminLinks = [
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
      <div className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            E
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">EquipTrack</span>
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {org?.name || 'Pro'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1 hover:bg-secondary rounded transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-y-6">
        {/* Main Navigation */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Core
          </p>
          <div className="space-y-1">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sales lifecycle */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Sales
          </p>
          <div className="space-y-1">
            {salesLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Engagement & Features */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Engagement
          </p>
          <div className="space-y-1">
            {engagementLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {link.label}
                  </div>
                  {link.badge && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Admin */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Admin
          </p>
          <div className="space-y-1">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <div className="border-t border-border pt-4 space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary hover:text-foreground transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Mobile Menu */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-auto lg:hidden">
            <SidebarContent />
          </div>
        </>
      )}

      {/* Mobile Menu Button (exported for use in header) */}
      <div className="fixed left-0 top-0 lg:hidden z-50 pointer-events-none">
        <style>{`
          .mobile-menu-button {
            pointer-events: auto;
          }
        `}</style>
      </div>
    </>
  );
}
