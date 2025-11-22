from datetime import datetime, timezone
from bson import ObjectId

class ReportModel:
    def __init__(self, db):
        self.col = db.reports
        # สร้าง index เพื่อให้ค้นหาตามสถานะหรือผู้ถูกรายงานได้เร็ว
        self.col.create_index("target_id")
        self.col.create_index("status")

    def create_report(self, reporter_id, target_id, reason, description=""):
        """
        สร้าง Ticket การรายงานใหม่
        """
        doc = {
            "reporter_id": ObjectId(reporter_id),
            "target_id": ObjectId(target_id),
            "reason": reason,
            "description": description,
            "status": "pending", # pending, reviewed, resolved
            "created_at": datetime.now(timezone.utc)
        }
        result = self.col.insert_one(doc)
        return result.inserted_id