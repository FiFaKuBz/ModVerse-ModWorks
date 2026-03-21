# ModVerse-ModWorks

A comprehensive web application for managing projects and user profiles, built with a modern React frontend and a robust Flask backend.

## 🚀 Features

### User Management
- **Authentication**: Secure login via Google OAuth and OTP verification.
- **Profile**: Customizable user profiles with avatars, descriptions, and tags.
- **Social**: Follow/Unfollow users, Block/Unblock users, and Report inappropriate content.
- **Dashboard**: Personalized dashboard for managing user activities.

### Project Management
- **CRUD Operations**: Create, Read, Update, and Delete projects.
- **Organization**: Categorize projects with tags.
- **Interaction**: Save interesting projects for later.
- **Comments**: Engage with projects through comments (Backend support).

### Search & Discovery
- **Search**: Efficient search functionality to find projects and users.
- **Feed**: Discover new projects and updates from followed users.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) (v19) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4)
- **Routing**: [React Router](https://reactrouter.com/) (v7)
- **Icons**: [Lucide React](https://lucide.dev/) & React Icons
- **Linting**: ESLint

### Backend
- **Framework**: [Flask](https://flask.palletsprojects.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via Flask-PyMongo)
- **Authentication**: Google OAuth 2.0
- **Email**: Flask-Mail for OTP services
- **CORS**: Flask-CORS for cross-origin resource sharing

## 📂 Project Structure

```
CPE334_Final_Project/
├── backend/                 # Flask Backend
│   ├── app.py              # Application entry point
│   ├── config.py           # Configuration settings
│   ├── models/             # Database models (User, Project, Report, etc.)
│   ├── routes/             # API routes (Auth, Users, Projects, Search)
│   ├── auth/               # Authentication logic (Google, OTP)
│   └── requirements.txt    # Python dependencies
│
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── api/            # API integration
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   └── utils/          # Utility functions
│   ├── package.json        # Node.js dependencies
│   └── vite.config.js      # Vite configuration
│
└── README.md               # Project Documentation
```

## ⚙️ Setup Instructions

### Prerequisites
- Node.js & npm
- Python 3.8+
- MongoDB instance

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (create a `.env` file based on `config.py`).
5. Run the server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Full Setup
1. Navigate to the project root directory:
   ```bash
   cd CPE334_Final_Project
   ```
2. Using the script.sh file to run the project:
   ```bash
   ./script.sh
   ```
   i. Mode 0: Full Install (npm install + pip install) -> Build -> Run\
   ii. Mode 1: Quick Start (Build -> Run)

> need .env file

## 👥 Contributors
1. 66070501005 Kunanon Na-Ranong 
2. 66070501042 Nutthapong Phumiphan
3. 66070501054 Phurichaya Khemvaraporn
4. 66070501058 Waritnan Srisermwongse
5. 66070501061 Atithep Pattisom
6. 66070501071 Yanakorn Tangprakhon
7. 66070501084 Thatthep Thongrung
