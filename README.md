# OS Management Dashboard (Monitor Board)

A full-stack, real-time OS dashboard that displays system metrics, utilizing Node.js, Socket.io, React, and Tailwind CSS.

## Features

- Real-time CPU, Memory, Disk, and Network monitoring.
- Dark theme styling mimicking the provided design.
- Live data streaming over WebSockets.
- Fully dockerized for easy deployment.

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Docker & Docker Compose (optional, for containerized execution)

## Setup & Execution

### Running Locally (Without Docker)

**1. Backend:**
```bash
cd backend
npm install
npm start
```
The backend WebSocket server will run on `http://localhost:3001`.

**2. Frontend:**
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be available at `http://localhost:5173`.

### Running with Docker

Run the following command in the root directory:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

## API Documentation

### REST Endpoints
- `GET /api/health`: Returns basic health status `{ status: 'ok' }`.

### WebSockets (Socket.io)
- Connect to `http://localhost:3001`.
- Listens for `connection`.
- Emits `metrics` event every 2 seconds with a payload containing current system stats.

### Data Seeding / DB
- The application currently relies on live host system data provided by the `systeminformation` node package, requiring no database migrations for the dashboard view.
