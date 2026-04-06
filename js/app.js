// app.js — HomeSync Firebase Device Control Logic
// Handles: device state, Firebase listeners, UI sync, logging, periodic updates

// ─── Device Registry ──────────────────────────────────────────────────────────
const devices = {
    living_light:  { title: "Living Room Light",  id: "living-light"  },
    bedroom_light: { title: "Bedroom Light",       id: "bedroom-light" },
    fan:           { title: "Living Room Fan",     id: "fan"           }
};

// ─── Firebase State ───────────────────────────────────────────────────────────
const isFirebaseActive = typeof firebase !== 'undefined'
    && firebase.apps
    && firebase.apps.length > 0;

let db = null;
if (isFirebaseActive) {
    try {
        db = firebase.database();
    } catch (e) {
        console.warn("HomeSync: Could not get Firebase database reference.", e);
    }
}

// Track local state for header counter
const localDeviceStates = {
    living_light:  'OFF',
    bedroom_light: 'OFF',
    fan:           'OFF'
};

// ─── Initialise on DOM Ready ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    // Show today's date in header
    updateDashDate();

    // Room pill interaction (UI only, no data fetch needed)
    setupRoomPills();

    if (isFirebaseActive && db) {
        setupFirebaseListeners();
        setupLoggingListener();
        // Periodic: every 60 seconds update usage metadata
        setInterval(periodicMetadataUpdate, 60000);
    } else {
        console.warn("HomeSync: Running in mock/demo mode — Firebase not connected.");
        // Inject a demo log entry so the log doesn't look completely empty
        setTimeout(() => {
            appendUILog("System", "DEMO MODE", Date.now(), true);
        }, 800);
    }
});

// ─── Date Display ─────────────────────────────────────────────────────────────
function updateDashDate() {
    const el = document.getElementById('dash-date');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

// ─── Room Pills (UI Interaction) ──────────────────────────────────────────────
function setupRoomPills() {
    const pills = document.querySelectorAll('.room-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => {
                p.classList.remove('active');
                p.setAttribute('aria-selected', 'false');
            });
            pill.classList.add('active');
            pill.setAttribute('aria-selected', 'true');
        });
    });
}

// ─── Firebase Listeners ───────────────────────────────────────────────────────
function setupFirebaseListeners() {
    Object.keys(devices).forEach(deviceKey => {
        const ref = db.ref('devices/' + deviceKey);
        ref.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                updateUIState(deviceKey, data.state, data.last_updated);
            } else {
                // First run: initialise device in DB with default OFF state
                ref.set({
                    state: 'OFF',
                    last_updated: Date.now(),
                    usage_duration: 0
                });
            }
        }, (error) => {
            console.error(`HomeSync: Firebase listener error for ${deviceKey}:`, error);
        });
    });
}

// ─── Update UI for a Device ───────────────────────────────────────────────────
function updateUIState(deviceKey, state, lastUpdatedTimestamp) {
    const isON = (state === 'ON');
    const deviceId = devices[deviceKey].id;

    // Track local state
    localDeviceStates[deviceKey] = state;
    updateHeaderDeviceCount();

    // Toggle checkbox
    const toggle = document.getElementById(`toggle-${deviceId}`);
    if (toggle) toggle.checked = isON;

    // Status text
    const statusEl = document.getElementById(`status-${deviceId}`);
    if (statusEl) {
        statusEl.textContent = isON ? 'On · Running' : 'Off · Standby';
        statusEl.style.color = isON ? 'var(--accent-violet)' : 'var(--text-muted)';
    }

    // Card active class
    const card = document.getElementById(`card-${deviceId}`);
    if (card) {
        card.classList.toggle('active', isON);
    }

    // Meta time
    const metaEl = document.getElementById(`meta-${deviceId}`);
    if (metaEl && lastUpdatedTimestamp) {
        const timeStr = new Date(lastUpdatedTimestamp).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        metaEl.textContent = `Updated: ${timeStr}`;
    }
}

