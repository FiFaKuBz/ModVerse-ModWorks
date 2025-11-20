# backend/models/project.py
from datetime import datetime, timezone
from bson import ObjectId
import base64
import io
from PIL import Image

ALLOWED_SECTIONS = {"title","objective","goals","methods","outcomes","next_steps"}
ALLOWED_ASSET_TYPES = {"image","pdf","video","audio","link"}

class ProjectModel:
    def __init__(self, db):
        self.col = db.projects
        print(f"✅ ProjectModel initialized with collection: {self.col.name}")
        print(f"   Database: {db.name}")

    def ensure_indexes(self):
        print("Creating indexes for projects collection...")
        self.col.create_index([("owner_id", 1), ("created_at", -1)])
        self.col.create_index([("visibility", 1), ("status", 1), ("created_at", -1)])
        print("✅ Indexes created successfully")

    def _resize_image_base64(self, image_data):
        """
        รับ Base64 string -> ย่อให้ไม่เกิน 1920x1080 (Full HD) -> คืนค่า Base64 string (JPEG)
        """
        if not image_data or not isinstance(image_data, str) or "base64," not in image_data:
            return image_data # ถ้าไม่ใช่ base64 ให้คืนค่าเดิม

        try:
            # 1. แยก Header (เช่น data:image/png;base64,) ออกจากข้อมูล
            header, encoded = image_data.split("base64,", 1)
            
            # 2. ถอดรหัส Base64 เป็น bytes
            img_bytes = base64.b64decode(encoded)
            img = Image.open(io.BytesIO(img_bytes))

            # 3. ย่อภาพ (Thumbnail จะรักษาสัดส่วนภาพ ไม่ให้เกินขนาดที่กำหนด)
            img.thumbnail((1920, 1080))

            # 4. แปลงเป็น RGB (เผื่อกรณีไฟล์ PNG มีพื้นหลังโปร่งใส แล้วจะเซฟเป็น JPEG)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # 5. บันทึกลง Buffer ใหม่เป็น JPEG (Quality 85 กำลังดีสำหรับเว็บ)
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            
            # 6. เข้ารหัสกลับเป็น Base64
            new_encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
            
            # คืนค่าพร้อม Header ใหม่เป็น JPEG
            return f"data:image/jpeg;base64,{new_encoded}"

        except Exception as e:
            print(f"❌ Image resize failed: {e}")
            return image_data # ถ้า error ให้ใช้ภาพต้นฉบับไปเลย

    def create(self, owner_id: ObjectId, payload: dict) -> ObjectId:
        print("\n--- ProjectModel.create() ---")
        print(f"Owner ID: {owner_id}")
        print(f"Payload: {payload}")
        
        original_image = payload.get("image", "")
        resized_image = self._resize_image_base64(original_image)
        detail = payload.get("detail", {})

        now = datetime.now(timezone.utc)
        doc = {
            "owner_id": owner_id,
            "title": payload["title"].strip(),
            "image": resized_image,
            "detail": {
                "description": detail.get("summary", ""),
                "startPoint": detail.get("startPoint", ""),
                "goal": detail.get("goal", ""),
                "process": detail.get("process", ""),
                "result": detail.get("result", ""),
                "takeaway": detail.get("takeaway", ""),
                "nextStep": detail.get("nextStep", ""),
            },
            # "tags": [tag.strip() for tag in payload.get("tags", [])] if isinstance(payload.get("tags"), list) else [],
            "visibility": payload.get("isPubilc"),
            # "allow_comments": detail.get("")
            "metrics": {"views": 0, "likes": 0},
            "created_at": now,
            "updated_at": now,
            "last_viewed_at": None,
            "is_deleted": False,
        }
        
        print(f"Document to insert: {doc}")
        
        try:
            res = self.col.insert_one(doc)
            print(f"✅ Insert successful! ID: {res.inserted_id}")
            print(f"   Acknowledged: {res.acknowledged}")
            
            # ตรวจสอบว่าเข้า DB จริงหรือไม่
            verify = self.col.find_one({"_id": res.inserted_id})
            print(f"   Verification: {verify is not None}")
            
            return res.inserted_id
        except Exception as e:
            print(f"❌ Insert failed: {e}")
            raise

    def get(self, pid: ObjectId):
        return self.col.find_one({"_id": pid, "is_deleted": {"$ne": True}})

    def update(self, pid: ObjectId, patch: dict) -> bool:
        allowed = {"title","summary","description","objective","goals","methods","results","outcomes","next_steps","tags","visibility","status"}
        
        if "tags" in patch:
            if isinstance(patch["tags"], list):
                patch["tags"] = [tag.strip() for tag in patch["tags"] if isinstance(tag, str)]
            else:
                patch["tags"] = []

        patch = {k:v for k,v in (patch or {}).items() if k in allowed}
        if not patch: return False
        patch["updated_at"] = datetime.now(timezone.utc)
        r = self.col.update_one({"_id": pid, "is_deleted": {"$ne": True}}, {"$set": patch})
        return r.matched_count == 1

    def soft_delete(self, pid: ObjectId) -> bool:
        r = self.col.update_one({"_id": pid}, {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}})
        return r.matched_count == 1

    def list_owned(self, owner_id: ObjectId, q: str | None = None):
        filt = {"owner_id": owner_id, "is_deleted": {"$ne": True}}
        if q: 
            filt["title"] = {"$regex": q, "$options": "i"}
        return list(self.col.find(filt).sort("updated_at", -1))

    def list_public(self, q: str | None = None, status: str | None = None):
        filt = {"visibility": "public", "is_deleted": {"$ne": True}}
        if q: 
            filt["title"] = {"$regex": q, "$options": "i"}
        if status: filt["status"] = status
        return list(self.col.find(filt).sort("updated_at", -1))

    def inc_metric(self, pid: ObjectId, field: str, n=1):
        if field not in {"views","likes"}: return False
        r = self.col.update_one({"_id": pid}, {"$inc": {f"metrics.{field}": n}})
        return r.matched_count == 1

    def replace_section_asset(self, pid: ObjectId, user_id: ObjectId, section: str, asset: dict) -> bool:
        if section not in ALLOWED_SECTIONS: raise ValueError("invalid section")
        if asset.get("type") not in ALLOWED_ASSET_TYPES: raise ValueError("invalid asset type")
        now = datetime.now(timezone.utc)
        r = self.col.update_one(
            {"_id": pid},
            {
                "$pull": {"assets": {"section": section}},
                "$push": {"assets": {
                    "name": asset["name"], "type": asset["type"], "url": asset["url"],
                    "mime": asset.get("mime"), "size": asset.get("size"),
                    "section": section, "caption": asset.get("caption",""),
                    "alt": asset.get("alt",""), "order": 0, "source": asset.get("source","upload"),
                    "created_at": now, "created_by": user_id
                }},
                "$set": {"updated_at": now}
            }
        )
        return r.matched_count == 1

    def remove_section_asset(self, pid: ObjectId, section: str) -> bool:
        r = self.col.update_one({"_id": pid},
            {"$pull": {"assets": {"section": section}},
             "$set": {"updated_at": datetime.now(timezone.utc)}})
        return r.matched_count == 1