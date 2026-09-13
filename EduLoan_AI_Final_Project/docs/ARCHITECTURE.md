# Architecture Overview

- **frontend/** — Next.js web client. Talks to the backend via REST (`src/lib/api.ts`).
- **backend/** — FastAPI service exposing `/api/*` routes. Owns business logic and data access.
- **packages/mypackage/** — Shared/reusable Python logic, installable independently or as a backend dependency.
- **mobile/** — Expo/React Native client, talks to the same backend API.

## Data flow
Client (web or mobile) → Backend API → Database / services
