export { HTTPGetFlood, HTTPPostFlood, HTTPSlowAttack } from './http.js';
export { HTTP2Flood, HTTP2PostFlood, HTTP2CFBypass } from './http2.js';
export { CloudflareBypass, AdvancedBypass, BotSimulation } from './bypass.js';

/**
 * Layer 7 Attack Methods
 */
export const LAYER7_METHODS = [
    'GET',
    'POST',
    'HEAD',
    'SLOW',
    'HTTP2',
    'HTTP2-POST',
    'HTTP2-CF',
    'CFB',
    'CFBUAM',
    'BYPASS',
    'BOT',
    'XMLRPC',
    'STRESS',
    'DYN',
    'COOKIE',
    'PPS',
    'APACHE',
    'OVH',
    'AVB',
    'DGB',
    'GSB',
    'NULL',
    'RHEX',
    'STOMP',
    'EVEN',
    'DOWNLOADER',
    'BOMB',
    'KILLER',
    'TOR'
];
