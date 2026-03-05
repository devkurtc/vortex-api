'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUiStore } from '@/lib/stores/ui-store';

export default function HomePage() {
  const router = useRouter();
  const mode = useUiStore((s) => s.mode);

  useEffect(() => {
    router.replace(mode === 'user' ? '/user' : '/developer');
  }, [mode, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Redirecting...</div>
    </div>
  );
}
