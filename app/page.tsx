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
  Star, TrendingUp, Clock, Menu, X, ChevronDown,
  BarChart2, Bell, FileText, Settings,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════ */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal, .reveal-left, .reveal-scale, .reveal-right')
      .forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ══════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════ */
const NAV_LINKS = [
  { label: 'Features',   href: '#features'   },
  { label: 'Industries', href: '#industries' },
  { label: 'Pricing',    href: '#pricing'    },
];

const METRICS = [
  { value: '99.9%',   label: 'Uptime SLA',   icon: Activity },
  { value: '256-bit', label: 'Encryption',   icon: Lock     },
  { value: '40+',     label: 'Countries',    icon: Globe    },
  { value: '<50ms',   label: 'API Response', icon: Cpu      },
];

const FEATURES = [
  { icon: Package,   title: 'Equipment Inventory',  desc: 'Track every asset in real time — status, location, condition, and SKU units. Support for hourly, daily, weekly, and monthly pricing.', tag: 'Inventory' },
  { icon: Calendar,  title: 'Conflict-Free Booking', desc: 'Visual drag-and-drop calendar with automatic double-booking prevention. Multi-item bookings, customer profiles, auto cost calculation.', tag: 'Bookings' },
  { icon: BarChart3, title: 'Revenue Intelligence',  desc: 'See which equipment earns, which sits idle. Break down revenue by asset, customer, category or time period.', tag: 'Analytics' },
  { icon: Wrench,    title: 'Maintenance Planning',  desc: 'Preventive schedules, corrective work orders, condition reports, and repair cost tracking — keep your fleet operational.', tag: 'Maintenance' },
  { icon: Shield,    title: 'Penalties & Damage',    desc: 'Auto late-return detection, damage logging and invoicing. Waive, track, and resolve across all bookings.', tag: 'Compliance' },
  { icon: Users,     title: 'Team & Roles',          desc: 'Admin, manager, operator, viewer — fine-grained access control ensures everyone sees only what they need.', tag: 'Access Control' },
];

const INDUSTRIES = [
  { icon: HardHat, label: 'Construction',  proof: '3× faster job-site dispatching' },
  { icon: Music,   label: 'Events & AV',   proof: 'Zero double-bookings guaranteed' },
  { icon: Factory, label: 'Manufacturing', proof: 'Track thousands of tools per shift' },
  { icon: Hotel,   label: 'Hospitality',   proof: '40% reduction in idle equipment' },
  { icon: Truck,   label: 'Transport',     proof: 'Full fleet visibility, one screen' },
  { icon: Leaf,    label: 'Agriculture',   proof: 'Seasonal scheduling made simple' },
];

const TESTIMONIALS = [
  { name: 'Marcus T.',  role: 'Ops Director · BuildRight Co.',  avatar: 'M', text: 'We cut double-booking incidents to zero in the first week. The conflict detection alone is worth every penny.' },
  { name: 'Priya K.',   role: 'Owner · StageCraft Events',      avatar: 'P', text: 'Our team went from spreadsheets to real-time tracking overnight. Revenue is up 30% since we made the switch.' },
  { name: 'James R.',   role: 'Fleet Manager · AgriLease',      avatar: 'J', text: 'Maintenance alerts have saved us thousands in breakdowns. Completely indispensable for any fleet operation.' },
];

const HOW_IT_WORKS = [
  { n: '01', title: 'Set up your organisation',  desc: 'Sign up in 2 minutes. Name your company, choose your industry, and invite your team.' },
  { n: '02', title: 'Add your fleet',            desc: 'Import or manually add equipment with SKUs, pricing models, condition, and location.' },
  { n: '03', title: 'Take bookings & grow',      desc: 'Create customers, book equipment, track maintenance — everything in one dashboard.' },
];

const DEFAULT_PLANS = [
  { id: '1', name: 'Starter',      price_monthly: 49,  max_equipment: 25,  max_users: 5,  features: { label: 'Perfect for small rental businesses' } },
  { id: '2', name: 'Professional', price_monthly: 149, max_equipment: 100, max_users: 20, features: { label: 'For growing rental operations', reports: true, calendar: true } },
  { id: '3', name: 'Enterprise',   price_monthly: 349, max_equipment: 500, max_users: 100, features: { label: 'Full power for large fleets', reports: true, api: true, calendar: true } },
] as Plan[];

