/* ==========================================================
   健身 App · 静态数据层
   肌群 / 动作库 / 计划模板 / 目标参数
   ========================================================== */

const MUSCLES = [
  { id: 'chest',     name: '胸' },
  { id: 'back',      name: '背' },
  { id: 'legs',      name: '腿臀' },
  { id: 'shoulders', name: '肩' },
  { id: 'arms',      name: '手臂' },
  { id: 'core',      name: '核心' }
];

const EQ_NAME = {
  barbell:    '杠铃',
  dumbbell:   '哑铃',
  machine:    '固定器械',
  cable:      '绳索',
  bodyweight: '自重'
};

const GOALS = {
  muscle: {
    id: 'muscle', name: '增肌', short: '增肌',
    desc: '把肌肉练大：组数偏多、重量偏重、休息充分',
    sets: 4, reps: '6-10', rest: 120
  },
  fat: {
    id: 'fat', name: '减脂', short: '减脂',
    desc: '提高消耗：次数偏多、间歇缩短、保持心率',
    sets: 3, reps: '12-15', rest: 60
  },
  posture: {
    id: 'posture', name: '体态', short: '体态',
    desc: '改善体态：中低强度、控制节奏、重视后侧链',
    sets: 3, reps: '10-12', rest: 75
  }
};

const SCENES = {
  gym:  { id: 'gym',  name: '健身房', desc: '杠铃、器械齐全' },
  home: { id: 'home', name: '在家练', desc: '只用哑铃和自重' }
};

/* ---------------------------------------------------------
   动作库
   tips     训练要点
   mistakes 常见错误
   homeAlt  居家替代动作（无器械时的同肌群替代）
   --------------------------------------------------------- */
