# Bookme.pk Technical Documentation

This document explains the current Node.js, Express, Prisma, and Nuxt admin implementation in this repository. It documents the code as it exists now, including compatibility routes and unfinished modules.

Documentation snapshot: **28 July 2026**

Source of truth: the files currently present in this repository. When a comment, README, frontend screen, migration, and running code disagree, this document describes the running code and calls out the disagreement.

## Scope And How To Read This Document

This guide is intentionally written at two levels:

1. **Concept level** explains Node.js, Express, middleware, controllers, services, repositories, Prisma, JWTs, Nuxt routing, and browser-to-server communication.
2. **Project level** traces the exact files and routes in Bookme.pk, including what each route accepts, which permission it needs, which database operation it performs, what it returns, and what is currently incomplete or inconsistent.

The module reference is in the requested order:

```text
admin-employees
  -> attendance
  -> auth
  -> dashboard
  -> departments
  -> designations
  -> leaves
  -> roles
  -> users
```

Three labels are used throughout:

| Label | Meaning |
| --- | --- |
| **Implemented** | The route reaches real service/repository/database logic. |
| **Compatibility alias** | A second URL mounts the same Express router and therefore performs the same operation. |
| **Placeholder** | A route exists and may authenticate correctly, but its controller does not perform the advertised database work yet. |

This is an implementation guide, not a promise that every current behavior is desirable. The final “Current Gaps” section identifies factual bugs, security risks, unused code, route/UI mismatches, and unfinished flows without silently treating them as intended design.

## Fast Mental Model

There are two applications and two different kinds of route:

```text
Browser
  |
  | page navigation, for example GET http://localhost:3000/dashboard/users
  v
Nuxt frontend (frontend-admin)
  |
  | JSON API request, for example GET http://localhost:5000/api/users
  | Authorization: Bearer <JWT>
  v
Express backend (backend)
  |
  | Prisma query / raw SQL
  v
MySQL
```

- A **frontend route** selects a Vue page and renders HTML/UI. Nuxt derives it from a file under `frontend-admin/pages`.
- A **backend route** accepts an HTTP operation and returns JSON. Express derives it from `app.use(...)` plus a path inside a router file.
- Frontend visibility checks improve the interface, but they are not security. Express authentication and permission middleware are the actual server-side enforcement.
- Most backend modules follow `route -> controller -> service -> repository -> Prisma -> MySQL`.
- The leaves module is the major exception: its routes exist, but its controller currently returns fixed messages and never reaches its repository.

## Contents

1. Project layout and dependency map
2. Node.js and JavaScript module behavior
3. HTTP, Express routes, and middleware fundamentals
4. Backend startup and global middleware
5. API responses, errors, authentication, permissions, validation, and uploads
6. Prisma/MySQL schema and relations
7. Effective backend mounts
8. Module reference from `admin-employees` through `users`
9. Seed data and generated user codes
10. Nuxt frontend routes, layouts, middleware, services, and pages
11. End-to-end request flows
12. Current gaps and debugging guide
13. Complete backend route matrix and compatibility expansion

## Project Layout

```text
Bookme.pk/
  backend/
    src/
      app.js
      server.js
      jobs/
      middlewares/
      modules/
      utils/
  database/
    schema.prisma
    prisma.js
    seed.js
    seeds/
    migrations/
  frontend-admin/
    pages/
    components/
    composables/
    services/
  global/
    env.js
```

The backend is an Express API. The database layer uses Prisma against MySQL. The admin frontend is a Nuxt app that calls the backend through service files in `frontend-admin/services`.

### Workspace Packages

The root `package.json` declares npm workspaces:

```json
{
  "workspaces": [
    "backend",
    "frontend-admin"
  ]
}
```

This means the repository is a small monorepo:

| Package | Module system | Runtime responsibility |
| --- | --- | --- |
| Root `bookme-pk` | CommonJS | Shared Prisma/database commands and dependencies. |
| `backend` | CommonJS | Node.js/Express JSON API and attendance scheduler. |
| `frontend-admin` | ES modules | Nuxt/Vue browser application. |

Important backend packages:

| Package | Use in this project |
| --- | --- |
| `express` | HTTP application, routers, middleware, static uploads, JSON responses. |
| `@prisma/client` | Typed application API for MySQL queries and transactions. |
| `joi` | Request-body validation and normalization. |
| `jsonwebtoken` | JWT signing and verification. |
| `bcrypt` | Password hashing and comparison. |
| `multer` | Multipart photo/Excel upload parsing and disk storage. |
| `helmet` | Common security-related HTTP response headers. |
| `cors` | Browser cross-origin access policy. |
| `morgan` | HTTP request logging. |
| `axios` | Downloads the attendance workbook. |
| `xlsx` | Parses the downloaded workbook. |
| `node-cron` | Runs the automatic attendance import every 30 seconds. |

Important frontend packages:

| Package | Use in this project |
| --- | --- |
| `nuxt` | File-based frontend routing, rendering, runtime configuration, and application build. |
| `vue` | Reactive state, components, computed values, watchers, and lifecycle hooks. |
| `vue-router` | Navigation used underneath Nuxt routing. |
| `echarts` / `vue-echarts` | Dashboard chart rendering. |

There is no test framework, lint script, or API documentation generator configured in the current package files.

## How Node.js Works In This Project

This backend uses CommonJS modules:

```js
const express = require("express");
module.exports = app;
```

`require(...)` imports another file or npm package. `module.exports` exposes functions, objects, or Express routers to other files.

The backend uses a layered structure:

```text
HTTP request
  -> Express route
  -> middleware
  -> controller
  -> service
  -> repository
  -> Prisma Client
  -> MySQL
  -> response helper
```

Each layer has a specific purpose:

| Layer | Purpose |
| --- | --- |
| Route file | Defines HTTP method, URL path, auth, permissions, upload middleware, validation, and controller handler. |
| Middleware | Performs shared request work such as authentication, permission checks, uploads, validation, and error handling. |
| Controller | Reads `req.params`, `req.body`, and `req.user`, calls the service, and sends a consistent HTTP response. |
| Service | Holds business rules, validations that require database checks, password hashing, role decisions, and workflow decisions. |
| Repository | Contains Prisma queries and maps database records into API-friendly response objects. |
| Utility | Reusable helpers for JWTs, password hashing, role normalization, permission constants, response shape, and code generation. |

### CommonJS On The Backend

The backend uses CommonJS:

```js
const authService = require("./auth.service");

module.exports = {
  login
};
```

The important behavior is:

1. `require("./auth.service")` resolves and executes that file the first time it is required.
2. Node caches the exported value. Later `require` calls normally receive the same cached module object.
3. `module.exports` is the public API of the file.
4. Relative paths beginning with `./` or `../` refer to repository files. Names such as `"express"` refer to installed packages.
5. Because configuration is required during module loading, missing `JWT_SECRET` or `DATABASE_URL` can stop startup before the HTTP server listens.

The frontend uses ES modules instead:

```js
import authService from "~/services/auth.service";
export default { getUsers };
```

`~` is Nuxt’s source-root alias. Nuxt also auto-imports many Vue/Nuxt functions such as `ref`, `computed`, `onMounted`, `useRoute`, `navigateTo`, and `useRuntimeConfig`, which is why many Vue files use them without explicit imports.

### The Event Loop And `async`/`await`

Node.js runs JavaScript on an event loop. A route can begin a database or network operation, yield while that operation is waiting, and continue when its Promise settles:

```js
const user = await repository.findUserByEmail(email);
```

In this project:

- Prisma database calls, Axios requests, bcrypt functions, and most controller/service functions return Promises.
- `await` makes the local function read sequentially without blocking Node while ordinary network/database I/O is pending.
- Express 4 does not automatically catch every rejected Promise from an `async` route handler. `asyncHandler` wraps handlers and calls `next(error)` when the Promise rejects.
- Synchronous CPU-heavy work still blocks the event loop. `XLSX.read(...)` and spreadsheet row parsing are synchronous, so a very large attendance workbook can temporarily delay unrelated HTTP requests in the same backend process.
- Each backend process has its own memory. The attendance job’s `syncRunning` Boolean prevents overlap only inside one process; it does not coordinate multiple deployed backend instances.

### Controller, Service, And Repository Are Conventions

Express does not require this folder structure. The project chooses it to separate concerns:

```text
Route:
  Which HTTP method/path? Which middleware? Which controller?

Controller:
  Which req field is input? Which status/message should be returned?

Service:
  Is the operation allowed and logically valid?

Repository:
  Which database query or transaction performs it?
```

Keeping these separate makes a rule such as “designation must belong to the selected department” independent from HTTP response formatting and independent from the precise Prisma query.

## HTTP And Express Route Fundamentals

### An HTTP Request Has Multiple Input Channels

Example:

```http
PUT /api/users/42?source=admin-ui HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "firstName": "Ayesha"
}
```

Express exposes the pieces as:

| HTTP part | Express property | Example | Current project use |
| --- | --- | --- | --- |
| Path parameter | `req.params` | `id = "42"` | User, admin, role, department, designation, and leave IDs. |
| Query string | `req.query` | `source = "admin-ui"` | No current backend module reads query parameters. |
| JSON/form body | `req.body` | `{ firstName: "Ayesha" }` | Create/update/login payloads. |
| Header | `req.headers` | `authorization` | Bearer JWT authentication. |
| Uploaded file | `req.file` | photo metadata | Multer photo middleware and the unused attendance upload helper. |
| Authenticated context | `req.user` | safe user and permissions | Added by `authMiddleware`; not sent directly by the browser. |

Path parameters arrive as strings. Services explicitly convert IDs with `Number(...)` and reject non-positive or non-integer values. Joi normally converts multipart numeric strings such as `"3"` into numbers before the controller runs.

### How An Express Route Is Read

This route:

```js
router.post(
  "/",
  authMiddleware,
  requirePermission("CREATE_EMPLOYEE"),
  uploadEmployeePhoto,
  validate(createEmployeeSchema),
  adminEmployeesController.createEmployee
);
```

means:

1. Only an HTTP `POST` matches.
2. Its router-local path is `/`.
3. Middleware executes left to right.
4. Each middleware must either send a response, throw/pass an error, or call `next()`.
5. The controller runs only if every earlier middleware succeeds.

Mounted with:

```js
app.use("/api/admin/employees", adminEmployeesRoutes);
```

the effective URL is:

```text
mount path + router path
/api/admin/employees + /
= POST /api/admin/employees
```

The same router is also mounted at `/api/v1/admin/employees`, so the same internal `POST /` definition creates a second effective URL. No controller is duplicated; both URLs eventually execute the same function.

### Route Order Matters

Express examines middleware and routes in registration order.

- A matching handler that sends a response stops normal traversal.
- A router that does not match calls through to the next registration.
- The not-found handler must come after every real route.
- The error handler must be last so earlier code can forward errors to it.
- Static `/uploads` is registered before authentication, so uploaded files are publicly readable when their URL is known.
- Morgan is currently registered after several early routers, so requests completed by those routers are not logged by Morgan.

Within a router, specific routes should generally appear before a broad dynamic route. The users router does this for `/admins` and `/admin/:id` before `/:id`, preventing the word `admins` from being mistaken for a user ID on matching HTTP methods.

### HTTP Methods Used Here

| Method | Normal meaning | Project examples |
| --- | --- | --- |
| `GET` | Read without changing state | Current user, dashboard, department list, role detail. |
| `POST` | Create or trigger an action | Login, signup, create user, import attendance. |
| `PUT` | Replace/update a resource | User, admin, department, designation, role update. |
| `PATCH` | Partial update/action | User/admin/department/designation partial update and leave decisions. |
| `DELETE` | Delete a resource | Admin, department, designation, role. |

The implementation treats department and generic-user `PUT` operations as
partial updates because those Joi schemas allow omitted fields. In strict REST
terminology, that behavior is closer to `PATCH`; here both methods intentionally
reach the same controller/service for compatibility. Designation update is
different: `designationName` is required for both its `PUT` and `PATCH` routes.

### Status Codes Used Here

| Status | Meaning in this project |
| --- | --- |
| `200 OK` | Successful read, update, delete, login/logout, import, or placeholder leave response. |
| `201 Created` | Successful signup/create user/admin/employee/department/designation/role. |
| `400 Bad Request` | Joi validation, invalid ID, missing/wrong department/designation, invalid spreadsheet row, upload error. |
| `401 Unauthorized` | Missing, invalid, or expired JWT; invalid login credentials. |
| `403 Forbidden` | Authenticated but inactive, or missing required permission. |
| `404 Not Found` | Unknown route or requested record does not exist. |
| `409 Conflict` | Duplicate unique value or deletion blocked by assigned records. |
| `500 Internal Server Error` | Unexpected bug/database/external error, plus a few deliberately operational “seed missing” cases. |

“Unauthorized” in HTTP terminology means authentication failed. “Forbidden” means identity is known but that identity is not allowed to perform the operation.

## Frontend Routes Versus Backend Routes

These are independent:

| Kind | Example | Owned by | Returns |
| --- | --- | --- | --- |
| Frontend page route | `GET http://localhost:3000/dashboard/users` | Nuxt/Vue Router | Rendered page/UI. |
| Backend API route | `GET http://localhost:5000/api/users` | Express | JSON data. |

The `/dashboard/users` page calls the `/api/users` endpoint, but the similar names are a project convention, not automatic wiring. The connection exists only because frontend JavaScript explicitly calls the backend URL.

End-to-end:

```text
click or page lifecycle
  -> Nuxt page/component function
  -> frontend service builds API URL
  -> browser sends HTTP request
  -> app-level Express middleware
  -> matched Express router
  -> route middleware
  -> controller
  -> service
  -> repository
  -> Prisma/MySQL
  -> controller sends JSON
  -> $fetch resolves or rejects
  -> Vue reactive state changes
  -> DOM/UI re-renders
```

## Backend Startup Flow

Entry point: `backend/src/server.js`

1. Imports `app` from `backend/src/app.js`.
2. Imports environment config from `global/env.js`.
3. Defines and registers process handlers for unhandled promise rejections,
   `SIGTERM`, and `SIGINT`.
4. Calls `startServer()`.
5. Tests the Prisma database connection with `SELECT 1`.
6. Starts the Express server on `env.port`, default `5000`.
7. After the listener emits `listening`, runs an immediate attendance import and
   then starts a `node-cron` job that imports every 30 seconds.
8. On shutdown, disconnects Prisma and closes the HTTP server.

Development command:

```bash
cd backend
npm run dev
```

Production command:

```bash
cd backend
npm start
```

Root workspace database commands:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed
```

## Environment Configuration

File: `global/env.js`

`global/env.js` loads `global/.env` through `dotenv` and exports a typed config object.

Required variables:

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Secret used to sign and verify JWT access tokens. |
| `DATABASE_URL` | MySQL connection string used by Prisma. |

Optional variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Controls logging and Prisma log level. |
| `PORT` | `5000` | Express server port. |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin. Can be `*` or comma-separated origins; see the credentialed-request caveat below. |
| `JWT_EXPIRES_IN` | `1d` | JWT expiry duration. |
| `BCRYPT_SALT_ROUNDS` | `12` | bcrypt password hashing cost. |
| `SEED_SUPER_ADMIN_EMAIL` | none | Used by super admin seed. |
| `SEED_SUPER_ADMIN_PASSWORD` | none | Used by super admin seed. |

## App Bootstrap And Global Middleware

File: `backend/src/app.js`

Global middleware and routes are registered in Express order:

1. `helmet()` sets security-related HTTP headers.
2. `cors(...)` allows configured frontend origins to call the API.
3. `express.json({ limit: "10kb" })` parses JSON request bodies.
4. `express.urlencoded({ extended: false })` parses form-style request bodies.
5. `app.use("/uploads", express.static(uploadsRoot))` serves uploaded files.
6. Main module routers are mounted.
7. `morgan(...)` logs requests in non-test environments. Current placement means some earlier-mounted routes may complete before `morgan` sees them.
8. Root `/` health-style route.
9. `/health` route.
10. Compatibility route mounts.
11. `notFoundHandler` handles unknown routes.
12. `errorHandler` converts thrown errors into API responses.

### Why The Exact Registration Order Matters Here

The early routers are:

```text
/api/attendance
/api/dashboard
/api              (canonical auth routes)
/api/leaves
/api/roles
/api/designations
```

They are registered before Morgan. A request completed by one of them never reaches the later logging middleware. Departments, users, admin-employees, root/health, and later auth aliases do pass through Morgan. As a result, Morgan logs are not a complete audit of API traffic in the current app.

A successfully served `/uploads/...` file also completes before Morgan and is not
logged. A missing static file falls through, so that request can reach Morgan and
the final 404 handler.

CORS is configured with `credentials: true`. The app accepts
`CORS_ORIGIN="*"` as configuration, but browsers do not allow wildcard
`Access-Control-Allow-Origin` for requests sent in credentialed mode. Current
frontend bearer-token calls do not send cookies, but a future
`credentials: "include"` cookie flow would need a specific origin instead.

The broad `/api` auth mount does not swallow unrelated APIs. Express removes the mount prefix, asks `authRoutes` whether its internal `/login`, `/me`, `/signup`, or `/logout` paths match, and continues to later middleware if none match.

The public static mount:

```js
app.use("/uploads", express.static(uploadsRoot));
```

does not authenticate. A stored path such as `/uploads/users/user-123.jpg` can be fetched directly from the backend host. Authorization protects the act of uploading through protected routes, not later file reads.

`GET /health` is a fixed process-liveness response. It does not query MySQL, test
the Google Sheet, inspect the scheduler, or verify another dependency. If the
handler itself is reachable, it returns 200 with service
`admin-employee-backend` and status `ok`.

Startup and runtime failures are different:

| Failure point | Current behavior |
| --- | --- |
| Missing required environment variable | Module load throws; server never starts. |
| Initial Prisma connection check fails | `startServer` logs and exits with code 1. |
| Port already in use | Listener error is explained, Prisma disconnects, process exits 1. |
| Initial attendance sync fails | Job catches/logs it; server remains listening and scheduler still starts. |
| Unhandled Promise rejection | Process closes server when possible and exits 1. |
| `SIGINT`/`SIGTERM` | Prisma disconnects, HTTP server closes, process exits 0. |

## Standard API Response Shape

File: `backend/src/utils/apiResponse.js`

Success responses use:

```json
{
  "success": true,
  "message": "Message text",
  "data": {}
}
```

Error responses use:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

Most controllers use `sendSuccess`. Centralized error handling uses `sendError`.

The leave controllers currently return simple JSON directly, but still include `success` and `message`.

### Error Propagation

Normal async failure path:

```text
repository/Prisma throws
  -> awaited service Promise rejects
  -> awaited controller Promise rejects
  -> asyncHandler catches rejection and calls next(error)
  -> errorHandler normalizes/logs error
  -> sendError sends JSON
