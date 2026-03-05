import type { Environment } from '@/lib/types';

export const SEED_ENVIRONMENTS: Environment[] = [
  {
    id: 'env-vortexloop',
    name: 'Vortexloop',
    variables: [
      { key: 'domain', value: 'https://vltc-oidc.vortexloop.com/', enabled: true },
      { key: 'admin_user', value: 'admin', enabled: true },
      { key: 'admin_pass', value: 'adminPass', enabled: true },
      { key: 'client', value: 'app-ui', enabled: true },
      { key: 'realm', value: 'master', enabled: true },
      { key: 'sitedomain', value: 'https://vltc.vortexloop.com/', enabled: true },
    ],
  },
  {
    id: 'env-vortexloop-local',
    name: 'Vortexloop localhost:3000',
    variables: [
      { key: 'domain', value: 'https://vltc-oidc.vortexloop.com/', enabled: true },
      { key: 'admin_user', value: 'admin', enabled: true },
      { key: 'admin_pass', value: 'adminPass', enabled: true },
      { key: 'client', value: 'app-ui', enabled: true },
      { key: 'realm', value: 'master', enabled: true },
      { key: 'sitedomain', value: 'http://localhost:3000/', enabled: true },
    ],
  },
];
