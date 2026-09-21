# Zethub CRM Backend Implementation Prompts

## Overview
This document contains all backend API endpoints and database schemas needed to support the Zethub CRM admin interface. The frontend is already built with React Native and includes backend prompt integration.

---

## 1. Admin Dashboard Screen

### Backend Prompt: `fetch_dashboard_stats`

**API Endpoint**: `GET /api/admin/dashboard/stats`

**Response Format**:
```json
{
  "projects": 12,
  "users": 48,
  "payments": 156,
  "revenue": 428900,
  "activeProjects": 34,
  "pendingPayments": 12450,
  "teamUtilization": 92
}
```

**Database Queries Needed**:
```sql
-- Total projects count
SELECT COUNT(*) FROM projects;

-- Total users count  
SELECT COUNT(*) FROM users;

-- Total payments count
SELECT COUNT(*) FROM payments;

-- Revenue calculation
SELECT SUM(amount) FROM payments WHERE status = 'completed';

-- Active projects
SELECT COUNT(*) FROM projects WHERE status IN ('active', 'in_progress');

-- Pending payments
SELECT SUM(amount) FROM payments WHERE status = 'pending';

-- Team utilization (example calculation)
SELECT (COUNT(DISTINCT user_id) / (SELECT COUNT(*) FROM users WHERE role = 'team_member')) * 100 AS utilization
FROM project_assignments WHERE project_status = 'active';
```

---

## 2. Admin Members Screen

### Backend Prompt: `fetch_members`

**API Endpoint**: `GET /api/admin/members`

**Query Parameters**:
- `search` (optional): Search term for name/email/role
- `filter` (optional): Filter by status (active, pending, admin)

**Response Format**:
```json
{
  "members": [
    {
      "id": 1,
      "name": "Sarah Chen",
      "email": "sarah.chen@zethub.com",
      "role": "Admin",
      "status": "active",
      "joined": "2024-01-15T00:00:00Z",
      "avatar": "https://example.com/avatar.jpg",
      "lastActive": "2024-03-30T10:30:00Z"
    }
  ],
  "total": 48,
  "active": 32,
  "pending": 6,
  "admin": 4
}
```

**Database Schema**:
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'member') DEFAULT 'member',
  status ENUM('active', 'pending', 'inactive') DEFAULT 'pending',
  avatar_url VARCHAR(500),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Backend Prompt: `send_invite`

**API Endpoint**: `POST /api/admin/members/invite`

**Request Body**:
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Invite sent successfully",
  "inviteId": "inv_abc123",
  "expiresAt": "2024-04-30T00:00:00Z"
}
```

**Implementation Steps**:
1. Generate unique invite token
2. Create pending user record with status 'pending'
3. Send invitation email with magic link
4. Set expiration (typically 7 days)

### Backend Prompt: `edit_member`

**API Endpoint**: `PUT /api/admin/members/:id`

**Request Body**:
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "manager"
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Member updated successfully",
  "member": {
    "id": 1,
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "manager"
  }
}
```

### Backend Prompt: `delete_member`

**API Endpoint**: `DELETE /api/admin/members/:id`

**Response Format**:
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

**Implementation Notes**:
- Soft delete recommended (set status to 'inactive')
- Handle cascade deletions for project assignments
- Log deletion for audit trail

### Backend Prompt: `export_members`

**API Endpoint**: `GET /api/admin/members/export`

**Query Parameters**:
- `format`: 'csv' or 'xlsx'

**Response**: File download with headers:
```
ID,Name,Email,Role,Status,Joined,Last Active
1,Sarah Chen,sarah.chen@zethub.com,Admin,active,2024-01-15,2024-03-30
```

---

## 3. Admin Projects Screen

### Backend Prompt: `fetch_projects`

**API Endpoint**: `GET /api/admin/projects`

**Response Format**:
```json
{
  "projects": [
    {
      "id": 1,
      "name": "SaaS Platform Redesign",
      "client_name": "Acme Corp",
      "client_id": 1,
      "status": "In Progress",
      "deadline": "2026-12-12T00:00:00Z",
      "created_at": "2024-01-15T00:00:00Z",
      "updated_at": "2024-03-30T00:00:00Z",
      "budget": 50000,
      "progress": 75
    }
  ],
  "stats": {
    "active": 12,
    "pending": 4,
    "completed": 28,
    "average_velocity": 94
  }
}
```