```

`ApiError` is the expected/operational error type. It carries:

```text
statusCode
message
errors[]
isOperational = true
```

Unexpected-error messages are hidden from the API caller as
`"Internal server error"`, and non-production environments print the underlying
error. The status is not always forced to 500: if a non-operational parser/error
already carries `statusCode`, the handler preserves it. Malformed JSON can
therefore return generic-message 400, and an over-limit parser error can preserve
413.

Prisma unique-constraint code `P2002` is converted to a 409. When
`error.meta.target` is an array, the handler recognizes email,
user/admin/employee code, linked user, and department-name targets. A string or
missing target becomes generic `"unique field"` and produces
`409 Duplicate value already exists`. Other Prisma codes, including most
foreign-key or record-race errors, are not normalized and normally become generic
500 responses.

If `req.file.path` exists when a later error reaches the global handler, it
attempts to delete the new file asynchronously. The unlink callback ignores any
failure, so cleanup is not guaranteed. One exception is
`parseAdminDepartments`: invalid JSON is answered directly by that middleware
instead of forwarded as an error, so a photo saved immediately before that parser
can remain orphaned.

Joi validation errors use the standard envelope:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

Joi is configured with `abortEarly: false`, so one request can return several field errors at once.

## Authentication And Permissions

### JWT Authentication

File: `backend/src/middlewares/auth.middleware.js`

Protected routes require:

```http
Authorization: Bearer <jwt_token>
```

Parsing is stricter than some HTTP clients expect. The code uses the
case-sensitive prefix `Bearer ` and then reads `authHeader.split(" ")[1]`.
Lowercase `bearer` or an extra space immediately after `Bearer` can therefore
produce 401. Conversely, additional space-separated text after the second token
is ignored.

The middleware flow:

1. Reads the `Authorization` header.
2. Verifies the JWT using `verifyAccessToken`.
3. Loads the user from the database through `auth.repository.findUserById`.
4. Rejects missing users.
5. Rejects non-active users.
6. Attaches the safe user object to `req.user`.
7. Attaches token metadata to `req.auth`.

Important implementation detail: the auth repository maps `user.employmentStatus` into the API field named `status`. The active-account check currently uses that mapped field, not the nullable Prisma `User.status` column.

The token itself contains:

| JWT claim | Value |
| --- | --- |
| `sub` | User ID as a string. |
| `role` | Normalized role at login time. |
| `iat` | Issued-at time added by `jsonwebtoken`. |
| `exp` | Expiry derived from `JWT_EXPIRES_IN`, default one day. |

Authorization does **not** trust the role claim for later permission decisions. Each protected request reloads the current user, role, and permissions from the database. This has useful consequences:

- Deleting an account invalidates its old token on the next request.
- Changing `employmentStatus` away from `ACTIVE` blocks the next request.
- Database permission additions are visible to an already-issued token.
- The JWT role claim can be stale after a role change, but `req.user` is based on current database state.

It also means every protected request has at least one user/permission database read. `GET /me` currently performs a second identical safe-user read in its service after authentication has already loaded the user.

Authentication is stateless:

- The backend stores no login session.
- There is no refresh token.
- There is no token blacklist/revocation table.
- Logout returns success but does not invalidate the JWT cryptographically.
- The Nuxt frontend stores the token in `localStorage`, not an HttpOnly cookie.
- A copied token remains usable until expiry or until the user becomes missing/inactive.

### Permission Middleware

File: `backend/src/middlewares/permission.middleware.js`

`requirePermission("PERMISSION_NAME")` allows one required permission.

`requireAnyPermission("A", "B", "C")` allows any one of the listed permissions.

Permissions are normalized by trimming, uppercasing, and replacing spaces or hyphens with underscores. For example:

```text
"view employees" -> "VIEW_EMPLOYEES"
"VIEW-EMPLOYEES" -> "VIEW_EMPLOYEES"
```

`requirePermission("X")` is a one-value convenience wrapper. `requireAnyPermission("A", "B")` succeeds if at least one normalized permission is present.

Role middleware also exists at `backend/src/middlewares/role.middleware.js`, but no current route imports it. Current authorization is permission-based rather than direct role-based routing.

### Role Utility

File: `backend/src/utils/roles.js`

Supported core role keys:

| Role key | Accepted names |
| --- | --- |
| `SUPER_ADMIN` | `Super Admin`, `SUPER_ADMIN`, `SUPER ADMIN` |
| `ADMIN` | `Admin`, `ADMIN` |
| `EMPLOYEE` | `Employee`, `EMPLOYEE` |

Role names are normalized so seeded roles can be stored as readable names while code can use stable keys.

### Permission Utility

File: `backend/src/utils/permissions.js`

The static permissions list includes admin, department, employee, user, role, designation, attendance, dashboard, report, and leave permissions.

Seeded role permissions:

| Role | Main permissions |
| --- | --- |
| Super Admin | Admin CRUD, department CRUD, employee CRUD, user update, role CRUD, designation CRUD, attendance import, system dashboard, team and own attendance, reports, team/all leave views, leave approval and rejection. |
| Admin | Create own leave, employee CRUD, user update, attendance import, system dashboard, reports, own/team/all leave views, approve/reject/cancel leaves. |
| Employee | Create leave, view own attendance, view own leaves, cancel leave. |

The auth repository combines database role permissions with static fallbacks. This means core role permissions still work even if some database permission links are missing.

More precisely, authenticated permissions are:

```text
hard-coded fallback permissions for recognized core role
UNION
current role_permissions rows from MySQL
```

The union is normalized, deduplicated, and alphabetically sorted. This is a major operational detail:

- Removing a fallback permission from a core role in the Roles UI does **not** revoke it at runtime.
- A custom role has no fallback and uses only its database permission rows.
- Renaming a core role can change whether it is recognized and therefore whether its fallback applies.
- Renaming a custom role to a core alias can unexpectedly activate that core fallback.

The fallback mapping is duplicated in `auth.repository.js`, `utils/permissions.js`, and seed data, which creates drift risk. `auth.repository.js` is the mapping that actually constructs `req.user.permissions`.

### Validation And Normalization

`validate(schema, source = "body")` applies a Joi schema before a controller:

```text
incoming req.body
  -> convert compatible values
  -> trim/lowercase/uppercase/default as schema requests
  -> remove unknown keys
  -> replace req.body with cleaned value
```

Examples:

- Login/create emails are trimmed and lowercased.
- Multipart IDs such as `"12"` are normally converted to number `12`.
- Unknown client fields are silently stripped instead of reaching the service.
- Optional empty strings are converted differently depending on the schema: some become `null`, some become `undefined`, and some date fields still fail validation.

Validation checks shape and basic constraints. Services still perform database-dependent checks such as “role exists,” “email is unused,” or “designation belongs to department.”

No Joi schema validates path parameters in the current code. Services parse and validate `req.params.id` themselves.

## Database Layer

File: `database/prisma.js`

The app creates one shared `PrismaClient` instance:

```js
const prisma = global.prisma || new PrismaClient(...)
```

In non-production environments, the client is cached on `global.prisma` to reduce duplicate Prisma clients during reloads.

The datasource is MySQL. Prisma model names use JavaScript-friendly `PascalCase` while `@@map`, `@map`, and relation fields connect them to existing table/column names:

```prisma
model Role {
  roleName String @map("role_name")
  @@map("roles")
}
```

Application code reads `role.roleName`; SQL uses `roles.role_name`.

### Prisma Query Patterns Used

| Pattern | Meaning |
| --- | --- |
| `findUnique` | Read by a unique key such as ID or email. |
| `findFirst` | Read first row matching a more flexible condition/alias list. |
| `findMany` | Read arrays, usually with ordering and relations. |
| `create` / `update` / `delete` | Mutate one record. |
| `createMany` / `deleteMany` | Bulk/junction operations. |
| `$transaction(async tx => ...)` | Run several reads/writes atomically. |
| `$queryRaw` / `$executeRaw` | Run parameterized MySQL-specific SQL. |

Transactions are important during user/role creation because generated codes, the main row, permission junctions, and the final read should either all succeed or all roll back. Application-level existence checks performed before a transaction can still race; database unique/foreign-key constraints remain the final authority.

## Main Prisma Models

File: `database/schema.prisma`

| Model | Purpose |
| --- | --- |
| `Role` | Stores roles such as `Super Admin`, `Admin`, and `Employee`. |
| `Permission` | Stores permission keys such as `CREATE_EMPLOYEE`. |
| `RolePermission` | Join table between roles and permissions. |
| `Department` | Stores departments. A department has many users and many designations. |
| `Designation` | Stores department-scoped job titles. Unique by `departmentId + designationName`. |
| `User` | Main account table. Stores login fields, profile fields, role, department, designation, employment status, photo path, and generated user code. |
| `Attendance` | Stores imported attendance rows linked to users where possible. |
| `LeaveRequest` | Stores leave requests created by users. |
| `LeaveApproval` | Stores approval records for leave requests. |
| `LeaveApprovalHistory` | Stores leave workflow history. |

Important user fields:

| Field | Purpose |
| --- | --- |
| `userCode` | Generated code. Admin codes use `ADM001`, employee codes use `EMP001`. |
| `email` | Unique login email. |
| `passwordHash` | bcrypt-hashed password. Plain passwords are never stored. |
| `roleId` | Required role relation. |
| `departmentId` | Optional department relation. |
| `designationId` | Optional designation relation. |
| `employmentStatus` | `ACTIVE`, `INACTIVE`, `RESIGNED`, or `TERMINATED`. Used by current auth response as `status`. |
| `status` | Nullable `UserStatus`; present in schema but not actively selected by current auth repository. |

### Complete Model Relationship Map

```text
Role 1 -------- * User
Role 1 -------- * RolePermission * -------- 1 Permission

Department 1 -- * User
Department 1 -- * Designation
Designation 1 - * User

User 1 -------- * Attendance
User 1 -------- * LeaveRequest (requester)
User 1 -------- * LeaveRequest (current approver, optional)
LeaveRequest 1  * LeaveApproval
LeaveRequest 1  * LeaveApprovalHistory
User 1 -------- * LeaveApproval / LeaveApprovalHistory (actor)
```

### Enums

| Enum | Values | Used by |
| --- | --- | --- |
| `EmploymentStatus` | `ACTIVE`, `INACTIVE`, `RESIGNED`, `TERMINATED` | Current authentication and user UI status. |
| `UserStatus` | `ACTIVE`, `INACTIVE`, `SUSPENDED` | Separate nullable column that current auth/user mapping ignores. |
| `AttendanceStatus` | `Present`, `Absent`, `Late`, `Leave` | Imported sheet rows and dashboard SQL. Case matters. |
| `LeaveRequestType` | `ANNUAL`, `CASUAL`, `SICK`, `UNPAID`, `OTHER` | Intended leave request type. |
| `LeaveRequestStatus` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` | Intended overall leave state. |
| `LeaveApprovalStatus` | `PENDING`, `APPROVED`, `REJECTED` | Intended approval-step state. |
| `LeaveAction` | `APPROVED`, `REJECTED`, `CANCELLED` | Intended history action. |

### Important Constraints And Delete Behavior

| Relation/constraint | Effect |
| --- | --- |
| `User.email` unique | Prevents duplicate login email. |
| `User.userCode` nullable unique | Prevents duplicate `ADM...`/`EMP...` codes. |
| `Role.roleName` unique | Prevents duplicate stored role name. |
| `Permission.permissionName` unique | Prevents duplicate permission key. |
| `RolePermission` composite primary key | A permission can be assigned only once per role. |
| Role/Permission -> RolePermission `onDelete: Cascade` | Deleting either side deletes its junction rows. |
| `Department.departmentName` unique | Prevents duplicate department name. |
| `Designation(departmentId, designationName)` unique | Same title may exist in different departments, not twice in one. |
| Department -> Designation `onDelete: Cascade` | Deleting department deletes its designation rows. |
| Designation -> User `onDelete: SetNull` | Deleting designation clears affected user designation IDs. |
| User -> Attendance `onDelete: Cascade` | Deleting user deletes linked attendance rows. |
| User requester -> LeaveRequest `onDelete: Cascade` | Deleting requester deletes their leave requests. |
| Current approver -> LeaveRequest `onDelete: SetNull` | Deleting current approver clears current reference. |
| LeaveRequest -> LeaveApproval/History `onDelete: Cascade` | Deleting a leave request deletes both its approval steps and history. |
| Approval/history actor -> approval/history `onDelete: Cascade` | Deleting an acting user deletes the audit rows that refer to that user. |

`Attendance` stores both a `userId` relation and denormalized snapshots (`userCode`, `fullName`, `role`, `department`). The importer writes both. Some dashboard queries join the current user/role/department instead of using the stored snapshot, so historical presentation can change after a user is renamed or transferred.

There is an index on `(userId, attendanceDate)`, but it is **not unique**. Multiple attendance records for one user/date are legal and can affect dashboard counts.

## File Uploads

File: `backend/src/middlewares/upload.middleware.js`

Uploads are handled with `multer`.

| Upload type | Request field | Allowed MIME types | Size limit | Saved under | Public path |
| --- | --- | --- | --- | --- | --- |
| Employee photo | `photo` | JPG, PNG, WebP | 2 MB | `backend/uploads/employees` | `/uploads/employees/...` |
| Admin photo | `photo` | JPG, PNG, WebP | 2 MB | `backend/uploads/admins` | `/uploads/admins/...` |
| User photo | `photo` | JPG, PNG, WebP | 2 MB | `backend/uploads/users` | `/uploads/users/...` |
| Attendance Excel | `file` | `.xlsx`, `.xls` MIME types | 10 MB | `backend/uploads/attendance` | `/uploads/attendance/...` |

Current implementation note: `uploadAttendanceExcel` exists but is not used by the attendance route. Attendance import currently reads directly from a hard-coded Google Sheet export URL.

Upload middleware runs only for `multipart/form-data`. For photo routes:

1. Multer expects field name `photo`.
2. It trusts the supplied MIME type to allow JPEG, PNG, or WebP.
3. It writes the file to disk with a timestamp/random filename.
4. It overwrites `req.body.photo` with the public `/uploads/...` path.
5. Joi validates the remaining body.
6. Service/database work runs.
7. Global error handling attempts an asynchronous delete if a later forwarded
   error occurs; unlink failures are ignored.

JSON requests can also send a text `photo` path because the Joi schemas accept a string. The backend does not inspect image contents, resize images, remove metadata, or verify that a text path exists.

On successful photo replacement, the old file is not deleted. Repeated updates can therefore leave orphaned files. Upload directories are created synchronously when `upload.middleware.js` is loaded.

## Full Route Mounts

`app.js` mounts routers under multiple paths. Some are canonical, some are compatibility aliases.

| Mounted path | Router | Notes |
| --- | --- | --- |
| `/api/attendance` | attendance | Canonical attendance API. |
| `/api/dashboard` | dashboard | Canonical dashboard API. |
| `/api` | auth | Canonical `/api/login`, `/api/me`, `/api/signup`, `/api/logout`. |
| `/api/leaves` | leaves | Canonical leave API. |
| `/api/roles` | roles | Canonical roles API. |
| `/api/designations` | designations | Canonical designation API. |
| `/api/auth` | auth | Auth alias. |
| `/api/users` | users | Canonical users API. |
| `/api/departments` | departments | Canonical departments API. |
| `/api/admin/auth` | auth | Admin auth alias. |
| `/api/admin/departments` | departments | Admin departments alias. |
| `/api/api/auth` | auth | Compatibility for a frontend page that previously called `/api/api/auth`. |
| `/api/administrator` | auth | Compatibility for older administrator signup intent. |
| `/api/admin/employees` | admin-employees | Employee-management path; authorization is permission-based, not Super-Admin-role-only. |
| `/api/v1/admin/employees` | admin-employees | Versioned employee management alias. |
| `/api/v1/departments` | departments | Versioned departments alias. |

There are 49 internal `router.METHOD(...)` definitions plus two app-level GET routes. Repeated mounts expand them to **83 effective method/path combinations**:

```text
auth:               4 definitions x 5 mounts = 20
departments:         7 definitions x 3 mounts = 21
admin-employees:     2 definitions x 2 mounts = 4
attendance:          1
dashboard:           1
leaves:              6
roles:               7
designations:        5
users:              16
root/health:          2
total:               83
```

This count does not include static file URLs under `/uploads` or Express’s default acceptance of an optional trailing slash.

Root routes:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Returns backend running message and common route hints. |
| `GET` | `/health` | Returns service health and status. |

## Module Documentation

The following modules are documented in the requested order, from `admin-employees` through `users`.

## 1. admin-employees Module

Folder: `backend/src/modules/admin-employees`

Purpose: create and list employee accounts from the admin/super-admin area.

Files:

| File | Purpose |
| --- | --- |
| `admin-employees.routes.js` | Defines protected employee list/create routes. |
| `admin-employees.controller.js` | Calls service and returns success responses. |
| `admin-employees.service.js` | Checks duplicate email, department, designation, hashes password, retries generated-code collisions. |
| `admin-employees.repository.js` | Reads/writes `User` records with Employee role and maps response shape. |
| `admin-employees.validation.js` | Joi validation for employee creation. |
| `README.md` | Older module README. Some database references in it are stale. |

### Routes

Mounted at:

```text
/api/admin/employees
/api/v1/admin/employees
```

