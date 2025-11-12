import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """การตั้งค่าหลักของแอป"""
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    MONGO_URI = os.getenv("MONGO_URI")
    
    # Session Configuration (สำคัญ!)
    SESSION_COOKIE_NAME = "session"
    SESSION_COOKIE_HTTPONLY = True  # ป้องกัน JavaScript access
    SESSION_COOKIE_SAMESITE = "Lax"  # ป้องกัน CSRF (ใช้ 'None' ถ้าต้องการ cross-origin)
    SESSION_COOKIE_SECURE = False  # ตั้งเป็น True ถ้าใช้ HTTPS
    PERMANENT_SESSION_LIFETIME = 86400  # 24 ชั่วโมง (วินาที)
    SESSION_TYPE = "filesystem"  # หรือ 'mongodb' ถ้าต้องการ
    
    # Google OAuth
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
    
    # OAuth URLs
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"

    # Email settings for OTP
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_USERNAME")
    
    # OTP settings
    OTP_EXPIRY_SECONDS = 300  # 5 minutes