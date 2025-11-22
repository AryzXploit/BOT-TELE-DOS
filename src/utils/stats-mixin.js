/**
 * Universal Stats Mixin
 * Add stats tracking ke method manapun dengan 1 line!
 */

export function addStatsTracking(MethodClass) {
    return class extends MethodClass {
        constructor(...args) {
            super(...args);
            
            // Initialize stats if not exists
            if (!this.stats) {
                this.stats = {
                    totalRequests: 0,
                    successfulRequests: 0,
                    failedRequests: 0,
                    totalBytes: 0,
                    totalPackets: 0
                };
            }
            
            this._startTime = Date.now();
        }
        
        // Helper methods untuk track stats
        trackRequest(success = true, bytes = 0) {
            this.stats.totalRequests++;
            this.stats.totalPackets++;
            this.stats.totalBytes += bytes;
            
            if (success) {
                this.stats.successfulRequests++;
            } else {
                this.stats.failedRequests++;
            }
        }
        
        trackBytes(bytes) {
            this.stats.totalBytes += bytes;
        }
        
        trackPacket() {
            this.stats.totalPackets++;
        }
        
        getStats() {
            const elapsed = (Date.now() - this._startTime) / 1000;
            return {
                ...this.stats,
                rps: Math.floor(this.stats.totalRequests / elapsed),
                pps: Math.floor(this.stats.totalPackets / elapsed),
                gbps: ((this.stats.totalBytes * 8) / elapsed / 1000000000).toFixed(2),
                elapsed: Math.floor(elapsed)
            };
        }
    };
}

/**
 * Quick Stats Wrapper - Wrap existing method class
 */
export function wrapWithStats(instance) {
    if (!instance.stats) {
        instance.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalBytes: 0,
            totalPackets: 0
        };
    }
    
    instance._startTime = Date.now();
    
    instance.trackRequest = function(success = true, bytes = 0) {
        this.stats.totalRequests++;
        this.stats.totalPackets++;
        this.stats.totalBytes += bytes;
        
        if (success) {
            this.stats.successfulRequests++;
        } else {
            this.stats.failedRequests++;
        }
    };
    
    instance.trackBytes = function(bytes) {
        this.stats.totalBytes += bytes;
    };
    
    instance.trackPacket = function() {
        this.stats.totalPackets++;
    };
    
    return instance;
}
