import os

def process_page(filename, nav_active_id, title_prefix, grid_replacement):
    with open(filename, "r") as f:
        text = f.read()

    # Fix active navigation
    text = text.replace('class="nav-link active" id="nav-overview"', 'class="nav-link" id="nav-overview"')
    text = text.replace(f'class="nav-link" id="{nav_active_id}"', f'class="nav-link active" id="{nav_active_id}"')

    # Replace the title
    text = text.replace('<title>Dashboard | HomeSync</title>', f'<title>{title_prefix} | HomeSync</title>')

    # Remove the summary cards for devices and activity since they might not be needed?
    # Actually, keep them, it's fine.
    # Wait, the prompt: "Devices: Show's the list of device and their power rating and last modfifed time". 
    # Let's replace the whole scrollable content if we want!
    # Let's replace from "<!-- Main Dashboard Grid -->" to "</main>"
    
    grid_start = text.find('<!-- Main Dashboard Grid -->')
    grid_end = text.find('</main>')

    if grid_start != -1 and grid_end != -1:
        text = text[:grid_start] + grid_replacement + "\n    " + text[grid_end:]

    with open(filename, "w") as f:
        f.write(text)

energy_grid = """<!-- Main Dashboard Grid -->
            <div class="dashboard-grid">
                <!-- ─ Left Column ─ -->
                <div class="dashboard-col">
                    <div class="glass-panel">
                        <div class="panel-header">
                            <h3 class="panel-title">Energy Trends</h3>
                            <select id="energy-period-select" class="panel-select">
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                            </select>
                        </div>
                        <div class="chart-container" style="height:250px">
                            <canvas id="energyLineChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="glass-panel">
                        <div class="panel-header">
                            <h3 class="panel-title">Resource Breakdown</h3>
                        </div>
                        <div class="chart-container" style="height:220px">
                            <canvas id="resourceBarChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- ─ Right Column ─ -->
                <div class="dashboard-col">
                    <!-- Power Consumption Pie Chart (Firebase) -->
                    <div class="glass-panel" id="panel-power">
                        <div class="panel-header">
                            <h3 class="panel-title">Current Power Consumption</h3>
                            <span class="panel-badge firebase-badge">🔴 Live</span>
                        </div>
                        <div class="chart-container" style="height:220px">
                            <canvas id="powerPieChart" role="img" aria-label="Power consumption pie chart by device"></canvas>
                        </div>
                    </div>

                    <!-- Device Usage Duration Bar Chart (Firebase) -->
                    <div class="glass-panel" id="panel-usage">
                        <div class="panel-header">
                            <h3 class="panel-title">Device Usage Duration</h3>
                            <span class="panel-badge firebase-badge">🔴 Live</span>
                        </div>
                        <div class="chart-legend">
                            <div class="legend-item">
                                <span class="legend-dot" style="background:#8B5CF6"></span>Living Room
                            </div>
                            <div class="legend-item">
                                <span class="legend-dot" style="background:#10B981"></span>Bedroom
                            </div>
                            <div class="legend-item">
                                <span class="legend-dot" style="background:#F97316"></span>Fan
                            </div>
                        </div>
                        <div class="chart-container" style="height:190px">
                            <canvas id="deviceUsageChart" role="img" aria-label="Device usage duration bar chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>"""

devices_grid = """<!-- Main Dashboard Grid -->
            <!-- Single full-width grid -->
            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
                <div class="dashboard-col">
                    <div class="glass-panel" style="padding: 24px;">
                        <div class="panel-header" style="margin-bottom: 24px;">
                            <h3 class="panel-title" style="font-size: 1.2rem;">Connected Devices Registry</h3>
                        </div>
                        
                        <!-- Table Layout for Devices -->
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                                <thead>
                                    <tr style="border-bottom: 1px solid var(--border-soft); color: var(--text-muted);">
                                        <th style="padding: 12px 16px; font-weight: 600;">Device Name</th>
                                        <th style="padding: 12px 16px; font-weight: 600;">Status</th>
                                        <th style="padding: 12px 16px; font-weight: 600;">Power Rating</th>
                                        <th style="padding: 12px 16px; font-weight: 600;">Total Used</th>
                                        <th style="padding: 12px 16px; font-weight: 600;">Last Modified</th>
                                        <th style="padding: 12px 16px; font-weight: 600;">Controls</th>
                                    </tr>
                                </thead>
                                <tbody id="devices-registry-table">
                                    <tr style="border-bottom: 1px solid var(--border-soft);">
                                        <td style="padding: 16px; color: var(--text-faint);" colspan="6">Loading devices...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>"""

activity_grid = """<!-- Main Dashboard Grid -->
            <div class="dashboard-grid" style="grid-template-columns: 1fr;">
                <div class="dashboard-col">
                    <!-- Activity Log -->
                    <div class="glass-panel" id="panel-log" style="padding: 24px;">
                        <div class="panel-header" style="margin-bottom: 24px;">
                            <h3 class="panel-title" style="font-size: 1.2rem;">Complete Activity History</h3>
                            <span class="panel-action" id="clear-log-btn" onclick="clearUILog()" title="Clear logs" style="font-size: 0.85rem; padding: 6px 12px; background: var(--accent-violet-lt); border-radius: var(--r-md);">Clear History</span>
                        </div>
                        <ul class="activity-list" id="device-events-list" role="log" aria-live="polite" aria-label="Device activity log" style="max-height: 500px; padding-right: 12px;" data-page="activity">
                            <li class="activity-item" id="events-empty">
                                <span class="activity-text" style="color: var(--text-faint)">Waiting for device events…</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>"""

process_page("energy.html", "nav-energy", "Energy", energy_grid)
process_page("devices.html", "nav-devices", "Devices", devices_grid)
process_page("activity.html", "nav-logs", "Activity", activity_grid)

print("HTML pages updated.")
