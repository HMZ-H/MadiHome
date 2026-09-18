# MadiHome Frontend

React 19 + TypeScript + Vite + Tailwind CSS v4 frontend for the MadiHome homecare platform.

## Setup

```bash
npm install
npm run dev
```

Dev server runs at `http://localhost:5173`.

## Environment

Create `.env.local`:

```
VITE_API_BASE_URL=http://localhost:8080
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Structure

```
src/
├── Pages/           # Route-level pages
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── PatientDashboard.tsx
│   ├── DoctorDashboard.tsx
│   ├── SuperAdminDashboard.tsx
│   ├── PatientMessages.tsx
│   ├── DoctorMessages.tsx
│   ├── MessagingPage.tsx
│   ├── Profile.tsx
│   └── ...
├── components/      # Shared UI components
│   ├── Navbar.tsx
│   ├── ProtectedRoute.tsx
│   ├── MessageThread.tsx
│   ├── MessageComposer.tsx
│   ├── BookingForm.tsx
│   ├── HelpChatWidget.tsx
│   └── ui/          # shadcn/ui primitives
├── hooks/           # Custom React hooks
│   ├── useChatSocket.ts   # WebSocket connection + typing indicators
│   └── useMessages.ts     # Message fetching, sending, pagination
├── utils/
│   ├── api.ts       # API client with auto token refresh
│   └── auth.ts      # Auth helpers (token validation, session check)
└── lib/
    └── utils.ts     # Tailwind merge utility (shadcn)
```

## Key Libraries

- **react-router-dom v7** — routing
- **axios** — HTTP client (alongside fetch in utils)
- **leaflet / react-leaflet** — interactive maps
- **lucide-react** — icons
- **radix-ui** — accessible primitives (dialog, tooltip, sheet)
- **class-variance-authority + tailwind-merge** — component variants (shadcn/ui)
