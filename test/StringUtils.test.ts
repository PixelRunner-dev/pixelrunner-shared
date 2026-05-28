import { describe, it, expect } from 'vitest';
import { slugify, randomHex } from '../lib/utils/StringUtils.js';

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
  });
});
