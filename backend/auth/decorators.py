from functools import wraps
from flask import session, redirect, url_for, jsonify, request

def login_required(view):
    """
    Decorator สำหรับ route ที่ต้องล็อกอินก่อน
    
    - ถ้าเป็น API request (JSON): return 401 JSON error
    - ถ้าเป็น web request: redirect ไปหน้า login
    """
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user" not in session:
            # ตรวจสอบว่าเป็น API request หรือไม่
            # วิธีที่ 1: ดูจาก Content-Type หรือ Accept header
            is_api_request = (
                request.content_type == "application/json" or
                "application/json" in request.headers.get("Accept", "")
            )
            
            # วิธีที่ 2: ดูจาก URL path (ถ้า path ขึ้นต้นด้วย /api/)
            # is_api_request = request.path.startswith("/api/")
            
            if is_api_request:
                # ถ้าเป็น API request → return JSON error
                return jsonify({
                    "error": "Authentication required",
                    "message": "Please login first"
                }), 401
            else:
                # ถ้าเป็น web request → redirect ไปหน้า login
                return redirect(url_for("auth.login"))
        
        return view(*args, **kwargs)
    
    return wrapped