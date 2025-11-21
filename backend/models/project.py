# backend/models/project.py
from datetime import datetime, timezone
from bson import ObjectId
import base64
import io
from PIL import Image

class ProjectModel:
    def __init__(self, db):
        self.col = db.projects
        print(f"✅ ProjectModel initialized with collection: {self.col.name}")

    def ensure_indexes(self):
        print("Creating indexes for projects collection...")
        self.col.create_index([("owner_id", 1), ("created_at", -1)])
        self.col.create_index([("visibility", 1), ("status", 1), ("created_at", -1)])
        print("✅ Indexes created successfully")

    def _resize_image_base64(self, image_data):
        if not image_data or not isinstance(image_data, str) or "base64," not in image_data:
            return image_data 

        try:
            header, encoded = image_data.split("base64,", 1)
            img_bytes = base64.b64decode(encoded)
            img = Image.open(io.BytesIO(img_bytes))
            img.thumbnail((1920, 1080))
            
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            new_encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
            return f"data:image/jpeg;base64,{new_encoded}"

        except Exception as e:
            print(f"❌ Image resize failed: {e}")
            return image_data

    def create(self, owner_id: ObjectId, payload: dict) -> ObjectId:
        print("\n--- ProjectModel.create() ---")
        
        original_image = payload.get("image", "")
        resized_image = self._resize_image_base64(original_image)
        detail = payload.get("detail", {})

        now = datetime.now(timezone.utc)

        # [FIX] Check both 'public' (Frontend) and 'isPublic' keys
        is_public = payload.get("isPublic", True)
        visibility_status = "public" if is_public else "private"

        doc = {
            "owner_id": owner_id,
            "title": payload.get("title", "").strip(),
            "image": resized_image,
            "detail": {
                "topic": detail.get("topic", ""),
                "startPoint": detail.get("startPoint", ""),
                "goal": detail.get("goal", ""),
                "process": detail.get("process", ""),
                "result": detail.get("result", ""),
                "takeaway": detail.get("takeaway", ""),
                "nextStep": detail.get("nextStep", ""),
            },
            "tags": payload.get("tags", []),
            # "categories": payload.get("categories", []),
            "contributor": payload.get("contributor", "Unknown"),
            "coauthors": payload.get("coauthors", []),
            
            "visibility": visibility_status,
            "allow_comments": payload.get("comments", True),

            "metrics": {"views": 0, "likes": 0},
            "created_at": now,
            "updated_at": now,
            "last_viewed_at": None,
            "is_deleted": False,
        }
        
        try:
            res = self.col.insert_one(doc)
            print(f"✅ Insert successful! ID: {res.inserted_id}")
            return res.inserted_id
        except Exception as e:
            print(f"❌ Insert failed: {e}")
            raise

    def get(self, pid: ObjectId):
        return self.col.find_one({"_id": pid, "is_deleted": {"$ne": True}})

    def update(self, pid: ObjectId, patch: dict) -> bool:

        if "public" in patch:
            patch["visibility"] = "public" if patch["public"] else "private"
            del patch["public"] # Remove boolean key before saving
        elif "isPublic" in patch:
            patch["visibility"] = "public" if patch["isPublic"] else "private"
            del patch["isPublic"]

        if "comments" in patch:
            patch["allow_comments"] = patch["comments"]
            del patch["comments"]

        allowed = {
            "title", "topic", "description", "objective", "goals", 
            "methods", "results", "outcomes", "next_steps", 
            "categories", "tags", "visibility", "status", "detail",
            "image", "coauthors", "allow_comments"
        }
        
        # Filter only allowed fields
        clean_patch = {k:v for k,v in (patch or {}).items() if k in allowed}
        
        if not clean_patch: return False

        if "image" in clean_patch and clean_patch["image"]:
            clean_patch["image"] = self._resize_image_base64(clean_patch["image"])

        clean_patch["updated_at"] = datetime.now(timezone.utc)
        
        r = self.col.update_one(
            {"_id": pid, "is_deleted": {"$ne": True}}, 
            {"$set": clean_patch}
        )
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