/* ==========================================================
   健身 App · 主控（状态 / 存储 / 路由 / 事件）
   ========================================================== */

const STORE_KEY = 'fitness-app-v1';

const TAB_META = {
  plan:  { title: '训练计划', icon: 'plan' },
  train: { title: '开始训练', icon: 'train' },
  lib:   { title: '动作库',   icon: 'lib' },
  data:  { title: '我的数据', icon: 'data' }
};

const TABS = [
  { id: 'plan',  name: '计划',   icon: 'plan' },
  { id: 'train', name: '训练',   icon: 'train' },
  { id: 'lib',   name: '动作库', icon: 'lib' },
  { id: 'data',  name: '数据',   icon: 'data' }
];

/* 各动作的起步重量（没有历史记录时用） */
const DEFAULT_W = {
  squat: 40, deadlift: 60, bench_press: 40, bb_row: 40, ohp: 30,
  hip_thrust: 40, rdl: 40, leg_press: 60, hack_squat: 60, tbar_row: 30,
  lat_pulldown: 40, seated_row: 40, machine_press: 30, pec_deck: 25,
  cable_fly: 15, pushdown: 20, cable_crunch: 25, face_pull: 15,
  close_grip_bench: 30, bb_curl: 20, dumbbell_press: 12
};

const App = {
  state: null,
  draft: { goal: 'muscle', days: 3, scene: 'gym' },
  tab: 'plan',
  libQuery: '',
  libMuscle: '',
  freePick: [],
  rest: null,
  tick: null,
  lastSummary: null,
  editingSetup: false,
  focusKey: ''
};

/* ---------- 存储 ---------- */
App.blank = function () {
  return { v: 1, profile: null, plan: [], sessions: [], body: [], active: null };
};

App.load = function () {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    App.state = raw ? Object.assign(App.blank(), JSON.parse(raw)) : App.blank();
  } catch (e) {
    App.state = App.blank();
  }
};

App.save = function () {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(App.state));
  } catch (e) {
    UI.toast('保存失败，浏览器可能禁止了本地存储');
  }
};

/* ---------- 渲染 ---------- */
App.render = function () {
  App.renderTop();
  App.renderTabs();
  const screen = UI.$('#screen');
  if (!screen) return;
  let html = '';
  if (App.tab === 'plan') html = Views.plan();
  else if (App.tab === 'train') html = Views.train();
  else if (App.tab === 'lib') html = Views.lib();
  else html = Views.data();
  screen.innerHTML = html;
  screen.scrollTop = 0;
  if (App.focusKey) {
    const inp = UI.$('#' + App.focusKey);
    if (inp) inp.focus();
    App.focusKey = '';
  }
};

App.renderTop = function () {
  const meta = TAB_META[App.tab];
  let sub = '';
  if (App.tab === 'plan' && App.state.profile && !App.editingSetup) {
    const g = GOALS[App.state.profile.goal];
    sub = '<span class="sub">' + g.name + ' · 每周 ' + App.state.profile.days + ' 天 · ' + SCENES[App.state.profile.scene].name + '</span>';
  }
  let h = '<h1>' + meta.title + sub + '</h1>';
  if (App.tab === 'data' && App.state.sessions.length) {
    h += '<button class="act" data-act="export">' + UI.ICON.up + '</button>';
  }
  UI.$('#topbar').innerHTML = h;
};

App.renderTabs = function () {
  UI.$('#tabbar').innerHTML = TABS.map(function (t) {
    return '<button class="tabitem' + (App.tab === t.id ? ' on' : '') + '" data-act="tab" data-v="' + t.id + '">' +
      UI.ICON[t.icon] + '<span>' + t.name + '</span></button>';
  }).join('');
};

App.renderActive = function () {
  const root = UI.$('#overlay-root');
  if (!root) return;

  if (App.lastSummary) {
    root.innerHTML = Views.summary(App.lastSummary);
    return;
  }
  if (!App.state.active) {
    root.innerHTML = '';
    return;
  }

  const prevBody = UI.$('.ov-body', root);
  const keepScroll = prevBody && !App.rest ? prevBody.scrollTop : null;

  root.innerHTML = Views.active();

  if (keepScroll !== null) {
    const nb = UI.$('.ov-body', root);
    if (nb) nb.scrollTop = keepScroll;
  }
};

