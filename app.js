/* ══════════════════════════════════════════════════════════════
   app.js — Sâm Lốc · Core logic
══════════════════════════════════════════════════════════════ */

// ── localStorage keys ──────────────────────────────────────────
const LS_THEME = 'xamloc_theme';
const LS_RULES = 'xamloc_rules';
const LS_HISTORY = 'xamloc_history';
const LS_PLAYERS = 'xamloc_players';

// ── Badge maps ─────────────────────────────────────────────────
const TMAP = { X: 'bx', Q: 'bq', Qbat: 'bc', C: 'bc', Chan: 'bchan', Xchan: 'bc' };
const TLBL = { X: 'Sâm ✓', Q: 'T.quý 🔥', Qbat: 'Bị bắt 🔥', C: 'Cháy', Chan: 'Chặn 🛡', Xchan: 'Bị chặn' };

// ── State ──────────────────────────────────────────────────────
let rules = { la: 0.5, xw: 10, xl: 30, tq: 5, tqOn: true, chay: 10, chayOn: true };
let history = [];
let numP = 4;
let pnames = ['Người 1', 'Người 2', 'Người 3', 'Người 4'];
let mode = 'normal';
let selXam = -1, selChan = -1, selTqDanh = -1, selTqBat = -1, selChay = [], selWin = -1;

// ══════════════════════════════════════════════════════════════
// DARK MODE
// ══════════════════════════════════════════════════════════════
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
    document.getElementById('theme-toggle-btn').title = theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(LS_THEME, next);
    showToast(next === 'dark' ? '🌙 Chế độ tối' : '☀️ Chế độ sáng', 1600);
    if (document.getElementById('page-chart').classList.contains('show')) {
        setTimeout(renderChartPage, 50);
    }
}

// ══════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════
function showToast(msg, duration) {
    duration = duration || 2500;
    const el = document.getElementById('toast-center');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), duration);
}

// ══════════════════════════════════════════════════════════════
// RIPPLE
// ══════════════════════════════════════════════════════════════
function spawnRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = Math.max(rect.width, rect.height) * 2.2;
    const x = (e ? e.clientX - rect.left : rect.width / 2) - size / 2;
    const y = (e ? e.clientY - rect.top : rect.height / 2) - size / 2;
    r.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(r);
    setTimeout(() => r.remove(), 650);
}

// ══════════════════════════════════════════════════════════════
// CONFETTI
// ══════════════════════════════════════════════════════════════
const CONFETTI_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function burstConfetti(originEl) {
    const rect = originEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top;
    const wrap = document.createElement('div');
    wrap.className = 'confetti-wrap';
    document.body.appendChild(wrap);
    for (let i = 0; i < 22; i++) {
        const dot = document.createElement('div');
        dot.className = 'confetti-dot';
        const angle = (Math.random() * 220 - 110) * Math.PI / 180;
        const dist = 60 + Math.random() * 90;
        const tx = Math.sin(angle) * dist;
        const ty = -Math.cos(angle) * dist;
        dot.style.cssText = `left:${cx}px;top:${cy}px;background:${CONFETTI_COLORS[i % CONFETTI_COLORS.length]};--tx:${tx}px;--ty:${ty}px;--rot:${Math.random() * 540 - 270}deg;animation-delay:${Math.random() * .08}s;animation-duration:${.7 + Math.random() * .35}s;`;
        wrap.appendChild(dot);
    }
    setTimeout(() => wrap.remove(), 1400);
}

// ══════════════════════════════════════════════════════════════
// BUTTON ANIMATIONS
// ══════════════════════════════════════════════════════════════
function handleAddVan(e) {
    const btn = document.getElementById('add-van-btn');
    const textEl = btn.querySelector('.btn-text');
    const iconEl = btn.querySelector('.btn-icon');
    spawnRipple(btn, e);
    btn.classList.add('loading');
    btn.disabled = true;
    setTimeout(() => {
        const result = addVan();
        if (result === false) { btn.classList.remove('loading'); btn.disabled = false; return; }
        btn.classList.remove('loading');
        btn.classList.add('success');
        iconEl.innerHTML = '<span class="check-icon">✓</span>';
        textEl.textContent = `Ván ${history.length} đã lưu!`;
        burstConfetti(btn);
        setTimeout(() => {
            btn.classList.remove('success');
            btn.disabled = false;
            iconEl.innerHTML = '＋';
            textEl.textContent = 'Thêm ván này';
        }, 1400);
    }, 280);
}

function animateSaveBtn(doWork) {
    const btn = document.getElementById('save-rules-btn');
    const textEl = btn.querySelector('.btn-text');
    const iconEl = btn.querySelector('.btn-icon');
    btn.classList.add('loading');
    btn.disabled = true;
    setTimeout(() => {
        doWork();
        btn.classList.remove('loading');
        btn.classList.add('success');
        iconEl.innerHTML = '<span class="check-icon" style="display:inline-block;transform:scale(0) rotate(-20deg);transition:transform .25s cubic-bezier(.34,1.56,.64,1)">✓</span>';
        textEl.textContent = 'Đã lưu!';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const ck = btn.querySelector('.check-icon');
            if (ck) ck.style.transform = 'scale(1) rotate(0deg)';
        }));
        setTimeout(() => {
            btn.classList.remove('success');
            btn.disabled = false;
            iconEl.innerHTML = '💾';
            textEl.textContent = 'Lưu luật chơi';
        }, 2000);
    }, 320);
}

