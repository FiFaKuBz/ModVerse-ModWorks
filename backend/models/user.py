# backend/models/user.py
from datetime import datetime, timezone
from bson import ObjectId
import re

def slugify(value=""):
    value = value.lower().strip()
    value = re.sub(r'[^a-z0-9ก-๙\s-]', '', value)
    return re.sub(r'\s+', '-', value).strip('-')

class UserModel:
    def __init__(self, db):
        self.users = db.users
        self._create_indexes()
    
    def _create_indexes(self):
        self.users.create_index([("google.sub", 1)], unique=True, sparse=True)
        self.users.create_index([("email", 1)], unique=True, sparse=True)
        self.users.create_index([("username", 1)], unique=True, sparse=True) # อย่าลืม Index นี้
    
    def upsert_google_user(self, google_info):
        now = datetime.now(timezone.utc)
        
        # ✅ EDIT: เปลี่ยนการเก็บข้อมูลจาก Google ให้เป็นชื่อใหม่ (avatar)
        user_doc = {
            "google": {
                "sub": google_info.get("sub"),
                "email_verified": google_info.get("email_verified", False),
            },
            "email": google_info.get("email"),
            "name": google_info.get("name"),
            "avatar": google_info.get("picture"), # Map picture -> avatar ที่นี่เลย
            "updated_at": now,
            "last_login_at": now,
        }
        
        default_username = slugify(google_info.get("name") or google_info.get("email").split('@')[0])
        
        self.users.update_one(
            {"google.sub": google_info["sub"]},
            {
                "$set": user_doc,
                "$setOnInsert": {
                    "created_at": now, 
                    "role": "user",
                    "username": default_username,
                    "about": "" # ✅ NEW: เพิ่ม field about เริ่มต้น
                },
                "$inc": {"login_count": 1},
            },
            upsert=True,
        )
        
        return self.users.find_one(
            {"google.sub": google_info["sub"]},
            # ✅ EDIT: ดึง field ตามชื่อใหม่
            {"_id": 1, "name": 1, "email": 1, "avatar": 1, "role": 1, "username": 1, "about": 1}
        )
    
    def get_user_by_id(self, user_id):
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        # ✅ EDIT: คืนค่า _id เป็น string และดึง field ใหม่
        user = self.users.find_one({"_id": user_id})
        if user:
            user["_id"] = str(user["_id"])
        return user

    def get_user_by_username(self, username):
        user = self.users.find_one({"username": username})
        if user:
            user["_id"] = str(user["_id"])
        return user

    # ✅ NEW: เพิ่มฟังก์ชัน update_user ที่ขาดไป (รับชื่อ field ใหม่)
    def update_user(self, user_id, update_data):
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
            
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = self.users.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
        return result.matched_count > 0
    
    def follow_user(self, follower_id: ObjectId, target_user_id: ObjectId):
        """
        follower_id: The ID of the person doing the action (You)
        target_user_id: The ID of the person being followed
        """
        if follower_id == target_user_id:
            return False

        # Add target to your 'following' list
        self.users.update_one(
            {"_id": follower_id},
            {"$addToSet": {"following": str(target_user_id)}}
        )
        
        # Add you to target's 'followers' list
        self.users.update_one(
            {"_id": target_user_id},
            {"$addToSet": {"followers": str(follower_id)}}
        )
        return True

    def unfollow_user(self, follower_id: ObjectId, target_user_id: ObjectId):
        self.users.update_one(
            {"_id": follower_id},
            {"$pull": {"following": str(target_user_id)}}
        )
        self.users.update_one(
            {"_id": target_user_id},
            {"$pull": {"followers": str(follower_id)}}
        )
        return True
    
    def toggle_save_project(self, user_id: ObjectId, project_id: str):
        user = self.users.find_one({"_id": user_id})
        saved = user.get("saved_projects", [])
        
        if project_id in saved:
            self.users.update_one({"_id": user_id}, {"$pull": {"saved_projects": project_id}})
            return False # Not saved anymore
        else:
            self.users.update_one({"_id": user_id}, {"$addToSet": {"saved_projects": project_id}})
            return True # Now saved

    def block_user(self, blocker_id: ObjectId, target_id: ObjectId):
        """
        blocker_id: The ID of the user who is blocking
        target_id: The ID of the user being blocked
        """
        if blocker_id == target_id:
            return False

        # Add target to blocker's 'blocked_users' list
        self.users.update_one(
            {"_id": blocker_id},
            {"$addToSet": {"blocked_users": str(target_id)}}
        )
        
        # Optional: Remove follow relationships
        self.unfollow_user(blocker_id, target_id)
        self.unfollow_user(target_id, blocker_id)
        
        return True

    def unblock_user(self, blocker_id: ObjectId, target_id: ObjectId):
        self.users.update_one(
            {"_id": blocker_id},
            {"$pull": {"blocked_users": str(target_id)}}
        )
        return True

    def is_blocked(self, user_id: ObjectId, target_id: str):
        """Check if user_id has blocked target_id"""
        user = self.users.find_one({"_id": user_id}, {"blocked_users": 1})
        if user and "blocked_users" in user:
            return target_id in user["blocked_users"]
        return False