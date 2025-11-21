# backend/models/category.py
from bson import ObjectId

class TagModel:
    def __init__(self, db):
        self.col = db.tags
        
    def ensure_indexes(self):
        # ป้องกันชื่อ Tag ซ้ำ
        self.col.create_index("name", unique=True)

    def create_tag(self, name: str, color: str, is_primary: bool = False):
        """
        สร้าง Tag ใหม่
        """
        doc = {
            "name": name,           # tagname
            "color": color,         # colortag (Hex code ex. #FF5733)
            "is_primary": is_primary # ใช้แยกหมวดหมู่หลัก vs รอง
        }
        try:
            self.col.insert_one(doc)
            return True
        except Exception as e:
            print(f"Error creating tag: {e}")
            return False

    def list_all(self):
        """
        ดึง Tag ทั้งหมดเพื่อส่งไปให้ Frontend แสดงผล
        """
        # คืนค่าโดยแปลง _id เป็น string (tagID)
        tags = list(self.col.find({}, {"_id": 1, "name": 1, "color": 1, "is_primary": 1}))
        for tag in tags:
            tag["id"] = str(tag.pop("_id"))
        return tags