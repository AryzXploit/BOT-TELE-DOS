import os from 'os';
import crypto from 'crypto';
import { licenseManager } from './license-manager.js';
import { logger } from '../utils/logger.js';

/**
 * License Checker - Verify before attacks
 */
export class LicenseChecker {
    constructor() {
        this.hwid = this.generateHWID();
        this.currentLicense = null;
    }

    /**
     * Generate Hardware ID
     */
    generateHWID() {
        const info = {
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            cpus: os.cpus().map(cpu => cpu.model).join(','),
            totalmem: os.totalmem()
        };
        
        const hash = crypto
            .createHash('sha256')
            .update(JSON.stringify(info))
            .digest('hex');
        
        return hash.substring(0, 32).toUpperCase();
    }

    /**
     * Check license before attack
     */
    async checkLicense(licenseKey) {
        if (!licenseKey) {
            throw new Error('❌ License key required! Get your license via Telegram bot.');
        }

        const result = licenseManager.verifyLicense(licenseKey, this.hwid);
        
        if (!result.valid) {
            throw new Error(`❌ License Error: ${result.error}`);
        }

        this.currentLicense = {
            key: licenseKey,
            plan: result.plan,
            expires: result.expires,
            daysRemaining: result.daysRemaining
        };

        logger.success(`✅ License Valid - Plan: ${result.plan}, Days Remaining: ${result.daysRemaining}`);
        
        return result;
    }

    /**
     * Get plan limits
     */
    getPlanLimits(plan) {
        const limits = {
            'free': {
                maxThreads: 50,
                maxDuration: 60,
                methods: ['GET', 'POST', 'UDP', 'TCP'],
                cooldown: 300 // 5 minutes
            },
            'standard': {
                maxThreads: 300,
                maxDuration: 300,
                methods: ['GET', 'POST', 'HEAD', 'SLOW', 'UDP', 'TCP', 'SYN', 'HTTP2', 'HTTP2-POST'],
                cooldown: 60 // 1 minute
            },
            'premium': {
                maxThreads: 1000,
                maxDuration: 600,
                methods: 'all', // All methods available
                cooldown: 0 // No cooldown
            },
            'lifetime': {
                maxThreads: 99999,
                maxDuration: 99999,
                methods: 'all',
                cooldown: 0
            }
        };

        return limits[plan] || limits['free'];
    }

    /**
     * Validate attack parameters
     */
    validateAttack(method, threads, duration) {
        if (!this.currentLicense) {
            throw new Error('❌ No active license. Please verify license first.');
        }

        const limits = this.getPlanLimits(this.currentLicense.plan);

        // Check method availability
        if (limits.methods !== 'all' && !limits.methods.includes(method)) {
            throw new Error(`❌ Method ${method} not available in ${this.currentLicense.plan} plan. Upgrade to use this method.`);
        }

        // Check threads limit
        if (threads > limits.maxThreads) {
            throw new Error(`❌ Max threads for ${this.currentLicense.plan} plan: ${limits.maxThreads}. You requested: ${threads}`);
        }

        // Check duration limit
        if (duration > limits.maxDuration) {
            throw new Error(`❌ Max duration for ${this.currentLicense.plan} plan: ${limits.maxDuration}s. You requested: ${duration}s`);
        }

        return true;
    }

    /**
     * Get license status
     */
    getLicenseStatus() {
        if (!this.currentLicense) {
            return null;
        }

        return {
            ...this.currentLicense,
            hwid: this.hwid,
            limits: this.getPlanLimits(this.currentLicense.plan)
        };
    }

    /**
     * Get HWID
     */
    getHWID() {
        return this.hwid;
    }
}

// Export singleton instance
export const licenseChecker = new LicenseChecker();