const PLAN_FEATURES = [
  ['Up to {max_equipment} equipment items', 'Up to {max_users} team members', 'Core booking & inventory', 'Email support'],
  ['Up to {max_equipment} equipment items', 'Up to {max_users} team members', 'Advanced reports & analytics', 'Calendar & scheduling', 'Priority support'],
  ['Unlimited equipment', 'Unlimited team members', 'Everything in Professional', 'API access', 'Dedicated account manager'],
];

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
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.06)' : 'none',
      }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)' }}>
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base tracking-tight">
            EquipTrack <span style={{ color: '#4f46e5' }}>Pro</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">
              {label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 font-medium">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="font-semibold text-white rounded-lg px-5 shadow-md hover:shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }}>
              Start Free Trial
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-xl px-6 py-4 space-y-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              {label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-gray-100">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full font-medium">Sign in</Button>
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}>
              <Button className="w-full font-semibold text-white" style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
                Start Free Trial
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
    <section className="relative overflow-hidden pt-16" style={{ background: 'linear-gradient(180deg, #f8f7ff 0%, #eef2ff 40%, #ffffff 100%)' }}>

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Radial glow top */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(79,70,229,0.12) 0%, transparent 70%)' }} />
        {/* Orb left */}
        <div className="absolute top-24 -left-16 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'rgba(79,70,229,0.08)' }} />
        {/* Orb right */}
        <div className="absolute top-32 -right-16 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'rgba(14,165,233,0.08)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-0">

        {/* Badge */}
        <div className="flex justify-center mb-6 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border"
            style={{ background: 'rgba(79,70,229,0.06)', borderColor: 'rgba(79,70,229,0.2)', color: '#4f46e5' }}>
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            The #1 Equipment Rental Platform
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-7">
          <h1 className="animate-fadeInUp delay-100 font-bold tracking-tight text-gray-900 leading-[1.05]"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)', background: 'none', WebkitTextFillColor: 'inherit' }}>
            Manage your entire fleet
            <br />
            <span style={{
              display: 'inline',
              background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 60%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              in one place
            </span>
          </h1>
        </div>

        {/* Subheadline */}
        <p className="animate-fadeInUp delay-200 text-center text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
          EquipTrack Pro gives rental businesses a single command center for inventory,
          bookings, maintenance, billing, and reporting — built for teams of any size.
        </p>

        {/* CTA row */}
        <div className="animate-fadeInUp delay-300 flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Link href="/register">
            <Button size="lg"
              className="h-13 px-8 text-base font-semibold text-white rounded-xl border-0 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }}>
              Start Free — No Card Needed
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline"
              className="h-13 px-7 text-base font-medium rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
              Sign in to Dashboard
            </Button>
          </Link>
        </div>

        {/* Trust signals */}
        <div className="animate-fadeInUp delay-400 flex items-center justify-center gap-6 text-sm text-gray-400 mb-16">
          {['14-day free trial', 'No credit card', 'Cancel anytime'].map((t, i) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              {t}
            </span>
          ))}
        </div>

        {/* Dashboard preview */}
        <div className="animate-fadeInUp delay-500 relative mx-auto max-w-5xl">
          {/* Shadow beneath */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-16 blur-2xl"
            style={{ background: 'rgba(79,70,229,0.15)' }} />

          {/* Browser chrome */}
          <div className="relative rounded-2xl border border-gray-200 shadow-2xl overflow-hidden bg-white"
            style={{ boxShadow: '0 40px 80px -20px rgba(79,70,229,0.18), 0 0 0 1px rgba(79,70,229,0.06)' }}>

            {/* Browser bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white border border-gray-200 rounded-md px-4 py-1 text-xs text-gray-400 w-64 text-center">
                  app.equiptrackpro.com/dashboard
                </div>
              </div>
            </div>

            {/* App UI mockup */}
            <div className="bg-gray-50 p-0" style={{ minHeight: '420px' }}>
              <div className="flex h-full" style={{ minHeight: '420px' }}>

                {/* Sidebar mock */}
                <div className="w-48 border-r border-gray-200 bg-white p-3 shrink-0 hidden sm:block">
                  <div className="flex items-center gap-2 px-2 py-1.5 mb-4">
                    <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
                      <Package className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-800">EquipTrack</span>
                  </div>
                  {[
                    { icon: BarChart2, label: 'Dashboard', active: true },
                    { icon: Package,   label: 'Equipment', active: false },
                    { icon: Calendar,  label: 'Bookings',  active: false },
                    { icon: Users,     label: 'Customers', active: false },
                    { icon: Wrench,    label: 'Maintenance', active: false },
                    { icon: BarChart3, label: 'Reports',   active: false },
                  ].map(({ icon: Icon, label, active }) => (
                    <div key={label}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-0.5 text-xs font-medium ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Main content mock */}
                <div className="flex-1 p-5 overflow-hidden">
                  {/* KPI cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Total Equipment', value: '47',     color: '#4f46e5', bg: '#eef2ff' },
                      { label: 'Active Bookings',  value: '23',     color: '#0ea5e9', bg: '#e0f7fe' },
                      { label: 'Revenue (MTD)',    value: '$18,420', color: '#10b981', bg: '#ecfdf5' },
                      { label: 'Maintenance Due',  value: '3',      color: '#f59e0b', bg: '#fffbeb' },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className="text-xl font-bold" style={{ color }}>{value}</p>
                        <div className="mt-1.5 h-1 rounded-full" style={{ background: bg }}>
                          <div className="h-1 rounded-full w-3/4" style={{ background: color, opacity: 0.5 }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bookings table */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                      <span className="text-xs font-semibold text-gray-700">Recent Bookings</span>
                      <span className="text-xs text-indigo-600 font-medium cursor-pointer">View all →</span>
                    </div>
                    {[
                      { equip: 'CAT 320 Excavator',   customer: 'Apex Contractors', status: 'Active',    color: '#10b981', bg: '#ecfdf5' },
                      { equip: 'Liebherr 180T Crane',  customer: 'SkyScrape Dev.',   status: 'Active',    color: '#10b981', bg: '#ecfdf5' },
                      { equip: 'Atlas Copco XAS 375',  customer: 'FastBuild LLC',    status: 'Pending',   color: '#f59e0b', bg: '#fffbeb' },
                      { equip: 'Cat 275 Generator',    customer: 'Metro City Council',status: 'Completed', color: '#6b7280', bg: '#f3f4f6' },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <div>
                          <p className="text-xs font-medium text-gray-800">{r.equip}</p>
                          <p className="text-[11px] text-gray-400">{r.customer}</p>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: r.color, background: r.bg }}>
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
      </div>

      {/* Wave */}
      <div className="relative h-20 overflow-hidden bg-white mt-[-1px]">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full"
          style={{ fill: 'white' }}>
          <path d="M0,0 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" />
        </svg>
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #f8f7ff 0%, white 100%)' }} />
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   METRICS BAR
══════════════════════════════════════════════════════ */
function MetricsBar() {
  return (
    <section className="py-16 px-6 border-y border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {METRICS.map(({ value, label, icon: Icon }, i) => (
            <div key={label} className="reveal flex flex-col items-center text-center p-6 rounded-2xl transition-all hover:bg-gray-50"
              style={{ transitionDelay: `${i * 60}ms` }}>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(79,70,229,0.08)' }}>
                <Icon className="h-5.5 w-5.5" style={{ color: '#4f46e5' }} />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
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
    <section id="features" className="py-28 px-6 bg-white">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
            style={{ background: 'rgba(79,70,229,0.07)', color: '#4f46e5' }}>
            <Zap className="h-3 w-3" /> Everything in one platform
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight" style={{ letterSpacing: '-0.025em' }}>
            Every tool your rental
            <br />
            <span style={{ display: 'inline', background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              business needs
            </span>
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            From the first booking to final invoice — EquipTrack Pro handles every step of your rental workflow.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, tag }, i) => (
            <div key={title}
              className="reveal-scale group relative rounded-2xl border border-gray-100 bg-white p-7 hover:border-indigo-100 hover:shadow-xl transition-all duration-300"
              style={{ transitionDelay: `${i * 60}ms`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(79,70,229,0.04) 0%, transparent 70%)' }} />

              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(79,70,229,0.08)' }}>
                    <Icon className="h-5 w-5" style={{ color: '#4f46e5' }} />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(79,70,229,0.06)', color: '#4f46e5' }}>
                    {tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
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
    <section id="industries" className="py-28 px-6" style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)' }}>
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col lg:flex-row gap-16 items-start">

          {/* Left — sticky heading */}
          <div className="lg:w-80 lg:sticky lg:top-24 reveal-left shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
              style={{ background: 'rgba(79,70,229,0.07)', color: '#4f46e5' }}>
              Industry Coverage
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight" style={{ letterSpacing: '-0.025em' }}>
              Works for
              <br />
              <span style={{ display: 'inline', background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                any rental
              </span>
              <br />
              business
            </h2>
            <p className="text-gray-500 leading-relaxed mb-7">
              Whether you rent cranes or cocktail tables — EquipTrack Pro adapts to your workflow.
            </p>
            <Link href="/register">
              <Button className="font-semibold text-white rounded-xl px-6 h-11 border-0 hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
                Start Free Trial <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Right — industry cards grid */}
          <div className="flex-1 grid sm:grid-cols-2 gap-4">
            {INDUSTRIES.map(({ icon: Icon, label, proof }, i) => (
              <div key={label}
                className="reveal-scale group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-default"
                style={{ transitionDelay: `${i * 70}ms`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

                {/* Accent corner */}
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300"
                    style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(14,165,233,0.08) 100%)', border: '1px solid rgba(79,70,229,0.12)' }}>
                    <Icon className="h-6 w-6" style={{ color: '#4f46e5' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{label}</h3>
                    <p className="text-sm text-gray-500 mb-3">{proof}</p>
                    <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#4f46e5' }}>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Supported use case
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    <section className="py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 reveal">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
            style={{ background: 'rgba(79,70,229,0.07)', color: '#4f46e5' }}>
            Quick Start
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight" style={{ letterSpacing: '-0.025em' }}>
            Up and running in minutes
          </h2>
          <p className="text-gray-500 text-lg">Three simple steps and your team is live.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(({ n, title, desc }, i) => (
            <div key={n} className="reveal-scale relative" style={{ transitionDelay: `${i * 100}ms` }}>
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-8 left-full w-6 border-t-2 border-dashed border-gray-200 z-10" style={{ marginLeft: '0px', width: '24px' }} />
              )}
              <div className="rounded-2xl border border-gray-100 bg-white p-7 hover:shadow-lg transition-all duration-300 h-full"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5 font-mono font-bold text-lg"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: 'white' }}>
                  {n}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════════ */
function Testimonials() {
  return (
    <section className="py-28 px-6" style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-14 reveal">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight" style={{ letterSpacing: '-0.025em' }}>
            Trusted by rental teams worldwide
          </h2>
          <p className="text-gray-500 text-lg">Real results from real businesses using EquipTrack Pro every day.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name}
              className="reveal-scale bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-xl transition-all duration-300"
              style={{ transitionDelay: `${i * 80}ms`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" style={{ color: '#f59e0b' }} />
                ))}
              </div>
              {/* Quote */}
              <p className="text-gray-700 leading-relaxed mb-6 text-[0.9375rem]">"{t.text}"</p>
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' }}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
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
    <section id="pricing" className="py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-14 reveal">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
            style={{ background: 'rgba(79,70,229,0.07)', color: '#4f46e5' }}>
            Pricing
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight" style={{ letterSpacing: '-0.025em' }}>
            Simple, honest pricing
          </h2>
          <p className="text-gray-500 text-lg">Start free for 14 days. No credit card. No surprises.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const rawF = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || {});
            const feats = PLAN_FEATURES[i] || [];
            const isPopular = i === 1;

            return (
              <div key={plan.id}
                className="reveal-scale relative rounded-2xl border p-8 flex flex-col transition-all duration-300 hover:shadow-xl"
                style={{
                  transitionDelay: `${i * 80}ms`,
                  borderColor: isPopular ? '#4f46e5' : '#e5e7eb',
                  background: isPopular ? 'linear-gradient(180deg, #f8f7ff 0%, white 50%)' : 'white',
                  boxShadow: isPopular ? '0 0 0 1px #4f46e5, 0 20px 60px rgba(79,70,229,0.14)' : '0 1px 3px rgba(0,0,0,0.04)',
                  marginTop: isPopular ? '-12px' : '0',
                }}>
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #4338ca)' }}>
                      ✦ Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4f46e5' }}>{plan.name}</p>
                  <div className="flex items-end gap-1.5 mb-2">
                    <span className="text-5xl font-bold text-gray-900" style={{ letterSpacing: '-0.03em' }}>${plan.price_monthly}</span>
                    <span className="text-gray-400 text-sm mb-2">/month</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {!Array.isArray(rawF) ? rawF.label as string : ''}
                  </p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {feats.map((f) => {
                    const text = f
                      .replace('{max_equipment}', String(plan.max_equipment))
                      .replace('{max_users}', String(plan.max_users));
                    return (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: isPopular ? 'rgba(79,70,229,0.1)' : '#f3f4f6' }}>
                          <CheckCircle className="h-3 w-3" style={{ color: isPopular ? '#4f46e5' : '#6b7280' }} />
                        </div>
                        <span className="text-gray-600">{text}</span>
                      </li>
                    );
                  })}
                </ul>

                <Link href="/register" className="block">
                  <Button className={`w-full h-11 font-semibold rounded-xl transition-all ${isPopular ? 'text-white border-0 hover:opacity-90 shadow-lg' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}
                    variant={isPopular ? 'default' : 'outline'}
                    style={isPopular ? { background: 'linear-gradient(135deg, #4f46e5, #4338ca)' } : undefined}>
                    Get started free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8 reveal">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   CTA SECTION
══════════════════════════════════════════════════════ */
function CTA() {
  return (
    <section className="py-28 px-6" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e40af 100%)' }}>
      <div className="max-w-3xl mx-auto text-center reveal">
        {/* Background sparkle */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-6 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5" style={{ letterSpacing: '-0.025em' }}>
            Ready to transform
            <br />
            your rental business?
          </h2>
          <p className="text-lg text-indigo-200 mb-10 max-w-xl mx-auto leading-relaxed">
            Join hundreds of equipment rental companies who use EquipTrack Pro to reduce downtime, eliminate double-bookings, and grow revenue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg"
                className="h-13 px-10 text-base font-bold rounded-xl text-indigo-700 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                style={{ background: 'white', color: '#4338ca' }}>
                Start Free Trial — No Card Needed
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-indigo-300/70 text-sm">14-day free trial · Cancel anytime · No credit card required</p>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' }}>
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">EquipTrack Pro</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
              The all-in-one platform for equipment rental management.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Product</p>
            <ul className="space-y-2.5 text-sm">
              {[['Features', '#features'], ['Pricing', '#pricing'], ['Industries', '#industries']].map(([l, h]) => (
                <li key={l}><a href={h} className="text-gray-500 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Account</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/login"    className="text-gray-500 hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="text-gray-500 hover:text-white transition-colors">Free Trial</Link></li>
            </ul>
          </div>

          {/* Stats */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Platform</p>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" /> 99.9% Uptime</li>
              <li className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> 256-bit Encryption</li>
              <li className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> 40+ Countries</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <span>© {new Date().getFullYear()} EquipTrack Pro. All rights reserved.</span>
          <div className="flex items-center gap-1.5 text-green-500/80">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  useReveal();

  useEffect(() => {
    api.get('/public/pricing')
      .then(({ data }) => { if (data.data?.length) setPlans(data.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <Navbar />
      <Hero />
      <MetricsBar />
      <Features />
      <Industries />
      <HowItWorks />
      <Testimonials />
      <Pricing plans={plans} />
      <CTA />
      <Footer />
    </div>
  );
}