| Method | Full path | Permission | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/admin/employees` | `VIEW_EMPLOYEES` | List users whose role is Employee. |
| `GET` | `/api/v1/admin/employees` | `VIEW_EMPLOYEES` | Same as above. |
| `POST` | `/api/admin/employees` | `CREATE_EMPLOYEE` | Create an employee account with optional photo. |
| `POST` | `/api/v1/admin/employees` | `CREATE_EMPLOYEE` | Same as above. |

### Create Employee Request

Content types:

```text
application/json
multipart/form-data
```

Use `multipart/form-data` when uploading `photo`.

Required body fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `email` | email string, max 255 | Login email. Lowercased by Joi. |
| `password` | string, 8 to 128 chars | Plain password that will be bcrypt hashed. |
| `firstName` | string, 2 to 100 chars | Employee first name. |
| `lastName` | string, 1 to 100 chars | Employee last name. |
| `departmentId` | positive integer | Existing department id. |

Optional body fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `phone` | string up to 30 or null | Employee phone. |
| `address` | string up to 255 or null | Employee address. |
| `photo` | string up to 255 or uploaded file | Public photo path after upload. |
| `designation` | string up to 100 or numeric string | Designation name or id fallback. |
| `designationId` | positive integer or null | Preferred designation id. |

Business rules:

1. Email must not already exist.
2. Department must exist.
3. Designation is required.
4. Designation must belong to the selected department.
5. Employee role must exist in `roles`.
6. Password is hashed with bcrypt.
7. Employee code is generated as `EMP001`, `EMP002`, and so on.
8. User is created with `employmentStatus: "ACTIVE"`.
9. The service retries a recognized generated employee-code/user-code unique
   collision up to 3 attempts.

Flow:

```text
POST /api/admin/employees
  -> authMiddleware
  -> requirePermission("CREATE_EMPLOYEE")
  -> uploadEmployeePhoto
  -> validate(createEmployeeSchema)
  -> adminEmployeesController.createEmployee
  -> adminEmployeesService.createEmployee
  -> repository.findUserByEmail
  -> repository.findDepartmentById
  -> hashPassword
  -> repository.findDesignation...
  -> prisma.$transaction
  -> generateNextEmployeeCode
  -> tx.user.create
  -> response { user, employee }
```

List flow:

```text
GET /api/admin/employees
  -> authMiddleware
  -> requirePermission("VIEW_EMPLOYEES")
  -> controller.listEmployees
  -> service.listEmployees
  -> repository.listEmployeeAccounts
  -> prisma.user.findMany where role is Employee
```

Response shape for listed/created employees:

```json
{
  "user": {
    "id": 1,
    "fullName": "Ali Khan",
    "email": "ali@example.com",
    "role": "EMPLOYEE",
    "status": "ACTIVE"
  },
  "employee": {
    "id": 1,
    "userId": 1,
    "employeeCode": "EMP001",
    "firstName": "Ali",
    "lastName": "Khan",
    "departmentId": 1,
    "designationId": 2,
    "designation": "Backend Developer"
  }
}
```

Current implementation notes:

| Note | Detail |
| --- | --- |
| No update/delete here | This module only lists and creates employees. |
| No `joiningDate` input | The validation schema does not accept `joiningDate` for this route. |
| README drift | The module README mentions older tables. Current code stores employee profile fields directly on `User`. |

### Endpoint-Level Details

#### `GET /api/admin/employees` and versioned alias

Source trail:

```text
admin-employees.routes.js:13-18
  -> admin-employees.controller.js:5-9
  -> admin-employees.service.js:40-42
  -> admin-employees.repository.js:175-196
```

The endpoint accepts no body, params, or query options. It returns every Employee-role user, ordered by first name and then last name. There is no pagination, search, status filter, department filter, or total-count metadata. The top-level `data` value is an array of `{ user, employee }` pairs.

The paired shape is a compatibility view over one `User` row:

```text
user.id
employee.id
employee.userId

all three values refer to the same users.id
```

The complete mapped `user` subsection contains `id`, `fullName`, `email`, normalized `role`, mapped employment `status`, `createdAt`, and `updatedAt`. The employee subsection contains the generated code, names, contact/profile fields, department object, flattened designation name, joining date, and timestamps.

#### `POST /api/admin/employees` and versioned alias

Middleware order is important:

```text
authenticate
  -> authorize CREATE_EMPLOYEE
  -> optionally save photo
  -> validate/clean body
  -> business rules
  -> transaction
```

An unauthorized caller is rejected before Multer saves anything. A caller who
passes auth but fails Joi or service checks may briefly create a disk file; global
error handling attempts to remove it.

After duplicate-email and department checks, the service hashes the password
before resolving the designation. An invalid designation therefore still incurs
the configured bcrypt work.

Designation resolution precedence is:

1. Use `designationId` when truthy.
2. Otherwise, if `designation` looks like a positive integer, treat it as an ID.
3. Otherwise, look up the exact trimmed designation name inside the chosen department.
4. If no row is found, the service reports `"Designation is required"` even when a non-existent value was supplied.
5. If an ID resolves to a designation from another department, return a department-mismatch 400.

The employee role is looked up through accepted Employee aliases inside the transaction. The generated code query finds the largest numeric suffix among `EMP[digits]`, adds one, and pads to at least three digits. `EMP1000` is valid after `EMP999`.

The code generator is `MAX + 1`, so two concurrent requests can calculate the same
code. The service retries up to three attempts only when `P2002` exposes an array
target containing `employeeCode`, `employee_code`, or `userCode`. A missing/string
target or another unique field is not considered retryable. Email,
department, and designation prechecks occur outside the create transaction, so
database constraints still handle races.

### Admin-Employees Error Reference

| Condition | Status/message |
| --- | --- |
| Missing/malformed Bearer header | 401, authorization header invalid. |
| Invalid/expired JWT | 401 with invalid/expired token message. |
| Account not active | 403. |
| Missing route permission | 403. |
| Invalid photo type/size | 400. |
| Joi field errors | 400 `Validation failed` plus field list. |
| Existing email | 409 `Email is already registered`. |
| Unknown department | 400 `Department not found`. |
| Missing/unknown designation | 400 `Designation is required`. |
| Wrong department/designation pair | 400. |
| Employee role not seeded | Operational 500 with instruction to run role seeds. |
| Exhausted or unrecognized generated-code `P2002` | 409 after global Prisma normalization. |
| Unexpected Prisma/filesystem error | Generic 500. |

Additional implementation facts:

- Joi allows phone length up to 30, while the Prisma column is `VarChar(20)`; lengths 21–30 can reach a database error.
- The MIME check relies on upload metadata rather than inspecting file bytes.
- The module builds a `fullName` value in its service, but the repository writes `firstName` and `lastName` directly.
- Its README describes older split employee/profile tables and optional designation behavior; those statements are not current.
- The current Nuxt frontend does not call either admin-employees URL. The user creation screen is intended to call the generic users module instead.

## 2. attendance Module

Folder: `backend/src/modules/attendance`

Purpose: import attendance from a Google Sheet into the `attendance` table.

Files:

| File | Purpose |
| --- | --- |
| `attendance.routes.js` | Defines the manual import endpoint. |
| `attendance.controller.js` | Calls import service and returns import counts. |
| `attendance.service.js` | Downloads XLSX, parses rows, validates data, maps users, builds source keys. |
| `attendance.repository.js` | Finds users and syncs attendance rows with raw SQL and Prisma transactions. |
| `attendance.validation.js` | Currently empty. |
| `jobs/attendance.job.js` | Runs import at startup and every 30 seconds. |

### Routes

Mounted at:

```text
/api/attendance
```

| Method | Full path | Permission | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/attendance/import` | `IMPORT_ATTENDANCE` | Manually imports attendance from the configured Google Sheet. |

### Import Source

The service downloads this hard-coded export URL:

```text
https://docs.google.com/spreadsheets/d/1uNA77aFV8J1Mj8uKKKc0gnOQIXaD0WZ7uYgCWdNQE7w/export?format=xlsx
```

Expected first-sheet columns:

| Column | Required | Purpose |
| --- | --- | --- |
| `User Code` | yes | Must match `users.userCode`. |
| `Date` | yes | Attendance date. Supports Excel dates and common string formats. |
| `Check-In` | no | Parsed to `HH:mm:ss`. |
| `Check-Out` | no | Parsed to `HH:mm:ss`. |
| `Status` | yes | Must be one of `Present`, `Absent`, `Late`, `Leave`. |
| `Remarks` | no | Optional remarks. |

Flow:

```text
POST /api/attendance/import
  -> authMiddleware
  -> requirePermission("IMPORT_ATTENDANCE")
  -> attendanceController.importAttendance
  -> attendanceService.importAttendance
  -> axios.get(GOOGLE_SHEET_URL)
  -> XLSX.read(...)
  -> validate each row
  -> attendanceRepository.findUsersByCodes
  -> build attendance records
  -> generate sourceKey for duplicate detection
  -> attendanceRepository.syncNewAttendance
  -> response import counts
```

Automatic flow from `server.js`:

```text
server listening
  -> syncAttendanceFromSheet()
  -> startAttendanceScheduler()
  -> cron every 30 seconds
  -> attendanceService.importAttendance()
```

Duplicate handling:

1. For each parsed attendance record, the service builds a truncated SHA-256 hash from user, date, time, status, and remarks.
2. Every row receives an occurrence suffix beginning with `:1`; exact duplicates increment it to `:2`, `:3`, and so on.
3. Repository first tries to attach the source key to an existing exact row whose `source_key` is null.
4. If no matching row exists, repository inserts the row only when no row exists with the same source key or same exact record values.
5. The response separates inserted, matched, and skipped rows.

Response data:

```json
{
  "totalRows": 10,
  "insertedRows": 3,
  "matchedRows": 5,
  "skippedRows": 2
}
```

Current implementation notes:

| Note | Detail |
| --- | --- |
| No upload endpoint | Excel upload middleware exists but this route does not accept uploaded files. |
| No attendance read route | Dashboard queries attendance, but there is no standalone attendance list endpoint. |
| Hard-coded sheet URL | The Google Sheet URL is not loaded from environment config. |

### Spreadsheet Parsing Rules

The workbook download has no request body and no caller-selected URL. The service:

1. Downloads the XLSX as an Axios `arraybuffer`.
2. Parses it as a buffer.
3. Uses only `workbook.SheetNames[0]`.
4. Converts that sheet to objects with raw cell values and missing cells set to `null`.
5. Treats reported spreadsheet row numbers as array index plus 2, accounting for the header row.

Header keys are exact and case-sensitive in JavaScript. `User code`, `USER CODE`, or `Check In` do not satisfy the code that reads `User Code` and `Check-In`.

Date handling:

| Input form | Interpretation |
| --- | --- |
| JavaScript `Date` | Local year/month/day. |
| Excel numeric serial | `XLSX.SSF.parse_date_code`. |
| `YYYY-M-D` | Explicit year/month/day. |
| `M/D/YYYY` | Explicit month/day/year. |
| Other string | JavaScript `new Date(...)` fallback. |

The normalized stored value is `YYYY-MM-DD`. Invalid fallback dates produce a row-level 400, but explicit component paths do not thoroughly validate calendar ranges before the database is reached.

The numeric Excel-serial branch dereferences
`XLSX.SSF.parse_date_code(...)` without first verifying that it returned a value.
A negative or otherwise out-of-range serial can therefore throw a TypeError and
become a generic 500 instead of the intended row-level invalid-date 400.

Time handling:

| Input form | Interpretation |
| --- | --- |
| JavaScript `Date` | Local hours/minutes/seconds. |
| Excel numeric fraction | Fraction of 24 hours. |
| `H:MM`, `H:MM:SS`, optional AM/PM | Parsed and formatted as `HH:mm:ss`. |
| Missing or unrecognized text | Stored as `null`. |

The parser does not reject impossible time components. An invalid optional time may silently become `null`, while some numeric/range edge cases may reach MySQL and fail unexpectedly.

The allowed status text is exact after trimming:

```text
Present
Absent
Late
Leave
```

Every source row is parsed and every user code is resolved before the write transaction begins. One bad row aborts the whole import, so there is no partial successful sheet import.

### User Matching And Stored Snapshot

The importer looks up all distinct supplied user codes, then maps returned users by an uppercase key. Actual database `IN` matching still follows the MySQL column collation.

An imported record stores:

```text
userId foreign key
userCode
fullName snapshot
raw roleName snapshot
departmentName snapshot
date
check-in/check-out
status
remarks
sourceKey
```

Unknown user code produces a row-specific 400. The new importer always supplies `userId`, although the schema keeps it nullable for older attendance rows.

Deleting a user cascades their linked attendance records. Renaming or transferring a user does not rewrite snapshot columns. Some dashboard queries nevertheless join current user data, so which name/department is displayed depends on the query.

`User.firstName` and `User.lastName` can each be 100 characters, but the importer
concatenates them into `Attendance.fullName`, whose database column is only 100
characters. A valid long-named user can therefore make the whole import fail at
the database layer.

Raw attendance synchronization writes `created_at` and `updated_at` using
`DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR)`. The attendance migration also
installs Pakistan-time audit triggers. These timestamp semantics are deliberately
different from simply storing the database server's local `NOW()`.

### Idempotency Is Not Reconciliation

The 48-character source hash contains:

```text
userId + attendanceDate + checkIn + checkOut + status + remarks
```

It excludes user code, name, role, and department text. The occurrence suffix creates keys such as:

```text
<48 hex chars>:1
<48 hex chars>:2
```

For each record, the repository executes two statements in one transaction:

1. Attach the source key to one exact legacy row whose key is currently null.
2. Insert only if neither that source key nor an exact field match already exists.

The occurrence suffix does not make exact duplicate sheet rows persist as
separate new rows. After the first exact row exists, a second occurrence has a
different source key but is still rejected by the `OR exact-record` existence
condition. Multiple exact legacy rows whose source keys are null can be matched
one by one, but a clean import normally collapses exact duplicates.

This gives repeat-import idempotency, but it is **not** a synchronization/reconciliation algorithm:

- Removing a row from the sheet does not delete it from MySQL.
- Correcting time/status/remarks creates a different record; it does not update the previous row.
- Changing only the user’s name/role/department does not update the snapshot because those fields are absent from exact matching.
- Duplicate user/date rows are legal because `(userId, attendanceDate)` is only indexed, not unique.

The transaction performs up to two SQL statements per input row sequentially and has a 30-second timeout. Large sheets can be slow.

### Automatic Job Behavior

The scheduler expression:

```text
*/30 * * * * *
```

means every 30 seconds, not every 30 minutes.

The job-level `syncRunning` flag prevents scheduled/startup calls from overlapping within one Node process. It does not cover:

- Manual `POST /api/attendance/import`.
- A second backend process/server instance.
- A separate machine running the same app.

Manual and automatic imports can therefore overlap. The raw `NOT EXISTS` logic and unique source key reduce duplication but do not provide a distributed lock.

Axios has no explicit timeout. A stalled Google download can leave that job waiting. The server is already listening during the first import, but the scheduler is started only after that initial job returns. Job failures are caught and logged, while manual HTTP failures travel to the error handler.

Empty-sheet output is inconsistent: it returns only `totalRows` and `insertedRows`; `matchedRows` and `skippedRows` are absent. The startup log consequently prints those two as `undefined` for an empty sheet.

Unused repository/upload helpers currently include bulk create, delete-by-date, attendance count, and Excel disk upload. The Nuxt frontend does not call the manual import endpoint, and its sidebar’s `/dashboard/attendance` link has no matching page.

## 3. auth Module

Folder: `backend/src/modules/auth`

Purpose: login, current-user lookup, signup, and stateless logout.

Files:

| File | Purpose |
| --- | --- |
| `auth.routes.js` | Defines login, me, signup, logout. |
| `auth.controller.js` | Calls auth service and sends standard responses. |
| `auth.service.js` | Checks credentials, hashes signup passwords, signs JWTs. |
| `auth.repository.js` | Loads safe users with roles and permissions, creates admin users. |
| `auth.validation.js` | Joi schemas for login and signup. |

### Route Mount Aliases

The same auth router is mounted under these base paths:

```text
/api
/api/auth
/api/admin/auth
/api/api/auth
/api/administrator
```

That means every auth route exists under each base path.

Examples:

```text
POST /api/login
POST /api/auth/login
POST /api/admin/auth/login
POST /api/api/auth/login
POST /api/administrator/login
```

### Routes

| Method | Router path | Auth required | Purpose |
| --- | --- | --- | --- |
| `POST` | `/login` | no | Validates email/password and returns JWT plus user object. |
| `GET` | `/me` | yes | Returns current authenticated user. |
| `POST` | `/signup` | no | Creates an administrator user. |
| `POST` | `/logout` | yes | Stateless logout response. Does not revoke JWT server-side. |

### Login

Canonical path:

```http
POST /api/login
```

Body:

```json
{
  "email": "admin@example.com",
  "password": "Password123"
}
```

Validation requires an email of at most 255 characters. Password must be a
non-empty string; login deliberately does not trim it or apply the signup length
limits.

Business rules:

1. Email is lowercased and validated.
2. User must exist.
3. Mapped `status` must be `ACTIVE`.
4. User must have a role.
5. bcrypt password comparison must pass.
6. JWT is signed with user id in `sub` and role in token payload.

Response data:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "userCode": "ADM001",
    "fullName": "Super Admin",
    "email": "superadmin@example.com",
    "role": "SUPER_ADMIN",
    "roleName": "Super Admin",
    "permissions": ["CREATE_ADMIN", "VIEW_ADMINS"]
  }
}
```

### Me

Canonical path:

```http
GET /api/me
Authorization: Bearer <token>
```

Flow:

```text
GET /api/me
  -> authMiddleware
  -> authController.me
  -> authService.getCurrentUser(req.user.id)
  -> authRepository.findUserById
```

Purpose: refreshes safe user data and permissions after login.

### Signup

Canonical path:

```http
POST /api/signup
```

Body:

```json
{
  "fullName": "Admin User",
  "email": "admin@example.com",
  "password": "Password123",
  "role": "ADMIN"
}
```

Allowed role values are the exact, case-sensitive strings `SUPER ADMIN` and
`ADMIN`; omitted role defaults to `ADMIN`.

Validation limits:

| Field | Rule |
| --- | --- |
| `fullName` | Trimmed string, 2 to 100 characters. |
| `email` | Trimmed/lowercased email, at most 255 characters. |
| `password` | String, 8 to 128 characters. |
| `role` | Exact `SUPER ADMIN` or `ADMIN`. |

Business rules:

1. Email must be unique.
2. Password is hashed.
3. Role defaults to `ADMIN`.
4. Admin code is generated as `ADM001`, `ADM002`, and so on.
5. The user is created with `employmentStatus: "ACTIVE"`.

Current implementation note: signup is not protected by auth middleware. Anyone who can reach the API can call the signup route unless infrastructure blocks it.

### Logout

Canonical path:

```http
POST /api/logout
Authorization: Bearer <token>
```

The backend returns success with empty data. The frontend removes `token` and `user` from `localStorage`. There is no token blacklist or refresh-token system.

### Complete Safe-User Shape

Login and `/me` expose a mapped user, never `passwordHash`:

```text
id
userCode
fullName
firstName
lastName
email
phone
address
photo
designationId
designation                 flattened name or null
joiningDate
role                        normalized key
roleName                    raw database name
status                      employmentStatus
departmentId
department                  object or null
managedDepartments          [] or [the same single department]
permissions                 normalized union
createdAt
updatedAt
```

`managedDepartments` does not come from a many-to-many management table. It is a compatibility array derived from the user’s one `departmentId`.

### Detailed Login Behavior

Source trail:

```text
auth.routes.js:12-16
  -> validate(loginSchema)
  -> auth.controller.login
  -> auth.service.login
  -> auth.repository.findUserByEmail
  -> bcrypt.compare
  -> signAccessToken
