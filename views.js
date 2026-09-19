/* ==========================================================
   健身 App · 视图层（各 Tab 页面 + 训练流程）
   ========================================================== */

const Views = {};

const MUSCLE_NAME = {};
MUSCLES.forEach(function (m) { MUSCLE_NAME[m.id] = m.name; });

const LEVEL_NAME = { 1: '入门', 2: '进阶', 3: '高阶' };

function num(v) {
  const n = Math.round(Number(v) * 10) / 10;
  return String(n);
}

/* 这个动作是按秒计时（如平板支撑）还是按次数 */
function isTimedItem(it) {
  return String(it.reps || '').indexOf('秒') >= 0;
}

/* 一个动作是否是纯自重（没重量时不该显示 0kg） */
function isBodyweight(exId) {
  const ex = EX_MAP[exId];
  return !!(ex && ex.eq === 'bodyweight');
}

/* 统一渲染一条已完成组的摘要，正确处理计时动作与自重动作 */
function setLabel(it, l) {
  const unit = isTimedItem(it) ? '秒' : '次';
  if (isBodyweight(it.exId) && !l.w) {
    return l.reps + '<small>' + unit + '</small>';
  }
  return num(l.w) + '<small>kg</small> × ' + l.reps + '<small>' + unit + '</small>';
}

/* 取某个动作的历史最佳（最大重量那一组） */
function bestOf(exId) {
  let best = null;
  App.state.sessions.forEach(function (sn) {
    sn.items.forEach(function (it) {
      if (it.exId !== exId) return;
      it.logs.forEach(function (l) {
        if (!l.w) return;
        if (!best || l.w > best.w || (l.w === best.w && l.reps > best.reps)) {
          best = { w: l.w, reps: l.reps, date: sn.date };
        }
      });
    });
  });
  return best;
}

/* 上次练这个动作的记录，用于训练中做参考 */
function lastOf(exId) {
  const list = App.state.sessions;
  for (let i = list.length - 1; i >= 0; i--) {
    const hit = list[i].items.filter(function (it) { return it.exId === exId; })[0];
    if (hit && hit.logs.length) return { logs: hit.logs, date: list[i].date };
  }
  return null;
}

/* 渐进超负荷建议：上次全部达标且次数到上限 → 建议加重 */
function progressiveHint(exId, reps, rest) {
  const last = lastOf(exId);
  if (!last) return null;
  const nums = String(reps).split('-').map(Number);
  const top = nums.length > 1 ? nums[1] : nums[0];
  if (!top) return null;
  const allHit = last.logs.every(function (l) { return l.reps >= top; });
  const avgW = last.logs.reduce(function (a, l) { return a + l.w; }, 0) / last.logs.length;
  if (allHit) {
    const big = EX_MAP[exId] && EX_MAP[exId].muscle === 'legs';
    const inc = big ? 5 : 2.5;
    return {
      text: '上次 ' + num(Math.round(avgW * 10) / 10) + 'kg 全部达标，今天试试 ' + num(Math.round((avgW + inc) * 10) / 10) + 'kg',
      weight: Math.round((avgW + inc) * 2) / 2
    };
  }
  return {
    text: '上次 ' + num(Math.round(avgW * 10) / 10) + 'kg · ' + last.logs.map(function (l) { return l.reps; }).join('/') + ' 次，先把这个重量吃透',
    weight: avgW
  };
}

/* ==========================================================
   计划 Tab
   ========================================================== */
