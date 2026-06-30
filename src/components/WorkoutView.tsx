import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Exercise } from "../types";

interface WorkoutViewProps {
  key?: string;
  exercises: Exercise[];
  setExercises: Dispatch<SetStateAction<Exercise[]>>;
  isTraining: boolean;
  setIsTraining: (val: boolean) => void;
}

export default function WorkoutView({
  exercises,
  setExercises,
  isTraining,
  setIsTraining,
}: WorkoutViewProps) {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState<number | "">(3);
  const [newExReps, setNewExReps] = useState<number | "">(12);
  const [newExWeight, setNewExWeight] = useState<number | "">(20);
  const [newExRest, setNewExRest] = useState<number | "">(60);

  // Active Training States
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalRestTime, setTotalRestTime] = useState(60);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [totalLiftedWeight, setTotalLiftedWeight] = useState(0);

  // Synthesize a beep sound using Web Audio API
  const playBeep = (freq = 800, duration = 0.15) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context not supported or allowed yet", e);
    }
  };

  // Rest Timer countdown
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTraining && isResting && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer complete beep!
            playBeep(950, 0.4);
            setIsResting(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return 0;
          }
          // Tick sound!
          if (prev <= 4) {
            playBeep(600, 0.05);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTraining, isResting, timeLeft]);

  // Clean up when training state changes
  useEffect(() => {
    if (!isTraining) {
      setCurrentExIdx(0);
      setCurrentSet(1);
      setIsResting(false);
      setWorkoutComplete(false);
    }
  }, [isTraining]);

  // Calculate dynamic stats
  const totalDurationMin = exercises.reduce((acc, curr) => {
    // Estimating 45 seconds per set + rest duration
    const sets = Number(curr.sets) || 0;
    const rest = Number(curr.rest) || 0;
    const setTime = sets * 45;
    const restTime = Math.max(0, sets - 1) * rest;
    return acc + Math.ceil((setTime + restTime) / 60);
  }, 0);

  const handleAddExercise = () => {
    if (!newExName.trim()) return;
    const newEx: Exercise = {
      id: "ex-" + Date.now(),
      name: newExName,
      sets: newExSets === "" ? 1 : newExSets,
      reps: newExReps === "" ? 1 : newExReps,
      weight: newExWeight === "" ? 0 : newExWeight,
      rest: newExRest === "" ? 0 : newExRest,
    };
    setExercises([...exercises, newEx]);
    // Reset Form
    setNewExName("");
    setNewExSets(3);
    setNewExReps(12);
    setNewExWeight(20);
    setNewExRest(60);
    setIsModalOpen(false);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const updateExerciseField = (id: string, field: keyof Exercise, value: any) => {
    setExercises(
      exercises.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex))
    );
  };

  // Reorder exercises helper
  const moveExercise = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= exercises.length) return;
    const updated = [...exercises];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setExercises(updated);
  };

  // Active workout triggers
  const activeExercise = exercises[currentExIdx];

  const handleNextSet = () => {
    if (!activeExercise) return;

    if (isResting) {
      // Skip Rest
      setIsResting(false);
      return;
    }

    const activeSets = Number(activeExercise.sets) || 1;
    const activeRest = Number(activeExercise.rest) || 0;

    if (currentSet < activeSets) {
      if (activeRest > 0) {
        // Rest before next set
        setTotalRestTime(activeRest);
        setTimeLeft(activeRest);
        setIsResting(true);
        setCurrentSet(currentSet + 1);
        playBeep(450, 0.1);
      } else {
        // Immediately go to next set without resting
        setCurrentSet(currentSet + 1);
        setIsResting(false);
        playBeep(450, 0.1);
      }
    } else {
      // Done with all sets for this exercise, move to next exercise
      handleFinishExercise();
    }
  };

  const handleFinishExercise = () => {
    // Save current weight lifted to session volume
    if (activeExercise) {
      const setsVal = Number(activeExercise.sets) || 0;
      const repsVal = Number(activeExercise.reps) || 0;
      const weightVal = Number(activeExercise.weight) || 0;
      setTotalLiftedWeight(
        (prev) => prev + setsVal * repsVal * weightVal
      );
    }

    if (currentExIdx < exercises.length - 1) {
      const nextEx = exercises[currentExIdx + 1];
      const nextRest = Number(nextEx.rest) || 0;
      setCurrentExIdx(currentExIdx + 1);
      setCurrentSet(1);
      if (nextRest > 0) {
        setIsResting(true);
        setTotalRestTime(nextRest);
        setTimeLeft(nextRest);
      } else {
        setIsResting(false);
        setTotalRestTime(0);
        setTimeLeft(0);
      }
      playBeep(880, 0.2);
    } else {
      // Completed all exercises in plan!
      setWorkoutComplete(true);
      playBeep(1100, 0.5);
    }
  };

  // SVG Circumference calculation for timer ring
  const strokeCircumference = 283; // 2 * pi * 45
  const strokeDashoffset = isResting && totalRestTime > 0
    ? strokeCircumference - (timeLeft / totalRestTime) * strokeCircumference
    : 0;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!isTraining ? (
          /* =========================================
             PLANNER VIEW (健身计划定制)
             ========================================= */
          <motion.div
            key="planner"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 bg-brand-card p-6 rounded-2xl border border-white/5">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-brand-lime/10 text-brand-lime font-display font-semibold text-xs border border-brand-lime/20 mb-2">
                  肌肉肥大系列
                </span>
                <h2 className="text-2xl md:text-3xl font-display font-black text-brand-text tracking-tight">
                  胸部与三头肌训练定制
                </h2>
                <p className="text-brand-text-muted text-sm mt-1">
                  预计时长: <span className="text-brand-lime font-bold">{totalDurationMin}</span> 分钟 •{" "}
                  <span className="text-brand-lime font-bold">{exercises.length}</span> 个动作序列
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-lime text-brand-black font-semibold text-sm py-3 px-6 rounded-xl hover:bg-brand-lime-dim transition-all active:scale-95 shadow-[0_0_15px_rgba(195,244,0,0.15)] flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                添加动作
              </button>
            </div>

            {/* List of Draggable/Editable exercises */}
            <div className="flex flex-col gap-4">
              {exercises.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="bg-brand-card-high rounded-xl p-5 border border-white/5 hover:border-brand-lime/20 transition-all flex flex-col md:flex-row gap-5 items-start md:items-center relative overflow-hidden group"
                >
                  {/* Visual Accent Bar */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-lime opacity-50 group-hover:opacity-100 transition-opacity"></div>

                  {/* Ordering arrows and index */}
                  <div className="hidden md:flex flex-col items-center justify-center text-brand-text-dark pr-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveExercise(idx, "up")}
                      className="hover:text-brand-lime disabled:opacity-30 disabled:hover:text-brand-text-dark p-1"
                    >
                      <span className="material-symbols-outlined text-xl">keyboard_arrow_up</span>
                    </button>
                    <span className="text-xs font-mono font-bold text-brand-lime-dim">{idx + 1}</span>
                    <button
                      disabled={idx === exercises.length - 1}
                      onClick={() => moveExercise(idx, "down")}
                      className="hover:text-brand-lime disabled:opacity-30 disabled:hover:text-brand-text-dark p-1"
                    >
                      <span className="material-symbols-outlined text-xl">keyboard_arrow_down</span>
                    </button>
                  </div>

                  {/* Body Info */}
                  <div className="flex-grow w-full">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="md:hidden text-xs font-mono font-bold text-brand-lime-dim bg-brand-lime/10 px-2 py-0.5 rounded">
                          第 {idx + 1} 项
                        </span>
                        <h3 className="text-lg font-display font-bold text-brand-text">{ex.name}</h3>
                      </div>
                      <button
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="text-brand-text-dark hover:text-red-400 transition-colors p-1 rounded-full hover:bg-white/5 flex items-center justify-center"
                        title="移除此动作"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>

                    {/* Numeric Inputs Grid */}
                    <div className="grid grid-cols-4 gap-3 md:gap-4 w-full text-center">
                      <div className="flex flex-col gap-1.5 bg-brand-black/50 p-2.5 rounded-lg border border-white/5">
                        <label className="text-[10px] text-brand-text-dark font-medium uppercase tracking-wider">
                          组数
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={ex.sets}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateExerciseField(ex.id, "sets", val === "" ? "" : parseInt(val) || 0);
                          }}
                          className="bg-transparent text-brand-text text-center focus:ring-0 p-0 font-display font-black text-lg w-full border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 bg-brand-black/50 p-2.5 rounded-lg border border-white/5">
                        <label className="text-[10px] text-brand-text-dark font-medium uppercase tracking-wider">
                          次数
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={ex.reps}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateExerciseField(ex.id, "reps", val === "" ? "" : parseInt(val) || 0);
                          }}
                          className="bg-transparent text-brand-text text-center focus:ring-0 p-0 font-display font-black text-lg w-full border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 bg-brand-black/50 p-2.5 rounded-lg border border-white/5">
                        <label className="text-[10px] text-brand-text-dark font-medium uppercase tracking-wider">
                          重量 (kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="2.5"
                          value={ex.weight}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateExerciseField(ex.id, "weight", val === "" ? "" : parseFloat(val) || 0);
                          }}
                          className="bg-transparent text-brand-lime text-center focus:ring-0 p-0 font-display font-black text-lg w-full border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 bg-brand-black/50 p-2.5 rounded-lg border border-white/5">
                        <label className="text-[10px] text-brand-text-dark font-medium uppercase tracking-wider">
                          休息 (秒)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={ex.rest}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateExerciseField(ex.id, "rest", val === "" ? "" : parseInt(val) || 0);
                          }}
                          className="bg-transparent text-brand-cyan text-center focus:ring-0 p-0 font-display font-black text-lg w-full border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Start Training CTA */}
            <div className="mt-4 flex justify-center">
              <button
                disabled={exercises.length === 0}
                onClick={() => {
                  playBeep(800, 0.3);
                  setIsTraining(true);
                }}
                className="bg-transparent border-2 border-brand-lime text-brand-lime hover:bg-brand-lime/10 font-display font-black text-sm uppercase py-4 px-12 rounded-full w-full md:w-auto tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 group shadow-[0_0_15px_rgba(195,244,0,0.1)] hover:shadow-[0_0_25px_rgba(195,244,0,0.3)] cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform fill-1">
                  play_arrow
                </span>
                开启今日暴汗计划
              </button>
            </div>
          </motion.div>
        ) : (
          /* =========================================
             ACTIVE WORKOUT TIMER VIEW (训练执行中)
             ========================================= */
          <motion.div
            key="active"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center max-w-lg mx-auto w-full gap-6 pb-6 pt-2"
          >
            {/* Completion Screen Overlay inside active view if true */}
            {workoutComplete ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-brand-card rounded-2xl p-8 border border-brand-lime/20 text-center flex flex-col items-center gap-6 shadow-2xl"
              >
                <div className="w-20 h-20 rounded-full bg-brand-lime/10 flex items-center justify-center border border-brand-lime">
                  <span className="material-symbols-outlined text-brand-lime text-4xl animate-bounce">
                    military_tech
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-black text-brand-lime tracking-tight uppercase">
                    训练全部完成！
                  </h3>
                  <p className="text-brand-text-muted text-sm mt-2 font-sans">
                    今天的硬核挑战已圆满攻克，你非常优秀！
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full mt-2 font-mono">
                  <div className="bg-brand-black/50 p-4 rounded-xl border border-white/5">
                    <span className="text-xs text-brand-text-dark block font-sans">总举重量</span>
                    <span className="text-xl font-bold text-brand-text">{totalLiftedWeight} <span className="text-xs text-brand-text-muted font-sans">kg</span></span>
                  </div>
                  <div className="bg-brand-black/50 p-4 rounded-xl border border-white/5">
                    <span className="text-xs text-brand-text-dark block font-sans">燃烧热量</span>
                    <span className="text-xl font-bold text-brand-lime">~420 <span className="text-xs font-sans">Kcal</span></span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full mt-4">
                  <button
                    onClick={() => {
                      setIsTraining(false);
                      setTotalLiftedWeight(0);
                    }}
                    className="w-full bg-brand-lime text-brand-black font-semibold py-3.5 rounded-xl hover:bg-brand-lime-dim active:scale-95 transition-all cursor-pointer"
                  >
                    返回定制面板
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Ongoing active exercise interface */
              <>
                {/* Back to Planner button */}
                <button
                  onClick={() => setIsTraining(false)}
                  className="self-start text-brand-text-muted hover:text-brand-text flex items-center gap-1 text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  退出训练
                </button>

                {/* Exercise Details Card */}
                <div className="text-center w-full space-y-2 mt-2">
                  <h2 className="text-3xl md:text-4xl font-display font-black text-brand-text tracking-tight uppercase">
                    {activeExercise?.name || "加餐动作"}
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-brand-text-muted font-mono font-bold text-sm">
                    <span className="material-symbols-outlined text-base">fitness_center</span>
                    <span>
                      第 {currentSet} 组 / 共 {activeExercise?.sets || 4} 组
                    </span>
                    <span className="text-white/10">|</span>
                    <span className="text-brand-lime-dim">{activeExercise?.reps || 8} 次</span>
                    <span className="text-white/10">|</span>
                    <span className="text-brand-cyan">{activeExercise?.weight || 0} kg</span>
                  </div>
                </div>

                {/* Prominent Circular Timer */}
                <div className="relative w-72 h-72 flex items-center justify-center my-6 group">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="45" stroke="#2a2a2a" strokeWidth="5.5"></circle>
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      r="45"
                      stroke={isResting ? "#62fae3" : "#abd600"}
                      strokeWidth="5.5"
                      strokeDasharray={strokeCircumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                      style={{
                        filter: `drop-shadow(0 0 6px ${isResting ? "rgba(98, 250, 227, 0.4)" : "rgba(171, 214, 0, 0.4)"})`,
                      }}
                    ></circle>
                  </svg>

                  <div className="text-center z-10 flex flex-col items-center justify-center">
                    <span
                      className={`text-xs font-mono font-semibold uppercase tracking-widest mb-1 ${
                        isResting ? "text-brand-cyan" : "text-brand-lime-dim"
                      }`}
                    >
                      {isResting ? "间歇休息中" : "正进行动作组"}
                    </span>
                    
                    {isResting ? (
                      <div className="flex flex-col items-center">
                        <span className="text-6xl md:text-7xl font-display font-black text-brand-cyan font-mono leading-none tracking-tight">
                          {timeLeft}
                        </span>
                        <span className="text-xs text-brand-text-dark font-sans mt-1">秒</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center animate-pulse gap-1">
                        <span className="text-4xl font-display font-black text-brand-lime uppercase">
                          GO!
                        </span>
                        <span className="text-xs text-brand-text-muted font-sans">完成本组后按“下一组”</span>
                      </div>
                    )}
                  </div>

                  {/* Skip rest shortcut button */}
                  {isResting && (
                    <button
                      onClick={() => {
                        playBeep(800, 0.1);
                        setIsResting(false);
                      }}
                      className="absolute bottom-6 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 text-[11px] px-3.5 py-1.5 rounded-full cursor-pointer transition-all"
                    >
                      跳过休息
                    </button>
                  )}
                </div>

                {/* Progress Indicators */}
                <div className="w-full flex items-center justify-between px-4 text-xs font-mono text-brand-text-dark">
                  <span>动作进程: {currentExIdx + 1} / {exercises.length}</span>
                  <span>总计组数: {currentSet} / {activeExercise?.sets || 4}</span>
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-4 mt-auto">
                  <button
                    onClick={handleNextSet}
                    className="w-full bg-brand-lime text-brand-black font-display font-black text-sm uppercase py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-brand-lime-dim shadow-[0_0_15px_rgba(195,244,0,0.15)] cursor-pointer"
                  >
                    <span>{isResting ? "跳过间歇" : "下一组"}</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>

                  <button
                    onClick={handleFinishExercise}
                    className="w-full bg-transparent border border-white/10 text-brand-text-muted hover:text-brand-text hover:bg-white/5 font-display font-black text-xs uppercase py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">done_all</span>
                    <span>结束当前动作</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================
         ADD EXERCISE PORTAL MODAL DIALOG
         ========================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-black/90 backdrop-blur-md"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative bg-brand-card-high w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                  <h2 className="text-lg font-display font-bold text-brand-text flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand-lime">add_circle</span>
                    定制新增训练项目
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-brand-text-dark hover:text-brand-text transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-brand-text-muted font-medium">动作名称</label>
                    <input
                      type="text"
                      placeholder="例如：杠铃卧推, 上斜哑铃飞鸟..."
                      value={newExName}
                      onChange={(e) => setNewExName(e.target.value)}
                      className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text rounded-xl py-3 px-4 outline-none text-sm transition-all focus:ring-1 focus:ring-brand-lime"
                    />
                  </div>

                  {/* Grid fields for Specs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-brand-text-muted font-medium">组数 (Sets)</label>
                      <input
                        type="number"
                        min="1"
                        value={newExSets}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewExSets(val === "" ? "" : parseInt(val) || 0);
                        }}
                        className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text rounded-xl py-3 px-4 outline-none text-sm transition-all focus:ring-1 focus:ring-brand-lime"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-brand-text-muted font-medium">次数 (Reps)</label>
                      <input
                        type="number"
                        min="1"
                        value={newExReps}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewExReps(val === "" ? "" : parseInt(val) || 0);
                        }}
                        className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text rounded-xl py-3 px-4 outline-none text-sm transition-all focus:ring-1 focus:ring-brand-lime"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-brand-text-muted font-medium">重量 (kg)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={newExWeight}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewExWeight(val === "" ? "" : parseFloat(val) || 0);
                        }}
                        className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text rounded-xl py-3 px-4 outline-none text-sm transition-all focus:ring-1 focus:ring-brand-lime"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-brand-text-muted font-medium">间歇秒数 (s)</label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={newExRest}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewExRest(val === "" ? "" : parseInt(val) || 0);
                        }}
                        className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text rounded-xl py-3 px-4 outline-none text-sm transition-all focus:ring-1 focus:ring-brand-lime"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddExercise}
                    className="w-full bg-brand-lime text-brand-black font-display font-black text-xs uppercase py-4 rounded-xl mt-4 hover:bg-brand-lime-dim active:scale-95 transition-all shadow-[0_0_15px_rgba(195,244,0,0.15)] cursor-pointer"
                  >
                    添加并保存到当前计划
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
