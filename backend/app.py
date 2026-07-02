import sys
import os

# Inject framework and models to path manually to ensure running it from anywhere works cleanly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from antigravity import Antigravity
from models import init_db, seed_db
from routes import register_routes

# Initialize and register app instance
app = Antigravity()
register_routes(app)

import threading

def pre_warm_hot_songs():
    """
    Background daemon thread that automatically parses and caches Top Global Hits
    so users can experience instant playback without waiting.
    """
    import urllib.request
    import json
    import time
    from datetime import datetime, timedelta
    from models import get_db
    
    # Wait for servers to spin up
    time.sleep(10)
    print("🔥 Starting Background Pre-warming for Hot Songs...")
    
    try:
        # Get Global Hot Hits
        req = urllib.request.Request("http://127.0.0.1:8000/api/v1/music/search?q=global%20hot%20hits%202024")
        with urllib.request.urlopen(req) as res:
            songs = json.loads(res.read().decode())
            
        for song in songs[:5]: # Cache the top 5 hot songs
            video_id = song.get("id")
            if not video_id: continue
            
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT stream_url FROM stream_cache WHERE video_id = ?", (video_id,))
                if cursor.fetchone():
                    continue # Already cached
            
            print(f"🔥 Pre-warming cache for: {song.get('title')}")
            # Call the stream endpoint internally to trigger caching
            try:
                urllib.request.urlopen(f"http://127.0.0.1:8000/api/v1/music/stream?id={video_id}")
            except Exception as e:
                print(f"🔥 Failed to pre-warm {video_id}: {e}")
                
            time.sleep(5) # Delay to avoid rate limits
            
    except Exception as e:
        print("🔥 Pre-warming failed:", e)


if __name__ == '__main__':
    print("🚀 Initializing Elite Coach database...")
    init_db()
    
    print("🚀 Seeding initial fitness routines & playlist data...")
    seed_db()
    
    # Start background daemon for pre-fetching cache
    threading.Thread(target=pre_warm_hot_songs, daemon=True).start()
    
    # Lift off
    app.run(host='0.0.0.0', port=8000)
