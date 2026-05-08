/* ══════════════════════════════════════════════════════════════
   chart.js — Sâm Lốc · Biến động chart page
   Depends on: app.js (history, numP, rules, TLBL)
══════════════════════════════════════════════════════════════ */

const BD_PALETTE = [
    '#378ADD', '#639922', '#D85A30', '#D4537E',
    '#7F77DD', '#1D9E75', '#BA7517', '#E24B4A',
];
const BD_DASH = [[], [6, 3], [2, 2], [4, 2, 1, 2], [8, 4], [3, 3], [1, 2], [6, 2, 2, 2]];

let bdChart = null;

// ══════════════════════════════════════════════════════════════
// MAIN RENDER
// ══════════════════════════════════════════════════════════════
function renderChartPage() {
    const el = document.getElementById('bd-content');
    if (!history.length) {
        el.innerHTML = '<div class="bd-empty">Chưa có ván nào — hãy thêm ít nhất 1 ván trong tab 🃏 Chơi rồi quay lại đây!</div>';
        return;
    }

    const names = history[history.length - 1].names.slice(0, numP);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Cumulative scores
    const cumul = Array.from({ length: numP }, () => [0]);
    history.forEach(v => {
        for (let i = 0; i < numP; i++)
            cumul[i].push((cumul[i][cumul[i].length - 1] || 0) + (v.scores[i] || 0));
    });
    const totals = cumul.map(c => c[c.length - 1]);
    const order = [...Array(numP).keys()].sort((a, b) => totals[b] - totals[a]);

    el.innerHTML =
        buildStats(names, totals, order) +
        buildLegend(names, totals) +
        `<div class="bd-chart-wrap"><canvas id="bdChart"></canvas></div>` +
        buildLog(names);

    // Destroy old chart before creating new one
    if (bdChart) { try { bdChart.destroy(); } catch (e) { } bdChart = null; }
    drawChart(names, cumul, isDark);
}

// ══════════════════════════════════════════════════════════════
// STATS PANEL
// ══════════════════════════════════════════════════════════════
function buildStats(names, totals, order) {
    const leader = order[0];
    const loser = order[order.length - 1];
    const maxGain = Math.max(...history.map(v => Math.max(...v.scores.slice(0, numP))));
    const maxLoss = Math.min(...history.map(v => Math.min(...v.scores.slice(0, numP))));
    const trim = s => s.length > 8 ? s.slice(0, 7) + '…' : s;

    let html = '<div class="bd-stats">';
    html += stat('Tổng ván', history.length, 'neu');
    html += stat('Dẫn đầu', `${trim(names[leader])} <small>+${Math.round(totals[leader])}</small>`, 'pos', names[leader]);
    if (numP > 1)
        html += stat('Bét bảng', `${trim(names[loser])} <small>${Math.round(totals[loser])}</small>`, 'neg', names[loser]);
    html += stat('Thắng đậm nhất', '+' + Math.round(maxGain), 'pos');
    if (Math.round(maxLoss) < 0)
        html += stat('Thua đau nhất', Math.round(maxLoss), 'neg');
    html += '</div>';
    return html;
}

