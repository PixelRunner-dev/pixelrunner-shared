import { vi } from 'vitest';

export const mockWinston = {
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    log: vi.fn(),
  })),
  format: {
    combine: vi.fn((...args: unknown[]) => args),
    timestamp: vi.fn(),
    json: vi.fn(),
    printf: vi.fn((_fn: (info: unknown) => string) => _fn),
    label: vi.fn(),
    colorize: vi.fn(),
    splat: vi.fn(),
    prettyPrint: vi.fn(),
  },
  transports: {
    Console: vi.fn(),
    File: vi.fn(),
  },
  addColors: vi.fn(),
};