```

The login password schema only requires a string; it does not trim it or enforce
the signup 8-to-128 length. This preserves password characters. The 10 KB body
limit bounds JSON requests, but `express.urlencoded(...)` is configured
separately without a project-specific 10 KB limit, so that limit does not apply
equally to URL-encoded login bodies.

The service checks inactive status and role before comparing the password. Therefore an existing inactive email can produce a 403 even when the supplied password is wrong, while a missing email/wrong password produces the shared 401 message.

The “supported role” check is not a strict three-role whitelist. Any required database Role relation normalizes to a non-empty key, so a custom role such as `Manager` can log in as `MANAGER`. It receives its database permission links but no core fallback.

### Detailed `/me` Behavior

`authMiddleware` performs:

```text
verify token
  -> database safe-user read
  -> ACTIVE check
  -> req.user assignment
```

The controller then asks `authService.getCurrentUser(req.user.id)`, which performs another safe-user database read. The second read makes the response current but is redundant in the normal path. A deletion between the reads can still produce the service’s 404.

The Nuxt global middleware calls `/me` on every client-side protected navigation, so this endpoint is both a session-validity check and a permission/profile refresh endpoint.

### Detailed Signup Behavior And Security Boundary

All five auth mounts expose public signup:

```text
POST /api/signup
POST /api/auth/signup
POST /api/admin/auth/signup
POST /api/api/auth/signup
POST /api/administrator/signup
```

There is no `authMiddleware`, `CREATE_ADMIN` check, invite token, or infrastructure rule in repository code. The allowed body role includes `SUPER ADMIN`, so any network caller who can reach one of these endpoints can currently attempt to create a Super Admin. This is a critical current security property, not merely a legacy naming issue.

The repository splits `fullName` as:

```text
first whitespace-separated token -> firstName
remaining tokens                 -> lastName
```

A one-word name of two or more characters passes Joi but produces `lastName: null`; Prisma declares `User.lastName` non-null, so that input can become an unexpected database 500.

Signup creates no department or designation. It generates an admin code and `ACTIVE` employment status. Its code generation has no retry loop, so concurrent creates can race; the unique constraint/error normalizer is the fallback.

### Auth Endpoint Error Matrix

| Endpoint/condition | Result |
| --- | --- |
| Login validation | 400 with field errors. |
| Email absent or password mismatch | 401 `Invalid email or password`. |
| Employment not ACTIVE | 403. |
| Missing/malformed/expired JWT on me/logout | 401. |
| User deleted after token issue | 401 from middleware. |
| Permission changes | No error by themselves; fresh user permissions are returned. |
| Signup duplicate email | 409. |
| Signup role row missing | Ordinary error, normally generic 500. |
| Signup success | 201 with `{ user }`, no automatic login token. |
| Logout success | 200 with `data: {}`; token remains valid. |

There is no login rate limiter, lockout, password-reset route, email verification, multi-factor authentication, refresh route, or server-side session store in this codebase.

## 4. dashboard Module

Folder: `backend/src/modules/dashboard`

Purpose: return dashboard sections based on the authenticated user's permissions.

Files:

| File | Purpose |
| --- | --- |
| `dashboard.routes.js` | Defines protected dashboard endpoint. |
| `dashboard.controller.js` | Calls dashboard service. |
| `dashboard.service.js` | Decides which dashboard sections to include by permission. |
| `dashboard.repository.js` | Runs attendance summary, trend, department, late employee, and recent attendance queries. |

### Routes

Mounted at:

```text
/api/dashboard
```

| Method | Full path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/dashboard` | required | Returns permission-scoped dashboard data. |

There is no explicit `requirePermission(...)` on the route. The service returns only sections allowed by the user's permissions.

### Permission-Based Sections

| Permission | Returned section data |
| --- | --- |
| `VIEW_SYSTEM_SUMMARY` | `systemSummary`, `attendanceTrend`, `departmentAttendance`, `topLateEmployees`, `recentAttendance` |
| `VIEW_TEAM_ATTENDANCE` | `teamAttendance` bundle scoped to the user's `managedDepartments` |
| `VIEW_OWN_ATTENDANCE` | `ownAttendance.summary` and `ownAttendance.recentAttendance` scoped to the current user |

Team scope implementation:

```text
req.user.managedDepartments -> department ids -> attendance rows for users in those departments
```

Current auth mapping turns the user's single department into `managedDepartments: [department]`, so team attendance is effectively scoped to the authenticated user's own department.

### Dashboard Data Queries

| Repository function | Purpose |
| --- | --- |
| `getSummary` | Counts today's total, present, absent, late, and leave attendance. |
| `getAttendanceTrend` | Counts attendance per weekday from Monday to Saturday. |
| `getDepartmentAttendance` | Counts present rows grouped by department. |
| `getTopLateEmployees` | Returns top 5 users by late count. |
| `getRecentAttendance` | Returns latest attendance rows with user, role, department, date, times, status, remarks. |

Business time zone: `Asia/Karachi`.

Current-date logic:

1. Computes the current date in `Asia/Karachi`.
2. If the date is Sunday, dashboard uses the previous Saturday as the current attendance date.
3. Weekly trend covers Monday through Saturday for the current week.

Flow:

```text
GET /api/dashboard
  -> authMiddleware
  -> dashboardController.getDashboard
  -> dashboardService.getDashboard(req.user)
  -> permission checks
  -> dashboardRepository raw SQL/Prisma queries
  -> response { user, sections }
```

### Dashboard Bundle Semantics

A bundle launches five repository queries concurrently with `Promise.all`. If one fails, the whole bundle fails—there is no partial successful dashboard.

The outer service builds system, then team, then own bundles sequentially. A user with all three permissions can therefore trigger 15 queries in three waves. The own bundle still computes all five queries and discards trend/department/late results, returning only summary and recent attendance.

The summary is for the target day and calculates:

```text
attendancePercentage = (present + late) / total attendance rows * 100
```

rounded to two decimals. `total` is not employee headcount. A user without any row is not automatically counted absent, and duplicate rows increase the total.

Query time scopes are not consistent:

| Section | Actual time scope |
| --- | --- |
| Summary | Current Karachi target date; Sunday uses Saturday. |
| Trend | Monday through Saturday of target week; counts all statuses/rows. |
| Department attendance | All-time `Present` rows; no date filter. |
| Top late employees | All-time `Late` rows; no date filter. |
| Recent attendance | Latest 10 across all dates. |

Every raw SQL scope requires `attendance.user_id IS NOT NULL` and joins the current `users` record. It does not filter out inactive/resigned/terminated users.

Team scope is safe for an empty department array: repository SQL adds `1 = 0`, returning empty data instead of accidentally returning the whole system. Own scope uses current user ID or `-1`.

Any active authenticated user can call the route. A user with no dashboard permissions receives:

```json
{
  "success": true,
  "message": "Dashboard fetched successfully",
  "data": {
    "user": {
      "id": 1,
      "fullName": "Example",
      "role": "CUSTOM_ROLE",
      "permissions": []
    },
    "sections": {}
  }
}
```

This is a 200 empty dashboard rather than a 403.

The frontend fetches immediately and every 30 seconds. Its display priority is system section first, then team, then own; a response may contain several bundles even though the page chooses one main mode.

## 5. departments Module

Folder: `backend/src/modules/departments`

Purpose: CRUD for departments and department-specific designation lookup.

Files:

| File | Purpose |
| --- | --- |
| `departments.routes.js` | Defines protected department routes. |
| `departments.controller.js` | Calls department service and returns responses. |
| `departments.service.js` | Parses ids, checks duplicates, blocks deletion when assigned users exist. |
| `departments.repository.js` | Prisma queries for departments, users, and designations. |
| `departments.validation.js` | Joi schemas for create/update. |

### Route Mount Aliases

Mounted at:

```text
/api/departments
/api/admin/departments
/api/v1/departments
```

### Routes

| Method | Router path | Permission | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | any listed below | List departments with assigned admins and employees. |
| `POST` | `/` | `CREATE_DEPARTMENT` | Create department. |
| `GET` | `/:id/designations` | any listed below | List designations for a department. |
| `GET` | `/:id` | any listed below | Get one department. |
| `PUT` | `/:id` | `UPDATE_DEPARTMENT` | Update department. |
| `PATCH` | `/:id` | `UPDATE_DEPARTMENT` | Partial update department. |
| `DELETE` | `/:id` | `DELETE_DEPARTMENT` | Delete department if no assigned admins or employees. |

Read/list permission group:

```text
VIEW_DEPARTMENTS
VIEW_DESIGNATIONS
CREATE_DESIGNATION
UPDATE_DESIGNATION
DELETE_DESIGNATION
CREATE_ADMIN
UPDATE_ADMIN
CREATE_EMPLOYEE
UPDATE_EMPLOYEE
UPDATE_USER
```

The broad read permission group exists because multiple forms need department data while creating or editing users and designations.

### Create Department

Canonical path:

```http
POST /api/departments
```

Body:

```json
{
  "departmentName": "Software Development",
  "description": "Engineering and product development"
}
```

Rules:

1. `departmentName` is required, 2 to 100 chars.
2. `description` is optional, max 255 chars.
3. Department name must be unique.

### Update Department

Canonical path:

```http
PUT /api/departments/:id
PATCH /api/departments/:id
```

Body can include at least one of:

```json
{
  "departmentName": "Engineering",
  "description": "Updated description"
}
```

Rules:

1. Department id must be a positive integer.
2. Department must exist.
3. If department name changes, new name must be unique.

### Delete Department

Canonical path:

```http
DELETE /api/departments/:id
```

Rules:

1. Department id must be valid.
2. Department must exist.
3. Deletion is blocked when mapped department data contains any assigned employees or admins.
4. Prisma schema cascades designations when a department is deleted, but users block deletion first in service logic.

### Department Response Mapping

Repository loads `department.users`, then splits them into:

| Response field | Contents |
| --- | --- |
| `admins` | Users whose role normalizes to `ADMIN` or `SUPER_ADMIN`. |
| `employees` | Users whose role normalizes to `EMPLOYEE`. |

Each person entry is:

```json
{
  "id": 12,
  "firstName": "Ayesha",
  "lastName": "Khan",
  "user": {
    "id": 12,
    "email": "ayesha@example.com",
    "fullName": "Ayesha Khan",
    "status": "ACTIVE"
  }
}
```

The raw `users` relation is removed. Custom-role users are not placed in either array.

### All Alias Examples And Response Messages

Every one of the seven internal routes is available under all three mounts. For example, department 4 can be read through:

```text
GET /api/departments/4
GET /api/admin/departments/4
GET /api/v1/departments/4
```

Controller response contracts:

| Operation | Status | Message | `data` |
| --- | --- | --- | --- |
| List | 200 | `Departments fetched successfully` | Array, alphabetical by name. |
| Get | 200 | `Department fetched successfully` | One mapped department. |
| Create | 201 | `Department created successfully` | New mapped department. |
| Update | 200 | `Department updated successfully` | Updated mapped department. |
| Delete | 200 | `Department deleted successfully` | Deleted scalar department row. |
| Designation lookup | 200 | `Designations fetched successfully` | Light designation array. |

The nested designation lookup returns only:

```text
id, designationName, departmentId
```

ordered by designation name. It is the endpoint used by user forms after a department selection.

### Validation And Update Semantics

`PUT` and `PATCH` run the same partial-update schema. Neither requires a complete resource. At least one recognized key must survive Joi stripping.

- Missing/empty description on create defaults to `null`.
- Explicit `description: null` on update clears it.
- An empty-string update description is treated as empty/undefined; if it is the only key, the `.min(1)` object rule fails.
- Repository `data` contains possibly `undefined` properties; Prisma ignores those and updates only supplied values.
- Service IDs use JavaScript `Number`, so numeric-looking strings are accepted before positive-integer checking.

Name duplicate checks happen before create/update and are backed by the database unique constraint. Exact case sensitivity follows the configured MySQL collation.

### Deletion Nuances

The service blocks departments containing recognized Employee/Admin/Super Admin users regardless of employment status. It does not see custom-role users in its mapped arrays.

Consequently:

- A department with only a custom-role user can pass the manual guard.
- The current optional user relation/database migration permits department deletion to clear those users’ `departmentId`.
- All department designations are deleted by cascade.
- User designation relations to those deleted rows are set to null.

The service intentionally does not separately require a department to have zero designations. The cascade is part of current schema behavior.

There is no pagination, text search, count metadata, or server-side scoping on reads. Any actor holding one broad dropdown/read permission receives every department plus recognized assigned users’ email/status.

## 6. designations Module

Folder: `backend/src/modules/designations`

Purpose: CRUD for job designations scoped to departments.

Files:

| File | Purpose |
| --- | --- |
| `designation.routes.js` | Defines protected designation routes. |
| `designation.controller.js` | Calls designation service and sends responses. |
| `designation.service.js` | Parses ids, checks department existence, ensures unique names per department, blocks deletion when assigned. |
| `designation.repository.js` | Prisma queries for designation data. |
| `designation.validation.js` | Joi schemas for create/update. |

### Routes

Mounted at:

```text
/api/designations
```

| Method | Full path | Permission | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/designations` | any listed below | List all designations with department and assigned users. |
| `POST` | `/api/designations` | `CREATE_DESIGNATION` | Create designation in a department. |
| `PUT` | `/api/designations/:id` | `UPDATE_DESIGNATION` | Rename designation. |
| `PATCH` | `/api/designations/:id` | `UPDATE_DESIGNATION` | Rename designation. |
| `DELETE` | `/api/designations/:id` | `DELETE_DESIGNATION` | Delete designation if no users are assigned. |

Read/list permission group:

```text
VIEW_DESIGNATIONS
CREATE_DESIGNATION
UPDATE_DESIGNATION
DELETE_DESIGNATION
CREATE_ADMIN
UPDATE_ADMIN
CREATE_EMPLOYEE
UPDATE_EMPLOYEE
UPDATE_USER
```

### Create Designation

Body:

```json
{
  "departmentId": 1,
  "designationName": "Backend Developer"
}
```

Rules:

1. `departmentId` must be a positive integer.
2. Department must exist.
3. `designationName` is required, 2 to 100 chars.
4. Name is normalized by trimming and collapsing repeated whitespace.
5. The same designation name cannot exist twice in the same department.

### Update Designation

Body:

```json
{
  "designationName": "Senior Backend Developer"
}
```

Rules:

1. Designation id must be valid.
2. Designation must exist.
3. New name cannot duplicate another designation in the same department.
4. Department cannot be changed through this route.

### Delete Designation

Rules:

1. Designation id must be valid.
2. Designation must exist.
3. Deletion is blocked when `_count.users` is greater than zero.

Current implementation note: there is no `GET /api/designations/:id` endpoint.

### Designation Response Contract

List/create/update select an expanded object:

```json
{
  "id": 7,
  "designationName": "Backend Developer",
  "departmentId": 1,
  "department": {
    "id": 1,
    "departmentName": "Software Development"
  },
  "users": [
    {
      "id": 20,
      "userCode": "EMP020",
      "firstName": "Ali",
      "lastName": "Khan",
      "email": "ali@example.com",
      "employmentStatus": "ACTIVE"
    }
  ],
  "_count": {
    "users": 1
  }
}
```

Designations are ordered first by department name, then title. Assigned users are ordered by first/last name. This is an intentionally rich management response but can become large because every list item includes every assigned user plus a redundant count.

Delete returns the deleted scalar row (`id`, `designationName`, `departmentId`) rather than the expanded select.

Controller contracts:

| Operation | Status/message |
| --- | --- |
| List | 200 `Designations fetched successfully`. |
| Create | 201 `Designation created successfully`. |
| PUT/PATCH | 200 `Designation updated successfully`. |
| Delete | 200 `Designation deleted successfully`. |

### Designation Data Rules And Edge Cases

- The same normalized title can exist in two different departments.
- The composite database unique key prevents it twice in one department.
- Service normalization trims and collapses internal whitespace; `"Senior   Developer"` becomes `"Senior Developer"`.
- Updates rename only; they cannot change `departmentId`.
- GET’s broad permission group supports user/admin forms but exposes assigned-user emails to any actor holding one of those permissions.
- Application duplicate check and write are separate operations. A concurrent race is stopped by the unique key, although the generic duplicate normalizer may return less specific wording.
- Direct designation deletion is blocked when assigned users exist.
- Department deletion can cascade the same designation through another module without running this service guard; user designation IDs are then set null.
- There is no server-side filtering, pagination, single-record GET, or move-to-department operation.

## 7. leaves Module

Folder: `backend/src/modules/leaves`

Purpose: leave request workflow. The database and route permissions exist, but current controllers are placeholders.

Files:

| File | Purpose |
| --- | --- |
| `leave.routes.js` | Defines protected leave routes. |
| `leave.controller.js` | Currently returns placeholder messages only. |
| `leave.repository.js` | Contains Prisma functions for leave requests, approvals, and history. Not currently called by controllers. |
| `leave.service.js` | Empty. |
| `leave.mapper.js` | Empty. |
| `leave.validation.js` | Empty. |

### Routes

Mounted at:

```text
/api/leaves
```

| Method | Full path | Permission | Current response purpose |
| --- | --- | --- | --- |
| `POST` | `/api/leaves` | `CREATE_LEAVE` | Returns `"Create Leave API"`. |
| `GET` | `/api/leaves/my` | `VIEW_OWN_LEAVES` | Returns `"My Leaves API"`. |
| `GET` | `/api/leaves/team` | `VIEW_TEAM_LEAVES` | Returns `"Team Leaves API"`. |
| `PATCH` | `/api/leaves/:id/approve` | `APPROVE_LEAVE` | Returns `"Leave Approved"`. |
| `PATCH` | `/api/leaves/:id/reject` | `REJECT_LEAVE` | Returns `"Leave Rejected"`. |
| `PATCH` | `/api/leaves/:id/cancel` | `CANCEL_LEAVE` | Returns `"Leave Cancelled"`. |

### Intended Database Support

The repository has these functions:

| Function | Intended purpose |
| --- | --- |
| `createLeave(data)` | Create `LeaveRequest`. |
| `getMyLeaves(userId)` | List leave requests for one requester with approvals and history. |
| `getTeamLeaves(departmentId)` | List leave requests for users in a department. |
| `getLeaveById(id)` | Load leave request with approvals, history, and requester. |
| `updateLeaveStatus(id, data)` | Update request status/current approver fields. |
| `createApproval(data)` | Create an approval row. |
| `updateApproval(id, data)` | Update an approval row. |
| `createHistory(data)` | Create approval history row. |

Database workflow fields:

| Field | Purpose |
| --- | --- |
| `LeaveRequest.status` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. |
| `LeaveRequest.currentApprovalLevel` | Tracks the current level, default `1`. |
| `LeaveRequest.currentRefersTo` | Current approver user id. |
| `LeaveApproval.approvalLevel` | Level-specific approval record. |
| `LeaveApproval.status` | `PENDING`, `APPROVED`, or `REJECTED`. |
| `LeaveApprovalHistory.action` | `APPROVED`, `REJECTED`, or `CANCELLED`. |

Current implementation notes:

| Note | Detail |
| --- | --- |
| No service logic | Leave business rules are not implemented. |
| No validation | Request body and params are not Joi-validated. |
| Frontend uses mock data | `frontend-admin/pages/dashboard/leaves/index.vue` uses local sample requests and TODO comments instead of calling an API service. |
| No `VIEW_ALL_LEAVES` route | Permission exists, but no backend route currently uses it directly. |

### What A Leave Request Actually Does Today

Authentication and permission checks are real. After they pass, each controller ignores:

```text
req.user
req.params.id
req.body
req.query
```

and immediately calls `res.json(...)`. Therefore:

- `POST /api/leaves` returns 200 rather than 201 and creates nothing.
- `GET /my` and `/team` return no leave array.
- `PATCH /anything/approve` returns success even when the ID is nonnumeric or does not identify an existing request. A truly missing URL segment does not match the route and returns 404.
- Approve/reject/cancel do not validate ownership, approver, department, current status, or decision note.
- No controller imports the service or repository.
- Responses contain `success` and `message` but no standard `data` key.

Example actual response:

```json
{
  "success": true,
  "message": "Leave Approved"
}
```

The controllers are `async` functions but are not wrapped with `asyncHandler`. That causes no issue while they contain no awaits, but future rejected Promise logic would need the wrapper or explicit `next(error)` in Express 4.

### What The Schema Appears Designed To Support

The data model describes a multi-step process:

```text
user creates LeaveRequest
  -> overall status PENDING
  -> currentApprovalLevel = 1
  -> currentRefersTo points to current approver
  -> one/more LeaveApproval rows record step state
  -> LeaveApprovalHistory records decisions
  -> final status becomes APPROVED or REJECTED
  -> requester may CANCEL where allowed
