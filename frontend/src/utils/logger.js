/**
 * Logger Utility
 * Only outputs logs in development mode
 * Usage: import logger from '../utils/logger.js';
 *        logger.debug('message', data);
 */

const isDev = import.meta.env.DEV;

/**
 * Creates a tagged logger for a specific module/component
 * @param {string} tag - Module/component name for prefixing logs
 * @returns {Object} Logger with debug, info, warn, error methods
 */
export const createLogger = (tag) => ({
    debug: (...args) => isDev && console.log(`[${tag}]`, ...args),
    info: (...args) => isDev && console.info(`[${tag}]`, ...args),
    warn: (...args) => console.warn(`[${tag}]`, ...args),
    error: (...args) => console.error(`[${tag}]`, ...args),
});

/**
 * Default logger (no tag)
 */
const logger = {
    debug: (...args) => isDev && console.log('[DEBUG]', ...args),
    info: (...args) => isDev && console.info('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
};

export default logger;