Views.plan = function () {
  const s = App.state;
  if (!s.profile) return Views.setup();

  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const pattern = WEEK_PATTERN[s.profile.days];
  const g = GOALS[s.profile.goal];
  const ws = UI.weekStart();
  const wsKey = UI.dateKey(ws);

  const weekDone = s.sessions.filter(function (x) { return x.date >= wsKey; });
  const todayIdx = pattern.indexOf(dow);
  const todayDay = todayIdx >= 0 ? s.plan[todayIdx] : null;

  let h = '';

  /* --- 周进度条 --- */
  h += '<div class="week">';
  for (let i = 0; i < 7; i++) {
    const dKey = UI.dateKey(new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i));
    const done = s.sessions.some(function (x) { return x.date === dKey; });
    const cls = ['d'];
    if (pattern.indexOf(i) >= 0) cls.push('train');
    if (done) cls.push('done');
    if (i === dow) cls.push('today');
    h += '<div class="' + cls.join(' ') + '"><div class="n">' + WEEK_NAMES[i] + '</div><div class="dot"></div></div>';
  }
  h += '</div>';

  /* --- 今日 --- */
  if (todayDay) {
    const mins = estimateMinutes(todayDay);
    const ms = [];
    todayDay.items.forEach(function (it) { if (ms.indexOf(it.muscle) < 0) ms.push(it.muscle); });
    h += '<div class="hero">' +
      '<div class="tagline">今日课程 · ' + UI.fmtDate(UI.todayKey()) + ' ' + UI.weekdayName(UI.todayKey()) + '</div>' +
      '<h2>' + UI.esc(todayDay.name) + '</h2>' +
      '<div class="meta">' + todayDay.items.length + ' 个动作 · 约 ' + mins + ' 分钟 · ' + UI.esc(g.name) + '计划</div>' +
      '<div class="pills">' + ms.map(function (m) { return '<span class="pill">' + (MUSCLE_NAME[m] || '') + '</span>'; }).join('') + '</div>' +
      '<button class="cta" data-act="start-today">' + UI.ICON.train + '开始今日训练</button>' +
      '</div>';
  } else {
    const nextIdx = (function () {
      for (let k = 1; k <= 7; k++) { if (pattern.indexOf((dow + k) % 7) >= 0) return (dow + k) % 7; }
      return -1;
    })();
    const nextName = nextIdx >= 0 ? s.plan[pattern.indexOf(nextIdx)].name : '';
    h += '<div class="card">' +
      '<div class="row" style="border:0;padding:2px 0 12px">' +
      '<div class="grow"><div class="t">今天休息</div>' +
      '<div class="s">恢复也是训练的一部分</div></div>' +
      '</div>' +
      '<div class="banner green">' + UI.ICON.info +
      '<p>下一次训练：' + UI.esc(nextName) + '（周' + WEEK_NAMES[nextIdx] + '）。想加练就点下面的自由训练。</p>' +
      '</div>' +
      '<button class="cta ghost" data-act="start-free">' + UI.ICON.plus + '自由训练</button>' +
      '</div>';
  }

  /* --- 本周课表 --- */
  h += '<div class="sec-title">本周课表 · 已完成 ' + weekDone.length + '/' + s.plan.length + '</div>';
  s.plan.forEach(function (day, i) {
    const dKey = UI.dateKey(new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + pattern[i]));
    const done = s.sessions.some(function (x) { return x.date === dKey; });
    const isToday = pattern[i] === dow;
    h += '<div class="card">' +
      '<div class="card-h">' +
      '<h2>周' + WEEK_NAMES[pattern[i]] + ' · ' + UI.esc(day.name) + '</h2>' +
      (done ? '<span style="font-size:12px;color:var(--main-d);background:var(--main-l);padding:2px 9px;border-radius:20px">已完成</span>'
            : (isToday ? '<span style="font-size:12px;color:var(--main-d)">今天</span>'
                       : '<span style="font-size:12px;color:var(--ink3)">' + day.items.length + ' 个动作</span>')) +
      '</div>' +
      '<div>' +
      day.items.map(function (it, k) {
        return '<div class="exrow">' +
          '<div class="idx">' + (k + 1) + '</div>' +
          '<div class="grow"><div class="n">' + UI.esc(it.name) + '</div>' +
          '<div class="m">' + (MUSCLE_NAME[it.muscle] || '') + ' · 休息 ' + it.rest + ' 秒</div></div>' +
          '<div class="sr"><b>' + it.sets + '</b> 组 × ' + UI.esc(it.reps) + '</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '</div>';
  });

  h += '<button class="btn" style="width:100%;height:48px;margin-top:6px" data-act="setup-plan">重新制定计划</button>';
  h += '<div class="hintline">计划存在本机浏览器里，不会上传到任何服务器</div>';
  return h;
};

