from flask import Blueprint, request, jsonify, session, current_app
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from models.project import ProjectModel, ALLOWED_SECTIONS
from auth.decorators import login_required
from copy import deepcopy

project_bp = Blueprint("projects", __name__)

_project_model: ProjectModel | None = None
_db = None

def init_project_routes(project_model: ProjectModel, mongo_db):
    """
    เริ่มต้น routes โดยเชื่อมกับ model และ database
    
    Args:
        project_model: ProjectModel instance
        mongo_db: MongoDB database instance
    """
    global _project_model, _db
    _project_model = project_model
    _db = mongo_db

def _to_objid(val):
    """
    แปลง string เป็น ObjectId (ถ้าทำได้)
    
    Args:
        val: ค่าที่ต้องการแปลง
    
    Returns:
        ObjectId หรือ None ถ้าแปลงไม่ได้
    """
    try:
        return ObjectId(val) if val is not None else None
    except (InvalidId, TypeError):
        return None

def _serialize(doc):
    """
    แปลงข้อมูล MongoDB document เป็น JSON-friendly format
    
    - แปลง ObjectId เป็น string
    - แปลง datetime เป็น ISO format string
    
    Args:
        doc: MongoDB document (dict)
    
    Returns:
        dict ที่พร้อมส่งเป็น JSON
    """
    if not doc:
        return None
    
    d = deepcopy(doc)  # สำเนาเพื่อไม่แก้ original
    
    # แปลง ObjectId เป็น string
    if d.get("_id") is not None:
        d["_id"] = str(d["_id"])
    if d.get("owner_id") is not None:
        d["owner_id"] = str(d["owner_id"])
    
    # แปลง datetime เป็น ISO string
    for k in ("created_at", "updated_at", "last_viewed_at"):
        if isinstance(d.get(k), datetime):
            d[k] = d[k].isoformat()
    
    # แปลง created_by ใน assets
    for a in d.get("assets", []):
        if a.get("created_by") is not None:
            a["created_by"] = str(a["created_by"])
        # ✨ แปลง created_at ใน asset ด้วย
        if isinstance(a.get("created_at"), datetime):
            a["created_at"] = a["created_at"].isoformat()
    
    return d

def _ensure_init():
    """ตรวจสอบว่า routes ถูกเริ่มต้นแล้วหรือยัง"""
    if _project_model is None:
        current_app.logger.error("project routes not initialized")
        raise RuntimeError("routes not initialized")


# ============================================================
# CREATE - สร้างโปรเจกต์ใหม่
# ============================================================

@project_bp.post("/projects")
@login_required
def create_project():
    """
    สร้างโปรเจกต์ใหม่
    
    Method: POST
    Endpoint: /projects
    Auth: ต้อง login
    
    Body (JSON):
        {
            "title": "ชื่อโปรเจกต์",  # required
            "summary": "บทสรุป",
            "description": "รายละเอียด",
            "visibility": "private" | "public",
            "status": "draft" | "active" | "archived",
            ...
        }
    
    Returns:
        201: {"id": "project_id"}
        400: {"error": "title required"}
    """
    _ensure_init()
    user = session.get("user")
    body = request.get_json() or {}
    
    # ตรวจสอบว่ามี title
    title = (body.get("title") or "").strip()
    if not title:
        return jsonify(error="title required"), 400
    
    # ดึง owner_id และแปลงเป็น ObjectId
    owner_id = user.get("_id")
    oid = _to_objid(owner_id) or owner_id
    
    # สร้างโปรเจกต์
    pid = _project_model.create(oid, body)
    return jsonify(id=str(pid)), 201


# ============================================================
# READ - ดึงข้อมูลโปรเจกต์
# ============================================================

@project_bp.get("/projects/<pid>")
def get_project(pid):
    """
    ดึงข้อมูลโปรเจกต์ตาม ID
    
    Method: GET
    Endpoint: /projects/<pid>
    Auth: ไม่จำเป็นสำหรับโปรเจกต์สาธารณะ
    
    Returns:
        200: {...project data...}
        400: {"error": "invalid id"}
        403: {"error": "forbidden"}
        404: {"error": "not found"}
    """
    _ensure_init()
    user = session.get("user")  # อาจเป็น None ถ้าไม่ได้ login
    
    # แปลง pid เป็น ObjectId
    oid = _to_objid(pid)
    if oid is None:
        return jsonify(error="invalid id"), 400
    
    # ดึงข้อมูล
    doc = _project_model.get(oid)
    if not doc:
        return jsonify(error="not found"), 404
    
    # ✨ ตรวจสอบสิทธิ์: เจ้าของหรือ public เท่านั้น
    if doc.get("visibility") != "public":
        # ถ้าไม่ใช่ public ต้อง login และเป็นเจ้าของ
        if user is None or str(user.get("_id")) != str(doc.get("owner_id")):
            return jsonify(error="forbidden"), 403

    return jsonify(_serialize(doc)), 200


# ============================================================
# UPDATE - แก้ไขโปรเจกต์
# ============================================================