function stat(label, val, cls, title = '') {
    return `<div class="bd-stat">
    <div class="bd-stat-label">${label}</div>
    <div class="bd-stat-val ${cls}"${title ? ' title="' + title + '"' : ''}>${val}</div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// LEGEND
// ══════════════════════════════════════════════════════════════
function buildLegend(names, totals) {
    let html = '<div class="bd-legend">';
    names.forEach((n, i) => {
        const t = totals[i];
        const clr = BD_PALETTE[i % BD_PALETTE.length];
        html += `<div class="bd-legend-item">
      <div class="bd-legend-dot" style="background:${clr}"></div>
      <span>${n} <strong style="color:${t >= 0 ? 'var(--green)' : 'var(--red)'}">${t >= 0 ? '+' : ''}${Math.round(t)}</strong></span>
    </div>`;
    });
    return html + '</div>';
}

// ══════════════════════════════════════════════════════════════
// LOG
// ══════════════════════════════════════════════════════════════
function buildLog(names) {
    const items = buildBdLog(history, names);
    if (!items.length) return '';
    return `<hr class="bd-divider">
    <div class="bd-section-title">Log "biến" nổi bật 🎭</div>
    <div class="bd-log">${items.join('')}</div>`;
}

function buildBdLog(hist, names) {
    const items = [];
    const perPersonMax = names.map((_, pi) => Math.max(...hist.map(v => v.scores[pi] || 0)));
    const perPersonMin = names.map((_, pi) => Math.min(...hist.map(v => v.scores[pi] || 0)));

    hist.forEach((v, vi) => {
        const vLabel = `V${vi + 1}`;

        // Sâm ván
        if (v.mode === 'xam') {
            const xamIdx = v.tags.findIndex(tl => tl.some(t => (typeof t === 'string' ? t : t.tag) === 'X'));
            const chanIdx = v.tags.findIndex(tl => tl.some(t => (typeof t === 'string' ? t : t.tag) === 'Chan'));
            const xcIdx = v.tags.findIndex(tl => tl.some(t => (typeof t === 'string' ? t : t.tag) === 'Xchan'));
            if (xamIdx >= 0 && xcIdx < 0) {
                const earn = v.scores[xamIdx];
                items.push(logRow(vLabel, 'b-xam',
                    `<strong>${names[xamIdx]}</strong> báo sâm thành công 🎯 — bỏ túi <strong style="color:var(--green)">+${Math.round(earn)}</strong>, mỗi người còn lại mất <strong style="color:var(--red)">-${Math.round(earn / (names.length - 1))}</strong>`));
            } else if (xcIdx >= 0 && chanIdx >= 0) {
                const penalty = Math.abs(v.scores[xcIdx]);
                items.push(logRow(vLabel, 'b-xam',
                    `<strong>${names[xcIdx]}</strong> báo sâm thất bại 😬 — bị <strong>${names[chanIdx]}</strong> chặn, mất <strong style="color:var(--red)">-${Math.round(penalty)}</strong>`));
            }
            return;
        }

        // Normal ván events
        const sc = v.scores.slice(0, names.length);
        const maxSc = Math.max(...sc);
        const minSc = Math.min(...sc);
        const winner = sc.indexOf(maxSc);
        const biggest = sc.indexOf(minSc);

        if (maxSc > 0 && maxSc === perPersonMax[winner])
            items.push(logRow(vLabel, 'b-win', `<strong>${names[winner]}</strong> thắng đậm nhất cả buổi 🏆 — thu về <strong style="color:var(--green)">+${Math.round(maxSc)}</strong>`));
        else if (maxSc >= 20)
            items.push(logRow(vLabel, 'b-win', `<strong>${names[winner]}</strong> thắng đậm 💰 — +${Math.round(maxSc)}`));

        if (minSc < 0 && minSc === perPersonMin[biggest])
            items.push(logRow(vLabel, 'b-chay', `<strong>${names[biggest]}</strong> thua đau nhất cả buổi 😭 — mất <strong style="color:var(--red)">${Math.round(minSc)}</strong>`));
        else if (minSc <= -20 && biggest !== winner)
            items.push(logRow(vLabel, 'b-chay', `<strong>${names[biggest]}</strong> thua đau 💸 — mất ${Math.round(minSc)}`));

        // Tứ quý
        const tqDanh = v.tags.findIndex(tl => tl.some(t => (typeof t === 'string' ? t : t.tag) === 'Q'));
        const tqBat = v.tags.findIndex(tl => tl.some(t => (typeof t === 'string' ? t : t.tag) === 'Qbat'));
        if (tqDanh >= 0 && tqBat >= 0)
            items.push(logRow(vLabel, 'b-tq', `<strong>${names[tqDanh]}</strong> đập tứ quý 🔥 — <strong>${names[tqBat]}</strong> bị bắt`));

        // Cháy bài
        v.tags.forEach((tl, ci) => {
            if (tl.some(t => (typeof t === 'string' ? t : t.tag) === 'C'))
                items.push(logRow(vLabel, 'b-chay', `<strong>${names[ci]}</strong> cháy bài ⚡ — bị cộng ${rules.chay} lá phạt`));
        });
    });

    return items.slice(-40);
}

function logRow(van, badgeCls, msg) {
    const badgeLabel = { 'b-xam': 'Sâm', 'b-tq': 'Tứ quý', 'b-chay': 'Phạt', 'b-win': 'Thắng' }[badgeCls] || '';
    return `<div class="bd-log-item">
    <span class="bd-log-van">${van}</span>
    <span class="bd-log-msg">${msg}</span>
    <span class="bd-log-badge ${badgeCls}">${badgeLabel}</span>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// CHART.JS RENDER
// ══════════════════════════════════════════════════════════════
function drawChart(names, cumul, isDark) {
    const ctx = document.getElementById('bdChart');
    if (!ctx) return;

    const gridColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
    const zeroLine = isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)';
    const tickColor = '#888780';
    const tooltipBg = isDark ? '#252523' : '#fff';
    const tooltipTitle = isDark ? '#e8e6df' : '#1a1a18';
    const tooltipBody = isDark ? '#b0aead' : '#444';
    const tooltipBorder = isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)';

    const labels = ['Đầu', ...history.map((_, i) => 'V' + (i + 1))];
    const ptRadius = history.length <= 15 ? 4 : (history.length <= 30 ? 3 : 2);

    const datasets = names.map((n, i) => ({
        label: n,
        data: cumul[i],
        borderColor: BD_PALETTE[i % BD_PALETTE.length],
        backgroundColor: BD_PALETTE[i % BD_PALETTE.length] + '18',
        borderWidth: 2.5,
        pointRadius: ptRadius,
        pointHoverRadius: 7,
        pointBackgroundColor: BD_PALETTE[i % BD_PALETTE.length],
        fill: false,
        tension: 0.32,
        borderDash: BD_DASH[i % BD_DASH.length],
    }));

    bdChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            animation: { duration: 400 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: tooltipBg,
                    titleColor: tooltipTitle,
                    bodyColor: tooltipBody,
                    borderColor: tooltipBorder,
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y >= 0 ? '+' : ''}${Math.round(ctx.parsed.y)}`,
                    },
                },
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: tickColor, font: { size: 11 }, maxRotation: 0, autoSkip: history.length > 18 },
                },
                y: {
                    grid: {
                        color: ctx2 => ctx2.tick.value === 0 ? zeroLine : gridColor,
                        lineWidth: ctx2 => ctx2.tick.value === 0 ? 1.5 : 1,
                    },
                    ticks: {
                        color: tickColor,
                        font: { size: 11 },
                        callback: v => (v >= 0 ? '+' : '') + Math.round(v),
                    },
                },
            },
        },
    });
}