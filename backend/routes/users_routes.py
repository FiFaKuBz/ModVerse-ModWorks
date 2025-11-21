from flask import Blueprint, session, jsonify, request
from bson import ObjectId
from bson.errors import InvalidId
from ..auth.decorators import role_required
from typing import List, Optional

user_bp = Blueprint("user", __name__)

# จะถูก inject จาก app.py
user_model = None
project_model = None

def init_user_routes(model, p_model):
    """เตรียมค่าที่ต้องใช้ใน routes"""
    global user_model, project_model
    user_model = model
    project_model = p_model

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
    if not user_doc:
        return jsonify(auth=False), 404
        
    # [NEW] Calculate total likes
    if project_model:
        total_likes = project_model.get_total_likes(oid)
        user_doc["total_likes"] = total_likes
        
    return jsonify(user_doc), 200

@user_bp.route("/dashboard")
@role_required()
def dashboard():
    """หน้า dashboard สำหรับผู้ใช้ที่ล็อกอินแล้ว"""
    return f"ยินดีต้อนรับ {session['user']['name']}!"

@user_bp.route("/profile/update", methods=["PATCH", "PUT"])
@role_required()
def update_profile():
    try:
        user_id = ObjectId(session["user"]["id"])
        data = request.get_json() or {}

        update_data = {}
        # Use frontend-friendly field names
        allowed_fields = ["name", "username", "about", "avatar", "tags", "twoFactorEnabled"]

        for field in allowed_fields:
            if field in data:
                if field == "tags":
                    update_data[field] = list(
                        set(tag.strip().lower() for tag in data[field] if tag and tag.strip())
                    )
                else:
                    update_data[field] = data[field]

        if not update_data:
            return jsonify({"error": "No valid fields"}), 400

        success = user_model.update_user(user_id, update_data)
        if not success:
            return jsonify({"error": "Update failed"}), 500

        updated_user = user_model.get_user_by_id(user_id)
        return jsonify(updated_user), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@user_bp.route("/<username>", methods=["GET"])
def get_public_profile(username):
    """
    ดึงข้อมูลโปรไฟล์สาธารณะของผู้ใช้ (Public Profile)
    ใช้สำหรับดูโปรไฟล์คนอื่น หรือค้นหาเพื่อเพิ่ม Co-author
    """
    # ค้นหา User จาก Model ที่เราเพิ่งเพิ่ม
    user = user_model.get_user_by_username(username)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # แปลง ObjectId เป็น String ก่อนส่งกลับ
    if "_id" in user:
        user_oid = ObjectId(user["_id"])
        user["_id"] = str(user["_id"])
        
        if project_model:
            total_likes = project_model.get_total_likes(user_oid)
            user["total_likes"] = total_likes

    return jsonify(user), 200

# --- NEW: ADMIN-ONLY ROUTE FOR RBAC DEMO ---
@user_bp.route("/admin_panel")
@role_required(allowed_roles="admin") # <<< RBAC ENFORCEMENT
def admin_panel():
    """Admin-only resource (requires role: 'admin')"""
    return jsonify(message=f"Welcome, Admin. Access Granted to: {session['user']['name']}"), 200
