import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WeeklyPlanItem, Exercise, Meal, Track } from "./types";
import {
  INITIAL_WEEKLY_PLAN,
  INITIAL_EXERCISES,
  INITIAL_MEALS,
  INITIAL_TRACKS,
} from "./data";
import HomeView from "./components/HomeView";
import WorkoutView from "./components/WorkoutView";
import MusicView from "./components/MusicView";
import DietView from "./components/DietView";

export default function App() {
  // Navigation states
  const [activeTab, setActiveTab] = useState<"home" | "workout" | "music" | "diet">("home");

  // Core global state
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanItem[]>(INITIAL_WEEKLY_PLAN);
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [meals, setMeals] = useState<Meal[]>(INITIAL_MEALS);
  const [tracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => {
    return Number(localStorage.getItem("elite_coach_track_index")) || 0;
  });
  
  const updateTrackIndex = (idx: number) => {
    setCurrentTrackIndex(idx);
    localStorage.setItem("elite_coach_track_index", idx.toString());
  };

  // User ID Customization state
  const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=150&q=80";
  const [userId, setUserId] = useState<string>(() => localStorage.getItem("elite_coach_user_id") || "Alex");
  const [tempId, setTempId] = useState<string>(userId);
  const [userAvatar, setUserAvatar] = useState<string>(() => localStorage.getItem("elite_coach_user_avatar") || DEFAULT_AVATAR);
  const [tempAvatar, setTempAvatar] = useState<string>(userAvatar);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleSaveProfile = (newId: string, newAvatar: string) => {
    const trimmed = newId.trim();
    if (trimmed) {
      setUserId(trimmed);
      localStorage.setItem("elite_coach_user_id", trimmed);
    }
    setUserAvatar(newAvatar);
    localStorage.setItem("elite_coach_user_avatar", newAvatar);
    setAvatarError(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAvatarError("图片大小不可超过 2MB");
        return;
      }
      setAvatarError(null);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setTempAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Training state
  const [isTraining, setIsTraining] = useState(false);

  // Quick Action: Home "开始训练" -> switch to Workout view and jump to the editor planner!
  const handleStartWorkoutFromHome = () => {
    setActiveTab("workout");
    setIsTraining(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans flex flex-col relative pb-28 md:pb-8">
      {/* =========================================
         TOP NAV BAR (Desktop Head)
         ========================================= */}
      <header className="fixed top-0 left-0 w-full z-40 bg-brand-bg/85 backdrop-blur-xl border-b border-white/5 flex flex-col">
        <div className="flex justify-between items-center px-4 md:px-12 h-16 max-w-7xl mx-auto w-full">
          {/* Logo Brand with Neon Glow */}
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-2 cursor-pointer transition-transform active:scale-95 group"
          >
            <span className="material-symbols-outlined text-brand-lime text-2xl drop-shadow-[0_0_8px_rgba(195,244,0,0.8)] fill-1">
              sports_gymnastics
            </span>
            <span className="font-display font-black text-xl text-brand-lime tracking-wider uppercase group-hover:opacity-80 transition-opacity">
              ICE COACH
            </span>
            <span className="hidden sm:inline-block text-[10px] bg-brand-lime/10 border border-brand-lime/25 text-brand-lime font-mono font-bold px-2 py-0.5 rounded ml-1">
              PRO v2.0
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => {
                setActiveTab("home");
                setIsTraining(false);
              }}
              className={`font-display text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all cursor-pointer ${
                activeTab === "home"
                  ? "text-brand-lime border-brand-lime drop-shadow-[0_0_6px_rgba(195,244,0,0.4)]"
                  : "text-brand-text-muted border-transparent hover:text-brand-text"
              }`}
            >
              首页
            </button>
            <button
              onClick={() => setActiveTab("workout")}
              className={`font-display text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all cursor-pointer ${
                activeTab === "workout"
                  ? "text-brand-lime border-brand-lime drop-shadow-[0_0_6px_rgba(195,244,0,0.4)]"
                  : "text-brand-text-muted border-transparent hover:text-brand-text"
              }`}
            >
              {isTraining ? "训练执行中" : "训练"}
            </button>
            <button
              onClick={() => {
                setActiveTab("music");
                setIsTraining(false);
              }}
              className={`font-display text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all cursor-pointer ${
                activeTab === "music"
                  ? "text-brand-lime border-brand-lime drop-shadow-[0_0_6px_rgba(195,244,0,0.4)]"
                  : "text-brand-text-muted border-transparent hover:text-brand-text"
              }`}
            >
              音乐
            </button>
            <button
              onClick={() => {
                setActiveTab("diet");
                setIsTraining(false);
              }}
              className={`font-display text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all cursor-pointer ${
                activeTab === "diet"
                  ? "text-brand-lime border-brand-lime drop-shadow-[0_0_6px_rgba(195,244,0,0.4)]"
                  : "text-brand-text-muted border-transparent hover:text-brand-text"
              }`}
            >
              饮食
            </button>
          </nav>

          {/* Profile User avatar indicator with inline editable popover */}
          <div className="relative flex items-center gap-2.5">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setTempId(userId);
                setTempAvatar(userAvatar);
                setAvatarError(null);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all active:scale-95 cursor-pointer select-none"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-lime/50 relative shadow-[0_0_6px_rgba(195,244,0,0.2)]">
                <img
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  src={userAvatar}
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs font-black text-brand-text truncate max-w-[80px]">
                {userId}
              </span>
              <span className="material-symbols-outlined text-[14px] text-brand-text-muted">
                {isProfileOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              </span>
            </button>

            {/* INS Style Popover */}
            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute right-0 top-11 z-50 w-72 bg-[#0e0e0ed9] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.7)] flex flex-col gap-4.5"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-brand-text-dark font-black uppercase tracking-wider">
                        PROFILE SETTING • 个人设置
                      </span>
                      <span className="text-xs text-brand-text-muted">
                        自定义您的专属 ID 和头像
                      </span>
                    </div>

                    {/* Avatar Preview & Upload Zone */}
                    <div className="flex items-center gap-3 bg-brand-black/40 p-2.5 rounded-xl border border-white/5">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-lime/75 relative shadow-[0_0_10px_rgba(195,244,0,0.3)] shrink-0">
                        <img
                          alt="Temp Avatar"
                          className="w-full h-full object-cover"
                          src={tempAvatar}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-lg text-brand-text cursor-pointer transition-all active:scale-95 text-center font-bold">
                          上传本地图片
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </label>
                        {avatarError && (
                          <span className="text-[9px] text-red-400 font-bold leading-none mt-0.5">
                            {avatarError}
                          </span>
                        )}
                      </div>
                    </div>



                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] text-brand-text-dark font-black uppercase tracking-wider">
                        修改用户昵称
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-lime font-mono">@</span>
                        <input
                          type="text"
                          maxLength={15}
                          value={tempId}
                          onChange={(e) => setTempId(e.target.value)}
                          className="w-full bg-brand-black/60 hover:bg-brand-black/80 focus:bg-brand-black border border-white/5 focus:border-brand-lime/40 rounded-xl py-2 pl-7 pr-3 text-xs font-bold text-brand-text outline-none transition-all"
                          placeholder="输入新 ID..."
                        />
                      </div>
                      
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            setTempId(userId);
                            setTempAvatar(userAvatar);
                          }}
                          className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase border border-white/5 hover:border-white/15 text-brand-text-muted hover:text-brand-text transition-all cursor-pointer"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => {
                            handleSaveProfile(tempId, tempAvatar);
                            setIsProfileOpen(false);
                          }}
                          className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase bg-brand-lime text-brand-black hover:brightness-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(195,244,0,0.15)] cursor-pointer"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* =========================================
         MAIN CANVAS (Responsive Body Context)
         ========================================= */}
      <main className="flex-grow pt-24 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <HomeView
              key="home"
              weeklyPlan={weeklyPlan}
              setWeeklyPlan={setWeeklyPlan}
              onStartWorkout={handleStartWorkoutFromHome}
              userId={userId}
              userAvatar={userAvatar}
            />
          )}

          {activeTab === "workout" && (
            <WorkoutView
              key="workout"
              exercises={exercises}
              setExercises={setExercises}
              isTraining={isTraining}
              setIsTraining={setIsTraining}
            />
          )}

          {activeTab === "diet" && (
            <DietView key="diet" meals={meals} setMeals={setMeals} />
          )}
        </AnimatePresence>

        {/* Global Persistent Music Player */}
        <MusicView
          key="music"
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          setCurrentTrackIndex={updateTrackIndex}
          isActive={activeTab === "music"}
          onNavigate={() => {
            setActiveTab("music");
            setIsTraining(false);
          }}
        />
      </main>

      {/* =========================================
         BOTTOM NAV BAR (Mobile Tab Dock)
         ========================================= */}
      <nav className="fixed bottom-0 left-0 w-full z-40 bg-brand-black/80 backdrop-blur-2xl border-t border-white/5 md:hidden flex justify-around items-center h-20 px-4 pb-4 shadow-[0_-8px_30px_rgba(0,0,0,0.7)]">
        {/* Home Button */}
        <button
          onClick={() => {
            setActiveTab("home");
            setIsTraining(false);
          }}
          className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
            activeTab === "home"
              ? "text-brand-lime scale-115 font-bold drop-shadow-[0_0_8px_rgba(195,244,0,0.4)]"
              : "text-brand-text-muted opacity-60 hover:opacity-100"
          }`}
        >
          <span
            className="material-symbols-outlined text-2xl mb-1"
            style={{ fontVariationSettings: `'FILL' ${activeTab === "home" ? 1 : 0}` }}
          >
            home
          </span>
          <span className="text-[10px] font-semibold tracking-wide font-sans">首页</span>
        </button>

        {/* Workout Button */}
        <button
          onClick={() => setActiveTab("workout")}
          className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
            activeTab === "workout"
              ? "text-brand-lime scale-115 font-bold drop-shadow-[0_0_8px_rgba(195,244,0,0.4)]"
              : "text-brand-text-muted opacity-60 hover:opacity-100"
          }`}
        >
          <span
            className="material-symbols-outlined text-2xl mb-1"
            style={{ fontVariationSettings: `'FILL' ${activeTab === "workout" ? 1 : 0}` }}
          >
            fitness_center
          </span>
          <span className="text-[10px] font-semibold tracking-wide font-sans">训练</span>
        </button>

        {/* Music Button */}
        <button
          onClick={() => {
            setActiveTab("music");
            setIsTraining(false);
          }}
          className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
            activeTab === "music"
              ? "text-brand-lime scale-115 font-bold drop-shadow-[0_0_8px_rgba(195,244,0,0.4)]"
              : "text-brand-text-muted opacity-60 hover:opacity-100"
          }`}
        >
          <span
            className="material-symbols-outlined text-2xl mb-1"
            style={{ fontVariationSettings: `'FILL' ${activeTab === "music" ? 1 : 0}` }}
          >
            queue_music
          </span>
          <span className="text-[10px] font-semibold tracking-wide font-sans">音乐</span>
        </button>

        {/* Diet Button */}
        <button
          onClick={() => {
            setActiveTab("diet");
            setIsTraining(false);
          }}
          className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
            activeTab === "diet"
              ? "text-brand-lime scale-115 font-bold drop-shadow-[0_0_8px_rgba(195,244,0,0.4)]"
              : "text-brand-text-muted opacity-60 hover:opacity-100"
          }`}
        >
          <span
            className="material-symbols-outlined text-2xl mb-1"
            style={{ fontVariationSettings: `'FILL' ${activeTab === "diet" ? 1 : 0}` }}
          >
            restaurant_menu
          </span>
          <span className="text-[10px] font-semibold tracking-wide font-sans">饮食</span>
        </button>
      </nav>
    </div>
  );
}