/* ---------- 训练：工具 ---------- */
App.defaultWeight = function (it) {
  const ex = EX_MAP[it.exId];
  if (DEFAULT_W[it.exId]) return DEFAULT_W[it.exId];
  if (ex && ex.eq === 'bodyweight') return 0;
  if (ex && ex.eq === 'barbell') return 20;
  return 10;
};

App.newCur = function (it) {
  const hint = progressiveHint(it.exId, it.reps, it.rest);
  const nums = String(it.reps).split('-').map(function (x) { return parseInt(x, 10) || 0; });
  const reps = nums[0] || 10;
  let w = App.defaultWeight(it);
  if (hint && hint.weight) w = Math.round(hint.weight * 2) / 2;
  return { w: w, reps: reps, rpe: 0 };
};

/* ---------- 训练：开始 / 结束 ---------- */
App.startWorkout = function (day) {
  App.state.active = {
    startedAt: Date.now(),
    dayKey: day.key || 'free',
    dayName: day.name,
    items: day.items.map(function (it) {
      return {
        exId: it.exId, name: it.name, muscle: it.muscle || '',
        sets: it.sets, reps: it.reps, rest: it.rest,
        logs: [],
        hint: progressiveHint(it.exId, it.reps, it.rest)
      };
    }),
    cursor: 0,
    cur: null
  };
  App.state.active.cur = App.newCur(App.state.active.items[0]);
  App.save();
  App.openWorkout();
};

App.openWorkout = function () {
  App.lastSummary = null;
  App.rest = null;
  App.renderActive();
  App.startTick();
  setTimeout(function () { App.lockBody(true); }, 0);
};

App.closeWorkout = function () {
  App.stopTick();
  App.lockBody(false);
  UI.$('#overlay-root').innerHTML = '';
};

App.lockBody = function (on) {
  document.body.style.overflow = on ? 'hidden' : '';
};

App.finishWorkout = function () {
  const a = App.state.active;
  if (!a) return;
  const done = a.items.filter(function (it) { return it.logs.length; });
  App.stopTick();
  App.state.active = null;
  App.save();

  if (!done.length) {
    App.closeWorkout();
    App.render();
    UI.toast('这次没有记录任何组');
    return;
  }

  const sn = {
    id: 'S' + Date.now(),
    date: UI.todayKey(),
    dayKey: a.dayKey,
    dayName: a.dayName,
    duration: Math.round((Date.now() - a.startedAt) / 1000),
    items: done,
    sets: done.reduce(function (s, it) { return s + it.logs.length; }, 0),
    volume: done.reduce(function (s, it) {
      return s + it.logs.reduce(function (x, l) { return x + l.w * l.reps; }, 0);
    }, 0)
  };
  App.state.sessions.push(sn);
  App.save();

  App.lastSummary = sn;
  App.renderActive();
  App.startTick();
};

/* ---------- 训练：单组与休息 ---------- */
App.finishSet = function () {
  const a = App.state.active;
  if (!a) return;
  const it = a.items[a.cursor];
  it.logs.push({ w: a.cur.w, reps: a.cur.reps, rpe: a.cur.rpe });
  UI.buzz(12);

  if (it.logs.length >= it.sets) {
    App.goNext();
    return;
  }

  const total = it.sets;
  App.rest = {
    endAt: Date.now() + it.rest * 1000,
    total: it.rest,
    msg: '下一组：' + it.name + ' 第 ' + (it.logs.length + 1) + ' / ' + total + ' 组'
  };
  App.save();
  App.renderActive();
};

