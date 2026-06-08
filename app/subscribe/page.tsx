'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthCard } from '@/components/auth-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { authApi, Plan } from '@/lib/api';
import { useAuth } from '@/components/auth-context';
import { Check } from 'lucide-react';

export default function SubscribePage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading, refresh } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string | null>(params.get('plan'));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authApi.plans().then(setPlans).catch(() => {});
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
    if (!authLoading && user?.role === 'superadmin') router.replace('/superadmin');
  }, [authLoading, user, router]);

  const choose = async (planId: string) => {
    setSelected(planId);
    setError('');
    setSubmitting(true);
    try {
      await authApi.subscribe(planId);
      await refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Could not activate subscription');
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Choose your plan" subtitle="Pick a subscription to unlock your dashboard. You can change it anytime." wide>
      {error && <p className="mb-4 text-center text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative border-border p-6 ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                Most popular
              </Badge>
            )}
            <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">${plan.price}</span>
              <span className="text-muted-foreground">/{plan.interval}</span>
            </div>
            <ul className="mt-5 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-available" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => choose(plan.id)}
              disabled={submitting}
              className={`mt-6 w-full ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
              variant={plan.popular ? 'default' : 'outline'}
            >
              {submitting && selected === plan.id ? <Spinner className="h-4 w-4" /> : 'Select plan'}
            </Button>
          </Card>
        ))}
        {plans.length === 0 && (
          <div className="col-span-3 flex justify-center py-10">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>
    </AuthCard>
  );
}
