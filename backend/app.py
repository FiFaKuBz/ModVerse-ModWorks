from flask import Flask, send_from_directory
from flask_pymongo import PyMongo
from flask_mail import Mail
from flask_cors import CORS
import os

from config import Config
from models.user import UserModel
from models.project import ProjectModel
from auth.google import GoogleOAuth
from auth.otp_service import OTPService
from routes.auth_routes import auth_bp, init_auth_routes
from routes.users_routes import user_bp, init_user_routes
from routes.project_routes import project_bp, init_project_routes
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend/dist')

# CORS Configuration (สำคัญสำหรับ API!)
CORS(app, 
     supports_credentials=True,  # อนุญาตให้ส่ง cookies
     origins=["http://localhost:3000", "http://localhost:5000"],  # frontend origins
     allow_headers=["Content-Type", "Authorization", "Cookie"],
     expose_headers=["Set-Cookie"])

app.config.from_object(Config)

# เชื่อมต่อ MongoDB และ Mail
mongo = PyMongo(app)
mail = Mail(app)

# สร้าง model และ service objects
with app.app_context():
    user_model = UserModel(mongo.db)
    project_model = ProjectModel(mongo.db)
    
    # สร้าง indexes สำหรับ projects
    project_model.ensure_indexes()
    
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
init_user_routes(user_model)
init_project_routes(project_model)

# ลงทะเบียน blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(project_bp, url_prefix='/api/project')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
    app.run(debug=True, use_reloader=False)