// ══════════════════════════════════════════════════════════════
// MODAL
// ══════════════════════════════════════════════════════════════
function showModal({ icon = 'ℹ️', title, msg, buttons = [] }) {
    document.getElementById('modal-icon').textContent = icon;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-msg').textContent = msg;
    const acts = document.getElementById('modal-actions');
    acts.innerHTML = '';
    buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'modal-btn ' + (b.cls || 'modal-btn-primary');
        btn.textContent = b.label;
        btn.onclick = () => { closeModal(); if (b.cb) b.cb(); };
        acts.appendChild(btn);
    });
    const ov = document.getElementById('modal-overlay');
    ov.style.display = 'flex';
    requestAnimationFrame(() => ov.classList.add('show'));
}

function closeModal() {
    const ov = document.getElementById('modal-overlay');
    ov.classList.remove('show');
    setTimeout(() => { ov.style.display = 'none'; }, 200);
}

function modalClickOutside(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function showAlert({ icon = 'ℹ️', title = 'Thông báo', msg, onOk }) {
    showModal({ icon, title, msg, buttons: [{ label: 'Đồng ý', cls: 'modal-btn-primary', cb: onOk }] });
}

function showConfirm({ icon = '❓', title = 'Xác nhận', msg, onYes, onNo, yesDanger = false }) {
    showModal({
        icon, title, msg,
        buttons: [
            { label: 'Hủy', cls: 'modal-btn-cancel', cb: onNo },
            { label: 'Xác nhận', cls: yesDanger ? 'modal-btn-danger' : 'modal-btn-primary', cb: onYes },
        ],
    });
}

// ══════════════════════════════════════════════════════════════
// PERSIST
// ══════════════════════════════════════════════════════════════
function save() {
    for (let i = 0; i < numP; i++) {
        const el = document.getElementById('pn' + i);
        if (el) pnames[i] = el.value || ('Người ' + (i + 1));
    }
    try {
        localStorage.setItem(LS_RULES, JSON.stringify(rules));
        localStorage.setItem(LS_HISTORY, JSON.stringify(history));
        localStorage.setItem(LS_PLAYERS, JSON.stringify({ numP, pnames }));
    } catch (e) { console.warn('localStorage full', e); }
}

function load() {
    try {
        const r = localStorage.getItem(LS_RULES);
        if (r) {
            const p = JSON.parse(r);
            rules = {
                la: p.la !== undefined ? p.la : rules.la,
                xw: p.xw !== undefined ? p.xw : rules.xw,
                xl: p.xl !== undefined ? p.xl : rules.xl,
                tq: p.tq !== undefined ? p.tq : rules.tq,
                tqOn: p.tqOn !== undefined ? p.tqOn : rules.tqOn,
                chay: p.chay !== undefined && p.chay >= 1 ? Math.round(p.chay) : rules.chay,
                chayOn: p.chayOn !== undefined ? p.chayOn : rules.chayOn,
            };
        }
        const h = localStorage.getItem(LS_HISTORY);
        if (h) history = JSON.parse(h);
        const pl = localStorage.getItem(LS_PLAYERS);
        if (pl) { const d = JSON.parse(pl); numP = d.numP || 4; pnames = d.pnames || pnames; }
    } catch (e) { console.warn('load error', e); }
}

function updateStorageInfo() {
    try {
        const used = JSON.stringify(localStorage).length;
        const kb = (used / 1024).toFixed(1);
        document.getElementById('storage-info').textContent =
            `Đang dùng ~${kb} KB localStorage · ${history.length} ván đã lưu`;
        document.getElementById('storage-dot').className =
            used > 4000000 ? 'storage-dot warn' : 'storage-dot';
    } catch (e) { }
}

// ══════════════════════════════════════════════════════════════
// NAV
// ══════════════════════════════════════════════════════════════
function goPage(p) {
    ['game', 'admin', 'data', 'chart'].forEach(id => {
        document.getElementById('page-' + id).className = 'page' + (id === p ? ' show' : '');
        document.getElementById('nav-' + id).className = 'nav-btn' + (id === p ? ' active' : '');
    });
    if (p === 'admin') loadAdminFields();
    if (p === 'data') updateStorageInfo();
    if (p === 'chart') renderChartPage();
}

// ══════════════════════════════════════════════════════════════
// GAME SETUP
// ══════════════════════════════════════════════════════════════
function setPlayers(n) {
    numP = n;
    ['pbtn2', 'pbtn3', 'pbtn4'].forEach(id => {
        document.getElementById(id).className =
            'btn-outline' + (parseInt(id.replace('pbtn', '')) === n ? ' active' : '');
    });
    selXam = -1; selChan = -1; selTqDanh = -1; selTqBat = -1; selChay = []; selWin = -1;
    renderNames(); renderGrid(); renderXamPickers(); save();
}

function renderNames() {
    const el = document.getElementById('player-names');
    el.innerHTML = '';
    for (let i = 0; i < numP; i++) {
        const v = pnames[i] || ('Người ' + (i + 1));
        el.innerHTML += `<div class="pname-wrap">
      <input type="text" id="pn${i}" value="${v}"
        onchange="pnames[${i}]=this.value;save();renderXamPickers();renderGrid();"
        placeholder="Nhập tên ${i + 1}">
    </div>`;
    }
}

function getNames() {
    return Array.from({ length: numP }, (_, i) =>
        document.getElementById('pn' + i)?.value || `Người ${i + 1}`);
}

function renderGrid(reset = false) {
    const names = getNames();
    const g = document.getElementById('van-grid');
    const prevVals = reset
        ? Array(numP).fill('')
        : Array.from({ length: numP }, (_, i) => document.getElementById('c' + i)?.value ?? '');

    const allFilled = prevVals.every((v, i) =>
        (rules.chayOn && selChay.includes(i)) || (v !== '' && v !== null && v !== undefined));

    const filledVals = prevVals.map((v, i) => {
        if (rules.chayOn && selChay.includes(i)) return Infinity;
        if (v === '' || v === null || v === undefined) return Infinity;
        const n = parseInt(v);
        return isNaN(n) ? Infinity : n;
    });
    const minVal = Math.min(...filledVals);
    const tiedIdxs = filledVals.map((v, i) => v === minVal && minVal !== Infinity ? i : -1).filter(i => i >= 0);

    const displayWin = (allFilled && minVal !== Infinity && tiedIdxs.length > 0)
        ? (tiedIdxs.length === 1 ? tiedIdxs[0] : (tiedIdxs.includes(selWin) ? selWin : -1))
        : -1;

    g.innerHTML = '';
    for (let i = 0; i < numP; i++) {
        const isChaybai = rules.chayOn && selChay.includes(i);
        const isWin = !isChaybai && i === displayWin;
        const isTied = !isChaybai && tiedIdxs.includes(i) && tiedIdxs.length > 1 && !isWin;
        let cardClass = 'van-card';
        if (isChaybai) cardClass += ' van-card-chay';
        else if (isWin) cardClass += ' van-card-win';

        g.innerHTML += `<div class="${cardClass}" id="card${i}">
      <div class="p-name">${names[i]}</div>
      ${isChaybai
                ? `<button class="chay-badge chay-badge-btn" onclick="toggleChay(${i})" title="Bấm để bỏ cháy bài">⚡ Cháy bài <span style="font-size:12px;opacity:.7;">✕</span></button>`
                : `<input type="number" id="c${i}" value="${prevVals[i]}" min="0" max="10" placeholder="nhập lá"
              oninput="this.classList.remove('input-error');this.value=this.value===''?'':(Math.min(10,Math.max(0,parseInt(this.value)||0)));updateCardState(${i},this.value)">
           <div class="input-hint">số lá còn lại (0–10)</div>
           ${isWin
                    ? `<div class="win-badge">🏆 Thắng!</div>`
                    : isTied
                        ? `<button class="pick-win-btn" onclick="pickWin(${i})">🏆 Chọn thắng</button>`
                        : ''}`
            }
    </div>`;
    }
}

function pickWin(i) { selWin = i; renderGrid(); }

function setMode(m) {
    mode = m;
    document.getElementById('tab-normal').className = 'mode-tab' + (m === 'normal' ? ' active' : '');
    document.getElementById('tab-xam').className = 'mode-tab' + (m === 'xam' ? ' active' : '');
    document.getElementById('mode-normal').style.display = m === 'normal' ? 'block' : 'none';
    document.getElementById('mode-xam').style.display = m === 'xam' ? 'block' : 'none';
    renderBonusPickers();
}

// ══════════════════════════════════════════════════════════════
// XAM PICKERS
// ══════════════════════════════════════════════════════════════
function renderXamPickers() {
    const names = getNames();
    let xp = '', cp = '';
    for (let i = 0; i < numP; i++) {
        xp += `<button class="picker-btn${selXam === i ? ' sel-xam' : ''}" onclick="pickXam(${i})">${names[i]}</button>`;
        if (i !== selXam)
            cp += `<button class="picker-btn${selChan === i ? ' sel-chan' : ''}" onclick="pickChan(${i})">${names[i]}</button>`;
    }
    document.getElementById('xam-picker').innerHTML = xp;
    document.getElementById('chan-picker').innerHTML = cp;
    const h = document.getElementById('hint-chan');
    if (h) h.textContent = `Người chặn +${rules.xl}đ · Người sâm -${rules.xl}đ · Người khác không đổi`;
    renderBonusPickers();
}

function renderBonusPickers() {
    const names = getNames();
    const show = rules.tqOn || rules.chayOn;
    let html = '';

    if (rules.tqOn) {
        const danhBtns = names.slice(0, numP).map((n, i) =>
            `<button class="picker-btn${selTqDanh === i ? ' sel-tq' : ''}" onclick="pickTqDanh(${i})">${n}</button>`).join('');
        const batBtns = names.slice(0, numP).map((n, i) =>
            i === selTqDanh ? '' :
                `<button class="picker-btn${selTqBat === i ? ' sel-chan' : ''}" onclick="pickTqBat(${i})">${n}</button>`).join('');
        html += `<div class="bonus-block tq-block">
      <div class="tq-half">
        <div class="bonus-label">🔥 Người đánh tứ quý <span style="color:var(--green);font-size:11px;">+${rules.tq}đ</span></div>
        <div class="picker-grid">${danhBtns}</div>
      </div>
      <div class="tq-divider"><span>bắt</span></div>
      <div class="tq-half">
        <div class="bonus-label">💥 Người bị bắt <span style="color:var(--red);font-size:11px;">-${rules.tq}đ</span></div>
        <div class="picker-grid">${batBtns || '<span class="tq-placeholder">← Chọn người đánh trước</span>'}</div>
      </div>
    </div>`;
    }

    if (rules.chayOn) {
        const btns = names.slice(0, numP).map((n, i) =>
            `<button class="picker-btn${selChay.includes(i) ? ' sel-chay' : ''}" onclick="toggleChay(${i})">${n}</button>`).join('');
        html += `<div class="bonus-block">
      <div class="bonus-label">⚡ Cháy bài <span style="color:var(--red);font-size:11px;">+${rules.chay} lá phạt</span></div>
      <div class="picker-grid">${btns}</div>
    </div>`;
    }

    const normalInner = document.getElementById('bonus-normal-inner');
    const normalWrap = document.getElementById('bonus-normal');
    if (normalInner) normalInner.innerHTML = html;
    if (normalWrap) normalWrap.style.display = show ? 'block' : 'none';
}

function pickXam(i) {
    selXam = i; selChan = -1;
    document.getElementById('chan-panel').style.display = 'block';
    document.getElementById('xam-tc').checked = false;
    const cp = document.getElementById('chan-picker');
    cp.style.opacity = '1'; cp.style.pointerEvents = 'auto';
    renderXamPickers();
}
function pickChan(i) { selChan = (selChan === i) ? -1 : i; renderXamPickers(); }
function pickTqDanh(i) { selTqDanh = (selTqDanh === i) ? -1 : i; if (selTqBat === i) selTqBat = -1; renderBonusPickers(); }
function pickTqBat(i) { selTqBat = (selTqBat === i) ? -1 : i; renderBonusPickers(); }

function toggleChan() {
    const tc = document.getElementById('xam-tc').checked;
    if (tc) selChan = -1;
    const el = document.getElementById('chan-picker');
    el.style.opacity = tc ? '0.3' : '1';
    el.style.pointerEvents = tc ? 'none' : 'auto';
}

function toggleChay(i) {
    selChay = selChay.includes(i) ? selChay.filter(x => x !== i) : [...selChay, i];
    renderBonusPickers(); renderGrid();
}

function updateCardState(i, val) { selWin = -1; autoChay(i, val); renderGrid(); }

function autoChay(i, val) {
    if (val === '' || val === null || val === undefined) return;
    if (parseInt(val) === 10 && !selChay.includes(i)) {
        selChay = [...selChay, i]; renderBonusPickers(); renderGrid();
    } else if (parseInt(val) < 10 && selChay.includes(i)) {
        selChay = selChay.filter(x => x !== i); renderBonusPickers(); renderGrid();
    }
}

// ══════════════════════════════════════════════════════════════
// ADD VAN
// ══════════════════════════════════════════════════════════════
function gn(id) { return parseInt(document.getElementById(id)?.value) || 0; }

function addVan() {
    const names = getNames();
    const sc = new Array(numP).fill(0);
    const scLa = new Array(numP).fill(0);
    const scBonus = new Array(numP).fill(0);
    const tags = Array.from({ length: numP }, () => []);

    if (mode === 'xam') {
        if (selXam === -1) { showAlert({ icon: '🎯', title: 'Chưa chọn', msg: 'Chọn người báo sâm!' }); return false; }
        const tc = document.getElementById('xam-tc').checked;
        if (!tc && selChan === -1) { showAlert({ icon: '🛡️', title: 'Chưa chọn', msg: 'Chọn người chặn, hoặc tick "Sâm thành công"!' }); return false; }

        if (tc) {
            const earn = (numP - 1) * rules.xw;
            sc[selXam] += earn; scBonus[selXam] += earn;
            for (let i = 0; i < numP; i++) if (i !== selXam) { sc[i] -= rules.xw; scBonus[i] -= rules.xw; }
            tags[selXam].push({ tag: 'X', delta: earn });
        } else {
            sc[selXam] -= rules.xl; scBonus[selXam] -= rules.xl;
            sc[selChan] += rules.xl; scBonus[selChan] += rules.xl;
            tags[selXam].push({ tag: 'Xchan', delta: -rules.xl });
            tags[selChan].push({ tag: 'Chan', delta: +rules.xl });
        }

    } else {
        // Validate inputs
        for (let i = 0; i < numP; i++) {
            if (rules.chayOn && selChay.includes(i)) continue;
            const el = document.getElementById('c' + i);
            if (!el || el.value === '' || el.value === null) {
                if (el) el.classList.add('input-error');
                showAlert({ icon: '⚠️', title: 'Chưa nhập đủ', msg: `${names[i]} chưa nhập số lá bài!`, onOk: () => { if (el) el.focus(); } });
                return false;
            }
        }

        const cards = Array.from({ length: numP }, (_, i) => gn('c' + i));
        const effectiveCards = cards.map((c, i) => (rules.chayOn && selChay.includes(i)) ? c + rules.chay : c);
        const minVal = Math.min(...effectiveCards);
        const tiedIdxs = effectiveCards.map((v, i) => v === minVal ? i : -1).filter(i => i >= 0);

        let win;
        if (tiedIdxs.length > 1) {
            if (!tiedIdxs.includes(selWin)) {
                showAlert({ icon: '🏆', title: 'Có nhiều người cùng số lá!', msg: `Bấm nút "🏆 Chọn thắng" trên ô của người thắng để xác định ai thắng ván này.` });
                return false;
            }
            win = selWin;
        } else {
            win = tiedIdxs[0];
        }

        for (let i = 0; i < numP; i++) {
            if (i !== win) {
                const pay = effectiveCards[i] * rules.la;
                sc[win] += pay; scLa[win] += pay;
                sc[i] -= pay; scLa[i] -= pay;
            }
        }
        for (let i = 0; i < numP; i++) {
            if (rules.chayOn && selChay.includes(i))
                tags[i].push({ tag: 'C', delta: -(rules.chay * rules.la) });
        }

        // Tứ quý validation
        if (rules.tqOn) {
            if (selTqDanh !== -1 && selTqBat === -1) { showAlert({ icon: '🔥', title: 'Chưa chọn đủ', msg: 'Đã chọn người đánh tứ quý, cần chọn thêm người bị bắt!' }); return false; }
            if (selTqBat !== -1 && selTqDanh === -1) { showAlert({ icon: '🔥', title: 'Chưa chọn đủ', msg: 'Đã chọn người bị bắt, cần chọn thêm người đánh tứ quý!' }); return false; }
            if (selTqDanh !== -1 && selTqBat !== -1) {
                sc[selTqDanh] += rules.tq; scBonus[selTqDanh] += rules.tq;
                sc[selTqBat] -= rules.tq; scBonus[selTqBat] -= rules.tq;
                tags[selTqDanh].push({ tag: 'Q', delta: +rules.tq });
                tags[selTqBat].push({ tag: 'Qbat', delta: -rules.tq });
            }
        }
    }

    history.push({
        scores: sc, scLa: [...scLa], scBonus: [...scBonus],
        tags, names: [...names], mode,
        ts: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    });
    save();
    renderBoard();

    // Reset state
    selXam = -1; selChan = -1; selTqDanh = -1; selTqBat = -1; selChay = []; selWin = -1;
    document.getElementById('chan-panel').style.display = 'none';
    document.getElementById('xam-tc').checked = false;
    const cp = document.getElementById('chan-picker');
    cp.style.opacity = '1'; cp.style.pointerEvents = 'auto';
    renderGrid(true); renderXamPickers(); setMode('normal');
    document.getElementById('van-num').textContent = `Nhập ván ${history.length + 1}`;
    document.getElementById('board-wrap').style.display = 'block';
    showToast(`🃏 Ván ${history.length} đã lưu!`);
    return true;
}

// ══════════════════════════════════════════════════════════════
// BOARD
// ══════════════════════════════════════════════════════════════
function fmtDelta(delta) {
    if (delta === undefined || delta === null) return '';
    return (delta > 0 ? '+' : '') + delta + 'đ';
}

function renderBoard() {
    if (!history.length) return;
    const names = history[history.length - 1].names;
    const tot = new Array(numP).fill(0);
    history.forEach(v => v.scores.forEach((s, i) => tot[i] += s));
    const order = [...Array(numP).keys()].sort((a, b) => tot[b] - tot[a]);

    // Scoreboard
    const sb = document.getElementById('scoreboard');
    sb.innerHTML = `<div class="sb-head"><span>#</span><span>Tên</span><span style="text-align:right">Điểm</span></div>`;
    order.forEach((pi, rank) => {
        const t = tot[pi];
        sb.innerHTML += `<div class="sb-row${rank === 0 ? ' leader' : ''}">
      <span style="font-size:14px">${rank === 0 ? '🏆' : '#' + (rank + 1)}</span>
      <span class="sb-name">${names[pi]}</span>
      <span class="sb-pts ${t >= 0 ? 'pos' : 'neg'}">${t > 0 ? '+' : ''}${t}</span>
    </div>`;
    });

    // History table
    const ht = document.getElementById('hist-table');
    let th = `<tr><th>Ván</th><th>Giờ</th>`;
    names.forEach(n => th += `<th>${n}</th>`);
    th += `<th></th></tr>`;

    let rows = '';
    history.forEach((v, vi) => {
        const isLast = vi === history.length - 1;
        let tr = `<tr${isLast ? ' class="new-row"' : ''}>
      <td style="color:var(--muted);font-weight:700;font-size:11px;">${v.mode === 'xam' ? '🎯 ' : ''}V${vi + 1}</td>
      <td style="color:var(--muted);font-size:11px;white-space:nowrap;">${v.ts || ''}</td>`;

        for (let i = 0; i < numP; i++) {
            const s = v.scores[i];
            const scLa = v.scLa ? v.scLa[i] : null;
            const tagList = v.tags[i] || [];
            let badges = tagList.map(tObj => {
                const tag = typeof tObj === 'string' ? tObj : tObj.tag;
                const delta = typeof tObj === 'string' ? null : tObj.delta;
                const lbl = TLBL[tag] || tag;
                const cls = TMAP[tag] || 'bx';
                const deltaStr = delta !== null ? ` (${fmtDelta(delta)})` : '';
                return `<span class="badge ${cls}">${lbl}${deltaStr}</span>`;
            }).join('');
            let laStr = '';
            if (scLa !== null && scLa !== 0)
                laStr = `<span class="badge ${scLa > 0 ? 'bq' : 'bc'}">Lá ${fmtDelta(scLa)}</span>`;
            tr += `<td>
        <div class="score-cell">
          <span class="score-main ${s >= 0 ? 'pos' : 'neg'}">${s > 0 ? '+' : ''}${s}</span>
          <div class="score-breakdown">${laStr}${badges}</div>
        </div>
      </td>`;
        }
        tr += `<td><button class="del-btn" onclick="delVan(${vi})">🗑</button></td></tr>`;
        rows += tr;
    });

    let totRow = `<tr class="tot-row"><td>Tổng</td><td></td>`;
    for (let i = 0; i < numP; i++) {
        const t = tot[i];
        totRow += `<td class="${t >= 0 ? 'pos' : 'neg'}">${t > 0 ? '+' : ''}${t}</td>`;
    }
    totRow += `<td></td></tr>`;
    ht.innerHTML = th + rows + totRow;
}

function delVan(idx) {
    showConfirm({
        icon: '🗑️', title: 'Xóa ván?',
        msg: `Bạn có chắc muốn xóa ván ${idx + 1} không?\nHành động này không thể hoàn tác.`,
        yesDanger: true,
        onYes: () => {
            history.splice(idx, 1); save();
            if (!history.length) document.getElementById('board-wrap').style.display = 'none';
            else renderBoard();
            document.getElementById('van-num').textContent = `Nhập ván ${history.length + 1}`;
        },
    });
}

function resetGame() {
    showConfirm({
        icon: '🔄', title: 'Ván mới?',
        msg: 'Xóa toàn bộ lịch sử ván chơi và bắt đầu lại?',
        yesDanger: true,
        onYes: () => {
            history = []; save();
            document.getElementById('board-wrap').style.display = 'none';
            document.getElementById('van-num').textContent = 'Nhập ván 1';
            renderGrid(); renderXamPickers(); setMode('normal');
        },
    });
}

// ══════════════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════════════
function loadAdminFields() {
    document.getElementById('cfg-la').value = rules.la;
    document.getElementById('cfg-xw').value = rules.xw;
    document.getElementById('cfg-xl').value = rules.xl;
    document.getElementById('cfg-tq').value = rules.tq;
    document.getElementById('cfg-tq-on').checked = rules.tqOn;
    document.getElementById('cfg-chay').value = rules.chay;
    document.getElementById('cfg-chay-on').checked = rules.chayOn;
    previewRules();
}

function previewRules() {
    const la = parseFloat(document.getElementById('cfg-la').value);
    const xw = parseInt(document.getElementById('cfg-xw').value);
    const xl = parseInt(document.getElementById('cfg-xl').value);
    const tq = parseInt(document.getElementById('cfg-tq').value);
    const tqOn = document.getElementById('cfg-tq-on').checked;
    const chay = parseFloat(document.getElementById('cfg-chay').value);
    const chayOn = document.getElementById('cfg-chay-on').checked;
    let parts = [
        `<b>1 lá</b> = ${isNaN(la) ? '?' : la}đ`,
        `<b>🎯 Sâm thành công</b> = mỗi người -${isNaN(xw) ? '?' : xw}đ, người sâm +${isNaN(xw) ? '?' : xw * (numP - 1)}đ`,
        `<b>🛡 Bị chặn</b> = người sâm -${isNaN(xl) ? '?' : xl}đ, người chặn +${isNaN(xl) ? '?' : xl}đ`,
    ];
    if (tqOn) parts.push(`<b>🔥 Tứ quý</b> = +${isNaN(tq) ? '?' : tq}đ / -${isNaN(tq) ? '?' : tq}đ`);
    if (chayOn) parts.push(`<b>⚡ Cháy bài</b> = +${isNaN(chay) ? '?' : chay} lá`);
    document.getElementById('admin-preview').innerHTML = parts.join(' &nbsp;·&nbsp; ');
}

function handleSaveRules(e) {
    spawnRipple(document.getElementById('save-rules-btn'), e);
    animateSaveBtn(() => saveRules());
}

function saveRules() {
    const readInt = (id, fb) => { const v = parseInt(document.getElementById(id).value); return isNaN(v) || v < 1 ? fb : v; };
    const readFloat = (id, fb) => { const v = parseFloat(document.getElementById(id).value); return isNaN(v) || v < 0 ? fb : v; };
    rules = {
        la: readFloat('cfg-la', rules.la),
        xw: readInt('cfg-xw', rules.xw),
        xl: readInt('cfg-xl', rules.xl),
        tq: readInt('cfg-tq', rules.tq),
        tqOn: document.getElementById('cfg-tq-on').checked,
        chay: readInt('cfg-chay', rules.chay),
        chayOn: document.getElementById('cfg-chay-on').checked,
    };
    save();
    updateRuleSummary();
    renderGrid(); renderXamPickers(); renderBonusPickers();
    showToast('✅ Luật đã lưu! Áp dụng từ ván tiếp theo.', 3000);
}

function updateRuleSummary() {
    let parts = [
        `<b>1 lá</b> = ${rules.la}đ`,
        `<b>🎯 Sâm thành công</b> = mỗi người -${rules.xw}đ, người sâm +${rules.xw * (numP - 1)}đ`,
        `<b>🛡 Bị chặn</b> = người sâm -${rules.xl}đ, người chặn +${rules.xl}đ`,
    ];
    if (rules.tqOn) parts.push(`<b>🔥 Tứ quý</b> = +${rules.tq}đ / -${rules.tq}đ`);
    if (rules.chayOn) parts.push(`<b>⚡ Cháy bài</b> = +${rules.chay} lá`);
    document.getElementById('rule-summary').innerHTML = parts.join(' &nbsp;·&nbsp; ');
}

// ══════════════════════════════════════════════════════════════
// EXPORT EXCEL
// ══════════════════════════════════════════════════════════════
function exportXLSX() {
    if (!history.length) { showAlert({ icon: '📋', title: 'Chưa có dữ liệu', msg: 'Chưa có ván nào để xuất!' }); return; }
    const names = history[history.length - 1].names;
    const wb = XLSX.utils.book_new();
    const tot = new Array(numP).fill(0);
    history.forEach(v => v.scores.forEach((s, i) => tot[i] += s));

    // Sheet 1: Lịch sử ván
    const hdrs = ['Ván', 'Giờ', 'Loại', ...names.slice(0, numP), 'Ghi chú'];
    const rows = [hdrs];
    history.forEach((v, vi) => {
        const note = v.tags.map((tl, i) => {
            const tagNames = tl.map(t => { const tag = typeof t === 'string' ? t : t.tag; return TLBL[tag] || tag; });
            return tagNames.length ? `${names[i]}:[${tagNames.join(',')}]` : null;
        }).filter(Boolean).join(' | ');
        rows.push([`Ván ${vi + 1}`, v.ts || '', v.mode === 'xam' ? 'Sâm' : 'Bình thường', ...v.scores.slice(0, numP), note]);
    });
    rows.push(['TỔNG', '', '', ...tot.slice(0, numP), '']);
    const ws1 = XLSX.utils.aoa_to_sheet(rows);
    ws1['!cols'] = [8, 8, 14, ...names.slice(0, numP).map(() => 12), 30].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws1, 'Lịch sử ván');

    // Sheet 2: Xếp hạng
    const rank = [...Array(numP).keys()].sort((a, b) => tot[b] - tot[a]);
    const ws2 = XLSX.utils.aoa_to_sheet([
        ['Hạng', 'Tên', 'Điểm tổng', 'Tiền (nghìn đồng)'],
        ...rank.map((pi, r) => [r + 1, names[pi], tot[pi], `${tot[pi] >= 0 ? '+' : ''}${tot[pi].toLocaleString('vi-VN')}k`]),
    ]);
    ws2['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 14 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Xếp hạng');

    // Sheet 3: Luật chơi
    const ws3 = XLSX.utils.aoa_to_sheet([
        ['Luật', 'Giá trị'],
        ['1 lá bài', rules.la],
        ['Sâm thành công (đ/người)', rules.xw],
        ['Sâm bị chặn phạt (đ/người)', rules.xl],
        ['Tứ quý (đ/người)', rules.tq],
        ['Bật tứ quý', rules.tqOn ? 'Có' : 'Không'],
        ['Cháy bài (lá phạt)', rules.chay],
        ['Bật cháy bài', rules.chayOn ? 'Có' : 'Không'],
    ]);
    ws3['!cols'] = [{ wch: 28 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Luật chơi');

    const date = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    XLSX.writeFile(wb, `XamLoc_${date}.xlsx`);
}

// ══════════════════════════════════════════════════════════════
// IMPORT EXCEL
// ══════════════════════════════════════════════════════════════
function importXLSX(e) {
    const file = e.target.files[0]; if (!file) return;
    processFile(file); e.target.value = '';
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.remove('drag');
    const file = e.dataTransfer.files[0]; if (file) processFile(file);
}

function processFile(file) {
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const wb = XLSX.read(ev.target.result, { type: 'binary' });
            const ws = wb.Sheets['Lịch sử ván'];
            if (!ws) { showAlert({ icon: '❌', title: 'Lỗi file', msg: 'Không tìm thấy sheet "Lịch sử ván". File không đúng định dạng!' }); return; }
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            if (data.length < 2) { showAlert({ icon: '📋', title: 'File trống', msg: 'File không có dữ liệu!' }); return; }

            const headers = data[0];
            const nameStart = 3, nameEnd = headers.length - 1;
            const impNames = headers.slice(nameStart, nameEnd);
            const n = impNames.length;

            const newHist = [];
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (!row[0] || String(row[0]).startsWith('TỔNG')) continue;
                const scores = row.slice(nameStart, nameStart + n).map(v => Number(v) || 0);
                const noteStr = row[nameStart + n] || '';
                const tags = Array.from({ length: n }, () => []);
                const scBonus = scores.map(() => 0);
                noteStr.split('|').forEach(seg => {
                    const m = seg.trim().match(/^(.+?):\[(.+?)\]$/); if (!m) return;
                    const idx = impNames.findIndex(nm => nm.trim() === m[1].trim());
                    if (idx >= 0) {
                        tags[idx] = m[2].split(',').map(t => {
                            const found = Object.entries(TLBL).find(([, v]) => v === t.trim());
                            return found ? found[0] : t.trim();
                        });
                        // tính scBonus cho các tag bonus (không phải lá)
                        tags[idx].forEach(tag => {
                            if (['X', 'Xchan', 'Chan', 'Q', 'Qbat'].includes(tag)) {
                                // bonus sẽ là toàn bộ score nếu mode xam, hoặc phần bonus trong normal
                                scBonus[idx] = scores[idx]; // approximation
                            }
                        });
                    }
                });
                // scLa = scores - scBonus (phần điểm từ lá bài)
                const scLa = scores.map((s, i) => s - scBonus[i]);
                newHist.push({ scores, scLa, scBonus: scores.map(() => 0), tags, names: [...impNames], mode: String(row[2]).includes('Sâm') ? 'xam' : 'normal', ts: row[1] || '' });
            }

            showConfirm({
                icon: '📤', title: 'Xác nhận nhập file?',
                msg: `Tìm thấy ${newHist.length} ván với ${n} người:\n${impNames.join(', ')}\n\nNhập sẽ THAY THẾ lịch sử ván hiện tại (luật chơi giữ nguyên).`,
                onYes: () => {
                    numP = n;
                    pnames = [...impNames, 'Người 1', 'Người 2', 'Người 3', 'Người 4'].slice(0, 4);
                    history = newHist;
                    try {
                        localStorage.setItem(LS_RULES, JSON.stringify(rules));
                        localStorage.setItem(LS_HISTORY, JSON.stringify(history));
                        localStorage.setItem(LS_PLAYERS, JSON.stringify({ numP, pnames }));
                    } catch (e) { }
                    updateRuleSummary(); setActivePBtn();
                    renderNames(); renderGrid(); renderXamPickers();
                    if (history.length) {
                        renderBoard();
                        document.getElementById('board-wrap').style.display = 'block';
                        document.getElementById('van-num').textContent = `Nhập ván ${history.length + 1}`;
                    }
                    const msg = document.getElementById('import-msg');
                    if (msg) { msg.textContent = `✅ Nhập thành công ${newHist.length} ván!`; setTimeout(() => msg.textContent = '', 4000); }
                    showAlert({ icon: '✅', title: 'Nhập thành công!', msg: `Đã nhập ${newHist.length} ván thành công!` });
                },
            });
        } catch (err) { showAlert({ icon: '❌', title: 'Lỗi đọc file', msg: 'Lỗi: ' + err.message }); }
    };
    reader.readAsBinaryString(file);
}

