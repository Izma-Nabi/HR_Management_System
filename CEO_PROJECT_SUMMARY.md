# Bookme.pk HR Management System

## Executive Summary

I worked on building and extending Bookme.pk, a web-based HR Management System that centralizes employee administration, attendance, leave management, access control, reporting, and employee self-service.

The project connects a Nuxt/Vue administrative portal to a Node.js and Express API, with Prisma and MySQL providing the data layer. I implemented both the user-facing workflows and the backend business rules behind them, including automated attendance synchronization, leave approvals, role-based permissions, password recovery, attendance complaints, and an employee AI assistant.

The result is a structured HR platform that reduces manual administrative work, improves visibility into employee activity, and provides a foundation that can be extended as the organization grows.

## What The Product Does

Bookme.pk provides a single system for:

- Managing employees, administrators, departments, designations, and user profiles.
- Authenticating users securely and controlling access by role and permission.
- Importing attendance events from an external attendance source and calculating daily summaries.
- Tracking check-in, check-out, breaks, late minutes, early departures, overtime, and attendance status.
- Allowing employees to submit leave requests and attendance complaints.
- Supporting review and approval workflows for leave and attendance corrections.
- Showing dashboards, attendance reports, employee information, and operational summaries.
- Helping employees understand their own attendance, leave, and HR information through an AI assistant.

## My Main Contributions

### 1. HR Platform Architecture

I worked across the complete application stack rather than only one screen or endpoint:

```text
Nuxt/Vue admin portal
        |
        v
Express REST API
        |
        v
Authentication, permissions, validation, and business services
        |
        v
Prisma data access layer
        |
        v
MySQL database
```

The backend follows a maintainable layered structure:

```text
Route -> Middleware -> Controller -> Service -> Repository -> Database
```

This separation keeps HTTP concerns, business rules, and database queries organized and makes future changes easier to test and maintain.

### 2. Authentication And Account Security

I implemented and integrated the authentication flow for administrators and employees, including:

- Password hashing with `bcrypt`.
- JWT-based login sessions.
- Current-user/profile retrieval.
- Account status checks before login.
- Role and permission information attached to the authenticated user context.
- Forgot-password and reset-password workflows.
- Cryptographically random password-reset tokens.
- SHA-256 hashing of reset tokens before database storage.
- Fifteen-minute token expiry.
- One-time token removal after a successful password reset.
- Email delivery through Nodemailer with a dedicated reset-password template.
- Non-disclosing forgot-password responses so the API does not reveal whether an email exists.

### 3. Role-Based Access Control

I implemented granular authorization instead of relying only on broad user roles. The system supports role-based permissions for areas such as:

- Employee management.
- Department and designation management.
- Role management.
- Attendance import and reporting.
- Personal, team, and organization-wide attendance visibility.
- Leave creation, viewing, approval, rejection, and cancellation.

The main roles are Super Admin, Admin, and Employee. Permissions are enforced in the backend, while the frontend uses the same access model to show the appropriate navigation and actions.

This protects business operations at the API level and allows the organization to evolve permissions without rewriting every feature.

### 4. Attendance Automation And Calculation

Attendance was one of the most operationally important parts of the project. I implemented workflows for:

- Importing attendance data from a Google Sheet/workbook source.
- Matching incoming records to users through employee and biometric identifiers.
- Preventing duplicate imports with unique source keys.
- Recording raw attendance events such as check-in, check-out, break start, and break end.
- Automatically checking out employees at the end of the working day.
- Generating daily attendance summaries after the day is finalized.
- Calculating working minutes, late minutes, early-leave minutes, overtime, expected minutes, and final attendance status.
- Running scheduled jobs in Pakistan Standard Time using `Asia/Karachi`.
- Preventing overlapping synchronization and summary jobs within the running process.

The scheduler runs attendance synchronization every 30 seconds, performs automatic checkout at 11:59 PM, and finalizes the previous day's summaries at midnight.

This turns attendance from a manually maintained record into a repeatable data pipeline with traceable raw events and calculated business summaries.

### 5. Attendance Complaints And Correction Workflow

I implemented an employee-facing attendance correction workflow. Employees can submit complaints for:

- Check-in issues.
- Check-out issues.
- Both check-in and check-out.
- Incorrect attendance status.
- Other attendance-related problems.

The system records the requested date and time, reason, current status, reviewer note, reviewer, and review timestamps. This gives HR a controlled approval process instead of allowing attendance data to be changed informally.

### 6. Leave Management

I implemented leave request and approval workflows covering:

- Annual, casual, sick, unpaid, and other leave types.
- Start date, end date, total days, and reason.
- Reporting manager and backup employee information.
- Pending, approved, rejected, and cancelled states.
- Approval history and audit actions.
- Different visibility levels for the employee, team, and organization.
- Email notification support for leave-related events.

The data model supports multi-step HR workflows and preserves the history needed to understand who submitted, reviewed, approved, rejected, or cancelled a request.

### 7. Employee And Organization Management

I worked on the management features required to operate the HR system, including:

- Employee creation, editing, listing, and deletion.
- Admin user management.
- Departments and department-specific designations.
- Employee photos and upload handling.
- Employee codes and administrator codes.
- Employment status and account status.
- Biometric ID mapping for attendance integration.
- Search and filtering in the administration screens.

The database relationships connect users to their roles, departments, designations, attendance records, attendance summaries, leave requests, and complaints.