/* ---------- 首次设置 ---------- */
Views.setup = function () {
  const d = App.draft;
  let h = '';
  h += '<div class="banner green">' + UI.ICON.info +
    '<p>先回答三个问题，我按你的目标和频率排一份课表。</p></div>';

  h += '<div class="sec-title">你的主要目标</div>';
  ['muscle', 'fat', 'posture'].forEach(function (id) {
    const g = GOALS[id];
    h += '<div class="opt' + (d.goal === id ? ' on' : '') + '" data-act="pick-goal" data-v="' + id + '">' +
      '<div class="grow"><div class="t">' + g.name + '</div><div class="s">' + g.desc + '</div></div>' +
      '<div class="ck"></div></div>';
  });

  h += '<div class="sec-title">每周训练几天</div>';
  h += '<div class="seg">' + [2, 3, 4, 5].map(function (n) {
    return '<button data-act="pick-days" data-v="' + n + '" class="' + (d.days === n ? 'on' : '') + '">' + n + ' 天</button>';
  }).join('') + '</div>';

  h += '<div class="sec-title">在哪练</div>';
  ['gym', 'home'].forEach(function (id) {
    const sc = SCENES[id];
    h += '<div class="opt' + (d.scene === id ? ' on' : '') + '" data-act="pick-scene" data-v="' + id + '">' +
      '<div class="grow"><div class="t">' + sc.name + '</div><div class="s">' + sc.desc + '</div></div>' +
      '<div class="ck"></div></div>';
  });

  const preview = buildPlan(d);
  const totalMin = preview.reduce(function (a, day) { return a + estimateMinutes(day); }, 0);
  h += '<div class="card" style="margin-top:16px;background:var(--main-l);border-color:transparent">' +
    '<div class="card-h" style="margin-bottom:8px"><h2 style="color:var(--main-d)">将要生成的课表</h2></div>' +
    preview.map(function (day, i) {
      return '<div class="row" style="border-color:rgba(15,110,86,.15)">' +
        '<div class="grow"><div class="t" style="color:var(--main-d)">周' + WEEK_NAMES[WEEK_PATTERN[d.days][i]] + ' · ' + UI.esc(day.name) + '</div>' +
        '<div class="s" style="color:rgba(15,110,86,.7)">' + day.items.length + ' 个动作 · 约 ' + estimateMinutes(day) + ' 分钟</div></div>' +
        '</div>';
    }).join('') +
    '<div class="row" style="border:0;padding-top:12px">' +
    '<div class="grow"><div class="s" style="color:rgba(15,110,86,.8)">每周总时长约 ' + totalMin + ' 分钟</div></div></div>' +
    '</div>';

  h += '<button class="cta" style="margin-top:16px" data-act="confirm-plan">' + UI.ICON.check + '生成我的计划</button>';
  return h;
};

/* ==========================================================
   训练 Tab
   ========================================================== */
Views.train = function () {
  const s = App.state;
  if (!s.profile) return '<div class="empty">' + UI.ICON.plan + '<p>还没有训练计划</p><span>先去「计划」页设定目标</span></div>';

  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const pattern = WEEK_PATTERN[s.profile.days];
  const idx = pattern.indexOf(dow);
  const day = idx >= 0 ? s.plan[idx] : null;

  let h = '';

  if (s.active) {
    h += '<div class="banner">' + UI.ICON.info + '<p>有一节训练还没结束，继续吧。</p></div>' +
      '<button class="cta" data-act="resume">' + UI.ICON.train + '继续训练</button>';
    return h;
  }

  if (day) {
    h += '<div class="hero">' +
      '<div class="tagline">今日课程</div>' +
      '<h2>' + UI.esc(day.name) + '</h2>' +
      '<div class="meta">' + day.items.length + ' 个动作 · 约 ' + estimateMinutes(day) + ' 分钟</div>' +
      '<button class="cta" data-act="start-today">' + UI.ICON.train + '开始训练</button>' +
      '</div>';
  }

  h += '<div class="sec-title">自由训练</div>';
  h += '<div class="card"><div class="row" style="border:0;padding:0">' +
    '<div class="grow"><div class="t">空白训练</div><div class="s">自己挑动作，从动作库添加</div></div>' +
    '<button class="btn" data-act="start-free">开始</button></div></div>';

  /* 最近训练 */
  const recent = s.sessions.slice(-3).reverse();
  if (recent.length) {
    h += '<div class="sec-title">最近训练</div>';
    h += '<div class="card">' + recent.map(function (sn) {
      return '<div class="row" data-act="open-session" data-id="' + sn.id + '">' +
        '<div class="grow"><div class="t">' + UI.esc(sn.dayName) + '</div>' +
        '<div class="s">' + UI.relDay(sn.date) + ' · ' + sn.sets + ' 组 · ' + UI.fmtDur(sn.duration) + '</div></div>' +
        '<div class="v">' + Math.round(sn.volume) + '<small style="font-size:11px;color:var(--ink3);font-weight:400"> kg</small></div>' +
        UI.ICON.chev + '</div>';
    }).join('') + '</div>';
  }

  return h;
};

