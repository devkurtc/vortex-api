'use client';

import { useState, useEffect } from 'react';
import { CollectionSidebar } from '@/components/developer/collection-sidebar';
import { ModeToggle } from '@/components/shared/mode-toggle';
import { EnvironmentSwitcher } from '@/components/developer/environment-switcher';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Zap, LogOut, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const clearTokens = useAuthStore((s) => s.clearTokens);
  const tokenData = useAuthStore((s) => s.tokenData);
  const [expiry, setExpiry] = useState(0);

  // Compute username from tokenData
  const username = tokenData ? (() => {
    try {
      const payload = tokenData.access_token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.preferred_username || 'unknown';
    } catch {
      return 'unknown';
    }
  })() : 'anonymous';

  // Update expiry countdown every second
  useEffect(() => {
    function updateExpiry() {
      const store = useAuthStore.getState();
      setExpiry(store.getTokenExpiry());
    }
    updateExpiry();
    const interval = setInterval(updateExpiry, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold">VortexAPI</span>
          <ModeToggle />
        </div>
        <div className="flex items-center gap-3">
          <EnvironmentSwitcher />
          <Link href="/audit">
            <Button variant="ghost" size="sm">
              <ScrollText className="mr-1 h-4 w-4" />
              Audit
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{username}</span>
            <span className="text-xs">({expiry}s)</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              clearTokens();
              router.push('/login');
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content: sidebar + request area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 shrink-0">
          <CollectionSidebar />
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
