import type { Metadata } from 'next';
import LandingClient from './_landing/LandingClient';

/* ══════════════════════════════════════════════════════
   SEO METADATA — exported from server component so
   Next.js writes proper <head> tags for Google + social
══════════════════════════════════════════════════════ */
export const metadata: Metadata = {
  title: 'Equipment Rental Management Software | EquipTrack Pro',
  description:
    'Manage equipment rentals, fleet tracking & inventory bookings in one platform. Conflict-free scheduling, automated billing & reports. Start your 14-day free trial.',
  keywords: [
    'equipment rental management software', 'fleet tracking software',
    'inventory booking system', 'rental management system', 'equipment tracking',
    'fleet management', 'booking software', 'rental business software',
    'equipment inventory management', 'maintenance scheduling', 'rental billing',
    'construction equipment rental software', 'heavy equipment rental software',
  ],
  authors: [{ name: 'EquipTrack Pro' }],
  creator: 'EquipTrack Pro',
  publisher: 'EquipTrack Pro',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://equiptrackpro.com',
    siteName: 'EquipTrack Pro',
    title: 'Equipment Rental Management Software | EquipTrack Pro',
    description:
      'Manage equipment rentals, fleet tracking & inventory bookings in one platform. Conflict-free scheduling, automated billing & reports. Start free today.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EquipTrack Pro Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Equipment Rental Management Software | EquipTrack Pro',
    description: 'Manage equipment rentals, fleet tracking & inventory bookings in one platform. 14-day free trial, no card required.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://equiptrackpro.com' },
  category: 'Business Software',
};

export default function LandingPage() {
  return <LandingClient />;
}
