from flask import Flask
from flask_pymongo import PyMongo
from config import Config
from models.user import UserModel
from models.project import ProjectModel
from auth.google import GoogleOAuth
from routes.auth_routes import auth_bp, init_auth_routes
from routes.users_routes import user_bp, init_user_routes
from routes.project_routes import project_bp, init_project_routes
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 
app.config.from_object(Config)

# เชื่อมต่อ MongoDB
mongo = PyMongo(app)

# สร้าง model และ service objects
with app.app_context():
    user_model = UserModel(mongo.db)
    
    project_model = ProjectModel(mongo.db)

    google_oauth = GoogleOAuth(
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        redirect_uri=Config.GOOGLE_REDIRECT_URI,
        auth_url=Config.AUTH_URL,
        token_url=Config.TOKEN_URL,
    )

# เตรียมค่าสำหรับ routes
init_auth_routes(google_oauth, user_model)
init_user_routes(user_model)
init_project_routes(project_model, mongo.db)

# ลงทะเบียน blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(project_bp)

@app.route("/")
def index():
    return "หน้าแรก"

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)