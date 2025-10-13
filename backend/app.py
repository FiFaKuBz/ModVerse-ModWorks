from flask import Flask, send_from_directory
from flask_pymongo import PyMongo
from .config import Config
from .models.user import UserModel
from .auth.google import GoogleOAuth
from .routes.auth_routes import auth_bp, init_auth_routes
from .routes.users_routes import user_bp, init_user_routes
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='../frontend/dist')
CORS(app) 
app.config.from_object(Config)

# เชื่อมต่อ MongoDB
mongo = PyMongo(app)

# สร้าง model และ service objects
with app.app_context():
    user_model = UserModel(mongo.db)
    
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

# ลงทะเบียน blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)

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
    # app.run(debug=True, use_reloader=False)