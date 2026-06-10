import type { Metadata } from 'next';
import LandingClient from './_landing/LandingClient';

/* ══════════════════════════════════════════════════════
   SEO METADATA — exported from server component so
   Next.js writes proper <head> tags for Google + social
══════════════════════════════════════════════════════ */
export const metadata: Metadata = {
  title: 'EquipTrack Pro — Equipment Rental Management Software',
  description:
    'The #1 SaaS platform for equipment rental businesses. Manage inventory, bookings, maintenance, billing, and team access in one place. Start your 14-day free trial today.',
  keywords: [
    'equipment rental software', 'rental management system', 'equipment tracking',
    'fleet management', 'booking software', 'rental business software',
    'equipment inventory management', 'maintenance scheduling', 'rental billing',
    'construction equipment rental', 'heavy equipment rental software',
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
    title: 'EquipTrack Pro — Equipment Rental Management Software',
    description:
      'The #1 SaaS platform for equipment rental businesses. Manage inventory, bookings, maintenance, billing, and team access in one place. Start free today.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EquipTrack Pro Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EquipTrack Pro — Equipment Rental Management Software',
    description: 'Manage your entire rental fleet in one place. Bookings, inventory, maintenance, billing. Start free today.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://equiptrackpro.com' },
  category: 'Business Software',
};

export default function LandingPage() {
  return <LandingClient />;
}
