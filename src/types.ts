export interface WeeklyPlanItem {
  dayName: string;
  dateText: string;
  planText: string;
  duration: string;
  type: "力量" | "休息" | "有氧" | "核心";
}

export interface Exercise {
  id: string;
  name: string;
  sets: number | "";
  reps: number | "";
  weight: number | "";
  rest: number | ""; // in seconds
}

export interface Meal {
  id: string;
  timeText: string;
  type: string; // "早餐", "午餐", "加餐", "晚餐"
  name: string;
  ingredients: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  lyrics: string[];
}
