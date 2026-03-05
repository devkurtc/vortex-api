import type { Collection, ApiRequest } from '@/lib/types';

/**
 * Pre-loaded VortexLoop collections parsed from the Postman export.
 * These are loaded on first launch if no collections exist in localStorage.
 */

const tokenRequests: ApiRequest[] = [
  {
    id: 'req-admin-jwt',
    name: 'Create a valid admin jwt',
    method: 'POST',
    url: 'https://vltc-oidc.vortexloop.com/auth/realms/master/protocol/openid-connect/token',
    headers: [],
    params: [],
    auth: { type: 'none' },
    body: {
      mode: 'urlencoded',
      urlencoded: [
        { key: 'username', value: 'admin', enabled: true },
        { key: 'password', value: 'adminPass', enabled: true },
        { key: 'grant_type', value: 'password', enabled: true },
        { key: 'client_id', value: 'app-ui', description: 'istio', enabled: true },
      ],
    },
    testScript: `var jsonData = pm.response.json();\npm.globals.set("access_token", jsonData.access_token);\npm.globals.set("refresh_token", jsonData.refresh_token);`,
  },
  {
    id: 'req-user-jwt',
    name: 'Create a valid user jwt',
    method: 'POST',
    url: 'https://vltc-oidc.vortexloop.com/auth/realms/master/protocol/openid-connect/token',
    headers: [],
    params: [],
    auth: { type: 'none' },
    body: {
      mode: 'urlencoded',
      urlencoded: [
        { key: 'username', value: 'vortexloop', enabled: true },
        { key: 'password', value: 'qwe123', enabled: true },
        { key: 'grant_type', value: 'password', enabled: true },
        { key: 'client_id', value: 'app-ui', description: 'istio', enabled: true },
      ],
    },
    testScript: `var jsonData = pm.response.json();\npm.globals.set("access_token", jsonData.access_token);\npm.globals.set("refresh_token", jsonData.refresh_token);`,
  },
  {
    id: 'req-server-jwt',
    name: 'Create a valid server JWT',
    method: 'POST',
    url: 'https://vltc-oidc.vortexloop.com/auth/realms/master/protocol/openid-connect/token',
    headers: [],
    params: [],
    auth: { type: 'none' },
    body: {
      mode: 'urlencoded',
      urlencoded: [
        { key: 'client_secret', value: 'e5672cc9-baad-4691-99a0-d470f5f46cf6', enabled: true },
        { key: 'grant_type', value: 'client_credentials', enabled: true },
        { key: 'client_id', value: 'vltc-site', description: 'istio', enabled: true },
      ],
    },
    testScript: `var jsonData = pm.response.json();\npm.globals.set("access_token", jsonData.access_token);\npm.globals.set("refresh_token", jsonData.refresh_token);`,
  },
  {
    id: 'req-refresh-token',
    name: 'Refresh Token',
    method: 'POST',
    url: 'https://vltc-oidc.vortexloop.com/auth/realms/master/protocol/openid-connect/token',
    headers: [],
    params: [],
    auth: { type: 'none' },
    body: {
      mode: 'urlencoded',
      urlencoded: [
        { key: 'client_id', value: 'vltc-site', enabled: true },
        { key: 'grant_type', value: 'refresh_token', enabled: true },
        { key: 'refresh_token', value: '{{refresh_token}}', enabled: true },
        { key: 'client_secret', value: 'e5672cc9-baad-4691-99a0-d470f5f46cf6', enabled: true },
      ],
    },
  },
];

const timeslotRequests: ApiRequest[] = [
  {
    id: 'req-get-timeslots',
    name: '/timeslots',
    method: 'GET',
    url: '{{sitedomain}}api/timeslots',
    headers: [],
    params: [],
    auth: { type: 'bearer', bearerToken: '{{access_token}}' },
    body: { mode: 'none' },
  },
  {
    id: 'req-get-timeslot',
    name: '/timeslots/123',
    method: 'GET',
    url: '{{sitedomain}}api/timeslots/678521',
    headers: [],
    params: [],
    auth: { type: 'bearer', bearerToken: '{{access_token}}' },
    body: { mode: 'none' },
  },
  {
    id: 'req-delete-timeslot',
    name: '/timeslots/123',
    method: 'DELETE',
    url: '{{sitedomain}}api/timeslots/1007',
    headers: [],
    params: [],
    auth: { type: 'bearer', bearerToken: '{{access_token}}' },
    body: { mode: 'none' },
  },
  {
    id: 'req-put-timeslot',
    name: '/timeslots/123',
    method: 'PUT',
    url: '{{sitedomain}}api/timeslots/1007',
    headers: [],
    params: [],
    auth: { type: 'bearer', bearerToken: '{{access_token}}' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        relayGroupId: '2',
        id: '1007',
        timeFrom: '2021-05-06T09:25:00.000Z',
        timeTo: '2021-05-06T09:36:00.000Z',
        state: 1,
        ownerId: '4',
        ownerFriendlyName: 'Crt02-Test01',
        title: 'Crt02-Test01',
        description: 'Crt02-Test01',
        type: 'external',
      }, null, 2),
    },
  },
];

