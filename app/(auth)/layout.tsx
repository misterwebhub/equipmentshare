import { Package } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Multi-color background orbs */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(0.70 0.28 270), transparent)', transform: 'translate(-30%, -30%)' }} />
      <div className="fixed top-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-12 pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(0.78 0.22 195), transparent)', transform: 'translate(30%, -30%)' }} />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(0.76 0.26 350), transparent)', transform: 'translate(20%, 20%)' }} />
      <div className="fixed bottom-0 left-0 w-[350px] h-[350px] rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(0.76 0.22 155), transparent)', transform: 'translate(-20%, 20%)' }} />

      {/* Rainbow top stripe */}
      <div className="h-1 w-full shrink-0" style={{
        background: 'linear-gradient(90deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195), oklch(0.76 0.22 155), oklch(0.84 0.22 75), oklch(0.76 0.26 350), oklch(0.70 0.28 270))'
      }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, oklch(0.70 0.28 270), oklch(0.78 0.22 195))' }}>
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-foreground">EquipTrack Pro</span>
        </Link>
        <div className="text-xs text-muted-foreground font-mono tracking-wider px-3 py-1 rounded-full border border-border/50">
          SECURE · ENCRYPTED
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
