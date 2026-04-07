// app.js — HomeSync Firebase Device Control Logic
// Sync spec: database.md
// Handles: device state (boolean), Firebase listeners, UI sync, activity logs,
//          stats sync for charts, system/last_sync display

// ─── Device Registry ──────────────────────────────────────────────────────────
// Keys must match exact Firebase DB node names: living_room, bedroom, fan
const devices = {
    living_room: { title: "Living Room Light", id: "living-light",  power_rating: 10 },
    bedroom:     { title: "Bedroom Light",      id: "bedroom-light", power_rating: 8  },
    fan:         { title: "Living Room Fan",    id: "fan",           power_rating: 15 }
};

// ─── Firebase State ───────────────────────────────────────────────────────────
const isFirebaseActive = typeof firebase !== 'undefined'
    && firebase.apps
    && firebase.apps.length > 0;

let db = null;
if (isFirebaseActive) {
    try {
        db = firebase.database();
        console.log("HomeSync: Firebase database reference obtained.");
    } catch (e) {
        console.warn("HomeSync: Could not get Firebase database reference.", e);
    }
}

// Local state map for header counter  (true = ON, false = OFF)
const localDeviceStates = {
    living_room: false,
    bedroom:     false,
    fan:         false
};

// Track when each device was turned ON (for usage_duration calculation)
const deviceOnSince = {
    living_room: null,
    bedroom:     null,
    fan:         null
};

// ─── Initialise on DOM Ready ───────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    updateDashDate();
    setupRoomPills();

    if (isFirebaseActive && db) {
        // Ensure all devices exist in DB with defaults if they don't
        bootstrapDevices();

        // Real-time listeners
        setupFirebaseListeners();
        setupLoggingListener();
        setupStatsListener();
        setupSyncStatusListener();

        // Periodic usage_duration tracking (every 60 s)
        setInterval(periodicMetadataUpdate, 60000);
    } else {
        console.warn("HomeSync: Running in demo mode — Firebase not connected.");
        setTimeout(() => {
            appendUILog("System", "DEMO_MODE", Date.now(), true);
        }, 800);
    }
});

// ─── Bootstrap: write defaults if device node is absent ───────────────────────
function bootstrapDevices() {
    Object.keys(devices).forEach(deviceKey => {
        const ref = db.ref('devices/' + deviceKey);
        ref.once('value').then(snap => {
            if (!snap.exists()) {
                ref.set({
                    state:          false,
                    last_updated:   new Date().toISOString(),
                    usage_duration: 0,
                    power_rating:   devices[deviceKey].power_rating
                }).catch(e => console.warn("HomeSync: Bootstrap write failed:", e));
            }
        });
    });
}

