# API Documentation

## Tags and Search API

### Search Users by Tags
Search for users based on their tags with pagination support.

```
GET /api/search/tags
```

#### Query Parameters
| Parameter   | Type    | Required | Default    | Description                                           |
|------------|---------|----------|------------|-------------------------------------------------------|
| tags       | string  | Yes      | -          | Comma-separated list of tags (e.g., "python,flask")   |
| op         | string  | No       | "and"      | Search operator: "and" or "or"                        |
| collection | string  | No       | "users"    | Collection to search in                               |
| page       | integer | No       | 1          | Page number (1-based)                                 |
| limit      | integer | No       | 20         | Items per page (max 100)                             |
| sort       | string  | No       | -created_at| Field to sort by (prefix with - for descending)      |

#### Success Response
```json
{
    "ok": true,
    "collection": "users",
    "filters": {
        "tags": ["python", "flask"],
        "op": "and"
    },
    "page": 1,
    "limit": 20,
    "total": 57,
    "items": [
        {
            "_id": "507f1f77bcf86cd799439011",
            "name": "John Doe",
            "email": "john@example.com",
            "picture": "https://example.com/photo.jpg",
            "role": "developer",
            "tags": ["python", "flask", "mongodb"],
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

1. Search users with both Python and Flask skills:
```bash
curl 'http://localhost:5000/api/search/tags?tags=python,flask'
```

2. Search users with either Python or React skills, page 2, 5 items per page:
```bash
curl 'http://localhost:5000/api/search/tags?tags=python,react&op=or&page=2&limit=5'
```

3. Search users with MongoDB skills, sorted by creation date (newest first):
```bash
curl 'http://localhost:5000/api/search/tags?tags=mongodb&sort=-created_at'
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
