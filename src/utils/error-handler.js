import { logger } from './logger.js';

/**
 * Error Handler Utilities
 * Provides safe wrappers for attack methods to prevent crashes
 */

/**
 * Wrap async start method with error handling
 */
export function safeStart(startFn, methodName = 'Attack') {
    return async function() {
        try {
            await startFn.call(this);
        } catch (err) {
            logger.error(`${methodName} error: ${err.message}`);
            logger.debug(`Stack: ${err.stack}`);
            this.active = false;
        }
    };
}

/**
 * Wrap attack iteration with error handling
 */
export function safeAttack(attackFn, methodName = 'Attack') {
    return async function() {
        try {
            return await attackFn.call(this);
        } catch (err) {
            logger.debug(`${methodName} iteration error: ${err.message}`);
            return Promise.resolve();
        }
    };
}

/**
 * Safe promise wrapper that never rejects
 */
export function safePromise(promise, fallbackValue = null) {
    return promise.catch(err => {
        logger.debug(`Promise error: ${err.message}`);
        return fallbackValue;
    });
}

/**
 * Wrap socket operations with error handling
 */
export function safeSocketOp(fn, errorMsg = 'Socket operation failed') {
    try {
        return fn();
    } catch (err) {
        logger.debug(`${errorMsg}: ${err.message}`);
        return false;
    }
}

/**
 * Safe interval/timeout cleanup
 */
export function safeClearInterval(interval) {
    try {
        if (interval) {
            clearInterval(interval);
        }
    } catch (err) {
        logger.debug(`Error clearing interval: ${err.message}`);
    }
}

export function safeClearTimeout(timeout) {
    try {
        if (timeout) {
            clearTimeout(timeout);
        }
    } catch (err) {
        logger.debug(`Error clearing timeout: ${err.message}`);
    }
}
