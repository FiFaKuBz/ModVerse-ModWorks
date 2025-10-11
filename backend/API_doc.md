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
GET /me
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