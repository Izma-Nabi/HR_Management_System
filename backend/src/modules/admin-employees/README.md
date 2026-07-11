# Admin Employees Module

This module lets a logged-in Super Admin create employee accounts from the backend.
It creates both:

- a `users` row for login/authentication
- an `employees` row for employee-specific HR data

The backend module is used by the admin frontend page at `frontend-admin/pages/employees/create.vue`.

## Why This Module Exists

The project now separates employee login identity from employee HR details:

- `users` stores login data: email, hashed password, role, account status.
- `employees` stores HR data: employee code, name, phone, department, designation, fingerprint ID, and employment status.

This is better than storing everything in one table because authentication and HR profile data change for different reasons. For example, a user password reset should not require changing employee department data.

The older employee profile tables were removed from the active flow:

- `employee_profiles`
- `Employee_Profile`

The backend now uses only the `employees` table for employee records.

## API Endpoint

```http
POST /api/admin/employees
Authorization: Bearer <super_admin_token>
Content-Type: application/json
```

The same route is also mounted at:

```http
POST /api/v1/admin/employees
```

Only users with role `SUPER_ADMIN` can use this route.

## Request Body

```json
{
  "email": "employee@company.com",
  "password": "Employee@12345",
  "employeeCode": "EMP001",
  "name": "Ali Khan",
  "phone": "+923001234567",
  "department": "Operations",
  "designation": "Officer",
  "fingerprintId": "FP001",
  "employmentStatus": "ACTIVE"
}
```

Required fields:

- `email`
- `password`
- `employeeCode`
- `name`

Optional fields:

- `phone`
- `department`
- `designation`
- `fingerprintId`
- `employmentStatus`

Allowed `employmentStatus` values:

```text
ACTIVE
INACTIVE
RESIGNED
TERMINATED
```

Joining date is not collected by Super Admin. It should be set later when the employee first logs in, after the employee-side code is built.

## Success Response

```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "user": {
      "id": 3,
      "fullName": "Ali Khan",
      "email": "employee@company.com",
      "role": "EMPLOYEE",
      "status": "ACTIVE",
      "createdAt": "2026-07-10T10:13:44.000Z",
      "updatedAt": "2026-07-10T10:13:44.000Z"
    },
    "employee": {
      "employeeId": 1,
      "userId": 3,
      "employeeCode": "EMP001",
      "name": "Ali Khan",
      "phone": "+923001234567",
      "department": "Operations",
      "designation": "Officer",
      "fingerprintId": "FP001",
      "employmentStatus": "ACTIVE",
      "createdAt": "2026-07-10T10:13:45.000Z",
      "updatedAt": "2026-07-10T10:13:45.000Z"
    }
  }
}
```

The response never returns `passwordHash`.

## Request Flow

```text
POST /api/admin/employees
  -> authMiddleware
  -> allowRoles("SUPER_ADMIN")
  -> validate(createEmployeeSchema)
  -> adminEmployeesController.createEmployee
  -> adminEmployeesService.createEmployee
  -> adminEmployeesRepository.createEmployeeAccount
  -> Prisma transaction
  -> users + employees tables
```

## Files Added

### `admin-employees.routes.js`

Defines the HTTP route.

Responsibilities:

- protects the route with `authMiddleware`
- restricts access to `SUPER_ADMIN`
- validates request body before controller logic runs
- sends valid requests to the controller

Key route:

```js
router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN"),
  validate(createEmployeeSchema),
  adminEmployeesController.createEmployee
);
```

### `admin-employees.validation.js`

Defines the Joi schema for employee creation.

Why this exists:

- rejects bad input before business logic starts
- trims strings
- lowercases email
- converts empty optional fields to `null`
- ensures `employmentStatus` is one of the allowed enum values

### `admin-employees.controller.js`

Receives the Express request and sends the API response.

It stays small on purpose:

```text
controller = HTTP input/output only
service = business rules
repository = database access
```

### `admin-employees.service.js`

Owns business rules.

It checks:

- email is not already used
- employee code is not already used
- fingerprint ID is not already used
- password is hashed before database insert
- employee role exists before creating the account

It throws clean API errors such as:

```text
409 Email is already registered
409 Employee code is already registered
409 Fingerprint ID is already registered
500 Employee role is not configured. Run role seeds before creating employees.
```

### `admin-employees.repository.js`

Owns database access.

It does not decide business rules. It only:

- checks for existing rows
- finds the Employee role
- creates records in the database
- maps Prisma data into safe API response objects

The important part is that it uses a transaction:

```js
const createdEmployee = await prisma.$transaction(async (tx) => {
  const employeeRole = await findEmployeeRole(tx);
  const createdUser = await tx.user.create(...);
  return tx.employee.create(...);
});
```

Why transaction matters:

- if `users` creation succeeds but `employees` creation fails, the user is rolled back
- no half-created employee accounts remain
- the operation behaves as one unit of work

## Supporting File Added

### `backend/src/utils/roles.js`

The database stores role names as rows. Existing backend authorization expects role keys like:

```text
SUPER_ADMIN
ADMIN
EMPLOYEE
```

But the database may store role names like:

```text
Super Admin
Admin
Employee
```

`roles.js` normalizes those names so the rest of the backend can keep using stable role keys.

Example:

```js
toRoleKey({ roleName: "Super Admin" });
// "SUPER_ADMIN"
```

It also gives query aliases:

```js
roleNameCandidates("SUPER_ADMIN");
// ["SUPER_ADMIN", "SUPER ADMIN", "Super Admin"]
```

This prevents login and role checks from breaking just because the database uses display-style role names.

## Existing Files Updated

