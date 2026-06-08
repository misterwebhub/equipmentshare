'use client';
import { useState, useEffect } from 'react';
import { useOrgProfile, useChangePassword, useBilling } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { refreshUser } = useAuth();
  const { profile: profileData, isLoading: profileLoading, updateMutation } = useOrgProfile();
  const { data: billingData } = useBilling();
  const changePasswordMutation = useChangePassword();

  const [profile, setProfile] = useState({ name: '', category: '', phone: '', address: '', tax_number: '', currency: 'USD' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirmPassword: '' });

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
      </Tabs>
    </div>
  );
}