// ══════════════════════════════════════════════════════════════
// CLEAR DATA
// ══════════════════════════════════════════════════════════════
function clearHistory() {
    showConfirm({
        icon: '🗑️', title: 'Xóa lịch sử?',
        msg: 'Xóa toàn bộ lịch sử ván chơi?\nHành động này không thể hoàn tác.',
        yesDanger: true,
        onYes: () => {
            history = []; save(); updateStorageInfo();
            document.getElementById('board-wrap').style.display = 'none';
            document.getElementById('van-num').textContent = 'Nhập ván 1';
            showAlert({ icon: '✅', title: 'Xong!', msg: 'Đã xóa toàn bộ lịch sử ván chơi.' });
        },
    });
}

function clearAll() {
    showConfirm({
        icon: '⚠️', title: 'Xóa tất cả?',
        msg: 'Xóa TẤT CẢ dữ liệu bao gồm lịch sử, luật chơi và tên người chơi?\nHành động này không thể hoàn tác!',
        yesDanger: true,
        onYes: () => {
            localStorage.removeItem(LS_RULES);
            localStorage.removeItem(LS_HISTORY);
            localStorage.removeItem(LS_PLAYERS);
            location.reload();
        },
    });
}

function setActivePBtn() {
    ['pbtn2', 'pbtn3', 'pbtn4'].forEach(id => {
        document.getElementById(id).className =
            'btn-outline' + (parseInt(id.replace('pbtn', '')) === numP ? ' active' : '');
    });
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
(function init() {
    // Apply saved theme
    const savedTheme = localStorage.getItem(LS_THEME);
    if (savedTheme) applyTheme(savedTheme);
    else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) applyTheme('dark');
    else applyTheme('light');

    load();
    updateRuleSummary();
    setActivePBtn();
    renderNames();
    renderGrid();
    renderXamPickers();
    if (history.length) {
        renderBoard();
        document.getElementById('board-wrap').style.display = 'block';
        document.getElementById('van-num').textContent = `Nhập ván ${history.length + 1}`;
    }
})();