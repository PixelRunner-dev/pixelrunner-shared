/**
 * Copyright (c) 2026-present Pixelrunner (https://pixelrunner.dev)
 * Distributed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
 * International license (CC BY-NC-ND 4.0). To view a copy of this license, visit
 * https://creativecommons.org/licenses/by-nc-nd/4.0/.
 *
 * @copyright Pixelrunner (https://pixelrunner.dev)
 * @license CC-BY-NC-ND-4.0
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Returns a directory path relative to the project root.
 * If pathSuffix is provided, it will be appended to the directory path.
 * @param {Object} [options] - options object
 * @param {string} [options.pathSuffix] - path suffix to append to the directory path
 * @returns {string} - directory path
 */
export function getDir({ pathSuffix = '' }: { pathSuffix?: string; } = {}): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.join(__dirname, '../../', pathSuffix);
}

/**
 * Returns a file path by joining the storage path, the file name and the file extension.
 * The file extension defaults to 'webp'.
 * @param {string} storagePath - the storage path
 * @param {string} fileName - the file name
 * @param {string} [extension='webp'] - the file extension
 * @returns {string} - the file path
 */
export function getFilePath(storagePath: string, fileName: string, extension: string = 'webp'): string {
  if (fileName.endsWith('.' + extension)) return path.resolve(storagePath, fileName);
  return path.resolve(storagePath, fileName + '.' + extension);
}

/**
 * Returns the file name from a file path.
 * If withExtension is true, it will include the file extension in the returned string.
 * @param {string} filePath - the file path
 * @param {boolean} [withExtension=false] - whether to include the file extension
 * @returns {string} - the file name
 */
export function getFileNameFromFilePath(filePath: string, withExtension: boolean = false): string {
  const fileNameWithExtension = path.basename(filePath);
  if (withExtension) return fileNameWithExtension;

  return path.parse(fileNameWithExtension).name;
}
