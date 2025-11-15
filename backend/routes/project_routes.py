from flask import Blueprint, request, jsonify, session
from bson import ObjectId
from bson.errors import InvalidId
from ..auth.decorators import login_required

project_bp = Blueprint("project", __name__)

# จะถูก inject จาก app.py
project_model = None

def init_project_routes(model):
    """เตรียมค่าที่ต้องใช้ใน routes"""
    global project_model
    project_model = model

# ==================== CREATE ====================
@project_bp.route("/projects", methods=["POST"])
@login_required
def create_project():
    """
    สร้างโปรเจคใหม่
    """
    print("\n" + "="*50)
    print("CREATE PROJECT REQUEST RECEIVED")
    print("="*50)
    
    try:
        # Debug 1: ตรวจสอบ session
        print("1. Session data:", dict(session))
        print("2. User in session:", session.get("user"))
        
        if "user" not in session:
            print("❌ ERROR: No user in session!")
            return jsonify({"error": "Not authenticated"}), 401
        
        # Debug 2: ตรวจสอบ user_id
        user_id_str = session["user"]["id"]
        print("3. User ID (string):", user_id_str)
        
        try:
            user_id = ObjectId(user_id_str)
            print("4. User ID (ObjectId):", user_id)
        except Exception as e:
            print("❌ ERROR converting to ObjectId:", e)
            return jsonify({"error": "Invalid user ID"}), 400
        
        # Debug 3: ตรวจสอบ request data
        data = request.get_json()
        print("5. Request data:", data)
        print("6. Content-Type:", request.headers.get("Content-Type"))
        
        if not data:
            print("❌ ERROR: No JSON data received!")
            return jsonify({"error": "No data provided"}), 400
        
        if not data.get("title"):
            print("❌ ERROR: No title in data!")
            return jsonify({"error": "Title is required"}), 400
        
        # Debug 4: สร้างโปรเจค
        print("7. Creating project...")
        project_id = project_model.create(user_id, data)
        print("✅ Project created with ID:", project_id)
        
        # Debug 5: ตรวจสอบว่าข้อมูลเข้า DB จริง
        created_project = project_model.get(project_id)
        print("8. Verify project in DB:", created_project is not None)
        
        print("="*50)
        print("SUCCESS!")
        print("="*50 + "\n")
        
        return jsonify({
            "success": True,
            "project_id": str(project_id),
            "message": "Project created successfully"
        }), 201
        
    except InvalidId:
        return jsonify({"error": "Invalid user ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== READ ====================
@project_bp.route("/projects", methods=["GET"])
@login_required
def list_my_projects():
    """
    ดูรายการโปรเจคของตัวเอง
    
    Query Parameters:
    - q: ค้นหาตามชื่อโปรเจค (optional)
    
    Example: /projects?q=my%20project
    """
    try:
        user_id = ObjectId(session["user"]["id"])
        search_query = request.args.get("q")
        
        projects = project_model.list_owned(user_id, search_query)
        
        # แปลง ObjectId เป็น string สำหรับ JSON
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

@project_bp.route("/projects/public", methods=["GET"])
def list_public_projects():
    """
    ดูรายการโปรเจคสาธารณะ (ไม่ต้องล็อกอิน)
    
    Query Parameters:
    - q: ค้นหาตามชื่อ (optional)
    - status: กรองตามสถานะ (optional)
    
    Example: /projects/public?status=completed&q=research
    """
    try:
        search_query = request.args.get("q")
        status_filter = request.args.get("status")
        
        projects = project_model.list_public(search_query, status_filter)
        
        # แปลง ObjectId เป็น string
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

@project_bp.route("/projects/<project_id>", methods=["GET"])
def get_project(project_id):
    """
    ดูรายละเอียดโปรเจคเดียว
    
    - ถ้าเป็นโปรเจคสาธารณะ: ใครก็ดูได้
    - ถ้าเป็นโปรเจคส่วนตัว: เฉพาะเจ้าของเท่านั้น
    """
    try:
        pid = ObjectId(project_id)
        project = project_model.get(pid)
        
        if not project:
            return jsonify({"error": "Project not found"}), 404
        
        # ตรวจสอบสิทธิ์การเข้าถึง
        if project["visibility"] == "private":
            # ต้องเป็นเจ้าของโปรเจค
            if "user" not in session or str(project["owner_id"]) != session["user"]["id"]:
                return jsonify({"error": "Access denied"}), 403
        
        # เพิ่มจำนวนการดู
        project_model.inc_metric(pid, "views")
        
        # แปลง ObjectId เป็น string
        project["_id"] = str(project["_id"])
        project["owner_id"] = str(project["owner_id"])
        
        return jsonify({
            "success": True,
            "project": project
        }), 200
        
    except InvalidId:
        return jsonify({"error": "Invalid project ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== UPDATE ====================
@project_bp.route("/projects/<project_id>", methods=["PUT", "PATCH"])
@login_required
def update_project(project_id):
    """
    แก้ไขโปรเจค (เฉพาะเจ้าของเท่านั้น)
    
    Request Body: ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข
    {
        "title": "ชื่อใหม่",
        "status": "completed",
        ...
    }
    """
    try:
        pid = ObjectId(project_id)
        user_id = session["user"]["id"]
        
        # ตรวจสอบว่าโปรเจคมีอยู่จริง
        project = project_model.get(pid)
        if not project:
            return jsonify({"error": "Project not found"}), 404
        
        # ตรวจสอบว่าเป็นเจ้าของโปรเจคหรือไม่
        if str(project["owner_id"]) != user_id:
            return jsonify({"error": "Access denied"}), 403
        
        # รับข้อมูลที่ต้องการอัปเดต
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # อัปเดตโปรเจค
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
@project_bp.route("/projects/<project_id>", methods=["DELETE"])
@login_required
def delete_project(project_id):
    """
    ลบโปรเจค (soft delete - เฉพาะเจ้าของเท่านั้น)
    """
    try:
        pid = ObjectId(project_id)
        user_id = session["user"]["id"]
        
        # ตรวจสอบว่าโปรเจคมีอยู่จริง
        project = project_model.get(pid)
        if not project:
            return jsonify({"error": "Project not found"}), 404
        
        # ตรวจสอบว่าเป็นเจ้าของโปรเจคหรือไม่
        if str(project["owner_id"]) != user_id:
            return jsonify({"error": "Access denied"}), 403
        
        # ลบโปรเจค (soft delete)
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

# ==================== BONUS: Metrics ====================
@project_bp.route("/projects/<project_id>/like", methods=["POST"])
@login_required
def like_project(project_id):
    """เพิ่มจำนวนไลค์ (bonus feature)"""
    try:
        pid = ObjectId(project_id)
        project = project_model.get(pid)
        
        if not project:
            return jsonify({"error": "Project not found"}), 404
        
        # เพิ่มจำนวนไลค์
        project_model.inc_metric(pid, "likes")
        
        return jsonify({
            "success": True,
            "message": "Project liked"
        }), 200
        
    except InvalidId:
        return jsonify({"error": "Invalid project ID"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500