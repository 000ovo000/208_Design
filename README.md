# KinLight

KinLight is a family-oriented pet companion web app. It combines a React + Vite frontend, an Express backend, and a MySQL database to support family member management, photo sharing, pet message delivery, mood tracking, daily drops, and weekly rewards.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS 4
- UI libraries: Radix UI, Motion, Lucide React, Recharts
- Backend: Node.js, Express
- Database: MySQL
- Tooling: npm, concurrently

## Core Features

- Family album and feed with image upload
- Pet-based message relay and care messages
- Family member profile and account switching
- Mood records and weekly echo / reward interactions
- Demo mode for local presentation without backend dependency
- Weekly Echo aggregates posts, reactions, moods, and pet / care message activity

## Project Structure

- `src/`: frontend application
- `backend/`: Express API server
- `public/`: static assets
- `kinlight_db.sql`: database schema / base data SQL
- `seed_db.sql`: sample seed data
- `ai-logs/`: primary AI prompts used for core components

## Setup Instructions

### 1. Install dependencies

At project root:

```bash
npm install
```

For backend:

```bash
cd backend
npm install
```

### 2. Configure environment variables

Root `.env.local` or `.env`:

```env
VITE_DEMO_MODE=true
VITE_API_URL=http://localhost:3001
```

Backend `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=kinlight_db
```

### 3. Set up the database

1. Create a MySQL database named `kinlight_db`.
2. Import `kinlight_db.sql`.
3. If needed, import `seed_db.sql` for sample content.

### 4. Run the project

Frontend only:

```bash
npm run dev
```

Backend only:

```bash
cd backend
npm run dev
```

Frontend + backend together:

```bash
npm run dev:all
```

## Local Demo Instructions

- Use `VITE_DEMO_MODE=true` to run the frontend in demo mode without requiring backend APIs.
- Use `VITE_DEMO_MODE=false` and start the Express server if you want full database-backed behavior.
- Default frontend dev server: `http://localhost:5173`
- Default backend server: `http://localhost:3001`

## Current Implementation Notes

- The frontend demo supports the full interaction flow used for local presentation.
- The backend supports local API and MySQL-backed demonstration for the main system features.
- Weekly Echo aggregates posts, reactions, mood entries, and pet / care messages.
- Daily Drop claims are synced through the shared inventory flow and refresh Weekly Echo keepsake data after successful collection.

## AI Coding Logs

If AI-assisted coding was used, the primary prompts for core components are documented in [`ai-logs/`](./ai-logs).

Note: these logs are reconstructed from the implemented features and development workflow so the repository contains a clear record of the main prompts behind the delivered components.
