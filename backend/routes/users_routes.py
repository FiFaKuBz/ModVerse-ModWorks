from flask import Blueprint, session, jsonify, request
from bson import ObjectId
from bson.errors import InvalidId
from ..auth.decorators import role_required
from typing import List, Optional

user_bp = Blueprint("user", __name__)

# จะถูก inject จาก app.py
user_model = None
project_model = None
report_model = None

def init_user_routes(model, p_model, r_model):
    global user_model, project_model, report_model
    user_model = model
    project_model = p_model
    report_model = r_model

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
        user_doc["likes"] = total_likes # Map to 'likes' for frontend consistency
    
    # [NEW] Convert lists to counts for Frontend display
    user_doc["followers"] = len(user_doc.get("followers", []))
    user_doc["following"] = len(user_doc.get("following", []))
        
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
        
        # Ensure updated user has counts correctly
        updated_user["followers"] = len(updated_user.get("followers", []))
        updated_user["following"] = len(updated_user.get("following", []))
        
        return jsonify(updated_user), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@user_bp.route("/<username>", methods=["GET"])
def get_public_profile(username):
    """
    ดึงข้อมูลโปรไฟล์สาธารณะของผู้ใช้ (Public Profile)
    ใช้สำหรับดูโปรไฟล์คนอื่น หรือค้นหาเพื่อเพิ่ม Co-author
    """
    # ค้นหา User จาก Model
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
            user["likes"] = total_likes

    # [NEW] Check isFollowing status and Calculate counts
    is_following = False
    is_blocked = False  # ✅ เพิ่มตัวแปรนี้
    
    if "user" in session:
        current_user_id = session["user"]["id"] # session stores ID as string
        
        # Check Following
        followers_list = user.get("followers", [])
        if current_user_id in followers_list:
            is_following = True
            
        # ✅ เช็ค Block Status
        # (เรียกใช้ฟังก์ชัน is_blocked ที่เราเพิ่งเพิ่มใน Model)
        try:
            is_blocked = user_model.is_blocked(ObjectId(current_user_id), str(user["_id"]))
        except Exception as e:
            print(f"Error checking block status: {e}")
            is_blocked = False

    user["followers"] = len(user.get("followers", []))
    user["following"] = len(user.get("following", []))
    user["isFollowing"] = is_following
    user["isBlocked"] = is_blocked # ✅ ส่งค่านี้กลับไปให้ Frontend

    return jsonify(user), 200

# --- NEW: ADMIN-ONLY ROUTE FOR RBAC DEMO ---
@user_bp.route("/admin_panel")
@role_required(allowed_roles="admin") # <<< RBAC ENFORCEMENT
def admin_panel():
    """Admin-only resource (requires role: 'admin')"""
    return jsonify(message=f"Welcome, Admin. Access Granted to: {session['user']['name']}"), 200


@user_bp.route("/<username>/follow", methods=["POST"])
@role_required()
def follow_user_route(username):
    try:
        # Who is performing the action
        me_id = ObjectId(session["user"]["id"])
        
        # Who is the target
        target_user = user_model.get_user_by_username(username)
        if not target_user:
            return jsonify({"error": "User not found"}), 404
            
        target_id = ObjectId(target_user["_id"])
        
        success = user_model.follow_user(me_id, target_id)
        return jsonify({"success": success}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/<username>/unfollow", methods=["POST"])
@role_required()
def unfollow_user_route(username):
    try:
        me_id = ObjectId(session["user"]["id"])
        target_user = user_model.get_user_by_username(username)
        if not target_user:
            return jsonify({"error": "User not found"}), 404
            
        target_id = ObjectId(target_user["_id"])
        
        success = user_model.unfollow_user(me_id, target_id)
        return jsonify({"success": success}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ✅ เปลี่ยนจากรับ <username> เป็น <user_id>
@user_bp.route("/block/<user_id>", methods=["POST"])
@role_required()
def block_user_route(user_id):
    try:
        me_id = ObjectId(session["user"]["id"])
        
        # แปลง user_id จาก URL (String) เป็น ObjectId ตรงๆ
        target_oid = ObjectId(user_id)
        
        success = user_model.block_user(me_id, target_oid)
        return jsonify({"success": success, "isBlocked": True}), 200
    except InvalidId:
        return jsonify({"error": "Invalid user ID format"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ เปลี่ยนจากรับ <username> เป็น <user_id>
@user_bp.route("/unblock/<user_id>", methods=["POST"])
@role_required()
def unblock_user_route(user_id):
    try:
        me_id = ObjectId(session["user"]["id"])
        
        # แปลง user_id จาก URL (String) เป็น ObjectId ตรงๆ
        target_oid = ObjectId(user_id)
            
        success = user_model.unblock_user(me_id, target_oid)
        return jsonify({"success": success, "isBlocked": False}), 200
    except InvalidId:
        return jsonify({"error": "Invalid user ID format"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/<username>/report", methods=["POST"])
@role_required()
def report_user_route(username):
    try:
        me_id = session["user"]["id"]
        target_user = user_model.get_user_by_username(username)
        if not target_user:
            return jsonify({"error": "User not found"}), 404
            
        data = request.get_json()
        reason = data.get("reason")
        description = data.get("description", "")
        
        if not reason:
             return jsonify({"error": "Reason is required"}), 400

        # ใช้ report_model ที่ inject เข้ามา
        report_id = report_model.create_report(
            reporter_id=me_id,
            target_id=target_user["_id"],
            reason=reason,
            description=description
        )
        
        return jsonify({"success": True, "reportId": str(report_id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500