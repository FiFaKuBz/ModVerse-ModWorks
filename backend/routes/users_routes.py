from flask import Blueprint, session, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from ..auth.decorators import role_required

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

# --- NEW: ADMIN-ONLY ROUTE FOR RBAC DEMO ---
@user_bp.route("/admin_panel")
@role_required(allowed_roles="admin") # <<< RBAC ENFORCEMENT
def admin_panel():
    """Admin-only resource (requires role: 'admin')"""
    return jsonify(message=f"Welcome, Admin. Access Granted to: {session['user']['name']}"), 200