const EXERCISES = [

  /* ============ 胸 ============ */
  { id:'bench_press', name:'杠铃卧推', muscle:'chest', eq:'barbell', level:2, homeAlt:'db_press',
    tips:['肩胛后缩下沉，上背和臀部始终贴紧凳面','杠铃下放到乳头附近，前臂垂直地面，手腕不要后折'],
    mistakes:['手肘外展到与肩同线，肩关节压力陡增','把杠铃弹在胸口借力，失去控制'] },

  { id:'incline_db_press', name:'上斜哑铃卧推', muscle:'chest', eq:'dumbbell', level:2, homeAlt:null,
    tips:['椅背放到 30 度左右，角度越大越偏肩','下放到哑铃与胸口齐平，推起时略微向内收'],
    mistakes:['椅背调到 45 度以上，动作变成肩推','下放过深，肩前侧有牵拉不适'] },

  { id:'db_press', name:'哑铃平板卧推', muscle:'chest', eq:'dumbbell', level:1, homeAlt:null,
    tips:['哑铃在胸口正上方，不要往外飘','下放到手肘略低于躯干即可推起'],
    mistakes:['两只哑铃互相撞击借力','手肘完全打开成 T 字'] },

  { id:'machine_press', name:'器械推胸', muscle:'chest', eq:'machine', level:1, homeAlt:'pushup',
    tips:['调座椅让握把与胸中部同高','推到底时手肘不要锁死'],
    mistakes:['座椅太低，变成上斜推胸','靠身体前后晃动把重量推出去'] },

  { id:'cable_fly', name:'绳索夹胸', muscle:'chest', eq:'cable', level:2, homeAlt:'pushup',
    tips:['手肘保持微屈的固定角度，靠肩关节内收','在胸前交叉时停 1 秒，感受挤压'],
    mistakes:['做成推的动作，肘关节来回屈伸','回程放得太开，胸肌失去张力'] },

  { id:'pec_deck', name:'蝴蝶机夹胸', muscle:'chest', eq:'machine', level:1, homeAlt:'pushup',
    tips:['上臂与地面平行，手肘略低于肩','回程用 2 秒控制，不要一下松掉'],
    mistakes:['靠身体前倾增加行程','用惯性把配重甩回来'] },

  { id:'dips', name:'双杠臂屈伸', muscle:'chest', eq:'bodyweight', level:3, homeAlt:'pushup',
    tips:['身体略前倾，把重心放在胸而不是三头','下到肩略低于肘即可，不必更深'],
    mistakes:['下沉过深，肩关节前侧受压','耸肩，肩膀顶到耳朵'] },

  { id:'pushup', name:'俯卧撑', muscle:'chest', eq:'bodyweight', level:1, homeAlt:null,
    tips:['手略宽于肩，身体从头到脚一条直线','胸口下到离地一拳，手肘约 45 度夹角'],
    mistakes:['塌腰或者撅屁股','头先往下探，颈椎前伸'] },

  /* ============ 背 ============ */
  { id:'pullup', name:'引体向上', muscle:'back', eq:'bodyweight', level:3, homeAlt:'db_row',
    tips:['先沉肩，再用手肘往身体两侧拉','下巴过杠即可，不必刻意挺胸'],
    mistakes:['靠身体摆荡借力','只做半程就下放，肩胛没有发力'] },

  { id:'lat_pulldown', name:'高位下拉', muscle:'back', eq:'cable', level:1, homeAlt:'db_row',
    tips:['握距略宽于肩，拉到手柄接近锁骨','想象用手肘向下发力，而不是用手去拉'],
    mistakes:['后仰过多，动作变成划船','拉到颈后，肩关节压力大'] },

  { id:'bb_row', name:'杠铃划船', muscle:'back', eq:'barbell', level:2, homeAlt:'db_row',
    tips:['髋部后移，躯干前倾约 45 度，背部挺直','拉向肚脐方向，肩胛主动向后收'],
    mistakes:['用腰部起伏借力','弓背，腰椎承担剪切力'] },

  { id:'db_row', name:'单臂哑铃划船', muscle:'back', eq:'dumbbell', level:1, homeAlt:null,
    tips:['一手一膝撑在凳上，背部与地面平行','手肘贴着身体往后拉，到腰侧停一下'],
    mistakes:['身体扭转借力','只用手臂拉，肩胛不动'] },

  { id:'seated_row', name:'坐姿绳索划船', muscle:'back', eq:'cable', level:1, homeAlt:'db_row',
    tips:['挺胸坐直，拉到手柄贴近腹部','回程让肩胛充分前伸，再重新后缩'],
    mistakes:['身体前后大幅摆动','肩膀耸起跟着用力'] },

  { id:'straight_arm_pulldown', name:'直臂下压', muscle:'back', eq:'cable', level:2, homeAlt:'db_row',
    tips:['手臂基本伸直，靠肩关节把绳索压下去','压到大腿前侧时停一下'],
    mistakes:['手肘弯曲，做成三头下压','上身过度前倾'] },

  { id:'deadlift', name:'硬拉', muscle:'back', eq:'barbell', level:3, homeAlt:'rdl',
    tips:['杠铃贴着小腿，起杠时用腿推地、髋膝同步伸展','全程保持脊柱中立，先锁髋再完全站直'],
    mistakes:['弓背起杠，腰椎风险极高','杠铃离身体太远，腰部负担成倍增加'] },

  { id:'tbar_row', name:'T 杠划船', muscle:'back', eq:'barbell', level:2, homeAlt:'db_row',
    tips:['胸口贴紧靠垫，减少腰部压力','拉到手柄接触腹部下端'],
    mistakes:['胸口没贴住，靠腰发力','下放不到位，行程太短'] },

  /* ============ 腿臀 ============ */
  { id:'squat', name:'杠铃深蹲', muscle:'legs', eq:'barbell', level:3, homeAlt:'bulgarian',
    tips:['杠铃放在斜方肌上，双脚与肩同宽、脚尖略外八','下蹲时膝盖顺着脚尖方向，蹲到大腿平行或略低'],
    mistakes:['膝盖内扣','脚跟离地，重心跑到脚尖'] },

  { id:'leg_press', name:'腿举', muscle:'legs', eq:'machine', level:1, homeAlt:'bulgarian',
    tips:['脚踩在踏板中部，与肩同宽','下放到膝盖约 90 度，不追求极限幅度'],
    mistakes:['臀部离开靠垫，腰椎被迫弯曲','顶端把膝盖锁死'] },

  { id:'rdl', name:'罗马尼亚硬拉', muscle:'legs', eq:'barbell', level:2, homeAlt:'hip_thrust',
    tips:['膝盖微屈并固定，靠髋部后移往下放','放到大腿后侧有明显牵拉感就起身'],
    mistakes:['放得过低导致弓背','靠膝盖屈伸完成动作，变成硬拉'] },

  { id:'leg_curl', name:'腿弯举', muscle:'legs', eq:'machine', level:1, homeAlt:'hip_thrust',
    tips:['脚踝勾住滚垫，收缩到最大幅度停 1 秒','回程用 2 秒以上控制'],
    mistakes:['用惯性把滚垫甩起来','臀部抬起离开靠垫'] },

  { id:'leg_ext', name:'腿屈伸', muscle:'legs', eq:'machine', level:1, homeAlt:'bulgarian',
    tips:['膝盖对准器械转轴','伸到接近伸直，顶端停 1 秒'],
    mistakes:['甩腿借力','下放过快，膝关节压力大'] },

  { id:'bulgarian', name:'保加利亚分腿蹲', muscle:'legs', eq:'dumbbell', level:2, homeAlt:null,
    tips:['后脚搭在凳上，前脚往前站足够远','重心落在前脚脚跟，垂直下蹲'],
    mistakes:['前脚站太近，膝盖超过脚尖过多','身体晃动，靠后腿发力'] },

  { id:'lunge', name:'哑铃箭步蹲', muscle:'legs', eq:'dumbbell', level:1, homeAlt:null,
    tips:['双手持哑铃自然下垂，躯干保持直立','下蹲到后膝接近地面再起身'],
    mistakes:['步幅太小，膝盖往前冲','上身过度前倾'] },

  { id:'hip_thrust', name:'臀推', muscle:'legs', eq:'barbell', level:2, homeAlt:null,
    tips:['肩胛下缘抵住凳边，杠铃垫在髋部','顶端夹紧臀部停 1 秒，不要用腰去顶'],
    mistakes:['用腰椎过度伸展代替髋关节伸展','下巴上扬看向天花板'] },

  { id:'calf_raise', name:'站姿提踵', muscle:'legs', eq:'machine', level:1, homeAlt:null,
    tips:['踮到最高点停 1 秒','下放到底，让跟腱充分拉伸'],
    mistakes:['弹震式快速起落','幅度只做一半'] },

  { id:'hack_squat', name:'哈克深蹲', muscle:'legs', eq:'machine', level:2, homeAlt:'bulgarian',
    tips:['背贴紧靠垫，脚踩位置略往前','下蹲到与器械轨迹匹配的深度'],
    mistakes:['脚踩太靠后导致膝内扣','起身时臀部先离垫'] },

  /* ============ 肩 ============ */
  { id:'ohp', name:'杠铃站姿推举', muscle:'shoulders', eq:'barbell', level:3, homeAlt:'db_shoulder_press',
    tips:['核心收紧、臀部夹紧，防止腰部代偿','推起时头略后仰，杠铃过顶后回到耳朵正上方'],
    mistakes:['后仰成上斜推','推起路径绕到身体前方'] },

  { id:'db_shoulder_press', name:'哑铃肩推', muscle:'shoulders', eq:'dumbbell', level:1, homeAlt:null,
    tips:['起始位置哑铃在耳侧，手心朝前或略相对','推到头顶上方，两只哑铃不要互相撞击'],
    mistakes:['耸肩代偿','下放太低，肩关节过度伸展'] },

  { id:'lateral_raise', name:'哑铃侧平举', muscle:'shoulders', eq:'dumbbell', level:1, homeAlt:null,
    tips:['手肘保持微屈，想象用手肘带动手臂','抬到与肩同高即可，小指略高于拇指'],
    mistakes:['甩动身体借力','抬得超过肩高，斜方肌抢了活'] },

  { id:'rear_delt_fly', name:'哑铃反向飞鸟', muscle:'shoulders', eq:'dumbbell', level:1, homeAlt:null,
    tips:['上半身前倾接近水平，手肘保持微屈','往身体两侧打开，肩胛保持稳定不夹'],
    mistakes:['用手臂拉而不是肩后束发力','身体上下起伏借力'] },

  { id:'face_pull', name:'绳索面拉', muscle:'shoulders', eq:'cable', level:2, homeAlt:'rear_delt_fly',
    tips:['绳索调到脸部高度，往额头方向拉','拉到底时手肘高于手腕，最后外旋收尾'],
    mistakes:['重量太大，动作变成划船','耸肩，脖子紧张'] },

  { id:'shrug', name:'哑铃耸肩', muscle:'shoulders', eq:'dumbbell', level:1, homeAlt:null,
    tips:['肩膀垂直向上提，不要绕圈','顶端停 1 秒，感受斜方肌收缩'],
    mistakes:['绕肩旋转，肩关节长期磨损','用手臂屈伸代偿'] },

  /* ============ 手臂 ============ */
  { id:'bb_curl', name:'杠铃弯举', muscle:'arms', eq:'barbell', level:1, homeAlt:'hammer_curl',
    tips:['大臂夹紧身体两侧，肘部不前后移动','弯举到顶峰收缩 1 秒，再慢慢下放'],
    mistakes:['身体后仰把杠铃甩起来','下放到底时手臂完全放松'] },

  { id:'hammer_curl', name:'锤式弯举', muscle:'arms', eq:'dumbbell', level:1, homeAlt:null,
    tips:['手心相对握住哑铃，像握一把锤子','肘部固定在体侧，只动小臂'],
    mistakes:['手腕乱转','借力摆动躯干'] },

  { id:'pushdown', name:'绳索下压', muscle:'arms', eq:'cable', level:1, homeAlt:'overhead_ext',
    tips:['大臂夹紧体侧不动，只动小臂','下压到底时手肘伸直，停一下'],
    mistakes:['手肘向外张开，带动肩膀发力','身体前压来增加重量感'] },

  { id:'close_grip_bench', name:'窄距卧推', muscle:'arms', eq:'barbell', level:2, homeAlt:'pushup',
    tips:['握距与肩同宽，手腕保持中立','下放时手肘贴着身体两侧'],
    mistakes:['握距过窄，手腕承受压力','下放位置太高，变成卧推'] },

  { id:'overhead_ext', name:'哑铃过顶臂屈伸', muscle:'arms', eq:'dumbbell', level:1, homeAlt:null,
    tips:['双手托住一只哑铃举过头顶','下放到颈后，大臂始终保持垂直'],
    mistakes:['手肘向外张开','重量过大导致肩部不稳'] },

  { id:'concentration_curl', name:'集中弯举', muscle:'arms', eq:'dumbbell', level:1, homeAlt:null,
    tips:['手肘抵住大腿内侧固定住','慢慢弯举并顶峰收缩'],
    mistakes:['用身体摆动助力','下放过快，浪费离心阶段'] },

  /* ============ 核心 ============ */
  { id:'plank', name:'平板支撑', muscle:'core', eq:'bodyweight', level:1, homeAlt:null,
    tips:['手肘在肩膀正下方，身体成一条直线','臀部夹紧、腹部收紧，不要塌腰'],
    mistakes:['撅起屁股降低难度','全程憋气，应该保持均匀呼吸'] },

  { id:'crunch', name:'卷腹', muscle:'core', eq:'bodyweight', level:1, homeAlt:null,
    tips:['下巴留一拳空隙，靠腹部把肩胛卷离地面','顶端停 1 秒，再慢慢回落'],
    mistakes:['用手掰脖子','整个人坐起来，变成仰卧起坐'] },

  { id:'hanging_leg_raise', name:'悬垂举腿', muscle:'core', eq:'bodyweight', level:3, homeAlt:'dead_bug',
    tips:['先稳住肩胛再抬腿，别一上来就晃','抬到腿与地面平行即可，下放要控制'],
    mistakes:['身体前后摆荡借力','只抬膝盖，骨盆没有卷起'] },

  { id:'russian_twist', name:'俄罗斯转体', muscle:'core', eq:'bodyweight', level:1, homeAlt:null,
    tips:['上身后倾约 45 度，背部保持挺直','转动来自躯干旋转，不是甩手臂'],
    mistakes:['弓背','速度太快，全靠惯性'] },

  { id:'dead_bug', name:'死虫式', muscle:'core', eq:'bodyweight', level:1, homeAlt:null,
    tips:['腰部始终贴地，压住不留缝','对侧手脚同时缓慢伸展'],
    mistakes:['腰部拱起离地','动作太快，失去控制'] },

  { id:'cable_crunch', name:'绳索卷腹', muscle:'core', eq:'cable', level:2, homeAlt:'crunch',
    tips:['跪姿，绳索固定在头部两侧','靠腹部收缩把肘部拉向膝盖'],
    mistakes:['用髋部发力往下拉','手臂主动发力，变成下拉'] }
];

