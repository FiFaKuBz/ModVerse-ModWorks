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

@user_bp.route("/profile/update", methods=["PUT"])
@role_required()
def update_profile():
    try:
        user_id = ObjectId(session["user"]["id"])
        data = request.get_json()
        
        update_data = {}
        # ✅ EDIT: ใช้ชื่อ field ตาม Frontend ได้เลย (avatar, about)
        # Model เรารองรับชื่อ avatar และ about แล้ว
        allowed_fields = ["name", "username", "about", "avatar", "tags", "twoFactorEnabled"]
        
        for field in allowed_fields:
            if field in data:
                # จัดการ Tags นิดหน่อยเหมือนเดิม
                if field == "tags":
                    update_data[field] = list(set(tag.strip().lower() for tag in data[field] if tag.strip()))
                else:
                    update_data[field] = data[field]
        
        if not update_data:
            return jsonify({"ok": False, "error": "No valid fields"}), 400
        
        # เรียกใช้ update_user ใน Model
        success = user_model.update_user(user_id, update_data)
        
        if success:
            # ดึงข้อมูลล่าสุดมาส่งกลับ
            updated_user = user_model.get_user_by_id(user_id)
            
            # ไม่ต้องแปลง Key แล้ว ส่ง updated_user กลับไปได้เลย (Model จัดการ _id เป็น string ให้แล้ว)
            return jsonify({"ok": True, "user": updated_user})
            
        return jsonify({"ok": False, "error": "Update failed"}), 500
        
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
        
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
        user["_id"] = str(user["_id"])
        

    return jsonify(user), 200

# --- NEW: ADMIN-ONLY ROUTE FOR RBAC DEMO ---
@user_bp.route("/admin_panel")
@role_required(allowed_roles="admin") # <<< RBAC ENFORCEMENT
def admin_panel():
    """Admin-only resource (requires role: 'admin')"""
    return jsonify(message=f"Welcome, Admin. Access Granted to: {session['user']['name']}"), 200