```

`roles.js` defines intended approval levels Admin = 1 and Super Admin = 2, but no leave code calls that helper.

The low-level repository is not enough by itself. It does not currently enforce:

- Start date before/equal end date.
- Inclusive total-day calculation.
- Friendly request-level validation of leave type. Prisma/MySQL ultimately enforce
  the `LeaveRequestType` enum, but an invalid value would not receive a deliberate
  field-level 400 response from this unfinished layer.
- Overlapping leave requests.
- Leave balances.
- Legal status transitions.
- Request ownership.
- Team/department scope.
- Selection of the correct approver.
- Atomic request + approval + history updates.

Its team/by-ID includes use `user: true`, which would select password hashes and other user scalars if returned directly. A safe mapper must be connected before exposing those raw results; the current mapper file is empty.

### Current Role Access To Placeholder Routes

With fallback/seed permissions:

| Role | Routes it can currently pass |
| --- | --- |
| Super Admin | Team, approve, reject. |
| Admin | Create, my, team, approve, reject, cancel. |
| Employee | Create, my, cancel. |
| Custom role | Whatever its database permission rows grant. |

The absence of a fallback `CREATE_LEAVE` for Super Admin means Super Admin cannot use the placeholder create route unless the database role also grants it.

The frontend is equally disconnected: its list contains four hard-coded July 2026 records, approve/reject mutates only a Vue array, and both apply interfaces log data/TODO instead of sending HTTP. Refreshing discards every local change.

## 8. roles Module

Folder: `backend/src/modules/roles`

Purpose: manage roles and their permission assignments.

Files:

| File | Purpose |
| --- | --- |
| `role.routes.js` | Defines protected role and permission routes. |
| `role.controller.js` | Calls role service and sends responses. |
| `role.service.js` | Parses ids, validates payload manually, checks uniqueness and assigned users. |
| `role.repository.js` | Prisma queries and role-permission transaction handling. |

Current implementation note: there is no Joi validation file for roles. Payload validation happens in `role.service.js`.

### Routes

Mounted at:

```text
/api/roles
```

| Method | Full path | Permission | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/roles` | any listed below | List roles with permissions and user count. |
| `GET` | `/api/roles/permissions` | `VIEW_ROLES` or `CREATE_ROLE` or `UPDATE_ROLE` | List all available permissions. |
| `GET` | `/api/roles/:id/details` | `VIEW_ROLES` | Get role with permissions and assigned users. |
| `GET` | `/api/roles/:id` | `VIEW_ROLES` or `UPDATE_ROLE` | Get role with permissions and user count. |
| `POST` | `/api/roles` | `CREATE_ROLE` | Create role with permission ids. |
| `PUT` | `/api/roles/:id` | `UPDATE_ROLE` | Update role name and replace permission ids. |
| `DELETE` | `/api/roles/:id` | `DELETE_ROLE` | Delete role if no users are assigned. |

Role list permission group:

```text
VIEW_ROLES
CREATE_ROLE
UPDATE_ROLE
DELETE_ROLE
CREATE_ADMIN
CREATE_EMPLOYEE
UPDATE_USER
```

This broad list lets user-management forms load roles when creating or editing users.

### Create Role

Body:

```json
{
  "roleName": "HR Manager",
  "permissions": [1, 2, 3]
}
```

Rules:

1. `roleName` is required after conversion and trimming.
2. Role name must be unique.
3. A non-array `permissions` value becomes an empty set and fails the at-least-one rule.
4. Array entries are coerced with `Number`; invalid/non-positive/non-integer entries are silently removed and duplicates are removed.
5. At least one valid permission is required.
6. Every permission id must exist.
7. Role and role-permission rows are created in one transaction.

Role-name handling is manual rather than Joi-based. It collapses repeated internal
whitespace, but converts any truthy input through `String(...)`. Numbers,
booleans, arrays, and objects can therefore become names such as `"123"`,
`"true"`, or `"[object Object]"` instead of receiving a type-validation error.

### Update Role

Body:

```json
{
  "roleName": "Senior HR Manager",
  "permissions": [1, 2, 5]
}
```

Rules:

1. Role id must be valid.
2. Role must exist.
3. New name must not duplicate another role.
4. Permission ids are validated.
5. Existing role-permission rows are deleted.
6. New role-permission rows are inserted.
7. All changes happen in one transaction.

### Delete Role

Rules:

1. Role id must be valid.
2. Role must exist.
3. Deletion is blocked when `_count.users` is greater than zero.

### Role Details Response

`GET /api/roles/:id/details` includes:

| Field | Purpose |
| --- | --- |
| role fields | Basic role data. |
| `rolePermissions` | Permission links and permission records. |
| `users` | Assigned users with department and designation information. |

The list and simple get response shape is the raw role plus:

```json
{
  "rolePermissions": [
    {
      "roleId": 4,
      "permissionId": 10,
      "permission": {
        "id": 10,
        "permissionName": "VIEW_EMPLOYEES"
      }
    }
  ],
  "_count": {
    "users": 3
  }
}
```

The details endpoint replaces the count-only view with assigned user data. Each assigned user includes `id`, names, email, department object, and a flattened designation name. It includes users of any account type because assignment is based purely on `roleId`.

### Endpoint Behavior Summary

| Endpoint | Data behavior |
| --- | --- |
| `GET /api/roles` | All roles alphabetically with permission junctions and user count; no paging. |
| `GET /api/roles/permissions` | All permission records alphabetically. |
| `GET /api/roles/:id` | Same expanded role shape for one ID. |
| `GET /api/roles/:id/details` | Permission junctions plus assigned-user details. |
| `POST /api/roles` | Creates role + junctions atomically and returns expanded role. |
| `PUT /api/roles/:id` | Full role-name/permission-set replacement. |
| `DELETE /api/roles/:id` | Deletes unassigned role; returns success with default `{}` data. |

Static `/permissions` is registered before dynamic `/:id`, so `permissions` is never incorrectly treated as an ID.

Role updates are all-or-nothing:

```text
update role name
  -> delete all old role_permissions
  -> create all selected role_permissions
  -> read updated role
```

These operations run in one Prisma transaction, so an insertion error rolls the earlier delete/name change back.

### Core-Role Operational Consequences

The roles module has no concept of immutable/system roles:

- `Super Admin`, `Admin`, and `Employee` can be renamed.
- An unassigned core role can be deleted.
- Renaming Employee/Admin can make role-specific user creation/list logic unable to find that role.
- Renaming changes role normalization and can remove or activate hard-coded authentication fallbacks.
- Editing a core role’s database permission rows cannot remove its fallback permissions from authenticated users.

Role name length is not checked in the service. The database limit is 50 characters, so an oversized name can become an unexpected 500 rather than a clean field-level 400.

There is no `PATCH` route. Update callers must supply both a nonblank `roleName` and at least one valid retained permission ID. Mixed arrays silently discard invalid entries; if at least one valid ID remains, the request can succeed.

## 9. users Module

Folder: `backend/src/modules/users`

Purpose: manage all user accounts, including admin accounts and employee accounts.

Files:

| File | Purpose |
| --- | --- |
| `user.routes.js` | Defines protected user, admin, and employee management routes. |
| `user.controller.js` | Calls user service and returns standard responses. |
| `user.service.js` | Checks create/update permissions, duplicate emails, roles, departments, designations, passwords, statuses. |
| `user.repository.js` | Prisma user CRUD, code generation, mapping users/admins/employees. |
| `user.validation.js` | Joi schemas for admin, employee, generic user create, and update. |

### Routes

Mounted at:

```text
/api/users
```

All routes use `authMiddleware` because `router.use(authMiddleware)` is registered at the top of `user.routes.js`.

| Method | Full path | Permission | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/users` | `CREATE_ADMIN` or `CREATE_EMPLOYEE` | Create a user with selected `roleId`; supports user photo upload. |
| `GET` | `/api/users` | `UPDATE_USER` | List all users. |
| `POST` | `/api/users/admin` | `CREATE_ADMIN` | Create an Admin user; supports admin photo upload. |
| `GET` | `/api/users/admins` | `VIEW_ADMINS` | List Admin users. |
| `GET` | `/api/users/users` | `UPDATE_USER` | Compatibility alias for listing all users. |
| `GET` | `/api/users/admin/:id` | `VIEW_ADMINS` | Get one Admin user. |
| `GET` | `/api/users/admins/:id` | `VIEW_ADMINS` | Alias for getting one Admin user. |
| `PUT` | `/api/users/admin/:id` | `UPDATE_ADMIN` | Update Admin user; supports admin photo upload. |
| `PATCH` | `/api/users/admin/:id` | `UPDATE_ADMIN` | Partial update Admin user; supports admin photo upload. |
| `PATCH` | `/api/users/admins/:id` | `UPDATE_ADMIN` | Alias for partial Admin update. |
| `GET` | `/api/users/:id` | `UPDATE_USER` | Get any user by id. |
| `PUT` | `/api/users/:id` | `UPDATE_USER` | Update any user; supports user photo upload. |
| `PATCH` | `/api/users/:id` | `UPDATE_USER` | Partial update any user; supports user photo upload. |
| `DELETE` | `/api/users/admin/:id` | `DELETE_ADMIN` | Delete an Admin user. |
| `DELETE` | `/api/users/admins/:id` | `DELETE_ADMIN` | Alias for deleting an Admin user. |
| `POST` | `/api/users/employee` | `CREATE_EMPLOYEE` | Create Employee user without photo upload middleware. |

### Generic Create User

Canonical path:

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

`multipart/form-data` is required only when a new photo file is included. A normal
JSON request also works when no file is being uploaded. In either case, the upload
middleware runs before Joi validation, and a successful upload adds the saved
relative URL to `req.body.photo`.

Required fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `email` | email string | Unique login email. |
| `password` | string, 8 to 128 chars | Plain password, hashed before insert. |
| `firstName` | string | First name. |
| `lastName` | string | Last name. |
| `roleId` | positive integer | Determines whether code is `ADM...` or `EMP...`. |
| `departmentId` | positive integer | Existing department. |

Optional fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `phone` | string or null | User phone. |
| `address` | string or null | User address. |
| `photo` | uploaded file or string path | User photo path. |
| `designation` | string or numeric string | Designation fallback. |
| `designationId` | positive integer or null | Preferred designation id. |
| `employmentStatus` | enum | Defaults to `ACTIVE`. |
| `joiningDate` | date or null | User joining date. |

Business rules:

1. `roleId` must exist.
2. The actor must have permission to create that role type:
   - Admin or Super Admin role target requires `CREATE_ADMIN`.
   - Employee or any custom-role target requires `CREATE_EMPLOYEE`.
3. Email must be unique.
4. Department must exist.
5. Designation is required and must belong to selected department.
6. Password is hashed.
7. Code type is selected from role:
   - `SUPER_ADMIN` or `ADMIN` -> `ADM###`
   - `EMPLOYEE` or any other/custom role key -> `EMP###`
8. User is created in a Prisma transaction.

Flow:

```text
POST /api/users
  -> authMiddleware
  -> requireAnyPermission("CREATE_ADMIN", "CREATE_EMPLOYEE")
  -> uploadUserPhoto
  -> validate(createUserSchema)
  -> userController.createUser
  -> userService.createUser(req.user, req.body)
  -> repository.findRoleById
  -> requireCreatePermission(actor, roleKey)
  -> repository.findUserByEmail
  -> ensureDepartmentExists
  -> ensureDesignationBelongsToDepartment
  -> hashPassword
  -> repository.createUser
  -> generateNextAdminCode or generateNextEmployeeCode
  -> tx.user.create
```

### Create Admin

Canonical path:

```http
POST /api/users/admin
```

Purpose: creates a user with the seeded `ADMIN` role. It does not create `SUPER_ADMIN`.

Required fields:

| Field | Type |
| --- | --- |
| `email` | email string |
| `password` | string, 8 to 128 chars |
| `firstName` | string |
| `departmentId` | positive integer |

Optional fields:

```text
lastName, phone, address, designation, designationId, employmentStatus, joiningDate, photo
```

Business rules:

1. Requires `CREATE_ADMIN`.
2. Email must be unique.
3. `ADMIN` role must exist.
4. Department must exist.
5. Designation is required and must belong to department.
6. Generates `ADM###`.
7. Creates user in a transaction.

`parseAdminDepartments` runs before validation. It parses `managedDepartmentIds` from JSON if present and normalizes empty `departmentId` and `joiningDate`. Current schema stores one `departmentId`; parsed `managedDepartmentIds` is mostly a compatibility field.

### List Users

Canonical paths:

```http
GET /api/users
GET /api/users/users
```

Permission: `UPDATE_USER`.

Returns every user sorted by first name and last name. Repository maps each row into fields like:

```text
id, userId, userCode, type, name, fullName, firstName, lastName,
email, phone, address, photo, designationId, designation, joiningDate,
roleId, role, roleName, status, employmentStatus, departmentId,
department, managedDepartments, managedDepartmentIds, createdAt, updatedAt
```

### List Admins

Canonical path:

```http
GET /api/users/admins
```

Permission: `VIEW_ADMINS`.

Returns users whose role normalizes to `ADMIN`. Current query does not include `SUPER_ADMIN` in this list.

### Get User

Canonical path:

```http
GET /api/users/:id
```

Permission: `UPDATE_USER`.

Rules:

1. `id` must be a positive integer.
2. User must exist.

### Get Admin

Canonical paths:

```http
GET /api/users/admin/:id
GET /api/users/admins/:id
```

Permission: `VIEW_ADMINS`.

Rules:

1. `id` must be a positive integer.
2. User must exist and have Admin role.

### Update Any User

Canonical paths:

```http
PUT /api/users/:id
PATCH /api/users/:id
```

Permission: `UPDATE_USER`.

Allowed fields:

```text
email, password, firstName, lastName, phone, address, departmentId,
designation, designationId, employmentStatus, joiningDate, photo, roleId, role
```

Rules:

1. User id must be valid.
2. User must exist.
3. If email changes, new email must be unique.
4. If `departmentId` is provided and non-null, department must exist.
5. If `roleId` is provided, role must exist.
6. If `role` name is provided, role must exist.
7. If designation input is provided, designation must belong to the selected or existing department.
8. If department changes with no designation input, designation is cleared.
9. If password is provided, it is hashed.
10. Repository writes only provided fields.

If `employmentStatus` is explicitly `null`, the schema accepts it but
`normalizeEmploymentStatus` treats the falsy value as `ACTIVE`. It does not clear
status; it silently reactivates/resets the account to `ACTIVE`.

### Update Admin

Canonical paths:

```http
PUT /api/users/admin/:id
PATCH /api/users/admin/:id
PATCH /api/users/admins/:id
```

Permission: `UPDATE_ADMIN`.

Allowed fields:

```text
email, password, firstName, lastName, phone, address, departmentId,
designation, designationId, employmentStatus, joiningDate, photo
```

Rules:

1. Admin id must be valid.
2. Admin must exist.
3. If email changes, new email must be unique.
4. If `departmentId` is provided and non-null, department must exist.
5. If designation input is provided, designation must belong to the selected or existing department.
6. If department changes with no designation input, service clears designation.
7. If password is provided, it is hashed.

