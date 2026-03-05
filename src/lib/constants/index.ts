import type { HttpMethod } from '@/lib/types';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-green-500',
  POST: 'text-yellow-500',
  PUT: 'text-blue-500',
  PATCH: 'text-purple-500',
  DELETE: 'text-red-500',
  HEAD: 'text-gray-500',
  OPTIONS: 'text-gray-400',
};

export const METHOD_BG_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-green-500/10 text-green-600 border-green-500/20',
  POST: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  PUT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  PATCH: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
  HEAD: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  OPTIONS: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export const STATUS_COLORS: Record<string, string> = {
  '2xx': 'text-green-500',
  '3xx': 'text-blue-500',
  '4xx': 'text-yellow-500',
  '5xx': 'text-red-500',
};

export function getStatusColor(status: number): string {
  if (status < 300) return STATUS_COLORS['2xx'];
  if (status < 400) return STATUS_COLORS['3xx'];
  if (status < 500) return STATUS_COLORS['4xx'];
  return STATUS_COLORS['5xx'];
}

// VortexLoop-specific
export const KEYCLOAK_TOKEN_URL = 'https://vltc-oidc.vortexloop.com/auth/realms/master/protocol/openid-connect/token';
export const KEYCLOAK_CLIENT_ID = 'app-ui';

export const COURTS: { id: string; name: string; relays: number[]; bulbs: string[] }[] = [
  { id: '1', name: 'Court 01', relays: [1, 2, 3], bulbs: ['11', '12', '13'] },
  { id: '2', name: 'Court 02', relays: [4, 5, 6], bulbs: ['21', '22', '23'] },
  { id: '3', name: 'Court 03', relays: [7, 8, 9], bulbs: ['31', '32', '33'] },
  { id: '4', name: 'Court 04', relays: [10, 11, 12], bulbs: ['41', '42', '43'] },
];

export const TOKEN_REFRESH_INTERVAL = 10_000; // 10s check interval
export const TOKEN_REFRESH_THRESHOLD = 15; // refresh if <15s remaining
