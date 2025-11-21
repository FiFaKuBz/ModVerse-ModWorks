# backend/routes/project_routes.py
from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from bson.errors import InvalidId
from ..auth.decorators import login_required

project_bp = Blueprint("project", __name__)

project_model = None
tag_model = None

def init_project_routes(p_model, t_model):
    global project_model, tag_model
    project_model = p_model
    tag_model = t_model

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
        
        for p in projects:
            p["_id"] = str(p["_id"])
            p["owner_id"] = str(p["owner_id"])
        
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

# ==================== LIKE ====================
@project_bp.route("/<project_id>/like", methods=["POST"])
@login_required
def like_project(project_id):
    try:
        pid = ObjectId(project_id)
        project = project_model.get(pid)
        
        if not project:
            return jsonify({"error": "Project not found"}), 404
        
        project_model.inc_metric(pid, "likes")
        
        return jsonify({
            "success": True,
            "message": "Project liked"
        }), 200
    except InvalidId:
        return jsonify({"error": "Invalid project ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500