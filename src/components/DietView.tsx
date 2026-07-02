import { useState, Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Meal } from "../types";

interface DietViewProps {
  key?: string;
  meals: Meal[];
  setMeals: Dispatch<SetStateAction<Meal[]>>;
}

export default function DietView({ meals, setMeals }: DietViewProps) {
  // Physical stats
  const [height, setHeight] = useState<number | "">(180);
  const [weight, setWeight] = useState<number | "">(75);

  // Checked/Consumed state of meals
  const [consumedMeals, setConsumedMeals] = useState<Record<string, boolean>>({});

  // Food logging modal state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [foodCalories, setFoodCalories] = useState<number | "">("");
  const [foodProtein, setFoodProtein] = useState<number | "">("");
  const [foodCarbs, setFoodCarbs] = useState<number | "">("");
  const [foodFat, setFoodFat] = useState<number | "">("");
  const [foodType, setFoodType] = useState("加餐");
  const [foodIngredients, setFoodIngredients] = useState("");

  // AI recognition states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState("");

  const SAMPLES = [
    {
      name: "西冷牛排配西兰花",
      type: "午餐",
      calories: 580,
      protein: 48,
      carbs: 12,
      fat: 36,
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80",
      ingredients: "西冷牛排、烤土豆、蒸西兰花、黑胡椒汁",
    },
    {
      name: "地中海烟熏三文鱼沙拉",
      type: "午餐",
      calories: 420,
      protein: 32,
      carbs: 18,
      fat: 24,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80",
      ingredients: "智利三文鱼、圣女果、牛油果、羽衣甘蓝、油醋汁",
    },
    {
      name: "全麦黑椒牛肉意面",
      type: "晚餐",
      calories: 610,
      protein: 38,
      carbs: 75,
      fat: 14,
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80",
      ingredients: "全麦意面、黑椒牛肉、洋葱、彩椒",
    },
    {
      name: "低卡牛油果鸡胸肉三明治",
      type: "早餐",
      calories: 380,
      protein: 28,
      carbs: 42,
      fat: 12,
      imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=300&q=80",
      ingredients: "全麦吐司、鸡胸肉切片、熟牛油果泥、水煮蛋",
    },
  ];

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      setUploadedImage(imgUrl);
      analyzeFoodWithAI(imgUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFoodWithAI = async (imgUrl: string) => {
    setIsScanning(true);
    setScanStage("🔍 正在将图像发送至 AI 视觉核心...");
    
    try {
      setScanStage("🥑 Gemini 1.5 Flash 视觉引擎正在极速分析成分...");
      const response = await fetch("/api/v1/diet/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imgUrl }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "AI Analysis Failed");
      }
      
      setScanStage("✅ AI 分析成功！已提取精准卡路里与宏量营养素");
      
      const aiData = data.data;
      setFoodName(aiData.name || "AI 智能识别餐");
      setFoodIngredients(aiData.ingredients || "");
      setFoodCalories(aiData.calories || 0);
      setFoodProtein(aiData.protein || 0);
      setFoodCarbs(aiData.carbs || 0);
      setFoodFat(aiData.fat || 0);
      
    } catch (error: any) {
      console.error("AI 识别错误:", error);
      setScanStage("❌ AI 识别失败: " + error.message);
    } finally {
      setTimeout(() => setIsScanning(false), 2000);
    }
  };

  const triggerScanning = (
    imgUrl: string,
    name: string,
    ingredients: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  ) => {
    setIsScanning(true);
    setUploadedImage(imgUrl);
    setScanStage("🔍 AI 深度视觉图像提取中...");

    setTimeout(() => {
      setScanStage("🥑 正在检测食材结构与体积特征...");
    }, 600);

    setTimeout(() => {
      setScanStage("📊 匹配云端宏量营养大数据库...");
    }, 1200);

    setTimeout(() => {
      setIsScanning(false);
      setScanStage("✅ AI 识别成功！已自动填充大卡与碳水/蛋白/脂肪数据");

      // Set form fields
      setFoodName(name);
      setFoodIngredients(ingredients);
      setFoodCalories(calories);
      setFoodProtein(protein);
      setFoodCarbs(carbs);
      setFoodFat(fat);
    }, 1800);
  };

  // Toggle consumed status
  const toggleConsumed = (id: string) => {
    setConsumedMeals((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const activeWeight = Number(weight) || 0;

  // Dynamic Macro Targets based on Weight
  const calorieTarget = Math.round(activeWeight * 32); // e.g., 75kg -> 2400 kcal
  const proteinTarget = Math.round(activeWeight * 2.13); // e.g., 75kg -> 160g
  const carbsTarget = Math.round(activeWeight * 2.93); // e.g., 75kg -> 220g
  const fatTarget = Math.round(activeWeight * 0.86); // e.g., 75kg -> 65g

  // Calculate consumed totals
  const totalConsumed = meals.reduce(
    (acc, meal) => {
      if (consumedMeals[meal.id]) {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fat += meal.fat;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAddCustomFood = () => {
    const finalFoodName = foodName.trim() || `自定义${foodType}`;
    
    const newMeal: Meal = {
      id: "food-" + Date.now(),
      timeText: "现在",
      type: foodType,
      name: finalFoodName,
      ingredients: foodIngredients || "手动记录的各项宏量营养",
      calories: Number(foodCalories) || 0,
      protein: Number(foodProtein) || 0,
      carbs: Number(foodCarbs) || 0,
      fat: Number(foodFat) || 0,
      imageUrl: uploadedImage || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=300&q=80",
    };

    setMeals([...meals, newMeal]);
    // Auto consume newly added food
    setConsumedMeals((prev) => ({
      ...prev,
      [newMeal.id]: true,
    }));

    // Reset Form
    setFoodName("");
    setFoodIngredients("");
    setFoodCalories(300);
    setFoodProtein(20);
    setFoodCarbs(35);
    setFoodFat(8);
    setUploadedImage(null);
    setScanStage("");
    setIsLogModalOpen(false);
  };

  const handleRemoveCustomMeal = (id: string) => {
    setMeals(meals.filter((m) => m.id !== id));
    setConsumedMeals((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  // Progress Percentages
  const caloriePct = Math.min((totalConsumed.calories / calorieTarget) * 100, 100);
  const proteinPct = Math.min((totalConsumed.protein / proteinTarget) * 100, 100);
  const carbsPct = Math.min((totalConsumed.carbs / carbsTarget) * 100, 100);
  const fatPct = Math.min((totalConsumed.fat / fatTarget) * 100, 100);

  // SVG dash array for circular chart (circumference = 2 * pi * r)
  const circularCircumference = 251.2; // for r = 40
  // Multiple ring calculations (percentages mapped to circle segments)
  const calorieRingOffset = circularCircumference - (caloriePct / 100) * circularCircumference;
  const proteinRingOffset = circularCircumference - (proteinPct / 100) * circularCircumference;
  const carbsRingOffset = circularCircumference - (carbsPct / 100) * circularCircumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Target & Dynamic Calculations Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-brand-card p-6 rounded-2xl border border-white/5">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-brand-lime/10 text-brand-lime font-display font-semibold text-xs border border-brand-lime/20 mb-2">
            AI 智能膳食引擎
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-brand-text tracking-tight uppercase">
            今日精准饮食追踪
          </h2>
          <p className="text-brand-text-muted text-sm mt-1">
            动态配比算法根据您的体能和日常运动参数配平营养缺口。
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="bg-brand-lime text-brand-black font-semibold text-sm py-3 px-6 rounded-xl hover:bg-brand-lime-dim transition-all active:scale-95 shadow-[0_0_15px_rgba(195,244,0,0.15)] flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">local_pizza</span>
          记录加餐
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Stats Summary Box */}
        <div className="lg:col-span-4 bg-brand-card-high/90 rounded-2xl p-6 border border-white/5 flex flex-col gap-5 justify-center">
          <h3 className="text-base font-display font-bold text-brand-text border-b border-white/5 pb-2">
            个人生理基础系数
          </h3>

          {/* Height Input Slider & Numeric Edit */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-brand-text-muted font-sans font-semibold text-xs">当前身高</span>
              <div className="flex items-center gap-1.5 bg-brand-black/40 border border-white/10 rounded-lg px-2 py-0.5 focus-within:border-brand-lime transition-all">
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={height}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHeight(val === "" ? "" : parseInt(val) || 0);
                  }}
                  className="bg-transparent text-brand-lime font-mono font-bold text-sm w-12 text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-none p-0 focus:ring-0"
                />
                <span className="text-brand-text-muted font-mono text-xs font-semibold">cm</span>
              </div>
            </div>
            <input
              type="range"
              min="120"
              max="230"
              value={height || 120}
              onChange={(e) => setHeight(parseInt(e.target.value))}
              className="w-full h-1 bg-brand-card rounded-lg appearance-none cursor-pointer accent-brand-lime mt-1"
            />
          </div>

          <div className="h-px bg-white/5 my-1"></div>

          {/* Weight Input Slider & Numeric Edit */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-brand-text-muted font-sans font-semibold text-xs">当前体重</span>
              <div className="flex items-center gap-1.5 bg-brand-black/40 border border-white/10 rounded-lg px-2 py-0.5 focus-within:border-brand-lime transition-all">
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={weight}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWeight(val === "" ? "" : parseInt(val) || 0);
                  }}
                  className="bg-transparent text-brand-lime font-mono font-bold text-sm w-12 text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-none p-0 focus:ring-0"
                />
                <span className="text-brand-text-muted font-mono text-xs font-semibold">kg</span>
              </div>
            </div>
            <input
              type="range"
              min="40"
              max="150"
              value={weight || 40}
              onChange={(e) => setWeight(parseInt(e.target.value))}
              className="w-full h-1 bg-brand-card rounded-lg appearance-none cursor-pointer accent-brand-lime mt-1"
            />
          </div>

          <div className="text-[10px] text-brand-text-dark leading-relaxed mt-2 text-center bg-brand-black/30 p-2.5 rounded-lg border border-white/5">
            💡 <span className="text-brand-text-muted font-sans">滑动调整体重，系统将即时利用经典卡氏公式重算碳、氮、脂三元素靶心比率。</span>
          </div>
        </div>

        {/* Macro Distribution Circular Ring + Progress Bars */}
        <div className="lg:col-span-8 bg-brand-card-high/90 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="flex-1 w-full space-y-4">
            <h3 className="text-base font-display font-bold text-brand-text border-b border-white/5 pb-2">
              宏量营养摄入靶标
            </h3>

            {/* Protein Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-end text-xs font-mono font-bold">
                <span className="text-brand-text font-sans">蛋白质 (Target: {proteinTarget}g)</span>
                <span className="text-brand-lime">
                  {Math.round(totalConsumed.protein)}g / {proteinTarget}g
                </span>
              </div>
              <div className="w-full bg-brand-black h-2.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-brand-lime h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(195,244,0,0.5)]"
                  style={{ width: `${proteinPct}%` }}
                ></div>
              </div>
            </div>

            {/* Carbs Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-end text-xs font-mono font-bold">
                <span className="text-brand-text font-sans">碳水化合物 (Target: {carbsTarget}g)</span>
                <span className="text-brand-cyan">
                  {Math.round(totalConsumed.carbs)}g / {carbsTarget}g
                </span>
              </div>
              <div className="w-full bg-brand-black h-2.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-brand-cyan h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(98,250,227,0.5)]"
                  style={{ width: `${carbsPct}%` }}
                ></div>
              </div>
            </div>

            {/* Fats Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-end text-xs font-mono font-bold">
                <span className="text-brand-text font-sans">脂肪 (Target: {fatTarget}g)</span>
                <span className="text-brand-text-muted">
                  {Math.round(totalConsumed.fat)}g / {fatTarget}g
                </span>
              </div>
              <div className="w-full bg-brand-black h-2.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-brand-text-muted h-full rounded-full transition-all duration-500"
                  style={{ width: `${fatPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Caloric SVG Concentric Gauge */}
          <div className="w-44 h-44 relative flex-shrink-0 flex items-center justify-center bg-brand-black/30 rounded-full border border-white/5">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Target circular trace base */}
              <circle cx="50" cy="50" fill="transparent" r="40" stroke="#1d1d1d" strokeWidth="6"></circle>

              {/* Concentric rings */}
              {/* Calorie ring */}
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#c3f400"
                strokeWidth="6"
                strokeDasharray={circularCircumference}
                strokeDashoffset={calorieRingOffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
              ></circle>

              {/* Inner concentric ring base */}
              <circle cx="50" cy="50" fill="transparent" r="32" stroke="#1d1d1d" strokeWidth="5.5"></circle>
              {/* Protein Ring */}
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="32"
                stroke="#62fae3"
                strokeWidth="5.5"
                strokeDasharray="201"
                strokeDashoffset={201 - (proteinPct / 100) * 201}
                strokeLinecap="round"
                className="transition-all duration-1000"
              ></circle>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-display font-black text-brand-text font-mono leading-none tracking-tight">
                {Math.round(totalConsumed.calories)}
              </span>
              <span className="text-[9px] text-brand-text-dark font-sans tracking-widest uppercase mt-1">
                千卡 / {calorieTarget} Target
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Meals List Area */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <h3 className="text-lg font-display font-bold text-brand-text flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-lime">restaurant</span>
            今日食谱营养分配清单
          </h3>
          <span className="text-xs text-brand-text-muted">勾选已餐用项目激活今日统计</span>
        </div>

        <div className="space-y-4">
          {meals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 bg-brand-card/30 rounded-2xl border border-white/5 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-lime/10 flex items-center justify-center text-brand-lime">
                <span className="material-symbols-outlined text-3xl">photo_camera</span>
              </div>
              <div>
                <h4 className="text-base font-display font-bold text-brand-text">暂无今日饮食记录</h4>
                <p className="text-xs text-brand-text-muted mt-1.5 max-w-sm leading-relaxed mx-auto">
                  点击右上角 <span className="text-brand-lime font-bold">记录加餐</span>，即可使用最新的 <span className="text-brand-lime font-bold">AI 拍照图识别热量</span> 图像技术，一键智能分析每一顿的大卡、碳水、蛋白质及脂肪占比！
                </p>
              </div>
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="mt-1 bg-brand-lime text-brand-black font-semibold text-xs py-2.5 px-5 rounded-xl transition-all hover:bg-brand-lime-dim flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(195,244,0,0.15)]"
              >
                <span className="material-symbols-outlined text-sm">add_a_photo</span>
                立即体验 AI 拍照识别
              </button>
            </div>
          ) : (
            meals.map((meal) => {
              const isConsumed = !!consumedMeals[meal.id];

              return (
                <div
                  key={meal.id}
                  onClick={() => toggleConsumed(meal.id)}
                  className={`rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border transition-all cursor-pointer select-none relative overflow-hidden group ${
                    isConsumed
                      ? "bg-brand-card-high/90 border-brand-lime/20"
                      : "bg-brand-card/50 border-white/5 opacity-55 hover:opacity-85"
                  }`}
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Circle check box indicator */}
                    <div className="flex-shrink-0">
                      <span
                        className={`material-symbols-outlined text-2xl transition-all ${
                          isConsumed ? "text-brand-lime" : "text-brand-text-dark"
                        }`}
                        style={{ fontVariationSettings: `'FILL' ${isConsumed ? 1 : 0}` }}
                      >
                        {isConsumed ? "check_circle" : "radio_button_unchecked"}
                      </span>
                    </div>

                    {/* Food visual image */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative bg-brand-black border border-white/5">
                      <img
                        src={meal.imageUrl}
                        alt={meal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-brand-black/10"></div>
                    </div>

                    <div>
                      <span className="inline-block text-[10px] font-mono font-bold text-brand-lime bg-brand-lime/10 border border-brand-lime/20 px-2 py-0.5 rounded mb-1">
                        {meal.type} • {meal.timeText}
                      </span>
                      <h4 className="text-base font-display font-bold text-brand-text">{meal.name}</h4>
                      <p className="text-xs text-brand-text-muted mt-1">{meal.ingredients}</p>
                    </div>
                  </div>

                  {/* Macro summary */}
                  <div className="flex items-center gap-4 bg-brand-black/40 p-3 rounded-xl border border-white/5 self-stretch md:self-auto justify-between font-mono text-center">
                    <div className="px-2">
                      <p className="text-lg font-bold text-brand-text">{meal.calories}</p>
                      <p className="text-[9px] text-brand-text-dark uppercase font-sans">大卡</p>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="px-2">
                      <p className="text-base font-bold text-brand-lime">{meal.protein}g</p>
                      <p className="text-[9px] text-brand-text-dark uppercase font-sans">蛋白质</p>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="px-2">
                      <p className="text-base font-bold text-brand-cyan">{meal.carbs}g</p>
                      <p className="text-[9px] text-brand-text-dark uppercase font-sans">碳水</p>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="px-2">
                      <p className="text-base font-bold text-brand-text-muted">{meal.fat}g</p>
                      <p className="text-[9px] text-brand-text-dark uppercase font-sans">脂肪</p>
                    </div>

                    <div className="ml-2 pl-2 border-l border-white/10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomMeal(meal.id);
                        }}
                        className="text-brand-text-dark hover:text-red-400 p-1 rounded-md transition-colors"
                        title="删除此餐"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================
         ADD FOOD LOG DIALOG PORTAL WITH AI RECOGNITION
         ========================================= */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogModalOpen(false)}
              className="absolute inset-0 bg-brand-black/90 backdrop-blur-md"
            ></motion.div>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative bg-brand-card-high w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row"
            >
              {/* Left Column: AI Picture Scanner Zone */}
              <div className="md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-white/5 flex flex-col gap-4 bg-brand-black/20">
                <div>
                  <h3 className="text-sm font-sans font-black text-brand-lime tracking-wider uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base animate-pulse">camera</span>
                    拍照识别营养成分
                  </h3>
                  <p className="text-brand-text-muted text-xs mt-1">
                    点击相机上传美食照片，即可一键重构每餐热量。
                  </p>
                </div>

                {/* Main Camera / Scanning Board */}
                <div className="relative border-2 border-dashed border-white/10 hover:border-brand-lime/40 rounded-xl p-4 flex-1 min-h-[300px] bg-brand-black/40 flex flex-col items-center justify-center gap-2 overflow-hidden group transition-all">
                  {uploadedImage ? (
                    <div className="absolute inset-0">
                      <img
                        src={uploadedImage}
                        alt="Uploaded Food"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-brand-black/35"></div>
                    </div>
                  ) : (
                    <div className="text-center flex flex-col items-center gap-2 pointer-events-none">
                      <span className="material-symbols-outlined text-4xl text-brand-text-dark group-hover:text-brand-lime transition-colors">
                        add_a_photo
                      </span>
                      <p className="text-xs text-brand-text-muted font-sans">
                        拖拽或点击此处上传美食照片
                      </p>
                      <p className="text-[10px] text-brand-text-dark font-sans">
                        支持 JPG, PNG, WEBP 等格式
                      </p>
                    </div>
                  )}

                  {/* Hidden input */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />

                  {/* Laser Scan Animation Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-brand-black/85 flex flex-col items-center justify-center text-center p-3 z-20">
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <motion.div
                          className="absolute left-0 w-full h-0.5 bg-brand-lime shadow-[0_0_12px_#c3f400]"
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <div className="absolute border-2 border-dashed border-brand-lime/40 w-16 h-16 rounded-full animate-ping pointer-events-none" />
                        <span className="text-brand-lime font-mono font-black text-xs tracking-widest uppercase bg-brand-black px-2 py-1 rounded border border-brand-lime/30 animate-pulse">
                          AI SCANNING
                        </span>
                        <p className="text-[10px] text-brand-lime/80 font-sans mt-3 px-2 leading-relaxed animate-pulse">
                          {scanStage}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Post-scan feedback indicator */}
                  {!isScanning && uploadedImage && (
                    <div className="absolute top-2 right-2 bg-brand-black/80 border border-brand-lime/20 text-brand-lime text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">done</span>
                      已分析
                    </div>
                  )}
                </div>


              </div>

              {/* Right Column: Calories & Nutritional Macro Customizer */}
              <div className="md:w-1/2 p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h2 className="text-base font-display font-bold text-brand-text flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand-lime">edit_note</span>
                    核对并调整营养信息
                  </h2>
                  <button
                    onClick={() => setIsLogModalOpen(false)}
                    className="text-brand-text-dark hover:text-brand-text transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-brand-text-muted font-bold">餐食名称</label>
                    <input
                      type="text"
                      placeholder="AI 分析结果或手动输入餐食名称..."
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text rounded-xl py-2 px-3.5 outline-none text-xs transition-all focus:ring-1 focus:ring-brand-lime"
                    />
                  </div>

                  {/* Ingredients */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-brand-text-muted font-bold">配料/食材构成</label>
                    <input
                      type="text"
                      placeholder="牛胸肉、糙米、鸡蛋..."
                      value={foodIngredients}
                      onChange={(e) => setFoodIngredients(e.target.value)}
                      className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text rounded-xl py-2 px-3.5 outline-none text-xs transition-all focus:ring-1 focus:ring-brand-lime"
                    />
                  </div>

                  {/* Meal Type selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-brand-text-muted font-bold">餐食分类</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {["早餐", "午餐", "晚餐", "加餐"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFoodType(type)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            foodType === type
                              ? "bg-brand-lime text-brand-black border-brand-lime"
                              : "bg-brand-black/40 text-brand-text-muted border-white/5 hover:border-white/10"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calories & Protein */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-brand-text-muted font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-lime"></span>
                        热量 (千卡)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={foodCalories}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFoodCalories(val === "" ? "" : parseInt(val) || 0);
                        }}
                        className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text font-mono font-bold rounded-xl py-2 px-3.5 outline-none text-xs transition-all focus:ring-1 focus:ring-brand-lime [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-brand-text-muted font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-lime"></span>
                        蛋白质 (克)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={foodProtein}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFoodProtein(val === "" ? "" : parseInt(val) || 0);
                        }}
                        className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text font-mono font-bold rounded-xl py-2 px-3.5 outline-none text-xs transition-all focus:ring-1 focus:ring-brand-lime [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {/* Carbs & Fat */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-brand-text-muted font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan"></span>
                        碳水化合物 (克)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={foodCarbs}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFoodCarbs(val === "" ? "" : parseInt(val) || 0);
                        }}
                        className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text font-mono font-bold rounded-xl py-2 px-3.5 outline-none text-xs transition-all focus:ring-1 focus:ring-brand-lime [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-brand-text-muted font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-text-dark"></span>
                        脂肪 (克)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={foodFat}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFoodFat(val === "" ? "" : parseInt(val) || 0);
                        }}
                        className="w-full bg-brand-black/50 border border-white/10 focus:border-brand-lime text-brand-text font-mono font-bold rounded-xl py-2 px-3.5 outline-none text-xs transition-all focus:ring-1 focus:ring-brand-lime [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddCustomFood}
                    disabled={isScanning}
                    className="w-full bg-brand-lime text-brand-black font-display font-black text-xs uppercase py-3.5 rounded-xl mt-3 hover:bg-brand-lime-dim disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all shadow-[0_0_15px_rgba(195,244,0,0.15)] cursor-pointer"
                  >
                    确认并添加到食谱
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
