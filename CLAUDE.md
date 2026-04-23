# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server on port 3000
npm run build      # Production build
npm run type-check # TypeScript check without emitting
npm run lint       # ESLint across src/
npm run lint:fix   # Auto-fix lint errors
npm test           # Jest + React Testing Library
```

---

## Architecture

### API Client

Single Axios instance in [src/services/api.ts](src/services/api.ts) (`apiService` singleton). All pages use the generic methods directly:

```ts
api.get('/evaluations/')
api.post('/evaluations', payload)
api.put(`/evaluations/${id}`, payload)
api.delete(`/evaluations/${id}`)
```

The class-specific methods (e.g., `apiService.login()`, `apiService.getCursos()`) are legacy — only used in their original callers. New code uses the generic methods.

Base URL: `REACT_APP_API_URL` env var → defaults to `http://localhost:8000/api/v1`. In production Docker, injected via `window._env_` (see [src/config/env.ts](src/config/env.ts)).

On any 401 response the interceptor clears `localStorage` and redirects to `/login`.

### Auth

`AuthContext` ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)) wraps the entire app. Exposes `useAuth()`. Stores `token` and `user` (full User object) in `localStorage`. On mount it re-fetches `/users/me` to get the latest user data including `custom_role_id`.

### Permissions

`usePermissions()` ([src/hooks/usePermissions.ts](src/hooks/usePermissions.ts)) — loaded once per session via `/auth/me/permissions`. Returns sync boolean functions (`canCreateEvaluations()`, `canViewWorkersPage()`, etc.) for use in JSX guards. Loading state via `permissions.loading`.

- **Admin** (`role === 'admin'`): all permission functions return `true`.
- **Fixed roles** (trainer, supervisor, employee): hardcoded permission sets as fallback.
- **Custom roles**: permissions come from the API; page access also from `/permissions/my-pages`.

### Routing & Route Guards

All routes defined in [src/App.tsx](src/App.tsx). Protected by `<ProtectedRoute>`:

```tsx
<ProtectedRoute allowedRoles={["admin", "trainer"]} route="/admin/evaluations">
  <Evaluation />
</ProtectedRoute>
```

Admin bypasses all role checks. For custom roles, `checkPagePermission` (in [src/utils/pagePermissions.ts](src/utils/pagePermissions.ts)) is the authoritative gate — check it when adding new protected routes.

### State Management

No Redux or SWR. All server data fetched in `useEffect`/`useCallback` inside each page component. Shared auth state only via `AuthContext`. Other shared state (if needed) goes in a new Context — don't add global state managers.

### Types

All backend-matching interfaces live in [src/types/index.ts](src/types/index.ts). When a backend schema changes, update the corresponding interface here. Local component interfaces (used only within one page) stay in that file.

### Forms

Most forms use plain `useState`. Formik + Yup is available and used in a few places (`formik`, `yup` packages). Prefer `useState` for new forms unless validation complexity justifies Formik.

### UI Library

Material-UI v7. Use `Grid` with the v2 `size` prop:
```tsx
<Grid size={{ xs: 12, md: 6 }}>
```
Not the legacy `xs={12}` prop. Use `@mui/icons-material` for icons.

---

## Key Patterns

### Adding a new admin page

1. Create `src/pages/MyFeature.tsx`
2. Add route in [src/App.tsx](src/App.tsx) inside a `<ProtectedRoute>` with appropriate `allowedRoles` and `route`
3. Add the route string to `traditionalAccess` map in [src/hooks/usePermissions.ts:1704](src/hooks/usePermissions.ts#L1704) for role-based access
4. If the page needs a sidebar link, add it in [src/components/Sidebar.tsx](src/components/Sidebar.tsx)

### Permission guard in JSX

```tsx
const permissions = usePermissions();
// ...
{permissions.canCreateEvaluations() && <Button>Nueva</Button>}
```

### Fetching paginated data

Backend returns `{ items: T[], total, page, size, pages, has_next, has_prev }`. Use the `PaginatedResponse<T>` type from `src/types/index.ts`.

### user.role vs user.rol

The `User` type has both `role` and `rol` fields for historical compatibility. Always read as `user?.role || user?.rol` when the value could come from either.
