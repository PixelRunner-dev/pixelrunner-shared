/**
 * Copyright (c) 2026-present Pixelrunner (https://pixelrunner.dev)
 * Distributed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
 * International license (CC BY-NC-ND 4.0). To view a copy of this license, visit
 * https://creativecommons.org/licenses/by-nc-nd/4.0/.
 *
 * @copyright Pixelrunner (https://pixelrunner.dev)
 * @license CC-BY-NC-ND-4.0
 */
import { env } from 'node:process';
import { addColors, createLogger, format, transports } from 'winston';
import { getDir } from './utils/PathUtils.js';
const consoleFormat = format.printf(({ level, message, timestamp }) => `${timestamp} [${level}](${env.npm_package_config_project_name}): ${message}`);
export const logger = createLogger({
    level: env.LOG_LEVEL ?? 'info',
    format: format.combine(format.timestamp(), format.label({ label: env.npm_package_config_project_name }), format.json()),
    transports: [
        new transports.File({ filename: getDir({ pathSuffix: './logs/error.log' }), level: 'error' }),
        new transports.File({ filename: getDir({ pathSuffix: './logs/combined.log' }) })
    ]
});
if (process.env.NODE_ENV !== 'production') {
    addColors({ debug: 'cyan' });
    logger.add(new transports.Console({
        format: format.combine(format.label({ label: 'Pixelrunner' }), format.colorize(), format.timestamp(), 
        // format.prettyPrint(),
        format.splat(), consoleFormat)
    }));
}
