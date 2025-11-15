from flask import Blueprint, session, jsonify, request
from bson import ObjectId
from bson.errors import InvalidId
from ..auth.decorators import role_required
from typing import List, Optional

user_bp = Blueprint("user", __name__)

# จะถูก inject จาก app.py
user_model = None

def init_user_routes(model):
    """เตรียมค่าที่ต้องใช้ใน routes"""
    global user_model
    user_model = model

@user_bp.route("/profile")
@role_required()
def whoami():
    """แสดงข้อมูลผู้ใช้ที่ล็อกอินอยู่"""
    u = session.get("user")
    if not u:
        return jsonify(auth=False), 401
    
    try:
        oid = ObjectId(u["id"])
    except (InvalidId, KeyError):
        return jsonify(auth=False), 401
    
    user_doc = user_model.get_user_by_id(oid)
    return jsonify(auth=True, user=user_doc)

@user_bp.route("/dashboard")
@role_required()
def dashboard():
    """หน้า dashboard สำหรับผู้ใช้ที่ล็อกอินแล้ว"""
    return f"ยินดีต้อนรับ {session['user']['name']}!"

@user_bp.route("/api/profile/update", methods=["PUT"])
@role_required()
def update_profile():
    """อัพเดทข้อมูลโปรไฟล์ของผู้ใช้ รวมถึง tags"""
    try:
        user_id = ObjectId(session["user"]["id"])
        data = request.get_json()
        
        # รับ tags จาก request (ถ้ามี)
        tags: Optional[List[str]] = data.get("tags")
        if tags is not None:
            # ทำความสะอาด tags
            tags = list(set(tag.strip().lower() for tag in tags if tag.strip()))
        
        # สร้าง update document
        update_data = {}
        allowed_fields = ["name", "bio", "picture", "tags"]
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return jsonify({
                "ok": False,
                "error": {
                    "code": "no_fields",
                    "message": "No valid fields to update"
                }
            }), 400
        
        # อัพเดทในฐานข้อมูล
        success = user_model.update_user(user_id, update_data)
        if not success:
            return jsonify({
                "ok": False,
                "error": {
                    "code": "update_failed",
                    "message": "Failed to update profile"
                }
            }), 500
        
        # ดึงข้อมูลที่อัพเดทแล้วมาตอบกลับ
        updated_user = user_model.get_user_by_id(user_id)
        return jsonify({
            "ok": True,
            "user": updated_user
        })
        
    except Exception as e:
        return jsonify({
            "ok": False,
            "error": {
                "code": "update_error",
                "message": str(e)
            }
        }), 500
# --- NEW: ADMIN-ONLY ROUTE FOR RBAC DEMO ---
@user_bp.route("/admin_panel")
@role_required(allowed_roles="admin") # <<< RBAC ENFORCEMENT
def admin_panel():
    """Admin-only resource (requires role: 'admin')"""
    return jsonify(message=f"Welcome, Admin. Access Granted to: {session['user']['name']}"), 200
