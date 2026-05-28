import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'node:fs';
import { getFileNameFromFilePath, getFilePath, getDir, getProjectRoot } from '../lib/utils/PathUtils.js';

vi.mock('node:fs');

describe('PathUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFileNameFromFilePath', () => {
    it('returns filename without extension', () => {
      const result = getFileNameFromFilePath('/path/to/myfile.txt');
      expect(result).toBe('myfile');
    });

    it('returns filename with extension when requested', () => {
      const result = getFileNameFromFilePath('/path/to/myfile.txt', true);
      expect(result).toBe('myfile.txt');
    });

    it('handles nested paths correctly', () => {
      const result = getFileNameFromFilePath('/very/long/path/to/file.webp');
      expect(result).toBe('file');
    });
  });

  describe('getFilePath', () => {
    it('appends extension if not present', () => {
      const result = getFilePath('/storage', 'image', 'webp');
      expect(result).toContain('image.webp');
    });

    it('does not duplicate extension', () => {
      const result = getFilePath('/storage', 'image.webp', 'webp');
      expect(result).toContain('image.webp');
      expect(result).not.toContain('image.webp.webp');
    });

    it('defaults to webp extension', () => {
      const result = getFilePath('/storage', 'image');
      expect(result).toContain('image.webp');
    });

    it('uses custom extensions', () => {
      const result = getFilePath('/storage', 'file', 'png');
      expect(result).toContain('file.png');
    });
  });

  describe('getProjectRoot', () => {
    it('finds project root with package.json', () => {
      vi.mocked(fs.existsSync).mockImplementation((p: string | Buffer) => {
        const pathStr = typeof p === 'string' ? p : p.toString();
        return pathStr.includes('package.json');
      });

      const result = getProjectRoot(__filename);
      expect(result).toBeDefined();
      expect(result.length > 0).toBe(true);
    });

    it('throws when no package.json found', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(() => {
        getProjectRoot('/some/isolated/path/file.ts');
      }).toThrow('Could not find project root');
    });

    it('stops at package.json and does not continue past filesystem root', () => {
      let callCount = 0;
      vi.mocked(fs.existsSync).mockImplementation((p: string | Buffer) => {
        callCount++;
        const pathStr = typeof p === 'string' ? p : p.toString();
        return pathStr.endsWith('package.json') && pathStr.includes('pixelrunner');
      });

      const result = getProjectRoot(__filename);
      expect(result).toBeDefined();
      expect(callCount).toBeGreaterThan(0);
    });
  });

  describe('getDir', () => {
    it('returns directory path without suffix', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const result = getDir();
      expect(typeof result).toBe('string');
      expect(result.length > 0).toBe(true);
    });

    it('appends pathSuffix to directory path', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const result = getDir({ pathSuffix: '/logs' });
      expect(result).toContain('logs');
    });
  });
});
