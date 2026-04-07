// charts.js — Chart.js Implementations for HomeSync Dashboard
// Charts: Sun Energy Line, Resource Usage Bar, Device Usage Bar (Firebase), Power Pie (Firebase)

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart === 'undefined') {
        console.warn("HomeSync Charts: Chart.js not loaded.");
        return;
    }

    // ─── Global Chart Defaults ─────────────────────────────────────────────────
    Chart.defaults.font.family              = "'Inter', sans-serif";
    Chart.defaults.font.size                = 11;
    Chart.defaults.color                    = '#6B7280';
    Chart.defaults.plugins.legend.display   = false;

    // ─── Helper: Tooltip base config ──────────────────────────────────────────
    const tooltipBase = {
        backgroundColor: '#FFFFFF',
        borderColor:     'rgba(0,0,0,0.08)',
        borderWidth:     1,
        titleColor:      '#1F2937',
        bodyColor:       '#6B7280',
        titleFont:       { weight: '700', size: 12 },
        bodyFont:        { size: 11 },
        padding:         12,
        cornerRadius:    12,
        boxPadding:      5
    };

    // ─── 1. Sun Energy Line Chart ──────────────────────────────────────────────
    const ctxLine = document.getElementById('energyLineChart');
    if (ctxLine) {
        const data_today = {
            labels:      ['00:00','03:00','06:00','09:00','12:00','15:00','18:00','21:00','23:59'],
            production:  [0, 0, 2, 38, 72, 55, 18, 1, 0],
            consumption: [10, 8, 14, 22, 35, 42, 48, 35, 15]
        };
        const data_week = {
            labels:      ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
            production:  [42, 58, 65, 30, 70, 80, 55],
            consumption: [50, 60, 55, 65, 72, 80, 62]
        };

        const lineChart = new Chart(ctxLine, {
            type: 'line',
            data: buildLineData(data_today),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1200, easing: 'easeInOutCubic' },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend:  { display: false },
                    tooltip: {
                        ...tooltipBase,
                        displayColors: true,
                        callbacks: {
                            label: ctx => `  ${ctx.dataset.label}: ${ctx.parsed.y} kWh`
                        }
                    }
                },
                scales: {
                    x: {
                        grid:   { display: false },
                        border: { display: false },
                        ticks:  { font: { size: 10 }, color: '#9CA3AF' }
                    },
                    y: {
                        grid:   { color: 'rgba(0,0,0,0.04)', lineWidth: 1 },
                        border: { display: false, dash: [4, 4] },
                        ticks:  { font: { size: 10 }, color: '#9CA3AF', stepSize: 20 },
                        suggestedMin: 0,
                        suggestedMax: 90
                    }
                }
            }
        });

        const periodSelect = document.getElementById('energy-period-select');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                const dataset = periodSelect.value === 'week' ? data_week : data_today;
                const newData = buildLineData(dataset);
                lineChart.data.labels              = newData.labels;
                lineChart.data.datasets[0].data    = newData.datasets[0].data;
                lineChart.data.datasets[1].data    = newData.datasets[1].data;
                lineChart.update('active');
            });
        }
    }

    // ─── 2. Resource Usage Stacked Bar Chart ───────────────────────────────────
    const ctxBar = document.getElementById('resourceBarChart');
    if (ctxBar) {
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                datasets: [
                    {
                        label: 'HVAC',
                        data:  [30, 45, 28, 50, 40, 60, 55],
                        backgroundColor:      '#8B5CF6',
                        borderRadius:         { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                        borderSkipped:        false,
                        hoverBackgroundColor: '#7C3AED'
                    },
                    {
                        label: 'Lighting',
                        data:  [15, 20, 18, 22, 25, 30, 28],
                        backgroundColor:      '#10B981',
                        borderRadius:         0,
                        borderSkipped:        false,
                        hoverBackgroundColor: '#059669'
                    },
                    {
                        label: 'Appliances',
                        data:  [10, 15, 20, 10, 12, 18, 20],
                        backgroundColor:      '#F97316',
                        borderRadius:         { topLeft: 0, topRight: 0, bottomLeft: 6, bottomRight: 6 },
                        borderSkipped:        false,
                        hoverBackgroundColor: '#EA580C'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation:   { duration: 1000, easing: 'easeOutQuart' },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend:  { display: false },
                    tooltip: {
                        ...tooltipBase,
                        callbacks: {
                            label: ctx => `  ${ctx.dataset.label}: ${ctx.parsed.y} kWh`
                        }
                    }
                },
                scales: {
                    x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { font: { size: 10 }, color: '#9CA3AF' } },
                    y: { stacked: true, display: false }
                }
            }
        });
    }

    // ─── 3. Device Usage Duration Bar Chart (Firebase-driven) ─────────────────
    const ctxUsage = document.getElementById('deviceUsageChart');
    let usageChart = null;
    if (ctxUsage) {
        usageChart = new Chart(ctxUsage, {
            type: 'bar',
            data: {
                labels: ['Living Room', 'Bedroom', 'Fan'],
                datasets: [{
                    label:  'Usage (minutes)',
                    data:   [0, 0, 0],
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.85)',
                        'rgba(16, 185, 129, 0.85)',
                        'rgba(249, 115, 22, 0.85)'
                    ],
                    hoverBackgroundColor: [
                        '#8B5CF6',
                        '#10B981',
                        '#F97316'
                    ],
                    borderRadius:  8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation:   { duration: 900, easing: 'easeOutQuart' },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend:  { display: false },
                    tooltip: {
                        ...tooltipBase,
                        callbacks: {
                            label: ctx => {
                                const secs = ctx.parsed.y;
                                const mins = Math.floor(secs / 60);
                                const s    = secs % 60;
                                return `  Usage: ${mins}m ${s}s`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid:   { display: false },
                        border: { display: false },
                        ticks:  { font: { size: 11 }, color: '#9CA3AF' }
                    },
                    y: {
                        grid:         { color: 'rgba(0,0,0,0.04)' },
                        border:       { display: false },
                        ticks: {
                            font:     { size: 10 },
                            color:    '#9CA3AF',
                            callback: val => {
                                const m = Math.floor(val / 60);
                                return m + 'm';
                            }
                        },
                        suggestedMin: 0
                    }
                }
            }
        });

        // Expose update function for app.js
        window.updateUsageChart = (livingRoomSec, bedroomSec, fanSec) => {
            if (!usageChart) return;
            usageChart.data.datasets[0].data = [livingRoomSec, bedroomSec, fanSec];
            usageChart.update('active');
        };
    }

    // ─── 4. Power Consumption Pie Chart (Firebase-driven) ─────────────────────
    const ctxPie = document.getElementById('powerPieChart');
    let pieChart = null;
    if (ctxPie) {
        pieChart = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Living Room', 'Bedroom', 'Fan'],
                datasets: [{
                    label:           'Power (Wh)',
                    data:            [0, 0, 0],
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.9)',
                        'rgba(16, 185, 129, 0.9)',
                        'rgba(249, 115, 22, 0.9)'
                    ],
                    hoverBackgroundColor: ['#8B5CF6', '#10B981', '#F97316'],
                    borderWidth:  0,
                    hoverOffset:  10,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                animation: { duration: 1000, easing: 'easeInOutCubic' },
                plugins: {
                    legend: {
                        display:  true,
                        position: 'bottom',
                        labels: {
                            font:         { size: 11, family: "'Inter', sans-serif" },
                            color:        '#6B7280',
                            padding:      12,
                            usePointStyle: true,
                            pointStyle:    'circle'
                        }
                    },
                    tooltip: {
                        ...tooltipBase,
                        callbacks: {
                            label: ctx => {
                                const val   = ctx.parsed;
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct   = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                                return `  ${ctx.label}: ${val.toFixed(2)} Wh (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Expose update function for app.js
        window.updatePowerChart = (livingRoomWh, bedroomWh, fanWh) => {
            if (!pieChart) return;
            pieChart.data.datasets[0].data = [livingRoomWh, bedroomWh, fanWh];
            pieChart.update('active');
        };
    }

    // ─── Helper: Build Line Chart Data ─────────────────────────────────────────
    function buildLineData(source) {
        return {
            labels: source.labels,
            datasets: [
                {
                    label:                'Production (kWh)',
                    data:                 source.production,
                    borderColor:          '#8B5CF6',
                    backgroundColor:      createGradient(ctxLine, '#8B5CF6'),
                    borderWidth:          2.5,
                    tension:              0.45,
                    fill:                 true,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor:     '#8B5CF6',
                    pointBorderWidth:     2,
                    pointRadius:          4,
                    pointHoverRadius:     6,
                    pointHoverBorderWidth: 2.5
                },
                {
                    label:                'Consumption (kWh)',
                    data:                 source.consumption,
                    borderColor:          '#F97316',
                    backgroundColor:      'transparent',
                    borderWidth:          2.5,
                    tension:              0.45,
                    fill:                 false,
                    borderDash:           [6, 4],
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor:     '#F97316',
                    pointBorderWidth:     2,
                    pointRadius:          4,
                    pointHoverRadius:     6
                }
            ]
        };
    }

    // ─── Helper: Gradient Fill ─────────────────────────────────────────────────
    function createGradient(ctx, color) {
        if (!ctx) return 'transparent';
        const canvas = ctx.getContext ? ctx : ctx.canvas;
        const chart  = canvas ? canvas.getContext('2d') : null;
        if (!chart) return 'transparent';
        const gradient = chart.createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0,   'rgba(139, 92, 246, 0.18)');
        gradient.addColorStop(0.6, 'rgba(139, 92, 246, 0.04)');
        gradient.addColorStop(1,   'rgba(139, 92, 246, 0)');
        return gradient;
    }
});
