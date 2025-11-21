from flask import Blueprint, redirect, request, session, url_for, jsonify

# สร้าง Blueprint ชื่อ "auth"
auth_bp = Blueprint("auth", __name__)

# จะถูก inject จาก app.py
google_oauth = None
user_model = None
otp_service = None

def init_auth_routes(oauth, model,otp):
    """เตรียมค่าที่ต้องใช้ใน routes"""
    global google_oauth, user_model, otp_service
    google_oauth = oauth
    user_model = model
    otp_service = otp

# ✅ NEW: BYPASS LOGIN ROUTE FOR LOCAL TESTING
@auth_bp.route("/bypass-login", methods=["POST"]) 
def bypass_login():
    """Bypass Google OAuth for local development/testing"""
    
    # 📌 ใช้ ID ที่เป็นไปตาม MongoDB ObjectId format (24 ตัว)
    MOCK_USER_ID = "660705010000000000000000" 
    MOCK_USER_NAME = "Test User (Bypass)"
    MOCK_USER_EMAIL = "test@bypass.com"
    
    session.clear() # เคลียร์ Session เก่าก่อน
    session["user"] = {
        "id": MOCK_USER_ID,
        "name": MOCK_USER_NAME,
        "email": MOCK_USER_EMAIL,
        "picture": "MOCK_URL",
        "role": "user",
    }
    session.permanent = True # ทำให้ Session อยู่ได้นาน
    
    print(f"✅ DEBUG: Bypass Login Success. Session created for {MOCK_USER_NAME}")
    
    return jsonify({"ok": True, "message": "Bypass login successful"}), 200


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
    """
    รับ callback จาก Google
    → ตรวจสอบตัวตน
    → ส่ง OTP
    → รอ user ยืนยัน
    """
    print("DEBUG: 1. Start callback function") # 👈 Added
    # ตรวจสอบ state
    if request.args.get("state") != session.get("oauth_state"):
        print("DEBUG: ❌ State Mismatch") # 👈 Added
        return "Invalid state", 400
    
    code = request.args.get("code")
    if not code:
        print("DEBUG: ❌ Missing code") # 👈 Added
        return "Missing code", 400
    
    # แลก code เป็น token
    try:
        print("DEBUG: 2. Attempting token exchange with code:", code[:10] + "...") # 👈 Added
        token_data = google_oauth.exchange_code_for_token(code)
        print("DEBUG: 3. Token exchange SUCCESS") # 👈 Added
    except Exception as e:
        # 🚨 จุดนี้มักเกิด 502 ถ้าโค้ดของคุณไม่สามารถจัดการ Exception ได้
        print(f"DEBUG: ❌ Token exchange FAILED with error: {e}") # 👈 Added
        import traceback; traceback.print_exc() # 👈 แสดง Stack Trace ใน Console
        return str(e), 400
    
    id_token_str = token_data.get("id_token")
    if not id_token_str:
        print(f"DEBUG: ❌ Missing id_token: {token_data}") # 👈 Added
        return f"Token exchange failed: {token_data}", 400
    
    # ตรวจสอบ ID token
    google_info = google_oauth.verify_id_token(id_token_str)
    
    # ตรวจสอบ nonce
    if google_info.get("nonce") != session.get("oauth_nonce"):
        print("DEBUG: ❌ Nonce Mismatch") # 👈 Added
        return "Invalid nonce", 400
    
    # บันทึกข้อมูล Google ใน session ชั่วคราว
    session["pending_google_info"] = google_info

    # 📧 ส่ง OTP ไปอีเมล
    email = google_info.get("email")
    name = google_info.get("name", "User")
    
    print(f"DEBUG: 4. Attempting to send OTP to {email}") # 👈 Added
    result = otp_service.send_otp(email, name)

    if not result["success"]:
        # 🚨 จุดนี้มักเกิด 502 ถ้า Mail Server ล่ม
        print(f"DEBUG: ❌ Failed to send OTP: {result.get('message')}") # 👈 Added
        return jsonify({"error": "Failed to send OTP"}), 500
    
    print("DEBUG: 5. OTP sent successfully. Returning 2FA response.") # 👈 Added
    
    # เคลียร์ค่า one-time OAuth
    session.pop("oauth_state", None)
    session.pop("oauth_nonce", None)
    
    #  ✅ ส่ง response กลับไปให้ frontend รู้ว่าต้องไป 2FA
    frontend_url = "http://127.0.0.1:5173"
    return redirect(f"{frontend_url}/?auth=ok")


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    """
    ตรวจสอบ OTP ที่ user กรอกมา
    """
    data = request.get_json()
    code = data.get("code", "").strip()
    
    # ตรวจสอบว่ามี pending_google_info หรือไม่
    google_info = session.get("pending_google_info")
    if not google_info:
        return jsonify({"ok": False, "error": "No pending authentication"}), 400
    
    email = google_info.get("email")
    
    # ตรวจสอบ OTP
    result = otp_service.verify_otp(email, code)
    
    if not result["valid"]:
        # เพิ่มจำนวนครั้งที่พยายาม
        otp_service.increment_attempt(email)
        return jsonify({"ok": False, "error": result["message"]}), 400
    
    # ✅ OTP ถูกต้อง → บันทึก user ลง database
    user_doc = user_model.upsert_google_user(google_info)
    
    # สร้าง session จริง
    session["user"] = {
        "id": str(user_doc["_id"]),
        "name": user_doc.get("name"),
        "email": user_doc.get("email"),
        "picture": user_doc.get("picture"),
        "role": user_doc.get("role", "user"),
    }
    
    # ลบข้อมูล pending
    session.pop("pending_google_info", None)
    
    return jsonify({"ok": True, "message": "Login successful"}), 200


@auth_bp.route("/resend-otp", methods=["POST"])
def resend_otp():
    """ส่ง OTP ใหม่อีกครั้ง"""
    google_info = session.get("pending_google_info")
    if not google_info:
        return jsonify({"error": "No pending authentication"}), 400
    
    email = google_info.get("email")
    name = google_info.get("name", "User")
    
    result = otp_service.send_otp(email, name)
    
    if result["success"]:
        return jsonify({"message": "OTP resent"}), 200
    else:
        return jsonify({"error": "Failed to resend OTP"}), 500

@auth_bp.route("/logout", methods=["POST"])
def logout():
    """ล็อกเอาท์และเคลียร์ session"""
    session.clear()
    return jsonify({"message": "Logout successful"}), 200