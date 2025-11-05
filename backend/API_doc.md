# API Documentation

## Authentication Routes

### Login with Google

#### Endpoint
```
GET /login
```

#### Description
เริ่มต้น Google OAuth flow และ redirect ไปหน้า Google Login

#### Request
ไม่ต้องส่ง parameters

#### Response
- Status: `302 Found` (Redirect to Google)

---

### OAuth Callback

#### Endpoint
```
GET /auth/callback
```

#### Description
รับ callback จาก Google หลังจากผู้ใช้ login สำเร็จ

#### Request
Query Parameters:
```json
{
  "state": "string (required)",
  "code": "string (required)"
}
```

#### Response

##### Success Response (200 OK)
Redirect to `/profile` และสร้าง session ที่มีข้อมูล:
```json
{
  "user": {
    "id": "string (MongoDB ObjectId)",
    "name": "string",
    "email": "string",
    "picture": "string (URL)",
    "role": "string (default: 'user')"
  }
}
```

##### Error Response (400 Bad Request)
```json
{
  "errorMessage": "Invalid state"
}
```
หรือ
```json
{
  "errorMessage": "Missing code"
}
```
หรือ
```json
{
  "errorMessage": "Invalid nonce"
}
```

---

### Logout

#### Endpoint
```
GET /logout
```

#### Description
ล็อกเอาท์และลบ session

#### Request
ไม่ต้องส่ง parameters

#### Response
- Status: `302 Found` (Redirect to `/`)

---

## User Routes

### Get Current User

#### Endpoint
```
GET /profile
```

#### Description
ดูข้อมูลผู้ใช้ที่ล็อกอินอยู่

#### Request
ไม่ต้องส่ง parameters (ใช้ session cookie)

#### Response

##### Success Response (200 OK)
```json
{
  "auth": true,
  "user": {
    "_id": "string",
    "google_id": "string",
    "email": "string",
    "name": "string",
    "picture": "string",
    "role": "string",
    "created_at": "string",
    "last_login": "string"
  }
}
```

##### Error Response (401 Unauthorized)
```json
{
  "auth": false
}
```

---

### Dashboard

#### Endpoint
```
GET /dashboard
```

#### Description
หน้า dashboard สำหรับผู้ใช้ที่ล็อกอินแล้ว (ต้อง authenticate)

#### Request
ไม่ต้องส่ง parameters (ใช้ session cookie)

#### Response

##### Success Response (200 OK)
```
ยินดีต้อนรับ {ชื่อผู้ใช้}!
```

##### Error Response (401 Unauthorized)
ถ้าไม่ได้ล็อกอิน จะถูก redirect หรือ return 401

---

## Project Routes

### Create Project

#### Endpoint
```
POST /projects
```

#### Description
สร้างโปรเจคใหม่ (ต้อง authenticate)

#### Request
Headers:
```
Content-Type: application/json
```

