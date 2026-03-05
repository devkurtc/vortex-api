'use client';

import { create } from 'zustand';

export interface ConsoleEntry {
  id: string;
  timestamp: string;
  type: 'script-set' | 'script-error' | 'info';
  message: string;
  detail?: string;
}

interface ConsoleState {
  entries: ConsoleEntry[];
  addEntry: (entry: Omit<ConsoleEntry, 'id' | 'timestamp'>) => void;
  addEntries: (entries: Omit<ConsoleEntry, 'id' | 'timestamp'>[]) => void;
  clear: () => void;
}

let nextId = 0;

function makeEntry(partial: Omit<ConsoleEntry, 'id' | 'timestamp'>): ConsoleEntry {
  return {
    ...partial,
    id: String(++nextId),
    timestamp: new Date().toISOString(),
  };
}

export const useConsoleStore = create<ConsoleState>()((set) => ({
  entries: [],

  addEntry: (entry) =>
    set((s) => ({
      entries: [...s.entries, makeEntry(entry)].slice(-500),
    })),

  addEntries: (entries) =>
    set((s) => ({
      entries: [...s.entries, ...entries.map(makeEntry)].slice(-500),
    })),

  clear: () => set({ entries: [] }),
}));