// ─── Date Display ─────────────────────────────────────────────────────────────
function updateDashDate() {
    const el = document.getElementById('dash-date');
    if (!el) return;
    el.textContent = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

// ─── Room Pills (UI) ──────────────────────────────────────────────────────────
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

// ─── Firebase Device Listeners ────────────────────────────────────────────────
function setupFirebaseListeners() {
    Object.keys(devices).forEach(deviceKey => {
        db.ref('devices/' + deviceKey).on('value', snapshot => {
            const data = snapshot.val();
            if (data !== null && data !== undefined) {
                // state is a boolean per database.md
                updateUIState(deviceKey, data.state === true, data.last_updated);
            }
        }, err => {
            console.error(`HomeSync: Listener error for ${deviceKey}:`, err);
        });
    });
}

// ─── Update UI for a Device ───────────────────────────────────────────────────
function updateUIState(deviceKey, isON, lastUpdated) {
    const deviceId = devices[deviceKey].id;

    // Local state
    localDeviceStates[deviceKey] = isON;
    updateHeaderDeviceCount();

    // Toggle checkbox
    const toggle = document.getElementById(`toggle-${deviceId}`);
    if (toggle) toggle.checked = isON;

    // Status text
    const statusEl = document.getElementById(`status-${deviceId}`);
    if (statusEl) {
        statusEl.textContent = isON ? 'On · Running' : 'Off · Standby';
        statusEl.style.color  = isON ? 'var(--accent-violet)' : 'var(--text-muted)';
    }

    // Card active class
    const card = document.getElementById(`card-${deviceId}`);
    if (card) card.classList.toggle('active', isON);

    // Last updated
    const metaEl = document.getElementById(`meta-${deviceId}`);
    if (metaEl && lastUpdated) {
        const d       = new Date(lastUpdated);
        const timeStr = isNaN(d) ? lastUpdated : d.toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        metaEl.textContent = `Updated: ${timeStr}`;
    }
}

// ─── Header & Summary Card Device Count ───────────────────────────────────────
function updateHeaderDeviceCount() {
    const onCount = Object.values(localDeviceStates).filter(Boolean).length;
    const total   = Object.keys(localDeviceStates).length;

    const headerEl = document.getElementById('header-devices-on');
    if (headerEl) headerEl.textContent = `${onCount} / ${total}`;

    const scEl = document.getElementById('sc-devices-value');
    if (scEl) scEl.textContent = `${onCount} / ${total}`;

    const trendEl = document.getElementById('sc-trend-devices');
    if (trendEl) {
        trendEl.textContent  = onCount > 0 ? `↑ ${onCount} Active` : '— All Off';
        trendEl.className    = `summary-card-trend ${onCount > 0 ? 'trend-up' : 'trend-down'}`;
    }
}

// ─── Device Toggle (called from HTML onchange) ────────────────────────────────
function toggleDevice(deviceKey) {
    const deviceId = devices[deviceKey].id;
    const toggle   = document.getElementById(`toggle-${deviceId}`);
    if (!toggle) return;

    const newState = toggle.checked; // boolean: true = ON, false = OFF

    if (isFirebaseActive && db) {
        const now = new Date().toISOString();

        // If turning ON, record start time
        if (newState) {
            deviceOnSince[deviceKey] = Date.now();
        }

        // Write boolean state + timestamp to Firebase
        db.ref('devices/' + deviceKey).update({
            state:        newState,
            last_updated: now
        }).catch(err => console.error("HomeSync: Failed to update Firebase:", err));

        // Log to Firebase /logs
        logActivity(deviceKey, newState);

        // Update stats/power_consumption & stats/total_usage
        updateStats(deviceKey, newState);

        // Update system/last_sync
        db.ref('system/last_sync').set(now)
            .catch(e => console.warn("HomeSync: Failed to update last_sync:", e));

    } else {
        // Demo mode
        updateUIState(deviceKey, newState, new Date().toISOString());
        appendUILog(devices[deviceKey].title, newState ? 'ON' : 'OFF', Date.now());
    }
}

// ─── Firebase Activity Logging ────────────────────────────────────────────────
function logActivity(deviceKey, state) {
    if (!db) return;
    db.ref('logs').push({
        device:    devices[deviceKey].title,
        action:    state ? 'ON' : 'OFF',
        timestamp: Date.now()
    }).catch(err => console.warn("HomeSync: Log push failed:", err));
}

// ─── Activity Log Listener ────────────────────────────────────────────────────
function setupLoggingListener() {
    if (!db) return;
    db.ref('logs').limitToLast(10).on('child_added', snapshot => {
        const log = snapshot.val();
        if (log) appendUILog(log.device, log.action, log.timestamp);
    });
}

// ─── UI Log ───────────────────────────────────────────────────────────────────
function appendUILog(deviceName, action, timestamp, isSystem = false) {
    const logList = document.getElementById('activity-log');
    if (!logList) return;

    const emptyItem = document.getElementById('log-empty');
    if (emptyItem) emptyItem.remove();

    const li        = document.createElement('li');
    li.className    = 'activity-item';
    const isON      = (action === 'ON' || action === true);
    const timeStr   = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    if (isSystem) {
        li.innerHTML = `
            <span class="activity-dot" style="background:var(--accent-green)"></span>
            <span class="activity-text" style="color:var(--text-muted);font-style:italic;">
                ${deviceName} — Demo mode. Connect Firebase for live control.
            </span>
            <span class="activity-time">${timeStr}</span>`;
    } else {
        li.innerHTML = `
            <span class="activity-dot ${isON ? '' : 'off'}"></span>
            <span class="activity-text">
                ${deviceName} turned <strong class="${isON ? '' : 'act-off'}">${action}</strong>
            </span>
            <span class="activity-time">${timeStr}</span>`;
    }

    logList.insertBefore(li, logList.firstChild);

    // Cap at 15 entries
    while (logList.children.length > 15) {
        logList.removeChild(logList.lastChild);
    }
}

// ─── Clear UI Log ─────────────────────────────────────────────────────────────
function clearUILog() {
    const logList = document.getElementById('activity-log');
    if (!logList) return;
    logList.innerHTML = `
        <li class="activity-item" id="log-empty">
            <span class="activity-text" style="color:var(--text-faint)">Log cleared. Waiting for events…</span>
        </li>`;
}

// ─── Stats: Update power_consumption and total_usage in Firebase ───────────────
function updateStats(deviceKey, isON) {
    if (!db) return;

    const powerRating = devices[deviceKey].power_rating; // watts

    // If device just turned OFF, calculate watt-hours used this session
    if (!isON && deviceOnSince[deviceKey]) {
        const elapsedMs   = Date.now() - deviceOnSince[deviceKey];
        const elapsedHrs  = elapsedMs / 3600000;
        const wattHours   = +(powerRating * elapsedHrs).toFixed(3);
        deviceOnSince[deviceKey] = null;

        // Increment stats/power_consumption/{device}
        db.ref(`stats/power_consumption/${deviceKey}`).transaction(current => {
            return (current || 0) + wattHours;
        }).catch(e => console.warn("HomeSync: Stats power update failed:", e));
    }

    if (isON) {
        deviceOnSince[deviceKey] = Date.now();
    }
}

// ─── Stats Listener (drives charts) ──────────────────────────────────────────
function setupStatsListener() {
    if (!db) return;

    // Listen to total_usage (seconds per device) → feeds usage bar chart
    db.ref('stats/total_usage').on('value', snapshot => {
        const data = snapshot.val() || {};
        if (window.updateUsageChart) {
            window.updateUsageChart(
                data.living_room || 0,
                data.bedroom     || 0,
                data.fan         || 0
            );
        }
    });

    // Listen to power_consumption (watt-hours per device) → feeds pie chart
    db.ref('stats/power_consumption').on('value', snapshot => {
        const data = snapshot.val() || {};
        if (window.updatePowerChart) {
            window.updatePowerChart(
                data.living_room || 0,
                data.bedroom     || 0,
                data.fan         || 0
            );
        }
    });
}

// ─── System Sync Status Listener ─────────────────────────────────────────────
function setupSyncStatusListener() {
    if (!db) return;
    db.ref('system/last_sync').on('value', snapshot => {
        const raw   = snapshot.val();
        const el    = document.getElementById('last-sync-value');
        if (!el) return;
        if (raw) {
            const d = new Date(raw);
            el.textContent = isNaN(d)
                ? raw
                : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } else {
            el.textContent = '—';
        }
    });
}

// ─── Periodic Usage Duration Tracking (every 60 s) ───────────────────────────
function periodicMetadataUpdate() {
    if (!db) return;
    const now = new Date().toISOString();

    Object.keys(devices).forEach(deviceKey => {
        if (localDeviceStates[deviceKey]) {
            // Increment usage_duration by 1 (minute) and update last_updated
            db.ref('devices/' + deviceKey).transaction(current => {
                if (current) {
                    current.usage_duration = (current.usage_duration || 0) + 60; // seconds
                    current.last_updated   = now;
                }
                return current;
            }).catch(e => console.warn("HomeSync: Usage duration update failed:", e));

            // Also push to stats/total_usage
            db.ref(`stats/total_usage/${deviceKey}`).transaction(current => {
                return (current || 0) + 60;
            }).catch(e => console.warn("HomeSync: Stats usage update failed:", e));
        }
    });

    // Update system/last_sync
    db.ref('system/last_sync').set(now)
        .catch(e => console.warn("HomeSync: Sync timestamp update failed:", e));

    console.log("HomeSync: Periodic metadata sync complete.");
}
