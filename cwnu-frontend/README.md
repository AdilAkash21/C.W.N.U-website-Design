# CWNU University Management System - Frontend

A modern university management system built with React 19, TypeScript, and Vite.

## Project Structure

```
cwnu-frontend/
├── src/
│   ├── App.tsx              # Main app with routing and layouts
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles
│   ├── App.css              # Component styles
│   ├── assets/              # Images and icons
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn-ui based components (Button, Input, Card, etc.)
│   │   ├── layout/          # Header, Footer, MainLayout, Sidebar
│   │   └── auth/            # ProtectedRoute, RoleRoute
│   ├── context/             # AuthContext for authentication state
│   ├── pages/               # Page components organized by role/type
│   │   ├── public/          # Home, About, Courses, Blog, Contact
│   │   ├── auth/            # Login, Register, Password Reset
│   │   ├── dashboard/       # Student, Teacher, Staff, Admin dashboards
│   │   ├── profile/         # User profile page
│   │   └── admin/           # Admin management pages
│   ├── services/            # API service (axios wrapper)
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions (cn for classNames)
├── package.json
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts development server at http://localhost:5173 |
| `npm run build` | Builds for production |
| `npm run lint` | Runs oxlint for code quality |
| `npm run preview` | Preview production build |

## Key Features

- **Role-Based Dashboards**: Separate views for Student, Teacher, Staff, and Admin
- **Authentication**: JWT-based with login, register, password reset, and refresh tokens
- **Responsive Design**: Works on mobile, tablet, laptop, and desktop
- **Modern UI**: Tailwind CSS with shadcn-ui components
- **React Router**: Protected routes with role verification
- **React Query**: Server state management with tanstack/react-query

## API Integration

The frontend communicates with the backend at `http://localhost:4000/api/`.

Key endpoints:
- `/api/auth/*` - Authentication (login, register, logout, password reset)
- `/api/users/*` - User profile and management
- `/api/courses/*` - Course enrollment and management
- `/api/notices/*` - Notice management (admin only)
- `/api/dashboard/*` - Role-specific dashboard data

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Screenshots

![Home Page](src/assets/herm.png)
![Student Dashboard](src/pages/dashboard/student/StudentDashboard.tsx)
![Admin Dashboard](src/pages/dashboard/admin/AdminDashboard.tsx)