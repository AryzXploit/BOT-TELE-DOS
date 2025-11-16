import { logger } from './logger.js';

/**
 * IP Rotation System
 * Rotate IP addresses untuk bypass rate limiting & detection
 */
export class IPRotator {
    constructor() {
        this.currentIndex = 0;
        this.ipPool = [];
        this.generateIPPool();
    }

    /**
     * Generate pool of random IPs
     */
    generateIPPool(count = 10000) {
        logger.info('🔄 Generating IP pool...');
        
        this.ipPool = [];
        
        // Generate random IPs
        for (let i = 0; i < count; i++) {
            this.ipPool.push(this.generateRandomIP());
        }
        
        // Add some real-looking IPs from common ranges
        this.ipPool.push(...this.generateRealisticIPs());
        
        // Shuffle pool
        this.shuffleArray(this.ipPool);
        
        logger.success(`✅ Generated ${this.ipPool.length} IPs for rotation`);
    }

    /**
     * Get next IP from pool
     */
    getNextIP() {
        const ip = this.ipPool[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.ipPool.length;
        return ip;
    }

    /**
     * Get random IP from pool
     */
    getRandomIP() {
        return this.ipPool[Math.floor(Math.random() * this.ipPool.length)];
    }

    /**
     * Get multiple IPs
     */
    getMultipleIPs(count = 5) {
        const ips = [];
        for (let i = 0; i < count; i++) {
            ips.push(this.getRandomIP());
        }
        return ips.join(', ');
    }

    /**
     * Generate random IP
     */
    generateRandomIP() {
        // Avoid private ranges
        const firstOctet = Math.floor(Math.random() * 223) + 1;
        
        // Skip private ranges
        if (firstOctet === 10 || firstOctet === 172 || firstOctet === 192) {
            return this.generateRandomIP();
        }
        
        return `${firstOctet}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    }

    /**
     * Generate realistic IPs from common ISP ranges
     */
    generateRealisticIPs() {
        const ips = [];
        
        // Common ISP ranges
        const ranges = [
            { start: [8, 8, 0, 0], end: [8, 8, 255, 255] }, // Google
            { start: [1, 1, 0, 0], end: [1, 1, 255, 255] }, // Cloudflare
            { start: [104, 16, 0, 0], end: [104, 31, 255, 255] }, // Cloudflare
            { start: [108, 162, 0, 0], end: [108, 162, 255, 255] }, // Cloudflare
            { start: [23, 0, 0, 0], end: [23, 255, 255, 255] }, // Akamai
            { start: [151, 101, 0, 0], end: [151, 101, 255, 255] }, // Cloudflare
            { start: [185, 0, 0, 0], end: [185, 255, 255, 255] }, // Various ISPs
            { start: [91, 0, 0, 0], end: [91, 255, 255, 255] }, // Various ISPs
        ];
        
        for (const range of ranges) {
            for (let i = 0; i < 100; i++) {
                const ip = this.generateIPInRange(range.start, range.end);
                ips.push(ip);
            }
        }
        
        return ips;
    }

    /**
     * Generate IP in specific range
     */
    generateIPInRange(start, end) {
        const octets = [];
        
        for (let i = 0; i < 4; i++) {
            const min = start[i];
            const max = end[i];
            octets.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        
        return octets.join('.');
    }

    /**
     * Shuffle array
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Get IP rotation headers
     */
    getRotationHeaders() {
        const ip = this.getNextIP();
        const forwardedIPs = this.getMultipleIPs(3);
        
        return {
            'X-Forwarded-For': forwardedIPs,
            'X-Real-IP': ip,
            'X-Originating-IP': ip,
            'X-Client-IP': ip,
            'X-Remote-IP': ip,
            'X-Remote-Addr': ip,
            'True-Client-IP': ip,
            'CF-Connecting-IP': ip,
            'X-ProxyUser-Ip': ip,
            'X-Original-Forwarded-For': forwardedIPs,
            'Forwarded': `for=${ip}`,
            'Via': `1.1 ${ip}`
        };
    }

    /**
     * Get random country code
     */
    getRandomCountry() {
        const countries = [
            'US', 'GB', 'DE', 'FR', 'JP', 'CA', 'AU', 'NL', 'SE', 'NO', 
            'DK', 'FI', 'IT', 'ES', 'BR', 'IN', 'CN', 'KR', 'SG', 'HK'
        ];
        return countries[Math.floor(Math.random() * countries.length)];
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            totalIPs: this.ipPool.length,
            currentIndex: this.currentIndex,
            rotationsPerformed: Math.floor(this.currentIndex / this.ipPool.length)
        };
    }
}

// Global IP rotator instance
export const globalIPRotator = new IPRotator();
