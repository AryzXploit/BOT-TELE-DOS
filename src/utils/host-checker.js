import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import dns from 'dns';
import net from 'net';
import { logger } from './logger.js';

const execAsync = promisify(exec);
const dnsResolve = promisify(dns.resolve);

/**
 * 🔍 HOST CHECKER - Check if target is down
 * Features:
 * - HTTP/HTTPS status check
 * - Response time measurement
 * - DNS resolution
 * - Port availability check
 * - Multiple location ping (via public APIs)
 */
export class HostChecker {
    constructor() {
        // Public ping/check APIs (free)
        this.checkAPIs = [
            'https://api.hackertarget.com/httpheaders/?q=',
            'https://api.hackertarget.com/nping/?q='
        ];
    }

    /**
     * Main check function - comprehensive host check
     */
    async checkHost(target) {
        const results = {
            target: target,
            timestamp: new Date().toISOString(),
            isDown: false,
            checks: {}
        };

        try {
            // Parse target
            const parsedTarget = this.parseTarget(target);
            results.parsed = parsedTarget;

            // Run all checks in parallel
            const [httpCheck, dnsCheck, portCheck, pingCheck] = await Promise.allSettled([
                this.checkHTTP(parsedTarget),
                this.checkDNS(parsedTarget.hostname),
                this.checkPort(parsedTarget.hostname, parsedTarget.port),
                this.checkPing(parsedTarget.hostname)
            ]);

            // HTTP Check
            if (httpCheck.status === 'fulfilled') {
                results.checks.http = httpCheck.value;
                if (!httpCheck.value.accessible) {
                    results.isDown = true;
                }
            } else {
                results.checks.http = { error: httpCheck.reason.message, accessible: false };
                results.isDown = true;
            }

            // DNS Check
            if (dnsCheck.status === 'fulfilled') {
                results.checks.dns = dnsCheck.value;
            } else {
                results.checks.dns = { error: dnsCheck.reason.message, resolved: false };
            }

            // Port Check
            if (portCheck.status === 'fulfilled') {
                results.checks.port = portCheck.value;
                if (!portCheck.value.open) {
                    results.isDown = true;
                }
            } else {
                results.checks.port = { error: portCheck.reason.message, open: false };
            }

            // Ping Check
            if (pingCheck.status === 'fulfilled') {
                results.checks.ping = pingCheck.value;
            } else {
                results.checks.ping = { error: pingCheck.reason.message, reachable: false };
            }

            // Determine overall status
            results.status = this.determineStatus(results);
            results.summary = this.generateSummary(results);

        } catch (error) {
            logger.error('Host check error:', error);
            results.error = error.message;
            results.isDown = true;
        }

        return results;
    }

    /**
     * Parse target URL/IP:PORT
     */
    parseTarget(target) {
        try {
            // Check if it's a URL
            if (target.includes('://')) {
                const url = new URL(target);
                return {
                    original: target,
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    protocol: url.protocol.replace(':', ''),
                    url: target,
                    type: 'url'
                };
            }
            
            // Check if it's IP:PORT or DOMAIN:PORT
            if (target.includes(':')) {
                const [hostname, port] = target.split(':');
                return {
                    original: target,
                    hostname: hostname,
                    port: parseInt(port),
                    protocol: port === '443' ? 'https' : 'http',
                    url: `http://${hostname}:${port}`,
                    type: 'host_port'
                };
            }
            
            // Just hostname/IP
            return {
                original: target,
                hostname: target,
                port: 80,
                protocol: 'http',
                url: `http://${target}`,
                type: 'hostname'
            };
        } catch (error) {
            return {
                original: target,
                hostname: target,
                port: 80,
                protocol: 'http',
                url: `http://${target}`,
                type: 'unknown',
                parseError: error.message
            };
        }
    }