const EX_MAP = {};
EXERCISES.forEach(function (e) { EX_MAP[e.id] = e; });

/* ---------------------------------------------------------
   训练计划模板
   格式 [动作id, 组数, 次数覆盖?]  —— 次数不写则用目标默认值
   --------------------------------------------------------- */
const DAY_TEMPLATES = {
  2: [
    { key:'fb_a', name:'全身 A', focus:'全身', items:[
      ['squat',4], ['bench_press',4], ['bb_row',4], ['db_shoulder_press',3], ['plank',3,'40-60 秒']
    ]},
    { key:'fb_b', name:'全身 B', focus:'全身', items:[
      ['deadlift',3], ['incline_db_press',4], ['lat_pulldown',4], ['lateral_raise',3], ['crunch',3]
    ]}
  ],
  3: [
    { key:'push', name:'推 · 胸肩三头', focus:'胸 / 肩 / 手臂', items:[
      ['bench_press',4], ['incline_db_press',3], ['db_shoulder_press',3], ['lateral_raise',3], ['pushdown',3]
    ]},
    { key:'pull', name:'拉 · 背二头', focus:'背 / 手臂', items:[
      ['pullup',4], ['bb_row',4], ['seated_row',3], ['face_pull',3], ['bb_curl',3]
    ]},
    { key:'legs', name:'腿 · 下肢核心', focus:'腿臀 / 核心', items:[
      ['squat',4], ['rdl',3], ['leg_press',3], ['leg_curl',3], ['calf_raise',4], ['plank',3,'40-60 秒']
    ]}
  ],
  4: [
    { key:'upper_a', name:'上肢 A · 水平推拉', focus:'胸 / 背', items:[
      ['bench_press',4], ['bb_row',4], ['db_shoulder_press',3], ['lateral_raise',3], ['bb_curl',3], ['pushdown',3]
    ]},
    { key:'lower_a', name:'下肢 A · 股四头主导', focus:'腿臀 / 核心', items:[
      ['squat',4], ['leg_press',3], ['leg_ext',3], ['leg_curl',3], ['calf_raise',4], ['plank',3,'40-60 秒']
    ]},
    { key:'upper_b', name:'上肢 B · 垂直推拉', focus:'肩 / 背', items:[
      ['incline_db_press',4], ['lat_pulldown',4], ['db_row',3], ['rear_delt_fly',3], ['hammer_curl',3], ['overhead_ext',3]
    ]},
    { key:'lower_b', name:'下肢 B · 后链主导', focus:'腿臀 / 核心', items:[
      ['rdl',4], ['hip_thrust',3], ['bulgarian',3], ['leg_curl',3], ['calf_raise',4], ['hanging_leg_raise',3]
    ]}
  ],
  5: [
    { key:'chest', name:'胸 · 三头', focus:'胸 / 手臂', items:[
      ['bench_press',4], ['incline_db_press',4], ['cable_fly',3], ['dips',3], ['pushdown',3]
    ]},
    { key:'back', name:'背 · 二头', focus:'背 / 手臂', items:[
      ['pullup',4], ['bb_row',4], ['lat_pulldown',3], ['seated_row',3], ['bb_curl',3]
    ]},
    { key:'legs5', name:'腿 · 臀', focus:'腿臀 / 核心', items:[
      ['squat',4], ['rdl',3], ['leg_press',3], ['leg_curl',3], ['calf_raise',4], ['plank',3,'40-60 秒']
    ]},
    { key:'shoulders', name:'肩 · 斜方', focus:'肩', items:[
      ['ohp',4], ['db_shoulder_press',3], ['lateral_raise',4], ['rear_delt_fly',3], ['shrug',3]
    ]},
    { key:'arms', name:'手臂 · 核心', focus:'手臂 / 核心', items:[
      ['close_grip_bench',4], ['bb_curl',4], ['hammer_curl',3], ['pushdown',3], ['concentration_curl',3], ['crunch',3]
    ]}
  ]
};