Body:
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "status": "string (optional, default: 'planning')",
  "visibility": "string (optional, default: 'private')",
  "tags": ["string"] (optional)
}
```

#### Response

##### Success Response (201 Created)
```json
{
  "success": true,
  "project_id": "string (MongoDB ObjectId)",
  "message": "Project created successfully"
}
```

##### Error Response (400 Bad Request)
```json
{
  "error": "Title is required"
}
```
หรือ
```json
{
  "error": "No data provided"
}
```

##### Error Response (401 Unauthorized)
```json
{
  "error": "Not authenticated"
}
```

---

### List My Projects

#### Endpoint
```
GET /projects
```

#### Description
ดูรายการโปรเจคของตัวเอง (ต้อง authenticate)

#### Request
Query Parameters:
```
q: string (optional) - ค้นหาตามชื่อโปรเจค
```

Example: `/projects?q=my%20project`

#### Response

##### Success Response (200 OK)
```json
{
  "success": true,
  "count": 5,
  "projects": [
    {
      "_id": "string",
      "owner_id": "string",
      "title": "string",
      "description": "string",
      "status": "string",
      "visibility": "string",
      "tags": ["string"],
      "metrics": {
        "views": 0,
        "likes": 0
      },
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

##### Error Response (401 Unauthorized)
```json
{
  "error": "Not authenticated"
}
```

---

### List Public Projects

#### Endpoint
```
GET /projects/public
```

#### Description
ดูรายการโปรเจคสาธารณะ (ไม่ต้อง authenticate)

#### Request
Query Parameters:
```
q: string (optional) - ค้นหาตามชื่อโปรเจค
status: string (optional) - กรองตามสถานะ (planning, in_progress, completed, on_hold)
```

Example: `/projects/public?status=completed&q=research`

#### Response

##### Success Response (200 OK)
```json
{
  "success": true,
  "count": 10,
  "projects": [
    {
      "_id": "string",
      "owner_id": "string",
      "title": "string",
      "description": "string",
      "status": "string",
      "visibility": "public",
      "tags": ["string"],
      "metrics": {
        "views": 100,
        "likes": 25
      },
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

---

### Get Project Details

#### Endpoint
```
GET /projects/<project_id>
```

#### Description
ดูรายละเอียดโปรเจคเดียว
- ถ้าเป็นโปรเจคสาธารณะ: ใครก็ดูได้
- ถ้าเป็นโปรเจคส่วนตัว: เฉพาะเจ้าของเท่านั้น

#### Request
Path Parameters:
```
project_id: string (MongoDB ObjectId)
```

#### Response

##### Success Response (200 OK)
```json
{
  "success": true,
  "project": {
    "_id": "string",
    "owner_id": "string",
    "title": "string",
    "description": "string",
    "status": "string",
    "visibility": "string",
    "tags": ["string"],
    "metrics": {
      "views": 150,
      "likes": 30
    },
    "created_at": "string",
    "updated_at": "string"
  }
}
```

##### Error Response (400 Bad Request)
```json
{
  "error": "Invalid project ID"
}
```

##### Error Response (403 Forbidden)
```json
{
  "error": "Access denied"
}
```

##### Error Response (404 Not Found)
```json
{
  "error": "Project not found"
}
```

---

### Update Project

#### Endpoint
```
PUT /projects/<project_id>
PATCH /projects/<project_id>
```

#### Description
แก้ไขโปรเจค (เฉพาะเจ้าของเท่านั้น, ต้อง authenticate)

#### Request
Path Parameters:
```
project_id: string (MongoDB ObjectId)
```

Headers:
```
Content-Type: application/json
```

Body (ส่งเฉพาะฟิลด์ที่ต้องการแก้ไข):
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "status": "string (optional)",
  "visibility": "string (optional)",
  "tags": ["string"] (optional)
}
```

#### Response

##### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Project updated successfully"
}
```

##### Error Response (400 Bad Request)
```json
{
  "error": "Invalid project ID"
}
```
หรือ
```json
{
  "error": "No data provided"
}
```
หรือ
```json
{
  "error": "Update failed"
}
```

##### Error Response (401 Unauthorized)
```json
{
  "error": "Not authenticated"
}
```

##### Error Response (403 Forbidden)
```json
{
  "error": "Access denied"
}
```

##### Error Response (404 Not Found)
```json
{
  "error": "Project not found"
}
```

---

### Delete Project

#### Endpoint
```
DELETE /projects/<project_id>
```

#### Description
ลบโปรเจค (soft delete - เฉพาะเจ้าของเท่านั้น, ต้อง authenticate)

#### Request
Path Parameters:
```
project_id: string (MongoDB ObjectId)
```

#### Response

##### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

##### Error Response (400 Bad Request)
```json
{
  "error": "Invalid project ID"
}
```
หรือ
```json
{
  "error": "Delete failed"
}
```

##### Error Response (401 Unauthorized)
```json
{
  "error": "Not authenticated"
}
```

##### Error Response (403 Forbidden)
```json
{
  "error": "Access denied"
}
```

##### Error Response (404 Not Found)
```json
{
  "error": "Project not found"
}
```

---

### Like Project (Bonus Feature)

#### Endpoint
```
POST /projects/<project_id>/like
```

#### Description
เพิ่มจำนวนไลค์ให้โปรเจค (ต้อง authenticate)

#### Request
Path Parameters:
```
project_id: string (MongoDB ObjectId)
```

#### Response

##### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Project liked"
}
```

##### Error Response (400 Bad Request)
```json
{
  "error": "Invalid project ID"
}
```

##### Error Response (401 Unauthorized)
```json
{
  "error": "Not authenticated"
}
```

##### Error Response (404 Not Found)
```json
{
  "error": "Project not found"
}
```

---

## Common Error Responses

### 500 Internal Server Error
```json
{
  "error": "error message description"
}
```

---

## Notes

- **Authentication**: Routes ที่มี decorator `@login_required` จำเป็นต้องล็อกอินก่อนใช้งาน
- **Session**: ใช้ session cookie สำหรับการ authenticate
- **ObjectId**: MongoDB ObjectId จะถูกแปลงเป็น string ในทุก response
- **Soft Delete**: การลบโปรเจคเป็น soft delete (ไม่ลบข้อมูลจริงออกจาก database)
- **Project Visibility**: 
  - `private`: เฉพาะเจ้าของเท่านั้นที่เห็น
  - `public`: ทุกคนเห็นได้
- **Project Status**: `planning`, `in_progress`, `completed`, `on_hold`