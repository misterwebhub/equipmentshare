import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package, BarChart3, Users, Wrench, Calendar, Shield,
  CheckCircle, ArrowRight, Zap, HardHat, Music, Factory,
  Hotel, Truck, Leaf, Activity, Lock, Globe, Cpu,
} from 'lucide-react';
import api from '@/lib/api';
import { Plan } from '@/lib/types';

async function getPlans(): Promise<Plan[]> {
  try {
    const { data } = await api.get('/public/pricing');
    return data.data || [];
  } catch { return []; }
}

const INDUSTRIES = [
  { icon: HardHat, label: 'Construction',  desc: 'Heavy equipment & scaffolding',     from: 'oklch(0.70 0.28 270)', to: 'oklch(0.68 0.26 250)' },
  { icon: Music,   label: 'Events',         desc: 'AV, staging & lighting',            from: 'oklch(0.78 0.22 195)', to: 'oklch(0.74 0.20 178)' },
  { icon: Factory, label: 'Manufacturing',  desc: 'Industrial machinery & tools',      from: 'oklch(0.76 0.22 155)', to: 'oklch(0.74 0.20 178)' },
  { icon: Hotel,   label: 'Hospitality',    desc: 'Kitchen & service equipment',       from: 'oklch(0.76 0.26 50)',  to: 'oklch(0.84 0.22 75)'  },
  { icon: Truck,   label: 'Transportation', desc: 'Fleet vehicles & logistics',        from: 'oklch(0.68 0.26 30)',  to: 'oklch(0.76 0.26 350)' },
  { icon: Leaf,    label: 'Agriculture',    desc: 'Farm machinery & irrigation',       from: 'oklch(0.76 0.22 155)', to: 'oklch(0.82 0.22 130)' },
];

const FEATURES = [
  { icon: Package,   title: 'Equipment Inventory', desc: 'Real-time status, location, condition, hourly or fixed pricing.',  from: 'oklch(0.70 0.28 270)', to: 'oklch(0.68 0.26 250)' },
  { icon: Calendar,  title: 'Smart Booking',        desc: 'Visual calendar with conflict detection. No double-bookings.',     from: 'oklch(0.78 0.22 195)', to: 'oklch(0.74 0.20 178)' },
  { icon: BarChart3, title: 'Revenue Reports',      desc: 'Revenue by equipment, customer, time period. Know what profits.', from: 'oklch(0.76 0.22 155)', to: 'oklch(0.82 0.22 130)' },
  { icon: Wrench,    title: 'Maintenance',          desc: 'Preventive calendar, condition reports, repair cost tracking.',   from: 'oklch(0.84 0.22 75)',  to: 'oklch(0.76 0.26 50)'  },
  { icon: Users,     title: 'Team & Roles',         desc: 'Admin, manager, operator, viewer — granular access control.',    from: 'oklch(0.66 0.26 295)', to: 'oklch(0.70 0.28 270)' },
  { icon: Shield,    title: 'Penalties',            desc: 'Auto late-return detection, damage logging, waive & track.',     from: 'oklch(0.68 0.26 30)',  to: 'oklch(0.76 0.26 350)' },
];

const STATS = [
  { value: '99.9%',  label: 'Uptime SLA',    icon: Activity, from: 'oklch(0.70 0.28 270)', to: 'oklch(0.78 0.22 195)' },
  { value: '256-bit',label: 'Encryption',    icon: Lock,     from: 'oklch(0.76 0.22 155)', to: 'oklch(0.74 0.20 178)' },
  { value: '40+',    label: 'Countries',     icon: Globe,    from: 'oklch(0.84 0.22 75)',  to: 'oklch(0.76 0.26 50)'  },
  { value: '<50ms',  label: 'API Response',  icon: Cpu,      from: 'oklch(0.76 0.26 350)', to: 'oklch(0.68 0.26 30)'  },
];

const PLAN_COLORS = [
  { from: 'oklch(0.68 0.26 250)', to: 'oklch(0.70 0.28 270)' },
  { from: 'oklch(0.70 0.28 270)', to: 'oklch(0.78 0.22 195)' },  // popular
  { from: 'oklch(0.76 0.22 155)', to: 'oklch(0.78 0.22 195)' },
];

