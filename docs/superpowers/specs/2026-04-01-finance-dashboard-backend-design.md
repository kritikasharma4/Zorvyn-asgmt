# Finance Dashboard Backend - Design Document

**Date:** 2026-04-01  
**Project:** Finance Data Processing and Access Control Backend  
**Tech Stack:** NestJS + MySQL + TypeORM + JWT + Swagger  
**Author:** Design Phase  

---

## 1. Project Overview

Building a finance dashboard backend system that supports:
- Multi-role user management (Viewer, Analyst, Admin)
- Financial record management (income/expense tracking)
- Dashboard analytics and summaries
- Role-based access control (RBAC)
- JWT authentication
- Comprehensive API documentation

**Evaluation Focus:** Backend design, logical thinking, code quality, access control implementation, and data modeling.

---

## 2. Requirements Mapping

### Core Requirements (from assignment):

| Requirement | Implementation |
|-------------|-----------------|
| User & Role Management | Users module with role enum (viewer/analyst/admin), status field |
| Financial Records CRUD | Records module with create, read, update, delete, filtering |
| Dashboard Summary APIs | Analytics module with 5 summary endpoints |
| Access Control Logic | RoleGuard + @Roles() decorator with permission matrix |
| Validation & Error Handling | class-validator DTOs + global exception filter |
| Data Persistence | MySQL database with TypeORM ORM and migrations |

### Recommended Features (included in scope):

| Feature | Implementation |
|---------|-----------------|
| JWT Authentication | @nestjs/jwt + AuthGuard for protected routes |
| Pagination | Query params (page, limit) on record listing |
| API Documentation | Swagger/OpenAPI with @nestjs/swagger |
| README | Setup, assumptions, API usage, project structure |

---

## 3. Architecture

### Layered Architecture with Repository Pattern

```
HTTP Request
    ↓
Controllers (route handling, request validation)
    ↓
Guards (AuthGuard for JWT, RoleGuard for role-based access)
    ↓
Services (business logic, orchestration, calculations)
    ↓
Repositories (data access layer, database queries)
    ↓
TypeORM Entities & Database
    ↓
MySQL Database
```

### Design Principles

- **Separation of Concerns:** Each layer has single responsibility
- **Repository Pattern:** Services don't know about SQL; repositories handle all database access
- **Testability:** Each layer can be tested independently
- **Maintainability:** Clear boundaries make code changes isolated
- **Scalability:** Easy to add features without affecting existing code

---

## 4. Data Model

