'use client';

import { useUiStore } from '@/lib/stores/ui-store';
import { METHOD_COLORS } from '@/lib/constants';
import type { HttpMethod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function RequestTabs() {
  const tabs = useUiStore((s) => s.tabs);
  const activeTab = useUiStore((s) => s.activeTab);
  const setActiveTab = useUiStore((s) => s.setActiveTab);
  const closeTab = useUiStore((s) => s.closeTab);

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b bg-muted/30 px-1">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            'group flex cursor-pointer items-center gap-1.5 rounded-t-md px-3 py-1.5 text-sm',
            activeTab === tab.id
              ? 'bg-background border-b-2 border-b-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className={cn('text-[10px] font-bold uppercase', METHOD_COLORS[tab.method as HttpMethod])}>
            {tab.method.slice(0, 3)}
          </span>
          <span className="max-w-[120px] truncate">{tab.name}</span>
          <button
            className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