const apiKeyTimeslotRequests: ApiRequest[] = [
  {
    id: 'req-get-timeslots-apikey',
    name: '/timeslots with API-Key',
    method: 'GET',
    url: '{{sitedomain}}api/timeslots',
    headers: [],
    params: [],
    auth: { type: 'apikey', apiKeyHeader: 'X-API-KEY', apiKeyValue: 'cb1fc005-5502-473e-bc04-7d3f2c3ea6a5' },
    body: { mode: 'none' },
  },
  {
    id: 'req-delete-timeslot-apikey',
    name: '/timeslots/123 [X-API-KEY]',
    method: 'DELETE',
    url: '{{sitedomain}}api/timeslots/123',
    headers: [],
    params: [],
    auth: { type: 'bearer', bearerToken: '{{access_token}}' },
    body: { mode: 'none' },
  },
  {
    id: 'req-put-timeslot-apikey',
    name: '/timeslots/123 [X-API-Key]',
    method: 'PUT',
    url: '{{sitedomain}}api/timeslots/123321',
    headers: [],
    params: [],
    auth: { type: 'apikey', apiKeyHeader: 'X-API-KEY', apiKeyValue: 'cb1fc005-5502-473e-bc04-7d3f2c3ea6a5' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        relayGroupId: '4',
        id: '123321',
        timeFrom: '2021-02-25T13:01:00.000Z',
        timeTo: '2021-02-25T14:31:00.000Z',
        state: 1,
        ownerId: '12345',
        ownerFriendlyName: 'Kurt',
        title: 'Kurt Sample Title',
        description: 'Kurt Sample Description',
        type: 'external',
        createdOn: '2020-12-21T14:01:00.000Z',
      }, null, 2),
    },
  },
];

const relayRequests: ApiRequest[] = [
  {
    id: 'req-get-relays',
    name: '/relays',
    method: 'GET',
    url: '{{sitedomain}}api/relays',
    headers: [],
    params: [],
    auth: { type: 'bearer', bearerToken: '{{access_token}}' },
    body: { mode: 'none' },
  },
  {
    id: 'req-put-relay',
    name: '/relays/5',
    method: 'PUT',
    url: '{{sitedomain}}api/relays/5',
    headers: [],
    params: [],
    auth: { type: 'bearer', bearerToken: '{{access_token}}' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({ id: 6, state: 1 }, null, 2),
    },
  },
];

const settingsRequests: ApiRequest[] = [
  {
    id: 'req-get-settings',
    name: '/settings',
    method: 'GET',
    url: '{{sitedomain}}api/settings',
    headers: [],
    params: [],
    auth: { type: 'bearer', bearerToken: '{{access_token}}' },
    body: { mode: 'none' },
  },
  {
    id: 'req-delete-settings',
    name: '/settings',
    method: 'DELETE',
    url: '{{sitedomain}}api/settings',
    headers: [],
    params: [],
    auth: { type: 'bearer', bearerToken: '{{access_token}}' },
    body: { mode: 'none' },
  },
  {
    id: 'req-patch-settings',
    name: '/settings',
    method: 'PATCH',
    url: '{{sitedomain}}api/settings',
    headers: [],
    params: [],
    auth: { type: 'bearer', bearerToken: '{{access_token}}' },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        advanced: {
          loglevel: 'warning',
          keepAgendaHistoryForDays: 15,
          runCleanJobEveryDays: 1,
          timeslotMaxRangeInHours: 6,
          antiflickerPeriodInMinutes: 7,
        },
        latitude: 35.917973,
        longitude: 14.409943,
        relayGroupDelayOff: 1,
        relayGroups: {
          '1': { mode: 'external', sunlightOffset: 25 },
          '2': { mode: 'external', sunlightOffset: 25 },
          '3': { mode: 'external', sunlightOffset: 25 },
          '4': { mode: 'external', sunlightOffset: 25 },
        },
        sunlightAware: false,
      }, null, 2),
    },
  },
];

const allRequests = [
  ...tokenRequests,
  ...timeslotRequests,
  ...apiKeyTimeslotRequests,
  ...relayRequests,
  ...settingsRequests,
];

export const SEED_COLLECTIONS: Collection[] = [
  {
    id: 'col-vortexloop',
    name: 'VortexLoop',
    folders: [
      {
        id: 'folder-token',
        name: 'Token Management',
        requests: tokenRequests.map((r) => r.id),
      },
      {
        id: 'folder-timeslots',
        name: 'TimeSlots',
        requests: timeslotRequests.map((r) => r.id),
      },
      {
        id: 'folder-timeslots-apikey',
        name: 'TimeSlots with API Key',
        requests: apiKeyTimeslotRequests.map((r) => r.id),
      },
      {
        id: 'folder-relays',
        name: 'Relays',
        requests: relayRequests.map((r) => r.id),
      },
      {
        id: 'folder-settings',
        name: 'Settings',
        requests: settingsRequests.map((r) => r.id),
      },
    ],
    requests: allRequests,
  },
];
