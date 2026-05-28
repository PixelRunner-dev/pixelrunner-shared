import { vi } from 'vitest';

export const mockFs = {
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(() => ''),
  statSync: vi.fn(() => ({ isDirectory: () => false })),
};
