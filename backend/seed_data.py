import os
from pymongo import MongoClient
from datetime import datetime, timezone
from bson import ObjectId
from dotenv import load_dotenv  # ✅ 1. เพิ่ม import นี้

# ✅ 2. โหลดค่าจาก .env
load_dotenv()

# ✅ 3. อ่านค่า MONGO_URI หรือใช้ default ที่มีชื่อ DB ชัดเจน
MONGO_URI = os.getenv("MONGO_URI") 

client = MongoClient(MONGO_URI)

# ✅ 4. แก้การดึง DB ให้ปลอดภัยขึ้น (ถ้าใน URI ไม่มีชื่อ DB ให้ใช้ชื่อสำรอง)
try:
    db = client.get_default_database()
except Exception:
    db = client["modverse"]  # ชื่อ Database สำรอง

def reset_db():
    """ล้างข้อมูลเก่า (ถ้าต้องการ)"""
    print("🗑️ Clearing old data...")
    db.users.delete_many({"role": "mock_user"}) # ลบเฉพาะ mock user
    db.projects.delete_many({"is_mock": True})  # ลบเฉพาะ mock project
    # หรือถ้าจะล้างหมดเลยให้ใช้: 
    # db.users.delete_many({})
    # db.projects.delete_many({})

def seed():
    print("🌱 Seeding data...")
    now = datetime.now(timezone.utc)

    # --- 1. สร้าง Users (5 คน) ---
    users_data = [
        {
            "name": "Alice Designer",
            "username": "alice-design",
            "email": "alice@example.com",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
            "about": "Love creating clean and accessible interfaces. UX/UI Expert.",
            "tags": ["ux/ui", "accessibility"],
            "role": "mock_user"
        },
        {
            "name": "Bob Engineer",
            "username": "bob-dev",
            "email": "bob@example.com",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
            "about": "Full-stack developer who loves optimization and Algorithms.",
            "tags": ["algorithm", "database"],
            "role": "mock_user"
        },
        {
            "name": "Charlie Circuit",
            "username": "charlie-iot",
            "email": "charlie@example.com",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
            "about": "Embedded systems enthusiast. Building smart things.",
            "tags": ["digital circuit", "iot"],
            "role": "mock_user"
        },
        {
            "name": "Diana Data",
            "username": "diana-viz",
            "email": "diana@example.com",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
            "about": "Turning complex data into beautiful visualizations.",
            "tags": ["data visualization", "python"],
            "role": "mock_user"
        },
        {
            "name": "Evan Transport",
            "username": "evan-trans",
            "email": "evan@example.com",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Evan",
            "about": "Researching urban mobility and transportation systems.",
            "tags": ["transportation", "planning"],
            "role": "mock_user"
        }
    ]

    created_users = []
    for u in users_data:
        # เตรียม Doc
        user_doc = {
            "google": {"sub": f"mock_{u['username']}", "email_verified": True},
            "email": u["email"],
            "name": u["name"],
            "username": u["username"],
            "avatar": u["avatar"],
            "about": u["about"],
            "tags": u["tags"],
            "role": u["role"],
            "created_at": now,
            "updated_at": now,
            "login_count": 0,
            "twoFactorEnabled": False # ปิด 2FA สำหรับ Mock User
        }
        # Insert
        res = db.users.insert_one(user_doc)
        created_users.append({**u, "_id": res.inserted_id})
        print(f"✅ Created User: {u['name']} ({u['username']})")

    # --- 2. สร้าง Projects (5 โปรเจกต์) ---
    
    projects_data = [
        {
            "owner_idx": 0, # Alice
            "title": "Modern Dashboard UI Kit",
            "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
            "tags": ["UX/UI", "Data Visualization"],
            "detail": {
                "topic": "A comprehensive UI kit for dashboard applications.",
                "startPoint": "Many dashboards are cluttered and hard to use.",
                "goal": "Create a clean, minimalist design system.",
                "process": "User research, wireframing in Figma, prototyping.",
                "result": "A library of 50+ components used by 5 teams.",
                "takeaway": "Consistency is key in UI design.",
                "nextStep": "Release a React component library."
            },
            "coauthors": []
        },
        {
            "owner_idx": 1, # Bob
            "title": "Traffic Flow Optimization Algorithm",
            "image": "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1000&q=80",
            "tags": ["Algorithm", "Transportation"],
            "detail": {
                "topic": "Optimizing traffic light timing using genetic algorithms.",
                "startPoint": "Traffic congestion in downtown is increasing.",
                "goal": "Reduce average wait time by 20%.",
                "process": "Simulation using Python and SUMO.",
                "result": "Simulation showed a 25% reduction in wait times.",
                "takeaway": "Simple algorithms can have huge impacts.",
                "nextStep": "Pilot test at one intersection."
            },
            "coauthors": [
                {"name": created_users[4]["name"], "slug": created_users[4]["username"]} # Evan (Transport expert) helps Bob
            ]
        },
        {
            "owner_idx": 2, # Charlie
            "title": "Smart Home Energy Monitor",
            "image": "https://images.unsplash.com/photo-1558002038-10917738179d?auto=format&fit=crop&w=1000&q=80",
            "tags": ["Digital Circuit", "IoT", "Database"],
            "detail": {
                "topic": "Real-time energy monitoring using ESP32.",
                "startPoint": "Energy bills are high and unpredictable.",
                "goal": "Track usage in real-time to identify waste.",
                "process": "Designed PCB, coded C++ firmware, set up InfluxDB.",
                "result": "Prototype working, sending data every 5 seconds.",
                "takeaway": "Hardware debugging requires patience.",
                "nextStep": "Add machine learning for anomaly detection."
            },
            "coauthors": []
        },
        {
            "owner_idx": 3, # Diana
            "title": "Global Population Visualization",
            "image": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1000&q=80",
            "tags": ["Data Visualization", "Database"],
            "detail": {
                "topic": "Interactive map showing population growth trends.",
                "startPoint": "Data exists but is hard to understand in tables.",
                "goal": "Make demographics data accessible to everyone.",
                "process": "D3.js for frontend, MongoDB for data storage.",
                "result": "Interactive web app with filtering capabilities.",
                "takeaway": "Performance matters when handling millions of points.",
                "nextStep": "Add projection for future growth."
            },
            "coauthors": [
                {"name": created_users[0]["name"], "slug": created_users[0]["username"]} # Alice (UI) helps Diana
            ]
        },
        {
            "owner_idx": 4, # Evan
            "title": "Autonomous Drone Delivery Path",
            "image": "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=80",
            "tags": ["Transportation", "Algorithm"],
            "detail": {
                "topic": "Pathfinding for drones in urban environments.",
                "startPoint": "Delivery drones need safe, efficient paths.",
                "goal": "Avoid obstacles and no-fly zones automatically.",
                "process": "A* algorithm implementation with 3D constraints.",
                "result": "Successful simulation in unity environment.",
                "takeaway": "3D pathfinding is computationally expensive.",
                "nextStep": "Real-world test with a small quadcopter."
            },
            "coauthors": []
        }
    ]

    for p in projects_data:
        owner = created_users[p["owner_idx"]]
        
        project_doc = {
            "owner_id": owner["_id"],
            "contributor": owner["username"], # ✅ ใช้ Username ตามที่เราแก้
            "title": p["title"],
            "image": p["image"],
            "detail": p["detail"],
            "tags": p["tags"],          # ✅ สำหรับ Search API
            "categories": p["tags"],    # ✅ สำหรับ Legacy support
            "coauthors": p["coauthors"],
            "visibility": "public",
            "allow_comments": True,
            "metrics": {"views": 0, "likes": 0},
            "created_at": now,
            "updated_at": now,
            "last_viewed_at": None,
            "is_deleted": False,
            "status": "completed",
            "is_mock": True
        }
        
        db.projects.insert_one(project_doc)
        print(f"✅ Created Project: '{p['title']}' by {owner['name']}")

    print("\n🎉 Database seeded successfully!")
    print("You can now login (or bypass login) and see these projects in Showcase.")

if __name__ == "__main__":
    # reset_db() # Uncomment ถ้าอยากล้างข้อมูล Mock เก่าก่อนสร้างใหม่
    seed()