### 8. Employee AI Assistant

I added an employee-focused AI assistant that can answer questions using the authenticated employee's own HR context. The assistant gathers relevant information such as:

- Employee profile and organizational details.
- Attendance events and attendance summaries.
- Leave requests and statuses.
- Role and access context.

The assistant includes:

- A dedicated backend module and API routes.
- Employee-specific business rules and response guidance.
- Provider integrations for Google Gemini and OpenRouter.
- Context-aware answers based on the logged-in user rather than generic responses.
- A Nuxt dashboard page for the employee experience.

The important design principle is that the assistant is connected to application data and user identity, so it can provide useful HR answers while remaining scoped to the employee's authorized context.

### 9. Admin Dashboard And Frontend Experience

I worked on the Nuxt/Vue admin portal, including:

- Login, forgot-password, and reset-password screens.
- Dashboard summary cards and charts.
- Employee and user management screens.
- Department and designation management.
- Role and permission administration.
- Attendance views and daily details.
- Attendance complaint review screens.
- Leave application and leave review screens.
- Employee AI assistant screen.
- Permission-aware navigation and dashboard actions.

The frontend communicates with the backend through service modules and uses route middleware and shared components to keep the application consistent.

## Technical Stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Frontend | Nuxt, Vue, Vue Router | Admin portal, routing, and reactive UI |
| Backend | Node.js, Express | REST API and server-side application logic |
| Database | MySQL | Persistent HR and attendance data |
| ORM | Prisma | Schema management, relations, queries, and migrations |
| Authentication | JWT, bcrypt | Secure sessions and password protection |
| Validation | Joi | Request validation and normalized input |
| Security | Helmet, CORS | HTTP security headers and origin control |
| Uploads | Multer | Employee photos and attendance files |
| Scheduling | Node-cron | Attendance synchronization and daily processing |
| Spreadsheet processing | Axios, XLSX | Downloading and parsing attendance workbooks |
| Email | Nodemailer | Password reset and workflow notifications |
| Charts | ECharts, ApexCharts | Dashboard reporting and visualization |
| AI | Google Gemini, OpenRouter | Context-aware employee assistant |

## Engineering Practices I Applied

- Organized backend code into routes, middleware, controllers, services, repositories, and utilities.
- Centralized authentication and authorization checks.
- Used database migrations to evolve the schema safely over time.
- Added relational database constraints and indexes for important lookup paths.
- Used unique source identifiers to make attendance imports idempotent.
- Added validation before business logic runs.
- Added centralized error handling and consistent API responses.
- Used environment-based configuration for database, frontend, email, attendance, and AI integrations.
- Preserved compatibility routes where existing frontend clients depended on older API paths.
- Designed attendance records as raw events plus calculated daily summaries for better traceability.
- Built workflows around explicit statuses and audit history rather than direct uncontrolled updates.

## Business Value

The work delivers value in several practical areas:

- **Less manual work:** Attendance synchronization and daily calculations run automatically.
- **Better accountability:** Leave and attendance corrections have defined statuses and review history.
- **Stronger security:** Access is controlled by authenticated identity, role, and granular permission.
- **Better decision-making:** Dashboards and summaries provide a clearer view of workforce activity.
- **Improved employee experience:** Employees can manage leave, view attendance, recover accounts, and ask HR-related questions in one system.
- **Scalable foundation:** New roles, permissions, reports, workflows, and integrations can be added within the existing architecture.

## A Strong CEO-Level Explanation

> I worked on Bookme.pk, an HR management platform that brings employee administration, attendance, leave management, permissions, and reporting into one system. My work covered both the Nuxt frontend and the Node.js backend, including secure JWT authentication, granular role-based access, password recovery, automated attendance synchronization and calculations, leave and attendance approval workflows, and an employee AI assistant connected to authorized HR data. The key value was turning manual HR operations into structured, auditable, and automated workflows that can scale with the organization.

## If Asked For More Technical Detail

> Technically, I worked with Nuxt and Vue on the frontend, Express and Node.js on the backend, and Prisma with MySQL for the database. I followed a route-controller-service-repository architecture, used migrations and relational constraints for the data model, added background jobs for attendance processing, and protected APIs with JWT authentication and granular permissions. I also integrated email-based password recovery, spreadsheet attendance imports, and AI providers through a dedicated employee assistant module.

## Project Maturity And Next Improvements

The platform has a substantial working foundation across authentication, HR administration, attendance, leave, reporting, and employee self-service. The next engineering improvements I would prioritize are:

- Add automated unit and integration test coverage for authentication, attendance calculations, and leave approvals.
- Add structured audit logging for sensitive administrative actions.
- Add centralized monitoring and alerting for scheduled attendance jobs.
- Move large attendance imports to a queue or worker process as data volume grows.
- Add stronger automated checks for AI response quality and data scoping.
- Add API documentation and deployment runbooks.

These improvements would increase release confidence and operational visibility as the system moves toward larger production workloads.

## Repository Areas

- `backend/`: Express API, authentication, HR modules, scheduled jobs, and integrations.
- `database/`: Prisma schema, database client, migrations, and seed data.
- `frontend-admin/`: Nuxt/Vue administrative and employee-facing portal.
- `global/`: Shared environment and configuration loading.
- `TECHNICAL_DOCUMENTATION.md`: Detailed implementation and route reference.
