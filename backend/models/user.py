from datetime import datetime, timezone
from bson import ObjectId

class UserModel:
    """จัดการ database operations สำหรับ users"""
    
    def __init__(self, db):
        self.users = db.users
        self._create_indexes()
    
    def _create_indexes(self):
        """สร้าง index สำหรับ collection"""
        self.users.create_index([("google.sub", 1)], unique=True, sparse=True)
        self.users.create_index([("email", 1)], unique=True, sparse=True)
    
    def upsert_google_user(self, google_info):
        """
        เพิ่มหรืออัปเดตผู้ใช้จาก Google OAuth
        
        Args:
            google_info (dict): ข้อมูลจาก Google ID token
            
        Returns:
            dict: ข้อมูลผู้ใช้จาก database
        """
        now = datetime.now(timezone.utc)
        user_doc = {
            "google": {
                "sub": google_info.get("sub"),
                "email_verified": google_info.get("email_verified", False),
            },
            "email": google_info.get("email"),
            "name": google_info.get("name"),
            "picture": google_info.get("picture"),
            "updated_at": now,
            "last_login_at": now,
        }
        
        self.users.update_one(
            {"google.sub": google_info["sub"]},
            {
                "$set": user_doc,
                "$setOnInsert": {"created_at": now, "role": "user"},
                "$inc": {"login_count": 1},
            },
            upsert=True,
        )
        
        # ดึงข้อมูลผู้ใช้กลับมา
        return self.users.find_one(
            {"google.sub": google_info["sub"]},
            {"_id": 1, "name": 1, "email": 1, "picture": 1, "role": 1}
        )
    
    def get_user_by_id(self, user_id):
        """
        ดึงข้อมูลผู้ใช้จาก ObjectId
        
        Args:
            user_id (str or ObjectId): ID ของผู้ใช้
            
        Returns:
            dict or None: ข้อมูลผู้ใช้
        """
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return self.users.find_one({"_id": user_id}, {"_id": 0})