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
  Star, TrendingUp, Menu, X, BarChart2,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════
   INTERSECTION-OBSERVER — fail-safe: forces in-view
   after 800ms so sections never stay blank
══════════════════════════════════════════════════════ */
function useReveal() {
  useEffect(() => {
    const apply = (el: Element) => el.classList.add('in-view');

    // 1. Mark document as JS-loaded so CSS hides un-seen items
    document.documentElement.classList.add('js-loaded');

    // 2. Immediately reveal anything already in viewport
    const allItems = Array.from(document.querySelectorAll('.sr-item'));
    allItems.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 100) apply(el);
    });

    // 3. Observe the rest
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) apply(e.target); }),
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );
    allItems.forEach(el => io.observe(el));

    // 4. Hard fallback — everything visible after 1.2s regardless
    const timer = setTimeout(() => allItems.forEach(apply), 1200);

    return () => { io.disconnect(); clearTimeout(timer); document.documentElement.classList.remove('js-loaded'); };
  }, []);
}

/* ══════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: Package,
    title: 'Smart Equipment Inventory',
    desc: 'Track every asset in real time — location, condition, status, and per-unit SKU codes. Support for hourly, daily, weekly and monthly pricing models.',
    tag: 'Inventory',
    color: '#4f46e5',
  },
  {
    icon: Calendar,
    title: 'Conflict-Free Booking',
    desc: 'Visual calendar with automatic double-booking prevention. Multi-item bookings, customer profiles, auto cost calculation — zero errors.',
    tag: 'Bookings',
    color: '#0ea5e9',
  },
  {
    icon: BarChart3,
    title: 'Revenue Intelligence',
    desc: 'See which equipment earns and which sits idle. Break down revenue by asset, customer, category or time period with exportable reports.',
    tag: 'Analytics',
    color: '#10b981',
  },
  {
    icon: Wrench,
    title: 'Maintenance Planning',
    desc: 'Preventive schedules, corrective work orders, condition reports and repair cost tracking — keep your fleet running and compliant.',
    tag: 'Maintenance',
    color: '#f59e0b',
  },
  {
    icon: Shield,
    title: 'Penalties & Damage',
    desc: 'Auto late-return detection, damage logging and invoicing. Waive, track and resolve every penalty across all bookings.',
    tag: 'Compliance',
    color: '#ef4444',
  },
  {
    icon: Users,
    title: 'Team & Role Management',
    desc: 'Admin, manager, operator, viewer — fine-grained access control ensures every team member sees exactly what they need.',
    tag: 'Access Control',
    color: '#8b5cf6',
  },
];

const INDUSTRIES = [
  {
    icon: HardHat,
    label: 'Construction',
    desc: 'Heavy excavators, cranes, scaffolding and compressors across multiple job sites. Track every unit with GPS precision.',
    stat: '3× faster job-site dispatch',
    color: '#f59e0b',
  },
  {
    icon: Music,
    label: 'Events & AV',
    desc: 'Audio, lighting rigs, staging, and production gear. Manage weekend festivals, touring shows and corporate events without conflict.',
    stat: 'Zero double-bookings',
    color: '#8b5cf6',
  },
  {
    icon: Factory,
    label: 'Manufacturing',
    desc: 'Industrial machinery, precision tools and conveyor systems. Scheduled maintenance keeps your production floor on target.',
    stat: 'Track thousands of tools',
    color: '#0ea5e9',
  },
  {
    icon: Hotel,
    label: 'Hospitality',
    desc: 'Commercial kitchen equipment, service carts and banquet furnishings. Handle seasonal demand spikes with confident availability.',
    stat: '40% less idle equipment',
    color: '#10b981',
  },
  {
    icon: Truck,
    label: 'Transportation',
    desc: 'Fleet vehicles, trailers and logistics equipment. Real-time availability, driver assignment and maintenance alerts in one screen.',
    stat: 'Full fleet visibility',
    color: '#ef4444',
  },
  {
    icon: Leaf,
    label: 'Agriculture',
    desc: 'Tractors, irrigation systems and harvesters. Seasonal booking cycles and field-level tracking tailored for farming operations.',
    stat: 'Seasonal scheduling',
    color: '#10b981',
  },
];

const METRICS = [
  { value: '99.9%',   label: 'Uptime SLA',        icon: Activity, desc: 'Enterprise-grade reliability' },
  { value: '256-bit', label: 'SSL Encryption',     icon: Lock,     desc: 'Bank-level data security' },
  { value: '40+',     label: 'Countries Served',   icon: Globe,    desc: 'Global deployment' },
  { value: '<50ms',   label: 'API Response',       icon: Cpu,      desc: 'Blazing fast performance' },
];

const TESTIMONIALS = [
  {
    name: 'Marcus T.',
    role: 'Operations Director',
    company: 'BuildRight Construction',
    text: 'We eliminated every double-booking incident in the first week. The conflict detection alone saves us hours of back-and-forth calls every month.',
    stars: 5,
    avatar: 'M',
  },
  {
    name: 'Priya K.',
    role: 'Owner',
    company: 'StageCraft Events',
    text: 'Our team went from error-prone spreadsheets to real-time tracking overnight. Revenue is up 30% and our clients notice the professionalism.',
    stars: 5,
    avatar: 'P',
  },
  {
    name: 'James R.',
    role: 'Fleet Manager',
    company: 'AgriLease Group',
    text: 'Automated maintenance alerts have saved us thousands in prevented breakdowns. Completely indispensable for any fleet over 10 pieces of equipment.',
    stars: 5,
    avatar: 'J',
  },
];

const HOW_IT_WORKS = [
  {
    n: '01',
    title: 'Create your organisation',
    desc: 'Sign up in under 2 minutes. Name your business, choose your industry, configure your settings and invite your team members.',
    icon: Users,
  },
  {
    n: '02',
    title: 'Add your fleet',
    desc: 'Import equipment in bulk or add items one by one — with SKU codes, pricing models, condition status, location and photos.',
    icon: Package,
  },
  {
    n: '03',
    title: 'Take bookings and grow',
    desc: 'Create customers, book equipment, track maintenance, generate reports. Everything your rental business needs, always in sync.',
    icon: TrendingUp,
  },
];

const DEFAULT_PLANS = [
  {
    id: '1', name: 'Starter', price_monthly: 49, max_equipment: 25, max_users: 5,
    features: { label: 'Perfect for small rental businesses' },
  },
  {
    id: '2', name: 'Professional', price_monthly: 149, max_equipment: 100, max_users: 20,
    features: { label: 'For growing rental operations', reports: true, calendar: true },
  },
  {
    id: '3', name: 'Enterprise', price_monthly: 349, max_equipment: 500, max_users: 100,
    features: { label: 'Full power for large fleets', reports: true, api: true, calendar: true },
  },
] as Plan[];

const PLAN_FEATURES = [
  ['Up to 25 equipment items', 'Up to 5 team members', 'Inventory & bookings', 'Email support', '14-day free trial'],
  ['Up to 100 equipment items', 'Up to 20 team members', 'Advanced reports & analytics', 'Calendar & scheduling', 'Priority support', '14-day free trial'],
  ['500+ equipment items', 'Unlimited team members', 'Everything in Professional', 'Full API access', 'Dedicated account manager', '14-day free trial'],
];

/* ══════════════════════════════════════════════════════
   STRUCTURED DATA (JSON-LD) for Google
══════════════════════════════════════════════════════ */
function StructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'EquipTrack Pro',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'Equipment rental management software for tracking inventory, bookings, maintenance, and billing.',
        url: 'https://equiptrackpro.com',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: '49',
          highPrice: '349',
          offerCount: '3',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '247',
          bestRating: '5',
        },
        featureList: [
          'Equipment Inventory Management',
          'Online Booking System',
          'Maintenance Scheduling',
          'Revenue Reports & Analytics',
          'Team & Role Management',
          'Penalty & Damage Tracking',
        ],
      },
      {
        '@type': 'Organization',
        name: 'EquipTrack Pro',
        url: 'https://equiptrackpro.com',
        description: 'SaaS platform for equipment rental businesses',
        sameAs: [],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is EquipTrack Pro?',
            acceptedAnswer: { '@type': 'Answer', text: 'EquipTrack Pro is a cloud-based equipment rental management platform that helps businesses track inventory, manage bookings, schedule maintenance, and generate revenue reports.' },
          },
          {
            '@type': 'Question',
            name: 'Is there a free trial?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes, EquipTrack Pro offers a 14-day free trial with no credit card required.' },
          },
          {
            '@type': 'Question',
            name: 'What industries does EquipTrack Pro support?',
            acceptedAnswer: { '@type': 'Answer', text: 'EquipTrack Pro supports construction, events & AV, manufacturing, hospitality, transportation, and agriculture industries.' },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ══════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : 'none',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
      }}>
      <div className="max-w-6xl mx-auto px-6 h-[68px] flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="EquipTrack Pro Home">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)' }}>
            <Package className="h-4.5 w-4.5 text-white" style={{ height: '18px', width: '18px' }} />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-[15px] leading-none">EquipTrack</span>
            <span className="font-bold text-[15px] leading-none" style={{ color: '#4f46e5' }}> Pro</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {[['Features', '#features'], ['Industries', '#industries'], ['Pricing', '#pricing']].map(([label, href]) => (
            <a key={label} href={href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ color: scrolled ? '#4b5563' : '#374151' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,70,229,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm"
              className="font-semibold text-white rounded-xl px-5 h-9 border-0 shadow-md hover:shadow-lg hover:opacity-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }}>
              Start Free Trial
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: '#374151' }}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu">
          {open ? <X style={{ height: '20px', width: '20px' }} /> : <Menu style={{ height: '20px', width: '20px' }} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-1"
          style={{ background: 'rgba(255,255,255,0.99)', backdropFilter: 'blur(20px)' }}>
          {[['Features', '#features'], ['Industries', '#industries'], ['Pricing', '#pricing']].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-gray-100 mt-2">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full font-medium">Sign in</Button>
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}>
              <Button className="w-full font-semibold text-white border-0"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
                Start Free Trial — No Card
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ══════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section
      aria-label="Hero — Equipment Rental Management Software"
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(175deg, #f0f0ff 0%, #e8eeff 30%, #f8fafc 65%, #ffffff 100%)', paddingTop: '68px' }}>

      {/* BG decorations */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(79,70,229,0.10) 0%, transparent 65%)' }} />
        <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'rgba(79,70,229,0.06)' }} />
        <div className="absolute top-1/4 -right-16 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'rgba(14,165,233,0.06)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="pt-20 pb-10 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border mb-8"
            style={{
              background: 'rgba(79,70,229,0.06)',
              borderColor: 'rgba(79,70,229,0.18)',
              color: '#4f46e5',
              animation: 'fadeInUp 0.6s ease both',
            }}>
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#4f46e5' }} />
            Trusted by 1,000+ rental businesses worldwide
          </div>

          {/* H1 — primary keyword */}
          <h1
            className="font-bold text-gray-900 leading-[1.06] tracking-tight mb-6"
            style={{
              fontSize: 'clamp(2.6rem, 6.5vw, 4.8rem)',
              letterSpacing: '-0.03em',
              background: 'none',
              WebkitTextFillColor: 'inherit',
              animation: 'fadeInUp 0.6s ease 0.1s both',
            }}>
            Equipment Rental Management
            <br />
            <span style={{
              display: 'inline',
              background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 55%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              That Actually Works
            </span>
          </h1>

          {/* Description — meta description matches */}
          <p
            className="text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ fontSize: '1.15rem', animation: 'fadeInUp 0.6s ease 0.2s both' }}>
            Stop losing revenue to missed bookings and idle equipment. EquipTrack Pro gives your team one smart platform for inventory, bookings, maintenance, and billing — from day one.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-7"
            style={{ animation: 'fadeInUp 0.6s ease 0.3s both' }}>
            <Link href="/register">
              <Button
                className="h-13 px-8 text-base font-bold text-white rounded-xl border-0 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', height: '52px', fontSize: '1rem' }}>
                Start Free — No Card Required
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline"
                className="h-13 px-7 text-base font-medium rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                style={{ height: '52px', fontSize: '1rem' }}>
                Sign in to Dashboard
              </Button>
            </Link>
          </div>

          {/* Trust line */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400 mb-16"
            style={{ animation: 'fadeInUp 0.6s ease 0.4s both' }}>
            {['14-day free trial', 'No credit card required', 'Cancel anytime', 'Setup in minutes'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Dashboard screenshot mockup ── */}
        <div className="relative" style={{ animation: 'fadeInUp 0.8s ease 0.5s both' }}>
          {/* Glow shadow */}
          <div aria-hidden className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-16 blur-3xl"
            style={{ background: 'rgba(79,70,229,0.18)' }} />

          <div className="relative rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 40px 80px -20px rgba(79,70,229,0.22), 0 0 0 1px rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.08)' }}>

            {/* Browser top bar */}
            <div className="flex items-center gap-3 px-5 py-3 bg-gray-100 border-b border-gray-200">
              <div className="flex gap-1.5">
                {['#f87171','#fbbf24','#4ade80'].map(c => (
                  <div key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white border border-gray-200 rounded-md px-4 py-1 text-xs text-gray-400 w-72 text-center flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3 text-green-500" />
                  app.equiptrackpro.com/dashboard
                </div>
              </div>
            </div>

            {/* App content */}
            <div className="bg-gray-50 flex" style={{ minHeight: '460px' }}>

              {/* Sidebar */}
              <div className="w-52 bg-white border-r border-gray-100 p-4 shrink-0 hidden sm:flex flex-col">
                <div className="flex items-center gap-2 px-2 py-2 mb-5">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' }}>
                    <Package style={{ height: '14px', width: '14px', color: 'white' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 leading-none">EquipTrack</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">BuildRight Co.</p>
                  </div>
                </div>
                {[
                  { icon: BarChart2, label: 'Dashboard',   active: true  },
                  { icon: Package,   label: 'Equipment',   active: false },
                  { icon: Calendar,  label: 'Bookings',    active: false },
                  { icon: Users,     label: 'Customers',   active: false },
                  { icon: Wrench,    label: 'Maintenance', active: false },
                  { icon: BarChart3, label: 'Reports',     active: false },
                ].map(({ icon: Icon, label, active }) => (
                  <div key={label}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-xs font-medium"
                    style={{ background: active ? '#eef2ff' : 'transparent', color: active ? '#4f46e5' : '#9ca3af' }}>
                    <Icon style={{ height: '14px', width: '14px' }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="flex-1 p-5">
                {/* Heading row */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm font-bold text-gray-800">Good morning, Admin 👋</p>
                    <p className="text-xs text-gray-400">Here's your fleet overview for today.</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
                    + New Booking
                  </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Equipment',      value: '47',      sub: '12 in use',  color: '#4f46e5', bg: '#eef2ff' },
                    { label: 'Active Bookings', value: '23',     sub: '4 due today', color: '#0ea5e9', bg: '#e0f7fe' },
                    { label: 'Revenue (MTD)',   value: '$18,420', sub: '+18% vs last mo', color: '#10b981', bg: '#ecfdf5' },
                    { label: 'Maintenance Due', value: '3',      sub: '1 overdue',  color: '#f59e0b', bg: '#fffbeb' },
                  ].map(({ label, value, sub, color, bg }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm">
                      <p className="text-[11px] text-gray-400 mb-1.5">{label}</p>
                      <p className="text-xl font-bold mb-1" style={{ color }}>{value}</p>
                      <p className="text-[10px] font-medium" style={{ color: `${color}99` }}>{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Bookings table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-700">Recent Bookings</span>
                    <span className="text-xs font-semibold cursor-pointer" style={{ color: '#4f46e5' }}>View all →</span>
                  </div>
                  {[
                    { equip: 'CAT 320 Excavator',       customer: 'Apex Contractors Ltd',  status: 'Active',    sc: '#dcfce7', st: '#16a34a' },
                    { equip: 'Liebherr 180T Crane',      customer: 'SkyScrape Developments', status: 'Active',   sc: '#dcfce7', st: '#16a34a' },
                    { equip: 'Atlas Copco XAS 375',      customer: 'FastBuild LLC',          status: 'Pending',  sc: '#fef9c3', st: '#ca8a04' },
                    { equip: 'CAT DE275E Generator',     customer: 'Metro City Council',     status: 'Overdue',  sc: '#fee2e2', st: '#dc2626' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: '#f3f4f6' }}>
                        <Package style={{ height: '13px', width: '13px', color: '#9ca3af' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{r.equip}</p>
                        <p className="text-[11px] text-gray-400 truncate">{r.customer}</p>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: r.sc, color: r.st }}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom curve */}
      <div className="h-16 overflow-hidden mt-12 bg-white" aria-hidden>
        <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="w-full h-full" style={{ fill: '#f9fafb', display: 'block' }}>
          <path d="M0,0 C480,64 960,64 1440,0 L1440,64 L0,64 Z" />
        </svg>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   METRICS BAR
══════════════════════════════════════════════════════ */
function MetricsBar() {
  return (
    <section aria-label="Platform statistics" style={{ background: '#f9fafb', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRICS.map(({ value, label, icon: Icon, desc }, i) => (
            <div key={label}
              className="sr-item text-center p-7 rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all duration-300"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transitionDelay: `${i * 60}ms` }}>
              <div className="h-13 w-13 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(79,70,229,0.07)', height: '52px', width: '52px' }}>
                <Icon style={{ height: '22px', width: '22px', color: '#4f46e5' }} />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
              <p className="text-sm font-semibold text-gray-700 mb-1">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   FEATURES
══════════════════════════════════════════════════════ */
function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" style={{ background: 'white', paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div className="max-w-6xl mx-auto px-6">

        <div className="text-center max-w-2xl mx-auto mb-16 sr-item">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
            style={{ background: 'rgba(79,70,229,0.07)', color: '#4f46e5' }}>
            <Zap style={{ height: '12px', width: '12px' }} />
            Everything in one platform
          </div>
          <h2 id="features-heading" className="font-bold text-gray-900 mb-4 leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.025em' }}>
            Every tool your rental business needs
          </h2>
          <p className="text-gray-500 leading-relaxed" style={{ fontSize: '1.0625rem' }}>
            From first booking to final invoice — one platform handles your entire rental workflow so your team never misses a beat.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, tag, color }, i) => (
            <article key={title}
              className="sr-item group relative rounded-2xl border border-gray-100 bg-white p-7 cursor-default transition-all duration-300 hover:border-indigo-100 hover:-translate-y-1 hover:shadow-xl"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transitionDelay: `${i * 50}ms` }}
              aria-label={title}>
              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ background: `${color}14` }}>
                    <Icon style={{ height: '22px', width: '22px', color }} />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${color}10`, color }}>
                    {tag}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2.5" style={{ fontSize: '1rem' }}>{title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   INDUSTRIES
══════════════════════════════════════════════════════ */
function Industries() {
  return (
    <section id="industries" aria-labelledby="industries-heading"
      style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)', paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sr-item">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
            style={{ background: 'rgba(79,70,229,0.07)', color: '#4f46e5' }}>
            Industry Coverage
          </div>
          <h2 id="industries-heading" className="font-bold text-gray-900 mb-4 leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.025em' }}>
            Built for every rental industry
          </h2>
          <p className="text-gray-500 leading-relaxed" style={{ fontSize: '1.0625rem' }}>
            Whether you rent excavators or event lighting, EquipTrack Pro adapts to your specific workflow out of the box.
          </p>
        </div>

        {/* Industry cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INDUSTRIES.map(({ icon: Icon, label, desc, stat, color }, i) => (
            <article key={label}
              className="sr-item group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transitionDelay: `${i * 60}ms` }}>

              {/* Hover bg accent */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle, ${color}0d 0%, transparent 70%)`, transform: 'translate(40%, -40%)' }} />

              <div className="relative">
                {/* Icon + stat pill */}
                <div className="flex items-start justify-between mb-5">
                  <div className="h-13 w-13 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"
                    style={{ height: '52px', width: '52px', background: `${color}12`, border: `1px solid ${color}20` }}>
                    <Icon style={{ height: '24px', width: '24px', color }} />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${color}10`, color }}>
                    {stat}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: '1rem' }}>{label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{desc}</p>

                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                  <CheckCircle style={{ height: '14px', width: '14px' }} />
                  Fully supported
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center sr-item">
          <p className="text-gray-500 text-sm mb-4">Don't see your industry? EquipTrack Pro works for any equipment rental operation.</p>
          <Link href="/register">
            <Button variant="outline"
              className="gap-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all font-semibold rounded-xl px-6">
              Start Free — Works for Any Industry
              <ArrowRight style={{ height: '15px', width: '15px' }} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════════════════ */
function HowItWorks() {
  return (
    <section aria-labelledby="hiw-heading" style={{ background: 'white', paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-14 sr-item">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
            style={{ background: 'rgba(79,70,229,0.07)', color: '#4f46e5' }}>
            Quick Start
          </div>
          <h2 id="hiw-heading" className="font-bold text-gray-900 mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.025em' }}>
            Up and running in minutes
          </h2>
          <p className="text-gray-500" style={{ fontSize: '1.0625rem' }}>Three simple steps and your entire team is live.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(({ n, title, desc, icon: Icon }, i) => (
            <div key={n}
              className="sr-item relative rounded-2xl bg-white border border-gray-100 p-8 hover:shadow-xl transition-all duration-300"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transitionDelay: `${i * 80}ms` }}>
              {/* Connector */}
              {i < 2 && (
                <div aria-hidden className="hidden md:block absolute top-10 -right-3 z-10">
                  <div className="w-6 border-t-2 border-dashed border-indigo-200" />
                </div>
              )}
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6 font-mono font-bold text-xl text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
                {n}
              </div>
              <h3 className="font-bold text-gray-900 mb-2.5" style={{ fontSize: '1rem' }}>{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   SOCIAL PROOF / TESTIMONIALS
══════════════════════════════════════════════════════ */
function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading"
      style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)', paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-14 sr-item">
          <h2 id="testimonials-heading" className="font-bold text-gray-900 mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.025em' }}>
            Loved by rental professionals
          </h2>
          <p className="text-gray-500" style={{ fontSize: '1.0625rem' }}>
            Real results from real businesses. Rated 4.9★ by 247+ customers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <article key={t.name}
              className="sr-item bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-xl transition-all duration-300 flex flex-col"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transitionDelay: `${i * 70}ms` }}
              itemScope itemType="https://schema.org/Review">
              {/* Stars */}
              <div className="flex gap-0.5 mb-5" aria-label="5 out of 5 stars">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="fill-current" style={{ height: '16px', width: '16px', color: '#f59e0b' }} />
                ))}
              </div>
              {/* Quote */}
              <blockquote className="text-gray-700 leading-relaxed flex-1 mb-6"
                style={{ fontSize: '0.9375rem' }}
                itemProp="reviewBody">
                "{t.text}"
              </blockquote>
              {/* Author */}
              <div className="flex items-center gap-3" itemProp="author" itemScope itemType="https://schema.org/Person">
                <div className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' }}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm" itemProp="name">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role} · <span itemProp="worksFor">{t.company}</span></p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   PRICING
══════════════════════════════════════════════════════ */
function Pricing({ plans }: { plans: Plan[] }) {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" style={{ background: 'white', paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-14 sr-item">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
            style={{ background: 'rgba(79,70,229,0.07)', color: '#4f46e5' }}>
            Pricing
          </div>
          <h2 id="pricing-heading" className="font-bold text-gray-900 mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.025em' }}>
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500" style={{ fontSize: '1.0625rem' }}>
            Start free for 14 days. No credit card, no hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => {
            const rawF = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || {});
            const feats = PLAN_FEATURES[i] || [];
            const isPopular = i === 1;

            return (
              <div key={plan.id}
                className="sr-item relative rounded-2xl border p-8 flex flex-col transition-all duration-300 hover:shadow-2xl"
                style={{
                  transitionDelay: `${i * 80}ms`,
                  borderColor: isPopular ? '#4f46e5' : '#e5e7eb',
                  background: isPopular ? 'linear-gradient(180deg, #f5f3ff 0%, white 60%)' : 'white',
                  boxShadow: isPopular ? '0 0 0 1px #4f46e5, 0 24px 60px rgba(79,70,229,0.16)' : '0 1px 4px rgba(0,0,0,0.05)',
                  marginTop: isPopular ? '-14px' : '0',
                }}>

                {isPopular && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
                      ✦ Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-7">
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4f46e5' }}>{plan.name}</p>
                  <div className="flex items-end gap-1.5 mb-2">
                    <span className="font-bold text-gray-900" style={{ fontSize: '3rem', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      ${plan.price_monthly}
                    </span>
                    <span className="text-gray-400 text-sm pb-1">/month</span>
                  </div>
                  <p className="text-sm text-gray-500">{!Array.isArray(rawF) ? rawF.label as string : ''}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-7">
                  {feats.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: isPopular ? 'rgba(79,70,229,0.1)' : '#f3f4f6' }}>
                        <CheckCircle style={{ height: '11px', width: '11px', color: isPopular ? '#4f46e5' : '#6b7280' }} />
                      </div>
                      <span className="text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/register">
                  <Button className={`w-full h-11 font-semibold rounded-xl transition-all ${isPopular ? 'text-white border-0 shadow-lg hover:opacity-90 hover:-translate-y-0.5' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}
                    variant={isPopular ? 'default' : 'outline'}
                    style={isPopular ? { background: 'linear-gradient(135deg, #4f46e5, #4338ca)' } : undefined}>
                    Get started free
                    <ArrowRight style={{ height: '15px', width: '15px', marginLeft: '6px' }} />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8 sr-item">
          All plans include a 14-day free trial. Switch or cancel anytime. Volume discounts available for large fleets.
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   FAQ (for SEO rich snippets)
══════════════════════════════════════════════════════ */
function FAQ() {
  const items = [
    { q: 'What is EquipTrack Pro?', a: 'EquipTrack Pro is a cloud-based equipment rental management platform that helps businesses track inventory, manage bookings, schedule maintenance, and generate revenue reports — all in one place.' },
    { q: 'Does EquipTrack Pro have a free trial?', a: 'Yes. Every plan includes a 14-day free trial with full access. No credit card is required to start.' },
    { q: 'What industries does EquipTrack Pro support?', a: 'EquipTrack Pro supports construction, events & AV, manufacturing, hospitality, transportation, and agriculture — and any other equipment rental business.' },
    { q: 'Can I manage multiple team members?', a: 'Yes. Every plan supports multiple team members with granular role-based access control: admin, manager, operator, and viewer roles.' },
    { q: 'Is my data secure?', a: 'All data is encrypted with 256-bit SSL. EquipTrack Pro runs on enterprise-grade infrastructure with 99.9% uptime SLA and daily backups.' },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section aria-labelledby="faq-heading"
      style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)', paddingTop: '6rem', paddingBottom: '6rem' }}
      itemScope itemType="https://schema.org/FAQPage">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12 sr-item">
          <h2 id="faq-heading" className="font-bold text-gray-900 mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', letterSpacing: '-0.025em' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500">Everything you need to know about EquipTrack Pro.</p>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i}
              className="sr-item bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-indigo-100 transition-all"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transitionDelay: `${i * 50}ms` }}
              itemScope itemType="https://schema.org/Question"
              itemProp="mainEntity">
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                itemProp="name">
                <span style={{ fontSize: '0.9375rem' }}>{item.q}</span>
                <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 ml-4 transition-transform duration-200"
                  style={{ background: 'rgba(79,70,229,0.08)', transform: open === i ? 'rotate(180deg)' : 'none' }}>
                  <ChevronDown style={{ height: '14px', width: '14px', color: '#4f46e5' }} />
                </div>
              </button>
              {open === i && (
                <div className="px-6 pb-5"
                  itemScope itemType="https://schema.org/Answer"
                  itemProp="acceptedAnswer">
                  <p className="text-gray-500 leading-relaxed text-sm" itemProp="text">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Missing import
function ChevronDown({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={style}>
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   CTA
══════════════════════════════════════════════════════ */
function CTA() {
  return (
    <section aria-label="Start free trial"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #1e3a8a 100%)', paddingTop: '6rem', paddingBottom: '6rem' }}>
      <div className="max-w-3xl mx-auto px-6 text-center sr-item">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-7"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.18)' }}>
          <Zap style={{ height: '28px', width: '28px', color: 'white' }} />
        </div>
        <h2 className="font-bold text-white mb-5 leading-tight"
          style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.025em' }}>
          Ready to transform your
          <br />rental business?
        </h2>
        <p className="mb-10 leading-relaxed" style={{ color: 'rgba(199,210,254,0.9)', fontSize: '1.0625rem', maxWidth: '540px', margin: '0 auto 2.5rem' }}>
          Join 1,000+ equipment rental businesses who use EquipTrack Pro to eliminate double-bookings, reduce downtime, and grow revenue — starting today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button className="font-bold text-indigo-800 rounded-xl h-14 px-10 text-base hover:-translate-y-0.5 hover:shadow-2xl transition-all"
              style={{ background: 'white', color: '#3730a3', height: '56px', fontSize: '1.0625rem' }}>
              Start Free Trial — No Card Required
              <ArrowRight style={{ height: '18px', width: '18px', marginLeft: '8px' }} />
            </Button>
          </Link>
        </div>
        <p className="mt-5 text-sm" style={{ color: 'rgba(165,180,252,0.6)' }}>
          14-day free trial · No credit card · Cancel anytime · Setup in minutes
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ background: '#0f0e1a', paddingTop: '4rem', paddingBottom: '3rem' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label="EquipTrack Pro">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' }}>
                <Package style={{ height: '18px', width: '18px', color: 'white' }} />
              </div>
              <div>
                <span className="font-bold text-white text-sm">EquipTrack</span>
                <span className="font-bold text-sm" style={{ color: '#818cf8' }}> Pro</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7280', maxWidth: '200px' }}>
              The all-in-one platform for equipment rental management.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>Product</p>
            <ul className="space-y-2.5">
              {[['Features', '#features'], ['Pricing', '#pricing'], ['Industries', '#industries']].map(([l, h]) => (
                <li key={l}>
                  <a href={h} className="text-sm transition-colors" style={{ color: '#6b7280' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>Account</p>
            <ul className="space-y-2.5">
              <li><Link href="/login" className="text-sm" style={{ color: '#6b7280' }}>Sign In</Link></li>
              <li><Link href="/register" className="text-sm" style={{ color: '#6b7280' }}>Free Trial</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#9ca3af' }}>Platform</p>
            <ul className="space-y-2.5">
              {[
                { icon: Activity, text: '99.9% Uptime SLA' },
                { icon: Lock,     text: '256-bit Encryption' },
                { icon: Globe,    text: '40+ Countries' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-sm" style={{ color: '#6b7280' }}>
                  <Icon style={{ height: '13px', width: '13px' }} /> {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderColor: '#1f2937' }}>
          <p className="text-xs" style={{ color: '#4b5563' }}>
            © {new Date().getFullYear()} EquipTrack Pro. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#16a34a' }}>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT CLIENT COMPONENT
══════════════════════════════════════════════════════ */
export default function LandingClient() {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  useReveal();

  useEffect(() => {
    api.get('/public/pricing')
      .then(({ data }) => { if (data.data?.length) setPlans(data.data); })
      .catch(() => {});
  }, []);

  return (
    <>
      <StructuredData />
      <div style={{ fontFamily: "'Inter', ui-sans-serif, -apple-system, sans-serif", overflowX: 'hidden' }}>
        <Navbar />
        <main id="main-content">
          <Hero />
          <MetricsBar />
          <Features />
          <Industries />
          <HowItWorks />
          <Testimonials />
          <Pricing plans={plans} />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
