import secrets
import time
from flask_mail import Mail, Message

class OTPService:
    """จัดการ OTP generation และ verification"""
    
    def __init__(self, mail, db):
        self.mail = mail
        self.otps = db.otps  # MongoDB collection สำหรับเก็บ OTP
        self._create_indexes()
    
    def _create_indexes(self):
        """สร้าง TTL index ให้ OTP หมดอายุอัตโนมัติ"""
        self.otps.create_index("expires_at", expireAfterSeconds=0)
        self.otps.create_index([("email", 1), ("used", 1)])
    
    def generate_otp(self):
        """สร้าง OTP 6 หลัก"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    def send_otp(self, email, user_name="User"):
        """
        สร้างและส่ง OTP ไปยังอีเมล
        
        Returns:
            dict: {"success": bool, "message": str}
        """
        try:
            # 🔍 Debug: แสดงข้อมูลพื้นฐาน
            print("\n" + "="*60)
            print("📧 Sending OTP Email")
            print(f"Target: {email}")
            print(f"User: {user_name}")
            print("="*60 + "\n")
            
            # สร้าง OTP ใหม่
            otp_code = self.generate_otp()
            expires_at = time.time() + 300  # 5 นาที
            
            print(f"✅ OTP Generated: {otp_code}")
            
            # บันทึกลง database
            self.otps.insert_one({
                "email": email,
                "code": otp_code,
                "created_at": time.time(),
                "expires_at": expires_at,
                "used": False,
                "attempts": 0
            })
            
            print("✅ OTP saved to database")
            
            # ส่งอีเมล
            msg = Message(
                subject="Your ModVerse OTP Code",
                recipients=[email],
                html=f"""
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome to ModVerse ModWorks!</h2>
                    <p>Hi {user_name},</p>
                    <p>Your verification code is:</p>
                    <h1 style="color: #D8560E; letter-spacing: 5px;">{otp_code}</h1>
                    <p>This code will expire in 5 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                    <br>
                    <p style="color: #888;">— ModVerse Team</p>
                </body>
                </html>
                """
            )
            
            print("📤 Attempting to send email...")
            self.mail.send(msg)
            print("✅ Email sent successfully!\n")
            
            return {"success": True, "message": "OTP sent successfully"}
            
        except Exception as e:
            print(f"❌ Error sending OTP: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "message": "Failed to send OTP"}
        
    def verify_otp(self, email, code):
        """
        ตรวจสอบ OTP
        
        Returns:
            dict: {"valid": bool, "message": str}
        """
        # หา OTP ที่ตรงกัน
        otp_doc = self.otps.find_one({
            "email": email,
            "code": code,
            "used": False
        })
        
        if not otp_doc:
            return {"valid": False, "message": "Invalid or expired OTP"}
        
        # ตรวจสอบว่าหมดอายุหรือยัง
        if time.time() > otp_doc["expires_at"]:
            self.otps.delete_one({"_id": otp_doc["_id"]})
            return {"valid": False, "message": "OTP has expired"}
        
        # ตรวจสอบจำนวนครั้งที่พยายาม (ป้องกัน brute force)
        if otp_doc["attempts"] >= 5:
            self.otps.delete_one({"_id": otp_doc["_id"]})
            return {"valid": False, "message": "Too many attempts"}
        
        # ✅ OTP ถูกต้อง - ทำเครื่องหมายว่าใช้แล้ว
        self.otps.update_one(
            {"_id": otp_doc["_id"]},
            {"$set": {"used": True}}
        )
        
        return {"valid": True, "message": "OTP verified"}
    
    def increment_attempt(self, email):
        """เพิ่มจำนวนครั้งที่พยายามกรอก OTP"""
        self.otps.update_many(
            {"email": email, "used": False},
            {"$inc": {"attempts": 1}}
        )