### `backend/src/app.js`

The module was mounted here:

```js
app.use("/api/admin/employees", adminEmployeesRoutes);
app.use("/api/v1/admin/employees", adminEmployeesRoutes);
```

### `backend/src/middlewares/error.middleware.js`

Duplicate database errors were improved for employee creation.

Handled duplicate cases:

- email
- employee code
- fingerprint ID
- user-to-employee link

### `backend/src/modules/admin-auth/admin-auth.repository.js`

Admin auth was updated because `role` is now a relation, not an enum column.

Old style:

```js
role: {
  in: ["SUPER_ADMIN", "ADMIN"]
}
```

New style:

```js
role: {
  roleName: {
    in: adminRoles.flatMap(roleNameCandidates)
  }
}
```

This fixed the Prisma error:

```text
Unknown argument `in`. Did you mean `is`?
```

### `backend/src/modules/employee-auth/*`

Employee auth was updated to read from:

```text
User.employee
```

instead of:

```text
User.employee
```

This matches the new `employees` table.

## Database Changes

### Prisma Model

The active employee model is:

```prisma
model Employee {
  employeeId       Int              @id @default(autoincrement()) @map("employee_id") @db.UnsignedInt
  userId           Int              @unique(map: "employees_user_id_unique") @map("user_id") @db.UnsignedInt
  employeeCode     String           @unique(map: "employees_employee_code_unique") @map("employee_code") @db.VarChar(50)
  name             String           @db.VarChar(100)
  phone            String?          @db.VarChar(30)
  department       String?          @db.VarChar(100)
  designation      String?          @db.VarChar(100)
  fingerprintId    String?          @unique(map: "employees_fingerprint_id_unique") @map("fingerprint_id") @db.VarChar(100)
  employmentStatus EmploymentStatus @default(ACTIVE) @map("employment_status")
  joiningDate      DateTime?        @map("joining_date") @db.Date
  createdAt        DateTime         @default(now()) @map("created_at") @db.DateTime(0)
  updatedAt        DateTime         @default(now()) @updatedAt @map("updated_at") @db.DateTime(0)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade, map: "employees_user_id_fk")

  @@map("employees")
}
```

### SQL Table

The `employees` table contains:

- `employee_id` as primary key
- `user_id` as unique foreign key to `users(id)`
- `employee_code` as unique employee identifier
- `fingerprint_id` as optional unique biometric identifier
- `employment_status` enum
- audit timestamps

The foreign key uses:

```sql
REFERENCES users(id)
```

not `users(user_id)`, because this project's `users` table primary key is `id`.

### Migration

Migration added:

```text
database/migrations/20260710000000_add_employees/migration.sql
```

It does three things:

1. Drops old `employee_profiles` if it exists.
2. Drops old `Employee_Profile` if it exists.
3. Creates `employees` if it does not exist.

It also removes an old foreign key from `Admin_Profile` to `Employee_Profile` before dropping `Employee_Profile`, because MySQL will not drop a referenced table.

## Authorization Design

This endpoint is intentionally Super Admin only:

```js
allowRoles("SUPER_ADMIN")
```

Why:

- creating employees is an admin-side feature
- normal employees should not create employee records
- regular admins may get this permission later, but right now the requirement is Super Admin

The token comes from admin login:

```http
POST /api/auth/login
```

Then the token is sent with:

```http
Authorization: Bearer <token>
```

## How To Test Manually

Start backend:

```powershell
cd backend
npm run dev
```

Login as Super Admin:

```powershell
$loginBody = @{
  email = "superadmin@company.com"
  password = "SuperAdmin@123"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Uri "http://127.0.0.1:5000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $loginBody

$token = $login.data.token
```

Create employee:

```powershell
$employeeBody = @{
  email = "employee001@company.com"
  password = "Employee@12345"
  employeeCode = "EMP001"
  name = "Ali Khan"
  phone = "+923001234567"
  department = "Operations"
  designation = "Officer"
  fingerprintId = "FP001"
  employmentStatus = "ACTIVE"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:5000/api/admin/employees" `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body $employeeBody
```

Expected result:

```text
201 Employee created successfully
```

## Common Errors

### `401 Authorization header is missing or invalid`

No bearer token was sent.

Fix:

```http
Authorization: Bearer <token>
```

### `403 You do not have permission to access this resource`

The logged-in user is not `SUPER_ADMIN`.

### `400 Validation failed`

The request body is missing required fields or has invalid data.

Examples:

- bad email format
- short password
- missing employee code

### `409 Email is already registered`

The email already exists in `users`.

### `409 Employee code is already registered`

The employee code already exists in `employees`.

### `409 Fingerprint ID is already registered`

The fingerprint ID already exists in `employees`.

### `500 Employee role is not configured`

The `Employee` role is missing from the `roles` table.

Fix:

```powershell
node database/seeds/roles.seed.js
```

## Production Notes

- Passwords are hashed with bcrypt before storage.
- Password hashes are never returned in API responses.
- Employee creation uses a transaction.
- Request validation strips unknown fields.
- Route access is role protected.
- Unique database constraints back up service-level duplicate checks.
- The route only creates employees; it does not add admin-only attendance, shift, or biometric import behavior.

## Future Frontend Integration

The Super Admin frontend should:

1. Login through `POST /api/auth/login`.
2. Store the returned token securely on the client side.
3. Show a Create Employee form only to `SUPER_ADMIN`.
4. Submit the form to `POST /api/admin/employees`.
5. Display validation and duplicate-field errors returned by the API.

The current admin frontend page for this flow is:

```text
frontend-admin/pages/employees/create.vue
```
