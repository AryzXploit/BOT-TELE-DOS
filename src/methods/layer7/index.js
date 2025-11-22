// Import maximized versions (will override originals)
export { HTTPGetFlood, HTTPPostFlood, HTTPSlowAttack } from './http-maximized.js';
export { HTTP2Flood, HTTP2PostFlood, HTTP2CFBypass } from './http2.js';
export { HTTP2EnhancedCFKiller } from './http2-enhanced.js';
export { CloudflareBypass, AdvancedBypass, BotSimulation } from './bypass.js';
export { 
    StressAttack, 
    NullAttack, 
    DynamicAttack,
    XMLRPCAttack,
    ApacheRangeAttack,
    CookieAttack
} from './advanced.js';
export { 
    PrivacyPassBypass,
    CaptchaBypass,
    UltimateBypass
} from './privacy-captcha.js';
export { 
    HTTP3Attack,
    HTTP3PostAttack
} from './http3.js';
export { CloudflareKiller } from './cloudflare-killer.js';
export { GacorBypass, MonsterBypass } from './gacor-bypass.js';

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
    'HTTP2-ENHANCED',
    'HTTP3',
    'HTTP3-POST',
    'CFB',
    'CFBUAM',
    'BYPASS',
    'BOT',
    'PRIVACYPASS',
    'CAPTCHA',
    'ULTIMATE',
    'XMLRPC',
    'STRESS',
    'DYN',
    'COOKIE',
    'APACHE',
    'NULL',
    'CF-KILLER',
    'GACOR-BYPASS',
    'MONSTER-BYPASS'
];
