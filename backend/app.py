from flask import Flask, send_from_directory
from flask_pymongo import PyMongo
from flask_mail import Mail
from flask_cors import CORS
import os
from .config import Config

# Models
from .models.user import UserModel
from .models.project import ProjectModel
from .models.category import TagModel  # ✅ 1. เพิ่ม Import TagModel

# Auth & Services
from .auth.google import GoogleOAuth
from .auth.otp_service import OTPService

# Routes
from .routes.auth_routes import auth_bp, init_auth_routes
from .routes.users_routes import user_bp, init_user_routes
from .routes.project_routes import project_bp, init_project_routes
from .routes.search_routes import search_bp

app = Flask(__name__, static_folder='../frontend/dist')

LOCAL_ORIGINS = "http://127.0.0.1:5173"
PRODUCTION_ORIGINS = "http://127.0.0.1:3000"

# CORS Configuration
# ✅ เพิ่ม LOCAL_ORIGINS เข้าไปใน list เพื่อให้ Frontend (5173) เชื่อมต่อได้
CORS(app, 
     supports_credentials=True,
     origins=[PRODUCTION_ORIGINS, LOCAL_ORIGINS, "http://127.0.0.1:5000"], 
     allow_headers=["Content-Type", "Authorization", "Cookie"],
     expose_headers=["Set-Cookie"])

app.config.from_object(Config)

# เชื่อมต่อ MongoDB และ Mail
mongo = PyMongo(app)
mail = Mail(app)

# สร้าง model และ service objects
with app.app_context():
    # Initialize Models
    user_model = UserModel(mongo.db)
    project_model = ProjectModel(mongo.db)
    tag_model = TagModel(mongo.db) # ✅ 2. สร้าง Instance ของ TagModel
    
    # สร้าง indexes
    project_model.ensure_indexes()
    tag_model.ensure_indexes() # ✅ สร้าง Index สำหรับ Tags (ถ้ามี)
    
    otp_service = OTPService(mail, mongo.db)

    google_oauth = GoogleOAuth(
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        redirect_uri=Config.GOOGLE_REDIRECT_URI,
        auth_url=Config.AUTH_URL,
        token_url=Config.TOKEN_URL,
    )

# เตรียมค่าสำหรับ routes
init_auth_routes(google_oauth, user_model, otp_service)
init_user_routes(user_model, project_model)

# ✅ 3. ส่ง tag_model เข้าไปใน init_project_routes ด้วย
init_project_routes(project_model, tag_model, user_model)

# ลงทะเบียน blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(project_bp, url_prefix='/api/projects')
app.register_blueprint(search_bp, url_prefix='/api/search')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)