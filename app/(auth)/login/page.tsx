'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Package, ArrowRight, CheckCircle, Shield, Zap, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const FEATURES = [
  { icon: Zap,       text: 'Smart conflict-free bookings' },
  { icon: BarChart3, text: 'Real-time revenue analytics' },
  { icon: Shield,    text: 'Damage & penalty tracking' },
  { icon: CheckCircle, text: '14-day free trial, no card' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const demoAccounts = [
    { label: 'Super Admin', email: 'superadmin@equiptrack.com', password: 'SuperAdmin@123' },
    { label: 'Org Admin',   email: 'admin@buildright.com',      password: 'Admin@123'      },
    { label: 'Manager',     email: 'manager@buildright.com',    password: 'Manager@123'    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">

      {/* ── Left panel — brand / image ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Parallax BG */}
        <div className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80&auto=format&fit=crop')`,
          }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, oklch(0.06 0.02 264 / 0.93) 0%, oklch(0.08 0.015 250 / 0.88) 100%)' }} />

        {/* Accent glow */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-25"
          style={{ background: 'radial-gradient(circle, oklch(0.52 0.24 264), transparent)' }} />

        <div className="relative flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, oklch(0.52 0.24 264), oklch(0.60 0.18 196))' }}>
              <Package className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">EquipTrack&nbsp;<span style={{
              display: 'inline',
              background: 'linear-gradient(135deg, oklch(0.75 0.20 264), oklch(0.80 0.18 196))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Pro</span></span>
          </Link>

          {/* Main copy */}
          <div className="space-y-6">
            <div>
              <p className="text-3xl font-bold text-white mb-3 leading-snug" style={{ lineHeight: '1.25' }}>
                Manage your entire<br />
                <span style={{
                  display: 'inline',
                  background: 'linear-gradient(135deg, oklch(0.75 0.20 264) 0%, oklch(0.78 0.18 196) 50%, oklch(0.72 0.18 155) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>rental fleet</span>{' '}from here.
              </p>
              <p className="text-white/55 text-base leading-relaxed">
                Equipment inventory, bookings, maintenance, and billing in one platform.
              </p>
            </div>

            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'oklch(0.52 0.24 264 / 0.20)' }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: 'oklch(0.75 0.18 264)' }} />
                  </div>
                  <span className="text-sm text-white/65">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/25 text-xs">© {new Date().getFullYear()} EquipTrack Pro</p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, oklch(0.52 0.24 264), oklch(0.60 0.18 196))' }}>
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">EquipTrack&nbsp;<span style={{
              display: 'inline',
              background: 'linear-gradient(135deg, oklch(0.52 0.24 264), oklch(0.60 0.18 196))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Pro</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1.5"
              style={{ background: 'none', WebkitTextFillColor: 'currentColor', color: 'inherit' }}>
              Welcome back
            </h1>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@yourcompany.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-white font-semibold shadow-lg hover:opacity-90 transition-opacity text-base"
              style={{ background: 'linear-gradient(135deg, oklch(0.52 0.24 264), oklch(0.60 0.18 196))' }}
              disabled={loading}>
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>
                : <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold hover:underline" style={{ color: 'var(--accent-color)' }}>
              Start free trial
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-8 p-4 rounded-2xl border border-border/60 bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium mb-3 text-center">Demo accounts — click to autofill</p>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map(a => (
                <button key={a.email} type="button"
                  onClick={() => { setEmail(a.email); setPassword(a.password); }}
                  className="text-xs px-2 py-2 rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/60 transition-all text-center font-medium">
                  {a.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
