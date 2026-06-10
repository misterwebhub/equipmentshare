'use client';
import { useState, useEffect } from 'react';
import { useOrgProfile, useChangePassword, useBilling } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Trash2, FlaskConical, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { refreshUser } = useAuth();
  const { profile: profileData, isLoading: profileLoading, updateMutation } = useOrgProfile();
  const { data: billingData } = useBilling();
  const changePasswordMutation = useChangePassword();
  const qc = useQueryClient();

  const [profile, setProfile] = useState({ name: '', category: '', phone: '', address: '', tax_number: '', currency: 'USD' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirmPassword: '' });
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<null | Record<string, unknown>>(null);

  useEffect(() => {
    if (profileData) {
      setProfile({
        name: (profileData as Record<string, unknown>).name as string || '',
        category: (profileData as Record<string, unknown>).category as string || '',
        phone: (profileData as Record<string, unknown>).phone as string || '',
        address: (profileData as Record<string, unknown>).address as string || '',
        tax_number: (profileData as Record<string, unknown>).tax_number as string || '',
        currency: (profileData as Record<string, unknown>).currency as string || 'USD',
      });
    }
  }, [profileData]);

  const handleSaveProfile = () => {
    updateMutation.mutate(profile, { onSuccess: () => refreshUser() });
  };

  const handleChangePassword = () => {
    if (passwords.new_password !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    changePasswordMutation.mutate(
      { current_password: passwords.current_password, new_password: passwords.new_password },
      { onSuccess: () => setPasswords({ current_password: '', new_password: '', confirmPassword: '' }) }
    );
  };

  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setProfile(p => ({ ...p, [k]: e.target.value }));
  const setPw = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setPasswords(p => ({ ...p, [k]: e.target.value }));

  async function handleLoadDemo() {
    setSeedLoading(true);
    setSeedResult(null);
    try {
      const { data } = await api.post('/demo-seed');
      setSeedResult(data.data);
      toast.success('Demo data loaded! All modules are now populated.');
      // Invalidate all queries so every page refreshes
      await qc.invalidateQueries();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load demo data';
      toast.error(msg);
    } finally {
      setSeedLoading(false);
      setShowSeedConfirm(false);
    }
  }

  const sub = (billingData as Record<string, unknown> | undefined)?.subscription as Record<string, unknown> | undefined;
  const usage = (billingData as Record<string, unknown> | undefined)?.usage as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your organization and account</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Organization</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Organization Profile</CardTitle><CardDescription>Update your organization details</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? <div className="h-48 animate-pulse bg-muted rounded" /> : (
                <>
                  <div className="space-y-2"><Label>Organization Name *</Label><Input value={profile.name} onChange={setP('name')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Phone</Label><Input value={profile.phone} onChange={setP('phone')} /></div>
                    <div className="space-y-2"><Label>Currency</Label><Input value={profile.currency} onChange={setP('currency')} placeholder="USD" /></div>
                  </div>
                  <div className="space-y-2"><Label>Category / Industry</Label><Input value={profile.category} onChange={setP('category')} placeholder="construction" /></div>
                  <div className="space-y-2"><Label>Tax Number</Label><Input value={profile.tax_number} onChange={setP('tax_number')} /></div>
                  <div className="space-y-2"><Label>Address</Label><Input value={profile.address} onChange={setP('address')} /></div>
                  <Button onClick={handleSaveProfile} disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle><CardDescription>Update your account password</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={passwords.current_password} onChange={setPw('current_password')} /></div>
              <div className="space-y-2"><Label>New Password</Label><Input type="password" value={passwords.new_password} onChange={setPw('new_password')} /></div>
              <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" value={passwords.confirmPassword} onChange={setPw('confirmPassword')} /></div>
              <Button onClick={handleChangePassword} disabled={!passwords.current_password || !passwords.new_password || changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Saving...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {sub ? (
                <>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold">{sub.plan_name as string}</p>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="capitalize">{sub.status as string}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Monthly Rate</p><p className="font-medium">${sub.price_monthly as number}/mo</p></div>
                    <div><p className="text-muted-foreground">Billing Cycle</p><p className="font-medium capitalize">{sub.billing_cycle as string}</p></div>
                    <div><p className="text-muted-foreground">Starts</p><p className="font-medium">{sub.starts_at ? new Date(sub.starts_at as string).toLocaleDateString() : '—'}</p></div>
                    <div><p className="text-muted-foreground">Ends</p><p className="font-medium">{sub.ends_at ? new Date(sub.ends_at as string).toLocaleDateString() : 'Ongoing'}</p></div>
                  </div>
                </>
              ) : <p className="text-muted-foreground">No active subscription. Contact your administrator.</p>}
            </CardContent>
          </Card>
          {usage && (
            <Card>
              <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Equipment</span><span className="font-medium">{usage.equipment as number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Users</span><span className="font-medium">{usage.users as number}</span></div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* ── Data Management tab ── */}
        <TabsContent value="data" className="mt-4 space-y-4">

          {/* Load Demo Data */}
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'oklch(0.52 0.24 264 / 0.12)' }}>
                  <FlaskConical className="h-5 w-5" style={{ color: 'var(--accent-color)' }} />
                </div>
                <div>
                  <CardTitle className="text-base">Load Demo Data</CardTitle>
                  <CardDescription className="mt-1">
                    Clear all current data and populate your account with realistic sample data — categories,
                    equipment, customers, bookings, maintenance schedules, and condition reports.
                    Perfect for exploring the platform or resetting a test environment.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* What gets loaded */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Categories',    value: '6'  },
                  { label: 'Equipment',     value: '12' },
                  { label: 'Customers',     value: '8'  },
                  { label: 'Bookings',      value: '12' },
                  { label: 'Units (SKUs)',  value: '27' },
                  { label: 'Maintenance',   value: '8'  },
                  { label: 'Penalties',     value: '2'  },
                  { label: 'Condition Reports', value: '5' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 bg-muted/30 text-center">
                    <p className="text-xl font-bold" style={{ color: 'var(--accent-color)' }}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/8 mb-5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Warning:</strong> This will permanently delete all existing equipment, bookings,
                  customers, and operational data for your organisation. Users and org settings are kept.
                  This action cannot be undone.
                </p>
              </div>

              {/* Result summary */}
              {seedResult && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-green-500/30 bg-green-500/8 mb-4">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
                  <div className="text-sm text-green-700 dark:text-green-400">
                    <p className="font-semibold mb-1">Demo data loaded successfully!</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                      {Object.entries(seedResult).map(([k, v]) => (
                        <span key={k}>{k.replace(/_/g,' ')}: <strong>{String(v)}</strong></span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setShowSeedConfirm(true)}
                disabled={seedLoading}
                className="gap-2 text-white"
                style={{ background: 'linear-gradient(135deg, oklch(0.52 0.24 264), oklch(0.60 0.18 196))' }}>
                {seedLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading demo data…</>
                  : <><FlaskConical className="h-4 w-4" /> Load Demo Data</>}
              </Button>
            </CardContent>
          </Card>

          {/* Danger zone — wipe only */}
          <Card className="border-destructive/30">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                  <CardDescription className="mt-1">
                    Permanently clear all operational data (equipment, bookings, customers, etc.)
                    without loading demo data. Cannot be undone.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="gap-2" onClick={() => toast.error('Contact support to perform a full data wipe.')}>
                <Trash2 className="h-4 w-4" /> Clear All Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Confirm Dialog */}
      <Dialog open={showSeedConfirm} onOpenChange={setShowSeedConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm: Load Demo Data
            </DialogTitle>
            <DialogDescription>
              This will delete all current operational data and replace it with sample demo data.
              Users and organisation settings will be kept. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowSeedConfirm(false)} disabled={seedLoading}>Cancel</Button>
            <Button className="flex-1 gap-2 text-white" onClick={handleLoadDemo} disabled={seedLoading}
              style={{ background: 'linear-gradient(135deg, oklch(0.52 0.24 264), oklch(0.60 0.18 196))' }}>
              {seedLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
                : <><FlaskConical className="h-4 w-4" /> Yes, Load Demo Data</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
