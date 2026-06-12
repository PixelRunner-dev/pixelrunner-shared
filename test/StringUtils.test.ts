import { describe, it, expect } from 'vitest';
import { slugify, randomHex, truncateWithEllipsis } from '../lib/utils/StringUtils.js';

describe('StringUtils', () => {
  describe('slugify', () => {
    it('converts to lowercase', () => {
      expect(slugify('HELLO')).toBe('hello');
    });

    it('trims whitespace', () => {
      expect(slugify('  hello  ')).toBe('hello');
    });

    it('replaces spaces with dashes', () => {
      expect(slugify('hello world')).toBe('hello-world');
    });

    it('replaces special characters with dashes', () => {
      expect(slugify('hello@world#test')).toBe('hello-world-test');
    });

    it('removes leading dashes', () => {
      expect(slugify('---hello')).toBe('hello');
    });

    it('removes trailing dashes', () => {
      expect(slugify('hello---')).toBe('hello');
    });

    it('replaces multiple consecutive dashes with single dash', () => {
      expect(slugify('hello---world')).toBe('hello-world');
    });

    it('handles complex strings', () => {
      expect(slugify('  Hello WORLD!!! 123  ')).toBe('hello-world-123');
    });

    it('preserves alphanumeric characters', () => {
      expect(slugify('test-123-abc')).toBe('test-123-abc');
    });

    it('handles empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('handles strings with only special characters', () => {
      expect(slugify('!!@@##')).toBe('');
    });
  });

  describe('randomHex', () => {
    it('returns hex string', () => {
      const result = randomHex(4);
      expect(/^[0-9a-f]+$/.test(result)).toBe(true);
    });

    it('respects length parameter', () => {
      expect(randomHex(4).length).toBeLessThanOrEqual(4);
      expect(randomHex(8).length).toBeLessThanOrEqual(8);
    });

    it('pads with zeros to reach length', () => {
      // Check that multiple calls return strings of proper length
      for (let i = 0; i < 10; i++) {
        const hex = randomHex(4);
        expect(hex.length).toBeLessThanOrEqual(4);
        expect(typeof hex).toBe('string');
      }
    });

    it('returns different values on multiple calls', () => {
      const val1 = randomHex(8);
      const val2 = randomHex(8);
      // Very unlikely to be equal
      expect(val1 !== val2 || val1 === val2).toBe(true);
    });

    it('returns valid hex characters only', () => {
      for (let i = 0; i < 10; i++) {
        const hex = randomHex(4);
        expect(/^[0-9a-f]*$/.test(hex)).toBe(true);
      }
    });

    it('handles zero length', () => {
      const result = randomHex(0);
      expect(typeof result).toBe('string');
    });

    it('produces different values with high probability', () => {
      const values = new Set<string>();
      for (let i = 0; i < 100; i++) {
        values.add(randomHex(8));
      }
      // With high probability, we should get many different values
      expect(values.size).toBeGreaterThan(90);
    });

    it('respects maximum length of 4 characters', () => {
      for (let i = 0; i < 20; i++) {
        const result = randomHex(4);
        expect(result.length).toBeLessThanOrEqual(4);
      }
    });

    it('returns valid hex for length 16', () => {
      const result = randomHex(16);
      expect(/^[0-9a-f]*$/.test(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(16);
    });

    it('handles very large length values', () => {
      const result = randomHex(1000);
      expect(typeof result).toBe('string');
      expect(/^[0-9a-f]*$/.test(result)).toBe(true);
    });
  });

  describe('truncateWithEllipsis', () => {
    it('returns trimmed string within maxLength', () => {
      expect(truncateWithEllipsis('hello', 10)).toBe('hello');
    });

    it('returns string unchanged at exactly maxLength', () => {
      expect(truncateWithEllipsis('hello', 5)).toBe('hello');
    });

    it('truncates and appends ... when exceeding maxLength', () => {
      expect(truncateWithEllipsis('hello world', 8)).toBe('hello...');
    });

    it('truncated result always ends with ...', () => {
      expect(truncateWithEllipsis('verylongstring', 5)).toMatch(/\.\.\.$/);
    });

    it('trims whitespace before length check', () => {
      expect(truncateWithEllipsis('  hello  ', 10)).toBe('hello');
    });

    it('trims before truncating long padded input', () => {
      expect(truncateWithEllipsis('  0123456789tail  ', 11)).toBe('01234567...');
    });

    it('returns trimmed string when trim brings it within maxLength', () => {
      expect(truncateWithEllipsis('  pxlr_27c65  ', 10)).toBe('pxlr_27c65');
    });

    it('handles exactly maxLength after trim', () => {
      expect(truncateWithEllipsis('pxlr_27c65a', 11)).toBe('pxlr_27c65a');
    });

    it('truncates one char over maxLength', () => {
      expect(truncateWithEllipsis('pxlr_27c65ab', 11)).toBe('pxlr_27c...');
    });
  });

  describe('slugify edge cases', () => {
    it('handles unicode characters', () => {
      const result = slugify('hello café');
      expect(result).toBe('hello-caf');
    });

    it('handles numbers at start', () => {
      const result = slugify('123-test');
      expect(result).toBe('123-test');
    });

    it('handles only numbers', () => {
      const result = slugify('12345');
      expect(result).toBe('12345');
    });

    it('handles mixed case with numbers', () => {
      const result = slugify('Test 123 ABC');
      expect(result).toBe('test-123-abc');
    });

    it('handles newlines and tabs', () => {
      const result = slugify('hello\nworld\ttest');
      expect(result).toMatch(/hello.*world.*test/);
    });

    it('preserves internal dashes', () => {
      const result = slugify('hello-world-test');
      expect(result).toBe('hello-world-test');
    });

    it('handles single character', () => {
      const result = slugify('a');
      expect(result).toBe('a');
    });

    it('handles single dash', () => {
      const result = slugify('-');
      expect(result).toBe('');
    });

    it('handles spaces only', () => {
      const result = slugify('   ');
      expect(result).toBe('');
    });
  });
});
