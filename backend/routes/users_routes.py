from flask import Blueprint, session, jsonify, request
from bson import ObjectId
from bson.errors import InvalidId
from ..auth.decorators import role_required
from typing import List, Optional
from datetime import datetime, timezone

user_bp = Blueprint("user", __name__)

# Will be injected from app.py
user_model = None
project_model = None
report_model = None
notification_model = None

def init_user_routes(model, p_model, r_model, n_model):
    global user_model, project_model, report_model, notification_model
    user_model = model
    project_model = p_model
    report_model = r_model
    notification_model = n_model

@user_bp.route("/profile")
@role_required()
def whoami():
    """Show logged-in user info"""
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
        
    # Calculate total likes
    if project_model:
        total_likes = project_model.get_total_likes(oid)
        user_doc["total_likes"] = total_likes
        user_doc["likes"] = total_likes # Map to 'likes' for frontend consistency
    
    # Convert lists to counts for Frontend display
    user_doc["followers"] = len(user_doc.get("followers", []))
    user_doc["following"] = len(user_doc.get("following", []))
        
    return jsonify(user_doc), 200

@user_bp.route("/dashboard")
@role_required()
def dashboard():
    """Dashboard for logged-in users"""
    return f"Welcome {session['user']['name']}!"

@user_bp.route("/profile/saved", methods=["GET"])
@role_required()
def get_saved_projects():
    try:
        user_id = ObjectId(session["user"]["id"])
        user_doc = user_model.get_user_by_id(user_id)
        saved_ids = user_doc.get("saved_projects", []) if user_doc else []
        if not saved_ids:
            return jsonify({"success": True, "projects": []}), 200

        oid_list = []
        for pid in saved_ids:
            try:
                oid_list.append(ObjectId(pid))
            except InvalidId:
                continue

        projects = project_model.list_by_ids(oid_list, viewer_id=user_id)
        for p in projects:
            p["_id"] = str(p["_id"])
            p["owner_id"] = str(p["owner_id"])
            if "created_at" in p and p["created_at"]:
                p["created_at"] = p["created_at"].isoformat()
            if "updated_at" in p and p["updated_at"]:
                p["updated_at"] = p["updated_at"].isoformat()

        return jsonify({"success": True, "projects": projects}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/profile/update", methods=["PATCH", "PUT"])
@role_required()
def update_profile():
    try:
        user_id = ObjectId(session["user"]["id"])
        data = request.get_json() or {}

        update_data = {}
        # Use frontend-friendly field names
        allowed_fields = ["name", "username", "about", "avatar", "tags", "twoFactorEnabled", "showSavedPublicly"]

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
    Get public profile by username
    """
    # Find User from Model
    user = user_model.get_user_by_username(username)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Convert ObjectId to String
    if "_id" in user:
        user_oid = ObjectId(user["_id"])
        user["_id"] = str(user["_id"])
        
        if project_model:
            total_likes = project_model.get_total_likes(user_oid)
            user["total_likes"] = total_likes
            user["likes"] = total_likes

    # Check isFollowing status and Calculate counts
    is_following = False
    is_blocked = False
    
    if "user" in session:
        current_user_id = session["user"]["id"] # session stores ID as string
        
        # Check Following
        followers_list = user.get("followers", [])
        if current_user_id in followers_list:
            is_following = True
            
        # Check Block Status
        try:
            is_blocked = user_model.is_blocked(ObjectId(current_user_id), str(user["_id"]))
        except Exception as e:
            print(f"Error checking block status: {e}")
            is_blocked = False

    user["followers"] = len(user.get("followers", []))
    user["following"] = len(user.get("following", []))
    user["isFollowing"] = is_following
    user["isBlocked"] = is_blocked

    return jsonify(user), 200

# --- ADMIN-ONLY ROUTE FOR RBAC DEMO ---
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
        
        if success and notification_model:
            notification_model.create_notification(
                recipient_id=target_id,
                sender_id=me_id,
                type="follow",
                message="started following you",
                project_id=None
            )
            
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
    
@user_bp.route("/block/<user_id>", methods=["POST"])
@role_required()
def block_user_route(user_id):
    try:
        me_id = ObjectId(session["user"]["id"])
        
        # Convert user_id from URL (String) to ObjectId
        target_oid = ObjectId(user_id)
        
        success = user_model.block_user(me_id, target_oid)
        return jsonify({"success": success, "isBlocked": True}), 200
    except InvalidId:
        return jsonify({"error": "Invalid user ID format"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/unblock/<user_id>", methods=["POST"])
@role_required()
def unblock_user_route(user_id):
    try:
        me_id = ObjectId(session["user"]["id"])
        
        # Convert user_id from URL (String) to ObjectId
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

        # Use injected report_model; fallback to log
        if report_model:
            report_id = report_model.create_report(
                reporter_id=me_id,
                target_id=target_user["_id"],
                reason=reason,
                description=description
            )
        else:
            print(f"[REPORT] reporter={me_id} target={target_user['_id']} reason={reason} desc={description}")
            report_id = None
        
        return jsonify({"success": True, "reportId": str(report_id) if report_id else None}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- Notifications (stubbed storage) ----------------
@user_bp.route("/notifications/", methods=["GET"])
@role_required()
def list_notifications():
    try:
        user_id = session["user"]["id"]
        col = user_model.users.database["notifications"]
        docs = list(col.find({"receiver_id": user_id}).sort("created_at", -1))
        for d in docs:
            d["_id"] = str(d["_id"])
            if isinstance(d.get("created_at"), datetime):
                d["created_at"] = d["created_at"].isoformat()
        unread = col.count_documents({"receiver_id": user_id, "is_read": {"$ne": True}})
        return jsonify({"success": True, "notifications": docs, "unreadCount": unread}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/notifications/<nid>/read", methods=["PATCH"])
@role_required()
def mark_notification_read(nid):
    try:
        user_id = session["user"]["id"]
        col = user_model.users.database["notifications"]
        col.update_one({"_id": ObjectId(nid), "receiver_id": user_id}, {"$set": {"is_read": True}})
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/notifications/read-all", methods=["PATCH"])
@role_required()
def mark_all_notifications_read():
    try:
        user_id = session["user"]["id"]
        col = user_model.users.database["notifications"]
        col.update_many({"receiver_id": user_id, "is_read": {"$ne": True}}, {"$set": {"is_read": True}})
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
