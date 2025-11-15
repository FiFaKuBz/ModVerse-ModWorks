# API Documentation

## Tags and Search API


### Search Projects by Tags
Search for projects that have all selected tags (match all, AND) with pagination support.

```
GET /api/search/tags
```

#### Query Parameters
| Parameter   | Type    | Required | Default      | Description                                           |
|------------|---------|----------|--------------|-------------------------------------------------------|
| tags       | string  | Yes      | -            | Comma-separated list of tags (e.g., "python,flask")   |
| op         | string  | No       | "and"        | Search operator: "and" (default, must match all tags) or "or" (match any tag) |
| collection | string  | No       | "projects"   | Collection to search in                               |
| page       | integer | No       | 1            | Page number (1-based)                                 |
| limit      | integer | No       | 20           | Items per page (max 100)                              |
| sort       | string  | No       | -created_at  | Field to sort by (prefix with - for descending)       |

#### Success Response
```json
{
  "ok": true,
  "collection": "projects",
  "filters": {
    "tags": ["python", "flask"],
    "op": "and"
  },
  "page": 1,
  "limit": 20,
  "total": 12,
  "items": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "My Project",
      "description": "A Python Flask app",
      "tags": ["python", "flask"],
      "created_at": "2025-10-30T10:30:00Z",
      "updated_at": "2025-10-30T10:30:00Z"
    }
    // ... more items
  ]
}
```

#### Error Responses

**400 Bad Request** - Missing or invalid parameters
```json
{
  "ok": false,
  "error": {
    "code": "missing_tags",
    "message": "Tags parameter is required and must not be empty"
  }
}
```

**400 Bad Request** - Invalid pagination
```json
{
  "ok": false,
  "error": {
    "code": "invalid_pagination",
    "message": "Page and limit must be positive integers"
  }
}
```

**404 Not Found** - Collection not found
```json
{
  "ok": false,
  "error": {
    "code": "collection_not_found",
    "message": "Collection projects does not exist"
  }
}
```

### Update User Profile Tags
Update a user's profile including their tags.

```
PUT /api/profile/update
```

#### Request Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
    "name": "John Doe",           // optional
    "bio": "Full stack dev",      // optional
    "picture": "https://...",     // optional
    "tags": ["python", "flask"]   // optional
}
```

#### Success Response
```json
{
    "ok": true,
    "user": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "picture": "https://example.com/photo.jpg",
        "bio": "Full stack dev",
        "tags": ["python", "flask"],
        "created_at": "2025-10-30T10:30:00Z",
        "updated_at": "2025-10-30T10:30:00Z"
    }
}
```

#### Error Responses

**400 Bad Request** - No fields to update
```json
{
    "ok": false,
    "error": {
        "code": "no_fields",
        "message": "No valid fields to update"
    }
}
```

**401 Unauthorized** - User not logged in
```json
{
    "ok": false,
    "error": {
        "code": "unauthorized",
        "message": "Authentication required"
    }
}
```

**500 Internal Server Error** - Update failed
```json
{
    "ok": false,
    "error": {
        "code": "update_failed",
        "message": "Failed to update profile"
    }
}
```

## Example Usage


### Search Examples

1. Search projects that have both Python and Flask tags (match all):
```bash
curl 'http://localhost:5000/api/search/tags?collection=projects&tags=python,flask'
```

2. Search projects that have either React or NodeJS tags (match any), page 2, 5 items per page:
```bash
curl 'http://localhost:5000/api/search/tags?collection=projects&tags=react,nodejs&op=or&page=2&limit=5'
```

3. Search projects with MongoDB tag, sorted by creation date (newest first):
```bash
curl 'http://localhost:5000/api/search/tags?collection=projects&tags=mongodb&sort=-created_at'
```

### Update Profile Examples

1. Update user's tags:
```bash
curl -X PUT 'http://localhost:5000/api/profile/update' \
     -H 'Content-Type: application/json' \
     -d '{"tags": ["python", "flask", "mongodb"]}'
```

2. Update profile with tags and other fields:
```bash
curl -X PUT 'http://localhost:5000/api/profile/update' \
     -H 'Content-Type: application/json' \
     -d '{
           "name": "John Doe",
           "bio": "Full stack developer",
           "tags": ["python", "react", "nodejs"]
         }'
```

## Notes

1. **Tags Format**:
   - Case-insensitive
   - Whitespace is trimmed
   - Duplicates are removed automatically
   - Empty tags are ignored

2. **Pagination**:
   - Page numbers start at 1
   - Maximum limit is 100 items per page
   - Default limit is 20 (configurable via SEARCH_PAGE_SIZE)

3. **Security**:
   - Profile updates require authentication
   - Search API is public by default
   - Sensitive fields are never exposed in responses

4. **Performance**:
   - Tags are indexed for fast searching
   - Use appropriate limit values for better performance
   - Consider using AND operator for more targeted searches

## Authentication Routes

### Login with Google

#### Endpoint
```
GET /api/auth/login
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
GET /api/auth/callback
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
Redirect to `/api/users/profile` และสร้าง session ที่มีข้อมูล:
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
GET /api/auth/logout
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
GET /api/users/profile
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
GET /api/users/dashboard
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