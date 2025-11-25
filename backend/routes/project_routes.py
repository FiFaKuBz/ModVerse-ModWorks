# backend/routes/project_routes.py
from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from bson.errors import InvalidId
from ..auth.decorators import login_required
import uuid
from datetime import datetime, timezone

project_bp = Blueprint("project", __name__)

project_model = None
# backend/routes/project_routes.py
from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from bson.errors import InvalidId
from ..auth.decorators import login_required
import uuid
from datetime import datetime, timezone

project_bp = Blueprint("project", __name__)

project_model = None
user_model = None
tag_model = None
tag_model = None
interaction_model = None
notification_model = None

def init_project_routes(p_model, t_model, u_model, i_model, n_model):
    global project_model, tag_model, user_model, interaction_model, notification_model
    project_model = p_model
    tag_model = t_model
    user_model = u_model
    interaction_model = i_model
    notification_model = n_model

# ✅ แก้ไขคำผิดจาก categorys เป็น categories
@project_bp.route("/categories", methods=["GET"])
def get_all_tags():
    """
    ดึงรายชื่อ Tags/Categories ทั้งหมด
    """
    try:
        if not tag_model:
            return jsonify({"error": "Tag model not initialized"}), 500 
        tags = tag_model.list_all()
        return jsonify({"success": True, "tags": tags}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== CREATE ====================
@project_bp.route("/", methods=["POST"])
@login_required
def create_project():
    print("\n" + "="*50)
    print("CREATE PROJECT REQUEST RECEIVED")
    
    try:
        if "user" not in session:
            return jsonify({"error": "Not authenticated"}), 401
        user_id = ObjectId(session["user"]["id"])
        data = request.get_json()
        if "user" in session:
            data["contributor"] = session["user"].get("username") or session["user"].get("name")

        if not data:
            return jsonify({"error": "No data provided"}), 400
        if not data.get("title"):
            return jsonify({"error": "Title is required"}), 400
        
        # สร้างโปรเจกต์
        project_id = project_model.create(user_id, data)
        
        print(f"✅ Project created successfully: {project_id}")
        
        return jsonify({
            "success": True,
            "id": str(project_id),
            "message": "Project created successfully"
        }), 201
        
    except InvalidId:
        return jsonify({"error": "Invalid user ID"}), 400
    except Exception as e:
        print(f"❌ Error creating project: {e}")
        return jsonify({"error": str(e)}), 500

# ==================== READ ====================
@project_bp.route("/", methods=["GET"])
@login_required
def list_my_projects():
    try:
        user_id = ObjectId(session["user"]["id"])
        search_query = request.args.get("q")
        
        projects = project_model.list_owned(user_id, search_query)
        
        for p in projects:
            p["_id"] = str(p["_id"])
            p["owner_id"] = str(p["owner_id"])
            p["isOwner"] = True
            if "created_at" in p and p["created_at"]:
                p["created_at"] = p["created_at"].isoformat()
            if "updated_at" in p and p["updated_at"]:
                p["updated_at"] = p["updated_at"].isoformat()
        
        return jsonify({
            "success": True,
            "count": len(projects),
            "projects": projects
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@project_bp.route("/public", methods=["GET"])
def list_public_projects():
    try:
        search_query = request.args.get("q")
        status_filter = request.args.get("status")
        
        projects = project_model.list_public(search_query, status_filter)
        session_user_id = session.get("user", {}).get("id")
        # include private projects owned by this user
        if session_user_id:
            try:
                owned = project_model.list_owned(ObjectId(session_user_id), search_query)
            except InvalidId:
                owned = []
            else:
                ids = {str(p.get("_id")) for p in projects}
                for p in owned:
                    if str(p.get("_id")) not in ids:
                        projects.append(p)
                        ids.add(str(p.get("_id")))

        for p in projects:
            p["_id"] = str(p["_id"])
            p["owner_id"] = str(p["owner_id"])
            p["isOwner"] = bool(session_user_id and p["owner_id"] == session_user_id)
            if "created_at" in p and p["created_at"]:
                p["created_at"] = p["created_at"].isoformat()
            if "updated_at" in p and p["updated_at"]:
                p["updated_at"] = p["updated_at"].isoformat()
        
        return jsonify({
            "success": True,
            "count": len(projects),
            "projects": projects
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@project_bp.route("/<project_id>", methods=["GET"])
def get_project(project_id):
    try:
        pid = ObjectId(project_id)
        project = project_model.get(pid)
        
        if not project:
            return jsonify({"error": "Project not found"}), 404
        
        # ✅ ตรวจสอบสิทธิ์: ถ้าเป็น private ต้องเป็นเจ้าของเท่านั้น
        if project.get("visibility") == "private":
            if "user" not in session or str(project["owner_id"]) != session["user"]["id"]:
                return jsonify({"error": "Access denied"}), 403
        
        
        project_model.inc_metric(pid, "views")
        
        project["_id"] = str(project["_id"])
        project["owner_id"] = str(project["owner_id"])
        project["isOwner"] = bool("user" in session and str(project["owner_id"]) == session["user"]["id"])
        if "created_at" in project and project["created_at"]:
            project["created_at"] = project["created_at"].isoformat()
        if "updated_at" in project and project["updated_at"]:
            project["updated_at"] = project["updated_at"].isoformat()
        
        # Get user interaction status
        user_id = ObjectId(session["user"]["id"]) if "user" in session else None
        interactions = interaction_model.get_user_interactions(user_id, pid)
        project.update(interactions)
        
        return jsonify(project), 200
    
    except InvalidId:
        return jsonify({"error": "Invalid project ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== UPDATE ====================
@project_bp.route("/<project_id>", methods=["PUT", "PATCH"])
@login_required
def update_project(project_id):
    try:
        pid = ObjectId(project_id)
        user_id = session["user"]["id"]
        
        project = project_model.get(pid)
        if not project:
            return jsonify({"error": "Project not found"}), 404
        
        if str(project["owner_id"]) != user_id:
            return jsonify({"error": "Access denied"}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        success = project_model.update(pid, data)
        
        if not success:
            return jsonify({"error": "Update failed"}), 400
        
        return jsonify({
            "success": True,
            "message": "Project updated successfully"
        }), 200
    except InvalidId:
        return jsonify({"error": "Invalid project ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== DELETE ====================
@project_bp.route("/<project_id>", methods=["DELETE"])
@login_required
def delete_project(project_id):
    try:
        pid = ObjectId(project_id)
        user_id = session["user"]["id"]
        
        project = project_model.get(pid)
        if not project:
            return jsonify({"error": "Project not found"}), 404
        
        if str(project["owner_id"]) != user_id:
            return jsonify({"error": "Access denied"}), 403
        
        success = project_model.soft_delete(pid)
        
        if not success:
            return jsonify({"error": "Delete failed"}), 400
        
        return jsonify({
            "success": True,
            "message": "Project deleted successfully"
        }), 200
    except InvalidId:
        return jsonify({"error": "Invalid project ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== INTERACTIONS ====================
@project_bp.route("/<project_id>/like", methods=["POST"])
@login_required
def like_project(project_id):
    try:
        pid = ObjectId(project_id)
        user_id = ObjectId(session["user"]["id"])
        result = interaction_model.toggle_like(user_id, pid)
        
        # Notify owner if liked
        if result.get("isLiked"):
            project = project_model.get(pid)
            if project and str(project["owner_id"]) != str(user_id):
                notification_model.create_notification(
                    recipient_id=project["owner_id"],
                    sender_id=user_id,
                    type="like",
                    message=f"liked your project: {project.get('title')}",
                    project_id=pid
                )
        
        return jsonify({"success": True, "data": result}), 200
    except InvalidId:
        return jsonify({"error": "Invalid project ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@project_bp.route("/<project_id>/dislike", methods=["POST"])
@login_required
def dislike_project(project_id):
    try:
        pid = ObjectId(project_id)
        user_id = ObjectId(session["user"]["id"])
        result = interaction_model.toggle_dislike(user_id, pid)
        return jsonify({"success": True, "data": result}), 200
    except InvalidId:
        return jsonify({"error": "Invalid project ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@project_bp.route("/<project_id>/save", methods=["POST"])
@login_required
def save_project(project_id):
    try:
        pid = ObjectId(project_id)
        user_id = ObjectId(session["user"]["id"])
        result = interaction_model.toggle_save(user_id, pid)
        return jsonify({"success": True, "data": result}), 200
    except InvalidId:
        return jsonify({"error": "Invalid project ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ==================== COMMENTS ====================
@project_bp.route("/<project_id>/comments", methods=["GET"])
def get_project_comments(project_id):
    try:
        pid = ObjectId(project_id)
        # Check if project_model is actually loaded
        if not project_model:
             return jsonify({"error": "Project model not initialized"}), 500

        comments = project_model.get_comments(pid)
        return jsonify({"success": True, "comments": comments}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@project_bp.route("/<project_id>/comments", methods=["POST"])
@login_required
def add_comment(project_id):
    try:
        # Check if user_model is loaded (This is where your error happened)
        if not user_model:
            print("❌ Error: user_model is None in project_routes")
            return jsonify({"error": "Internal Server Error: User model not loaded"}), 500

        project_doc = project_model.get(ObjectId(project_id))
        if not project_doc:
            return jsonify({"error": "Project not found"}), 404
        if project_doc.get("allow_comments") is False:
            return jsonify({"error": "Comments disabled"}), 403

        pid = ObjectId(project_id)
        data = request.get_json()
        text = data.get("text")
        
        if not text:
            return jsonify({"error": "Comment text is required"}), 400

        # Get current user info to embed in the comment
        # Now user_model is properly initialized!
        user = user_model.get_user_by_id(ObjectId(session["user"]["id"]))
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        new_comment = project_model.add_comment(pid, user, text)
        
        if new_comment:
            # Notify owner
            project = project_model.get(pid)
            if project and str(project["owner_id"]) != str(session["user"]["id"]):
                notification_model.create_notification(
                    recipient_id=project["owner_id"],
                    sender_id=session["user"]["id"],
                    type="comment",
                    message=f"commented on your project: {project.get('title')}",
                    project_id=pid
                )
            
            return jsonify({"success": True, "comment": new_comment}), 201
        else:
            return jsonify({"error": "Failed to add comment"}), 400
            
    except Exception as e:
        print(f"❌ Add comment error: {e}")
        return jsonify({"error": str(e)}), 500
