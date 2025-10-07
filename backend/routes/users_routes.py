from flask import Blueprint, session, jsonify
from bson import ObjectId
from bson.errors import InvalidId
from auth.decorators import login_required

user_bp = Blueprint("user", __name__)

# จะถูก inject จาก app.py
user_model = None

def init_user_routes(model):
    """เตรียมค่าที่ต้องใช้ใน routes"""
    global user_model
    user_model = model

@user_bp.route("/me")
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
@login_required
def dashboard():
    """หน้า dashboard สำหรับผู้ใช้ที่ล็อกอินแล้ว"""
    return f"ยินดีต้อนรับ {session['user']['name']}!"