### Users Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('viewer', 'analyst', 'admin') NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted)
);
```

**Fields:**
- `id`: Primary key, auto-increment
- `email`: Unique identifier for login
- `password_hash`: Bcrypt hashed password
- `name`: User display name
- `role`: One of viewer/analyst/admin (defines permissions, **cannot be changed**)
- `status`: active/inactive (enforcement at service layer)
- `is_deleted`: Soft delete flag (user cannot login if true)
- `created_at`, `updated_at`: Audit timestamps

---

### Records Table

```sql
CREATE TABLE records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  category VARCHAR(100) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  date DATE NOT NULL,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_date (date),
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_currency (currency),
  INDEX idx_is_deleted (is_deleted)
);
```

**Fields:**
- `id`: Primary key, auto-increment
- `user_id`: Foreign key to users (record owner)
- `amount`: Transaction amount (decimal 15,2 for precision)
- `type`: income or expense (enum, **immutable** after creation)
- `category`: Categorization, stored lowercase (immutable after creation)
- `currency`: Currency code (e.g., 'USD', 'EUR', 'INR', immutable after creation)
- `date`: Transaction date, past/present only (immutable after creation)
- `notes`: Optional description (updatable)
- `is_deleted`: Soft delete flag (records marked deleted, not removed)
- `created_at`, `updated_at`: Audit timestamps

**Immutable Fields (cannot be updated):** type, category, date, currency, user_id  
**Mutable Fields (can be updated):** amount, notes

**Indexes:** User queries, date ranges, type/category filters, soft delete flag for active records query.

---

### Categories Table

```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_name (name)
);
```

**Fields:**
- `id`: Primary key, auto-increment
- `name`: Category name (e.g., 'salary', 'groceries', 'rent')
- `created_at`: When category was created

**Initial Categories (seeded on migration):**
- salary
- groceries
- rent
- utilities
- investment
- medical
- entertainment
- other

**Admin can add new categories via `POST /admin/categories` endpoint**

---

### Analyst Field Visibility Configuration Table

```sql
CREATE TABLE analyst_visibility_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  field_name VARCHAR(100) NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_field (field_name)
);
```

**Fields:**
- `id`: Primary key
- `field_name`: Field name (amount, type, category, date, notes, user)
- `is_visible`: Whether field is visible to analysts
- `updated_at`: Last updated timestamp

**Initial Configuration (all visible):**
- amount: true
- type: true
- category: true
- date: true
- notes: true
- user: true

**Admin updates via `POST /admin/analytics/visibility-config`**

---

### System Configuration Table

```sql
CREATE TABLE system_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key VARCHAR(100) UNIQUE NOT NULL,
  value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_key (key)
);
```

**Fields:**
- `id`: Primary key
- `key`: Configuration key (e.g., 'max_users', 'system_currency')
- `value`: Configuration value (e.g., '100', 'USD')
- `updated_at`: Last updated timestamp

**Predefined Configs:**
- `max_users`: Maximum number of users allowed (default: 100)
- `system_currency`: System's active currency (default: 'USD')

**Admin manages via endpoints:**
- `POST /admin/config/max-users` — Set user limit
- `GET /admin/config/max-users` — Get current limit
- `POST /admin/config/currency` — Set system currency
- `GET /admin/config/currency` — Get current currency

---

## 5. Role Assignment Strategy

### How Roles Are Assigned

**Three ways users get roles:**

#### 1. Self-Registration (Public)
- User signs up via `POST /auth/register`
- Automatically assigned role: **`analyst`** (hardcoded default)
- Why analyst? Middle ground — can create records but not dangerous
- No admin role selection during signup

**Flow:**
```
User signup → Default role 'analyst' assigned → User can create/update own records
```

#### 2. Admin Creation (Protected)
- Existing admin uses `POST /users` endpoint
- Admin can explicitly set role: `viewer`, `analyst`, or `admin`
- Only admin can access this endpoint (RoleGuard enforces)

**Flow:**
```
Admin request → RoleGuard checks 'admin' role → Create user with specified role
```

#### 3. Initial Bootstrap (One-time setup)
- Very first admin is created via **database seed script** before app goes live
- Run once: `npm run seed:admin`
- Inserts admin user directly into database
- After that, existing admins can create more admins

**Flow:**
```
Backend dev runs seed script → Direct DB insert → First admin user created
```

### Role Assignment Summary

| Scenario | Endpoint | Who Can Do It | Role Assigned | Default? |
|----------|----------|---------------|---------------|----------|
| User signs up | `POST /auth/register` | Anyone (public) | `analyst` | Yes |
| Admin creates user | `POST /users` | Existing admin | Any (viewer/analyst/admin) | No |
| Initial admin | Database seed | Backend dev (one-time) | `admin` | N/A |

### Why This Design?

1. **Safe defaults:** New signups get `analyst` (can use app, can't break things)
2. **Admin control:** Admins can create other roles as needed
3. **Bootstrap problem solved:** Seed script handles "first admin" chicken-and-egg problem
4. **Real-world:** Matches how most multi-tenant systems work

---

## 6. Authentication & Authorization

### JWT Authentication

**Flow:**
1. User sends email + password to `POST /auth/register` or `POST /auth/login`
2. Backend validates credentials (login) or creates account (register)
3. Backend generates JWT token with payload: `{ userId, email, role, iat, exp }`
4. Client receives token, stores in header: `Authorization: Bearer <token>`
5. AuthGuard validates token on every protected request
6. If invalid/expired: 401 Unauthorized

**Token Configuration:**
- Secret: Stored in `.env` file
- Expiry: 24 hours (configurable)
- Algorithm: HS256

**Implementation:**
- `@nestjs/jwt` for token generation/validation
- `@nestjs/passport` with JWT strategy
- `JwtAuthGuard` applies to all protected routes
- Public routes: `/auth/register`, `/auth/login`

---

### Role-Based Access Control (RBAC)

**Three Roles with Clear Permissions:**

| Endpoint | Viewer | Analyst | Admin |
|----------|--------|---------|-------|
| POST /auth/register | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ |
| POST /users | ❌ | ❌ | ✅ |
| GET /users | ❌ | ❌ | ✅ |
| GET /users/:id | ❌ | ❌ | ✅ |
| PATCH /users/:id (name, status only) | ❌ | ❌ | ✅ |
| DELETE /users/:id (soft delete) | ❌ | ❌ | ✅ |
| POST /records | ❌ | ❌ | ✅ (non-admin users only) |
| GET /records (own) | ✅ | ✅ (all) | ✅ (all) |
| GET /records/:id (own) | ✅ | ✅ (any) | ✅ (any) |
| PATCH /records/:id | ❌ | ❌ | ✅ |
| DELETE /records/:id (soft delete) | ❌ | ❌ | ✅ |
| GET /analytics/summary | ✅ (own) | ✅ (all) | ✅ (all) |
| GET /analytics/* | ✅ (own) | ✅ (all) | ✅ (all) |
| GET /admin/analytics/* | ❌ | ❌ | ✅ (includes soft-deleted) |
| POST /admin/categories | ❌ | ❌ | ✅ |
| GET /admin/categories | ❌ | ❌ | ✅ |
| POST /admin/analytics/visibility-config | ❌ | ❌ | ✅ |
| GET /admin/analytics/visibility-config | ❌ | ❌ | ✅ |

**Implementation:**
```typescript
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('analyst', 'admin')
@Post('records')
createRecord(@Body() dto: CreateRecordDto) { }
```

- `JwtAuthGuard`: Validates JWT token
- `RoleGuard`: Checks if user's role is in @Roles()
- Service layer additionally validates ownership (analysts update own records only)

---

## 6. API Endpoints

### Authentication Endpoints

#### POST /auth/register
**Description:** Create new user account (public, self-signup)

**Note:** User automatically gets assigned role `analyst` (default role for self-signup)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "analyst",
  "status": "active"
}
```

**Errors:** 400 (bad input), 409 (email exists)

---

#### POST /auth/login
**Description:** Authenticate and get JWT token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "analyst"
  }
}
```

**Errors:** 400 (bad input), 401 (invalid credentials)

---

### Users Endpoints (Admin only)

#### POST /users
**Description:** Create user with specific role (admin only endpoint)

**Guards:** JwtAuthGuard, RoleGuard  
**Roles:** admin only

**Purpose:** Admin creates other users (can be viewer, analyst, or admin) with specific roles

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Smith",
  "role": "analyst"
}
```

**Response (201):**
```json
{
  "id": 2,
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "role": "analyst",
  "status": "active"
}
```

**Errors:** 401 (not authenticated), 403 (not admin), 400 (bad input), 409 (email exists)

---

#### GET /users
**Description:** List all users with pagination

**Query Params:** page (default 1), limit (default 20, max 100)

