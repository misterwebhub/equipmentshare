import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import ReactQueryProvider from '@/components/react-query-provider';
import { Toaster } from '@/components/ui/sonner';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EquipTrack Pro - Equipment Rental Management',
  description: 'Comprehensive SaaS platform for equipment rental management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className={spaceGrotesk.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                toastOptions={{
                  style: {
                    background: 'oklch(0.10 0.018 265)',
                    border: '1px solid oklch(0.68 0.24 265 / 0.3)',
                    color: 'oklch(0.93 0.02 200)',
                    fontFamily: 'var(--font-space)',
                  },
                }}
              />
            </AuthProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
