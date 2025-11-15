from typing import Optional
from pymongo.database import Database
from pymongo.errors import OperationFailure

def ensure_tags_index(db: Database, collection_name: str) -> None:
    """
    สร้าง index สำหรับ tags field ในคอลเลกชั่นที่ระบุ (ถ้าคอลเลกชั่นนั้นมีอยู่)
    Creates a sparse index on the tags field for the specified collection if it exists.

    :param db: MongoDB database handle
    :param collection_name: Name of the collection to create index on
    """
    try:
        # ตรวจสอบว่าคอลเลกชั่นมีอยู่หรือไม่
        if collection_name in db.list_collection_names():
            # สร้าง sparse index บน tags field
            db[collection_name].create_index(
                [("tags", 1)],
                name="tags_1",
                sparse=True  # เก็บเฉพาะ documents ที่มี tags field
            )
    except OperationFailure:
        # ถ้า index มีอยู่แล้วหรือมีข้อผิดพลาดอื่นๆ ให้ข้ามไป
        pass