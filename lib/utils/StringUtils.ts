/**
 * Copyright (c) 2026-present Pixelrunner (https://pixelrunner.dev)
 * Distributed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
 * International license (CC BY-NC-ND 4.0). To view a copy of this license, visit
 * https://creativecommons.org/licenses/by-nc-nd/4.0/.
 *
 * @copyright Pixelrunner (https://pixelrunner.dev)
 * @license CC-BY-NC-ND-4.0
 */

/**
 * Returns a slugified version of the input string.
 * The slug is created by lowercasing the string, trimming it,
 * replacing non-alphanumeric characters with dashes, removing
 * leading and trailing dashes, and replacing multiple dashes
 * with a single dash.
 * @param {string} input - the input string to slugify
 * @returns {string} - the slugified string
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Returns a random generated hex. Optionally limited in provided length.
 * WARNING: This function is not safe for cryptographic usage.
 * @param {number} length length of returning hex
 * @returns {string} the random hex
 */
export function randomHex(length: number): string {
  return Math.floor(Math.random() * 0x10000).toString(16).padStart(length, '0');
}

export function truncateWithEllipsis(input: string, maxLength: number): string {
  const trimmed = input.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 3)}...`;
}
