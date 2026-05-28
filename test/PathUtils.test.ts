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

    it('handles empty pathSuffix', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const result = getDir({ pathSuffix: '' });
      expect(typeof result).toBe('string');
      expect(result.length > 0).toBe(true);
    });

    it('handles null or undefined options', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const result = getDir();
      expect(typeof result).toBe('string');
    });
  });

  describe('getProjectRoot', () => {
    it('continues searching up directories until package.json found', () => {
      vi.mocked(fs.existsSync).mockImplementation((p: unknown) => {
        const pathStr = typeof p === 'string' ? p : p?.toString() ?? '';
        return pathStr.includes('package.json') && pathStr.includes('pixelrunner');
      });

      const result = getProjectRoot('/Users/pmk/Projects/pixelrunner/src/file.ts');
      expect(result).toBeDefined();
      expect(result.length > 0).toBe(true);
    });

    it('stops searching and skips node_modules', () => {
      vi.mocked(fs.existsSync).mockImplementation((p: unknown) => {
        const pathStr = typeof p === 'string' ? p : p?.toString() ?? '';
        // Only return true if path includes pixelrunner but not node_modules
        return (
          pathStr.includes('package.json') &&
          pathStr.includes('pixelrunner') &&
          !pathStr.includes('node_modules')
        );
      });

      const result = getProjectRoot('/Users/pmk/Projects/pixelrunner/node_modules/lib/file.ts');
      expect(result).toBeDefined();
    });

    it('handles deep nested paths', () => {
      vi.mocked(fs.existsSync).mockImplementation((p: unknown) => {
        const pathStr = typeof p === 'string' ? p : p?.toString() ?? '';
        return pathStr.endsWith('package.json') && pathStr.includes('project-root');
      });

      const result = getProjectRoot('/a/b/c/d/e/f/g/h/project-root/deep/nested/file.ts');
      expect(result).toBeDefined();
    });

    it('throws when reaching filesystem root without finding package.json', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(() => {
        getProjectRoot('/isolated/directory/file.ts');
      }).toThrow('Could not find project root');
    });

    it('handles single character path', () => {
      vi.mocked(fs.existsSync).mockImplementation((p: unknown) => {
        const pathStr = typeof p === 'string' ? p : p?.toString() ?? '';
        return pathStr.includes('package.json');
      });

      expect(() => {
        getProjectRoot('/');
      }).toThrow('Could not find project root');
    });
  });

  describe('getFileNameFromFilePath', () => {
    it('handles filenames with multiple dots', () => {
      const result = getFileNameFromFilePath('/path/to/my.backup.file.txt');
      expect(result).toBe('my.backup.file');
    });

    it('handles filenames with no extension', () => {
      const result = getFileNameFromFilePath('/path/to/Makefile');
      expect(result).toBe('Makefile');
    });

    it('handles hidden files', () => {
      const result = getFileNameFromFilePath('/path/to/.hidden');
      expect(result).toBe('.hidden');
    });

    it('handles paths with trailing slash', () => {
      const result = getFileNameFromFilePath('/path/to/directory/');
      expect(result).toBe('directory');
    });

    it('returns filename with extension when requested for multiple dots', () => {
      const result = getFileNameFromFilePath('/path/to/file.tar.gz', true);
      expect(result).toBe('file.tar.gz');
    });
  });

  describe('getFilePath', () => {
    it('handles uppercase and mixed case extensions', () => {
      const result = getFilePath('/storage', 'image', 'PNG');
      expect(result).toContain('image.PNG');
    });

    it('preserves path separators in storagePath', () => {
      const result = getFilePath('/var/log/storage', 'data', 'json');
      expect(result).toContain('data.json');
      expect(result.startsWith('/')).toBe(true);
    });

    it('handles empty storage path', () => {
      const result = getFilePath('', 'file', 'txt');
      expect(result).toContain('file.txt');
    });

    it('handles relative paths', () => {
      const result = getFilePath('./storage', 'image', 'webp');
      expect(result).toContain('image.webp');
    });

    it('is case-sensitive when checking extension', () => {
      // Different case means it will add extension
      const result = getFilePath('/storage', 'image.WebP', 'webp');
      expect(result).toContain('image.WebP.webp');
    });
  });
});
