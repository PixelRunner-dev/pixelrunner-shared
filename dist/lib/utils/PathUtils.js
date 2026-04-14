/**
 * Copyright (c) 2026-present Pixelrunner (https://pixelrunner.dev)
 * Distributed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
 * International license (CC BY-NC-ND 4.0). To view a copy of this license, visit
 * https://creativecommons.org/licenses/by-nc-nd/4.0/.
 *
 * @copyright Pixelrunner (https://pixelrunner.dev)
 * @license CC-BY-NC-ND-4.0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export function getProjectRoot(filePath) {
    let currentDir = path.dirname(path.resolve(filePath));
    while (currentDir !== '/') {
        if (!currentDir.includes('node_modules') && fs.existsSync(path.resolve(currentDir, 'package.json'))) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }
    throw new Error('Could not find project root');
}
/**
 * Returns a directory path relative to the project root.
 * If pathSuffix is provided, it will be appended to the directory path.
 * @param {Object} [options] - options object
 * @param {string} [options.pathSuffix] - path suffix to append to the directory path
 * @returns {string} - directory path
 */
export function getDir({ pathSuffix = '' } = {}) {
    const __filename = fileURLToPath(import.meta.url);
    const projectRoot = getProjectRoot(__filename);
    return path.join(projectRoot, pathSuffix);
}
/**
 * Returns a file path by joining the storage path, the file name and the file extension.
 * The file extension defaults to 'webp'.
 * @param {string} storagePath - the storage path
 * @param {string} fileName - the file name
 * @param {string} [extension='webp'] - the file extension
 * @returns {string} - the file path
 */
export function getFilePath(storagePath, fileName, extension = 'webp') {
    if (fileName.endsWith('.' + extension))
        return path.resolve(storagePath, fileName);
    return path.resolve(storagePath, fileName + '.' + extension);
}
/**
 * Returns the file name from a file path.
 * If withExtension is true, it will include the file extension in the returned string.
 * @param {string} filePath - the file path
 * @param {boolean} [withExtension=false] - whether to include the file extension
 * @returns {string} - the file name
 */
export function getFileNameFromFilePath(filePath, withExtension = false) {
    const fileNameWithExtension = path.basename(filePath);
    if (withExtension)
        return fileNameWithExtension;
    return path.parse(fileNameWithExtension).name;
}
