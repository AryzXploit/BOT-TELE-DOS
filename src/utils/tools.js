import { randomBytes } from 'crypto';
import { REQUESTS_SENT, BYTES_SENT } from './counter.js';

/**
 * Utility tools for various operations
 */
export class Tools {
    /**
     * Convert bytes to human readable format
     */
    static humanBytes(bytes, binary = false, precision = 2) {
        const MULTIPLES = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        
        if (bytes === 0) return '0 B';
        
        const base = binary ? 1024 : 1000;
        const multiple = Math.floor(Math.log(bytes) / Math.log(base));
        const value = bytes / Math.pow(base, multiple);
        const suffix = MULTIPLES[multiple].replace('B', binary ? 'iB' : 'B');
        
        return `${value.toFixed(precision)} ${suffix}`;
    }

    /**
     * Format number to human readable format (k, m, g, etc.)
     */
    static humanFormat(num, precision = 2) {
        const suffixes = ['', 'k', 'm', 'g', 't', 'p'];
        
        if (num < 1000) return num.toString();
        
        const exp = Math.floor(Math.log(num) / Math.log(1000));
        return `${(num / Math.pow(1000, exp)).toFixed(precision)}${suffixes[exp]}`;
    }

    /**
     * Generate random IPv4 address
     */
    static randomIPv4() {
        return Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');
    }

    /**
     * Generate random string
     */
    static randomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate random integer between min and max
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Random bytes generator
     */
    static randomBytesBuffer(size) {
        return randomBytes(size);
    }

    /**
     * Get random element from array
     */
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Send data and track statistics
     */
    static send(socket, data) {
        try {
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
            socket.write(buffer);
            BYTES_SENT.add(buffer.length);
            REQUESTS_SENT.add(1);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Send datagram and track statistics
     */
    static sendTo(socket, data, port, address) {
        try {
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
            socket.send(buffer, 0, buffer.length, port, address);
            BYTES_SENT.add(buffer.length);
            REQUESTS_SENT.add(1);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Safe close socket
     */
    static safeClose(socket) {
        try {
            if (socket && !socket.destroyed) {
                socket.destroy();
            }
        } catch (error) {
            // Silent fail
        }
    }

    /**
     * Sleep/delay function
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate spoofed IP headers
     */
    static generateSpoofHeaders(target) {
        const spoofIP = this.randomIPv4();
        return {
            'X-Forwarded-Proto': 'Http',
            'X-Forwarded-Host': `${target}, 1.1.1.1`,
            'Via': spoofIP,
            'Client-IP': spoofIP,
            'X-Forwarded-For': spoofIP,
            'Real-IP': spoofIP
        };
    }
}
