from flask import Blueprint, redirect, request, session, url_for, jsonify

# Create Blueprint
auth_bp = Blueprint("auth", __name__)

# Will be injected from app.py
google_oauth = None
user_model = None
otp_service = None

def init_auth_routes(oauth, model,otp):
    """เตรียมค่าที่ต้องใช้ใน routes"""
    global google_oauth, user_model, otp_service
    google_oauth = oauth
    user_model = model
    otp_service = otp

# --- BYPASS LOGIN (For Testing) ---
@auth_bp.route("/bypass-login", methods=["POST"]) 
def bypass_login():
    """Bypass Google OAuth for local development/testing"""
    MOCK_USER_ID = "660705010000000000000000" 
    MOCK_USER_NAME = "Test User (Bypass)"
    MOCK_USER_EMAIL = "test@bypass.com"
    
    session.clear()
    session["user"] = {
        "id": MOCK_USER_ID,
        "name": MOCK_USER_NAME,
        "email": MOCK_USER_EMAIL,
        "picture": "https://ui-avatars.com/api/?name=Test+User",
        "role": "user",
        "username": "test-user"
    }
    session.permanent = True
    
    print(f"✅ DEBUG: Bypass Login Success. Session created for {MOCK_USER_NAME}")
    return jsonify({"ok": True, "message": "Bypass login successful"}), 200

# --- GOOGLE OAUTH FLOW ---
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
    # 1. Verify State
    if request.args.get("state") != session.get("oauth_state"):
        return "Invalid state", 400
    
    code = request.args.get("code")
    if not code:
        return "Missing code", 400
    
    # 2. Exchange Code for Token
    try:
        token_data = google_oauth.exchange_code_for_token(code)
    except Exception as e:
        return str(e), 400
    
    # 3. Verify ID Token
    id_token_str = token_data.get("id_token")
    google_info = google_oauth.verify_id_token(id_token_str)
    
    if google_info.get("nonce") != session.get("oauth_nonce"):
        return "Invalid nonce", 400
    
    # 4. Check if user exists
    user = user_model.users.find_one({"google.sub": google_info["sub"]})
    
    # Cleanup OAuth session vars
    session.pop("oauth_state", None)
    session.pop("oauth_nonce", None)

    # --- SCENARIO A: Existing User & 2FA Disabled -> LOGIN IMMEDIATELY ---
    if user and user.get("twoFactorEnabled") is False:
        user_doc = user_model.upsert_google_user(google_info)
        session["user"] = {
            "id": str(user_doc["_id"]),
            "name": user_doc.get("name"),
            "email": user_doc.get("email"),
            "picture": user_doc.get("avatar"),
            "role": user_doc.get("role", "user"),
            "username": user_doc.get("username"),
        }
        return redirect("/")

    # --- SCENARIO B: New User OR 2FA Enabled -> REQUIRE OTP ---
    session["pending_google_info"] = google_info
    email = google_info.get("email")
    name = google_info.get("name", "User")

    # Send OTP
    print(f"DEBUG: Sending OTP to {email}")
    result = otp_service.send_otp(email, name)

    if not result["success"]:
        return jsonify({"error": "Failed to send OTP"}), 500
    
    # The frontend checks for ?auth=ok to show the OTP screen
    return redirect("/login?auth=ok")


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    """Verify OTP and finalize login"""
    data = request.get_json()
    code = data.get("code", "").strip()
    
    google_info = session.get("pending_google_info")
    if not google_info:
        return jsonify({"ok": False, "error": "No pending authentication"}), 400
    
    email = google_info.get("email")
    result = otp_service.verify_otp(email, code)
    
    if not result["valid"]:
        otp_service.increment_attempt(email)
        return jsonify({"ok": False, "error": result["message"]}), 400
    
    # Success -> Create Session
    user_doc = user_model.upsert_google_user(google_info)
    session["user"] = {
        "id": str(user_doc["_id"]),
        "name": user_doc.get("name"),
        "email": user_doc.get("email"),
        "picture": user_doc.get("avatar"),
        "role": user_doc.get("role", "user"),
        "username": user_doc.get("username"),
    }
    session.pop("pending_google_info", None)
    
    return jsonify({"ok": True, "message": "Login successful"}), 200


@auth_bp.route("/resend-otp", methods=["POST"])
def resend_otp():
    """Resend OTP"""
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
    """Clear session"""
    session.clear()
    return jsonify({"message": "Logout successful"}), 200