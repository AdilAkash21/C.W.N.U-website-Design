# CWNU University Management System

CWNU is a locally runnable university management platform with separate React/Vite frontend and Express/Prisma backend applications.

## Repository layout

```text
project-web-2.0/
├── cwnu-frontend/   # React 19, TypeScript, Vite, Tailwind CSS
├── cwnu-backend/    # Express, TypeScript, Prisma, PostgreSQL API
├── public/          # Shared public assets
└── .vscode/         # Local editor and task configuration
```

## Features

- Public university pages, authentication, and protected role-based routes
- Student, teacher, staff, and administrator dashboards
- Course catalog, enrollment requests, assignments, submissions, grading, notices, and messaging
- Course-specific attendance sessions with invitations and attendance records
- Server-authoritative attendance timers using persisted timestamps
- Automatic session closing when the scheduled end time is reached
- One-minute teacher/admin reopen window that becomes permanently closed at expiry
- Responsive academic dashboard UI for desktop and mobile screens

## Local architecture

The frontend and backend are intentionally isolated to the local machine during development:

| Application | URL | Directory |
| --- | --- | --- |
| Frontend | `http://localhost:5173` | `cwnu-frontend/` |
| Backend API | `http://127.0.0.1:4000` | `cwnu-backend/` |
| PostgreSQL | `127.0.0.1:5432` | Local/Docker database |

The frontend calls the backend through `/api`. Configure the backend CORS origin to match the frontend URL.

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer, locally installed or running through Docker

## First-time setup

### 1. Configure the backend

```powershell
cd cwnu-backend
npm install
Copy-Item .env.example .env # if an example file is available
```

Create or update `cwnu-backend/.env` with values similar to:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/cwnu
JWT_ACCESS_SECRET=replace-with-a-local-access-secret
JWT_REFRESH_SECRET=replace-with-a-local-refresh-secret
CORS_ORIGIN=http://localhost:5173
```

Never commit `.env` files or real credentials.

### 2. Prepare Prisma

```powershell
npx prisma generate
npx prisma db push
```

Use `npx prisma migrate dev` instead of `db push` when maintaining migration history.

### 3. Configure and start the frontend

```powershell
cd ..\cwnu-frontend
npm install
npm run dev
```

Start the backend in a second terminal:

```powershell
cd cwnu-backend
npm run dev
```

Open `http://localhost:5173`.

## Useful commands

### Frontend

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend

```powershell
npm run dev
npm run build
npm start
npm run lint
npm test
npx prisma studio
```

The backend health endpoint is `GET http://127.0.0.1:4000/health`.

## Attendance lifecycle

Attendance is course-scoped:

```text
Course
  -> AttendanceSession
      -> AttendanceInvitation
      -> AttendanceRecord
```

When a session is created, its scheduled date/time and duration are persisted. The API calculates the authoritative end timestamp. Clients only display a countdown; refreshing a browser or changing the local clock cannot extend a session.

```text
SCHEDULED -> OPEN -> CLOSED
                         |
                         v
                 REOPENED for 60 seconds
                         |
                         v
              permanently CLOSED
```

After the one-minute reopen period expires, the API rejects further attendance edits and reopening attempts. Session synchronization occurs whenever attendance session data or attendance actions are requested.

## Code organization

- `cwnu-frontend/src/App.tsx`: route tree and role protection
- `cwnu-frontend/src/pages/`: role-specific pages and workflows
- `cwnu-frontend/src/components/`: shared UI and layout components
- `cwnu-frontend/src/services/api.ts`: typed API client
- `cwnu-frontend/src/types/`: shared frontend models
- `cwnu-backend/src/index.ts`: Express application entry point
- `cwnu-backend/src/routes/`: feature APIs and authorization
- `cwnu-backend/src/validators/`: Zod request validation
- `cwnu-backend/prisma/schema.prisma`: database models and relationships

## Development guidelines

- Keep frontend and backend changes independently buildable.
- Reuse shared components and existing API helpers before adding new abstractions.
- Keep authorization checks in backend route handlers; frontend role checks are not security boundaries.
- Use persisted server timestamps for time-sensitive workflows.
- Do not commit secrets, local `.env` files, `node_modules`, or generated `dist` output.

## Verification

Before opening a pull request or deploying a local change:

```powershell
cd cwnu-backend
npm run build

cd ..\cwnu-frontend
npm run build
```

## License

This project is licensed under the MIT License.