/* ==========================================================
   动作库 Tab
   ========================================================== */
Views.lib = function () {
  let h = '';
  h += '<div style="position:relative;margin-bottom:12px">' +
    '<input id="lib-search" placeholder="搜索动作名称" value="' + UI.esc(App.libQuery || '') + '" ' +
    'style="width:100%;height:44px;border:.5px solid var(--line);border-radius:12px;background:var(--card);' +
    'font-family:inherit;font-size:16px;padding:0 14px;-webkit-appearance:none">' +
    '</div>';

  h += '<div class="chips">';
  h += '<button class="chip' + (!App.libMuscle ? ' on' : '') + '" data-act="pick-muscle" data-v="">全部</button>';
  MUSCLES.forEach(function (m) {
    h += '<button class="chip' + (App.libMuscle === m.id ? ' on' : '') + '" data-act="pick-muscle" data-v="' + m.id + '">' + m.name + '</button>';
  });
  h += '</div>';

  h += '<div id="lib-list">' + Views.libList() + '</div>';
  return h;
};

Views.libList = function () {
  const q = (App.libQuery || '').trim().toLowerCase();
  const list = EXERCISES.filter(function (e) {
    if (App.libMuscle && e.muscle !== App.libMuscle) return false;
    if (q && e.name.toLowerCase().indexOf(q) < 0 && e.id.indexOf(q) < 0) return false;
    return true;
  });
  if (!list.length) {
    return '<div class="empty">' + UI.ICON.search + '<p>没有匹配的动作</p><span>换个关键词试试</span></div>';
  }
  const groups = {};
  list.forEach(function (e) {
    (groups[e.muscle] = groups[e.muscle] || []).push(e);
  });
  let h = '';
  MUSCLES.forEach(function (m) {
    const arr = groups[m.id];
    if (!arr) return;
    h += '<div class="sec-title">' + m.name + ' · ' + arr.length + ' 个动作</div>';
    h += '<div class="card" style="padding:4px 16px">';
    arr.forEach(function (e) {
      const b = bestOf(e.id);
      h += '<div class="row" data-act="open-ex" data-id="' + e.id + '">' +
        '<div class="grow"><div class="t">' + UI.esc(e.name) + '</div>' +
        '<div class="s">' + EQ_NAME[e.eq] + ' · ' + (LEVEL_NAME[e.level] || '') + '</div></div>' +
        (b ? '<div class="v" style="font-size:13px">' + num(b.w) + 'kg<small style="font-size:10.5px;color:var(--ink3);font-weight:400"> ×' + b.reps + '</small></div>' : '') +
        UI.ICON.chev + '</div>';
    });
    h += '</div>';
  });
  return h;
};

