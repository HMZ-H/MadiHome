# MadiHome

Homecare medical platform connecting patients with doctors for in-home medical services. Patients can browse doctors, book homecare services, and chat in real time. Doctors manage services, care plans, visits, and communicate with patients through WebSocket-powered messaging.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go 1.25, Gin, GORM, PostgreSQL |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Real-time | WebSocket (gorilla/websocket) |
| Auth | JWT + refresh tokens, Google OAuth, email verification |
| Storage | Cloudinary (photos), S3 (optional) |
| AI Assistant | Pluggable — OpenAI or Google Gemini |
| Maps | Leaflet / React-Leaflet |
| Deploy | Docker Compose, Nginx reverse proxy |

## Project Structure

```
MadiHome/
├── backend/
│   ├── Domain/          # Entities and repository interfaces
│   ├── Repository/      # GORM implementations
│   ├── Usecases/        # Business logic
│   ├── Delivery/        # Controllers, schemas, router
│   ├── Infrastructure/  # Middleware, security, AI, email, storage, realtime
│   ├── migrations/      # Database migrations
│   └── main.go          # Entry point
├── frontend/
│   ├── src/
│   │   ├── Pages/       # Route pages (Login, Dashboards, Messages, etc.)
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom hooks (useMessages, useChatSocket)
│   │   └── utils/       # API client, auth helpers
│   └── index.html
├── nginx/               # Nginx config
├── docker-compose.prod.yml
└── README.md
```

## Getting Started

### Prerequisites

- Go 1.25+
- Node.js 20+
- PostgreSQL 15+

### Backend

```bash
cd backend
cp .env.example .env   # configure DATABASE_URL, JWT_SECRET, etc.
go run main.go
```

The API starts on `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts on `http://localhost:5173`.

### Environment Variables

Copy `env.production.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `AI_PROVIDER` | `openai` or `gemini` |
| `OPENAI_API_KEY` | OpenAI API key (if using OpenAI) |
| `GEMINI_API_KEY` | Gemini API key (if using Gemini) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (default: `http://localhost:5173,http://localhost:3000`) |
| `VITE_API_BASE_URL` | Frontend env — backend URL (default: `http://localhost:8080`) |

### Docker (Production)

```bash
cp env.production.example .env.production
# Edit .env.production with real values
docker compose -f docker-compose.prod.yml up -d
```

This starts PostgreSQL, Redis, the Go backend, the React frontend (served via Nginx), Prometheus, and Grafana.

## Features

### Authentication & Authorization
- Register / login with email + password
- Google OAuth
- Email verification and password reset
- JWT access + refresh token rotation
- Three roles: **patient**, **doctor**, **super_admin**
- Role-based middleware on backend, protected routes on frontend

### Homecare Services
- Doctors create and manage services (name, category, duration, price)
- Patients browse the service catalog and book appointments
- Booking flow: pending → accepted → completed
- Geolocation support for patient addresses

### Care Plans & Visits
- Doctors create care plans for patients
- Visits are scheduled from approved bookings
- Visit lifecycle: scheduled → in_progress → completed

### Real-Time Messaging
- WebSocket-powered chat between patients and doctors
- Messages persisted to PostgreSQL
- Typing indicators
- Conversation history loaded via REST, live updates via WebSocket
- Connection status indicator with automatic reconnection

### Notifications
- In-app notification system
- Unread count badge
- Mark as read / mark all as read

### AI Assistant
- Chat widget available to authenticated users
- Configurable provider (OpenAI / Gemini)
- Conversation history stored per user

### Admin
- Super admin dashboard for user/doctor/booking management
- Role request system (users can request doctor role)
- User verification controls

## API Overview

The backend exposes ~87 REST endpoints under `/api`:

- **Public**: `POST /register`, `POST /login`, `GET /services`, `GET /doctors`, `GET /ws` (WebSocket)
- **Authenticated**: `GET /me`, `PUT /users/:id`, message and notification CRUD
- **Patient/User**: bookings, visits, care plans, AI chat
- **Doctor**: patient management, service/plan/visit/booking CRUD
- **Super Admin**: user management, doctor CRUD, role request approval

## License

Private — all rights reserved.
