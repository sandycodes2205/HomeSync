// charts.js — Chart.js Implementations for HomeSync Dashboard
// Features: animated line-draw, tooltip 3D float, rounded bar segments

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart === 'undefined') {
        console.warn("HomeSync Charts: Chart.js not loaded.");
        return;
    }

    // ─── Global Chart Defaults ─────────────────────────────────────────────────
    Chart.defaults.font.family    = "'Inter', sans-serif";
    Chart.defaults.font.size      = 11;
    Chart.defaults.color          = '#6B7280';
    Chart.defaults.plugins.legend.display = false;

    // ─── 1. Sun Energy Line Chart (animated draw) ──────────────────────────────
    const ctxLine = document.getElementById('energyLineChart');
    if (ctxLine) {
        const data_today = {
            labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '23:59'],
            production:  [0, 0, 2, 38, 72, 55, 18, 1, 0],
            consumption: [10, 8, 14, 22, 35, 42, 48, 35, 15]
        };
        const data_week = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            production:  [42, 58, 65, 30, 70, 80, 55],
            consumption: [50, 60, 55, 65, 72, 80, 62]
        };

        const lineChart = new Chart(ctxLine, {
            type: 'line',
            data: buildLineData(data_today),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1200,
                    easing: 'easeInOutCubic',
                    // Animate by drawing the line gradually
                    onProgress: function(animation) {
                        // Subtle shadow pulse during draw
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#FFFFFF',
                        borderColor:     'rgba(0,0,0,0.08)',
                        borderWidth:     1,
                        titleColor:      '#1F2937',
                        bodyColor:       '#6B7280',
                        titleFont:        { weight: '700', size: 12 },
                        bodyFont:         { size: 11 },
                        padding:          12,
                        cornerRadius:     12,
                        boxPadding:       5,
                        // "3D float" via shadow (CSS trick via plugin)
                        displayColors:   true,
                        callbacks: {
                            label: function(ctx) {
                                return `  ${ctx.dataset.label}: ${ctx.parsed.y} kWh`;
                            }
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
                        grid: {
                            color:     'rgba(0,0,0,0.04)',
                            lineWidth: 1
                        },
                        border: { display: false, dash: [4, 4] },
                        ticks: { font: { size: 10 }, color: '#9CA3AF', stepSize: 20 },
                        suggestedMin: 0,
                        suggestedMax: 90
                    }
                }
            }
        });

        // Period switcher
        const periodSelect = document.getElementById('energy-period-select');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                const dataset = periodSelect.value === 'week' ? data_week : data_today;
                const newData = buildLineData(dataset);
                lineChart.data.labels         = newData.labels;
                lineChart.data.datasets[0].data = newData.datasets[0].data;
                lineChart.data.datasets[1].data = newData.datasets[1].data;
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
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'HVAC',
                        data: [30, 45, 28, 50, 40, 60, 55],
                        backgroundColor: '#8B5CF6',
                        borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                        borderSkipped: false,
                        hoverBackgroundColor: '#7C3AED'
                    },
                    {
                        label: 'Lighting',
                        data: [15, 20, 18, 22, 25, 30, 28],
                        backgroundColor: '#10B981',
                        borderRadius: 0,
                        borderSkipped: false,
                        hoverBackgroundColor: '#059669'
                    },
                    {
                        label: 'Appliances',
                        data: [10, 15, 20, 10, 12, 18, 20],
                        backgroundColor: '#F97316',
                        borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 6, bottomRight: 6 },
                        borderSkipped: false,
                        hoverBackgroundColor: '#EA580C'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#FFFFFF',
                        borderColor:     'rgba(0,0,0,0.08)',
                        borderWidth:     1,
                        titleColor:      '#1F2937',
                        bodyColor:       '#6B7280',
                        titleFont:       { weight: '700', size: 12 },
                        bodyFont:        { size: 11 },
                        padding:         12,
                        cornerRadius:    12,
                        boxPadding:      5,
                        callbacks: {
                            label: ctx => `  ${ctx.dataset.label}: ${ctx.parsed.y} kWh`
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid:    { display: false },
                        border:  { display: false },
                        ticks:   { font: { size: 10 }, color: '#9CA3AF' }
                    },
                    y: {
                        stacked: true,
                        display: false
                    }
                }
            }
        });
    }

    // ─── Helper: Build Line Chart Data Object ──────────────────────────────────
    function buildLineData(source) {
        return {
            labels: source.labels,
            datasets: [
                {
                    label: 'Production (kWh)',
                    data:  source.production,
                    borderColor:     '#8B5CF6',
                    backgroundColor: createGradient(ctxLine, '#8B5CF6'),
                    borderWidth:     2.5,
                    tension:         0.45,
                    fill:            true,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor:     '#8B5CF6',
                    pointBorderWidth:     2,
                    pointRadius:          4,
                    pointHoverRadius:     6,
                    pointHoverBorderWidth: 2.5
                },
                {
                    label: 'Consumption (kWh)',
                    data:  source.consumption,
                    borderColor:     '#F97316',
                    backgroundColor: 'transparent',
                    borderWidth:     2.5,
                    tension:         0.45,
                    fill:            false,
                    borderDash:      [6, 4],
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
