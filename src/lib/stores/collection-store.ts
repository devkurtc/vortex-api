'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Collection, ApiRequest, CollectionFolder, HttpMethod, AuthConfig, RequestBody } from '@/lib/types';

interface CollectionState {
  collections: Collection[];

  // Actions
  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  removeCollection: (id: string) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;

  // Request operations
  getRequest: (collectionId: string, requestId: string) => ApiRequest | undefined;
  addRequest: (collectionId: string, request: ApiRequest, folderId?: string) => void;
  updateRequest: (collectionId: string, requestId: string, updates: Partial<ApiRequest>) => void;
  removeRequest: (collectionId: string, requestId: string) => void;
  duplicateRequest: (collectionId: string, requestId: string) => ApiRequest | undefined;

  // Folder operations
  addFolder: (collectionId: string, folder: CollectionFolder) => void;
  removeFolder: (collectionId: string, folderId: string) => void;

  // Bulk
  importCollections: (collections: Collection[]) => void;
}

function createBlankRequest(overrides?: Partial<ApiRequest>): ApiRequest {
  return {
    id: crypto.randomUUID(),
    name: 'New Request',
    method: 'GET' as HttpMethod,
    url: '',
    headers: [],
    params: [],
    auth: { type: 'none' } as AuthConfig,
    body: { mode: 'none' } as RequestBody,
    ...overrides,
  };
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      collections: [],

      setCollections: (collections) => set({ collections }),

      addCollection: (collection) =>
        set((s) => ({ collections: [...s.collections, collection] })),

      removeCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),

      updateCollection: (id, updates) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      getRequest: (collectionId, requestId) => {
        const col = get().collections.find((c) => c.id === collectionId);
        return col?.requests.find((r) => r.id === requestId);
      },

      addRequest: (collectionId, request, folderId) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            const newRequests = [...c.requests, request];
            if (folderId) {
              const newFolders = c.folders.map((f) =>
                f.id === folderId
                  ? { ...f, requests: [...f.requests, request.id] }
                  : f
              );
              return { ...c, requests: newRequests, folders: newFolders };
            }
            return { ...c, requests: newRequests };
          }),
        })),

      updateRequest: (collectionId, requestId, updates) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : {
                  ...c,
                  requests: c.requests.map((r) =>
                    r.id === requestId ? { ...r, ...updates } : r
                  ),
                }
          ),
        })),

      removeRequest: (collectionId, requestId) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c;
            return {
              ...c,
              requests: c.requests.filter((r) => r.id !== requestId),
              folders: c.folders.map((f) => ({
                ...f,
                requests: f.requests.filter((id) => id !== requestId),
              })),
            };
          }),
        })),

      duplicateRequest: (collectionId, requestId) => {
        const original = get().getRequest(collectionId, requestId);
        if (!original) return undefined;
        const dup = createBlankRequest({
          ...original,
          id: crypto.randomUUID(),
          name: `${original.name} (Copy)`,
        });
        get().addRequest(collectionId, dup);
        return dup;
      },

      addFolder: (collectionId, folder) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId ? c : { ...c, folders: [...c.folders, folder] }
          ),
        })),

      removeFolder: (collectionId, folderId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : { ...c, folders: c.folders.filter((f) => f.id !== folderId) }
          ),
        })),

      importCollections: (collections) =>
        set((s) => ({
          collections: [...s.collections, ...collections],
        })),
    }),
    { name: 'vortex-collections' }
  )
);

export { createBlankRequest };