// ─── Header Device Count ──────────────────────────────────────────────────────
function updateHeaderDeviceCount() {
    const onCount = Object.values(localDeviceStates).filter(s => s === 'ON').length;
    const total   = Object.keys(localDeviceStates).length;

    const headerEl = document.getElementById('header-devices-on');
    if (headerEl) headerEl.textContent = `${onCount} / ${total}`;

    const scEl = document.getElementById('sc-devices-value');
    if (scEl) scEl.textContent = `${onCount} / ${total}`;

    const trendEl = document.getElementById('sc-trend-devices');
    if (trendEl) {
        trendEl.textContent = onCount > 0 ? `↑ ${onCount} Active` : '— All Off';
        trendEl.className = `summary-card-trend ${onCount > 0 ? 'trend-up' : 'trend-down'}`;
    }
}

// ─── Device Toggle (called from HTML onchange) ────────────────────────────────
function toggleDevice(deviceKey) {
    const deviceId = devices[deviceKey].id;
    const toggle   = document.getElementById(`toggle-${deviceId}`);
    if (!toggle) return;

    const newState = toggle.checked ? 'ON' : 'OFF';

    if (isFirebaseActive && db) {
        // Write to Firebase
        db.ref('devices/' + deviceKey).update({
            state:        newState,
            last_updated: Date.now()
        }).catch(err => console.error("HomeSync: Failed to update Firebase:", err));

        // Log to Firebase logs collection
        logActivity(deviceKey, newState);
    } else {
        // Mock mode: update UI directly
        updateUIState(deviceKey, newState, Date.now());
        appendUILog(devices[deviceKey].title, newState, Date.now());
    }
}

// ─── Firebase Activity Logging ────────────────────────────────────────────────
function logActivity(deviceKey, state) {
    if (!db) return;
    db.ref('logs').push({
        device:    devices[deviceKey].title,
        action:    state,
        timestamp: Date.now()
    }).catch(err => console.warn("HomeSync: Log push failed:", err));
}

function setupLoggingListener() {
    if (!db) return;
    // Only listen to last 10 log entries and new ones as they come in
    const logsRef = db.ref('logs').limitToLast(10);
    logsRef.on('child_added', (snapshot) => {
        const log = snapshot.val();
        if (log) appendUILog(log.device, log.action, log.timestamp);
    });
}

// ─── UI Log ────────────────────────────────────────────────────────────────────
function appendUILog(deviceName, action, timestamp, isSystem = false) {
    const logList = document.getElementById('activity-log');
    if (!logList) return;

    // Remove empty placeholder
    const emptyItem = document.getElementById('log-empty');
    if (emptyItem) emptyItem.remove();

    const li = document.createElement('li');
    li.className = 'activity-item';

    const isON = (action === 'ON');
    const timeStr = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    if (isSystem) {
        li.innerHTML = `
            <span class="activity-dot" style="background: var(--accent-green)"></span>
            <span class="activity-text" style="color: var(--text-muted); font-style: italic;">${deviceName} — Demo mode active, connect Firebase for live control</span>
            <span class="activity-time">${timeStr}</span>
        `;
    } else {
        li.innerHTML = `
            <span class="activity-dot ${isON ? '' : 'off'}"></span>
            <span class="activity-text">
                ${deviceName} turned <strong class="${isON ? '' : 'act-off'}">${action}</strong>
            </span>
            <span class="activity-time">${timeStr}</span>
        `;
    }

    // Prepend newest at top
    logList.insertBefore(li, logList.firstChild);

    // Cap at 15 entries
    while (logList.children.length > 15) {
        logList.removeChild(logList.lastChild);
    }
}

// ─── Clear UI Log ──────────────────────────────────────────────────────────────
function clearUILog() {
    const logList = document.getElementById('activity-log');
    if (!logList) return;
    logList.innerHTML = `
        <li class="activity-item" id="log-empty">
            <span class="activity-text" style="color: var(--text-faint)">Log cleared. Waiting for events…</span>
        </li>`;
}

// ─── Periodic Metadata Sync ────────────────────────────────────────────────────
function periodicMetadataUpdate() {
    if (!db) return;
    // For every device that is currently ON, increment usage_duration by 1 minute
    Object.keys(devices).forEach(deviceKey => {
        if (localDeviceStates[deviceKey] === 'ON') {
            db.ref('devices/' + deviceKey).transaction(current => {
                if (current) {
                    current.usage_duration = (current.usage_duration || 0) + 1;
                    current.last_updated   = Date.now();
                }
                return current;
            });
        }
    });
    console.log("HomeSync: Periodic metadata sync complete.");
}