App.goNext = function () {
  const a = App.state.active;
  if (!a) return;
  App.rest = null;
  if (a.cursor < a.items.length - 1) {
    a.cursor++;
    a.cur = App.newCur(a.items[a.cursor]);
    App.save();
    App.renderActive();
    UI.toast('下一个：' + a.items[a.cursor].name, 1200);
  } else {
    App.finishWorkout();
  }
};

App.startTick = function () {
  App.stopTick();
  App.tick = setInterval(function () {
    if (App.state.active) {
      const clock = UI.$('.ov-head .clock');
      if (clock) clock.textContent = UI.fmtDur((Date.now() - App.state.active.startedAt) / 1000);
    }
    if (App.rest) {
      const left = Math.max(0, Math.ceil((App.rest.endAt - Date.now()) / 1000));
      const n = UI.$('.ringwrap .n');
      const ring = UI.$$('.ringwrap circle')[1];
      if (n) n.textContent = left;
      if (ring) {
        const c = 2 * Math.PI * 113;
        ring.setAttribute('stroke-dashoffset', (c * (1 - (1 - left / App.rest.total))).toFixed(1));
      }
      if (left <= 0) {
        App.rest = null;
        UI.buzz(90);
        App.renderActive();
      }
    }
  }, 1000);
};

App.stopTick = function () {
  if (App.tick) { clearInterval(App.tick); App.tick = null; }
};

/* ---------- 计划 ---------- */
App.confirmPlan = function () {
  const d = App.draft;
  App.state.profile = {
    goal: d.goal, days: Number(d.days), scene: d.scene,
    startDate: UI.todayKey()
  };
  App.state.plan = buildPlan(App.state.profile);
  App.editingSetup = false;
  App.save();
  App.render();
  UI.toast('课表已生成');
};

App.todayDay = function () {
  const s = App.state;
  if (!s.profile || !s.plan.length) return null;
  const dow = (new Date().getDay() + 6) % 7;
  const pattern = WEEK_PATTERN[s.profile.days];
  const i = pattern.indexOf(dow);
  return i >= 0 ? s.plan[i] : null;
};

/* ---------- 事件 ---------- */
App.onInput = function (e) {
  const t = e.target;
  if (t && t.id === 'lib-search') {
    App.libQuery = t.value;
    const list = UI.$('#lib-list');
    if (list) list.innerHTML = Views.libList();
  }
};