The same status behavior applies here: explicit
`"employmentStatus": null` is normalized to `ACTIVE`.

Current implementation note: `user.service.updateAdmin` validates
`departmentId`, but `user.repository.updateAdmin` never writes it to `userData`.
An admin department change through this method therefore does not persist. If the
same request supplies a designation, the service validates that designation
against the requested new department and the repository can save it while keeping
the old department. Because those are independent foreign keys, this can store a
department/designation pair that does not belong together.

### Delete Admin

Canonical paths:

```http
DELETE /api/users/admin/:id
DELETE /api/users/admins/:id
```

Permission: `DELETE_ADMIN`.

Rules:

1. Admin id must be valid.
2. Admin must exist.
3. User row is deleted in a transaction.

### Create Employee Through Users Module

Canonical path:

```http
POST /api/users/employee
```

Permission: `CREATE_EMPLOYEE`.

This is a secondary employee creation route. It uses `createEmployeeSchema` but does not run photo upload middleware. For photo uploads, the canonical current employee creation route is `POST /api/admin/employees` or generic `POST /api/users`.

Unlike the generic route, this controller returns the repository's selected Prisma
shape. Its nested `role` and `designation` fields therefore do not have exactly the
same shape as the output from `mapUser`. The request schema accepts `joiningDate`,
but the employee repository method does not currently add it to the create data, so
that value is silently lost.

### Why Static User Paths Are Declared Before `/:id`

Express evaluates routes in declaration order. A dynamic route such as
`GET /:id` can match any one-segment value, including the word `admins`. The router
therefore declares the same-method, one-segment `GET /admins` and `GET /users`
paths before `GET /:id`. If `GET /:id` were moved above them, Express would try to
validate those words as user IDs. Two-segment `/admin/:id` cannot be shadowed by
one-segment `/:id`. `POST /employee` is actually declared after the generic
GET/PUT/PATCH routes and is safe because there is no competing `POST /:id`.

### User Response Shapes

The module has three related but non-identical response shapes:

| Source | Shape |
| --- | --- |
| Generic list/get/create/update | `mapUser` flattens role, designation, department, status, and compatibility fields into one object. |
| Admin list/get/create/update | `mapAdmin` returns admin-centric fields plus a nested `user` object containing login email, role, and status information. |
| `POST /employee` | Returns the repository's Prisma selection with nested `role`, `department`, and `designation` objects. |

This matters to frontend code. A component written against a generic mapped
record's `roleName` does not directly work with the employee-create result, whose
nested value is `role.roleName` (and designation is
`designation.designationName`). A cleaner
future design would define one response DTO per public resource and make every
controller return it consistently.

The generic mapper includes:

```text
id, userId, userCode, type, name, fullName, firstName, lastName,
email, phone, address, photo, designationId, designation, joiningDate,
roleId, role, roleName, status, employmentStatus, departmentId,
department, managedDepartments, managedDepartmentIds, createdAt, updatedAt
```

`managedDepartments` and `managedDepartmentIds` are compatibility projections.
The current Prisma model stores only one `departmentId` on a user; it does not
contain a real many-to-many administrator-to-department assignment table.

### Authorization Boundaries in the Users Module

Authentication and permission middleware protect every route, but target-account
hierarchy is not enforced:

1. `GET /api/users` requires `UPDATE_USER`, not a separate read permission.
2. `GET`, `PUT`, and `PATCH /api/users/:id` all require the same
   `UPDATE_USER` permission.
3. A caller with `UPDATE_USER` can submit `roleId` or `role` and change the target
   to any existing role, including `Super Admin`.
4. There is no check that the caller outranks the target, no "cannot edit yourself"
   rule, and no protection against demoting the final Super Admin.
5. Admin deletion has no self-deletion check.

This is an important distinction: route authorization answers "may this actor call
this controller?" but the service must also answer "may this actor perform this
specific change to this specific target?" The first check exists; the second is
currently incomplete.

### User Code Generation

The users repository finds the greatest existing numeric suffix and adds one:

```text
largest ADM code  -> ADM007 -> next ADM008
largest EMP code  -> EMP042 -> next EMP043
```

This is readable but is not a database sequence. Two simultaneous requests can
both calculate the same next code. The `admin-employees` module retries code
collisions, while the users module currently does not. The database unique
constraint prevents duplicate storage, but one of the concurrent requests can
fail with HTTP 409. A recognized `userCode` target produces
`User code is already registered`; an unrecognized P2002 target produces the
generic duplicate-conflict message.

### User Validation and Database Mismatches

Joi validates API input before the service, while Prisma/MySQL enforce the final
database shape. Those layers currently disagree in several places:

| Mismatch | Effect |
| --- | --- |
| Some admin/update schemas allow `lastName: null`; Prisma requires a non-null `lastName`. | A request can pass Joi and fail during `prisma.user.create` or `update`. |
| Joi permits phone strings up to 30 characters; the database column is `VARCHAR(20)`. | Long values can be rejected or truncated by the database configuration. |
| Generic create accepts `joiningDate` as a date but does not mark an empty string as empty. | The frontend's `joiningDate: ""` can cause the project's 400 validation response instead of being treated as missing. |
| Update schemas allow `employmentStatus: null`; the service normalizer maps falsy values to `ACTIVE`. | Explicit null reactivates/resets rather than clearing status. |
| `managedDepartmentIds` can be parsed by admin middleware but is not a stored many-to-many field. | It is stripped/ignored after compatibility parsing. |
| The `User` table contains both `employmentStatus` and nullable `status`. | Services consistently use `employmentStatus`; the separate `status` column is effectively ignored. |

### Photo Update Lifecycle

For routes with upload middleware:

```text
Multer saves the new file
  -> Joi validates text fields
  -> service/repository updates photo URL
```

The global error handler attempts to remove the just-uploaded file if a downstream
error is passed to it; unlink failure is ignored. On a successful replacement,
however, the previous photo file is not deleted. Repeated photo changes can
therefore leave unused files under
`backend/uploads`. The special `parseAdminDepartments` error path sends its own
response rather than forwarding the error and can also leave a newly uploaded file
behind.

Deleting an Admin removes the database row but does not delete its current photo
from disk. Account deletion can therefore orphan a file as well.

### Current Implementation Notes for Users

| Note | Detail |
| --- | --- |
| Employee delete permission exists | `DELETE_EMPLOYEE` exists, but no backend route currently deletes an employee. |
| Admin list excludes Super Admin | `listAdmins` uses Admin role aliases only. |
| Admin update department persistence issue | `departmentId` is validated but never written in `repository.updateAdmin`; a new-department designation can be saved beside the unchanged old department. |
| Admin alias middleware differs | `PATCH /admin/:id` runs upload parsing and `parseAdminDepartments`; `PATCH /admins/:id` does not run the compatibility parser. |
| Generic role escalation | `UPDATE_USER` alone can change `roleId`/`role`, including promotion to Super Admin. |
| Employee `joiningDate` is dropped | `POST /employee` accepts it in Joi but the repository does not persist it. |
| User codes can race | The users module uses max-plus-one generation without the retry used by `admin-employees`. |
| Successful photo replacement leaks old file | The database points to the new path, but the old disk file remains. |
| `managedDepartments` compatibility | Current schema has one `departmentId`; response maps it to a one-item `managedDepartments` array for compatibility. |

## Seed Data

Main seed file: `database/seed.js`

The main seed performs:

1. Seed roles: `Super Admin`, `Admin`, `Employee`.
2. Seed department-scoped designations for existing departments.
3. Seed permissions.
4. Seed role-permission links.
5. Optionally seed a Super Admin from `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD`.

The seed uses upserts, which makes repeated runs mostly safe:

```text
exact desired roleName
  -> create when absent
  -> write the same roleName when already present

permission key
  -> create or update permissionName

role + permission link
  -> create when absent
  -> keep when already present
```

There is no immutable core-role key. The role upsert locates a row by the desired
readable `roleName` itself. If `Super Admin` was renamed to `Root`, rerunning the
seed creates a new `Super Admin` row; it does not identify and rename `Root` back.
An older alias such as `SUPER_ADMIN` can likewise coexist with the newly seeded
readable name.

There are several practical details:

| Detail | Meaning |
| --- | --- |
| Departments are not created by the main seed | Designations are only inserted for named departments that already exist. On an empty database, those designation loops can skip every item. |
| Role-permission seeding is additive | It creates expected links but does not delete old links that were removed from the seed definition. |
| Core permission fallback still applies | Even after editing database links, the authentication service unions the core role's static fallback permissions into the session. |
| Optional Super Admin | Creation runs only when both `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD` exist. |
| Environment is loaded early | Root environment setup requires at least `DATABASE_URL` and `JWT_SECRET`, even for operations whose business logic does not use JWT directly. |

`database/seeds/superadmin.seed.js` is a separate focused script. It requires the Super
Admin environment variables and hashes with a hard-coded bcrypt cost of 12,
whereas the main application uses the configured bcrypt rounds. Both seed paths
use application-style `ADM###` code generation, so the same max-plus-one
concurrency limitation applies.

Separate seed files also exist:

| File | Purpose |
| --- | --- |
| `roles.seed.js` | Upserts core roles. |
| `permissions.seed.js` | Upserts permissions. |
| `rolePermissions.seed.js` | Links core roles to permissions. |
| `superadmin.seed.js` | Upserts a Super Admin, requires seed email/password env vars. |
| `designations.seed.js` | Upserts designations for existing departments. |

These are standalone/manual scripts. The root `npm run prisma:seed` command invokes
only `database/seed.js`; that main file reimplements its phases and does not import
the individual files listed above.

## Code Generation

Files:

```text
backend/src/utils/admin-code.js
backend/src/utils/employee-code.js
```

Admin codes:

```text
ADM001, ADM002, ADM003
```

Employee codes:

```text
EMP001, EMP002, EMP003
```

Both helpers query the current maximum numeric suffix from `users.userCode`, increment it, and format the next code.

Current implementation note: `admin-employees.service.js` retries employee-code collisions, but `users.repository.createUser`, `createAdmin`, and `createEmployee` do not add their own retry loop.

## Frontend Admin Flow

Folder: `frontend-admin`

The frontend is a Nuxt 4 application built on Vue 3. It is a separate Node.js
workspace from the Express backend:

```text
browser
  -> Nuxt page and Vue components on the frontend origin
  -> $fetch request to http://localhost:5000/api/...
  -> Express backend
  -> Prisma
  -> MySQL
```

There are no Nuxt `server/api` handlers in this project. Every business-data
request goes to the external Express server. This keeps the two routing systems
separate:

| Routing system | Example | What it returns |
| --- | --- | --- |
| Nuxt file route | Browser opens `/dashboard/users` | HTML and Vue UI for the user-list screen. |
| Express API route | UI calls `GET /api/users` | JSON containing user data. |

### Nuxt And Vue Concepts Used Here

Nuxt provides several features used throughout the frontend:

| Feature | How this project uses it |
| --- | --- |
| File-based routing | Files under `pages` automatically become browser routes. |
| Layouts | `definePageMeta({ layout: "dashboard" })` wraps a page in the sidebar/header shell. |
| Auto-imports | Vue/Nuxt functions such as `ref`, `computed`, `onMounted`, `useRoute`, `useRuntimeConfig`, and `navigateTo` can be used without manual imports. |
| Component auto-import | Components inside `components` can be referenced using generated names such as `DashboardSummaryCards`. |
| `useState` | Creates Nuxt-managed shared reactive state; authentication uses the key `auth.user`. |
| `$fetch` | Sends HTTP requests, serializes JSON bodies, parses JSON responses, and throws for non-2xx responses. |
| `<NuxtLink>` | Performs client-side navigation without a full browser refresh. |

Vue's Composition API provides the local behavior:

```text
ref(value)            -> reactive wrapper for one value
reactive(object)      -> reactive form/object
computed(function)   -> derived value recalculated from dependencies
watch(source, fn)     -> run logic when a reactive value changes
onMounted(fn)         -> run after component mounts in the browser
onUnmounted(fn)       -> clean up timers/listeners
```

For example, the dashboard starts a 30-second refresh timer in `onMounted` and
clears it in `onUnmounted`. The user forms watch `departmentId` so a department
change can clear and reload the designation list.

`app.vue` is the application root:

```vue
<NuxtLayout>
  <NuxtPage />
</NuxtLayout>
```

`NuxtPage` renders the page selected by the URL. `NuxtLayout` applies the layout
chosen by the page metadata.

### Frontend Runtime Configuration

The default backend base URL is:

```ts
runtimeConfig.public.apiBase = "http://localhost:5000/api"
```

Because the base already ends with `/api`, services append `/users`, `/roles`,
and other resource paths rather than adding a second `/api`. A deployed build
should supply its public runtime value for the deployed backend; otherwise the
browser will continue trying to call `localhost:5000`.

The package uses ESM (`"type": "module"`), while the backend uses CommonJS. This
is why frontend files use `import`/`export` and backend files use
`require`/`module.exports`.

The main frontend dependencies are Nuxt, Vue, Vue Router, ECharts, and
`vue-echarts`. There is no Tailwind dependency or Tailwind configuration. Several
dashboard templates contain Tailwind-style utility names such as `space-y-8`,
`bg-white`, and `grid-cols-2`; those class names do not gain Tailwind styles in
the current setup. Components with their own scoped CSS still render those
styles. `assets/css/dashboard.css` is empty and is not registered as a global
stylesheet.

### How File Names Become Frontend Routes

Nuxt converts folder and file names into URL segments:

```text
pages/dashboard/users/index.vue       -> /dashboard/users
pages/dashboard/users/add.vue         -> /dashboard/users/add
pages/dashboard/users/edit/[id].vue   -> /dashboard/users/edit/:id
```

`index.vue` represents the folder itself. Square brackets create a dynamic
parameter. On `/dashboard/users/edit/42`, `useRoute().params.id` is `"42"`.

The complete generated page-route inventory is:

| Browser route | Source page | Page-level access check | Actual purpose/current behavior |
| --- | --- | --- | --- |
| `/` | `pages/index.vue` | global middleware applies first | With no token, middleware redirects before mount. With a token, middleware calls `/me`; then the page sees the token, redirects to dashboard, and that navigation calls `/me` again. |
| `/login` | `pages/login.vue` | global middleware skips it | Login form; an existing token causes an immediate dashboard redirect and is validated on the next navigation. |
| `/dashboard` | `pages/dashboard/index.vue` | authenticated by global middleware | Loads the permission-shaped dashboard response and refreshes it every 30 seconds. |
| `/dashboard/departments` | `pages/dashboard/departments/index.vue` | `VIEW_DEPARTMENTS` | Lists/searches departments and exposes permission-specific actions. |
| `/dashboard/departments/add` | `pages/dashboard/departments/add.vue` | `CREATE_DEPARTMENT` | Creates a department. |
| `/dashboard/departments/edit/:id` | `pages/dashboard/departments/edit/[id].vue` | `UPDATE_DEPARTMENT` | Loads and updates one department. |
| `/dashboard/designations` | `pages/dashboard/designations/index.vue` | any designation CRUD permission | Loads departments/designations and performs create, update, and delete in one screen. |
| `/dashboard/leaves` | `pages/dashboard/leaves/index.vue` | no redirect guard | Displays and mutates hard-coded July 2026 leave records in browser memory. |
| `/dashboard/leaves/apply` | `pages/dashboard/leaves/apply.vue` | `CREATE_LEAVE` | Logs a local form and returns to the list; it does not call the API. |
| `/dashboard/roles` | `pages/dashboard/roles/index.vue` | any role CRUD permission | Lists roles. Its current Delete button refreshes the list but does not delete. |
| `/dashboard/roles/create` | `pages/dashboard/roles/create.vue` | `CREATE_ROLE` | Loads the permission catalog and creates a role. |
| `/dashboard/roles/:id` | `pages/dashboard/roles/[id].vue` | `UPDATE_ROLE` | Loads a role and permissions, then replaces the role name/permission set. |
| `/dashboard/roles/view/:id` | `pages/dashboard/roles/view/[id].vue` | `VIEW_ROLES` | Loads role details, assigned users, and permissions. |
| `/dashboard/users` | `pages/dashboard/users/index.vue` | `VIEW_USERS` | Intended user list, but `VIEW_USERS` is not defined or seeded, so normal seeded accounts are redirected. |
| `/dashboard/users/add` | `pages/dashboard/users/add.vue` | `CREATE_ADMIN` or `CREATE_EMPLOYEE` | Intended multipart user-create form; currently fails at runtime because of undefined/misnamed helpers. |
| `/dashboard/users/create` | `pages/dashboard/users/create.vue` | indirect | Compatibility redirect to `/dashboard/users/add`. |
| `/dashboard/users/edit/:id` | `pages/dashboard/users/edit/[id].vue` | `UPDATE_USER` | Loads supporting lists and an existing user, then sends a generic update. |

The sidebar also links to the following routes, but no matching page files exist:

```text
/dashboard/attendance
/dashboard/reports
/dashboard/settings
```

Nuxt therefore renders its not-found page for those links. The attendance link is
not an attendance API viewer; the backend only has an import endpoint.

### Dashboard Layout And Shared Navigation

All dashboard pages select `layouts/dashboard.vue`. Its tree is:

```text
dashboard layout
  -> fixed Sidebar, 250px wide
  -> content area with 250px left margin
       -> fixed Header, 80px high
       -> page slot with top padding for the header
```

The sidebar computes visibility for five feature groups:

| Sidebar item | Visible when the user has at least one of |
| --- | --- |
| Users | Admin/employee view, create, update, or delete permissions, or `UPDATE_USER`. |
| Roles & Permissions | Any role CRUD permission. |
| Departments | Any department CRUD permission. |
| Designations | Any designation CRUD permission. |
| Leave Requests | `CREATE_LEAVE`, `VIEW_OWN_LEAVES`, `VIEW_TEAM_LEAVES`, or `VIEW_ALL_LEAVES`. |
| Dashboard, Attendance, Reports, Settings | Always visible after authentication. |

Sidebar visibility is only a presentation decision. A hidden link is not a
security control because a user can type a URL or call an API directly. Express
permission middleware remains the authoritative access check.

The Header reads the shared auth state to display a name and role. It builds an
avatar through the external `ui-avatars.com` service rather than using the stored
user photo. The bell has no click behavior. Logout clears local browser state and
navigates to `/login`; it does not call `authService.logout`, so the already-issued
JWT remains cryptographically usable until it expires.

