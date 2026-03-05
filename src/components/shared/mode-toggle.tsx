'use client';

import { useRouter } from 'next/navigation';
import { useUiStore } from '@/lib/stores/ui-store';
import type { AppMode } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ModeToggle() {
  const router = useRouter();
  const mode = useUiStore((s) => s.mode);
  const setMode = useUiStore((s) => s.setMode);

  function switchMode(newMode: AppMode) {
    setMode(newMode);
    router.push(newMode === 'developer' ? '/developer' : '/user');
  }

  return (
    <div className="flex items-center rounded-lg border bg-muted p-0.5">
      <button
        onClick={() => switchMode('developer')}
        className={cn(
          'rounded-md px-3 py-1 text-sm font-medium transition-colors',
          mode === 'developer'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Developer
      </button>
      <button
        onClick={() => switchMode('user')}
        className={cn(
          'rounded-md px-3 py-1 text-sm font-medium transition-colors',
          mode === 'user'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        User
      </button>
    </div>
  );
}
