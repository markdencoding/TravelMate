# Future Admin Login & Role Architecture Plan

## 1. Overview
This architectural document outlines the planned design and entry points for a future administrative management system within TravelMate. In accordance with Phase 10.5 guidelines, no admin CRUD, fake buttons, unauthenticated portals, or unauthorized routes are introduced in this phase.

---

## 2. Existing Role Support in TravelMate Core
TravelMate's existing foundation already possesses several architectural building blocks for role differentiation:
- **Database Schema**: `users` table (`database/migrations/001_create_users.sql`) already includes a `role VARCHAR(20) DEFAULT 'user'` column.
- **Backend Middleware**: `backend/src/middleware/auth.js` already exports:
  - `authenticate`: decodes and verifies JWT, attaching `req.user = { id, email, role }`.
  - `authorize(...roles)`: asserts `roles.includes(req.user.role)` and returns HTTP `403 Forbidden` if unauthorized.
- **Frontend Constants**: `frontend/src/utils/constants.js` contains role definitions (`USER_ROLES = { USER: 'user', ADMIN: 'admin' }`).

---

## 3. Recommended Future Architecture

### A. Authentication & Credential Verification Flow
1. **Single Secure Endpoint vs Dedicated Admin Gateway**:
   - `POST /api/auth/login` verifies user password with `bcrypt.compare`.
   - The generated JWT claims include `{ id, email, role }`.
2. **Session & State Management**:
   - Frontend `AuthContext` receives the `user.role` payload on login.
   - For elevated administrative roles (`role === 'admin'`), appropriate administrative views and navigation capabilities are unlocked.

### B. Authorization Middleware & Endpoint Protection
All administrative endpoints must be strictly wrapped with:
```javascript
router.use(authenticate);
router.use(authorize('admin'));
```
This guarantees:
- Non-logged-in users receive HTTP `401 Unauthorized`.
- Standard travelers (`role === 'user'`) attempting to access administrative API endpoints receive HTTP `403 Forbidden`.

### C. Protected Frontend Routing
In future frontend phases:
- An `<AdminRoute />` higher-order wrapper component checking `user && user.role === 'admin'`.
- If an unauthorized user navigates directly to `/admin/*`, redirect safely to `/dashboard` or show a dedicated `403 Access Denied` state.

### D. Security Boundaries & Data Separation
- Administrative audit logs for privileged operations (user status updates, content moderation).
- Administrative actions separated from normal traveler trip datasets.
