'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { label: 'Super Admin', email: 'superadmin@equiptrack.com', password: 'SuperAdmin@123' },
    { label: 'Org Admin', email: 'admin@buildright.com', password: 'Admin@123' },
    { label: 'Org Manager', email: 'manager@buildright.com', password: 'Manager@123' },
  ];

  const fillDemo = (e: { email: string; password: string }) => {
    setEmail(e.email);
    setPassword(e.password);
  };

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <Package className="h-8 w-8" />
            EquipTrack Pro
          </Link>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : 'Sign In'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Start free trial
              </Link>
            </div>
          </CardContent>
        </Card>
        <div className="text-center text-xs text-muted-foreground">
          <div className="mb-2">Demo accounts (click to autofill):</div>
          <div className="flex items-center justify-center gap-2">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                className="text-primary underline text-[13px] px-2 py-1 rounded hover:bg-accent/10"
                onClick={() => fillDemo(a)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="mt-2">Credentials: superadmin@equiptrack.com / SuperAdmin@123</div>
        </div>
      </div>
    </div>
  );
}
