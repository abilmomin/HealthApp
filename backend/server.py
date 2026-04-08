from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from cachetools import TTLCache

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

FIREBASE_PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', '')
NUTRITION_API_KEY = os.environ.get('NUTRITION_API_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Cache for Google public keys (1 hour TTL)
google_keys_cache = TTLCache(maxsize=1, ttl=3600)

# ---- Firebase Token Verification ----
async def get_google_public_keys():
    if 'keys' in google_keys_cache:
        return google_keys_cache['keys']
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
        )
        keys = resp.json()
        google_keys_cache['keys'] = keys
        return keys

async def verify_firebase_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        import jwt
        from cryptography.x509 import load_pem_x509_certificate
        from cryptography.hazmat.backends import default_backend
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        keys = await get_google_public_keys()
        if kid not in keys:
            raise HTTPException(status_code=401, detail="Invalid token key ID")
        cert_str = keys[kid]
        cert = load_pem_x509_certificate(cert_str.encode(), default_backend())
        public_key = cert.public_key()
        decoded = jwt.decode(
            token, public_key, algorithms=['RS256'],
            audience=FIREBASE_PROJECT_ID,
            issuer=f'https://securetoken.google.com/{FIREBASE_PROJECT_ID}'
        )
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# ---- Pydantic Models ----
class UserSync(BaseModel):
    display_name: Optional[str] = ""
    photo_url: Optional[str] = ""

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    uid: str
    email: str
    display_name: str = ""
    photo_url: str = ""
    bio: str = ""
    height: Optional[float] = None
    weight: Optional[float] = None
    age: Optional[int] = None
    created_at: str = ""

class WorkoutCreate(BaseModel):
    name: str
    exercises: List[dict] = []
    duration_minutes: int = 0
    notes: str = ""
    date: Optional[str] = None

class NutritionLogCreate(BaseModel):
    food_name: str
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    serving_size: str = ""
    date: Optional[str] = None

class GoalCreate(BaseModel):
    title: str
    goal_type: str
    target_value: float
    current_value: float = 0
    unit: str = ""
    deadline: Optional[str] = None

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    current_value: Optional[float] = None
    target_value: Optional[float] = None
    deadline: Optional[str] = None
    completed: Optional[bool] = None

class WeightLogCreate(BaseModel):
    weight: float
    date: Optional[str] = None

# ---- Auth & User Endpoints ----
@api_router.get("/")
async def root():
    return {"message": "Healthmax API"}

@api_router.post("/auth/sync")
async def sync_user(data: UserSync, user=Depends(verify_firebase_token)):
    uid = user['sub']
    email = user.get('email', '')
    now = datetime.now(timezone.utc).isoformat()
    existing = await db.users.find_one({"uid": uid}, {"_id": 0})
    if existing:
        update = {"display_name": data.display_name or existing.get("display_name", ""), "photo_url": data.photo_url or existing.get("photo_url", ""), "last_login": now}
        await db.users.update_one({"uid": uid}, {"$set": update})
        existing.update(update)
        return existing
    else:
        user_doc = {"uid": uid, "email": email, "display_name": data.display_name or email.split("@")[0], "photo_url": data.photo_url or "", "bio": "", "height": None, "weight": None, "age": None, "created_at": now, "last_login": now}
        await db.users.insert_one(user_doc)
        user_doc.pop("_id", None)
        return user_doc

@api_router.get("/users/me")
async def get_me(user=Depends(verify_firebase_token)):
    doc = await db.users.find_one({"uid": user['sub']}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "User not found")
    return doc

@api_router.put("/users/me")
async def update_me(data: dict, user=Depends(verify_firebase_token)):
    allowed = {"display_name", "bio", "height", "weight", "age", "photo_url"}
    update = {k: v for k, v in data.items() if k in allowed}
    if update:
        await db.users.update_one({"uid": user['sub']}, {"$set": update})
    doc = await db.users.find_one({"uid": user['sub']}, {"_id": 0})
    return doc

