'use client';

import { useEffect } from 'react';
import { useCollectionStore } from '@/lib/stores/collection-store';
import { useEnvironmentStore } from '@/lib/stores/environment-store';
import { SEED_COLLECTIONS } from '@/data/seed-collections';
import { SEED_ENVIRONMENTS } from '@/data/seed-environments';

/**
 * Initializes stores with seed data on first launch.
 * Runs once — if collections already exist in localStorage, does nothing.
 */
export function StoreInitializer() {
  const collections = useCollectionStore((s) => s.collections);
  const setCollections = useCollectionStore((s) => s.setCollections);
  const environments = useEnvironmentStore((s) => s.environments);
  const setEnvironments = useEnvironmentStore((s) => s.setEnvironments);
  const setActiveEnvironment = useEnvironmentStore((s) => s.setActiveEnvironment);

  useEffect(() => {
    if (collections.length === 0) {
      setCollections(SEED_COLLECTIONS);
    }
  }, [collections.length, setCollections]);

  useEffect(() => {
    if (environments.length === 0) {
      setEnvironments(SEED_ENVIRONMENTS);
      setActiveEnvironment(SEED_ENVIRONMENTS[0].id);
    }
  }, [environments.length, setEnvironments, setActiveEnvironment]);

  return null;
}