/* 动作详情（底部弹层内容） */
Views.exDetail = function (exId) {
  const e = EX_MAP[exId];
  if (!e) return '';
  const b = bestOf(exId);
  const last = lastOf(exId);
  let h = '';
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">' +
    '<span class="pill" style="background:var(--main-l);color:var(--main-d);font-size:12px;padding:4px 11px;border-radius:20px">' + MUSCLE_NAME[e.muscle] + '</span>' +
    '<span class="pill" style="background:#EFF1F4;color:var(--ink2);font-size:12px;padding:4px 11px;border-radius:20px">' + EQ_NAME[e.eq] + '</span>' +
    '</div>';

  h += '<div class="tipbox"><div class="h">做法要点</div><ul>' +
    e.tips.map(function (t) { return '<li>' + UI.esc(t) + '</li>'; }).join('') + '</ul></div>';
  h += '<div class="tipbox warn"><div class="h">常见错误</div><ul>' +
    e.mistakes.map(function (t) { return '<li>' + UI.esc(t) + '</li>'; }).join('') + '</ul></div>';

  if (b) {
    const orm = estimate1RM(b.w, b.reps);
    h += '<div class="stats" style="margin-top:4px">' +
      '<div class="stat"><div class="k">最佳重量</div><div class="v">' + num(b.w) + '<small>kg</small></div></div>' +
      '<div class="stat"><div class="k">预估 1RM</div><div class="v">' + num(Math.round(orm)) + '<small>kg</small></div></div>' +
      '</div>';
    h += '<div class="hintline" style="text-align:left;padding-top:0">最佳成绩来自 ' + UI.fmtDate(b.date) + ' 的 ' + num(b.w) + 'kg × ' + b.reps + ' 次；1RM 按 Epley 公式估算，仅供参考。</div>';
  } else {
    h += '<div class="hintline" style="text-align:left">还没有这个动作的记录，练完会出现在这里。</div>';
  }

  if (e.homeAlt && EX_MAP[e.homeAlt]) {
    h += '<div class="banner" style="margin-top:12px">' + UI.ICON.info +
      '<p>没有器械时，可以练 <b>' + UI.esc(EX_MAP[e.homeAlt].name) + '</b> 替代。</p></div>';
  }
  h += '<button class="btn btn-primary" style="width:100%;height:48px;margin-top:16px" data-act="close-sheet">知道了</button>';
  return h;
};

/* ==========================================================
   我的数据 Tab
   ========================================================== */
