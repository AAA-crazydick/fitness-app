/* ==========================================================
   健身 App · 工具层（选择器 / 图标 / 弹层 / 图表）
   ========================================================== */

const UI = {};

UI.$  = function (s, r) { return (r || document).querySelector(s); };
UI.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

UI.esc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};

UI.pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

/* ---------- 日期 ---------- */
UI.dateKey = function (d) {
  d = d || new Date();
  return d.getFullYear() + '-' + UI.pad2(d.getMonth() + 1) + '-' + UI.pad2(d.getDate());
};

UI.todayKey = function () { return UI.dateKey(new Date()); };

/* 周一为一周第一天 */
UI.weekStart = function (d) {
  d = d ? new Date(d) : new Date();
  const day = (d.getDay() + 6) % 7;
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  s.setHours(0, 0, 0, 0);
  return s;
};

/* 'YYYY-MM-DD' → '9月19日' */
UI.fmtDate = function (key) {
  const p = String(key).split('-');
  if (p.length < 3) return key;
  return Number(p[1]) + '月' + Number(p[2]) + '日';
};

/* 'YYYY-MM-DD' → '周六' */
UI.weekdayName = function (key) {
  const p = String(key).split('-');
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
};

UI.relDay = function (key) {
  if (key === UI.todayKey()) return '今天';
  const t = new Date(); t.setDate(t.getDate() - 1);
  if (key === UI.dateKey(t)) return '昨天';
  return UI.fmtDate(key);
};

UI.fmtDur = function (sec) {
  sec = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) return Math.floor(m / 60) + ' 小时 ' + (m % 60) + ' 分';
  return m + ':' + UI.pad2(s);
};

/* ---------- 图标 ---------- */
UI.ICON = {
  plan:  '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5"/></svg>',
  train: '<svg viewBox="0 0 24 24"><path d="M6.5 7.5v9M17.5 7.5v9M4 10v4M20 10v4M6.5 12h11"/></svg>',
  lib:   '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>',
  data:  '<svg viewBox="0 0 24 24"><path d="M5.5 20V13M12 20V5M18.5 20v-9.5"/></svg>',

  gear:  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  chev:  '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  x:     '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/></svg>',
  plus:  '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
  info:  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 8h.01"/></svg>',
  book:  '<svg viewBox="0 0 24 24"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z"/></svg>',
  up:    '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  timer: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 2M9.5 3h5"/></svg>'
};

/* ---------- 提示 ---------- */
UI.toast = function (msg, ms) {
  const old = UI.$('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, ms || 1800);
};

/* ---------- 底部弹层 ---------- */
UI.sheet = function (opt) {
  const mask = document.createElement('div');
  mask.className = 'mask';
  mask.innerHTML =
    '<div class="sheet"><div class="grab"></div>' +
    (opt.title ? '<h3>' + UI.esc(opt.title) + '</h3>' : '') +
    (opt.hint ? '<p class="hint">' + UI.esc(opt.hint) + '</p>' : '') +
    '<div class="sheet-body"></div></div>';
  document.body.appendChild(mask);

  const body = UI.$('.sheet-body', mask);
  if (typeof opt.body === 'string') body.innerHTML = opt.body;
  else if (opt.body) body.appendChild(opt.body);

  function close() {
    mask.remove();
    if (opt.onClose) opt.onClose();
  }
  mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
  const sheetEl = UI.$('.sheet', mask);
  if (sheetEl) sheetEl.addEventListener('click', function (e) { e.stopPropagation(); });

  if (opt.onMount) opt.onMount(body, close);
  return { close: close, root: mask };
};

UI.confirm = function (title, msg, okText, onOk, danger) {
  UI.sheet({
    title: title,
    body:
      '<p style="font-size:14px;color:var(--ink2);margin:0 0 20px;line-height:1.6">' + UI.esc(msg) + '</p>' +
      '<div style="display:flex;gap:10px">' +
      '<button class="btn" style="flex:1;height:48px" data-cancel>取消</button>' +
      '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" style="flex:1;height:48px" data-ok>' + UI.esc(okText || '确定') + '</button>' +
      '</div>',
    onMount: function (root, close) {
      UI.$('[data-cancel]', root).addEventListener('click', close);
      UI.$('[data-ok]', root).addEventListener('click', function () { close(); onOk(); });
    }
  });
};

/* ---------- 环形进度 ---------- */
UI.ring = function (progress, size, sw, color) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  const off = c * (1 - p);
  const h = size / 2;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
    '<circle cx="' + h + '" cy="' + h + '" r="' + r + '" fill="none" stroke="#E4E7EB" stroke-width="' + sw + '"/>' +
    '<circle cx="' + h + '" cy="' + h + '" r="' + r + '" fill="none" stroke="' + (color || '#1D9E75') + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
    '</svg>';
};

/* ---------- 折线图 ---------- */
UI.lineChart = function (pts) {
  if (!pts || pts.length < 2) return '';
  const W = 320, H = 150, PL = 6, PR = 6, PT = 14, PB = 18;
  const ys = pts.map(function (p) { return p.y; });
  let min = Math.min.apply(null, ys), max = Math.max.apply(null, ys);
  if (max - min < 1e-6) { max += 1; min -= 1; }
  const spanY = max - min;
  const n = pts.length;

  function px(i) { return PL + (W - PL - PR) * (i / (n - 1)); }
  function py(v) { return PT + (H - PT - PB) * (1 - (v - min) / spanY); }

  let line = '', area = '';
  pts.forEach(function (p, i) {
    const x = px(i).toFixed(1), y = py(p.y).toFixed(1);
    line += (i === 0 ? 'M' : 'L') + x + ' ' + y + ' ';
  });
  area = line + 'L' + px(n - 1).toFixed(1) + ' ' + (H - PB) + ' L' + px(0).toFixed(1) + ' ' + (H - PB) + ' Z';

  const grid = [0, 0.5, 1].map(function (t) {
    const y = (PT + (H - PT - PB) * t).toFixed(1);
    return '<line class="grid" x1="' + PL + '" y1="' + y + '" x2="' + (W - PR) + '" y2="' + y + '"/>';
  }).join('');

  const dots = pts.map(function (p, i) {
    if (n > 14 && i !== n - 1) return '';
    return '<circle class="pt" cx="' + px(i).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="3.2"/>';
  }).join('');

  const last = pts[n - 1];
  const lastDot =
    '<circle class="pt" cx="' + px(n - 1).toFixed(1) + '" cy="' + py(last.y).toFixed(1) + '" r="4"/>' +
    '<text x="' + Math.min(px(n - 1), W - 4) + '" y="' + (py(last.y) - 10).toFixed(1) + '" text-anchor="end" font-size="12" font-weight="600" fill="#0F6E56">' + last.y + '</text>';

  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
    grid +
    '<path class="area" d="' + area + '"/>' +
    '<path class="line" d="' + line + '"/>' +
    dots + lastDot +
    '</svg>';
};

/* ---------- 数字步进器（共用绑定） ---------- */
UI.bindStepper = function (root, attr, onChange) {
  UI.$$('[data-step]', root).forEach(function (btn) {
    btn.addEventListener('click', function () {
      const dir = Number(btn.getAttribute('data-step'));
      const step = Number(btn.getAttribute('data-stepby') || 1);
      onChange(attr, dir * step);
    });
  });
};

/* ---------- 震动反馈（iOS 需用户手势触发才生效，失败静默） ---------- */
UI.buzz = function (ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {}
};
