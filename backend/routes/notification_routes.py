from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from ..auth.decorators import login_required

notification_bp = Blueprint("notification", __name__)

notification_model = None

def init_notification_routes(n_model):
    global notification_model
    notification_model = n_model

@notification_bp.route("/", methods=["GET"])
@login_required
def get_notifications():
    try:
        user_id = session["user"]["id"]
        limit = int(request.args.get("limit", 20))
        skip = int(request.args.get("skip", 0))
        
        notifications = notification_model.get_user_notifications(user_id, limit, skip)
        unread_count = notification_model.get_unread_count(user_id)
        
        return jsonify({
            "success": True,
            "notifications": notifications,
            "unreadCount": unread_count
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notification_bp.route("/<notification_id>/read", methods=["PATCH"])
@login_required
def mark_read(notification_id):
    try:
        user_id = session["user"]["id"]
        success = notification_model.mark_as_read(notification_id, user_id)
        return jsonify({"success": success}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notification_bp.route("/read-all", methods=["PATCH"])
@login_required
def mark_all_read():
    try:
        user_id = session["user"]["id"]
        count = notification_model.mark_all_as_read(user_id)
        return jsonify({"success": True, "count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
