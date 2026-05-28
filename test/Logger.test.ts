import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockExistsSync = vi.fn((path: string | Buffer) => {
  const pathStr = typeof path === 'string' ? path : path.toString();
  return pathStr.includes('package.json');
});

vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
}));

vi.mock('winston', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    add: vi.fn(),
  })),
  format: {
    combine: vi.fn(() => ({
      _isCombined: true
    })),
    timestamp: vi.fn(() => ({ _timestamp: true })),
    json: vi.fn(() => ({ _json: true })),
    printf: vi.fn(() => ({ _printf: true })),
    label: vi.fn(() => ({ _label: true })),
    colorize: vi.fn(() => ({ _colorize: true })),
    splat: vi.fn(() => ({ _splat: true })),
  },
  transports: {
    Console: vi.fn(),
    File: vi.fn(),
  },
  addColors: vi.fn(),
}));

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockImplementation((path: string | Buffer) => {
      const pathStr = typeof path === 'string' ? path : path.toString();
      return pathStr.includes('package.json');
    });
  });

  it('module exports logger', async () => {
    const { logger } = await import('../lib/Logger.js');
    expect(logger).toBeDefined();
  });

  it('logger has logging methods', async () => {
    const { logger } = await import('../lib/Logger.js');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('logger has add method for transports', async () => {
    const { logger } = await import('../lib/Logger.js');
    expect(typeof logger.add).toBe('function');
  });
});
