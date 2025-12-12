# User Configuration API

Simple FastAPI backend for username-based authentication and per-user configuration storage.

## Features

- ✅ Username-only login (no password required)
- ✅ JWT token authentication
- ✅ Per-user JSON configuration storage
- ✅ SQLite database (file-based)
- ✅ CORS enabled for React/Astro frontend
- ✅ Automatic API documentation

## Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

## Running the Server

```bash
# Development mode with auto-reload
uvicorn main:app --reload --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### 1. Login (Create or Get User)

**POST** `/auth/login`

Creates a new user or logs in existing user. Returns JWT token.

**Request:**
```json
{
  "username": "john_doe"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Save Configuration

**POST** `/config`

Saves or updates user configuration. Requires authentication.

**Headers:**
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

**Request:**
```json
{
  "config": {
    "theme": "dark",
    "font": "Arial",
    "espace_mot": 5,
    "dyslexie": {
      "alternement_typo": true,
      "soulignement_syllabes": false
    }
  }
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe"
  },
  "config": {
    "theme": "dark",
    "font": "Arial",
    ...
  },
  "message": "Configuration saved successfully"
}
```

### 3. Get Configuration

**GET** `/config`

Retrieves user configuration. Requires authentication.

**Headers:**
```
Authorization: Bearer <your_token>
```

**Response (with config):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe"
  },
  "config": {
    "theme": "dark",
    "font": "Arial",
    ...
  }
}
```

**Response (no config):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe"
  },
  "config": null
}
```

## Frontend Integration

### React/JavaScript Example

```javascript
// 1. Login and store token
async function login(username) {
  const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
}

// 2. Save configuration
async function saveConfig(config) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8000/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ config })
  });
  
  return await response.json();
}

// 3. Get configuration
async function getConfig() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8000/config', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}

// Usage
await login('john_doe');
await saveConfig({ theme: 'dark', font: 'Arial' });
const userData = await getConfig();
console.log(userData.config);
```

### CURL Examples

```bash
# 1. Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'

# 2. Save config (replace YOUR_TOKEN)
curl -X POST http://localhost:8000/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"config": {"theme": "dark", "font": "Arial"}}'

# 3. Get config (replace YOUR_TOKEN)
curl -X GET http://localhost:8000/config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database

The API uses SQLite with two tables:

### Users Table
- `id` - Primary key
- `username` - Unique username
- `created_at` - Account creation timestamp

### UserConfigs Table
- `id` - Primary key
- `user_id` - Foreign key to Users (unique)
- `config` - JSON configuration stored as text
- `updated_at` - Last update timestamp

Database file: `users.db` (created automatically on first run)

## Error Handling

All errors return JSON:

```json
{
  "detail": "Error message here"
}
```

Common status codes:
- `200` - Success
- `400` - Bad request (invalid input)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not found
- `500` - Server error

## Security Notes

⚠️ **For Production:**

1. Change `SECRET_KEY` in `auth.py` to a secure random string
2. Use environment variables for sensitive data
3. Enable HTTPS
4. Add rate limiting
5. Consider using a production database (PostgreSQL, MySQL)
6. Implement password hashing if adding password auth

## Project Structure

```
backend/
├── main.py           # FastAPI app entry point
├── database.py       # Database setup and session
├── models.py         # SQLAlchemy models
├── schemas.py        # Pydantic schemas for validation
├── auth.py           # JWT authentication utilities
├── routes.py         # API route handlers
├── requirements.txt  # Python dependencies
└── users.db          # SQLite database (auto-created)
```
