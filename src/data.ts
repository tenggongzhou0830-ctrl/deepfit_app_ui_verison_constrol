import { WeeklyPlanItem, Exercise, Meal, Track } from "./types";

export const INITIAL_WEEKLY_PLAN: WeeklyPlanItem[] = [
  {
    dayName: "周一",
    dateText: "今日",
    planText: "胸部与三头肌",
    duration: "45m",
    type: "力量"
  },
  {
    dayName: "周二",
    dateText: "11月12日",
    planText: "背部与二头肌",
    duration: "50m",
    type: "力量"
  },
  {
    dayName: "周三",
    dateText: "11月13日",
    planText: "积极恢复",
    duration: "休息",
    type: "休息"
  },
  {
    dayName: "周四",
    dateText: "11月14日",
    planText: "腿部与核心",
    duration: "60m",
    type: "力量"
  },
  {
    dayName: "周五",
    dateText: "11月15日",
    planText: "肩部与手臂",
    duration: "45m",
    type: "力量"
  },
  {
    dayName: "周六",
    dateText: "11月16日",
    planText: "积极恢复",
    duration: "休息",
    type: "休息"
  },
  {
    dayName: "周日",
    dateText: "11月17日",
    planText: "核心与有氧",
    duration: "30m",
    type: "有氧"
  }
];

export const INITIAL_EXERCISES: Exercise[] = [
  {
    id: "ex-1",
    name: "杠铃卧推",
    sets: 4,
    reps: 8,
    weight: 80,
    rest: 90
  },
  {
    id: "ex-2",
    name: "上斜哑铃卧推",
    sets: 3,
    reps: 10,
    weight: 24,
    rest: 60
  },
  {
    id: "ex-3",
    name: "绳索夹胸",
    sets: 4,
    reps: 12,
    weight: 15,
    rest: 45
  }
];

export const INITIAL_MEALS: Meal[] = [];

export const INITIAL_TRACKS: Track[] = [
  {
    id: "track-1",
    title: "Adrenaline Rush",
    artist: "Elite Beats Lab",
    lyrics: [
      "感受怒火",
      "忍痛前行",
      "突破极限",
      "永不退缩",
      "打破界限",
      "永不止步",
      "狂飙肾上腺素",
      "势不可挡"
    ],
    coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "track-2",
    title: "Cyber Neon",
    artist: "Grid Runner",
    lyrics: [
      "霓虹闪烁",
      "光速飞驰",
      "机械之心",
      "电子节拍",
      "无线循环",
      "超越自我的力量",
      "赛博战甲",
      "终极觉醒"
    ],
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "track-3",
    title: "Heavy Iron Lift",
    artist: "The Metal Crew",
    lyrics: [
      "钢铁在轰鸣",
      "汗水在流淌",
      "每一次卧推",
      "都是灵魂的释放",
      "沉重重力",
      "对抗极限阻力",
      "永不妥协",
      "成就非凡身躯"
    ],
    coverUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80"
  }
];
