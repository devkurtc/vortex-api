'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppMode, RequestTab, ApiResponse, HistoryEntry } from '@/lib/types';

interface UiState {
  mode: AppMode;
  activeTab: string | null; // active request tab ID
  tabs: RequestTab[];
  responses: Record<string, ApiResponse>; // keyed by tab ID
  history: HistoryEntry[];
  sidebarCollapsed: boolean;
  variablesPanelOpen: boolean;

  // Actions
  setMode: (mode: AppMode) => void;
  openTab: (tab: RequestTab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<RequestTab>) => void;
  setResponse: (tabId: string, response: ApiResponse) => void;
  clearResponse: (tabId: string) => void;
  addHistoryEntry: (entry: HistoryEntry) => void;
  clearHistory: () => void;
  toggleSidebar: () => void;
  toggleVariablesPanel: () => void;
  setVariablesPanelOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      mode: 'developer',
      activeTab: null,
      tabs: [],
      responses: {},
      history: [],
      sidebarCollapsed: false,
      variablesPanelOpen: false,

      setMode: (mode) => set({ mode }),

      openTab: (tab) => {
        const existing = get().tabs.find((t) => t.requestId === tab.requestId);
        if (existing) {
          set({ activeTab: existing.id });
          return;
        }
        set((s) => ({
          tabs: [...s.tabs, tab],
          activeTab: tab.id,
        }));
      },

      closeTab: (tabId) =>
        set((s) => {
          const newTabs = s.tabs.filter((t) => t.id !== tabId);
          const { [tabId]: _, ...newResponses } = s.responses;
          let newActiveTab = s.activeTab;
          if (s.activeTab === tabId) {
            const idx = s.tabs.findIndex((t) => t.id === tabId);
            newActiveTab = newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? null;
          }
          return { tabs: newTabs, activeTab: newActiveTab, responses: newResponses };
        }),

      setActiveTab: (tabId) => set({ activeTab: tabId }),

      updateTab: (tabId, updates) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t)),
        })),

      setResponse: (tabId, response) =>
        set((s) => ({ responses: { ...s.responses, [tabId]: response } })),

      clearResponse: (tabId) =>
        set((s) => {
          const { [tabId]: _, ...rest } = s.responses;
          return { responses: rest };
        }),

      addHistoryEntry: (entry) =>
        set((s) => ({
          history: [entry, ...s.history].slice(0, 100), // keep last 100
        })),

      clearHistory: () => set({ history: [] }),

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      toggleVariablesPanel: () => set((s) => ({ variablesPanelOpen: !s.variablesPanelOpen })),

      setVariablesPanelOpen: (open) => set({ variablesPanelOpen: open }),
    }),
    {
      name: 'vortex-ui',
      partialize: (state) => ({
        mode: state.mode,
        tabs: state.tabs,
        activeTab: state.activeTab,
        sidebarCollapsed: state.sidebarCollapsed,
        variablesPanelOpen: state.variablesPanelOpen,
      }),
    }
  )
);
