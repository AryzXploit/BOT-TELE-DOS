// Import maximized versions (will override originals)
export { HTTPGetFlood, HTTPPostFlood, HTTPSlowAttack } from './http-maximized.js';
export { HTTP2Flood, HTTP2PostFlood, HTTP2CFBypass } from './http2.js';
export { CloudflareBypass, AdvancedBypass, BotSimulation } from './bypass.js';
export { 
    StressAttack, 
    NullAttack, 
    DynamicAttack,
    XMLRPCAttack,
    ApacheRangeAttack,
    CookieAttack
} from './advanced.js';

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
    'APACHE',
    'NULL'
];