App.onClick = function (e) {
  const el = e.target.closest ? e.target.closest('[data-act]') : null;
  if (!el) return;
  const act = el.getAttribute('data-act');
  const v = el.getAttribute('data-v');
  const id = el.getAttribute('data-id');
  const a = App.state.active;

  switch (act) {

    /* --- 导航 --- */
    case 'tab':
      App.tab = v;
      App.editingSetup = false;
      App.render();
      break;

    /* --- 首次设置 --- */
    case 'pick-goal':
      App.draft.goal = v; App.render(); break;
    case 'pick-days':
      App.draft.days = Number(v); App.render(); break;
    case 'pick-scene':
      App.draft.scene = v; App.render(); break;
    case 'confirm-plan':
      App.confirmPlan(); break;
    case 'setup-plan':
      if (App.state.profile) {
        App.draft = {
          goal: App.state.profile.goal,
          days: App.state.profile.days,
          scene: App.state.profile.scene
        };
      }
      App.editingSetup = true;
      App.tab = 'plan';
      App.render();
      break;

    /* --- 训练入口 --- */
    case 'start-today': {
      const day = App.todayDay();
      if (!day) { UI.toast('今天没有安排训练，用自由训练吧'); break; }
      if (App.state.active) { App.openWorkout(); break; }
      App.startWorkout(day);
      break;
    }
    case 'resume':
      App.openWorkout(); break;
    case 'start-free':
      App.openFreePick(); break;

    /* --- 训练中 --- */
    case 'quit':
      if (!a) { App.closeWorkout(); App.render(); break; }
      const hasLog = a.items.some(function (it) { return it.logs.length; });
      if (!hasLog) {
        UI.confirm('退出训练？', '这次还没有记录任何一组，退出后不会留下数据。', '退出', function () {
          App.state.active = null;
          App.save();
          App.closeWorkout();
          App.render();
        }, true);
      } else {
        UI.confirm('结束这次训练？', '已经完成的组会保存成一次训练记录。', '结束并保存', function () {
          App.finishWorkout();
          App.render();
        });
      }
      break;

    case 'step-w': {
      const step = a.cur.w <= 0 && Number(v) > 0 ? 2.5 : Number(v) * 2.5;
      a.cur.w = Math.max(0, Math.round((a.cur.w + step) * 2) / 2);
      App.renderActive();
      break;
    }
    case 'step-r': {
      const timed = String(a.items[a.cursor].reps).indexOf('秒') >= 0;
      const st = timed ? 5 : 1;
      const cap = timed ? 600 : 100;
      a.cur.reps = Math.max(st, Math.min(cap, a.cur.reps + Number(v) * st));
      App.renderActive();
      break;
    }
    case 'pick-rpe':
      a.cur.rpe = Number(v);
      App.renderActive();
      break;
    case 'finish-set':
      App.finishSet(); break;
    case 'del-set': {
      const i = Number(el.getAttribute('data-i'));
      a.items[a.cursor].logs.splice(i, 1);
      App.save();
      App.renderActive();
      break;
    }
    case 'next-ex':
      App.goNext(); break;
    case 'rest-skip':
      App.rest = null;
      App.renderActive();
      break;
    case 'rest-plus':
      App.rest.endAt += 20000;
      App.rest.total += 20;
      App.renderActive();
      break;
    case 'close-summary':
      App.lastSummary = null;
      App.closeWorkout();
      App.tab = 'plan';
      App.render();
      UI.toast('已记录');
      break;

    /* --- 动作库 --- */
    case 'pick-muscle':
      App.libMuscle = v;
      App.render();
      break;
    case 'open-ex':
      UI.sheet({
        title: EX_MAP[id] ? EX_MAP[id].name : '动作',
        body: Views.exDetail(id),
        onMount: function (root, close) {
          const b = UI.$('[data-act="close-sheet"]', root);
          if (b) b.addEventListener('click', close);
        }
      });
      break;
    case 'close-sheet':
      App.closeTopSheet();
      break;

    /* --- 数据 --- */
    case 'open-session':
      UI.sheet({
        title: '训练详情',
        body: Views.sessionDetail(id),
        onMount: function (root, close) {
          const b = UI.$('[data-act="close-sheet"]', root);
          if (b) b.addEventListener('click', close);
        }
      });
      break;
    case 'add-body':
      App.openBodySheet(); break;
    case 'export':
      App.exportData(); break;
    case 'import':
      App.importData(); break;
    case 'wipe':
      UI.confirm('清空全部数据？', '所有训练记录、身体数据和计划都会被删除，无法恢复。建议先导出备份。', '确认清空', function () {
        App.state = App.blank();
        App.draft = { goal: 'muscle', days: 3, scene: 'gym' };
        App.save();
        App.tab = 'plan';
        App.render();
        UI.toast('已清空');
      }, true);
      break;

    default: break;
  }
};

App.closeTopSheet = function () {
  const m = UI.$('.mask');
  if (m) m.remove();
};