### Complete Frontend Authentication Lifecycle

The relevant files are:

```text
pages/login.vue
middleware/auth.global.ts
services/auth.service.js
composables/useAuthUser.js
components/dashboard/Header.vue
```

Login has two API steps:

```text
submit email and password
  -> POST /api/login
  -> receive JWT and login user
  -> temporarily write JWT to localStorage
  -> GET /api/me with Authorization: Bearer <JWT>
  -> receive current database-backed safe user and permissions
  -> write token and user JSON to localStorage
  -> set useState("auth.user")
  -> navigate to /dashboard
```

The temporary token write is necessary because `authService.me()` builds its
header by reading localStorage. If `/me` fails, the catch block clears both stored
values.

`auth.global.ts` is a global Nuxt route middleware. On every client-side
navigation except `/login`, it:

```text
read token from localStorage
  -> if missing, redirect to /login
  -> call GET /api/me
  -> on success, refresh useState("auth.user") and stored user JSON
  -> on any error, clear the session and redirect to /login
```

The middleware starts with `if (!process.client) return`. It does no
server-render-time authentication because `localStorage` exists only in a browser.
Page data also mostly loads in `onMounted`, so the protected application is
client-authenticated rather than cookie-authenticated SSR.

Every route change performs `/me`; this keeps roles, status, and permissions
reasonably current without trusting the JWT's role claim. It also means that a
temporary network error or backend 500 is treated exactly like an invalid session:
the frontend deletes the token and sends the user to login.

The token is stored in JavaScript-readable localStorage. This is simple, but any
successful cross-site scripting attack in the frontend origin could read it.
There is no refresh-token flow, HTTP-only authentication cookie, or restoration of
the originally requested URL after login.

### `useAuthUser` And UI Permission Checks

`useAuthUser()` exposes:

| Value/function | Purpose |
| --- | --- |
| `authUser` | Shared `useState("auth.user")` object. |
| `role` | Computed normalized role value received from `/me`. |
| `permissions` | Computed array from the current auth user. |
| `hasPermission(key)` | Checks one normalized permission. |
| `hasAnyPermission(...keys)` | Succeeds if any requested permission exists. |
| `hydrateAuthUser()` | Reads stored user JSON when in-memory state is empty. |

Permission text is trimmed, uppercased, and has spaces/hyphens replaced with
underscores. Thus `"update-user"`, `"UPDATE USER"`, and `"UPDATE_USER"` compare
as the same UI permission.

Page guards run in `onMounted`, after global authentication has populated the user.
They improve navigation behavior but do not replace backend checks. There are also
important frontend/backend permission mismatches:

| Screen | Frontend rule | Backend rule | Consequence |
| --- | --- | --- | --- |
| User list | `VIEW_USERS` | `UPDATE_USER` | `VIEW_USERS` does not exist in current permission constants/seed, so seeded users are redirected even when the API would allow them. |
| Department list | only `VIEW_DEPARTMENTS` | `VIEW_DEPARTMENTS`, designation view/CRUD, or specified user/admin/employee management permissions; it does not include department create/update/delete by themselves | A department-CRUD-only actor sees the sidebar link, but the list guard redirects and the GET API also returns 403. |
| Role list | any role CRUD | similar broad group, also user-create/update permissions | Some actors allowed by the backend role-list route can still be rejected by the page. |
| Leave list | no page redirect | individual backend leave permissions | Any authenticated user can open the mock screen; no backend data is requested. |

### Frontend Service Layer

The `services` folder centralizes URL building and `$fetch` calls. All protected
services use `authService.getAuthHeaders()`.

`getAuthHeaders()` returns either:

```js
{ Authorization: "Bearer <token>" }
```

or an empty object. It never returns `null`, so page code such as
`if (!headers) { redirectToLogin() }` is dead logic when the token is absent. The
global middleware normally catches that state first.

Most services unwrap the backend envelope and return `response.data`. Auth service
methods return the whole response because login needs both `data.token` and
`data.user`. `$fetch` automatically sends ordinary object bodies as JSON. When the
body is `FormData`, the browser sets the multipart boundary; code should not set
`Content-Type` manually.

The complete service-to-API mapping is:

| Frontend method | HTTP request | Used by |
| --- | --- | --- |
| `authService.login` | `POST /api/login` | Login page. |
| `authService.me` | `GET /api/me` | Login page; global middleware uses an equivalent direct `$fetch`. |
| `authService.logout` | `POST /api/logout` | Defined but not called by Header. |
| `dashboardService.getDashboard` | `GET /api/dashboard` | `useDashboard`. |
| `userService.getUsers` | `GET /api/users` | User list. |
| `userService.getUser(id)` | `GET /api/users/:id` | User edit. |
| `userService.createUser(data)` | `POST /api/users` | Defined, but the add page uses a direct `$fetch` instead. |
| `userService.updateUser(id, data)` | `PUT /api/users/:id` | User edit. |
| `userService.deleteUser(id)` | `DELETE /api/users/admin/:id` | User list, regardless of the row's actual role. |
| `departmentService.getDepartments` | `GET /api/departments` | Department, designation, and user forms. |
| `departmentService.getDepartment(id)` | `GET /api/departments/:id` | Department edit. |
| `departmentService.createDepartment` | `POST /api/departments` | Department add. |
| `departmentService.updateDepartment(id, data)` | `PUT /api/departments/:id` | Department edit. |
| `departmentService.deleteDepartment(id)` | `DELETE /api/departments/:id` | Department list. |
| `departmentService.getDepartmentDesignations(id)` | `GET /api/departments/:id/designations` | User edit. |
| `designationService.getDesignations` | `GET /api/designations` | Designation screen. |
| `designationService.createDesignation` | `POST /api/designations` | Designation screen. |
| `designationService.updateDesignation(id, data)` | `PUT /api/designations/:id` | Designation screen. |
| `designationService.deleteDesignation(id)` | `DELETE /api/designations/:id` | Designation screen. |
| `roleService.getRoles` | `GET /api/roles` | Role pages and user forms. |
| `roleService.getRole(id)` | `GET /api/roles/:id` | Role edit. |
| `roleService.getRoleDetails(id)` | `GET /api/roles/:id/details` | Role view. |
| `roleService.getPermissions` | `GET /api/roles/permissions` | Role create/edit. |
| `roleService.createRole` | `POST /api/roles` | Role create. |
| `roleService.updateRole(id, data)` | `PUT /api/roles/:id` | Role edit. |
| `roleService.deleteRole(id)` | `DELETE /api/roles/:id` | Defined correctly, but the role-list page does not call it. |

There is no frontend service for attendance, leaves, reports, or settings.

### Dashboard Page Flow

`useDashboard()` owns three reactive values: the current dashboard object, a
loading flag, and an error. The page calls it as follows:

```text
mount /dashboard
  -> fetchDashboard()
  -> dashboardService.getDashboard()
  -> GET /api/dashboard
  -> store response.data
  -> render available sections
  -> repeat silently every 30 seconds
  -> clear interval when page unmounts
```

The page selects one presentation mode in priority order:

```text
systemSummary present -> system mode
else teamAttendance   -> team mode
else ownAttendance    -> own mode
else                  -> empty mode
```

If a user has several dashboard permissions, system mode wins even though the
response can contain multiple sections. System/team modes show summary, trend,
department, today's status, monthly, late-user, and recent widgets. Own mode hides
the system charts and shows the user's summary/recent rows.

Recent attendance is selected with a different priority from the mode and other
widgets:

```text
recent rows: ownAttendance -> teamAttendance -> system recentAttendance
```

Consequently, a user with all three bundles sees system summary/charts but their
own recent rows. A user in team mode who also has own-attendance access likewise
sees own recent rows beside team charts. The page does not label this mixed scope.

Most dashboard inputs come from the API, but only Attendance Trend and Department
Attendance use `vue-echarts`. Today's chart is a CSS conic gradient, Top Late uses
CSS `div` bars, and Monthly is CSS with fixed January-through-June sample values
rather than backend data. `StatCard.vue` exists but is not used. Because many
dashboard layout classes assume Tailwind, the data can be correct while the
intended spacing/grid appearance is incomplete.

### Users Pages

#### User list

Intended flow:

```text
/dashboard/users
  -> check view permission
  -> GET /api/users
  -> client-side search across name/email/department/designation/phone/role
  -> render Edit/Delete actions based on permissions
```

The screen checks `VIEW_USERS`, but the project defines `VIEW_ADMINS`,
`VIEW_EMPLOYEES`, and `UPDATE_USER`, not `VIEW_USERS`. This redirects normally
seeded Super Admin, Admin, and Employee users before `loadUsers()` runs.

The delete button is also resource-inaccurate. `userService.deleteUser(id)` always
calls `/api/users/admin/:id`, while the table contains employees, Admins, custom
roles, and potentially Super Admins. Only core Admin rows satisfy that backend
route. Showing the button for `DELETE_EMPLOYEE` does not help because there is no
employee delete endpoint and the service still calls the admin route.

#### Add user

The intended dependency sequence is:

```text
check CREATE_ADMIN or CREATE_EMPLOYEE
  -> load GET /api/departments and GET /api/roles concurrently
  -> choose department
  -> GET /api/departments/:id/designations
  -> build FormData
  -> POST /api/users
```

The page currently has several runtime defects:

| Defect | Result |
| --- | --- |
| Calls undefined `authHeaders()` in `onMounted` and submit. | A permitted user reaches a `ReferenceError` before normal form loading/submission. |
| Calls `departmentService.getDesignations(...)`. | That method does not exist; the exported name is `getDepartmentDesignations`. |
| Uses `config.public.apiBase` without defining `config = useRuntimeConfig()`. | Direct submit `$fetch` throws when reached. |
| Template binds `:min="today"` without defining `today`. | The date input references an undefined setup property. |
| Imports `userService` but submits through direct `$fetch`. | The defined `createUser` abstraction is bypassed. |
| Always appends `joiningDate`, including `""`. | Backend create validation can reject the empty date string. |
| `visibleRoles` exposes the complete role list. | A `CREATE_EMPLOYEE`-only actor can select Admin or Super Admin; the backend then rejects that target because it correctly requires `CREATE_ADMIN`. |
| Success is immediately reset | `saveUser` assigns `successMessage` and then `resetForm()` clears it before Vue can present a lasting success notice. |

Nuxt can still compile this page because several failures are runtime name
lookups, which is why a successful production build alone does not prove that the
form works.

#### Edit user

The edit page has the intended working sequence:

```text
check UPDATE_USER
  -> load departments and roles
  -> GET /api/users/:id
  -> load designations for the user's department
  -> populate form
  -> when department changes, reload designations
  -> PUT /api/users/:id
  -> navigate back to list
```

It does not expose a password field. It does expose arbitrary roles, so the
backend's missing actor/target hierarchy check is reachable through this screen
for an actor who can access it.

### Roles Pages

The role create and edit pages share `RoleForm.vue`, which uses
`PermissionList.vue` to group/select permission ids. Create sends a role name and
selected permission ids. Edit loads the existing role and catalog, then `PUT`
replaces the complete permission set.

The list's delete handler currently does:

```js
roles.value = await roleService.getRoles();
```

after confirmation. It never calls `roleService.deleteRole(id)`, so the UI reports
no error but makes no deletion request. `RoleTable.vue` and `DeleteRoleModal.vue`
exist but are not used by the list page.

The detail page catches load errors and leaves `role` as `null`, while its template
contains direct role-property access. A failed API load can therefore be followed
by a render-time null error instead of a stable error-only view. Create/edit
failure feedback is mostly logged or stored locally and is less consistent than
the designation screen.

### Departments Pages

The list loads expanded department records, performs search in memory, and renders
the recognized Admin and Employee arrays supplied by the backend. Add has an exact
`CREATE_DEPARTMENT` guard and can submit directly. Edit has an exact
`UPDATE_DEPARTMENT` page guard, but first calls `GET /api/departments/:id`; that
GET route does not accept `UPDATE_DEPARTMENT` by itself. An update-only actor can
therefore enter the page and then receive backend 403 while loading its record.

After a successful department delete, the list does not remove the row or refetch
departments. The database can be updated while the deleted card stays visible
until a page refresh. Several functions test `if (!headers)`, but
`getAuthHeaders()` returns `{}` when there is no token, so those checks do not
detect an absent token.

The list page requires `VIEW_DEPARTMENTS`, even though the sidebar and backend GET
route accept broader management permissions. This creates the access mismatch
described above.

### Designations Page

This is the most complete CRUD screen:

```text
check any designation CRUD permission
  -> load departments and expanded designations concurrently
  -> filter/search locally
  -> create for a selected department
  -> edit designation name
  -> delete only when UI/backend assignment checks permit it
```

Separate computed flags hide create, update, and delete controls. The backend
still performs the actual permission and assignment checks, so stale frontend
counts cannot bypass the constraint.

### Leaves Pages And Components

The leave list defines four July 2026 sample requests in the page source. Search,
filtering, summary cards, selection, approval, and rejection all operate on that
local `ref` array. Refreshing the browser restores the original samples.

The current behavior is:

| Interaction | What actually happens |
| --- | --- |
| Open leave list | No leave API request. |
| Approve/reject | Replaces an object in local memory and adds local decision metadata. |
| Click visible Apply Leave | Navigates to `/dashboard/leaves/apply`; it never sets `showApplyModal`, so `ApplyLeaveModal` is unreachable in normal UI flow. |
| Submit `/leaves/apply` form | Logs the reactive form and navigates back; no `POST /api/leaves`. |
| Summary cards | Count the complete sample array, even when employee visibility/filtering shows a subset. |
| Select/filter requests | `selectedRequest` searches the unfiltered master array and begins at id 1; an employee or later filter can hide that row while its Admin request remains in the review pane. |

There are also component contract mismatches:

1. The page passes `show-filters` to `LeaveToolbar`, but that prop is not declared
   and the toolbar always renders its filters.
2. `LeaveReviewPanel` declares an emit named
   `update:props.decisionNote`, while its template actually emits
   `update:decisionNote` and the parent listens for `update:decision-note`.
   Vue's event-name normalization can still update the note at runtime, but the
   declared/type contract is incorrect and can produce tooling or development
   warnings.
3. `ApplyLeaveButton.vue` references undefined `user` and `roleId` in
   `onMounted`, but the component is currently unused.

`showApplyModal` starts false and no code sets it true. If the modal were opened
programmatically, its parent submit listener currently only closes it; the
page-level `applyLeave` TODO function is not connected.

These frontend gaps are separate from the backend gap: even if wired today, the
six backend leave routes return placeholder success messages and do not persist.

### Frontend Error Handling

There is no global API interceptor. Each page uses its own `try/catch`, producing
slightly different behavior:

```text
$fetch non-2xx
  -> throws an error object
  -> page often reads error.data.message
  -> some pages show a notice
  -> some pages only console.log
  -> global auth middleware treats every /me error as logout
```

Backend validation errors normally arrive as an `errors` array of
`{field, message}` objects. The add-user page is designed to reduce this into a
field-error map, although its earlier runtime failures currently prevent the full
flow. Other forms mostly display only the top-level message.

There is no pagination in frontend services or screens. Lists are loaded in full
and searched in browser memory, matching the backend's current unpaginated list
queries.

Some displayed icon characters are mojibake sequences such as `â†` or `ðŸ””`,
indicating that text encoded as UTF-8 was interpreted or saved through a different
encoding at some point.

## Common Request Flows

### Protected API Request: Success Path

```text
Frontend service reads token from localStorage
  -> sends Authorization: Bearer <token>
  -> app-level middleware parses request and applies CORS/security headers
  -> Express matches mount path and router-local method/path
  -> authMiddleware verifies signature and expiry
  -> authRepository reloads safe user, role, status, and permissions
  -> authMiddleware rejects missing/non-ACTIVE user or assigns req.user
  -> permission middleware checks required permission
  -> upload/validation middleware runs when present
  -> controller reads req.params, req.body, and req.user
  -> service applies business rules and database-dependent validation
  -> repository queries Prisma/MySQL
  -> result returns through repository, service, and controller
  -> sendSuccess sends the standard JSON envelope
  -> $fetch resolves and the service returns response.data
  -> Vue changes reactive state and re-renders the DOM
```

The request is not passed back through middleware in reverse order like a second
pipeline. Rather, each awaited function returns to its caller until the controller
sends the response.

### Protected API Request: Failure Branches

```text
no Authorization header
  -> authMiddleware -> 401

bad or expired JWT
  -> jsonwebtoken verify fails -> 401

valid JWT but deleted/inactive account
  -> database reload rejects -> 401 or 403

authenticated but permission absent
  -> requirePermission/requireAnyPermission -> 403

invalid request body
  -> Joi validate middleware -> 400 with errors[]

valid shape but invalid business relationship
  -> service ApiError -> normally 400/404/409

unexpected Prisma/code/external failure
  -> asyncHandler -> errorHandler -> generic 500

no Express route matches
  -> notFoundHandler -> 404
```

### Intended Create User Flow From Frontend

```text
/dashboard/users/add
  -> global middleware validates token through GET /api/me
  -> page checks CREATE_ADMIN or CREATE_EMPLOYEE
  -> load departments from GET /api/departments
  -> load roles from GET /api/roles
  -> when department changes, load designations from GET /api/departments/:id/designations
  -> submit text and optional photo as FormData to POST /api/users
  -> auth and broad create-permission middleware run
  -> Multer saves optional photo and writes req.body.photo
  -> Joi converts multipart strings and validates fields
  -> service loads selected role
  -> service decides CREATE_ADMIN versus CREATE_EMPLOYEE from target role
  -> service verifies email, department, and designation
  -> bcrypt hashes password
  -> repository generates ADM or EMP code and creates User
  -> API returns mapped safe user
  -> page assigns success, then resets both the form and success message
```

This is the intended end-to-end design. The current add page stops earlier because
of the undefined `authHeaders`, `config`, and service-name problems documented in
the frontend section. The backend create route itself is implemented.

### Login, Session Hydration, And Dashboard

```text
/login
  -> POST /api/login
  -> auth service validates account and bcrypt password
  -> sign JWT with sub, role, issue time, and expiry
  -> browser temporarily stores JWT
  -> GET /api/me with JWT
  -> backend reloads current user and effective permissions
  -> browser persists user and token
  -> /dashboard
  -> global middleware calls GET /api/me again for this navigation
  -> GET /api/dashboard
  -> backend returns sections based on permissions
  -> Vue selects system, team, own, or empty presentation mode
  -> page repeats dashboard request every 30 seconds
```

