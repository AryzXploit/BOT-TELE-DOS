import { readFileSync, writeFileSync, existsSync } from 'fs';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * License Manager - Manage user licenses
 */
export class LicenseManager {
    constructor(configPath = './licenses.json', secretKey = null) {
        this.configPath = configPath;
        this.secretKey = secretKey || process.env.LICENSE_SECRET || this.generateSecretKey();
        this.licenses = this.loadLicenses();
    }

    /**
     * Generate secret key for encryption
     */
    generateSecretKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Load licenses from file
     */
    loadLicenses() {
        try {
            if (existsSync(this.configPath)) {
                const data = readFileSync(this.configPath, 'utf-8');
                const decrypted = this.decrypt(data);
                return JSON.parse(decrypted);
            }
        } catch (error) {
            logger.warning('Could not load licenses, starting fresh');
        }
        return {
            users: {},
            keys: {},
            metadata: {
                created: Date.now(),
                version: '1.0.0'
            }
        };
    }

    /**
     * Save licenses to file (encrypted)
     */
    saveLicenses() {
        try {
            const data = JSON.stringify(this.licenses, null, 2);
            const encrypted = this.encrypt(data);
            writeFileSync(this.configPath, encrypted, 'utf-8');
            return true;
        } catch (error) {
            logger.error('Failed to save licenses:', error);
            return false;
        }
    }

    /**
     * Encrypt data
     */
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const key = crypto.scryptSync(this.secretKey, 'salt', 32);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt data
     */
    decrypt(text) {
        const [ivHex, encryptedHex] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = crypto.scryptSync(this.secretKey, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    /**
     * Generate license key
     */
    generateLicenseKey(userId, duration = 30, plan = 'standard') {
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');
        const rawKey = `${userId}-${timestamp}-${random}-${plan}`;
        
        // Create checksum
        const checksum = crypto
            .createHash('sha256')
            .update(rawKey + this.secretKey)
            .digest('hex')
            .substring(0, 8);
        
        // Format: XXXX-XXXX-XXXX-XXXX-XXXX
        const keyParts = `${checksum}${random}`.match(/.{1,4}/g);
        const licenseKey = keyParts.slice(0, 5).join('-').toUpperCase();
        
        // Store license
        const expiryDate = timestamp + (duration * 24 * 60 * 60 * 1000);
        this.licenses.keys[licenseKey] = {
            userId: userId,
            plan: plan,
            created: timestamp,
            expires: expiryDate,
            active: true,
            hwid: null,
            usage: {
                attacks: 0,
                lastUsed: null
            }
        };
        
        // Update user
        if (!this.licenses.users[userId]) {
            this.licenses.users[userId] = {
                userId: userId,
                licenses: [],
                totalPurchases: 0,
                registered: timestamp
            };
        }
        
        this.licenses.users[userId].licenses.push(licenseKey);
        this.licenses.users[userId].totalPurchases++;
        
        this.saveLicenses();
        
        return licenseKey;
    }

    /**
     * Activate license
     */
    activateLicense(licenseKey, userId, hwid) {
        const license = this.licenses.keys[licenseKey];
        
        if (!license) {
            return { success: false, error: 'Invalid license key' };
        }
        
        if (!license.active) {
            return { success: false, error: 'License is deactivated' };
        }
        
        if (license.expires < Date.now()) {
            return { success: false, error: 'License has expired' };
        }
        
        if (license.userId !== userId) {
            return { success: false, error: 'License belongs to different user' };
        }
        
        // Bind to HWID if not already bound
        if (!license.hwid) {
            license.hwid = hwid;
            this.saveLicenses();
        } else if (license.hwid !== hwid) {
            return { success: false, error: 'License already bound to different device' };
        }
        
        const daysRemaining = Math.ceil((license.expires - Date.now()) / (24 * 60 * 60 * 1000));
        
        return {
            success: true,
            plan: license.plan,
            expires: license.expires,
            daysRemaining: daysRemaining
        };
    }

    /**
     * Verify license
     */
    verifyLicense(licenseKey, hwid = null) {
        const license = this.licenses.keys[licenseKey];
        
        if (!license) {
            return { valid: false, error: 'Invalid license key' };
        }
        
        if (!license.active) {
            return { valid: false, error: 'License is deactivated' };
        }
        
        if (license.expires < Date.now()) {
            return { valid: false, error: 'License has expired' };
        }
        
        if (hwid && license.hwid && license.hwid !== hwid) {
            return { valid: false, error: 'Device mismatch' };
        }
        
        // Update usage
        license.usage.lastUsed = Date.now();
        license.usage.attacks++;
        this.saveLicenses();
        
        const daysRemaining = Math.ceil((license.expires - Date.now()) / (24 * 60 * 60 * 1000));
        
        return {
            valid: true,
            plan: license.plan,
            expires: license.expires,
            daysRemaining: daysRemaining,
            usage: license.usage
        };
    }

    /**
     * Extend license
     */
    extendLicense(licenseKey, additionalDays) {
        const license = this.licenses.keys[licenseKey];
        
        if (!license) {
            return { success: false, error: 'Invalid license key' };
        }
        
        license.expires += (additionalDays * 24 * 60 * 60 * 1000);
        this.saveLicenses();
        
        return { success: true, newExpiry: license.expires };
    }

    /**
     * Deactivate license
     */
    deactivateLicense(licenseKey) {
        const license = this.licenses.keys[licenseKey];
        
        if (!license) {
            return { success: false, error: 'Invalid license key' };
        }
        
        license.active = false;
        this.saveLicenses();
        
        return { success: true };
    }

    /**
     * Reset HWID
     */
    resetHWID(licenseKey) {
        const license = this.licenses.keys[licenseKey];
        
        if (!license) {
            return { success: false, error: 'Invalid license key' };
        }
        
        license.hwid = null;
        this.saveLicenses();
        
        return { success: true };
    }

    /**
     * Get user licenses
     */
    getUserLicenses(userId) {
        const user = this.licenses.users[userId];
        
        if (!user) {
            return [];
        }
        
        return user.licenses.map(key => {
            const license = this.licenses.keys[key];
            return {
                key: key,
                plan: license.plan,
                expires: license.expires,
                active: license.active,
                bound: !!license.hwid,
                usage: license.usage
            };
        });
    }

    /**
     * Get license info
     */
    getLicenseInfo(licenseKey) {
        const license = this.licenses.keys[licenseKey];
        
        if (!license) {
            return null;
        }
        
        const daysRemaining = Math.ceil((license.expires - Date.now()) / (24 * 60 * 60 * 1000));
        
        return {
            plan: license.plan,
            created: license.created,
            expires: license.expires,
            daysRemaining: daysRemaining,
            active: license.active,
            bound: !!license.hwid,
            usage: license.usage
        };
    }

    /**
     * Get stats
     */
    getStats() {
        const totalLicenses = Object.keys(this.licenses.keys).length;
        const activeLicenses = Object.values(this.licenses.keys).filter(l => l.active && l.expires > Date.now()).length;
        const totalUsers = Object.keys(this.licenses.users).length;
        
        const planCounts = {};
        Object.values(this.licenses.keys).forEach(license => {
            planCounts[license.plan] = (planCounts[license.plan] || 0) + 1;
        });
        
        return {
            totalLicenses,
            activeLicenses,
            totalUsers,
            planCounts
        };
    }
}

// Export singleton instance
export const licenseManager = new LicenseManager();
