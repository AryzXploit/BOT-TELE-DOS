import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Attack Profiles Manager
 * Save, load, and manage attack configurations
 */
export class AttackProfilesManager {
    constructor() {
        this.profilesDir = join(__dirname, '../../profiles');
        this.ensureProfilesDir();
    }

    /**
     * Ensure profiles directory exists
     */
    ensureProfilesDir() {
        try {
            if (!existsSync(this.profilesDir)) {
                mkdirSync(this.profilesDir, { recursive: true });
                logger.debug('Created profiles directory');
            }
        } catch (err) {
            logger.error(`Failed to create profiles directory: ${err.message}`);
        }
    }

    /**
     * Save attack profile
     */
    saveProfile(name, config) {
        try {
            const profile = {
                name: name,
                created: new Date().toISOString(),
                config: config
            };

            const filename = `${name.toLowerCase().replace(/\s+/g, '-')}.json`;
            const filepath = join(this.profilesDir, filename);

            writeFileSync(filepath, JSON.stringify(profile, null, 2));
            logger.success(`✅ Profile '${name}' saved!`);
            return true;
        } catch (err) {
            logger.error(`Failed to save profile: ${err.message}`);
            return false;
        }
    }

    /**
     * Load attack profile
     */
    loadProfile(name) {
        try {
            const filename = `${name.toLowerCase().replace(/\s+/g, '-')}.json`;
            const filepath = join(this.profilesDir, filename);

            if (!existsSync(filepath)) {
                logger.error(`Profile '${name}' not found`);
                return null;
            }

            const data = readFileSync(filepath, 'utf-8');
            const profile = JSON.parse(data);
            
            logger.success(`✅ Profile '${name}' loaded!`);
            return profile.config;
        } catch (err) {
            logger.error(`Failed to load profile: ${err.message}`);
            return null;
        }
    }

    /**
     * List all profiles
     */
    listProfiles() {
        try {
            const fs = require('fs');
            const files = fs.readdirSync(this.profilesDir);
            const profiles = files
                .filter(f => f.endsWith('.json'))
                .map(f => {
                    try {
                        const data = readFileSync(join(this.profilesDir, f), 'utf-8');
                        const profile = JSON.parse(data);
                        return {
                            name: profile.name,
                            created: profile.created,
                            config: profile.config
                        };
                    } catch (err) {
                        return null;
                    }
                })
                .filter(p => p !== null);

            return profiles;
        } catch (err) {
            logger.error(`Failed to list profiles: ${err.message}`);
            return [];
        }
    }

    /**
     * Delete profile
     */
    deleteProfile(name) {
        try {
            const fs = require('fs');
            const filename = `${name.toLowerCase().replace(/\s+/g, '-')}.json`;
            const filepath = join(this.profilesDir, filename);

            if (!existsSync(filepath)) {
                logger.error(`Profile '${name}' not found`);
                return false;
            }

            fs.unlinkSync(filepath);
            logger.success(`✅ Profile '${name}' deleted!`);
            return true;
        } catch (err) {
            logger.error(`Failed to delete profile: ${err.message}`);
            return false;
        }
    }
}

/**
 * Predefined Attack Profiles
 */
export const PREDEFINED_PROFILES = {
    'cloudflare-killer': {
        name: 'Cloudflare Killer',
        description: 'Optimized for Cloudflare-protected sites',
        config: {
            method: 'CFB',
            threads: 400,
            duration: 180,
            rpc: 5
        }
    },

    'wordpress-destroyer': {
        name: 'WordPress Destroyer',
        description: 'Specialized for WordPress sites',
        config: {
            method: 'XMLRPC',
            threads: 300,
            duration: 120,
            rpc: 10
        }
    },

    'maximum-power': {
        name: 'Maximum Power',
        description: 'Maximum threads and duration',
        config: {
            method: 'STRESS',
            threads: 1000,
            duration: 300,
            rpc: 20
        }
    },

    'stealth-attack': {
        name: 'Stealth Attack',
        description: 'Low and slow to avoid detection',
        config: {
            method: 'SLOW',
            threads: 50,
            duration: 600,
            rpc: 1
        }
    },

    'quick-strike': {
        name: 'Quick Strike',
        description: 'Fast and intense short attack',
        config: {
            method: 'GET',
            threads: 500,
            duration: 30,
            rpc: 50
        }
    },

    'layer4-power': {
        name: 'Layer 4 Power',
        description: 'Powerful UDP flood',
        config: {
            method: 'UDP',
            threads: 800,
            duration: 120,
            rpc: 1
        }
    },

    'amplification-max': {
        name: 'Amplification Max',
        description: 'DNS amplification attack',
        config: {
            method: 'DNS-AMP',
            threads: 200,
            duration: 180,
            rpc: 1
        }
    },

    'http2-bypass': {
        name: 'HTTP/2 Bypass',
        description: 'HTTP/2 flood with bypass',
        config: {
            method: 'HTTP2-CF',
            threads: 350,
            duration: 150,
            rpc: 8
        }
    },

    'combo-ultimate': {
        name: 'Combo Ultimate',
        description: 'Multiple methods combo attack',
        config: {
            type: 'combo',
            methods: ['GET', 'POST', 'HTTP2', 'STRESS', 'NULL'],
            threads: 600,
            duration: 240,
            rpc: 10
        }
    },

    'smart-auto': {
        name: 'Smart Auto',
        description: 'Auto-detect and use best method',
        config: {
            type: 'smart',
            threads: 400,
            duration: 180,
            rpc: 5
        }
    }
};