### Attendance Sync To Dashboard

```text
Backend starts
  -> verifies MySQL with SELECT 1
  -> starts Express listener
  -> downloads hard-coded Google Sheet export immediately
  -> parses and validates every row
  -> matches users and appends new source/hash occurrences
  -> cron repeats the import every 30 seconds
  -> dashboard queries Attendance plus current user relations
  -> frontend separately polls dashboard every 30 seconds
```

The scheduler interval and browser polling interval are independent. A dashboard
request can occur before, during, or after an attendance import transaction.

### Role Edit Flow

```text
/dashboard/roles/:id
  -> GET /api/roles/:id
  -> GET /api/roles/permissions
  -> user edits role name and checked permission IDs
  -> PUT /api/roles/:id
  -> Joi is not used; service manually parses/deduplicates IDs
  -> service verifies all retained IDs exist
  -> transaction updates role name
  -> transaction deletes every old role_permission link
  -> transaction creates the submitted link set
  -> response reloads role with junctions/count
```

For a core role, removing a hard-coded fallback permission here removes the
database link but does not remove the permission from authenticated sessions.

### Frontend Navigation Versus Direct API Call

```text
click "Users"
  -> Vue Router resolves /dashboard/users
  -> global Nuxt middleware calls /api/me
  -> page's onMounted permission check runs
  -> only then does page code call /api/users
```

A direct API client such as Postman does not run Nuxt, the sidebar, or page guards:

```text
Postman GET /api/users + Bearer token
  -> Express auth/permission logic only
```

This is why frontend permission mistakes can make a valid backend endpoint appear
unavailable in the browser, and why backend permission enforcement must never
depend on frontend controls.

## Current Gaps And Implementation Notes

These are not architectural recommendations; they are factual notes about the current code.

### Security And Authorization Risks

| Area | Current state and consequence |
| --- | --- |
| Public privileged signup | Every auth mount exposes unauthenticated `POST .../signup`, and the body may select Admin or Super Admin. |
| Generic user role escalation | `UPDATE_USER` can assign any existing `roleId`/role name, including Super Admin, without actor/target hierarchy checks. |
| Core permission removal | Static core-role permissions are unioned with database permissions, so the Roles UI cannot revoke fallback permissions. |
| Core roles are mutable | Core roles can be renamed and, when unassigned, deleted; normalization changes can enable/disable fallback behavior. |
| Stateless logout | Backend logout does not revoke a token, and Header does not call it anyway. |
| Browser token storage | JWT is JavaScript-readable in localStorage and there is no refresh/HttpOnly-cookie flow. |
| No login throttling | There is no rate limiter, lockout, MFA, password-reset flow, or brute-force protection. |
| Public uploaded files | `/uploads` requires no authentication; MIME type is trusted, and old replacements/deleted-account photos remain on disk. |
| Account hierarchy | Admin/user update and deletion lack self-edit, self-delete, final-Super-Admin, and outranking constraints. |
| Alias attack surface | Five auth mounts expose the same public login/signup behavior under 20 effective auth method/path combinations. |

### Functional And Integration Gaps

| Area | Current state and consequence |
| --- | --- |
| Leave backend | Six routes authenticate/authorize but return placeholders and never call the empty service or repository. |
| Leave frontend | Uses hard-coded July 2026 data, local decisions, and TODO submission instead of an API service. |
| User list guard | Frontend checks nonexistent `VIEW_USERS`; seeded accounts are redirected before calling implemented `GET /api/users`. |
| User add page | Undefined `authHeaders`, undefined `config`/`today`, and wrong designation method make the screen fail at runtime. |
| User delete UI | All rows call the Admin-only delete URL; employees/custom/Super Admin records cannot be deleted that way. |
| Role delete UI | The button calls `getRoles` instead of the already-defined `deleteRole` service. |
| Department delete UI | Successful deletion does not remove/refetch the displayed card. |
| Admin department update | Repository never persists `departmentId`; it can still save a designation validated for that unsaved new department, creating an inconsistent pair. |
| Employee create variant | `POST /api/users/employee` accepts `joiningDate` but drops it, has no upload middleware, and returns a different response shape. |
| Employee delete | `DELETE_EMPLOYEE` exists, but no employee deletion route exists. |
| Attendance read UI/API | No standalone attendance list/read endpoint or Nuxt page exists. |
| Attendance upload helper | Excel upload middleware exists, but import always uses the hard-coded Google Sheet URL. |
| Missing Nuxt pages | Sidebar links for attendance, reports, and settings resolve to not-found pages. |
| Logout service | `authService.logout` is defined but unused by the Header. |
| Monthly chart | Shows fixed sample data rather than an API calculation. |
| Styling dependency | Dashboard uses many Tailwind utility class names without Tailwind being installed/configured. |

### Data Correctness And Operational Gaps

| Area | Current state and consequence |
| --- | --- |
| Two status columns | Current application logic uses `employmentStatus`; nullable `User.status` is largely ignored. |
| Schema/validation mismatch | Nullable last names and 30-character phone input can pass Joi but conflict with database requirements/length. |
| Attendance idempotency | Import appends unique row-hash/source occurrences; it does not reconcile corrections or delete removed source rows. |
| Attendance uniqueness | `(userId, attendanceDate)` is indexed but not unique, so multiple rows can inflate dashboard totals. |
| Scheduler concurrency | In-memory `syncRunning` covers one process only; multiple backend instances can import concurrently. |
| User-code generation | Several paths use max-plus-one instead of a database sequence; the users module lacks collision retry. |
| Dashboard semantics | Some department/late metrics are all-time despite placement near today's data; one permission bundle can run five queries and all bundles can run 15. |
| List scalability | Backend and frontend lists have no pagination, limits, or server-side filtering. |
| Request logging | Morgan is mounted after early routers, so it does not log all API traffic. |
| Error normalization | Only a subset of Prisma errors is translated; many constraint/race failures appear as generic 500. |
| No automated tests | Package files define no unit, integration, end-to-end, or lint commands. |
| Seed dependency | Main seed does not create departments, so department-specific designations are skipped on a truly empty database. |

### How To Debug Any Backend Route

Use the same sequence for almost every endpoint:

1. **Write the exact method and URL.** `GET /api/users` and
   `POST /api/users` are different routes. `/dashboard/users` is a Nuxt page,
   not an Express API.
2. **Resolve the route mount.** Find `app.use("/prefix", router)` in `app.js`,
   then find `router.get/post/...("/suffix")` in the module route file.
3. **Follow middleware left to right.** Check authentication, permission, upload,
   parsing, and Joi middleware before reading controller code.
4. **Read the controller input.** Identify whether it uses `req.body`,
   `req.params.id`, `req.user`, or `req.file`.
5. **Trace service rules.** This is normally where existence, uniqueness,
   department/designation, role, and actor checks occur.
6. **Trace the repository.** Inspect Prisma `where`, `select`, `include`,
   transaction, and mapper to understand the exact rows and response fields.
7. **Use the HTTP status to choose the layer.** A 401 points toward JWT/auth, 403
   toward permission/status, 400 toward validation/business input, 404 toward
   route/record matching, 409 toward uniqueness/assignment, and 500 toward an
   unnormalized error or bug.
8. **Inspect both browser and backend output.** The browser Network panel shows
   URL/method/headers/request/response. The backend console shows unexpected
   errors, scheduler output, and only the subset of requests reached by Morgan.
9. **Check MySQL state.** Prisma Studio can confirm role links, status,
   department/designation relations, and whether a mutation actually persisted.
10. **Retest the API independently.** A direct HTTP client separates backend
    behavior from Nuxt page guards and component bugs.

Basic connectivity sequence:

```text
GET  http://localhost:5000/health
POST http://localhost:5000/api/login
GET  http://localhost:5000/api/me          + Bearer token
GET  http://localhost:5000/api/dashboard   + Bearer token
```

If `/health` fails, do not debug Vue first. If `/health` works and `/me` is 401,
inspect the token/header. If `/me` succeeds but a feature API is 403, inspect the
effective permissions returned by `/me`. If the API works directly but the page
redirects or throws, inspect the Nuxt guard and browser console.

### How To Add A New End-To-End Route Safely

A complete feature normally touches both applications:

```text
1. database/schema.prisma
2. migration and generated Prisma client
3. backend repository
4. backend service
5. backend controller
6. Joi validation
7. Express route + auth/permission middleware
8. app.js mount, if this is a new router
9. frontend service method
10. Nuxt page/component
11. sidebar/page visibility rule
12. tests for success, auth, permission, validation, conflict, and not-found paths
```

Before adding an alias, prefer one canonical URL. Before adding a new UI permission
key, add it consistently to constants, seed data, database role links, backend
middleware, `/me` output, sidebar rules, and page guards. A UI-only check or a
backend-only constant produces exactly the kind of mismatch currently seen with
`VIEW_USERS`.

### Short Glossary

| Term | Meaning in this repository |
| --- | --- |
| API | JSON interface exposed by Express under routes such as `/api/users`. |
| Endpoint | One HTTP method plus one effective URL, for example `PUT /api/users/:id`. |
| Route parameter | Dynamic URL part such as `:id`; available as `req.params.id`. |
| Middleware | Function that processes a request before/after routing and usually calls `next()`. |
| Controller | HTTP adapter that reads Express request data and chooses response status/message. |
| Service | Business-rule layer. |
| Repository | Database-query and database-to-API mapping layer. |
| DTO/mapper | Deliberate public response shape derived from a database row. |
| ORM | Object-relational mapper; Prisma converts JavaScript calls into SQL. |
| Migration | Versioned database schema change. |
| Transaction | Group of database operations committed together or rolled back together. |
| JWT | Signed, expiring bearer token used for authentication. |
| Authentication | Proving which user is calling. |
| Authorization | Deciding whether that user may perform the operation. |
| RBAC | Role-based access control; roles connect users to permissions. |
| Joi | Runtime request-data validation and normalization library. |
| Multer | Express multipart/file-upload middleware. |
| Promise | JavaScript object representing future async success/failure. |
| Reactive state | Vue value whose change causes dependent UI to recompute/render. |
| Hydration | Connecting client-side Vue behavior/state to rendered application output. |
| Compatibility alias | Extra mounted URL that reaches the same router/controller as a canonical route. |
| Placeholder | Route that exists but does not yet execute advertised domain logic. |

## Complete Backend Route Matrix

This table lists the canonical routes plus the most commonly used aliases.
The following compatibility section expands every remaining repeated mount, so the
two sections together account for all 83 effective method/path combinations.

| Method | Path | Module | Auth | Permission |
| --- | --- | --- | --- | --- |
| `GET` | `/` | app | no | none |
| `GET` | `/health` | app | no | none |
| `POST` | `/api/login` | auth | no | none |
| `GET` | `/api/me` | auth | yes | none |
| `POST` | `/api/signup` | auth | no | none |
| `POST` | `/api/logout` | auth | yes | none |
| `POST` | `/api/auth/login` | auth alias | no | none |
| `GET` | `/api/auth/me` | auth alias | yes | none |
| `POST` | `/api/auth/signup` | auth alias | no | none |
| `POST` | `/api/auth/logout` | auth alias | yes | none |
| `GET` | `/api/dashboard` | dashboard | yes | sections depend on permissions |
| `POST` | `/api/attendance/import` | attendance | yes | `IMPORT_ATTENDANCE` |
| `GET` | `/api/admin/employees` | admin-employees | yes | `VIEW_EMPLOYEES` |
| `POST` | `/api/admin/employees` | admin-employees | yes | `CREATE_EMPLOYEE` |
| `GET` | `/api/v1/admin/employees` | admin-employees alias | yes | `VIEW_EMPLOYEES` |
| `POST` | `/api/v1/admin/employees` | admin-employees alias | yes | `CREATE_EMPLOYEE` |
| `GET` | `/api/departments` | departments | yes | department/designation/user-management read group |
| `POST` | `/api/departments` | departments | yes | `CREATE_DEPARTMENT` |
| `GET` | `/api/departments/:id/designations` | departments | yes | department/designation/user-management read group |
| `GET` | `/api/departments/:id` | departments | yes | department/designation/user-management read group |
| `PUT` | `/api/departments/:id` | departments | yes | `UPDATE_DEPARTMENT` |
| `PATCH` | `/api/departments/:id` | departments | yes | `UPDATE_DEPARTMENT` |
| `DELETE` | `/api/departments/:id` | departments | yes | `DELETE_DEPARTMENT` |
| `GET` | `/api/designations` | designations | yes | designation/user-management read group |
| `POST` | `/api/designations` | designations | yes | `CREATE_DESIGNATION` |
| `PUT` | `/api/designations/:id` | designations | yes | `UPDATE_DESIGNATION` |
| `PATCH` | `/api/designations/:id` | designations | yes | `UPDATE_DESIGNATION` |
| `DELETE` | `/api/designations/:id` | designations | yes | `DELETE_DESIGNATION` |
| `POST` | `/api/leaves` | leaves | yes | `CREATE_LEAVE` |
| `GET` | `/api/leaves/my` | leaves | yes | `VIEW_OWN_LEAVES` |
| `GET` | `/api/leaves/team` | leaves | yes | `VIEW_TEAM_LEAVES` |
| `PATCH` | `/api/leaves/:id/approve` | leaves | yes | `APPROVE_LEAVE` |
| `PATCH` | `/api/leaves/:id/reject` | leaves | yes | `REJECT_LEAVE` |
| `PATCH` | `/api/leaves/:id/cancel` | leaves | yes | `CANCEL_LEAVE` |
| `GET` | `/api/roles` | roles | yes | role/user-management read group |
| `GET` | `/api/roles/permissions` | roles | yes | `VIEW_ROLES` or `CREATE_ROLE` or `UPDATE_ROLE` |
| `GET` | `/api/roles/:id/details` | roles | yes | `VIEW_ROLES` |
| `GET` | `/api/roles/:id` | roles | yes | `VIEW_ROLES` or `UPDATE_ROLE` |
| `POST` | `/api/roles` | roles | yes | `CREATE_ROLE` |
| `PUT` | `/api/roles/:id` | roles | yes | `UPDATE_ROLE` |
| `DELETE` | `/api/roles/:id` | roles | yes | `DELETE_ROLE` |
| `POST` | `/api/users` | users | yes | `CREATE_ADMIN` or `CREATE_EMPLOYEE` |
| `GET` | `/api/users` | users | yes | `UPDATE_USER` |
| `POST` | `/api/users/admin` | users | yes | `CREATE_ADMIN` |
| `GET` | `/api/users/admins` | users | yes | `VIEW_ADMINS` |
| `GET` | `/api/users/users` | users | yes | `UPDATE_USER` |
| `GET` | `/api/users/admin/:id` | users | yes | `VIEW_ADMINS` |
| `GET` | `/api/users/admins/:id` | users | yes | `VIEW_ADMINS` |
| `PUT` | `/api/users/admin/:id` | users | yes | `UPDATE_ADMIN` |
| `PATCH` | `/api/users/admin/:id` | users | yes | `UPDATE_ADMIN` |
| `PATCH` | `/api/users/admins/:id` | users | yes | `UPDATE_ADMIN` |
| `GET` | `/api/users/:id` | users | yes | `UPDATE_USER` |
| `PUT` | `/api/users/:id` | users | yes | `UPDATE_USER` |
| `PATCH` | `/api/users/:id` | users | yes | `UPDATE_USER` |
| `DELETE` | `/api/users/admin/:id` | users | yes | `DELETE_ADMIN` |
| `DELETE` | `/api/users/admins/:id` | users | yes | `DELETE_ADMIN` |
| `POST` | `/api/users/employee` | users | yes | `CREATE_EMPLOYEE` |

Auth aliases also create equivalent `/login`, `/me`, `/signup`, and `/logout` routes under:

```text
/api/admin/auth
/api/api/auth
/api/administrator
```

Department aliases also create equivalent department routes under:

```text
/api/admin/departments
/api/v1/departments
```

## Compatibility Alias Expansion

These aliases are active because the same routers are mounted more than once in `app.js`.

Remaining auth aliases (`/api/auth` is already listed in the preceding matrix):

| Method | Path | Same behavior as |
| --- | --- | --- |
| `POST` | `/api/admin/auth/login` | `POST /api/login` |
| `GET` | `/api/admin/auth/me` | `GET /api/me` |
| `POST` | `/api/admin/auth/signup` | `POST /api/signup` |
| `POST` | `/api/admin/auth/logout` | `POST /api/logout` |
| `POST` | `/api/api/auth/login` | `POST /api/login` |
| `GET` | `/api/api/auth/me` | `GET /api/me` |
| `POST` | `/api/api/auth/signup` | `POST /api/signup` |
| `POST` | `/api/api/auth/logout` | `POST /api/logout` |
| `POST` | `/api/administrator/login` | `POST /api/login` |
| `GET` | `/api/administrator/me` | `GET /api/me` |
| `POST` | `/api/administrator/signup` | `POST /api/signup` |
| `POST` | `/api/administrator/logout` | `POST /api/logout` |

Department aliases:

| Method | Path | Same behavior as |
| --- | --- | --- |
| `GET` | `/api/admin/departments` | `GET /api/departments` |
| `POST` | `/api/admin/departments` | `POST /api/departments` |
| `GET` | `/api/admin/departments/:id/designations` | `GET /api/departments/:id/designations` |
| `GET` | `/api/admin/departments/:id` | `GET /api/departments/:id` |
| `PUT` | `/api/admin/departments/:id` | `PUT /api/departments/:id` |
| `PATCH` | `/api/admin/departments/:id` | `PATCH /api/departments/:id` |
| `DELETE` | `/api/admin/departments/:id` | `DELETE /api/departments/:id` |
| `GET` | `/api/v1/departments` | `GET /api/departments` |
| `POST` | `/api/v1/departments` | `POST /api/departments` |
| `GET` | `/api/v1/departments/:id/designations` | `GET /api/departments/:id/designations` |
| `GET` | `/api/v1/departments/:id` | `GET /api/departments/:id` |
| `PUT` | `/api/v1/departments/:id` | `PUT /api/departments/:id` |
| `PATCH` | `/api/v1/departments/:id` | `PATCH /api/departments/:id` |
| `DELETE` | `/api/v1/departments/:id` | `DELETE /api/departments/:id` |
