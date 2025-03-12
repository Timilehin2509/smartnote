# API Documentation

## Authentication

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
    "username": "string",
    "email": "string",
    "password": "string"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "string",
    "password": "string"
}
```

## Notes

### Create Note
```http
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "string",
    "content": "string",
    "cue_column": "string",
    "summary": "string",
    "category_id": "number | null",
    "tags": "string[]"
}
```

### Update Note
```http
PUT /api/notes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "string",
    "content": "string",
    "cue_column": "string",
    "summary": "string",
    "category_id": "number | null",
    "tags": "string[]"
}
```

### Link Notes
```http
POST /api/notes/:id/links
Authorization: Bearer <token>
Content-Type: application/json

{
    "linkedNoteIds": "number[]"
}
```

## Categories

### Create Category
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "string"
}
```

### Get Category Notes
```http
GET /api/categories/:id
Authorization: Bearer <token>
```

## User Profile

### Get User Stats
```http
GET /api/user/stats
Authorization: Bearer <token>

Response:
{
    "notes": "number",
    "categories": "number",
    "tags": "number",
    "linkedNotes": "number"
}
```

### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
    "username": "string",
    "currentPassword": "string",
    "newPassword": "string"
}
```