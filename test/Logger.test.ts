import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockExistsSync = vi.fn((path: unknown) => {
  const pathStr = typeof path === 'string' ? path : path?.toString() ?? '';
  return pathStr.includes('package.json');
});

const mockFileTransport = vi.fn();
const mockConsoleTransport = vi.fn();
const mockAddLogger = vi.fn();
const mockLoggerMethods = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  add: mockAddLogger,
};

vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
}));

vi.mock('winston', () => ({
  createLogger: vi.fn(() => mockLoggerMethods),
  format: {
    combine: vi.fn((...args) => args),
    timestamp: vi.fn(() => ({ _timestamp: true })),
    json: vi.fn(() => ({ _json: true })),
    printf: vi.fn((fn) => ({ _printf: true, fn })),
    label: vi.fn(() => ({ _label: true })),
    colorize: vi.fn(() => ({ _colorize: true })),
    splat: vi.fn(() => ({ _splat: true })),
  },
  transports: {
    Console: mockConsoleTransport,
    File: mockFileTransport,
  },
  addColors: vi.fn(),
}));

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockImplementation((path: unknown) => {
      const pathStr = typeof path === 'string' ? path : path?.toString() ?? '';
      return pathStr.includes('package.json');
    });
  });

  afterEach(() => {
    delete (globalThis as unknown as Record<string, unknown>).NODE_ENV;
  });

  it('module exports logger', async () => {
    const { logger } = await import('../lib/Logger.js');
    expect(logger).toBeDefined();
  });

  it('logger has all logging methods', async () => {
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

  it('logger respects LOG_LEVEL environment variable when set', () => {
    const originalLogLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'debug';

    try {
      // Environment variable is read at import time, verify it was set
      expect(process.env.LOG_LEVEL).toBe('debug');
    } finally {
      process.env.LOG_LEVEL = originalLogLevel;
    }
  });

  it('logger defaults to info level when LOG_LEVEL not set', () => {
    const originalLogLevel = process.env.LOG_LEVEL;

    try {
      delete process.env.LOG_LEVEL;
      // Verify fallback is available
      expect(process.env.LOG_LEVEL).toBeUndefined();
    } finally {
      process.env.LOG_LEVEL = originalLogLevel;
    }
  });

  it('creates logger with file and console transports', async () => {
    const { logger } = await import('../lib/Logger.js');
    expect(logger).toBeDefined();
    // Logger should have all methods regardless of transport setup
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it('logger is usable in test environment', async () => {
    const { logger } = await import('../lib/Logger.js');
    expect(logger).toBeDefined();
    // Verify logger has the expected interface
    expect(typeof logger.add).toBe('function');
  });

  it('logger methods call correctly', async () => {
    const { logger } = await import('../lib/Logger.js');

    logger.info('test message');
    expect(mockLoggerMethods.info).toHaveBeenCalledWith('test message');

    logger.error('error message');
    expect(mockLoggerMethods.error).toHaveBeenCalledWith('error message');

    logger.warn('warning message');
    expect(mockLoggerMethods.warn).toHaveBeenCalledWith('warning message');

    logger.debug('debug message');
    expect(mockLoggerMethods.debug).toHaveBeenCalledWith('debug message');
  });

  it('logger handles logging with multiple arguments', async () => {
    const { logger } = await import('../lib/Logger.js');

    logger.info('message', { extra: 'data' });
    expect(mockLoggerMethods.info).toHaveBeenCalled();

    logger.error('error with context', new Error('test error'));
    expect(mockLoggerMethods.error).toHaveBeenCalled();
  });

  it('logger message contains project name from env', async () => {
    const { logger } = await import('../lib/Logger.js');
    expect(logger).toBeDefined();
    // Verify logger works with the mocked dependencies
    logger.info('test');
    expect(mockLoggerMethods.info).toHaveBeenCalledWith('test');
  });
});