    /**
     * Check HTTP/HTTPS accessibility
     */
    async checkHTTP(parsedTarget) {
        const startTime = Date.now();
        
        try {
            const response = await axios.get(parsedTarget.url, {
                timeout: 10000,
                maxRedirects: 5,
                validateStatus: () => true, // Accept any status
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const responseTime = Date.now() - startTime;

            return {
                accessible: response.status < 500, // 5xx = server error/down
                statusCode: response.status,
                statusText: response.statusText,
                responseTime: responseTime,
                responseSize: response.data ? response.data.length : 0,
                headers: {
                    server: response.headers['server'],
                    contentType: response.headers['content-type'],
                    cfRay: response.headers['cf-ray']
                },
                isCloudflare: !!response.headers['cf-ray'],
                redirected: response.request.res.responseUrl !== parsedTarget.url
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            return {
                accessible: false,
                error: error.message,
                errorCode: error.code,
                responseTime: responseTime,
                timeout: error.code === 'ECONNABORTED',
                refused: error.code === 'ECONNREFUSED',
                notFound: error.code === 'ENOTFOUND'
            };
        }
    }

    /**
     * Check DNS resolution
     */
    async checkDNS(hostname) {
        try {
            const addresses = await dnsResolve(hostname, 'A');
            
            return {
                resolved: true,
                hostname: hostname,
                addresses: addresses,
                ipCount: addresses.length,
                primaryIP: addresses[0]
            };
        } catch (error) {
            return {
                resolved: false,
                hostname: hostname,
                error: error.message,
                errorCode: error.code
            };
        }
    }

    /**
     * Check port availability
     */
    async checkPort(hostname, port) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            const timeout = 5000;
            const startTime = Date.now();

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                const responseTime = Date.now() - startTime;
                socket.destroy();
                resolve({
                    open: true,
                    port: port,
                    hostname: hostname,
                    responseTime: responseTime
                });
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve({
                    open: false,
                    port: port,
                    hostname: hostname,
                    timeout: true
                });
            });

            socket.on('error', (error) => {
                socket.destroy();
                resolve({
                    open: false,
                    port: port,
                    hostname: hostname,
                    error: error.message,
                    refused: error.code === 'ECONNREFUSED'
                });
            });

            socket.connect(port, hostname);
        });
    }

    /**
     * Check ping (ICMP)
     */
    async checkPing(hostname) {
        try {
            const { stdout } = await execAsync(`ping -c 3 -W 2 ${hostname}`);
            
            // Parse ping output
            const lines = stdout.split('\n');
            const statsLine = lines.find(l => l.includes('min/avg/max'));
            
            if (statsLine) {
                const match = statsLine.match(/= ([\d.]+)\/([\d.]+)\/([\d.]+)/);
                if (match) {
                    return {
                        reachable: true,
                        hostname: hostname,
                        min: parseFloat(match[1]),
                        avg: parseFloat(match[2]),
                        max: parseFloat(match[3]),
                        unit: 'ms'
                    };
                }
            }

            return {
                reachable: true,
                hostname: hostname,
                rawOutput: stdout
            };
        } catch (error) {
            return {
                reachable: false,
                hostname: hostname,
                error: error.message
            };
        }
    }

    /**
     * Determine overall status
     */
    determineStatus(results) {
        const { http, dns, port, ping } = results.checks;

        // Critical: HTTP not accessible
        if (http && !http.accessible) {
            if (http.statusCode >= 500) {
                return 'DOWN'; // Server error
            }
            if (http.timeout || http.refused || http.notFound) {
                return 'DOWN'; // Connection issues
            }
        }

        // Critical: Port closed
        if (port && !port.open) {
            return 'DOWN';
        }

        // Warning: DNS issues but HTTP works
        if (dns && !dns.resolved && http && http.accessible) {
            return 'WARNING';
        }

        // All good
        if (http && http.accessible) {
            return 'UP';
        }

        // Unknown state
        return 'UNKNOWN';
    }

    /**
     * Generate human-readable summary
     */
    generateSummary(results) {
        const { status, checks } = results;
        const summary = [];

        // Status emoji
        const statusEmoji = {
            'UP': '🟢',
            'DOWN': '🔴',
            'WARNING': '🟡',
            'UNKNOWN': '⚪'
        };

        summary.push(`${statusEmoji[status]} Status: **${status}**`);

        // HTTP
        if (checks.http) {
            if (checks.http.accessible) {
                summary.push(`✅ HTTP: ${checks.http.statusCode} (${checks.http.responseTime}ms)`);
            } else {
                summary.push(`❌ HTTP: ${checks.http.error || 'Failed'}`);
            }
        }

        // DNS
        if (checks.dns) {
            if (checks.dns.resolved) {
                summary.push(`✅ DNS: ${checks.dns.primaryIP} (+${checks.dns.ipCount - 1} more)`);
            } else {
                summary.push(`❌ DNS: Not resolved`);
            }
        }

        // Port
        if (checks.port) {
            if (checks.port.open) {
                summary.push(`✅ Port ${checks.port.port}: Open (${checks.port.responseTime}ms)`);
            } else {
                summary.push(`❌ Port ${checks.port.port}: ${checks.port.refused ? 'Refused' : 'Closed'}`);
            }
        }

        // Ping
        if (checks.ping) {
            if (checks.ping.reachable) {
                summary.push(`✅ Ping: ${checks.ping.avg}ms avg`);
            } else {
                summary.push(`❌ Ping: Unreachable`);
            }
        }

        return summary.join('\n');
    }

    /**
     * Format results for Telegram
     */
    formatForTelegram(results) {
        const { target, status, checks, parsed } = results;

        let message = `╔═══════════════════════════════╗\n`;
        message += `║  🔍 *HOST STATUS CHECK* 🔍   ║\n`;
        message += `╚═══════════════════════════════╝\n\n`;

        message += `🎯 *Target:* \`${target}\`\n\n`;

        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📊 *Overall Status:*\n`;
        
        const statusEmoji = {
            'UP': '🟢',
            'DOWN': '🔴',
            'WARNING': '🟡',
            'UNKNOWN': '⚪'
        };
        
        message += `   ${statusEmoji[status]} *${status}*\n\n`;

        // HTTP Check
        if (checks.http) {
            message += `🌐 *HTTP Check:*\n`;
            if (checks.http.accessible) {
                message += `   ✅ Status: \`${checks.http.statusCode}\` ${checks.http.statusText}\n`;
                message += `   ⏱ Response: \`${checks.http.responseTime}ms\`\n`;
                if (checks.http.isCloudflare) {
                    message += `   🛡 Protected: Cloudflare\n`;
                }
            } else {
                message += `   ❌ Failed: ${checks.http.error}\n`;
                if (checks.http.timeout) {
                    message += `   ⏱ Timeout after ${checks.http.responseTime}ms\n`;
                }
            }
            message += '\n';
        }

        // DNS Check
        if (checks.dns) {
            message += `📡 *DNS Resolution:*\n`;
            if (checks.dns.resolved) {
                message += `   ✅ Resolved: \`${checks.dns.primaryIP}\`\n`;
                if (checks.dns.ipCount > 1) {
                    message += `   📋 IPs: ${checks.dns.ipCount} addresses\n`;
                }
            } else {
                message += `   ❌ Failed: Not resolved\n`;
            }
            message += '\n';
        }

        // Port Check
        if (checks.port) {
            message += `🔌 *Port Check:*\n`;
            if (checks.port.open) {
                message += `   ✅ Port ${checks.port.port}: Open\n`;
                message += `   ⏱ Connect: \`${checks.port.responseTime}ms\`\n`;
            } else {
                message += `   ❌ Port ${checks.port.port}: ${checks.port.refused ? 'Refused' : 'Closed'}\n`;
            }
            message += '\n';
        }

        // Ping Check
        if (checks.ping) {
            message += `📶 *Ping Test:*\n`;
            if (checks.ping.reachable) {
                message += `   ✅ Reachable\n`;
                if (checks.ping.avg) {
                    message += `   ⏱ Latency: \`${checks.ping.avg}ms\` avg\n`;
                    message += `   📊 Range: ${checks.ping.min}-${checks.ping.max}ms\n`;
                }
            } else {
                message += `   ❌ Unreachable\n`;
            }
            message += '\n';
        }

        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        // Summary
        if (status === 'DOWN') {
            message += `🔴 *Target appears to be DOWN*\n`;
            message += `   Attack may be successful! 🎯\n`;
        } else if (status === 'UP') {
            message += `🟢 *Target is UP and running*\n`;
            message += `   Continue attacking if needed\n`;
        } else if (status === 'WARNING') {
            message += `🟡 *Target has issues*\n`;
            message += `   Partially accessible\n`;
        }

        message += `\n⏰ *Checked:* ${new Date().toLocaleTimeString()}`;

        return message;
    }

    /**
     * Quick check (fast, essential checks only)
     */
    async quickCheck(target) {
        try {
            const parsedTarget = this.parseTarget(target);
            const httpCheck = await this.checkHTTP(parsedTarget);
            
            return {
                target: target,
                isDown: !httpCheck.accessible,
                statusCode: httpCheck.statusCode,
                responseTime: httpCheck.responseTime,
                status: httpCheck.accessible ? 'UP' : 'DOWN'
            };
        } catch (error) {
            return {
                target: target,
                isDown: true,
                error: error.message,
                status: 'DOWN'
            };
        }
    }
}

// Export singleton instance
export const hostChecker = new HostChecker();
