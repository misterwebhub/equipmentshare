'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { Plan } from '@/lib/types';
import {
  Package, BarChart3, Users, Wrench, Calendar, Shield,
  CheckCircle, ArrowRight, Zap, HardHat, Music, Factory,
  Hotel, Truck, Leaf, Activity, Lock, Globe, Cpu,
  Play, Star, TrendingUp, Clock, ChevronRight,
} from 'lucide-react';

/* ─── Scroll-reveal hook ─────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-scale');
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─── Data ───────────────────────────────────────── */
const INDUSTRIES = [
  { icon: HardHat, label: 'Construction',  desc: 'Heavy equipment & scaffolding' },
  { icon: Music,   label: 'Events',        desc: 'AV, staging & lighting' },
  { icon: Factory, label: 'Manufacturing', desc: 'Industrial machinery & tools' },
  { icon: Hotel,   label: 'Hospitality',   desc: 'Kitchen & service equipment' },
  { icon: Truck,   label: 'Transportation',desc: 'Fleet vehicles & logistics' },
  { icon: Leaf,    label: 'Agriculture',   desc: 'Farm machinery & irrigation' },
];

const FEATURES = [
  { icon: Package,   title: 'Equipment Inventory', desc: 'Real-time status, location, condition tracking with hourly, daily or fixed pricing.' },
  { icon: Calendar,  title: 'Smart Booking',        desc: 'Visual calendar with automatic conflict detection. Zero double-bookings guaranteed.' },
  { icon: BarChart3, title: 'Revenue Reports',      desc: 'Revenue by equipment, customer or time period. Know exactly what profits.' },
  { icon: Wrench,    title: 'Maintenance Tracking', desc: 'Preventive maintenance calendar, condition reports and repair cost tracking.' },
  { icon: Users,     title: 'Team & Roles',         desc: 'Admin, manager, operator, viewer — granular access control across your team.' },
  { icon: Shield,    title: 'Penalties & Damage',   desc: 'Auto late-return detection, damage logging, waive & track across all bookings.' },
];

const STATS = [
  { value: '99.9%', label: 'Uptime SLA',   icon: Activity },
  { value: '256-bit', label: 'Encryption', icon: Lock },
  { value: '40+',   label: 'Countries',    icon: Globe },
  { value: '<50ms', label: 'API Response', icon: Cpu },
];

const TESTIMONIALS = [
  { name: 'Marcus T.', role: 'Ops Director, BuildRight Co.', text: 'We cut double-booking incidents to zero in the first week. The conflict detection alone is worth every cent.', stars: 5 },
  { name: 'Priya K.',  role: 'Owner, StageCraft Events',     text: 'Our team went from spreadsheets to real-time tracking overnight. Bookings are up 30% since we switched.', stars: 5 },
  { name: 'James R.',  role: 'Fleet Manager, AgriLease',     text: 'Maintenance alerts have saved us thousands in prevented breakdowns. Absolutely indispensable.', stars: 5 },
];

const DEFAULT_PLANS = [
  { id: '1', name: 'Starter',      price_monthly: 49,  max_equipment: 25,  max_users: 5,  features: { label: 'Perfect for small rental businesses' } },
  { id: '2', name: 'Professional', price_monthly: 149, max_equipment: 100, max_users: 20, features: { label: 'For growing rental operations', reports: true } },
  { id: '3', name: 'Enterprise',   price_monthly: 349, max_equipment: 500, max_users: 100, features: { label: 'Full power for large fleets', reports: true, api: true, calendar: true } },
] as Plan[];

