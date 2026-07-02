import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { motion } from "motion/react";
import { WeeklyPlanItem } from "../types";

interface HomeViewProps {
  key?: string;
  weeklyPlan: WeeklyPlanItem[];
  setWeeklyPlan: Dispatch<SetStateAction<WeeklyPlanItem[]>>;
  onStartWorkout: () => void;
  userId?: string;
  userAvatar?: string;
}

export default function HomeView({
  weeklyPlan,
  setWeeklyPlan,
  onStartWorkout,
  userId,
  userAvatar,
}: HomeViewProps) {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePlanChange = (index: number, val: string) => {
    const updated = [...weeklyPlan];
    updated[index].planText = val;
    setWeeklyPlan(updated);
  };

  const handleTypeChange = (index: number, type: "力量" | "休息" | "有氧" | "核心") => {
    const updated = [...weeklyPlan];
    updated[index].type = type;
    if (type === "休息") {
      updated[index].duration = "休息";
    } else if (updated[index].duration === "休息") {
      updated[index].duration = "45m";
    }
    setWeeklyPlan(updated);
  };

  const handleDurationChange = (index: number, val: string) => {
    const updated = [...weeklyPlan];
    updated[index].duration = val;
    setWeeklyPlan(updated);
  };

  const getWeekDateString = (dayIndex: number) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, ...
    const distance = dayIndex - (currentDay === 0 ? 6 : currentDay - 1);
    const targetDate = new Date(now.getTime() + distance * 24 * 60 * 60 * 1000);
    
    if (distance === 0) {
      return "今日";
    }
    
    const month = targetDate.getMonth() + 1;
    const date = targetDate.getDate();
    return `${month}月${date}日`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-8 w-full"
    >
      {/* Welcome Hero Grid */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-brand-card to-brand-bg p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-lime/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Circular user avatar with dynamic storage url */}
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-brand-lime shadow-[0_0_15px_rgba(195,244,0,0.3)] shrink-0">
            <img
              alt="User Profile Avatar"
              className="w-full h-full object-cover"
              src={userAvatar || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=150&q=80"}
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-lime/10 text-brand-lime text-xs font-mono font-bold border border-brand-lime/20 mb-2 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-lime"></span>
              智能教练系统已就绪
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-black text-brand-text tracking-tight">
              你好，{userId || "Alex"}！
            </h2>
            <p className="text-brand-text-muted mt-1 text-xs md:text-sm font-sans">
              今天也是超越自我的一天。保持专注，点燃激情！
            </p>
          </div>
        </div>

        {/* Real-time Clock Dashboard */}
        <div className="flex flex-col items-end bg-brand-black/40 backdrop-blur-md px-5 py-3 rounded-xl border border-white/5 w-full sm:w-auto font-mono">
          <span className="text-xs text-brand-text-muted uppercase tracking-widest mb-1 font-sans">本地时间</span>
          <span className="text-2xl md:text-3xl font-bold text-brand-lime neon-text-lime">
            {currentTime || "00:00:00"}
          </span>
          <span className="text-[10px] text-brand-text-dark font-sans mt-1">2026年6月30日</span>
        </div>
      </div>

      {/* Active Plan Overview (Today's Focus) */}
      <div className="relative bg-brand-card-high/90 rounded-2xl p-6 md:p-8 border border-brand-lime/20 shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-lime/10 to-transparent opacity-40 transition-opacity group-hover:opacity-60"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-lime/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="font-sans font-bold text-xs uppercase tracking-widest text-brand-lime bg-brand-lime/10 px-3 py-1 rounded-full border border-brand-lime/20">
              今日重点训练
            </span>
            <div className="flex items-center gap-1 text-brand-lime">
              <span className="material-symbols-outlined text-xl drop-shadow-[0_0_8px_rgba(195,244,0,0.8)] fill-1">
                local_fire_department
              </span>
              <span className="text-xs font-bold font-mono">240 Kcal</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h3 className="text-3xl font-display font-black text-brand-text tracking-tight">
                {weeklyPlan[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.planText || "胸部与三头肌"}
              </h3>
              <p className="text-brand-text-muted text-sm mt-1">
                {weeklyPlan[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.type === "休息"
                  ? "今日休息 • 放松恢复 • 积蓄能量"
                  : `系统级${weeklyPlan[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.type}特训 • 强效塑形 • 预计时长 ${parseInt(weeklyPlan[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.duration) || 60} 分钟`}
              </p>
            </div>
            <div className="text-right sm:text-right flex sm:flex-col justify-between sm:justify-center items-center sm:items-end w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
              <span className="text-xs text-brand-text-muted font-mono tracking-widest">PROGRESS</span>
              <span className="text-lg font-display font-extrabold text-brand-lime">Day {new Date().getDay() === 0 ? 7 : new Date().getDay()} / 7</span>
            </div>
          </div>

          <div className="w-full bg-brand-black rounded-full h-3.5 mt-2 overflow-hidden border border-white/5 p-[2px]">
            <div 
              className="bg-gradient-to-r from-brand-lime-dim to-brand-lime h-full rounded-full shadow-[0_0_12px_rgba(195,244,0,0.7)]"
              style={{ width: `${((new Date().getDay() === 0 ? 7 : new Date().getDay()) / 7) * 100}%` }}
            ></div>
          </div>

          <button
            onClick={onStartWorkout}
            className="mt-4 w-full bg-brand-lime text-brand-black font-display font-extrabold text-sm uppercase py-4 rounded-xl tracking-wider hover:bg-brand-lime-dim transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-lime flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(195,244,0,0.35)] hover:shadow-[0_0_28px_rgba(195,244,0,0.6)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg fill-1">play_arrow</span>
            开始训练
          </button>
        </div>
      </div>

      {/* Weekly Schedule Input */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-xl font-display font-bold text-brand-text flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-lime">calendar_month</span>
            周度健身体系规划
          </h3>
          <span className="text-xs text-brand-text-muted font-mono">横向滑动/点击卡片可修改计划</span>
        </div>

        {/* Horizontal Day Selector */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3 snap-x">
          {weeklyPlan.map((day, idx) => {
            const currentDay = new Date().getDay();
            const todayIdx = currentDay === 0 ? 6 : currentDay - 1;
            const isToday = idx === todayIdx;
            const isRest = day.type === "休息";

            return (
              <div
                key={day.dayName}
                className={`snap-center shrink-0 w-72 rounded-2xl p-5 border transition-all duration-300 flex flex-col gap-4 relative ${
                  isToday
                    ? "bg-brand-card-high border-brand-lime shadow-[0_0_20px_rgba(195,244,0,0.15)]"
                    : "bg-brand-card/90 border-white/5 hover:border-white/10"
                }`}
              >
                {/* Active/Today Dot */}
                {isToday && (
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    <span className="w-2 h-2 bg-brand-lime rounded-full animate-ping"></span>
                    <span className="w-2 h-2 bg-brand-lime rounded-full absolute"></span>
                    <span className="text-[10px] font-mono text-brand-lime font-bold ml-3">TODAY</span>
                  </div>
                )}

                {/* Day title info */}
                <div>
                  <span className="text-xs font-mono font-semibold text-brand-text-muted uppercase tracking-widest block mb-1">
                    {day.dayName}
                  </span>
                  <h4 className={`text-lg font-display font-bold ${isToday ? "text-brand-lime" : "text-brand-text"}`}>
                    {getWeekDateString(idx)}
                  </h4>
                </div>

                {/* Edit Plan Text Input */}
                <div className="flex flex-col gap-1.5 bg-brand-black/40 p-3 rounded-lg border border-white/5">
                  <label className="text-[10px] text-brand-text-dark uppercase font-mono tracking-widest">
                    训练项目
                  </label>
                  <input
                    type="text"
                    value={day.planText}
                    onChange={(e) => handlePlanChange(idx, e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-white/10 focus:border-brand-lime text-sm font-semibold text-brand-text focus:ring-0 p-0 pb-1 transition-colors outline-none"
                    placeholder="例如: 腿部与核心"
                  />
                </div>

                {/* Type Selection Tabs */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-brand-text-dark uppercase font-mono tracking-widest mb-1">
                    计划类型
                  </span>
                  <div className="grid grid-cols-4 gap-1 bg-brand-black p-1 rounded-lg border border-white/5 text-[11px] font-bold text-center">
                    {(["力量", "有氧", "核心", "休息"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleTypeChange(idx, t)}
                        className={`py-1 rounded-md transition-all cursor-pointer ${
                          day.type === t
                            ? "bg-brand-lime text-brand-black"
                            : "text-brand-text-muted hover:text-brand-text"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom detail specs (Duration edit) */}
                <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                  <span className="text-xs text-brand-text-muted font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      {isRest ? "self_improvement" : "timer"}
                    </span>
                    {isRest ? "放松恢复" : "预估时长"}
                  </span>

                  {!isRest ? (
                    <select
                      value={day.duration}
                      onChange={(e) => handleDurationChange(idx, e.target.value)}
                      className="bg-brand-black text-brand-lime font-mono text-xs font-bold border border-white/10 rounded-md py-1 px-2 focus:ring-1 focus:ring-brand-lime focus:outline-none"
                    >
                      <option value="30m">30 分钟</option>
                      <option value="45m">45 分钟</option>
                      <option value="50m">50 分钟</option>
                      <option value="60m">60 分钟</option>
                      <option value="75m">75 分钟</option>
                      <option value="90m">90 分钟</option>
                    </select>
                  ) : (
                    <span className="text-xs text-brand-cyan font-semibold bg-brand-cyan/10 px-2.5 py-1 rounded-full border border-brand-cyan/25">
                      休息日
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
