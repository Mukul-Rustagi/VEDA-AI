# VedaAI – AI Assessment Creator

Production-style monorepo implementation of the hiring assignment using:

- **Frontend:** Next.js, TypeScript, Zustand, Socket.IO client
- **Backend:** Node.js, Express, TypeScript
- **Data + Infra:** MongoDB, Redis, BullMQ
- **AI:** OpenAI with strict JSON parsing + deterministic fallback

---

## Submission Checklist (5/5)

1. ✅ Architecture overview  
2. ✅ Engineering approach  
3. ✅ PDF export (queued, formatted)  
4. ✅ Better caching (Redis, invalidation-aware)  
5. ✅ UI polish (Figma-aligned dashboard and flows)

---

## Architecture Overview

### High-level components

```
Next.js Web App
  ├─ Assignment Form / Listing / Output / Toolkit UI
  ├─ Zustand Store + Socket Client
  └─ API calls (REST)

Express API
  ├─ Assignment APIs
  ├─ Toolkit AI API
  ├─ Queue producer (BullMQ)
  └─ Socket.IO server

Worker Process
  ├─ Question generation jobs
  └─ PDF generation jobs

MongoDB
  └─ Assignment metadata + generated papers

Redis
  ├─ BullMQ backend
  ├─ API cache (list/detail)
  └─ PDF cache
```

### Runtime flow (Assignment Generation)

1. Teacher submits assignment form.
2. API validates payload with shared Zod schemas.
3. Assignment is stored in MongoDB with `queued` status.
4. BullMQ job is enqueued.
5. Worker generates structured paper (OpenAI or fallback).
6. DB status is updated (`generating` → `ready` / `failed`).
7. Socket event is pushed to frontend for real-time UI updates.

### Runtime flow (PDF Export)

1. Frontend calls PDF queue endpoint.
2. PDF job is enqueued in BullMQ.
3. Worker renders formatted exam paper PDF.
4. PDF buffer is stored in Redis cache.
5. Frontend downloads from `/pdf/download`.

---

## Approach

### 1) Contract-first development

- Shared schemas/types live in `packages/shared`.
- Frontend and backend both use the same contracts to avoid drift.

### 2) Async job architecture for heavy operations

- AI generation and PDF rendering are background jobs.
- API remains responsive and non-blocking.

### 3) Safe AI output handling

- LLM output is requested as JSON and parsed/validated.
- If output is invalid/unavailable, fallback generator returns deterministic structured data.
- Raw LLM text is never rendered directly.

### 4) Caching strategy

- Assignment list and detail responses are cached in Redis.
- Cache invalidation happens on create/regenerate/delete/status updates.
- Generated PDFs are cached separately for fast repeated downloads.

### 5) UI/UX implementation strategy

- Followed Figma structure closely for sidebar, cards, spacing, and typography.
- Added clear hierarchy for assignment output and toolkit output.
- Added quality-of-life interactions (progress UI, back navigation, contextual sidebar CTA).

---

## Bonus Features Implemented

### A) PDF Export

- Queue-based generation with BullMQ worker
- Proper formatted exam-paper PDF (not raw print HTML)
- Cached delivery endpoint for fast retrieval

### B) Better Caching

- Redis cache for assignment list + detail APIs
- Redis cache for generated PDFs
- Invalidation-aware lifecycle

### C) Improved UI Polish

- Figma-aligned sidebar proportions and sticky layout behavior
- Refined assignment form header/progress alignment
- Improved assignments toolbar (filter + search) styling
- Better action buttons, navigation interactions, and responsive layout
- Functional AI Toolkit page with structured results

---

## Project Structure

```
apps/
  api/
    src/
      modules/
        assignments/
        jobs/
        pdf/
        toolkit/
  web/
    app/
    components/
      assignments/
      layout/
      output/
      toolkit/
packages/
  shared/
    src/
```

---

## API Surface (core)

- `GET /api/health`
- `GET /api/assignments`
- `POST /api/assignments`
- `GET /api/assignments/:id`
- `POST /api/assignments/:id/regenerate`
- `POST /api/assignments/:id/pdf`
- `GET /api/assignments/:id/pdf/download`
- `DELETE /api/assignments/:id`
- `POST /api/toolkit/generate`

---

## Environment Setup

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

### Backend env

- `MONGODB_URI`
- `REDIS_URL`
- `CLIENT_URL`
- `OPENAI_API_KEY` (optional; fallback generation works without it)

### Frontend env

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_WS_URL`

---

## Run Locally

1. Start MongoDB + Redis.
2. Build shared package:

```bash
npm run build -w packages/shared
```

3. Run all services:

```bash
npm run dev
```

Services:

- Web: `http://localhost:3000`
- API: `http://localhost:8080`
- Worker: background BullMQ worker

---

## Build & Typecheck

```bash
npm run build
npm run typecheck
```
