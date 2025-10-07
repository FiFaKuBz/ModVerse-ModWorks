from functools import wraps
from flask import session, redirect, url_for

def login_required(view):
    """
    Decorator สำหรับ route ที่ต้องล็อกอินก่อน
    
    ถ้ายังไม่ได้ล็อกอิน จะ redirect ไปหน้า login
    """
    @wraps(view)  # เอาไว้ preserve metadata ของฟังก์ชัน view เดิม เช่นชื่อ/ docstring
    def wrapped(*args, **kwargs):
        if "user" not in session:  # ถ้ายังไม่มี user ใน session = ยังไม่ได้ล็อกอิน
            return redirect(url_for("auth.login"))  # ส่งไปหน้า login
        return view(*args, **kwargs)  # ถ้าล็อกอินแล้ว → ทำงานฟังก์ชันจริง
    return wrapped