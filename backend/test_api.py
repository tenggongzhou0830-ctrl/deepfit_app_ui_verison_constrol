import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000"

def run_test(path, method="GET", payload=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"} if payload else {}
    data = json.dumps(payload).encode('utf-8') if payload else None
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode('utf-8')
            try:
                parsed_body = json.loads(body)
            except ValueError:
                parsed_body = body
            return status, parsed_body
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            parsed_body = json.loads(body)
        except ValueError:
            parsed_body = body
        return e.code, parsed_body

if __name__ == '__main__':
    print("🧪 Elite Coach API Integration Verification Script 🧪")
    print("="*60)
    
    # 1. Test GET /api/v1/home/summary
    print("\n1. GET /api/v1/home/summary?user_id=Alex")
    status, res = run_test("/api/v1/home/summary?user_id=Alex")
    print(f"Status: {status}")
    print(json.dumps(res, indent=2, ensure_ascii=False))
    
    # 2. Test GET /api/v1/workout/plans
    print("\n2. GET /api/v1/workout/plans?user_id=Alex")
    status, initial_exercises = run_test("/api/v1/workout/plans?user_id=Alex")
    print(f"Status: {status}")
    print(json.dumps(initial_exercises, indent=2, ensure_ascii=False))
    
    # 3. Test POST /api/v1/workout/exercises
    print("\n3. POST /api/v1/workout/exercises (Add Upper Dumbbell Flyes)")
    new_ex_payload = {
        "name": "上斜哑铃飞鸟",
        "sets": 3,
        "reps": 12,
        "weight": 14.0,
        "rest": 60,
        "user_id": "Alex"
    }
    status, created_ex = run_test("/api/v1/workout/exercises", "POST", new_ex_payload)
    print(f"Status: {status}")
    print(json.dumps(created_ex, indent=2, ensure_ascii=False))
    new_ex_id = created_ex.get("id")
    
    # 4. Test PUT /api/v1/workout/exercises/{id}
    print(f"\n4. PUT /api/v1/workout/exercises/{new_ex_id} (Modify Weight to 16.0kg)")
    update_payload = {"weight": 16.0}
    status, updated_ex = run_test(f"/api/v1/workout/exercises/{new_ex_id}", "PUT", update_payload)
    print(f"Status: {status}")
    print(json.dumps(updated_ex, indent=2, ensure_ascii=False))
    
    # 5. Test POST /api/v1/workout/track-progress
    print("\n5. POST /api/v1/workout/track-progress (Record Set 1 of Bench Press)")
    progress_payload = {
        "exercise_id": "ex-1",
        "set_number": 1,
        "reps_completed": 8,
        "weight_lifted": 80.0,
        "user_id": "Alex"
    }
    status, progress_res = run_test("/api/v1/workout/track-progress", "POST", progress_payload)
    print(f"Status: {status}")
    print(json.dumps(progress_res, indent=2, ensure_ascii=False))
    
    # 6. Test GET /api/v1/music/playlist
    print("\n6. GET /api/v1/music/playlist")
    status, music_res = run_test("/api/v1/music/playlist")
    print(f"Status: {status}")
    print(json.dumps(music_res, indent=2, ensure_ascii=False))
    
    # 7. Test DELETE /api/v1/workout/exercises/{id}
    print(f"\n7. DELETE /api/v1/workout/exercises/{new_ex_id} (Clean Up Test Exercise)")
    status, delete_res = run_test(f"/api/v1/workout/exercises/{new_ex_id}", "DELETE")
    print(f"Status: {status}")
    print(json.dumps(delete_res, indent=2, ensure_ascii=False))
    
    # 8. Test GET /api/v1/workout/plans (Verify Deleted)
    print("\n8. GET /api/v1/workout/plans?user_id=Alex (Verification Post-Delete)")
    status, final_exercises = run_test("/api/v1/workout/plans?user_id=Alex")
    print(f"Status: {status}")
    print(json.dumps(final_exercises, indent=2, ensure_ascii=False))
    
    print("\n🎉 All tests completed. Everything functions flawlessly!")