Views.data = function () {
  const s = App.state;
  const wsKey = UI.dateKey(UI.weekStart());
  const weekSessions = s.sessions.filter(function (x) { return x.date >= wsKey; });
  const weekVol = weekSessions.reduce(function (a, x) { return a + x.volume; }, 0);
  const totalSets = s.sessions.reduce(function (a, x) { return a + x.sets; }, 0);

  /* 连续训练天数 */
  let streak = 0;
  const dates = {};
  s.sessions.forEach(function (x) { dates[x.date] = 1; });
  const cur = new Date();
  if (!dates[UI.dateKey(cur)]) cur.setDate(cur.getDate() - 1);
  while (dates[UI.dateKey(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }

  let h = '';
  h += '<div class="stats">' +
    '<div class="stat hi"><div class="k">本周训练</div><div class="v">' + weekSessions.length +
    '<small>/ ' + (s.profile ? s.profile.days : '-') + ' 次</small></div></div>' +
    '<div class="stat"><div class="k">本周总容量</div><div class="v">' + (weekVol >= 1000 ? (weekVol / 1000).toFixed(1) + '<small>吨</small>' : Math.round(weekVol) + '<small>kg</small>') + '</div></div>' +
    '<div class="stat"><div class="k">累计训练</div><div class="v">' + s.sessions.length + '<small>次</small></div></div>' +
    '<div class="stat"><div class="k">连续天数</div><div class="v">' + streak + '<small>天</small></div></div>' +
    '</div>';

  /* 体重曲线 */
  const weights = (s.body || []).filter(function (b) { return b.weight; }).slice(-20);
  h += '<div class="sec-title">身体数据</div>';
  h += '<div class="card">';
  if (weights.length >= 2) {
    const pts = weights.map(function (b) {
      return { y: Number(b.weight), x: b.date };
    });
    h += UI.lineChart(pts);
    h += '<div class="chart-x"><span>' + UI.fmtDate(weights[0].date) + '</span><span>' + UI.fmtDate(weights[weights.length - 1].date) + '</span></div>';
    const diff = Number(weights[weights.length - 1].weight) - Number(weights[0].weight);
    h += '<div class="hintline" style="text-align:left;padding-top:10px">区间变化 ' +
      (diff >= 0 ? '+' : '') + diff.toFixed(1) + ' kg，共 ' + weights.length + ' 条记录。</div>';
  } else if (weights.length === 1) {
    h += '<div class="row" style="border:0;padding:0"><div class="grow"><div class="t">当前体重</div>' +
      '<div class="s">' + UI.fmtDate(weights[0].date) + '</div></div>' +
      '<div class="v">' + num(weights[0].weight) + ' kg</div></div>' +
      '<div class="hintline">再记录一次就能看到曲线</div>';
  } else {
    h += '<div class="empty" style="padding:24px 0">' + UI.ICON.data + '<p>还没有体重记录</p><span>记两次以上就能看到变化趋势</span></div>';
  }
  h += '<button class="btn" style="width:100%;height:46px;margin-top:12px" data-act="add-body">+ 记录体重与围度</button>';
  h += '</div>';

  /* 训练历史 */
  h += '<div class="sec-title">训练历史 · ' + s.sessions.length + ' 次</div>';
  if (!s.sessions.length) {
    h += '<div class="empty">' + UI.ICON.train + '<p>还没有训练记录</p><span>完成第一次训练就会出现在这里</span></div>';
  } else {
    h += '<div class="card">';
    s.sessions.slice().reverse().slice(0, 12).forEach(function (sn) {
      h += '<div class="row" data-act="open-session" data-id="' + sn.id + '">' +
        '<div class="grow"><div class="t">' + UI.esc(sn.dayName) + '</div>' +
        '<div class="s">' + UI.relDay(sn.date) + ' · ' + sn.sets + ' 组 · ' + UI.fmtDur(sn.duration) + '</div></div>' +
        '<div class="v">' + Math.round(sn.volume) + '<small style="font-size:11px;color:var(--ink3);font-weight:400"> kg</small></div>' +
        UI.ICON.chev + '</div>';
    });
    h += '</div>';
  }

  /* 设置与数据管理 */
  h += '<div class="sec-title">设置</div>';
  h += '<div class="card">' +
    '<div class="row" data-act="setup-plan"><div class="grow"><div class="t">训练目标与频率</div>' +
    '<div class="s">' + (s.profile ? GOALS[s.profile.goal].name + ' · 每周 ' + s.profile.days + ' 天 · ' + SCENES[s.profile.scene].name : '未设置') + '</div></div>' +
    UI.ICON.chev + '</div>' +
    '<div class="row" data-act="export"><div class="grow"><div class="t">导出数据</div>' +
    '<div class="s">复制 JSON 备份到剪贴板</div></div>' + UI.ICON.chev + '</div>' +
    '<div class="row" data-act="import"><div class="grow"><div class="t">导入数据</div>' +
    '<div class="s">从备份 JSON 恢复</div></div>' + UI.ICON.chev + '</div>' +
    '<div class="row" data-act="wipe"><div class="grow"><div class="t" style="color:var(--red)">清空全部数据</div>' +
    '<div class="s">不可恢复，请先导出备份</div></div>' + UI.ICON.chev + '</div>' +
    '</div>';

  h += '<div class="hintline">数据保存在这台设备的浏览器里。<br>换手机或清缓存会丢失，重要数据请定期导出。</div>';
  return h;
};

/* ==========================================================
   训练进行中（全屏）
   ========================================================== */
Views.active = function () {
  const a = App.state.active;
  if (!a) return '';
  const it = a.items[a.cursor];
  if (!it) return '';

  /* --- 休息倒计时（覆盖整屏） --- */
  if (App.rest) {
    const total = App.rest.total;
    const left = Math.max(0, Math.ceil((App.rest.endAt - Date.now()) / 1000));
    const p = 1 - left / total;
    return '<div class="overlay">' +
      '<div class="ov-head"><div style="flex:1"></div>' +
      '<div class="clock">' + UI.fmtDur((Date.now() - a.startedAt) / 1000) + '</div></div>' +
      '<div class="rest">' +
      '<div class="ringwrap">' + UI.ring(p, 236, 10, '#1D9E75') +
      '<div class="txt"><div class="n">' + left + '</div><div class="l">秒后开始下一组</div></div></div>' +
      '<div class="next">' + UI.esc(App.rest.msg) + '</div>' +
      '<div class="acts">' +
      '<button class="btn" data-act="rest-plus">+20 秒</button>' +
      '<button class="btn btn-primary" data-act="rest-skip">跳过休息</button>' +
      '</div></div></div>';
  }

  const done = it.logs.length;
  const ex = EX_MAP[it.exId];
  const timed = isTimedItem(it);
  const bodyOnly = isBodyweight(it.exId);

  let h = '<div class="overlay">';

  /* 顶栏：关闭 + 进度 + 计时 */
  h += '<div class="ov-head">' +
    '<button class="x" data-act="quit">' + UI.ICON.x + '</button>' +
    '<div class="prog">' +
    '<div class="lg">动作 ' + (a.cursor + 1) + ' / ' + a.items.length + ' · ' + UI.esc(a.dayName) + '</div>' +
    '<div class="bg"><div class="bar" style="width:' + Math.round((a.cursor / a.items.length) * 100) + '%"></div></div>' +
    '</div>' +
    '<div class="clock">' + UI.fmtDur((Date.now() - a.startedAt) / 1000) + '</div>' +
    '</div>';

  h += '<div class="ov-body">';

  /* 动作标题 */
  h += '<h1 class="ex-title">' + UI.esc(it.name) + '</h1>';
  h += '<div class="ex-sub">目标 <b>' + it.sets + ' 组 × ' + UI.esc(it.reps) + '</b> · 组间休息 ' + it.rest + ' 秒 · 已完成 ' + done + ' 组</div>';

  /* 渐进建议 */
  const hint = it.hint;
  if (hint && done === 0) {
    h += '<div class="tipbox"><div class="h">本次建议</div><ul><li>' + UI.esc(hint.text) + '</li></ul></div>';
  }

  /* 已完成的组 */
  if (done) {
    h += '<div class="sec-title" style="margin-top:14px">已完成</div>';
    it.logs.forEach(function (l, i) {
      h += '<div class="setrow">' +
        '<div class="no">' + (i + 1) + '</div>' +
        '<div class="w">' + setLabel(it, l) + '</div>' +
        (l.rpe ? '<div class="rpe">RPE ' + l.rpe + '</div>' : '') +
        '<button class="del" data-act="del-set" data-i="' + i + '">' + UI.ICON.trash + '</button>' +
        '</div>';
    });
  }

  /* 动作要点 */
  if (ex) {
    h += '<div class="sec-title" style="margin-top:14px">动作要点</div>';
    h += '<div class="tipbox" style="background:#EFF1F4"><ul>' +
      ex.tips.map(function (t) { return '<li style="color:var(--ink2)">' + UI.esc(t) + '</li>'; }).join('') +
      '</ul></div>';
  }

  h += '<div style="height:16px"></div></div>';

  /* 输入面板 */
  h += '<div class="pad">';
  h += '<div class="pad-row">' +
    '<div class="numfield"><div class="lb">' + (bodyOnly ? '负重 kg' : '重量 kg') + '</div><div class="ctl">' +
    '<button class="pm" data-act="step-w" data-v="-1">−</button>' +
    '<div class="val">' + num(a.cur.w) + '</div>' +
    '<button class="pm" data-act="step-w" data-v="1">+</button>' +
    '</div></div>' +
    '<div class="numfield"><div class="lb">' + (timed ? '秒数' : '次数') + '</div><div class="ctl">' +
    '<button class="pm" data-act="step-r" data-v="-1">−</button>' +
    '<div class="val">' + a.cur.reps + '</div>' +
    '<button class="pm" data-act="step-r" data-v="1">+</button>' +
    '</div></div>' +
    '</div>';

  h += '<div class="rpe-row"><span class="lb">强度</span>';
  [0, 6, 7, 8, 9, 10].forEach(function (r) {
    h += '<button class="' + (a.cur.rpe === r ? 'on' : '') + '" data-act="pick-rpe" data-v="' + r + '">' + (r === 0 ? '跳过' : r) + '</button>';
  });
  h += '</div>';

  h += '<button class="cta" style="margin-bottom:10px" data-act="finish-set">' +
    UI.ICON.check + '完成第 ' + (done + 1) + ' 组</button>';

  if (done > 0) {
    h += '<button class="btn" style="width:100%;height:44px;margin-bottom:8px;border:0;background:transparent;color:var(--ink3)" data-act="next-ex">' +
      (a.cursor < a.items.length - 1 ? '跳过，做下一个动作' : '结束本次训练') + '</button>';
  }
  h += '</div>';

  h += '</div>';
  return h;
};

/* 训练总结 */
Views.summary = function (sn) {
  return '<div class="overlay">' +
    '<div class="ov-head"><div style="flex:1"></div></div>' +
    '<div class="ov-body">' +
    '<h1 class="ex-title" style="margin-top:20px">训练完成</h1>' +
    '<div class="ex-sub">' + UI.esc(sn.dayName) + ' · ' + UI.fmtDate(sn.date) + ' ' + UI.weekdayName(sn.date) + '</div>' +
    '<div class="stats" style="grid-template-columns:1fr 1fr">' +
    '<div class="stat hi"><div class="k">总容量</div><div class="v">' + Math.round(sn.volume) + '<small>kg</small></div></div>' +
    '<div class="stat"><div class="k">用时</div><div class="v" style="font-size:20px">' + UI.fmtDur(sn.duration) + '</div></div>' +
    '<div class="stat"><div class="k">完成组数</div><div class="v">' + sn.sets + '<small>组</small></div></div>' +
    '<div class="stat"><div class="k">动作数</div><div class="v">' + sn.items.length + '<small>个</small></div></div>' +
    '</div>' +
    '<div class="sec-title" style="margin-top:24px">本次明细</div>' +
    '<div class="card">' +
    sn.items.map(function (it) {
      const vol = it.logs.reduce(function (a, l) { return a + l.w * l.reps; }, 0);
      const mx = it.logs.reduce(function (a, l) { return Math.max(a, l.w); }, 0);
      return '<div class="exrow"><div class="grow"><div class="n">' + UI.esc(it.name) + '</div>' +
        '<div class="m">' + it.logs.length + ' 组' + (mx > 0 ? ' · 最大 ' + num(mx) + 'kg' : ' · 自重') + '</div></div>' +
        '<div class="sr">' + (vol > 0 ? Math.round(vol) + ' kg' : '—') + '</div></div>';
    }).join('') +
    '</div>' +
    '<button class="cta" style="margin-top:20px" data-act="close-summary">' + UI.ICON.check + '返回首页</button>' +
    '<div style="height:20px"></div>' +
    '</div></div>';
};

/* 历史训练详情 */
Views.sessionDetail = function (id) {
  const sn = App.state.sessions.filter(function (x) { return x.id === id; })[0];
  if (!sn) return '';
  return '<div class="stats" style="grid-template-columns:1fr 1fr;margin-bottom:16px">' +
    '<div class="stat"><div class="k">总容量</div><div class="v">' + Math.round(sn.volume) + '<small>kg</small></div></div>' +
    '<div class="stat"><div class="k">用时</div><div class="v" style="font-size:20px">' + UI.fmtDur(sn.duration) + '</div></div>' +
    '</div>' +
    sn.items.map(function (it) {
      return '<div style="margin-bottom:14px">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:6px">' + UI.esc(it.name) + '</div>' +
        it.logs.map(function (l, i) {
          return '<div class="setrow" style="padding:9px 12px;margin-bottom:6px">' +
            '<div class="no">' + (i + 1) + '</div>' +
            '<div class="w" style="font-size:14px">' + setLabel(it, l) + '</div>' +
            (l.rpe ? '<div class="rpe">RPE ' + l.rpe + '</div>' : '') + '</div>';
        }).join('') +
        '</div>';
    }).join('') +
    '<button class="btn" style="width:100%;height:46px;margin-top:8px" data-act="close-sheet">关闭</button>';
};
