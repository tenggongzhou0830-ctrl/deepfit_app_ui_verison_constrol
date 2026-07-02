import sqlite3
import os
import json
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

@contextmanager
def get_db():
    """
    Context manager to safely open and close DB connections.
    """
    conn = sqlite3.connect(DB_PATH)
    # Enable Dict/Row factory for cleaner JSON conversions
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def init_db():
    """
    Initializes tables in SQLite database if they do not exist.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL
            )
        ''')
        
        # 2. Workout Plans Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS workout_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                day_name TEXT NOT NULL,
                date_text TEXT NOT NULL,
                plan_text TEXT NOT NULL,
                duration TEXT NOT NULL,
                type TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        
        # 3. Exercises Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS exercises (
                id TEXT PRIMARY KEY,
                plan_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                sets INTEGER NOT NULL,
                reps INTEGER NOT NULL,
                weight REAL NOT NULL,
                rest INTEGER NOT NULL,
                order_idx INTEGER NOT NULL,
                FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
            )
        ''')
        
        # 4. Music Tracks Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS music_tracks (
                id TEXT PRIMARY KEY,
                playlist TEXT NOT NULL,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                cover_url TEXT NOT NULL,
                lyrics TEXT NOT NULL -- Stored as JSON string list
            )
        ''')
        
        # 5. Workout Progress Tracking Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS workout_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                exercise_id TEXT NOT NULL,
                set_number INTEGER NOT NULL,
                reps_completed INTEGER NOT NULL,
                weight_lifted REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        
        # 6. Stream URL Cache Table (Expires in 4 hours)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stream_cache (
                video_id TEXT PRIMARY KEY,
                stream_url TEXT NOT NULL,
                expires_at DATETIME NOT NULL
            )
        ''')

def seed_db():
    """
    Seeds mock data for Elite Coach if tables are empty.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Seed User
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO users (id, name) VALUES (?, ?)", ("Alex", "Alex"))
            print("🌱 User 'Alex' seeded.")
            
        # Seed Workout Plans & Exercises
        cursor.execute("SELECT COUNT(*) FROM workout_plans")
        if cursor.fetchone()[0] == 0:
            # 7 Day schedule matching INITIAL_WEEKLY_PLAN
            weekly_plan = [
                ("周一", "今日", "胸部与三头肌", "45m", "力量"),
                ("周二", "11月12日", "背部与二头肌", "50m", "力量"),
                ("周三", "11月13日", "积极恢复", "休息", "休息"),
                ("周四", "11月14日", "腿部与核心", "60m", "力量"),
                ("周五", "11月15日", "肩部与手臂", "45m", "力量"),
                ("周六", "11月16日", "积极恢复", "休息", "休息"),
                ("周日", "11月17日", "核心与有氧", "30m", "有氧")
            ]
            
            for plan in weekly_plan:
                cursor.execute('''
                    INSERT INTO workout_plans (user_id, day_name, date_text, plan_text, duration, type)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', ("Alex", plan[0], plan[1], plan[2], plan[3], plan[4]))
            
            print("🌱 Weekly plans seeded.")
            
            # Fetch the first workout plan (周一: 胸部与三头肌) to seed its initial exercises
            cursor.execute("SELECT id FROM workout_plans WHERE day_name = '周一' AND user_id = 'Alex'")
            monday_plan_id = cursor.fetchone()[0]
            
            initial_exercises = [
                ("ex-1", monday_plan_id, "杠铃卧推", 4, 8, 80.0, 90, 0),
                ("ex-2", monday_plan_id, "上斜哑铃卧推", 3, 10, 24.0, 60, 1),
                ("ex-3", monday_plan_id, "绳索夹胸", 4, 12, 15.0, 45, 2)
            ]
            
            for ex in initial_exercises:
                cursor.execute('''
                    INSERT INTO exercises (id, plan_id, name, sets, reps, weight, rest, order_idx)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', ex)
                
            print("🌱 Initial exercises for Monday seeded.")
            
        # Seed Music Tracks
        cursor.execute("SELECT COUNT(*) FROM music_tracks")
        if cursor.fetchone()[0] == 0:
            tracks = [
                (
                    "track-1",
                    "伴练推荐",
                    "Adrenaline Rush",
                    "Elite Beats Lab",
                    "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80",
                    json.dumps([
                        "感受怒火",
                        "忍痛前行",
                        "突破极限",
                        "永不退缩",
                        "打破界限",
                        "永不止步",
                        "狂飙肾上腺素",
                        "势不可挡"
                    ], ensure_ascii=False)
                ),
                (
                    "track-2",
                    "伴练推荐",
                    "Cyber Neon",
                    "Grid Runner",
                    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80",
                    json.dumps([
                        "霓虹闪烁",
                        "光速飞驰",
                        "机械之心",
                        "电子节拍",
                        "无线循环",
                        "超越自我的力量",
                        "赛博战甲",
                        "终极觉醒"
                    ], ensure_ascii=False)
                ),
                (
                    "track-3",
                    "伴练推荐",
                    "Heavy Iron Lift",
                    "The Metal Crew",
                    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80",
                    json.dumps([
                        "钢铁在轰鸣",
                        "汗水在流淌",
                        "每一次卧推",
                        "都是灵魂的释放",
                        "沉重重力",
                        "对抗极限阻力",
                        "永不妥协",
                        "成就非凡身躯"
                    ], ensure_ascii=False)
                )
            ]
            
            for trk in tracks:
                cursor.execute('''
                    INSERT INTO music_tracks (id, playlist, title, artist, cover_url, lyrics)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', trk)
                
            print("🌱 Gym music tracks seeded.")
