/**
 * Universal Stats Tracker
 * Tracks stats untuk semua attack methods
 */

export class StatsTracker {
    constructor() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalBytes: 0,
            totalPackets: 0
        };
        this.startTime = Date.now();
    }

    addRequest(success = true, bytes = 0) {
        this.stats.totalRequests++;
        this.stats.totalPackets++;
        this.stats.totalBytes += bytes;
        
        if (success) {
            this.stats.successfulRequests++;
        } else {
            this.stats.failedRequests++;
        }
    }

    addBytes(bytes) {
        this.stats.totalBytes += bytes;
    }

    getStats() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        return {
            ...this.stats,
            rps: Math.floor(this.stats.totalRequests / elapsed),
            elapsed: Math.floor(elapsed)
        };
    }

    reset() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalBytes: 0,
            totalPackets: 0
        };
        this.startTime = Date.now();
    }
}
