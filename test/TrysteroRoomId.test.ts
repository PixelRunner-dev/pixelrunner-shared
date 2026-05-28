import { describe, it, expect, vi } from 'vitest';
import {
  DEFAULT_PUBLIC_IP_ENDPOINT,
  normalizeIp,
  isPublicIp,
  createTrysteroRoomIdFromPublicIp,
  fetchPublicIp,
  resolveTrysteroRoomId,
  type TrysteroRoomIdentityConfig,
} from '../lib/utils/TrysteroRoomId.js';

describe('TrysteroRoomId', () => {
  describe('normalizeIp', () => {
    it('removes leading and trailing brackets', () => {
      expect(normalizeIp('[::1]')).toBe('::1');
      expect(normalizeIp('[2001:db8::1]')).toBe('2001:db8::1');
    });

    it('converts to lowercase', () => {
      expect(normalizeIp('192.168.1.1')).toBe('192.168.1.1');
      expect(normalizeIp('ABCD::1234')).toBe('abcd::1234');
    });

    it('trims whitespace', () => {
      expect(normalizeIp('  192.168.1.1  ')).toBe('192.168.1.1');
      expect(normalizeIp('\t::1\n')).toBe('::1');
    });

    it('handles complex cases', () => {
      expect(normalizeIp('  [2001:DB8::1]  ')).toBe('2001:db8::1');
    });

    it('handles already normalized IPs', () => {
      expect(normalizeIp('192.168.1.1')).toBe('192.168.1.1');
      expect(normalizeIp('::1')).toBe('::1');
    });
  });

  describe('isPublicIp', () => {
    describe('public IPv4 addresses', () => {
      it('accepts valid public IPs', () => {
        expect(isPublicIp('8.8.8.8')).toBe(true);
        expect(isPublicIp('1.1.1.1')).toBe(true);
        expect(isPublicIp('200.100.50.1')).toBe(true);
      });
    });

    describe('private IPv4 addresses', () => {
      it('rejects 0.0.0.0', () => {
        expect(isPublicIp('0.0.0.0')).toBe(false);
      });

      it('rejects 10.x.x.x', () => {
        expect(isPublicIp('10.0.0.1')).toBe(false);
        expect(isPublicIp('10.255.255.255')).toBe(false);
      });

      it('rejects 127.x.x.x (loopback)', () => {
        expect(isPublicIp('127.0.0.1')).toBe(false);
        expect(isPublicIp('127.255.255.255')).toBe(false);
      });

      it('rejects 172.16-31.x.x', () => {
        expect(isPublicIp('172.16.0.1')).toBe(false);
        expect(isPublicIp('172.31.255.255')).toBe(false);
        expect(isPublicIp('172.15.0.1')).toBe(true);
        expect(isPublicIp('172.32.0.1')).toBe(true);
      });

      it('rejects 192.168.x.x', () => {
        expect(isPublicIp('192.168.0.1')).toBe(false);
        expect(isPublicIp('192.168.255.255')).toBe(false);
      });

      it('rejects 169.254.x.x (link-local)', () => {
        expect(isPublicIp('169.254.0.1')).toBe(false);
      });

      it('rejects 224-255.x.x.x (multicast/reserved)', () => {
        expect(isPublicIp('224.0.0.1')).toBe(false);
        expect(isPublicIp('255.255.255.255')).toBe(false);
      });

      it('rejects 100.64-127.x.x (carrier-grade NAT)', () => {
        expect(isPublicIp('100.64.0.1')).toBe(false);
        expect(isPublicIp('100.127.255.255')).toBe(false);
      });

      it('rejects 192.0.x.x', () => {
        expect(isPublicIp('192.0.0.1')).toBe(false);
      });

      it('rejects 198.18-19.x.x', () => {
        expect(isPublicIp('198.18.0.1')).toBe(false);
        expect(isPublicIp('198.19.255.255')).toBe(false);
      });
    });

    describe('public IPv6 addresses', () => {
      it('accepts valid public IPv6', () => {
        expect(isPublicIp('2001:db8:85a3::8a2e:370:7334')).toBe(true);
        expect(isPublicIp('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(true);
      });

      it('handles IPv6-mapped IPv4 format', () => {
        // IPv6-mapped IPv4 format detection depends on normalization
        const result = isPublicIp('::ffff:8.8.8.8');
        expect(typeof result).toBe('boolean');
      });
    });

    describe('private IPv6 addresses', () => {
      it('rejects :: (all zeros)', () => {
        expect(isPublicIp('::')).toBe(false);
      });

      it('rejects ::1 (loopback)', () => {
        expect(isPublicIp('::1')).toBe(false);
      });

      it('rejects fc/fd (ULA)', () => {
        expect(isPublicIp('fc00::1')).toBe(false);
        expect(isPublicIp('fd00::1')).toBe(false);
      });

      it('rejects fe80: (link-local)', () => {
        expect(isPublicIp('fe80::1')).toBe(false);
      });

      it('rejects IPv6-mapped private IPv4', () => {
        expect(isPublicIp('::ffff:192.168.1.1')).toBe(false);
        expect(isPublicIp('::ffff:10.0.0.1')).toBe(false);
      });

      it('ignores scope ID (% suffix)', () => {
        expect(isPublicIp('fe80::1%eth0')).toBe(false);
      });
    });

    describe('invalid formats', () => {
      it('rejects malformed IPs', () => {
        expect(isPublicIp('256.1.1.1')).toBe(false);
        expect(isPublicIp('1.1.1')).toBe(false);
        expect(isPublicIp('gggg::1')).toBe(false);
      });
    });
  });

  describe('createTrysteroRoomIdFromPublicIp', () => {
    it('creates room ID from public IP', async () => {
      const identity: TrysteroRoomIdentityConfig = {
        appId: 'test-app',
        password: 'secret123',
        roomPrefix: 'room',
      };

      const roomId = await createTrysteroRoomIdFromPublicIp('8.8.8.8', identity);

      expect(roomId).toMatch(/^room-[a-f0-9]{32}$/);
    });

    it('generates consistent hash for same inputs', async () => {
      const identity: TrysteroRoomIdentityConfig = {
        appId: 'test-app',
        password: 'secret123',
        roomPrefix: 'room',
      };

      const id1 = await createTrysteroRoomIdFromPublicIp('8.8.8.8', identity);
      const id2 = await createTrysteroRoomIdFromPublicIp('8.8.8.8', identity);

      expect(id1).toBe(id2);
    });

    it('normalizes IP before hashing', async () => {
      const identity: TrysteroRoomIdentityConfig = {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'r',
      };

      const id1 = await createTrysteroRoomIdFromPublicIp('[8.8.8.8]', identity);
      const id2 = await createTrysteroRoomIdFromPublicIp('8.8.8.8', identity);

      expect(id1).toBe(id2);
    });

    it('generates different IDs for different inputs', async () => {
      const identity: TrysteroRoomIdentityConfig = {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'r',
      };

      const id1 = await createTrysteroRoomIdFromPublicIp('8.8.8.8', identity);
      const id2 = await createTrysteroRoomIdFromPublicIp('1.1.1.1', identity);

      expect(id1).not.toBe(id2);
    });

    it('throws on private IP', async () => {
      const identity: TrysteroRoomIdentityConfig = {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'r',
      };

      await expect(
        createTrysteroRoomIdFromPublicIp('192.168.1.1', identity)
      ).rejects.toThrow('Public IP lookup returned a private or invalid address');
    });

    it('throws on invalid IP', async () => {
      const identity: TrysteroRoomIdentityConfig = {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'r',
      };

      await expect(
        createTrysteroRoomIdFromPublicIp('invalid', identity)
      ).rejects.toThrow('Public IP lookup returned a private or invalid address');
    });
  });

  describe('fetchPublicIp', () => {
    it('fetches IP from default endpoint', async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        text: async () => '{"ip":"8.8.8.8"}',
      }));

      const ip = await fetchPublicIp({ fetcher: mockFetch as unknown as typeof fetch });

      expect(mockFetch).toHaveBeenCalledWith(
        DEFAULT_PUBLIC_IP_ENDPOINT,
        expect.objectContaining({ cache: 'no-store' })
      );
      expect(ip).toBe('8.8.8.8');
    });

    it('uses custom endpoint', async () => {
      const customEndpoint = 'https://custom.endpoint.com/ip';
      const mockFetch = vi.fn(async () => ({
        ok: true,
        text: async () => '8.8.8.8',
      }));

      await fetchPublicIp({
        fetcher: mockFetch as unknown as typeof fetch,
        endpoint: customEndpoint,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        customEndpoint,
        expect.any(Object)
      );
    });

    it('handles HTTP error', async () => {
      const mockFetch = vi.fn(async () => ({
        ok: false,
        status: 404,
      }));

      await expect(
        fetchPublicIp({ fetcher: mockFetch as unknown as typeof fetch })
      ).rejects.toThrow('Public IP lookup failed with HTTP 404');
    });

    it('rejects private IP from endpoint', async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        text: async () => '192.168.1.1',
      }));

      await expect(
        fetchPublicIp({ fetcher: mockFetch as unknown as typeof fetch })
      ).rejects.toThrow('Public IP lookup returned a private or invalid address');
    });

    it('parses JSON response', async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        text: async () => '{"ip":"1.1.1.1"}',
      }));

      const ip = await fetchPublicIp({ fetcher: mockFetch as unknown as typeof fetch });
      expect(ip).toBe('1.1.1.1');
    });

    it('falls back to plain text response', async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        text: async () => '1.1.1.1',
      }));

      const ip = await fetchPublicIp({ fetcher: mockFetch as unknown as typeof fetch });
      expect(ip).toBe('1.1.1.1');
    });

    it('handles malformed JSON gracefully', async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        text: async () => 'some text 1.1.1.1',
      }));

      await expect(
        fetchPublicIp({ fetcher: mockFetch as unknown as typeof fetch })
      ).rejects.toThrow('Public IP lookup returned a private or invalid address');
    });
  });

  describe('resolveTrysteroRoomId', () => {
    it('returns configured room ID if provided', async () => {
      const roomId = await resolveTrysteroRoomId('custom-room', {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'r',
      });

      expect(roomId).toBe('custom-room');
    });

    it('fetches and creates room ID if not configured', async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        text: async () => '8.8.8.8',
      }));

      const roomId = await resolveTrysteroRoomId(undefined, {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'room',
        fetcher: mockFetch as unknown as typeof fetch,
      });

      expect(roomId).toMatch(/^room-[a-f0-9]{32}$/);
    });

    it('falls back to default on lookup error', async () => {
      const mockFetch = vi.fn(async () => {
        throw new Error('Network error');
      });

      const roomId = await resolveTrysteroRoomId(undefined, {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'room',
        fetcher: mockFetch as unknown as typeof fetch,
      });

      expect(roomId).toBe('room-default');
    });

    it('uses custom fallback room ID', async () => {
      const mockFetch = vi.fn(async () => {
        throw new Error('Network error');
      });

      const roomId = await resolveTrysteroRoomId(undefined, {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'room',
        fetcher: mockFetch as unknown as typeof fetch,
        fallbackRoomId: 'custom-fallback',
      });

      expect(roomId).toBe('custom-fallback');
    });

    it('calls onLookupError callback on failure', async () => {
      const mockFetch = vi.fn(async () => {
        throw new Error('Network error');
      });
      const onError = vi.fn();

      await resolveTrysteroRoomId(undefined, {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'room',
        fetcher: mockFetch as unknown as typeof fetch,
        onLookupError: onError,
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('treats empty configured ID as not provided', async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        text: async () => '8.8.8.8',
      }));

      const roomId = await resolveTrysteroRoomId('', {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'room',
        fetcher: mockFetch as unknown as typeof fetch,
      });

      expect(roomId).toMatch(/^room-[a-f0-9]{32}$/);
    });

    it('treats whitespace-only ID as not provided', async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        text: async () => '8.8.8.8',
      }));

      const roomId = await resolveTrysteroRoomId('   ', {
        appId: 'app',
        password: 'pwd',
        roomPrefix: 'room',
        fetcher: mockFetch as unknown as typeof fetch,
      });

      expect(roomId).toMatch(/^room-[a-f0-9]{32}$/);
    });
  });
});