/* ---------- 自由训练选择 ---------- */
App.openFreePick = function () {
  App.freePick = [];
  UI.sheet({
    title: '自由训练',
    hint: '挑几个动作，每个动作默认 3 组 × 10 次，练的时候可以改。',
    body: '<div id="free-wrap"></div>' +
      '<button class="cta" style="margin-top:8px" data-free-start>开始训练</button>',
    onMount: function (root, close) {
      const wrap = UI.$('#free-wrap', root);
      const btn = UI.$('[data-free-start]', root);

      function draw() {
        let h = '<div class="chips">';
        h += '<button class="chip' + (!App.freeMuscle ? ' on' : '') + '" data-fm="">全部</button>';
        MUSCLES.forEach(function (m) {
          h += '<button class="chip' + (App.freeMuscle === m.id ? ' on' : '') + '" data-fm="' + m.id + '">' + m.name + '</button>';
        });
        h += '</div>';
        const list = EXERCISES.filter(function (e) { return !App.freeMuscle || e.muscle === App.freeMuscle; });
        h += '<div class="card" style="padding:4px 16px;max-height:44vh;overflow-y:auto">';
        list.forEach(function (e) {
          const on = App.freePick.indexOf(e.id) >= 0;
          h += '<div class="row" data-fp="' + e.id + '" style="padding:12px 0">' +
            '<div class="grow"><div class="t" style="font-size:14.5px">' + UI.esc(e.name) + '</div>' +
            '<div class="s">' + MUSCLE_NAME[e.muscle] + ' · ' + EQ_NAME[e.eq] + '</div></div>' +
            '<div class="ck" style="' + (on ? 'background:var(--main);border-color:var(--main)' : 'width:20px;height:20px;border-radius:50%;border:1.5px solid var(--line);background:#fff;flex:none') + '"></div>' +
            '</div>';
        });
        h += '</div>';
        wrap.innerHTML = h;
      }

      draw();

      wrap.addEventListener('click', function (ev) {
        const fm = ev.target.closest('[data-fm]');
        if (fm) { App.freeMuscle = fm.getAttribute('data-fm'); draw(); return; }
        const fp = ev.target.closest('[data-fp]');
        if (fp) {
          const ex = fp.getAttribute('data-fp');
          const i = App.freePick.indexOf(ex);
          if (i >= 0) App.freePick.splice(i, 1); else App.freePick.push(ex);
          draw();
          btn.textContent = App.freePick.length ? '开始训练（' + App.freePick.length + ' 个动作）' : '开始训练';
        }
      });

      btn.addEventListener('click', function () {
        if (!App.freePick.length) { UI.toast('至少选一个动作'); return; }
        const rest = GOALS[App.state.profile ? App.state.profile.goal : 'muscle'].rest;
        const items = App.freePick.map(function (exId) {
          const ex = EX_MAP[exId];
          return { exId: exId, name: ex.name, muscle: ex.muscle, sets: 3, reps: '8-12', rest: rest };
        });
        close();
        App.startWorkout({ key: 'free', name: '自由训练', items: items });
      });
    }
  });
};

/* ---------- 记录身体数据 ---------- */
App.openBodySheet = function () {
  const today = UI.todayKey();
  const cur = (App.state.body || []).filter(function (b) { return b.date === today; })[0] || {};
  UI.sheet({
    title: '记录身体数据',
    hint: '只填想记的项目，留空表示这次不记。',
    body:
      '<div class="pad-row" style="margin-bottom:0">' +
      App.bodyField('w', '体重 kg', cur.weight) +
      App.bodyField('waist', '腰围 cm', cur.waist) +
      '</div>' +
      '<div class="pad-row">' +
      App.bodyField('chest', '胸围 cm', cur.chest) +
      App.bodyField('arm', '臂围 cm', cur.arm) +
      '</div>' +
      '<div class="pad-row" style="margin-bottom:16px">' +
      App.bodyField('thigh', '腿围 cm', cur.thigh) +
      '<div style="flex:1"></div>' +
      '</div>' +
      '<button class="cta" data-body-save>保存</button>',
    onMount: function (root, close) {
      UI.$('[data-body-save]', root).addEventListener('click', function () {
        const numv = function (k) {
          const el = UI.$('[data-bf="' + k + '"]', root);
          const x = parseFloat(el && el.value);
          return isNaN(x) ? null : x;
        };
        const rec = { date: today, weight: numv('w'), waist: numv('waist'), chest: numv('chest'), arm: numv('arm'), thigh: numv('thigh') };
        const has = ['weight', 'waist', 'chest', 'arm', 'thigh'].some(function (k) { return rec[k] != null; });
        if (!has) { UI.toast('至少填一项'); return; }
        App.state.body = (App.state.body || []).filter(function (b) { return b.date !== today; });
        App.state.body.push(rec);
        App.state.body.sort(function (x, y) { return x.date < y.date ? -1 : 1; });
        App.save();
        close();
        App.render();
        UI.toast('已记录');
      });
    }
  });
};