/* 一周 7 天（0 = 周一）里安排哪几天训练。
   均匀铺开，周末不留空——很多人只有周末有空练。 */
const WEEK_PATTERN = {
  2: [1, 4],
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 3, 4, 6]
};

const WEEK_NAMES = ['一', '二', '三', '四', '五', '六', '日'];

/* ---------------------------------------------------------
   计划生成：目标 + 频率 + 场景 → 一周课表
   --------------------------------------------------------- */
function buildPlan(opt) {
  const goal = GOALS[opt.goal] ? opt.goal : 'muscle';
  const days = DAY_TEMPLATES[opt.days] ? Number(opt.days) : 3;
  const scene = SCENES[opt.scene] ? opt.scene : 'gym';
  const g = GOALS[goal];
  const tpl = DAY_TEMPLATES[days];

  return tpl.map(function (day) {
    const items = day.items.map(function (it) {
      let exId = it[0];
      if (scene === 'home') {
        const src = EX_MAP[exId];
        if (src && src.homeAlt && EX_MAP[src.homeAlt]) exId = src.homeAlt;
      }
      const ex = EX_MAP[exId] || { name: exId, muscle: '' };
      const baseSets = it[1];
      const sets = goal === 'muscle' ? baseSets : Math.max(3, baseSets - 1);
      return {
        exId: exId,
        name: ex.name,
        muscle: ex.muscle,
        sets: sets,
        reps: it[2] || g.reps,
        rest: g.rest
      };
    });
    return { key: day.key, name: day.name, focus: day.focus, items: items };
  });
}

/* 单次训练预计时长（分钟），含热身与拉伸 */
function estimateMinutes(day) {
  let sec = 0;
  day.items.forEach(function (it) {
    const work = it.reps.indexOf('秒') >= 0 ? 55 : 40;
    sec += it.sets * (work + it.rest);
  });
  return Math.max(20, Math.round((sec / 60 + 12) / 5) * 5);
}

/* 由已完成的组反推 1RM（Epley 公式） */
function estimate1RM(weight, reps) {
  if (!weight || !reps || reps < 1) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}