**Response (200):**
```json
{
  "data": [
    { "id": 1, "email": "user@example.com", "name": "John", "role": "analyst", "status": "active" },
    { "id": 2, "email": "viewer@example.com", "name": "Jane", "role": "viewer", "status": "active" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

#### GET /users/:id
**Description:** Get specific user details

**Response (200):** User object

---

#### PATCH /users/:id
**Description:** Update user (name, status only - role cannot be changed)

**Request:**
```json
{
  "name": "John Updated",
  "status": "inactive"
}
```

**Response (200):** Updated user object

**Note:** Role cannot be updated. To change a user's role, create new user with new role and delete old user.

---

#### DELETE /users/:id
**Description:** Soft delete user (mark as deleted, keep all data)

**Guards:** JwtAuthGuard, RoleGuard  
**Roles:** admin only

**Response (200):** { message: "User deleted" }

**Implementation:** Set `is_deleted = true`, user cannot login but records remain

**Errors:** 404 (user not found)

---

### Records Endpoints

#### POST /records
**Description:** Create financial record

**Guards:** JwtAuthGuard, RoleGuard  
**Roles:** admin only

**Note:** Admin can create records for non-admin users (viewer/analyst) but not for other admins

**Request:**
```json
{
  "user_id": 2,
  "amount": 5000.00,
  "type": "income",
  "category": "salary",
  "date": "2024-03-01",
  "notes": "Monthly salary"
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "amount": 5000.00,
  "type": "income",
  "category": "salary",
  "date": "2024-03-01",
  "notes": "Monthly salary",
  "created_at": "2024-03-15T10:30:00Z"
}
```

**Errors:** 400 (validation), 401 (unauthorized), 403 (forbidden)

---

#### GET /records
**Description:** List records with filtering and pagination

**Query Params:**
- `page`: Page number (default 1)
- `limit`: Records per page (default 20, max 100)
- `type`: 'income' | 'expense' (optional filter)
- `category`: Category string (optional filter)
- `fromDate`: YYYY-MM-DD (optional filter)
- `toDate`: YYYY-MM-DD (optional filter)

**Access Control:**
- Viewers: See only their own records
- Analysts/Admins: See all records (or filter by type/category/date)

**Response (200):**
```json
{
  "data": [
    { "id": 1, "user_id": 1, "amount": 5000.00, "type": "income", "category": "salary", "date": "2024-03-01" },
    { "id": 2, "user_id": 1, "amount": 50.00, "type": "expense", "category": "groceries", "date": "2024-03-02" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

#### GET /records/:id
**Description:** Get single record

**Access Control:** User can view own or admin/analyst can view any

**Response (200):** Record object

**Errors:** 404 (not found), 403 (forbidden - record belongs to another user)

---

#### PATCH /records/:id
**Description:** Update record (admin only, limited fields)

**Guards:** JwtAuthGuard, RoleGuard  
**Roles:** admin only

**Updatable Fields:** amount, notes only

**Request:**
```json
{
  "amount": 5500.00,
  "notes": "Corrected amount - bonus included"
}
```

**Response (200):** Updated record object

**Immutable Fields (cannot be updated):**
- type (income/expense)
- category
- date
- currency
- user_id

**Errors:** 400 (trying to update immutable field), 403 (not admin), 404 (not found)

---

#### DELETE /records/:id
**Description:** Soft delete record

**Roles:** admin only

**Response (200):** { message: "Record deleted" }

**Implementation:** Set `is_deleted = true` (not removed from DB)

---

### Analytics Endpoints

**Note:** Two sets of analytics endpoints:
1. **Regular endpoints** — excludes soft-deleted records (for viewer/analyst)
2. **Admin endpoints** — includes soft-deleted records (admin only)

---

#### GET /analytics/summary
**Description:** Dashboard summary - totals and net balance (excludes soft-deleted)

**Response (200):**
```json
{
  "totalIncome": 15000.00,
  "totalExpense": 2500.00,
  "netBalance": 12500.00
}
```

**Data Scope:** 
- Viewer: Own records only
- Analyst: All records
- Admin: All records

---

#### GET /analytics/category-breakdown
**Description:** Income and expense totals by category

**Response (200):**
```json
[
  { "category": "salary", "income": 15000.00, "expense": 0, "net": 15000.00 },
  { "category": "groceries", "income": 0, "expense": 500.00, "net": -500.00 },
  { "category": "rent", "income": 0, "expense": 2000.00, "net": -2000.00 }
]
```

---

#### GET /analytics/recent-activity
**Description:** Last 10 records with pagination

**Query Params:** page, limit

**Response (200):**
```json
{
  "data": [
    { "id": 45, "amount": 100.00, "type": "expense", "category": "utilities", "date": "2024-03-15" },
    { "id": 44, "amount": 5000.00, "type": "income", "category": "salary", "date": "2024-03-01" }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

#### GET /analytics/monthly-trends
**Description:** Monthly income/expense breakdown

**Query Params:** year (default current), month (optional filter)

**Response (200):**
```json
[
  { "month": "2024-01", "income": 5000.00, "expense": 1500.00, "net": 3500.00 },
  { "month": "2024-02", "income": 5000.00, "expense": 1000.00, "net": 4000.00 },
  { "month": "2024-03", "income": 5000.00, "expense": 800.00, "net": 4200.00 }
]
```

---

#### GET /analytics/weekly-trends
**Description:** Weekly income/expense breakdown

**Query Params:** year, week (optional)

**Response (200):**
```json
[
  { "week": "Week 1, 2024", "income": 1200.00, "expense": 300.00, "net": 900.00 },
  { "week": "Week 2, 2024", "income": 1300.00, "expense": 350.00, "net": 950.00 }
]
```

---

### Admin-Only Analytics Endpoints (Includes Soft-Deleted Records)

#### GET /admin/analytics/summary
**Description:** Dashboard summary including soft-deleted records (admin only)

**Guards:** JwtAuthGuard, RoleGuard  
**Roles:** admin

**Response (200):** Same as `/analytics/summary` but includes soft-deleted records

---

#### GET /admin/analytics/category-breakdown
**Description:** Category breakdown including soft-deleted records (admin only)

**Response (200):** Same as `/analytics/category-breakdown` but includes soft-deleted records

---

#### GET /admin/analytics/recent-activity
**Description:** Recent activity including soft-deleted records (admin only)

**Response (200):** Same as `/analytics/recent-activity` but includes soft-deleted records

---

#### GET /admin/analytics/monthly-trends
**Description:** Monthly trends including soft-deleted records (admin only)

**Response (200):** Same as `/analytics/monthly-trends` but includes soft-deleted records

---

#### GET /admin/analytics/weekly-trends
**Description:** Weekly trends including soft-deleted records (admin only)

**Response (200):** Same as `/analytics/weekly-trends` but includes soft-deleted records

---

### Categories Management Endpoints (Admin Only)

#### POST /admin/categories
**Description:** Add new category to predefined list (admin only)

**Guards:** JwtAuthGuard, RoleGuard  
**Roles:** admin

**Request:**
```json
{
  "name": "subscriptions"
}
```

**Response (201):**
```json
{
  "id": 9,
  "name": "subscriptions",
  "created_at": "2024-03-15T10:30:00Z"
}
```

**Errors:** 400 (bad input), 409 (category already exists)

---

#### GET /admin/categories
**Description:** List all predefined categories (admin only)

**Response (200):**
```json
[
  { "id": 1, "name": "salary" },
  { "id": 2, "name": "groceries" },
  { "id": 3, "name": "rent" },
  { "id": 4, "name": "utilities" },
  { "id": 5, "name": "investment" },
  { "id": 6, "name": "medical" },
  { "id": 7, "name": "entertainment" },
  { "id": 8, "name": "other" }
]
```

---

### Analyst Field Visibility Configuration (Admin Only)

#### POST /admin/analytics/visibility-config
**Description:** Configure which fields analysts can see when viewing other users' records

**Guards:** JwtAuthGuard, RoleGuard  
**Roles:** admin

**Request:**
```json
{
  "amount": true,
  "type": true,
  "category": true,
  "date": true,
  "notes": false,
  "user": true
}
```

**Response (201):**
```json
{
  "amount": true,
  "type": true,
  "category": true,
  "date": true,
  "notes": false,
  "user": true,
  "updated_at": "2024-03-15T10:30:00Z"
}
```

**Fields that can be toggled:**
- `amount` — Show/hide transaction amount
- `type` — Show/hide income/expense type
- `category` — Show/hide category
- `date` — Show/hide transaction date
- `notes` — Show/hide notes/description
- `user` — Show/hide which user the record belongs to

**Default:** All fields `true` (visible) until admin configures

---

#### GET /admin/analytics/visibility-config
**Description:** Get current analyst field visibility configuration

**Response (200):** Same as POST response above

---

### System Configuration Endpoints (Admin Only)

#### POST /admin/config/max-users
**Description:** Set maximum users limit for system

**Guards:** JwtAuthGuard, RoleGuard  
**Roles:** admin

**Request:**
```json
{
  "max_users": 100
}
```

**Response (200):**
```json
{
  "key": "max_users",
  "value": "100",
  "updated_at": "2024-03-15T10:30:00Z"
}
```

**Validation:** Value must be positive integer, >= 1

---

#### GET /admin/config/max-users
**Description:** Get current maximum users limit

**Response (200):**
```json
{
  "key": "max_users",
  "value": "100"
}
```

---

#### POST /admin/config/currency
**Description:** Set system's active currency

**Guards:** JwtAuthGuard, RoleGuard  
**Roles:** admin

**Request:**
```json
{
  "currency": "USD"
}
```

**Response (200):**
```json
{
  "key": "system_currency",
  "value": "USD",
  "updated_at": "2024-03-15T10:30:00Z"
}
```

**Validation:** Must be valid currency code (USD, EUR, INR, GBP, etc.)

**Note:** Changing currency validates that no records exist with different currency (prevents mixing)

---

#### GET /admin/config/currency
**Description:** Get current system currency

**Response (200):**
```json
{
  "key": "system_currency",
  "value": "USD"
}
```

---

## 7. Input Validation

Using `class-validator` decorators on DTOs:

### CreateUserDto
```typescript
class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @Length(1, 255)
  name: string;

  @IsEnum(['viewer', 'analyst', 'admin'])
  role: string;
}
```

### CreateRecordDto
```typescript
class CreateRecordDto {
  @IsNumber()
  @IsOptional() // Only required for admin creating for others
  user_id?: number;

  @IsNumber()
  @Min(0.01)
  @Max(999999999.99)
  amount: number;

  @IsEnum(['income', 'expense'])
  type: string;

  @IsString()
  @Length(1, 100)
  @ValidateCategory() // Custom validator to check if category exists
  category: string;

  @IsString()
  @Length(3, 3)
  @ValidateCurrency() // Custom validator to check if currency matches system currency
  currency: string;

  @IsDateString()
  @MaxDate() // Cannot be future date
  date: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}
```

**Note:** 
- For admin creation: user_id is optional (if not provided, defaults to admin's own ID)
- category is validated against the categories table
- currency must match system currency (set by admin)
- date cannot be today or later
- Immutable fields: type, category, currency, date (cannot be changed after creation)

### RecordFilterDto
```typescript
class RecordFilterDto {
  @IsOptional()
  @IsEnum(['income', 'expense'])
  type?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

**Validation Pipe:** Auto-validates all DTOs, returns 400 with detailed errors on validation failure.

---

## 8. Error Handling

### HTTP Status Codes

- **200 OK** — Request successful
- **201 Created** — Resource created
- **400 Bad Request** — Validation error, missing/invalid fields
- **401 Unauthorized** — Missing/invalid JWT token
- **403 Forbidden** — Authenticated but not authorized (role/ownership mismatch)
- **404 Not Found** — Resource doesn't exist
- **409 Conflict** — Email already exists (duplicate)
- **500 Internal Server Error** — Server error

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "amount",
      "message": "amount must be greater than 0"
    }
  ]
}
```

### Custom Exceptions

- `BadRequestException` — Validation errors
- `UnauthorizedException` — Not authenticated (no/invalid token)
- `ForbiddenException` — Not authorized (role/ownership check failed)
- `NotFoundException` — Resource missing
- `ConflictException` — Duplicate email

**Global Error Filter:** Catches all exceptions, formats response consistently

---

## 9. Project Structure

```
finance-dashboard-backend/
├── src/
│   ├── main.ts                          # Entry point, Swagger setup
│   ├── app.module.ts                    # Root module, imports all
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts              # Register, login, validation
│   │   ├── auth.controller.ts           # POST /auth/register, /auth/login
│   │   ├── jwt.strategy.ts              # Passport JWT strategy
│   │   ├── dtos/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   └── interfaces/
│   │       └── jwt-payload.interface.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts             # Business logic for users
│   │   ├── users.controller.ts          # User endpoints (admin)
│   │   ├── users.repository.ts          # Database queries for users
│   │   ├── entities/
│   │   │   └── user.entity.ts           # User entity definition
│   │   └── dtos/
│   │       ├── create-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       └── user.dto.ts
│   │
│   ├── records/
│   │   ├── records.module.ts
│   │   ├── records.service.ts           # CRUD, filtering, access control
│   │   ├── records.controller.ts        # Record endpoints
│   │   ├── records.repository.ts        # Database queries (find, save, delete)
│   │   ├── entities/
│   │   │   └── record.entity.ts         # Record entity definition
│   │   └── dtos/
│   │       ├── create-record.dto.ts
│   │       ├── update-record.dto.ts
│   │       ├── record-filter.dto.ts
│   │       └── record.dto.ts
│   │
│   ├── config/
│   │   ├── config.module.ts
│   │   ├── config.service.ts            # System config management
│   │   ├── config.controller.ts         # Admin config endpoints
│   │   ├── config.repository.ts         # Database queries
│   │   ├── entities/
│   │   │   └── system-config.entity.ts
│   │   └── dtos/
│   │       ├── set-max-users.dto.ts
│   │       └── set-currency.dto.ts
│   │
│   ├── categories/
│   │   ├── categories.module.ts
│   │   ├── categories.service.ts        # CRUD for categories
│   │   ├── categories.controller.ts     # Admin category endpoints
│   │   ├── categories.repository.ts     # Database queries
│   │   ├── entities/
│   │   │   └── category.entity.ts
│   │   └── dtos/
│   │       └── create-category.dto.ts
│   │
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   ├── analytics.service.ts         # Aggregations, trends
│   │   ├── analytics.controller.ts      # Regular analytics endpoints
│   │   ├── admin-analytics.controller.ts # Admin analytics endpoints
│   │   ├── visibility-config.service.ts # Field visibility logic
│   │   ├── visibility-config.repository.ts
│   │   ├── entities/
│   │   │   └── visibility-config.entity.ts
│   │   └── dtos/
│   │       ├── summary.dto.ts
│   │       ├── category-breakdown.dto.ts
│   │       ├── trend.dto.ts
│   │       ├── recent-activity.dto.ts
│   │       └── visibility-config.dto.ts
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts        # Validates JWT token
│   │   │   └── role.guard.ts            # Validates user role
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts       # @Roles() decorator
│   │   ├── exceptions/
│   │   │   └── custom-exceptions.ts     # Custom error classes
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts # Global error handler
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts       # Input validation
│   │   └── interfaces/
│   │       └── index.ts
│   │
│   ├── database/
│   │   ├── database.module.ts           # TypeORM setup
│   │   ├── typeorm.config.ts            # Database configuration
│   │   ├── migrations/
│   │   │   ├── 1704067200000-CreateUsersTable.ts
│   │   │   ├── 1704067300000-CreateRecordsTable.ts
│   │   │   ├── 1704067400000-CreateCategoriesTable.ts
│   │   │   ├── 1704067500000-CreateVisibilityConfigTable.ts
│   │   │   └── 1704067600000-CreateSystemConfigTable.ts
│   │   └── seeds/
│   │       ├── admin.seed.ts            # Initial admin creation
│   │       ├── categories.seed.ts       # Predefined categories
│   │       ├── visibility.seed.ts       # Default visibility config
│   │       └── system-config.seed.ts    # Default system config
│   │
│   └── config/
│       └── env.ts                       # Environment variables
│
├── test/                                # Tests (optional)
│   ├── auth.spec.ts
│   ├── users.spec.ts
│   ├── records.spec.ts
│   └── analytics.spec.ts
│
├── .env.example                         # Environment template
├── .env                                 # (git ignored) Local environment
├── .gitignore
├── docker-compose.yml                   # MySQL setup (optional)
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md                            # Setup & documentation
```

---

## 10. Database Setup & Migrations

### TypeORM Configuration

**typeorm.config.ts:**
```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'finance_db',
  entities: [__dirname + '/../**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  migrationsRun: true, // Auto-run migrations on startup
  synchronize: false, // Don't auto-create schema; use migrations
  logging: process.env.NODE_ENV === 'development',
};
```

### Migrations

**1. Create Users Table**
```typescript
// CreateUsersTable.ts
export class CreateUsersTable implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          new TableColumn({ name: 'id', type: 'int', isPrimary: true, isGenerated: true }),
          new TableColumn({ name: 'email', type: 'varchar', isUnique: true }),
          new TableColumn({ name: 'password_hash', type: 'varchar' }),
          new TableColumn({ name: 'name', type: 'varchar' }),
          new TableColumn({ name: 'role', type: 'enum', enum: ['viewer', 'analyst', 'admin'] }),
          new TableColumn({ name: 'status', type: 'enum', enum: ['active', 'inactive'], default: "'active'" }),
          new TableColumn({ name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }),
          new TableColumn({ name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }),
        ],
        indices: [
          new TableIndex({ columnNames: ['email'] }),
          new TableIndex({ columnNames: ['status'] }),
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

**2. Create Records Table**
```typescript
// CreateRecordsTable.ts
export class CreateRecordsTable implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'records',
        columns: [
          new TableColumn({ name: 'id', type: 'int', isPrimary: true, isGenerated: true }),
          new TableColumn({ name: 'user_id', type: 'int' }),
          new TableColumn({ name: 'amount', type: 'decimal', precision: 15, scale: 2 }),
          new TableColumn({ name: 'type', type: 'enum', enum: ['income', 'expense'] }),
          new TableColumn({ name: 'category', type: 'varchar', length: '100' }),
          new TableColumn({ name: 'date', type: 'date' }),
          new TableColumn({ name: 'notes', type: 'text', isNullable: true }),
          new TableColumn({ name: 'is_deleted', type: 'boolean', default: false }),
          new TableColumn({ name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }),
          new TableColumn({ name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }),
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['user_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          }),
        ],
        indices: [
          new TableIndex({ columnNames: ['user_id'] }),
          new TableIndex({ columnNames: ['date'] }),
          new TableIndex({ columnNames: ['type'] }),
          new TableIndex({ columnNames: ['category'] }),
          new TableIndex({ columnNames: ['is_deleted'] }),
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('records');
  }
}
```

**Running Migrations:**
```bash
npm run typeorm migration:generate -- -n <migration-name>
npm run typeorm migration:run
npm run typeorm migration:revert
```

### Database Seed Script

**Purpose:** Create the initial admin user for bootstrap

**File:** `src/database/seeds/admin.seed.ts`

**Example:**
```typescript
import { Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/users/users.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminSeedService {
  constructor(private usersRepository: UsersRepository) {}

  async seed() {
    const existingAdmin = await this.usersRepository.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin already exists. Skipping seed.');
      return;
    }

    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await this.usersRepository.save({
      email: 'admin@financedashboard.com',
      password_hash: hashedPassword,
      name: 'System Admin',
      role: 'admin',
      status: 'active'
    });

    console.log('Admin user created:', admin.email);
  }
}
```

**Running the seed:**
```bash
# CLI command to run seed
npm run seed:admin
```

**Details:**
- Checks if any admin already exists (idempotent)
- If admin exists, skips creation
- If no admin exists, creates one with hardcoded credentials
- Run **once** before app goes live
- After first admin exists, they can create other admins via API

---

## 11. Service Layer Logic

### AuthService

**Responsibilities:**
- Hash password (bcrypt)
- Register: validate email uniqueness, create user
- Login: verify credentials, generate JWT token
- JWT validation

**Key Methods:**
- `register(dto)` → User
- `login(email, password)` → { access_token, user }
- `validateUser(payload)` → User (for JWT strategy)

---

### UsersService

**Responsibilities:**
- CRUD operations on users
- Role assignment validation
- Status management

**Key Methods:**
- `create(dto)` → User
- `findAll(pagination)` → { data, pagination }
- `findOne(id)` → User
- `update(id, dto)` → User
- `delete(id)` → void

---

### RecordsService

**Responsibilities:**
- CRUD with access control (admin only creation)
- Apply role-based filtering (viewers see own, analysts see all)
- Support filtering by date, category, type
- Pagination
- Soft delete and restore (admin only)
- Respect soft-delete flag in queries

**Key Methods:**
- `create(userId, dto)` → Record (admin only, can specify any user_id except other admins)
- `findAll(userId, role, filters, pagination, includeSoftDeleted)` → { data, pagination }
- `findOne(id, userId, role)` → Record (with access check)
- `update(id, dto)` → Record (admin only)
- `softDelete(id)` → void (admin only)
- `restore(id)` → void (admin only, restore soft-deleted record)

**Access Control Logic:**
```typescript
async findAll(userId: number, role: string, filters, pagination, includeSoftDeleted = false) {
  let query = this.recordsRepository
    .createQueryBuilder('record');

  // Soft delete filter
  if (!includeSoftDeleted) {
    query = query.where('record.is_deleted = :isDeleted', { isDeleted: false });
  }

  // Role-based filtering
  if (role === 'viewer') {
    query = query.andWhere('record.user_id = :userId', { userId });
  }

  // Additional filters
  if (filters.type) query = query.andWhere('record.type = :type', { type: filters.type });
  if (filters.category) query = query.andWhere('record.category = :category', { category: filters.category });
  if (filters.fromDate) query = query.andWhere('record.date >= :fromDate', { fromDate: filters.fromDate });
  if (filters.toDate) query = query.andWhere('record.date <= :toDate', { toDate: filters.toDate });

  return query.paginate(pagination);
}
```

---

### CategoriesService

**Responsibilities:**
- Manage predefined categories
- Create new categories (admin only)
- List all categories
- Validate category exists when used in records

**Key Methods:**
- `create(name)` → Category
- `findAll()` → Category[]
- `findByName(name)` → Category
- `validateCategory(name)` → boolean

---

### AnalyticsService

**Responsibilities:**
- Aggregate data (sum, group by)
- Calculate trends (monthly, weekly)
- Respect user's data scope
- Handle soft-deleted records appropriately
- Apply field visibility rules for analysts

**Key Methods:**
- `getSummary(userId, role, includeSoftDeleted)` → { totalIncome, totalExpense, netBalance }
- `getCategoryBreakdown(userId, role, includeSoftDeleted)` → Category[]
- `getRecentActivity(userId, role, pagination, includeSoftDeleted)` → { data, pagination }
- `getMonthlyTrends(userId, role, year, includeSoftDeleted)` → Trend[]
- `getWeeklyTrends(userId, role, year, includeSoftDeleted)` → Trend[]
- `applyFieldVisibility(records, role)` → Records with fields filtered

---

### VisibilityConfigService

**Responsibilities:**
- Manage analyst field visibility configuration
- Get current visibility settings
- Update visibility settings
- Apply visibility filters to record data

**Key Methods:**
- `getConfig()` → VisibilityConfig
- `updateConfig(config)` → VisibilityConfig
- `applyVisibility(record, role)` → Record (with fields filtered based on config)

---

## 12. Security Considerations

1. **Password Security:** Bcrypt hashing (salted, 10 rounds)
2. **JWT Token:** 24-hour expiry, HS256 algorithm, secret in env
3. **SQL Injection:** TypeORM parameterized queries
4. **Access Control:** Guards + service-layer validation
5. **Data Validation:** class-validator on all inputs
6. **Soft Delete:** Records marked deleted, not removed (recoverable)
7. **HTTPS:** Required in production (handled by reverse proxy)
8. **CORS:** Restrict to frontend domain (env-based config)

---

## 13. Documentation (README)

The README will include:

1. **Project Overview**
   - What it does, key features, tech stack

2. **Prerequisites**
   - Node.js 18+, MySQL 8+, npm/yarn

3. **Setup Instructions**
   - Clone repo
   - Install: `npm install`
   - Create `.env` from `.env.example`
   - MySQL setup (local or Docker)
   - Run migrations: `npm run typeorm migration:run`
   - Create first admin: `npm run seed:admin` (one-time only)
   - Start server: `npm run start`
   - (Optional) Create more admins via API using first admin account

4. **API Documentation**
   - Link to Swagger UI: `http://localhost:3000/api/docs`
   - Example: How to login and get JWT token
   - Example requests for each endpoint

5. **Project Structure**
   - Explanation of each module and folder

6. **Assumptions Made**
   - **Role Assignment:** Users signing up via `/auth/register` get role `analyst` automatically. Role **cannot be changed** — to change role, create new user and delete old one
   - **Admin Creation:** Only existing admins can create other admins via `POST /users` endpoint. Admin cannot create records for other admins
   - **Bootstrap:** First admin is created via database seed script (one-time setup, prompts for password)
   - **Access Control:** 
     - Viewer: View own records + own analytics only
     - Analyst: View all records + all analytics, but cannot create/update/delete records
     - Admin: Full access, can create/update/delete records and manage users
   - **Soft Delete:** Records marked as deleted (is_deleted=true), not removed from DB. Users also soft deleted (is_deleted=true)
   - **Soft Delete Visibility:** Regular analytics exclude soft-deleted, admin analytics include soft-deleted
   - **Field Visibility:** Admin can configure which fields analysts see when viewing other users' records (default: all visible)
   - **JWT Expiry:** 24 hours for all roles
   - **Password Requirements:** Minimum 8 characters + uppercase + lowercase + numbers
   - **Email Verification:** No verification, users can login immediately after signup
   - **Login Lockout:** No lockout, unlimited attempts allowed
   - **Password Changes:** Admins can only change their own password, not others'
   - **Categories:** Predefined list (salary, groceries, rent, utilities, investment, medical, entertainment, other). Admin can add new categories
   - **Categories Matching:** Case-insensitive exact match
   - **Record Dates:** Past/present only, no future dates allowed
   - **Amount Range:** 0.01 to 999,999,999.99
   - **Notes:** Optional on records
   - **Analytics Data Scope:** 
     - Viewer: See own records only
     - Analyst: See all records
     - Monthly trends: Current year only
     - Weekly trends: All 52 weeks of current year
   - **Recent Activity:** Ordered by created_at (newest first)

## Data Consistency & Validation Assumptions

**Record Data:**
   - Duplicate records allowed (multiple transactions same day/category/type are valid)
   - No change history tracking (just updated_at timestamp)
   - Email is globally unique (including soft-deleted users)
   - Names can be duplicated (not unique)
   - Amounts stored as Decimal(15,2) with exact precision in calculations
   - No negative amounts allowed (> 0.01 only)
   - Record type (income/expense) cannot be changed after creation
   - Record category cannot be changed after creation
   - Record date cannot be changed after creation
   - Admin can only update: amount and notes (all other fields locked)
   - Categories can only be added, never deleted
   - Categories stored in lowercase (normalized)
   - Multiple currencies supported per record
   - System enforces single active currency (error if mixing currencies)

**User Data:**
   - Soft-deleted users cannot login
   - When user is soft-deleted, their records are also soft-deleted
   - Soft-deleted records can only be restored by admin
   - Soft-deleted records stay forever (no auto-purge)
   - Only email is unique per user (globally)
   - Multiple admin accounts allowed (no single-admin restriction)

## Business Logic Assumptions

**Logging & Audit:**
   - No login logging
   - No admin action logging
   - No user activity log feature

**Analytics & Reporting:**
   - Analysts see full breakdown: categories + individual record details
   - Viewers see only their own total summary (not individual records)
   - No records or all deleted = show zeros (not error message)
   - Admin viewing user data sees that user's analytics only (filtered)

**System Configuration:**
   - Admin can configure maximum users limit
   - Admin can set system currency
   - Only these two settings configurable (keep simple)

**Financial Rules:**
   - Income/expense calculations use exact decimal precision
   - Multiple currencies supported (each record has currency field)
   - System enforces single active currency

7. **Database Schema**
   - Tables, fields, relationships diagram

8. **Testing**
   - How to run tests (if included)

9. **Troubleshooting**
   - Common issues and solutions

---

## 14. Implementation Order

1. Project bootstrap (NestJS, dependencies, MySQL setup)
2. Database setup:
   - TypeORM configuration
   - Create all entities (Users, Records, Categories, Analyst Visibility Config, System Config)
   - Create migrations (4 tables)
   - Create seed scripts (admin user, predefined categories, default system config)
3. Common layer:
   - Guards (JwtAuthGuard, RoleGuard)
   - Decorators (@Roles())
   - Custom validators (category, currency validation)
   - Exception filters and pipes
4. Auth module:
   - AuthService (register with default analyst role, login, JWT with 24h expiry)
   - AuthController (POST /auth/register, POST /auth/login)
   - Passport JWT strategy
5. System Config module:
   - ConfigService (get/set max_users and currency)
   - ConfigController (admin endpoints for config management)
   - Validation: check max_users before creating users, validate currency
6. Categories module:
   - CategoriesService (CRUD, seeding)
   - CategoriesController (admin endpoints)
   - CategoriesRepository
7. Users module:
   - UsersService (CRUD, soft delete, role immutability)
   - UsersController (GET/POST/PATCH/DELETE users)
   - UsersRepository
   - Validation: check max_users limit
8. Records module:
   - RecordsService (admin-only creation, update [amount/notes only], soft delete, restore)
   - RecordsController (GET/POST/PATCH/DELETE records)
   - RecordsRepository with complex filtering
   - Validation: category exists, currency matches system, immutable field protection
9. Analytics module:
   - AnalyticsService (aggregations, trends, soft-delete handling)
   - AnalyticsController (regular endpoints)
   - AdminAnalyticsController (admin-only endpoints with soft-deleted)
   - VisibilityConfigService (field filtering for analysts)
   - VisibilityConfigController (admin endpoints)
10. Swagger documentation (all endpoints, schemas, examples)
11. Global error handling and validation
12. Integration testing (optional)
13. README and documentation

---

## 15. Scope Summary

**What We're Building:**
- ✅ 5 database tables (users, records, categories, analyst_visibility_config, system_config)
- ✅ 7 modules (auth, users, records, categories, analytics, common, database)
- ✅ 41 endpoints:
  - 2 auth endpoints (register, login)
  - 4 user endpoints (create, list, get, soft delete)
  - 5 record endpoints (create, list, get, update [limited], soft delete)
  - 5 regular analytics endpoints (summary, category, recent, monthly, weekly)
  - 5 admin analytics endpoints (includes soft-deleted)
  - 2 category endpoints (create, list)
  - 2 visibility config endpoints (get, post)
  - 4 system config endpoints (max-users get/post, currency get/post)
- ✅ Role-based access control with 3 roles (Viewer, Analyst, Admin)
- ✅ JWT authentication with 24-hour expiry
- ✅ Pagination and filtering with date validation
- ✅ Input validation (medium password strength, amount ranges, future date prevention)
- ✅ Soft delete for records and users
- ✅ Predefined and customizable categories
- ✅ Admin-configurable analyst field visibility
- ✅ Error handling and validation
- ✅ Swagger API documentation
- ✅ Clean layered architecture with repository pattern
- ✅ MySQL persistence with migrations
- ✅ Database seed script for initial admin

**NOT in scope:**
- Unit/integration tests
- Search functionality
- Rate limiting
- Audit logging (detailed action tracking)
- Advanced analytics (machine learning, predictions)
- Frontend application
- Email verification
- Login attempt lockout

---

## 16. Success Criteria

- ✅ All 6 core requirements implemented
- ✅ All 4 recommended features included
- ✅ Code is clean, readable, maintainable
- ✅ Access control logic is clear and enforced
- ✅ Database queries are optimized (indexes on common filters)
- ✅ API documentation is complete (Swagger)
- ✅ README explains setup, assumptions, API usage
- ✅ Error handling is consistent and informative
- ✅ Input validation catches bad data
- ✅ Repository pattern clearly separates layers

---

## 16. Key Business Rules Summary

**Authentication & Users:**
- Password: min 8 chars + uppercase + lowercase + numbers
- Roles: viewer, analyst, admin (cannot be changed after assignment)
- Soft delete users: keep data, prevent login, cascade soft-delete their records
- Admins can only change their own password
- Admins cannot create records for other admins
- Multiple admin accounts allowed
- Email globally unique (including soft-deleted)
- Names can be duplicated

**Financial Records:**
- Only admins can create records (for non-admin users only)
- Categories: predefined list, admins can add new ones (never delete)
- Categories stored lowercase (normalized)
- Amounts: 0.01 to 999,999,999.99 (Decimal 15,2)
- Dates: past/present only, no future dates
- Currencies: stored per record, system enforces single active currency
- No negative amounts
- Duplicate records allowed (same day/category/type is valid)
- **Immutable fields after creation:** type, category, date, currency, user_id
- **Mutable fields:** amount, notes only
- Soft delete: hidden from users, visible to admins, restorable by admin only
- No auto-purge of soft-deleted records

**Access Control:**
- Viewer: view own records + own totals (summary only)
- Analyst: view all records + all analytics (full breakdown), read-only
- Admin: full access, create/update/delete records, manage users
- Admin can configure field visibility for analysts (toggle per field)
- Default visibility: all fields visible for analysts

**Analytics:**
- Regular endpoints exclude soft-deleted
- Admin endpoints include soft-deleted
- Monthly trends: current year only
- Weekly trends: all 52 weeks of current year
- Recent activity ordered by created_at (newest first)
- No records = show zeros (no error)
- All deleted = show zeros (same behavior)
- No login/admin action logging
- No user activity log

**System Configuration:**
- Admin can set max users limit (default: 100)
- Admin can set system currency (default: USD)
- Changing currency validates no mixed currencies exist
- Only these two configs (keep simple)

---

## 17. Summary of All Clarifications

**Total Business Rules Clarified: 78 questions across 6 modules**

✅ All authentication, authorization, and access control rules defined  
✅ All financial record constraints and immutability rules defined  
✅ All analytics and reporting rules defined  
✅ All data consistency and validation rules defined  
✅ All system configuration and limits defined  
✅ All soft-delete and recovery rules defined  
✅ All edge cases and data integrity rules defined  

---

**Design Document Complete & Ready for Implementation**