**Database Schema**:
```sql
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  client_id INT,
  status ENUM('pending', 'active', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  deadline DATE,
  budget DECIMAL(10,2),
  progress INT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  tier ENUM('tier_1', 'tier_2', 'standard') DEFAULT 'standard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Backend Prompt: `create_project`

**API Endpoint**: `POST /api/admin/projects`

**Request Body**:
```json
{
  "name": "New Project",
  "client_id": 1,
  "deadline": "2027-01-15",
  "budget": 75000,
  "description": "Project description"
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Project created successfully",
  "project": {
    "id": 5,
    "name": "New Project",
    "client_name": "Acme Corp",
    "status": "pending",
    "deadline": "2027-01-15T00:00:00Z"
  }
}
```

### Backend Prompt: `complete_project`

**API Endpoint**: `PUT /api/admin/projects/:id/complete`

**Response Format**:
```json
{
  "success": true,
  "message": "Project marked as complete",
  "project": {
    "id": 1,
    "status": "completed",
    "completed_at": "2024-03-30T15:30:00Z"
  }
}
```

---

## 4. Admin Team Screen

### Backend Prompt: `create_user`

**API Endpoint**: `POST /api/admin/users`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@zethub.com",
  "password": "SecurePassword123!",
  "role": "team"
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 49,
    "name": "John Doe",
    "email": "john.doe@zethub.com",
    "role": "team",
    "status": "active"
  }
}
```

**Implementation Notes**:
- Hash password using bcrypt
- Send welcome email
- Set default permissions based on role

---

## 5. Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "admin",
  "permissions": ["read:projects", "write:projects", "read:users", "write:users"],
  "iat": 1640000000,
  "exp": 1640086400
}
```

### Role-Based Permissions
```javascript
const permissions = {
  admin: [
    'read:all', 'write:all', 'delete:all',
    'read:projects', 'write:projects', 'delete:projects',
    'read:users', 'write:users', 'delete:users',
    'read:payments', 'write:payments', 'delete:payments'
  ],
  manager: [
    'read:projects', 'write:projects',
    'read:users', 'write:users',
    'read:payments'
  ],
  member: [
    'read:projects', 'read:users'
  ]
};
```

---

## 6. Database Setup

### Complete Schema
```sql
-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'member') DEFAULT 'member',
  status ENUM('active', 'pending', 'inactive') DEFAULT 'pending',
  avatar_url VARCHAR(500),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tier ENUM('tier_1', 'tier_2', 'standard') DEFAULT 'standard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  client_id INT,
  status ENUM('pending', 'active', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  deadline DATE,
  budget DECIMAL(10,2),
  progress INT DEFAULT 0,
  description TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Project assignments
CREATE TABLE project_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT,
  user_id INT,
  role ENUM('lead', 'member', 'reviewer') DEFAULT 'member',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payments table
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT,
  client_id INT,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  due_date DATE,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Milestones table
CREATE TABLE milestones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending', 'in_progress', 'completed', 'approved', 'rejected') DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Audit log
CREATE TABLE audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 7. API Implementation Examples

### Express.js Setup
```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.sendStatus(403);
  }
  next();
};

// Dashboard stats endpoint
app.get('/api/admin/dashboard/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [projects, users, payments] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM projects'),
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM payments')
    ]);
    
    res.json({
      projects: projects[0].count,
      users: users[0].count,
      payments: payments[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Members endpoint
app.get('/api/admin/members', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { search, filter } = req.query;
    let query = 'SELECT * FROM users';
    const params = [];
    
    if (search) {
      query += ' WHERE name LIKE ? OR email LIKE ? OR role LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (filter && filter !== 'all') {
      query += search ? ' AND' : ' WHERE';
      if (filter === 'admin') {
        query += ' role = ?';
        params.push('admin');
      } else {
        query += ' status = ?';
        params.push(filter);
      }
    }
    
    const members = await db.query(query, params);
    res.json({ members: members });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 8. Environment Variables

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=zethub_crm

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App
APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 9. Implementation Priority

1. **Phase 1**: Authentication & User Management
   - JWT authentication
   - User CRUD operations
   - Role-based permissions

2. **Phase 2**: Core Features
   - Projects management
   - Dashboard stats
   - Member invitations

3. **Phase 3**: Advanced Features
   - Payment processing
   - Milestone tracking
   - Audit logging
   - Email notifications

---

## 10. Testing

### Sample API Calls
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zethub.com","password":"admin123"}'

# Get dashboard stats
curl -X GET http://localhost:3000/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create member
curl -X POST http://localhost:3000/api/admin/members/invite \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@zethub.com","role":"member"}'
```

This backend implementation guide provides everything needed to support the complete Zethub CRM admin interface. The frontend is already built and ready to integrate with these APIs.
