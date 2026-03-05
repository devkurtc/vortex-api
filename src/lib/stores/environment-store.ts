'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Environment, EnvironmentVariable } from '@/lib/types';

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  globalVariables: Record<string, string>;

  // Computed
  getActiveEnvironment: () => Environment | undefined;
  resolveVariable: (key: string) => string | undefined;
  getAllVariables: () => Record<string, string>;

  // Actions
  setEnvironments: (envs: Environment[]) => void;
  addEnvironment: (env: Environment) => void;
  removeEnvironment: (id: string) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  setActiveEnvironment: (id: string | null) => void;
  setEnvironmentVariable: (envId: string, key: string, value: string) => void;

  // Global variables (like Postman's pm.globals)
  setGlobalVariable: (key: string, value: string) => void;
  removeGlobalVariable: (key: string) => void;
  clearGlobalVariables: () => void;
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set, get) => ({
      environments: [],
      activeEnvironmentId: null,
      globalVariables: {},

      getActiveEnvironment: () => {
        const { environments, activeEnvironmentId } = get();
        return environments.find((e) => e.id === activeEnvironmentId);
      },

      resolveVariable: (key: string) => {
        // Globals take precedence over environment variables
        const { globalVariables } = get();
        if (key in globalVariables) return globalVariables[key];

        const env = get().getActiveEnvironment();
        if (!env) return undefined;
        const variable = env.variables.find((v) => v.key === key && v.enabled);
        return variable?.value;
      },

      getAllVariables: () => {
        const env = get().getActiveEnvironment();
        const envVars: Record<string, string> = {};
        if (env) {
          for (const v of env.variables) {
            if (v.enabled) envVars[v.key] = v.value;
          }
        }
        // Globals override environment
        return { ...envVars, ...get().globalVariables };
      },

      setEnvironments: (envs) => set({ environments: envs }),

      addEnvironment: (env) =>
        set((s) => ({ environments: [...s.environments, env] })),

      removeEnvironment: (id) =>
        set((s) => ({
          environments: s.environments.filter((e) => e.id !== id),
          activeEnvironmentId: s.activeEnvironmentId === id ? null : s.activeEnvironmentId,
        })),

      updateEnvironment: (id, updates) =>
        set((s) => ({
          environments: s.environments.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

      setEnvironmentVariable: (envId, key, value) =>
        set((s) => ({
          environments: s.environments.map((e) => {
            if (e.id !== envId) return e;
            const existing = e.variables.findIndex((v) => v.key === key);
            const newVars = [...e.variables];
            if (existing >= 0) {
              newVars[existing] = { ...newVars[existing], value };
            } else {
              newVars.push({ key, value, enabled: true });
            }
            return { ...e, variables: newVars };
          }),
        })),

      setGlobalVariable: (key, value) =>
        set((s) => ({
          globalVariables: { ...s.globalVariables, [key]: value },
        })),

      removeGlobalVariable: (key) =>
        set((s) => {
          const { [key]: _, ...rest } = s.globalVariables;
          return { globalVariables: rest };
        }),

      clearGlobalVariables: () => set({ globalVariables: {} }),
    }),
    { name: 'vortex-environments' }
  )
);