export default async function LandingPage() {
  const plans = await getPlans();

  const planList = plans.length > 0 ? plans : [
    { id: '1', name: 'Starter',      price_monthly: 49,  max_equipment: 25,  max_users: 5,  features: { label: 'Perfect for small rental businesses' } },
    { id: '2', name: 'Professional', price_monthly: 149, max_equipment: 100, max_users: 20, features: { label: 'For growing rental operations', reports: true } },
    { id: '3', name: 'Enterprise',   price_monthly: 349, max_equipment: 500, max_users: 100, features: { label: 'Full power for large fleets', reports: true, api: true, calendar: true } },
  ] as Plan[];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="border-b border-border/50 bg-background/85 backdrop-blur-xl sticky top-0 z-50">
        {/* Rainbow stripe */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195), oklch(0.76 0.22 155), oklch(0.84 0.22 75), oklch(0.76 0.26 350), oklch(0.70 0.28 270))' }} />
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}>
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold gradient-text text-lg">EquipTrack Pro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {['Features', 'Industries', 'Pricing'].map(item => (
              <Link key={item} href={`#${item.toLowerCase()}`}
                className="hover:text-foreground transition-colors relative group">
                {item}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 transition-all group-hover:w-full"
                  style={{ background: 'linear-gradient(90deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }} />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link href="/register">
              <Button size="sm" style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}
                className="text-white border-0 shadow-lg hover:opacity-90">
                Free Trial <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative py-28 px-4 overflow-hidden">
        {/* Multi-color orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.70 0.28 270), transparent)' }} />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.78 0.22 195), transparent)' }} />
        <div className="absolute bottom-0 left-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-10 pointer-events-none -translate-x-1/2"
          style={{ background: 'radial-gradient(ellipse, oklch(0.76 0.26 350), transparent)' }} />

        <div className="container mx-auto max-w-4xl text-center space-y-7 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border"
            style={{ background: 'oklch(0.70 0.28 270 / 0.1)', borderColor: 'oklch(0.70 0.28 270 / 0.3)', color: 'oklch(0.70 0.28 270)' }}>
            <Zap className="h-3.5 w-3.5" />
            Built for equipment rental businesses
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.06] tracking-tight">
            Stop losing money on{' '}
            <span className="shimmer-rainbow">untracked equipment</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            EquipTrack Pro gives your team one command center for inventory,
            bookings, maintenance, and billing — built for any scale.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8 h-12 text-base text-white border-0 shadow-xl"
                style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}>
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 text-base border-border/60">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            No credit card · 14-day free trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-10 px-4 border-y border-border/50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(({ value, label, icon: Icon, from, to }) => (
              <div key={label} className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 hover-glow">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold gradient-text">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industries ── */}
      <section id="industries" className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge className="mb-4 px-4 py-1 text-xs font-semibold border-0"
              style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270 / 0.15), oklch(0.78 0.22 195 / 0.15))', color: 'oklch(0.70 0.28 270)' }}>
              INDUSTRY COVERAGE
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Built for every industry</h2>
            <p className="text-muted-foreground mt-3">One platform, configured for your business</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {INDUSTRIES.map(({ icon: Icon, label, desc, from, to }) => (
              <div key={label}
                className="group relative p-5 rounded-2xl border border-border/50 bg-card overflow-hidden hover-glow cursor-default">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(135deg, ${from}10, ${to}06)` }} />
                <div className="relative">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-3 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{label}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4 border-y border-border/50 bg-muted/20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge className="mb-4 px-4 py-1 text-xs font-semibold border-0"
              style={{ background: 'linear-gradient(135deg, oklch(0.76 0.22 155 / 0.15), oklch(0.78 0.22 195 / 0.15))', color: 'oklch(0.76 0.22 155)' }}>
              CORE MODULES
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to run rentals</h2>
            <p className="text-muted-foreground mt-3">From first booking to final invoice</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, from, to }) => (
              <div key={title}
                className="group relative p-6 rounded-2xl border border-border/50 bg-card overflow-hidden hover-glow">
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity -translate-y-1/2 translate-x-1/2"
                  style={{ background: `radial-gradient(circle, ${from}, transparent)` }} />
                <div className="relative">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <Badge className="mb-4 px-4 py-1 text-xs font-semibold border-0"
              style={{ background: 'linear-gradient(135deg, oklch(0.84 0.22 75 / 0.15), oklch(0.76 0.26 50 / 0.15))', color: 'oklch(0.76 0.26 50)' }}>
              QUICK START
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Up and running in minutes</h2>
          </div>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Create your organisation', desc: 'Sign up, name your company, pick your industry.', from: 'oklch(0.70 0.28 270)', to: 'oklch(0.78 0.22 195)' },
              { step: '02', title: 'Add your equipment',       desc: 'Import or manually add your fleet with pricing and status.', from: 'oklch(0.76 0.22 155)', to: 'oklch(0.74 0.20 178)' },
              { step: '03', title: 'Start taking bookings',    desc: 'Create customers, book equipment, track everything in one place.', from: 'oklch(0.84 0.22 75)', to: 'oklch(0.76 0.26 50)' },
            ].map(({ step, title, desc, from, to }) => (
              <div key={step} className="flex gap-5 p-5 rounded-2xl border border-border/50 bg-card hover-glow">
                <div className="shrink-0 h-11 w-11 rounded-xl flex items-center justify-center shadow-md"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                  <span className="text-xs font-bold text-white font-mono">{step}</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 border-y border-border/50 bg-muted/20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge className="mb-4 px-4 py-1 text-xs font-semibold border-0"
              style={{ background: 'linear-gradient(135deg, oklch(0.76 0.26 350 / 0.15), oklch(0.72 0.28 320 / 0.15))', color: 'oklch(0.76 0.26 350)' }}>
              PRICING
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
            <p className="text-muted-foreground mt-3">Start free, scale as you grow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planList.map((plan, i) => {
              const rawFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || {});
              const featureLabels: Record<string, string> = { reports: 'Advanced Reports', calendar: 'Calendar & Scheduling', api: 'API Access' };
              const featureList: string[] = Array.isArray(rawFeatures) ? rawFeatures : [
                `Up to ${plan.max_equipment} equipment items`,
                `Up to ${plan.max_users} team members`,
                ...Object.entries(rawFeatures).filter(([k, v]) => k !== 'label' && v && v !== 'none' && v !== false).map(([k]) => featureLabels[k] ?? k),
              ];
              const planLabel = !Array.isArray(rawFeatures) ? rawFeatures.label as string : '';
              const isPopular = i === 1;
              const { from, to } = PLAN_COLORS[i] ?? PLAN_COLORS[0];

              return (
                <div key={plan.id}
                  className={`relative rounded-2xl border p-6 flex flex-col bg-card transition-all hover-glow ${isPopular ? 'scale-105' : ''}`}
                  style={isPopular ? { borderColor: 'transparent', background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${from}, ${to}) border-box`, boxShadow: `0 20px 60px ${from}30` } : { borderColor: 'oklch(0.90 0.015 255)' }}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                        ✦ Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan icon */}
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                    <Package className="h-5 w-5 text-white" />
                  </div>

                  <h3 className="text-xl font-bold mb-0.5">{plan.name}</h3>
                  {planLabel && <p className="text-xs text-muted-foreground mb-4">{planLabel}</p>}

                  <div className="mb-6 flex items-end gap-1">
                    <span className="text-4xl font-bold" style={{ background: `linear-gradient(135deg, ${from}, ${to})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      ${plan.price_monthly}
                    </span>
                    <span className="text-muted-foreground text-sm mb-1.5">/month</span>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {featureList.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/register" className="block">
                    <Button className="w-full h-11 text-white border-0 shadow-md hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                      Get Started <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-5" style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195), oklch(0.76 0.22 155), oklch(0.84 0.22 75))' }} />
        </div>
        <div className="container mx-auto max-w-2xl text-center space-y-6 relative">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mx-auto shadow-xl"
            style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}>
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to take <span className="shimmer-rainbow">control</span>?
          </h2>
          <p className="text-muted-foreground text-lg">
            Join hundreds of rental businesses using EquipTrack Pro to reduce downtime,
            improve utilisation, and grow revenue.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2 px-10 h-14 text-base text-white border-0 shadow-xl"
              style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195), oklch(0.76 0.22 155))' }}>
              Start Your Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            14-day free trial · No credit card · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}>
              <Package className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-bold gradient-text">EquipTrack Pro</span>
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login"    className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