/* ─── Navbar ─────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-xl shadow-sm border-b border-border/50' : 'bg-transparent'}`}>
      <div className="container mx-auto px-5 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, oklch(0.52 0.24 264), oklch(0.60 0.18 196))' }}>
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">EquipTrack <span className="gradient-text">Pro</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          {[['Features', '#features'], ['Industries', '#industries'], ['Pricing', '#pricing']].map(([label, href]) => (
            <a key={label} href={href} className="hover:text-foreground transition-colors font-medium">{label}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="text-white border-0 font-semibold px-5 shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, oklch(0.52 0.24 264), oklch(0.60 0.18 196))' }}>
              Free Trial <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ───────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Parallax background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1800&q=80&auto=format&fit=crop')`,
          backgroundAttachment: 'fixed',
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, oklch(0.05 0.02 260 / 0.92) 0%, oklch(0.08 0.015 270 / 0.85) 50%, oklch(0.06 0.02 255 / 0.90) 100%)' }} />
      {/* Accent glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, oklch(0.52 0.24 264), transparent)' }} />
      <div className="absolute bottom-1/3 left-1/5 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, oklch(0.60 0.18 196), transparent)' }} />

      <div className="relative container mx-auto px-5 py-24 md:py-32">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="animate-fadeInUp inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border mb-7"
            style={{ background: 'oklch(0.52 0.24 264 / 0.15)', borderColor: 'oklch(0.52 0.24 264 / 0.4)', color: 'oklch(0.75 0.18 264)' }}>
            <Zap className="h-3.5 w-3.5" />
            Built for equipment rental businesses
          </div>

          {/* Headline */}
          <h1 className="animate-fadeInUp delay-100 hero-headline text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.06] tracking-tight text-white mb-6"
            style={{ background: 'none', WebkitTextFillColor: 'white' }}>
            Stop losing money on{' '}
            <span style={{
              background: 'linear-gradient(135deg, oklch(0.75 0.22 264) 0%, oklch(0.80 0.18 196) 50%, oklch(0.78 0.20 155) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              untracked equipment
            </span>
          </h1>

          {/* Sub */}
          <p className="animate-fadeInUp delay-200 text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed mb-10">
            EquipTrack Pro gives your team one command center for inventory,
            bookings, maintenance, and billing — built for any scale, any industry.
          </p>

          {/* CTAs */}
          <div className="animate-fadeInUp delay-300 flex flex-col sm:flex-row gap-3 mb-16">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8 h-13 text-base text-white border-0 shadow-2xl hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, oklch(0.52 0.24 264), oklch(0.60 0.18 196))' }}>
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-13 text-base text-white border-white/30 bg-white/10 hover:bg-white/15 backdrop-blur-sm">
                <Play className="h-4 w-4 mr-2" /> Sign In to Dashboard
              </Button>
            </Link>
          </div>

          {/* Trust line */}
          <p className="animate-fadeInUp delay-400 text-xs text-white/40 tracking-widest uppercase">
            No credit card · 14-day free trial · Cancel anytime
          </p>
        </div>

        {/* Floating stat cards */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-4">
          {[
            { label: 'Active Bookings', value: '2,847', trend: '+12%', color: 'oklch(0.52 0.24 264)' },
            { label: 'Fleet Utilization', value: '94.3%', trend: '+8%', color: 'oklch(0.56 0.17 155)' },
            { label: 'Revenue This Month', value: '$48,200', trend: '+23%', color: 'oklch(0.60 0.18 196)' },
          ].map((card, i) => (
            <div key={card.label}
              className={`animate-slideRight delay-${[300,400,500][i]} glass rounded-2xl p-4 w-52 animate-floatY${i % 2 === 1 ? '2' : ''}`}
              style={{ animationDelay: `${i * 0.8}s` }}>
              <p className="text-xs text-white/50 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" style={{ color: card.color }} />
                <span className="text-xs font-semibold" style={{ color: card.color }}>{card.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 20 L1440 60 Z" fill="var(--background)" />
        </svg>
      </div>
    </section>
  );
}

/* ─── Stats bar ──────────────────────────────────── */
function StatsBar() {
  return (
    <section className="py-14 px-5 border-b border-border/50">
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {STATS.map(({ value, label, icon: Icon }, i) => (
            <div key={label} className={`reveal flex items-center gap-3 p-5 rounded-2xl border border-border/60 bg-card hover-glow`}
              style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--accent-soft)' }}>
                <Icon className="h-5 w-5" style={{ color: 'var(--accent-color)' }} />
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
  );
}

/* ─── Industries ─────────────────────────────────── */
function Industries() {
  return (
    <section id="industries" className="py-24 px-5">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-14 reveal">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent-color)' }}>
            INDUSTRY COVERAGE
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Built for every industry</h2>
          <p className="text-muted-foreground mt-3 text-lg">One platform, configured for your business</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {INDUSTRIES.map(({ icon: Icon, label, desc }, i) => (
            <div key={label}
              className="reveal reveal-scale group relative p-6 rounded-2xl border border-border/60 bg-card overflow-hidden hover-glow cursor-default"
              style={{ transitionDelay: `${i * 60}ms` }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, var(--accent-soft), transparent)' }} />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 shadow-md"
                  style={{ background: 'linear-gradient(135deg, var(--accent-color), oklch(0.60 0.18 196))' }}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1 text-foreground">{label}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ───────────────────────────────────── */
function Features() {
  return (
    <section id="features" className="py-24 px-5 border-y border-border/50"
      style={{ background: 'linear-gradient(180deg, var(--muted) / 0.2 0%, transparent 100%)' }}>
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-14 reveal">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
            style={{ background: 'oklch(0.56 0.17 155 / 0.12)', color: 'oklch(0.56 0.17 155)' }}>
            CORE MODULES
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Everything you need to run rentals</h2>
          <p className="text-muted-foreground mt-3 text-lg">From first booking to final invoice</p>
        </div>

        {/* Big feature split */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="reveal-left relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 hover-glow"
            style={{ background: 'linear-gradient(135deg, var(--accent-muted) 0%, var(--card) 60%)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/2"
              style={{ background: 'var(--accent-color)' }} />
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5 shadow-xl"
                style={{ background: 'linear-gradient(135deg, var(--accent-color), oklch(0.60 0.18 196))' }}>
                <Package className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Equipment Inventory</h3>
              <p className="text-muted-foreground leading-relaxed">
                Real-time status, location, and condition tracking with per-unit SKU codes.
                Support for hourly, daily, weekly, monthly and fixed pricing models.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Unit SKUs', 'Condition Reports', 'QR Codes', 'Bulk Import'].map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full border border-border/60 text-muted-foreground">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="reveal relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 hover-glow"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.18 196 / 0.06) 0%, var(--card) 60%)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none -translate-y-1/2 translate-x-1/2"
              style={{ background: 'oklch(0.60 0.18 196)' }} />
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5 shadow-xl"
                style={{ background: 'linear-gradient(135deg, oklch(0.60 0.18 196), oklch(0.56 0.15 178))' }}>
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Smart Booking System</h3>
              <p className="text-muted-foreground leading-relaxed">
                Visual calendar with automatic conflict detection. Customers, line items, costs,
                penalties and status tracking all in one booking flow.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Conflict Detection', 'Multi-item Bookings', 'Auto Penalties', 'Calendar View'].map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full border border-border/60 text-muted-foreground">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.slice(2).map(({ icon: Icon, title, desc }, i) => (
            <div key={title}
              className="reveal-scale group relative p-5 rounded-2xl border border-border/60 bg-card overflow-hidden hover-glow"
              style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'var(--accent-soft)' }}>
                <Icon className="h-5 w-5" style={{ color: 'var(--accent-color)' }} />
              </div>
              <h3 className="font-semibold mb-1.5 text-foreground text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────── */
function HowItWorks() {
  return (
    <section className="py-24 px-5">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-14 reveal">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
            style={{ background: 'oklch(0.70 0.16 76 / 0.12)', color: 'oklch(0.70 0.16 76)' }}>
            QUICK START
          </span>
          <h2 className="text-3xl md:text-4xl font-bold">Up and running in minutes</h2>
        </div>
        <div className="space-y-4">
          {[
            { step: '01', title: 'Create your organisation', desc: 'Sign up, name your company, pick your industry and invite your team.', icon: Users },
            { step: '02', title: 'Add your equipment', desc: 'Import or manually add your fleet with pricing models, unit SKUs and current status.', icon: Package },
            { step: '03', title: 'Start taking bookings', desc: 'Create customers, book equipment, track everything in one place. Start earning smarter.', icon: TrendingUp },
          ].map(({ step, title, desc, icon: Icon }, i) => (
            <div key={step}
              className="reveal flex gap-5 p-6 rounded-2xl border border-border/60 bg-card hover-glow"
              style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--accent-color), oklch(0.60 0.18 196))' }}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--accent-color)' }}>{step}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ───────────────────────────────── */
function Testimonials() {
  return (
    <section className="py-24 px-5 border-y border-border/50 bg-muted/20">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-14 reveal">
          <h2 className="text-3xl md:text-4xl font-bold">Trusted by rental professionals</h2>
          <p className="text-muted-foreground mt-3">Real results from real businesses</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name}
              className="reveal-scale p-6 rounded-2xl border border-border/60 bg-card hover-glow flex flex-col"
              style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" style={{ color: 'oklch(0.78 0.17 76)' }} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ────────────────────────────────────── */
function Pricing({ plans }: { plans: Plan[] }) {
  return (
    <section id="pricing" className="py-24 px-5">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-14 reveal">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
            style={{ background: 'oklch(0.62 0.20 348 / 0.12)', color: 'oklch(0.62 0.20 348)' }}>
            PRICING
          </span>
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="text-muted-foreground mt-3 text-lg">Start free, scale as you grow</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => {
            const rawFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || {});
            const featureLabels: Record<string, string> = { reports: 'Advanced Reports', calendar: 'Calendar & Scheduling', api: 'API Access' };
            const featureList: string[] = Array.isArray(rawFeatures) ? rawFeatures : [
              `Up to ${plan.max_equipment} equipment items`,
              `Up to ${plan.max_users} team members`,
              ...Object.entries(rawFeatures)
                .filter(([k, v]) => k !== 'label' && v && v !== 'none' && v !== false)
                .map(([k]) => featureLabels[k] ?? k),
            ];
            const planLabel = !Array.isArray(rawFeatures) ? rawFeatures.label as string : '';
            const isPopular = i === 1;

            return (
              <div key={plan.id}
                className={`reveal-scale relative rounded-2xl border p-7 flex flex-col bg-card hover-glow ${isPopular ? 'md:-mt-4' : ''}`}
                style={{
                  transitionDelay: `${i * 100}ms`,
                  borderColor: isPopular ? 'var(--accent-color)' : undefined,
                  boxShadow: isPopular ? '0 0 0 1px var(--accent-color), 0 20px 60px oklch(0.52 0.24 264 / 0.20)' : undefined,
                }}>
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, var(--accent-color), oklch(0.60 0.18 196))' }}>
                      ✦ Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold mb-0.5 text-foreground">{plan.name}</h3>
                {planLabel && <p className="text-xs text-muted-foreground mb-5">{planLabel}</p>}

                <div className="mb-6 flex items-end gap-1">
                  <span className="text-4xl font-bold gradient-text">${plan.price_monthly}</span>
                  <span className="text-muted-foreground text-sm mb-1.5">/month</span>
                </div>

                <ul className="space-y-3 flex-1 mb-7">
                  {featureList.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-color)' }} />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="block">
                  <Button className={`w-full h-11 font-semibold ${isPopular ? 'text-white border-0 shadow-lg hover:opacity-90' : ''}`}
                    variant={isPopular ? 'default' : 'outline'}
                    style={isPopular ? { background: 'linear-gradient(135deg, var(--accent-color), oklch(0.60 0.18 196))' } : undefined}>
                    Get Started <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Banner ─────────────────────────────────── */
function CTABanner() {
  return (
    <section className="relative py-24 px-5 overflow-hidden">
      {/* Parallax bg */}
      <div className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1581093196277-9f608bb3b511?w=1600&q=80&auto=format&fit=crop')`,
          backgroundAttachment: 'fixed',
        }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, oklch(0.08 0.02 264 / 0.93) 0%, oklch(0.06 0.015 250 / 0.90) 100%)' }} />

      <div className="relative container mx-auto max-w-2xl text-center space-y-6 reveal">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mx-auto shadow-2xl"
          style={{ background: 'linear-gradient(135deg, var(--accent-color), oklch(0.60 0.18 196))' }}>
          <Zap className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          Ready to take control?
        </h2>
        <p className="text-white/65 text-lg">
          Join hundreds of rental businesses using EquipTrack Pro to reduce downtime,
          improve utilisation, and grow revenue.
        </p>
        <Link href="/register">
          <Button size="lg" className="gap-2 px-10 h-14 text-base text-white border-0 shadow-2xl hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, var(--accent-color), oklch(0.60 0.18 196))' }}>
            Start Your Free Trial <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <p className="text-xs text-white/35 tracking-widest uppercase">
          14-day free trial · No credit card · Cancel anytime
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-border/50 py-10 px-5 bg-background">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--accent-color), oklch(0.60 0.18 196))' }}>
                <Package className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-foreground">EquipTrack <span className="gradient-text">Pro</span></span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              The all-in-one platform for equipment rental management.
            </p>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Product</p>
              <div className="space-y-1.5">
                <a href="#features" className="block hover:text-foreground transition-colors">Features</a>
                <a href="#pricing"  className="block hover:text-foreground transition-colors">Pricing</a>
                <a href="#industries" className="block hover:text-foreground transition-colors">Industries</a>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Account</p>
              <div className="space-y-1.5">
                <Link href="/login"    className="block hover:text-foreground transition-colors">Sign In</Link>
                <Link href="/register" className="block hover:text-foreground transition-colors">Free Trial</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} EquipTrack Pro. All rights reserved.</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>99.9% uptime SLA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────── */
export default function LandingPage() {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  useReveal();

  useEffect(() => {
    api.get('/public/pricing')
      .then(({ data }) => { if (data.data?.length) setPlans(data.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <Hero />
      <StatsBar />
      <Industries />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing plans={plans} />
      <CTABanner />
      <Footer />
    </div>
  );
}
