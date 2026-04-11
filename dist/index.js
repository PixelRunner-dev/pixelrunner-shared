/**
 * Copyright (c) 2026-present Pixelrunner (https://pixelrunner.dev)
 * Distributed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
 * International license (CC BY-NC-ND 4.0). To view a copy of this license, visit
 * https://creativecommons.org/licenses/by-nc-nd/4.0/.
 *
 * @copyright Pixelrunner (https://pixelrunner.dev)
 * @license CC-BY-NC-ND-4.0
 */
// Re-export classes and utilities
export { ChildManager, cm } from './lib/ChildManager.js';
export { logger } from './lib/Logger.js';
// Re-export utility functions
export { getDir, getFilePath, getFileNameFromFilePath } from './lib/utils/PathUtils.js';
export { slugify } from './lib/utils/StringUtils.js';
