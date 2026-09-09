# CWNU University Management System - Backend

A Node.js/Express + TypeScript + Prisma university management system backend.

## Project Structure

```
cwnu-backend/
├── src/
│   ├── index.ts             # Main Express entry point
│   ├── config/              # Configuration (jwt, db, cors, rate limit)
│   │   └── prisma.ts        # PrismaClient singleton
│   ├── middleware/          # Custom middleware (auth, errorHandler, validate)
│   │   ├── auth.ts          # JWT verification, role checks
│   │   ├── errorHandler.ts  # Zod/Prisma error handling, AppError
│   │   └── validate.ts      # Zod schema validation middleware
│   ├── routes/              # Express routers for each feature
│   │   ├── auth.routes.ts   # /auth/login, /auth/register, /auth/refresh, etc.
│   │   ├── user.routes.ts   # /users/me, /users/:id/profile
│   │   ├── course.routes.ts # /courses, /courses/:id
│   │   ├── department.routes.ts # /departments, /departments/:id
│   │   ├── enrollment.routes.ts # /enrollments
│   │   ├── assignment.routes.ts # /assignments, /:id/submit, /:id/grade
│   │   ├── attendance.routes.ts # /attendance, /bulk
│   │   ├── notice.routes.ts # /notices (CRUD)
│   │   ├── dashboard.routes.ts # Role-based dashboards
│   │   └── admin.routes.ts # /admin/users, /admin/activity-log
│   └── validators/          # Zod validation schemas
│       ├── index.ts         # Export all schemas
│       └── (login, register, profile, course, department, assignment, notice, etc.)
├── prisma/
│   └── schema.prisma        # Database model definitions (30+ models)
├── package.json
├── tsconfig.json            # TypeScript configuration
└── .env                     # Environment variables (not committed)
```

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations (first time)
npx prisma migrate dev --name init

# Start development server
npx tsx src/index.ts
# or: npm run dev (if added to package.json)
```

The server will run on `http://localhost:4000` by default.

### API Documentation

Base URL: `http://localhost:4000/api/`

#### Authentication Endpoints
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset
- `POST /api/auth/password/change` - Change password (logged in)
- `GET /api/auth/me` - Get current user

#### User Endpoints
- `GET /api/users/me` - Get profile
- `PATCH /api/users/me` - Update profile
- `PATCH /api/users/me/password` - Change password
- `POST /api/users/:id/role` - Update user role (admin only)
- `PATCH /api/users/:id` - Update any user profile fields (admin only)
- `POST /api/users/:id/toggle-status` - Toggle user active status (admin only)

#### Course Endpoints
- `GET /api/courses` - List courses with pagination
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/:id` - Update course (admin/staff)
- `DELETE /api/courses/:id` - Delete course (admin)

#### Department Endpoints
- `GET /api/departments` - List departments
- `GET /api/departments/:id` - Get department details
- `POST /api/departments` - Create department (admin)
- `PUT /api/departments/:id` - Update department (admin)

#### Notice Endpoints (Admin Only)
- `GET /api/notices` - List notices with pagination and filtering
- `GET /api/notices/:id` - Get notice details
- `POST /api/notices` - Create notice
- `PUT /api/notices/:id` - Update notice
- `DELETE /api/notices/:id` - Delete notice

#### Dashboard Endpoints
- `GET /api/dashboard/student` - Student dashboard data
- `GET /api/dashboard/teacher` - Teacher dashboard data
- `GET /api/dashboard/staff` - Staff dashboard data
- `GET /api/dashboard/admin` - Admin dashboard data
- `GET /api/admin/users` - List all users (admin)
- `GET /api/admin/activity-log` - Activity log (admin)

### Database

Prisma schema includes 30+ normalized models:

- **User**: Users with roles (STUDENT, TEACHER, STAFF, ADMIN)
- **Department**: Academic departments with heads
- **Course**: Courses with schedules, teachers, and prerequisites
- **Enrollment**: Student-course enrollment with status tracking
- **Assignment**: Assignments with submissions and grading
- **Submission**: Student assignment submissions
- **Attendance**: Attendance records per enrollment
- **Notice**: University announcements with target roles
- **Activity**: User activity logging
- **RefreshToken**: JWT refresh token management

### Environment Variables

Create a `.env` file in the backend root:

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cwnu
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
CORS_ORIGIN=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
EMAIL_FROM=CWNU <noreply@cwnu.edu>
```

### Security Features

- **Helmet.js**: Security headers
- **CORS**: Configured for frontend origin
- **Rate Limiting**: 100 requests per 15 minutes
- **Zod Validation**: Input validation for all endpoints
- **AppError**: Custom error classes with proper status codes
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication with access/refresh tokens

### Development

```bash
# Start server
npx tsx src/index.ts

# Prisma studio (visual database viewer)
npx prisma studio

# Run migrations
npx prisma migrate dev --name <migration-name>

# Generate Prisma client
npx prisma generate
```

### Deployment

Ensure environment variables are set for production:
- Set `NODE_ENV=production`
- Use production database URL
- Set secure JWT secrets
- Configure production CORS origin
- Set up proper email service for password resets

## License

This project is licensed under the MIT License.