App.bodyField = function (key, label, val) {
  return '<div class="numfield" style="padding:10px 10px 12px">' +
    '<div class="lb">' + label + '</div>' +
    '<input data-bf="' + key + '" type="number" inputmode="decimal" step="0.1" value="' + (val != null ? val : '') + '" ' +
    'style="width:100%;border:0;background:transparent;text-align:center;font-family:inherit;font-size:20px;' +
    'font-weight:600;font-variant-numeric:tabular-nums;color:var(--ink);padding:4px 0;outline:none">' +
    '</div>';
};

/* ---------- 导入导出 ---------- */
App.exportData = function () {
  const json = JSON.stringify(App.state);
  const shown = '<textarea readonly style="width:100%;height:160px;font-family:ui-monospace,monospace;font-size:12px;' +
    'border:.5px solid var(--line);border-radius:12px;padding:10px;background:var(--bg);color:var(--ink2);' +
    '-webkit-user-select:text;user-select:text">' + UI.esc(json) + '</textarea>' +
    '<button class="cta" style="margin-top:12px" data-copy>复制全部</button>';

  function fallback() {
    UI.sheet({
      title: '导出数据',
      hint: '长按下面的文字全选复制，粘贴到备忘录或电脑上保存。',
      body: shown,
      onMount: function (root, close) {
        UI.$('[data-copy]', root).addEventListener('click', function () {
          const ta = UI.$('textarea', root);
          ta.removeAttribute('readonly');
          ta.select();
          ta.setSelectionRange(0, 999999);
          let ok = false;
          try { ok = document.execCommand('copy'); } catch (e) {}
          ta.setAttribute('readonly', 'readonly');
          UI.toast(ok ? '已复制到剪贴板' : '请长按手动复制');
        });
      }
    });
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(json).then(function () {
      UI.toast('数据已复制到剪贴板');
    }).catch(fallback);
  } else {
    fallback();
  }
};

App.importData = function () {
  UI.sheet({
    title: '导入数据',
    hint: '把之前导出的 JSON 粘贴进来，会覆盖当前所有数据。',
    body: '<textarea data-imp placeholder="粘贴 JSON" style="width:100%;height:150px;font-family:ui-monospace,monospace;' +
      'font-size:12px;border:.5px solid var(--line);border-radius:12px;padding:10px;background:var(--bg);' +
      'color:var(--ink);-webkit-user-select:text;user-select:text"></textarea>' +
      '<button class="cta" style="margin-top:12px" data-do-imp>确认导入</button>',
    onMount: function (root, close) {
      UI.$('[data-do-imp]', root).addEventListener('click', function () {
        const raw = UI.$('[data-imp]', root).value.trim();
        if (!raw) { UI.toast('还没粘贴内容'); return; }
        try {
          const o = JSON.parse(raw);
          if (!o || typeof o !== 'object' || !('sessions' in o)) throw new Error('bad');
          App.state = Object.assign(App.blank(), o);
          if (App.state.profile) {
            App.draft = { goal: App.state.profile.goal, days: App.state.profile.days, scene: App.state.profile.scene };
          }
          App.save();
          close();
          App.render();
          UI.toast('导入成功');
        } catch (err) {
          UI.toast('这段内容不是有效的备份');
        }
      });
    }
  });
};

/* ---------- 启动 ---------- */
App.init = function () {
  App.load();
  if (App.state.profile) {
    App.draft = {
      goal: App.state.profile.goal,
      days: App.state.profile.days,
      scene: App.state.profile.scene
    };
  }
  document.addEventListener('click', App.onClick);
  document.addEventListener('input', App.onInput);

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && App.state.active) App.renderActive();
  });

  window.addEventListener('pagehide', function () { App.save(); });

  App.render();

  if (App.state.active) App.openWorkout();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', App.init);
} else {
  App.init();
}
