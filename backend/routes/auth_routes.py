from flask import Blueprint, redirect, request, session, url_for

# สร้าง Blueprint ชื่อ "auth"
auth_bp = Blueprint("auth", __name__)

# จะถูก inject จาก app.py
google_oauth = None
user_model = None

def init_auth_routes(oauth, model):
    """เตรียมค่าที่ต้องใช้ใน routes"""
    global google_oauth, user_model
    google_oauth = oauth
    user_model = model

@auth_bp.route("/login")
def login():
    """เริ่มต้น Google OAuth flow"""
    url, state, nonce, timestamp = google_oauth.generate_auth_url()
    
    session["oauth_state"] = state
    session["oauth_nonce"] = nonce
    session["oauth_ts"] = timestamp
    
    return redirect(url)

@auth_bp.route("/callback")
def callback():
    """รับ callback จาก Google หลังผู้ใช้ยืนยันตัวตน"""
    # ตรวจสอบ state
    if request.args.get("state") != session.get("oauth_state"):
        return "Invalid state", 400
    
    code = request.args.get("code")
    if not code:
        return "Missing code", 400
    
    # แลก code เป็น token
    try:
        token_data = google_oauth.exchange_code_for_token(code)
    except Exception as e:
        return str(e), 400
    
    id_token_str = token_data.get("id_token")
    if not id_token_str:
        return f"Token exchange failed: {token_data}", 400
    
    # ตรวจสอบ ID token
    google_info = google_oauth.verify_id_token(id_token_str)
    
    # ตรวจสอบ nonce
    if google_info.get("nonce") != session.get("oauth_nonce"):
        return "Invalid nonce", 400
    
    # บันทึกผู้ใช้ใน database
    user_doc = user_model.upsert_google_user(google_info)
    
    # เก็บข้อมูลใน session
    session["user"] = {
        "id": str(user_doc["_id"]),
        "name": user_doc.get("name"),
        "email": user_doc.get("email"),
        "picture": user_doc.get("picture"),
        "role": user_doc.get("role", "user"),
    }
    
    # เคลียร์ค่า one-time
    session.pop("oauth_state", None)
    session.pop("oauth_nonce", None)
    
    return redirect("/showcase")

@auth_bp.route("/logout")
def logout():
    """ล็อกเอาท์และเคลียร์ session"""
    session.clear()
    return redirect("index.html")