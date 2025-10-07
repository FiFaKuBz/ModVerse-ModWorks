# ModVerse ModWorks Backend

Flask backend with Google OAuth authentication and MongoDB user management.

## Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

## Usage

```bash
python app.py
```

Server runs at `http://localhost:5000`

## Configuration

Create `.env` file:

```env
SECRET_KEY=your-secret-key
MONGO_URI=mongodb://localhost:27017/your-database
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/callback
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:5000/auth/callback`
4. Copy credentials to `.env`

## Project Structure

```
backend/
├── app.py                 # Main application
├── config.py              # Configuration
├── models/
│   └── user.py           # User database operations
├── auth/
│   ├── google.py         # Google OAuth logic
│   └── decorators.py     # Auth decorators
└── routes/
    ├── auth_routes.py    # /login, /logout, /auth/callback
    └── user_routes.py    # /me, /dashboard
```

## API Endpoints

### Public
- `GET /login` - Start Google OAuth
- `GET /auth/callback` - OAuth callback
- `GET /logout` - Logout

### Protected (requires login)
- `GET /me` - Get current user info
- `GET /dashboard` - User dashboard

## Troubleshooting

**Import errors:**
```bash
# Make sure venv is activated and dependencies installed
pip install -r requirements.txt
```

**redirect_uri_mismatch:**
- Check `GOOGLE_REDIRECT_URI` in `.env` matches Google Console exactly
- No trailing slash in URL

**MongoDB connection error:**
- Ensure MongoDB is running (local) or connection string is correct (Atlas)