export const DEFAULT_PUBLIC_IP_ENDPOINT = 'https://api64.ipify.org?format=json';
export const DEFAULT_PUBLIC_IP_TIMEOUT_MS = 3000;

type FetchLike = typeof fetch;

export interface TrysteroRoomIdentityConfig {
  appId: string;
  password: string;
  roomPrefix: string;
}

export interface ResolveTrysteroRoomIdOptions extends Partial<TrysteroRoomIdentityConfig> {
  fetcher?: FetchLike;
  endpoint?: string;
  timeoutMs?: number;
  fallbackRoomId?: string;
  onLookupError?: (error: unknown) => void;
}

function fallbackRoomId(roomPrefix: string, fallback?: string): string {
  return fallback || `${roomPrefix}-default`;
}

export function normalizeIp(ip: string): string {
  return ip.trim().replace(/^\[/, '').replace(/\]$/, '').toLowerCase();
}

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return null;
  }

  const bytes = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return Number.NaN;
    }

    return Number(part);
  });

  return bytes.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255) ? bytes : null;
}

function isPublicIpv4(ip: string): boolean {
  const bytes = parseIpv4(ip);
  if (!bytes) {
    return false;
  }

  const first = bytes[0]!;
  const second = bytes[1]!;

  return !(
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 0) ||
    (first === 198 && (second === 18 || second === 19))
  );
}

function isPublicIpv6(ip: string): boolean {
  const normalizedIp = ip.split('%')[0] ?? '';
  if (!normalizedIp.includes(':') || !/^[0-9a-f:]+$/i.test(normalizedIp)) {
    return false;
  }

  if (normalizedIp.startsWith('::ffff:')) {
    return isPublicIpv4(normalizedIp.slice('::ffff:'.length));
  }

  return !(
    normalizedIp === '::' ||
    normalizedIp === '::1' ||
    normalizedIp.startsWith('fc') ||
    normalizedIp.startsWith('fd') ||
    normalizedIp.startsWith('fe80:')
  );
}

export function isPublicIp(ip: string): boolean {
  const normalizedIp = normalizeIp(ip);
  return isPublicIpv4(normalizedIp) || isPublicIpv6(normalizedIp);
}

async function sha256Hex(input: string): Promise<string> {
  const buffer = new Uint8Array(
    await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  );

  return Array.from(buffer)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

function assertIdentityConfig(
  options: Partial<TrysteroRoomIdentityConfig>
): TrysteroRoomIdentityConfig {
  if (!options.appId?.trim()) {
    throw new Error('Trystero room ID requires appId');
  }
  if (!options.password?.trim()) {
    throw new Error('Trystero room ID requires password');
  }
  if (!options.roomPrefix?.trim()) {
    throw new Error('Trystero room ID requires roomPrefix');
  }

  return {
    appId: options.appId,
    password: options.password,
    roomPrefix: options.roomPrefix
  };
}

export async function createTrysteroRoomIdFromPublicIp(
  publicIp: string,
  identity: TrysteroRoomIdentityConfig
): Promise<string> {
  const normalizedIp = normalizeIp(publicIp);
  if (!isPublicIp(normalizedIp)) {
    throw new Error('Public IP lookup returned a private or invalid address');
  }

  const roomHash = await sha256Hex(`${identity.appId}:${identity.password}:${normalizedIp}`);
  return `${identity.roomPrefix}-${roomHash.slice(0, 32)}`;
}

function readIpFromResponse(body: string): string {
  try {
    const parsed = JSON.parse(body) as { ip?: unknown };
    if (typeof parsed.ip === 'string') {
      return parsed.ip;
    }
  } catch {
    // Plain text IP endpoints are supported as a fallback.
  }

  return body;
}

export async function fetchPublicIp(options: ResolveTrysteroRoomIdOptions = {}): Promise<string> {
  const fetcher = options.fetcher ?? fetch;
  const endpoint = options.endpoint ?? DEFAULT_PUBLIC_IP_ENDPOINT;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_PUBLIC_IP_TIMEOUT_MS
  );

  try {
    const response = await fetcher(endpoint, {
      cache: 'no-store',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Public IP lookup failed with HTTP ${response.status}`);
    }

    const publicIp = normalizeIp(readIpFromResponse(await response.text()));
    if (!isPublicIp(publicIp)) {
      throw new Error('Public IP lookup returned a private or invalid address');
    }

    return publicIp;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveTrysteroRoomId(
  configuredRoomId?: string,
  options: ResolveTrysteroRoomIdOptions = {}
): Promise<string> {
  const identity = assertIdentityConfig(options);
  if (configuredRoomId?.trim()) {
    return configuredRoomId;
  }

  try {
    const publicIp = await fetchPublicIp(options);
    return await createTrysteroRoomIdFromPublicIp(publicIp, identity);
  } catch (error) {
    options.onLookupError?.(error);
    return fallbackRoomId(identity.roomPrefix, options.fallbackRoomId);
  }
}