@api_router.get("/users/search")
async def search_users(q: str = Query(""), user=Depends(verify_firebase_token)):
    if not q or len(q) < 2:
        return []
    results = await db.users.find(
        {"$and": [{"uid": {"$ne": user['sub']}}, {"$or": [{"display_name": {"$regex": q, "$options": "i"}}, {"email": {"$regex": q, "$options": "i"}}]}]},
        {"_id": 0, "uid": 1, "display_name": 1, "photo_url": 1, "email": 1}
    ).to_list(20)
    return results

@api_router.get("/users/{user_id}")
async def get_user(user_id: str, user=Depends(verify_firebase_token)):
    doc = await db.users.find_one({"uid": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "User not found")
    return doc

# ---- Workout Endpoints ----
@api_router.post("/workouts")
async def create_workout(data: WorkoutCreate, user=Depends(verify_firebase_token)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {"id": str(uuid.uuid4()), "uid": user['sub'], "name": data.name, "exercises": data.exercises, "duration_minutes": data.duration_minutes, "notes": data.notes, "date": data.date or now[:10], "created_at": now, "shared": False}
    await db.workouts.insert_one(doc)
    doc.pop("_id", None)
    await update_streak(user['sub'])
    return doc

@api_router.get("/workouts")
async def get_workouts(date: Optional[str] = None, limit: int = 50, user=Depends(verify_firebase_token)):
    query = {"uid": user['sub']}
    if date:
        query["date"] = date
    docs = await db.workouts.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs

@api_router.get("/workouts/{workout_id}")
async def get_workout(workout_id: str, user=Depends(verify_firebase_token)):
    doc = await db.workouts.find_one({"id": workout_id, "uid": user['sub']}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Workout not found")
    return doc

@api_router.delete("/workouts/{workout_id}")
async def delete_workout(workout_id: str, user=Depends(verify_firebase_token)):
    result = await db.workouts.delete_one({"id": workout_id, "uid": user['sub']})
    if result.deleted_count == 0:
        raise HTTPException(404, "Workout not found")
    return {"deleted": True}

# ---- Nutrition Endpoints ----
@api_router.get("/nutrition/search")
async def search_nutrition(q: str = Query(""), user=Depends(verify_firebase_token)):
    if not q:
        return {"items": []}
    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(
                f"https://api.calorieninjas.com/v1/nutrition?query={q}",
                headers={"X-Api-Key": NUTRITION_API_KEY},
                timeout=10
            )
            if resp.status_code == 200:
                return resp.json()
            return {"items": []}
    except Exception as e:
        logger.error(f"Nutrition API error: {e}")
        return {"items": []}

@api_router.post("/nutrition/logs")
async def create_nutrition_log(data: NutritionLogCreate, user=Depends(verify_firebase_token)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {"id": str(uuid.uuid4()), "uid": user['sub'], "food_name": data.food_name, "calories": data.calories, "protein_g": data.protein_g, "carbs_g": data.carbs_g, "fat_g": data.fat_g, "serving_size": data.serving_size, "date": data.date or now[:10], "created_at": now}
    await db.nutrition_logs.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/nutrition/logs")
async def get_nutrition_logs(date: Optional[str] = None, limit: int = 50, user=Depends(verify_firebase_token)):
    query = {"uid": user['sub']}
    if date:
        query["date"] = date
    docs = await db.nutrition_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs

@api_router.delete("/nutrition/logs/{log_id}")
async def delete_nutrition_log(log_id: str, user=Depends(verify_firebase_token)):
    result = await db.nutrition_logs.delete_one({"id": log_id, "uid": user['sub']})
    if result.deleted_count == 0:
        raise HTTPException(404, "Log not found")
    return {"deleted": True}

# ---- Goals Endpoints ----
@api_router.post("/goals")
async def create_goal(data: GoalCreate, user=Depends(verify_firebase_token)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {"id": str(uuid.uuid4()), "uid": user['sub'], "title": data.title, "goal_type": data.goal_type, "target_value": data.target_value, "current_value": data.current_value, "unit": data.unit, "deadline": data.deadline, "completed": False, "created_at": now}
    await db.goals.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/goals")
async def get_goals(user=Depends(verify_firebase_token)):
    docs = await db.goals.find({"uid": user['sub']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs

@api_router.put("/goals/{goal_id}")
async def update_goal(goal_id: str, data: GoalUpdate, user=Depends(verify_firebase_token)):
    update = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if update:
        await db.goals.update_one({"id": goal_id, "uid": user['sub']}, {"$set": update})
    doc = await db.goals.find_one({"id": goal_id, "uid": user['sub']}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Goal not found")
    return doc

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user=Depends(verify_firebase_token)):
    result = await db.goals.delete_one({"id": goal_id, "uid": user['sub']})
    if result.deleted_count == 0:
        raise HTTPException(404, "Goal not found")
    return {"deleted": True}

# ---- Weight Tracking ----
@api_router.post("/weight")
async def log_weight(data: WeightLogCreate, user=Depends(verify_firebase_token)):
    now = datetime.now(timezone.utc).isoformat()
    date = data.date or now[:10]
    await db.weight_logs.update_one(
        {"uid": user['sub'], "date": date},
        {"$set": {"uid": user['sub'], "weight": data.weight, "date": date, "updated_at": now}},
        upsert=True
    )
    await db.users.update_one({"uid": user['sub']}, {"$set": {"weight": data.weight}})
    return {"weight": data.weight, "date": date}

@api_router.get("/weight")
async def get_weight_logs(limit: int = 90, user=Depends(verify_firebase_token)):
    docs = await db.weight_logs.find({"uid": user['sub']}, {"_id": 0}).sort("date", -1).to_list(limit)
    return docs

# ---- Exercise Library ----
EXERCISES_DB = [
    {"name": "Bench Press", "muscle_group": "Chest", "equipment": "Barbell", "type": "strength"},
    {"name": "Push-ups", "muscle_group": "Chest", "equipment": "Bodyweight", "type": "strength"},
    {"name": "Dumbbell Fly", "muscle_group": "Chest", "equipment": "Dumbbells", "type": "strength"},
    {"name": "Incline Bench Press", "muscle_group": "Chest", "equipment": "Barbell", "type": "strength"},
    {"name": "Cable Crossover", "muscle_group": "Chest", "equipment": "Cable", "type": "strength"},
    {"name": "Pull-ups", "muscle_group": "Back", "equipment": "Bodyweight", "type": "strength"},
    {"name": "Barbell Row", "muscle_group": "Back", "equipment": "Barbell", "type": "strength"},
    {"name": "Lat Pulldown", "muscle_group": "Back", "equipment": "Cable", "type": "strength"},
    {"name": "Deadlift", "muscle_group": "Back", "equipment": "Barbell", "type": "strength"},
    {"name": "Seated Cable Row", "muscle_group": "Back", "equipment": "Cable", "type": "strength"},
    {"name": "Overhead Press", "muscle_group": "Shoulders", "equipment": "Barbell", "type": "strength"},
    {"name": "Lateral Raise", "muscle_group": "Shoulders", "equipment": "Dumbbells", "type": "strength"},
    {"name": "Front Raise", "muscle_group": "Shoulders", "equipment": "Dumbbells", "type": "strength"},
    {"name": "Face Pull", "muscle_group": "Shoulders", "equipment": "Cable", "type": "strength"},
    {"name": "Arnold Press", "muscle_group": "Shoulders", "equipment": "Dumbbells", "type": "strength"},
    {"name": "Bicep Curl", "muscle_group": "Arms", "equipment": "Dumbbells", "type": "strength"},
    {"name": "Hammer Curl", "muscle_group": "Arms", "equipment": "Dumbbells", "type": "strength"},
    {"name": "Tricep Pushdown", "muscle_group": "Arms", "equipment": "Cable", "type": "strength"},
    {"name": "Skull Crushers", "muscle_group": "Arms", "equipment": "Barbell", "type": "strength"},
    {"name": "Preacher Curl", "muscle_group": "Arms", "equipment": "Barbell", "type": "strength"},
    {"name": "Barbell Squat", "muscle_group": "Legs", "equipment": "Barbell", "type": "strength"},
    {"name": "Leg Press", "muscle_group": "Legs", "equipment": "Machine", "type": "strength"},
    {"name": "Lunges", "muscle_group": "Legs", "equipment": "Bodyweight", "type": "strength"},
    {"name": "Leg Extension", "muscle_group": "Legs", "equipment": "Machine", "type": "strength"},
    {"name": "Leg Curl", "muscle_group": "Legs", "equipment": "Machine", "type": "strength"},
    {"name": "Calf Raises", "muscle_group": "Legs", "equipment": "Machine", "type": "strength"},
    {"name": "Romanian Deadlift", "muscle_group": "Legs", "equipment": "Barbell", "type": "strength"},
    {"name": "Plank", "muscle_group": "Core", "equipment": "Bodyweight", "type": "strength"},
    {"name": "Crunches", "muscle_group": "Core", "equipment": "Bodyweight", "type": "strength"},
    {"name": "Russian Twist", "muscle_group": "Core", "equipment": "Bodyweight", "type": "strength"},
    {"name": "Leg Raise", "muscle_group": "Core", "equipment": "Bodyweight", "type": "strength"},
    {"name": "Ab Rollout", "muscle_group": "Core", "equipment": "Ab Wheel", "type": "strength"},
    {"name": "Running", "muscle_group": "Cardio", "equipment": "None", "type": "cardio"},
    {"name": "Cycling", "muscle_group": "Cardio", "equipment": "Bike", "type": "cardio"},
    {"name": "Swimming", "muscle_group": "Cardio", "equipment": "Pool", "type": "cardio"},
    {"name": "Jump Rope", "muscle_group": "Cardio", "equipment": "Jump Rope", "type": "cardio"},
    {"name": "Rowing", "muscle_group": "Cardio", "equipment": "Rowing Machine", "type": "cardio"},
    {"name": "Elliptical", "muscle_group": "Cardio", "equipment": "Machine", "type": "cardio"},
    {"name": "Burpees", "muscle_group": "Full Body", "equipment": "Bodyweight", "type": "strength"},
    {"name": "Kettlebell Swing", "muscle_group": "Full Body", "equipment": "Kettlebell", "type": "strength"},
    {"name": "Clean and Jerk", "muscle_group": "Full Body", "equipment": "Barbell", "type": "strength"},
    {"name": "Snatch", "muscle_group": "Full Body", "equipment": "Barbell", "type": "strength"},
    {"name": "Box Jumps", "muscle_group": "Full Body", "equipment": "Box", "type": "strength"},
]

@api_router.get("/exercises")
async def get_exercises(muscle_group: Optional[str] = None, q: Optional[str] = None):
    results = EXERCISES_DB
    if muscle_group:
        results = [e for e in results if e['muscle_group'].lower() == muscle_group.lower()]
    if q:
        results = [e for e in results if q.lower() in e['name'].lower()]
    return results

# ---- Social Endpoints ----
@api_router.post("/social/follow/{target_uid}")
async def follow_user(target_uid: str, user=Depends(verify_firebase_token)):
    uid = user['sub']
    if uid == target_uid:
        raise HTTPException(400, "Cannot follow yourself")
    existing = await db.follows.find_one({"follower": uid, "following": target_uid})
    if existing:
        return {"status": "already_following"}
    await db.follows.insert_one({"follower": uid, "following": target_uid, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"status": "followed"}

@api_router.delete("/social/unfollow/{target_uid}")
async def unfollow_user(target_uid: str, user=Depends(verify_firebase_token)):
    await db.follows.delete_one({"follower": user['sub'], "following": target_uid})
    return {"status": "unfollowed"}

@api_router.get("/social/following")
async def get_following(user=Depends(verify_firebase_token)):
    follows = await db.follows.find({"follower": user['sub']}, {"_id": 0}).to_list(500)
    uids = [f['following'] for f in follows]
    users = await db.users.find({"uid": {"$in": uids}}, {"_id": 0, "uid": 1, "display_name": 1, "photo_url": 1}).to_list(500)
    return users

@api_router.get("/social/followers")
async def get_followers(user=Depends(verify_firebase_token)):
    follows = await db.follows.find({"following": user['sub']}, {"_id": 0}).to_list(500)
    uids = [f['follower'] for f in follows]
    users = await db.users.find({"uid": {"$in": uids}}, {"_id": 0, "uid": 1, "display_name": 1, "photo_url": 1}).to_list(500)
    return users

@api_router.post("/social/share/{workout_id}")
async def share_workout(workout_id: str, user=Depends(verify_firebase_token)):
    workout = await db.workouts.find_one({"id": workout_id, "uid": user['sub']}, {"_id": 0})
    if not workout:
        raise HTTPException(404, "Workout not found")
    await db.workouts.update_one({"id": workout_id}, {"$set": {"shared": True}})
    user_doc = await db.users.find_one({"uid": user['sub']}, {"_id": 0, "uid": 1, "display_name": 1, "photo_url": 1})
    share_doc = {"id": str(uuid.uuid4()), "workout_id": workout_id, "uid": user['sub'], "user": user_doc, "workout": {**workout, "shared": True}, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.shared_workouts.insert_one(share_doc)
    share_doc.pop("_id", None)
    return share_doc

@api_router.get("/social/feed")
async def get_social_feed(limit: int = 30, user=Depends(verify_firebase_token)):
    follows = await db.follows.find({"follower": user['sub']}, {"_id": 0}).to_list(500)
    following_uids = [f['following'] for f in follows] + [user['sub']]
    docs = await db.shared_workouts.find(
        {"uid": {"$in": following_uids}}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return docs

# ---- Streaks & Badges ----
BADGE_DEFINITIONS = [
    {"id": "first_workout", "name": "First Workout", "description": "Complete your first workout", "icon": "dumbbell"},
    {"id": "streak_7", "name": "7-Day Streak", "description": "Work out 7 days in a row", "icon": "flame"},
    {"id": "streak_30", "name": "30-Day Streak", "description": "Work out 30 days in a row", "icon": "fire"},
    {"id": "workouts_10", "name": "10 Workouts", "description": "Complete 10 workouts", "icon": "trophy"},
    {"id": "workouts_50", "name": "50 Workouts", "description": "Complete 50 workouts", "icon": "medal"},
    {"id": "workouts_100", "name": "Century Club", "description": "Complete 100 workouts", "icon": "crown"},
    {"id": "goal_crusher", "name": "Goal Crusher", "description": "Complete your first goal", "icon": "target"},
    {"id": "social_butterfly", "name": "Social Butterfly", "description": "Get 5 followers", "icon": "users"},
    {"id": "nutrition_tracker", "name": "Nutrition Pro", "description": "Log meals for 7 days straight", "icon": "apple"},
]

async def update_streak(uid: str):
    today = datetime.now(timezone.utc).date().isoformat()
    streak_doc = await db.streaks.find_one({"uid": uid}, {"_id": 0})
    if not streak_doc:
        await db.streaks.insert_one({"uid": uid, "current_streak": 1, "longest_streak": 1, "last_workout_date": today, "total_workouts": 1})
        await check_badges(uid)
        return
    last_date = streak_doc.get("last_workout_date", "")
    if last_date == today:
        return
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    total = streak_doc.get("total_workouts", 0) + 1
    if last_date == yesterday:
        new_streak = streak_doc.get("current_streak", 0) + 1
    else:
        new_streak = 1
    longest = max(new_streak, streak_doc.get("longest_streak", 0))
    await db.streaks.update_one({"uid": uid}, {"$set": {"current_streak": new_streak, "longest_streak": longest, "last_workout_date": today, "total_workouts": total}})
    await check_badges(uid)

async def check_badges(uid: str):
    streak = await db.streaks.find_one({"uid": uid}, {"_id": 0})
    if not streak:
        return
    earned = []
    total = streak.get("total_workouts", 0)
    current = streak.get("current_streak", 0)
    if total >= 1:
        earned.append("first_workout")
    if current >= 7:
        earned.append("streak_7")
    if current >= 30:
        earned.append("streak_30")
    if total >= 10:
        earned.append("workouts_10")
    if total >= 50:
        earned.append("workouts_50")
    if total >= 100:
        earned.append("workouts_100")
    goals = await db.goals.count_documents({"uid": uid, "completed": True})
    if goals > 0:
        earned.append("goal_crusher")
    followers = await db.follows.count_documents({"following": uid})
    if followers >= 5:
        earned.append("social_butterfly")
    for badge_id in earned:
        await db.badges.update_one(
            {"uid": uid, "badge_id": badge_id},
            {"$setOnInsert": {"uid": uid, "badge_id": badge_id, "earned_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )

@api_router.get("/stats/streaks")
async def get_streaks(user=Depends(verify_firebase_token)):
    streak = await db.streaks.find_one({"uid": user['sub']}, {"_id": 0})
    badges = await db.badges.find({"uid": user['sub']}, {"_id": 0}).to_list(100)
    earned_ids = [b['badge_id'] for b in badges]
    all_badges = [
        {**b, "earned": b['id'] in earned_ids, "earned_at": next((eb['earned_at'] for eb in badges if eb['badge_id'] == b['id']), None)}
        for b in BADGE_DEFINITIONS
    ]
    return {"streak": streak or {"current_streak": 0, "longest_streak": 0, "total_workouts": 0}, "badges": all_badges}

# ---- Dashboard Stats ----
@api_router.get("/stats/dashboard")
async def get_dashboard_stats(user=Depends(verify_firebase_token)):
    uid = user['sub']
    today = datetime.now(timezone.utc).date().isoformat()
    week_ago = (datetime.now(timezone.utc).date() - timedelta(days=7)).isoformat()
    total_workouts = await db.workouts.count_documents({"uid": uid})
    week_workouts = await db.workouts.count_documents({"uid": uid, "date": {"$gte": week_ago}})
    today_cals_pipeline = [
        {"$match": {"uid": uid, "date": today}},
        {"$group": {"_id": None, "total": {"$sum": "$calories"}}}
    ]
    today_cals = await db.nutrition_logs.aggregate(today_cals_pipeline).to_list(1)
    today_calories = today_cals[0]['total'] if today_cals else 0
    week_cals_pipeline = [
        {"$match": {"uid": uid, "date": {"$gte": week_ago}}},
        {"$group": {"_id": "$date", "total": {"$sum": "$calories"}}},
        {"$sort": {"_id": 1}}
    ]
    week_calories = await db.nutrition_logs.aggregate(week_cals_pipeline).to_list(7)
    streak = await db.streaks.find_one({"uid": uid}, {"_id": 0})
    recent_workouts = await db.workouts.find({"uid": uid}, {"_id": 0}).sort("created_at", -1).to_list(5)
    active_goals = await db.goals.count_documents({"uid": uid, "completed": False})
    weight_logs = await db.weight_logs.find({"uid": uid}, {"_id": 0}).sort("date", -1).to_list(30)
    # Workout frequency by day of week
    week_workout_dates = await db.workouts.find({"uid": uid, "date": {"$gte": week_ago}}, {"_id": 0, "date": 1}).to_list(100)
    return {
        "total_workouts": total_workouts,
        "week_workouts": week_workouts,
        "today_calories": today_calories,
        "week_calories": [{"date": d['_id'], "calories": d['total']} for d in week_calories],
        "current_streak": streak.get("current_streak", 0) if streak else 0,
        "longest_streak": streak.get("longest_streak", 0) if streak else 0,
        "total_workout_count": streak.get("total_workouts", 0) if streak else 0,
        "recent_workouts": recent_workouts,
        "active_goals": active_goals,
        "weight_history": weight_logs,
        "week_workout_dates": [w['date'] for w in week_workout_dates]
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
