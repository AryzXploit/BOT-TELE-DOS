export { UDPFlood } from './udp.js';
export { TCPFlood } from './tcp.js';
export { MinecraftFlood, MinecraftBot } from './minecraft.js';
export { 
    SYNFlood, 
    VSEFlood, 
    TS3Flood, 
    MCPEFlood, 
    FiveMFlood, 
    FiveMTokenFlood,
    CPSFlood,
    ConnectionFlood,
    OVHUDPFlood
} from './advanced.js';

/**
 * Layer 4 Attack Methods
 */
export const LAYER4_METHODS = [
    'UDP',
    'TCP',
    'MINECRAFT',
    'MCBOT',
    'CPS',
    'CONNECTION',
    'SYN',
    'VSE',
    'TS3',
    'MCPE',
    'FIVEM',
    'FIVEM-TOKEN',
    'OVH-UDP'
];
