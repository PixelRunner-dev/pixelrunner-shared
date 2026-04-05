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