@project_bp.patch("/projects/<pid>")
@login_required
def update_project(pid):
    """
    แก้ไขโปรเจกต์ (เฉพาะเจ้าของ)
    
    Method: PATCH
    Endpoint: /projects/<pid>
    Auth: ต้อง login และเป็นเจ้าของ
    
    Body (JSON):
        {
            "title": "ชื่อใหม่",
            "status": "active",
            ...
        }
    
    Returns:
        200: {"ok": true}
        400: {"error": "invalid id"} หรือ {"ok": false}
        403: {"error": "forbidden"}
        404: {"error": "not found"}
    """
    _ensure_init()
    user = session.get("user")
    
    # แปลง pid เป็น ObjectId
    oid = _to_objid(pid)
    if oid is None:
        return jsonify(error="invalid id"), 400
    
    # ตรวจสอบว่าโปรเจกต์มีอยู่จริง
    doc = _project_model.get(oid)
    if not doc:
        return jsonify(error="not found"), 404
    
    # ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของ
    if str(user.get("_id")) != str(doc.get("owner_id")):
        return jsonify(error="forbidden"), 403
    
    # อัปเดตข้อมูล
    patch = request.get_json() or {}
    ok = _project_model.update(oid, patch)
    
    # ✨ ปรับ response ให้ชัดเจนขึ้น
    if ok:
        return jsonify(ok=True, message="updated successfully"), 200
    else:
        return jsonify(ok=False, error="invalid data or no changes"), 400


# ============================================================
# DELETE - ลบโปรเจกต์
# ============================================================

@project_bp.delete("/projects/<pid>")
@login_required
def delete_project(pid):
    """
    ลบโปรเจกต์ (soft delete - เจ้าของเท่านั้น)
    
    Method: DELETE
    Endpoint: /projects/<pid>
    Auth: ต้อง login และเป็นเจ้าของ
    
    Returns:
        200: {"ok": true}
        400: {"error": "invalid id"}
        403: {"error": "forbidden"}
        404: {"error": "not found"} หรือ {"ok": false}
    """
    _ensure_init()
    user = session.get("user")
    
    # แปลง pid เป็น ObjectId
    oid = _to_objid(pid)
    if oid is None:
        return jsonify(error="invalid id"), 400
    
    # ตรวจสอบว่าโปรเจกต์มีอยู่จริง
    doc = _project_model.get(oid)
    if not doc:
        return jsonify(error="not found"), 404
    
    # ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของ
    if str(user.get("_id")) != str(doc.get("owner_id")):
        return jsonify(error="forbidden"), 403
    
    # ลบโปรเจกต์ (soft delete)
    ok = _project_model.soft_delete(oid)
    
    if ok:
        return jsonify(ok=True, message="deleted successfully"), 200
    else:
        return jsonify(ok=False, error="failed to delete"), 404


# ============================================================
# LIST - ดึงรายการโปรเจกต์
# ============================================================

@project_bp.get("/projects")
def list_public_projects():
    """
    ดึงรายการโปรเจกต์สาธารณะ
    
    Method: GET
    Endpoint: /projects?q=search&status=active
    Auth: ไม่ต้อง login
    
    Query Parameters:
        q: คำค้นหา (ค้นใน title)
        status: กรองตาม status (draft/active/archived)
    
    Returns:
        200: [
            {
                "_id": "...",
                "title": "...",
                "visibility": "public",
                "status": "active",
                "updated_at": "2025-10-27T...",
                "metrics": {"views": 10, "likes": 5}
            },
            ...
        ]
    """
    _ensure_init()
    q = request.args.get("q")
    status = request.args.get("status")
    
    rows = _project_model.list_public(q, status)
    
    return jsonify([{
        "_id": str(p["_id"]),
        "title": p.get("title"),
        "visibility": p.get("visibility"),
        "status": p.get("status"),
        "updated_at": p.get("updated_at").isoformat() if isinstance(p.get("updated_at"), datetime) else p.get("updated_at"),
        "metrics": p.get("metrics", {})
    } for p in rows]), 200


@project_bp.get("/projects/me")  # ✨ ปัญหา: endpoint ทับกับ /projects/<pid>
@login_required
def list_my_projects():
    """
    ดึงรายการโปรเจกต์ของผู้ใช้ที่ login
    
    Method: GET
    Endpoint: /projects/me?q=search
    Auth: ต้อง login
    
    Query Parameters:
        q: คำค้นหา (ค้นใน title)
    
    Returns:
        200: [...รายการโปรเจกต์...]
    """
    _ensure_init()
    user = session.get("user")
    
    # แปลง user_id เป็น ObjectId
    oid = _to_objid(user.get("_id")) or user.get("_id")
    q = request.args.get("q")
    
    rows = _project_model.list_owned(oid, q)
    
    return jsonify([{
        "_id": str(p["_id"]),
        "title": p.get("title"),
        "visibility": p.get("visibility"),
        "status": p.get("status"),
        "updated_at": p.get("updated_at").isoformat() if isinstance(p.get("updated_at"), datetime) else p.get("updated_at"),
        "metrics": p.get("metrics", {})
    } for p in rows]), 200