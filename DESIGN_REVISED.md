# TravelMate — Master System Design Specification

**Project:** TravelMate: A Web-Based Travel and Itinerary Planning System  
**Platform:** Web Application  
**Project Type:** IPT2 Web-Based Application  
**Development Approach:** Full-stack web application with REST API and third-party API integrations  
**Database:** Supabase PostgreSQL  
**Primary External Integrations:** Maps/Location API and Weather API  
**Status:** Development Baseline  
**Target Final Presentation:** October 31, 2026

---

## 1. Purpose of This Document

This document is the master technical and product specification for the TravelMate web application.

The development agent must use this file as the primary implementation guide when creating, modifying, debugging, testing, and extending the system.

The goal is to build a working, reliable, user-friendly travel planning application before spending significant effort on visual decoration.

Development priority:

1. Functional correctness
2. Database integrity
3. Authentication and authorization
4. API integration reliability
5. Complete user workflows
6. Error handling and validation
7. UX improvements
8. UI visual refinement
9. Testing
10. Deployment

Do not sacrifice working functionality merely to improve visual appearance.

---

# 2. Project Background

Travel planning commonly requires users to organize destinations, activities, schedules, maps, weather information, and expenses across multiple applications or manually maintained notes.

TravelMate centralizes these activities into one web-based application.

The system allows a registered traveler to create trips, manage destinations, build day-by-day itineraries, record activities and expenses, and view location and weather information through external API integrations.

The system is intended as an academic IPT2 project and must remain achievable within the project timeline.

---

# 3. Core Project Requirements

TravelMate MUST contain all four required components:

- Frontend
- Backend
- Database
- API Integration

The architecture shall remain:

```text
User
  |
  v
Frontend Web Application
  |
  | HTTPS / REST API
  v
Node.js + Express Backend
  |
  +--------------------+
  |                    |
  v                    v
Supabase PostgreSQL   External APIs
Database              Maps / Location
                      Weather
```

The application must not become a frontend-only application.

---

# 4. Locked Technology Stack

## 4.1 Frontend

Preferred:

- React.js or Next.js
- Responsive web design
- Tailwind CSS or the existing project styling system
- Reusable components
- Client-side state management appropriate to project complexity

Do not replace the existing frontend framework if the generated project already has a working React/Next.js implementation unless there is a concrete technical reason.

## 4.2 Backend

Preferred:

- Node.js
- Express.js
- REST API
- Server-side validation
- Authentication middleware
- Service/controller separation

Keep the existing backend framework if already implemented.

## 4.3 Database

Use:

- Supabase
- PostgreSQL

Supabase is the hosted PostgreSQL database platform for TravelMate.

The application should use Supabase PostgreSQL through the backend unless a specific feature explicitly requires the Supabase client SDK.

## 4.4 Authentication

Default architecture:

- Application-managed authentication
- Secure password hashing
- JWT-based authentication
- Backend authorization middleware

Do NOT automatically replace the existing JWT authentication architecture with Supabase Auth.

If the existing implementation already uses JWT successfully, preserve it.

Supabase should primarily provide PostgreSQL database hosting.

## 4.5 External APIs

The proposal requires API integration for:

1. Maps/location information
2. Weather information

The implementation should isolate third-party API logic inside backend services.

---

# 5. Supabase Database Setup

The development agent is responsible for preparing the project for Supabase PostgreSQL.

## 5.1 Required Setup

The agent should:

1. Inspect the existing database implementation.
2. Determine whether an ORM/query library already exists.
3. Preserve the existing database abstraction where practical.
4. Configure PostgreSQL/Supabase connection variables.
5. Create database migrations or SQL schema scripts.
6. Apply the schema to Supabase.
7. Verify database connectivity.
8. Verify CRUD operations.
9. Verify authentication-related database operations.
10. Verify foreign-key relationships.

Do not create duplicate tables if they already exist.

## 5.2 Environment Variables

Server-side environment variables should follow this pattern:

```env
DATABASE_URL=
JWT_SECRET=
MAPS_API_KEY=
WEATHER_API_KEY=
PORT=
CORS_ORIGIN=
```

The actual secret values must NEVER be committed to Git.

The frontend must never receive the PostgreSQL database password.

Create/update `.env.example` with placeholder values only.

## 5.3 Supabase Database Rules

The database should enforce:

- Primary keys
- Foreign keys
- Appropriate NOT NULL constraints
- Appropriate UNIQUE constraints
- Appropriate numeric/date types
- Referential integrity
- Timestamps

The backend must still perform authorization checks.

Database access must not allow one traveler to retrieve or modify another traveler's data.

---

# 6. Database Schema

The minimum database model is:

```text
users
  |
  +----< trips
           |
           +----< destinations
           |
           +----< itinerary_days
           |          |
           |          +----< activities
           |
           +----< expenses

users
  |
  +----< notifications
```

## 6.1 users

Suggested fields:

```text
id
full_name
email
password_hash
role
created_at
updated_at
```

Requirements:

- `id` is the primary key.
- `email` is unique.
- Passwords are stored only as secure hashes.
- `role` supports at least traveler and administrator.

## 6.2 trips

```text
id
user_id
name
description
start_date
end_date
primary_destination
estimated_budget
created_at
updated_at
```

`user_id` references `users.id`.

## 6.3 destinations

```text
id
trip_id
name
address
latitude
longitude
description
created_at
updated_at
```

`trip_id` references `trips.id`.

## 6.4 itinerary_days

```text
id
trip_id
date
day_number
created_at
updated_at
```

`trip_id` references `trips.id`.

## 6.5 activities

```text
id
itinerary_day_id
name
description
start_time
end_time
location
estimated_cost
sort_order
created_at
updated_at
```

`itinerary_day_id` references `itinerary_days.id`.

## 6.6 expenses

```text
id
trip_id
activity_id
category
name
amount
expense_date
description
created_at
updated_at
```

`trip_id` references `trips.id`.

`activity_id` may be nullable when an expense is not associated with a particular activity.

## 6.7 notifications

```text
id
user_id
type
title
message
is_read
created_at
```

`user_id` references `users.id`.

---

# 7. Data Ownership and Security

This is a critical requirement.

A traveler must only be able to access their own trips and related data.

For example:

```text
User A
  |
  +-- Trip A
      +-- Destination A
      +-- Activity A
      +-- Expense A

User B
  |
  +-- Trip B
```

User A must NOT be able to:

- View User B's trips
- Edit User B's trips
- Delete User B's trips
- View User B's expenses
- Modify User B's destinations

The backend must verify ownership before returning, updating, or deleting protected resources.

Never rely only on frontend route protection.

---

# 8. Authentication

## 8.1 Registration

Required flow:

```text
Registration Form
      |
      v
POST /api/auth/register
      |
      v
Validate Input
      |
      v
Check Existing Email
      |
      v
Hash Password
      |
      v
Insert User
      |
      v
Success Response
```

Registration must:

- Validate required fields.
- Validate email format.
- Enforce password rules.
- Reject duplicate email.
- Hash passwords.
- Never store plaintext passwords.
- Return useful errors.

## 8.2 Login

```text
Login Form
    |
    v
POST /api/auth/login
    |
    v
Find User
    |
    v
Compare Password Hash
    |
    v
Generate JWT
    |
    v
Authenticated Session
```

## 8.3 Authentication Tests

Test:

- Valid registration
- Duplicate registration
- Valid login
- Invalid password
- Invalid email
- Logout
- Refresh
- Protected route access
- Expired/invalid token

---

# 9. Main User Roles

## 9.1 Traveler

The primary user.

Can:

- Register
- Login
- Logout
- Manage profile
- Create trips
- Edit trips
- Delete trips
- Add destinations
- Manage itinerary
- Manage activities
- Track expenses
- View maps
- View weather
- View trip summaries
- Receive notifications

## 9.2 Administrator

Administrative user.

Can:

- Access administrative functions
- Manage users where required
- Monitor application records
- Review system-level information
- Manage system configuration where implemented

Do not add unnecessary administrative features that are unrelated to the academic project's objectives.

---

# 10. Core Functional Modules

TravelMate consists of:

1. Authentication
2. User Management
3. Dashboard
4. Trip Management
5. Destination Management
6. Itinerary Management
7. Activity Management
8. Expense Management
9. Maps/Location Integration
10. Weather Integration
11. Notifications
12. Trip Reports/Summary
13. Administration

---

# 11. Trip Management

Users must be able to:

- Create trips
- View trips
- Edit trips
- Delete trips
- View trip details
- Set travel dates
- Set primary destination
- Add description
- Set estimated budget

## Validation

The system should prevent:

- Missing required trip name
- Invalid dates
- End date before start date
- Invalid budget values

After creating a trip:

- The record must be saved in Supabase.
- The new trip must appear in the user's trip list.
- Refreshing the browser must not lose the trip.
- The trip must belong to the authenticated user.

---

# 12. Destination Management

Users must be able to:

- Search for destinations
- Add destinations to a trip
- View destination details
- Edit destinations
- Delete destinations
- Store location coordinates
- Display a map location

A destination should be associated with a specific trip.

---

# 13. Maps / Location API Integration

The paper/proposal requires map/location API integration.

The implementation must support useful travel-planning functionality rather than merely displaying a decorative map.

Recommended capabilities:

- Destination search
- Address/location lookup
- Latitude/longitude
- Map display
- Destination marker

Flow:

```text
User searches destination
        |
        v
Frontend
        |
        v
TravelMate Backend
        |
        v
Maps/Location Service
        |
        v
Maps API
        |
        v
Normalized result
        |
        v
Frontend
```

## API Rules

- API credentials must be stored securely.
- Do not expose private server-side credentials.
- Handle API failure gracefully.
- Handle no search results.
- Handle rate limits.
- Do not permanently store unnecessary third-party data.

The exact provider may be selected based on availability, cost, academic project suitability, and API terms.

---

# 14. Weather API Integration

The paper/proposal requires weather API integration.

Weather information should be tied to a trip destination.

Recommended data:

- Current temperature
- Weather condition
- Humidity
- Wind
- Forecast where supported

Flow:

```text
Trip Destination
      |
      v
Latitude / Longitude
      |
      v
TravelMate Backend
      |
      v
Weather API
      |
      v
Normalized Weather Data
      |
      v
Weather Component
```

## Weather UX

If the API fails:

```text
Weather information is temporarily unavailable.
[Try Again]
```

The application must not crash because a third-party API is unavailable.

---

# 15. Itinerary Management

The itinerary is a core feature.

Structure:

```text
Trip
 |
 +-- Day 1
 |    +-- Activity
 |    +-- Activity
 |
 +-- Day 2
 |    +-- Activity
 |    +-- Activity
 |
 +-- Day 3
      +-- Activity
```

Users must be able to:

- Create itinerary days
- Add activities
- Edit activities
- Delete activities
- Set activity time
- Set location
- Add description
- Set estimated cost
- Reorder activities where practical

The system should prevent activities from being accidentally associated with another user's trip.

---

# 16. Expense Management

Users must be able to:

- Add expense
- Edit expense
- Delete expense
- Categorize expense
- Set amount
- Set date
- Add description
- Associate expense with a trip
- Optionally associate expense with an activity

Suggested categories:

- Transportation
- Accommodation
- Food
- Activities
- Shopping
- Other

Calculations:

```text
Total Expenses
= Sum of all trip expenses

Remaining Budget
= Estimated Budget - Total Expenses
```

The system must handle:

- Zero expenses
- Large values
- Decimal values
- Deleted expenses
- Updated expenses
- Invalid negative amounts

---

# 17. Dashboard

The dashboard should provide actionable travel information.

Minimum dashboard content:

- Welcome/user information
- Upcoming trips
- Total trips
- Active/upcoming trip
- Expense summary
- Upcoming activities
- Destination/weather information
- Quick actions

Recommended quick actions:

```text
+ Create Trip
+ Add Expense
+ Add Activity
View My Trips
```

The dashboard should load data from the backend rather than using hardcoded sample data.

---

# 18. Notifications

Implement basic in-app notifications.

Examples:

- Upcoming trip
- Upcoming activity
- Trip reminder
- Budget warning

Minimum requirements:

- Notification list
- Read/unread state
- Mark as read
- Notification timestamp

Avoid implementing email/SMS unless specifically required later. The paper mentions notifications, but the core API integrations explicitly required for TravelMate are Maps/Location and Weather.

---

# 19. Trip Summary / Reports

A trip summary should display:

- Trip name
- Travel dates
- Destinations
- Number of activities
- Estimated budget
- Actual expenses
- Remaining budget
- Expense categories
- Itinerary overview

The report must use actual database records.

---

# 20. REST API

Base path:

```text
/api
```

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

## Profile

```text
GET    /api/users/profile
PUT    /api/users/profile
PUT    /api/users/password
```

## Trips

```text
GET    /api/trips
GET    /api/trips/:id
POST   /api/trips
PUT    /api/trips/:id
DELETE /api/trips/:id
```

## Destinations

```text
GET    /api/trips/:tripId/destinations
POST   /api/trips/:tripId/destinations
PUT    /api/destinations/:id
DELETE /api/destinations/:id
```

## Itinerary

```text
GET    /api/trips/:tripId/itinerary
POST   /api/trips/:tripId/itinerary/days
PUT    /api/itinerary-days/:id
DELETE /api/itinerary-days/:id
```

## Activities

```text
POST   /api/itinerary-days/:dayId/activities
PUT    /api/activities/:id
DELETE /api/activities/:id
```

## Expenses

```text
GET    /api/trips/:tripId/expenses
POST   /api/trips/:tripId/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
```

## External Services

```text
GET /api/maps/search
GET /api/weather
```

Use consistent HTTP status codes and response formats.

---

# 21. API Response Standard

Success:

```json
{
  "success": true,
  "message": "Operation successful.",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Unable to complete the operation.",
  "error": "Validation failed."
}
```

Do not expose stack traces, database credentials, API keys, or internal secrets to clients.

---

# 22. UX-First Design Requirements

The system must prioritize usability for a traveler who may not be technically experienced.

## 22.1 UX Principles

- Clear navigation
- Predictable workflows
- Minimal unnecessary steps
- Helpful validation
- Clear confirmation messages
- Clear error messages
- Consistent forms
- Easy trip creation
- Easy itinerary editing
- Easy expense entry
- Responsive interaction
- Useful empty states

## 22.2 Loading States

Every asynchronous operation should have a loading state.

Examples:

```text
Loading trips...
Searching destinations...
Loading weather...
Saving trip...
Deleting activity...
```

Do not leave users wondering whether a button worked.

## 22.3 Empty States

Example:

```text
You don't have any trips yet.

Start planning your next adventure.

[Create Your First Trip]
```

## 22.4 Error States

Errors should explain:

- What happened
- What the user can do next

Avoid generic:

```text
Error 500
```

Prefer:

```text
We couldn't save your trip.
Please check your connection and try again.
```

## 22.5 Confirmation

Destructive operations require confirmation.

Example:

```text
Delete this trip?

This will also remove its destinations,
itinerary, activities, and expenses.

[Cancel] [Delete Trip]
```

Only use cascading deletion where the database/business rules explicitly support it.

---

# 23. UI/UX Information Architecture

Recommended primary navigation:

```text
TravelMate
 |
 +-- Dashboard
 +-- My Trips
 +-- Notifications
 +-- Profile
 +-- Settings
 +-- Logout
```

Trip-specific navigation:

```text
Trip
 |
 +-- Overview
 +-- Itinerary
 +-- Destinations
 +-- Expenses
 +-- Summary
```

The interface should avoid making users navigate through unnecessary pages to perform common actions.

---

# 24. UI Design Direction

The visual design should communicate:

- Travel
- Organization
- Trust
- Simplicity
- Exploration

The UI should be modern but practical.

Use:

- Cards for trip summaries
- Timeline/list for itinerary
- Clear forms
- Responsive tables/lists
- Maps for destinations
- Weather cards
- Visual expense summaries
- Clear primary actions

Do not prioritize decorative animations over functionality.

Do not redesign the entire application during bug fixes unless specifically requested.

---

# 25. Responsive Design

The system must work on:

- Desktop
- Laptop
- Tablet
- Mobile browser

## Desktop

Use:

- Sidebar/navigation
- Multi-column dashboard
- Expanded trip information

## Mobile

Use:

- Compact navigation
- Single-column layout
- Stacked forms
- Touch-friendly buttons
- Scrollable itinerary
- Responsive maps

All critical actions must remain accessible on smaller screens.

---

# 26. Accessibility

Implement basic accessibility:

- Semantic HTML
- Form labels
- Keyboard navigation
- Visible focus states
- Meaningful button labels
- Sufficient text contrast
- Accessible error messages
- Alternative text where applicable

---

# 27. Frontend Architecture

Recommended:

```text
frontend/
 |
 +-- pages/ or app/
 |
 +-- components/
 |    +-- common/
 |    +-- layout/
 |    +-- dashboard/
 |    +-- trips/
 |    +-- destinations/
 |    +-- itinerary/
 |    +-- expenses/
 |    +-- weather/
 |    +-- maps/
 |
 +-- services/
 |    +-- api
 |    +-- auth
 |    +-- trips
 |    +-- destinations
 |    +-- itinerary
 |    +-- expenses
 |    +-- weather
 |    +-- maps
 |
 +-- hooks/
 +-- utils/
 +-- types/
```

Reuse components instead of duplicating UI logic.

---

# 28. Backend Architecture

Recommended:

```text
backend/
 |
 +-- routes/
 |
 +-- controllers/
 |
 +-- services/
 |    +-- weatherService
 |    +-- mapsService
 |    +-- tripService
 |    +-- itineraryService
 |    +-- expenseService
 |
 +-- middleware/
 |    +-- auth
 |    +-- validation
 |    +-- errorHandler
 |
 +-- database/
 |    +-- migrations
 |    +-- schema
 |
 +-- validators/
 |
 +-- utils/
 |
 +-- config/
```

External API integrations should live in services rather than being mixed directly into controllers.

---

# 29. Error Handling

Implement centralized backend error handling.

Categories:

- Validation errors
- Authentication errors
- Authorization errors
- Not found
- Database errors
- External API errors
- Server errors

The frontend should convert technical errors into understandable messages.

---

# 30. Development Agent Rules

The coding agent must follow these rules.

## Rule 1 — Inspect Before Editing

Before changing code:

- Inspect relevant files.
- Identify current architecture.
- Identify the root cause.
- Determine dependencies.

## Rule 2 — Preserve Working Features

Do not rewrite unrelated working functionality.

## Rule 3 — No Fake Functionality

Do not use hardcoded data where real database/API integration is required.

## Rule 4 — No Placeholder APIs

Maps and Weather integrations must be real integrations using configured API credentials.

If credentials are unavailable, stop and clearly state what is required.

## Rule 5 — No Secrets in Source Code

Never commit:

- Database passwords
- JWT secrets
- Private API keys
- Service-role keys

## Rule 6 — Verify Database Operations

For every CRUD feature, verify:

```text
Create
Read
Update
Delete
Refresh persistence
Ownership/security
```

## Rule 7 — Verify End-to-End

A feature is not complete merely because its frontend button works.

Verify:

```text
Frontend
   ↓
API
   ↓
Backend
   ↓
Database / External API
   ↓
Response
   ↓
Frontend
```

## Rule 8 — Test After Changes

After implementation:

- Run the application.
- Check console errors.
- Check backend errors.
- Test the affected workflow.
- Test related workflows.

## Rule 9 — Keep Scope Controlled

Do not add:

- Flight booking
- Hotel booking
- Restaurant booking
- Payment processing
- Airline integrations
- Hotel integrations
- IoT
- Hardware
- Real-time GPS tracking
- Social networking
- Complex AI trip generation

unless the project scope is explicitly changed.

---

# 31. Feature Completion Checklist

A feature is complete only when:

- [ ] Frontend implemented
- [ ] Backend implemented
- [ ] Database integrated
- [ ] Validation implemented
- [ ] Authentication respected
- [ ] Authorization verified
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Error handling implemented
- [ ] Refresh persistence verified
- [ ] API integration verified if applicable
- [ ] Mobile behavior checked
- [ ] No console errors
- [ ] No server errors
- [ ] Documentation updated

---

# 32. Testing Strategy

## 32.1 Authentication

Test:

- Register
- Login
- Logout
- Invalid login
- Duplicate account
- Refresh
- Protected route
- Unauthorized resource access

## 32.2 Trips

Test:

- Create
- Read
- Update
- Delete
- Refresh persistence
- Date validation
- Ownership

## 32.3 Destinations

Test:

- Search
- Add
- Read
- Edit
- Delete
- Map display
- API failure

## 32.4 Itinerary

Test:

- Create day
- Add activity
- Edit activity
- Delete activity
- Ordering
- Time validation

## 32.5 Expenses

Test:

- Add
- Edit
- Delete
- Calculation
- Category totals
- Budget calculation

## 32.6 Weather

Test:

- Valid destination
- Invalid destination
- API failure
- Loading state
- Retry

---

# 33. API Testing

Use Postman or an equivalent API testing tool.

Minimum API tests:

```text
POST /auth/register
POST /auth/login
GET  /auth/me

GET  /trips
POST /trips
PUT  /trips/:id
DELETE /trips/:id

GET  /trips/:tripId/destinations
POST /trips/:tripId/destinations

GET  /trips/:tripId/itinerary

POST /itinerary-days/:dayId/activities

GET  /trips/:tripId/expenses
POST /trips/:tripId/expenses

GET /maps/search
GET /weather
```

---

# 34. Deployment Preparation

Before deployment:

- Production database configured in Supabase
- Backend deployed
- Frontend deployed
- Environment variables configured
- CORS configured
- API URLs updated
- HTTPS enabled
- External API credentials configured
- Database migrations applied
- Authentication tested in production
- User ownership tested in production

Never use development secrets in production.

---

# 35. Project Timeline

## Planning & Requirements
**Aug 28 – Sep 3**

- Finalize requirements
- Lock scope
- Confirm user roles
- Confirm integrations

## System Design
**Sep 4 – Sep 10**

- UI/UX
- Database
- Architecture
- API design

## Development Phase 1
**Sep 11 – Sep 20**

- Authentication
- Database
- Backend
- Frontend foundation
- Trip management

## Development Phase 2
**Sep 21 – Sep 30**

- Destinations
- Itinerary
- Activities
- Expenses
- Dashboard

## API Integration
**Oct 1 – Oct 5**

- Maps API
- Weather API
- API error handling

## Midterm Target
**Oct 6 – Oct 9**

Target: approximately 60–70% complete.

Required workflow:

```text
Register
  ↓
Login
  ↓
Dashboard
  ↓
Create Trip
  ↓
Add Destination
  ↓
Build Itinerary
  ↓
Add Activity
  ↓
Track Expense
  ↓
View Weather / Map
```

## Refinement
**Oct 10 – Oct 17**

- Notifications
- Reports
- UX improvements
- Responsive behavior
- Validation

## Testing & QA
**Oct 18 – Oct 23**

- Functional testing
- Integration testing
- API testing
- Security testing
- UAT

## Deployment
**Oct 24 – Oct 27**

- Production setup
- Database deployment
- Backend deployment
- Frontend deployment

## Documentation
**Oct 28 – Oct 30**

- Technical documentation
- User documentation
- Presentation preparation

## Final Presentation
**Oct 31**

- Demonstration
- Presentation
- Evaluation

---

# 36. MVP

The minimum acceptable system must provide:

### Authentication
- Registration
- Login
- Logout
- Protected routes

### Trips
- Create
- View
- Edit
- Delete

### Destinations
- Search
- Add
- View
- Map/location

### Itinerary
- Days
- Activities
- Edit/delete

### Expenses
- Add
- Edit
- Delete
- Totals

### APIs
- Maps/location API
- Weather API

### Dashboard
- Trips
- Upcoming activities
- Expenses
- Weather/location information

---

# 37. Out of Scope

The following are explicitly outside the current project:

- Flight booking
- Hotel booking
- Restaurant booking
- Payment processing
- Banking
- Airline account integration
- Hotel account integration
- Real-time GPS tracking
- IoT
- Hardware
- Travel agency management
- Social networking
- Medical services
- Travel insurance
- Complex AI itinerary generation

These may be documented as future enhancements.

---

# 38. Future Enhancements

Potential future features:

- AI-assisted itinerary suggestions
- Flight search API
- Hotel search API
- Restaurant recommendations
- Collaborative trip planning
- Offline itinerary
- Push notifications
- Advanced analytics
- Travel document storage
- Transportation information

These are not required for the current MVP.

---

# 39. Final Product Definition

TravelMate is complete when a real user can:

```text
Create an account
      ↓
Login
      ↓
Create a trip
      ↓
Search/add a destination
      ↓
View the destination on a map
      ↓
View weather information
      ↓
Build a day-by-day itinerary
      ↓
Add activities
      ↓
Record travel expenses
      ↓
View budget/expense summary
      ↓
View the complete trip dashboard
```

All information must persist through Supabase PostgreSQL.

The system must handle errors gracefully and must protect user data.

The final product should be judged primarily by:

1. Functional correctness
2. Data persistence
3. Secure access
4. Reliable API integration
5. Usable workflows
6. Responsive UX
7. Visual quality
8. Documentation

---

# 40. Agent Instruction

When this document is provided to an AI coding agent, the agent should treat it as the project's source-of-truth design specification.

Before implementing or changing anything:

1. Inspect the repository.
2. Inspect the current architecture.
3. Inspect existing environment variables.
4. Inspect the current database implementation.
5. Inspect Supabase configuration.
6. Inspect existing API integrations.
7. Inspect current authentication.
8. Compare the implementation against this document.
9. Identify gaps.
10. Implement changes incrementally.

For any requested bug fix:

```text
REPRODUCE
   ↓
INSPECT
   ↓
IDENTIFY ROOT CAUSE
   ↓
MAKE MINIMAL CHANGE
   ↓
TEST
   ↓
VERIFY DATABASE/API
   ↓
REPORT
```

For any requested new feature:

```text
REQUIREMENTS
   ↓
DATABASE
   ↓
BACKEND/API
   ↓
FRONTEND
   ↓
VALIDATION
   ↓
UX STATES
   ↓
TEST
   ↓
DOCUMENT
```

Never claim a feature is complete without testing its complete end-to-end workflow.

## GitHub Publishing and Version Control

GitHub is part of the TravelMate development workflow and must be configured from the beginning.

### Repository Requirements

- Create a Git repository for the TravelMate project.
- Use GitHub as the remote repository.
- Keep the repository private unless the project owner explicitly chooses to make it public.
- Keep `DESIGN.md` in the repository as the implementation source of truth.
- Include a proper `.gitignore`.
- Include a `.env.example` containing variable names only.
- Never commit real credentials, API keys, passwords, JWT secrets, database credentials, or `.env` files containing secrets.

### Initial GitHub Setup

After the project foundation is working:

1. Initialize Git if it is not already initialized.
2. Check `git status`.
3. Confirm no secrets or unnecessary generated files are tracked.
4. Create the initial commit.
5. Create or connect the GitHub repository.
6. Add the GitHub repository as the `origin` remote.
7. Push the project to the default branch.
8. Verify that the GitHub repository contains the expected files.

### Branching

Use a simple workflow:

- `main` — stable, working version.
- `feature/<feature-name>` — optional for larger features.
- `fix/<issue-name>` — optional for bug fixes.

Do not create unnecessary branches for small changes.

### Commit Guidelines

Use descriptive commit messages such as:

```text
feat: add trip management API
feat: add weather integration
fix: resolve login validation error
fix: prevent unauthorized trip access
docs: update project documentation
refactor: improve itinerary service
test: add authentication API tests
```

Avoid vague messages such as `update`, `changes`, `fix`, `latest`, or `final`.

### Before Every Push

The development agent should verify:

- The application builds successfully.
- Relevant tests pass.
- The changed functionality has been tested end-to-end where applicable.
- No obvious runtime or console errors exist.
- No secrets are staged.
- `.env` and other sensitive files are ignored.
- Only intended files are changed.
- Documentation is updated when necessary.

### Files That Must Never Be Committed

```text
.env
.env.local
.env.production
*.pem
*.key
database passwords
API secrets
JWT secrets
private credentials
```

Allowed example:

```text
.env.example
```

The example file must contain placeholders only.

### GitHub README

The repository should contain a `README.md` covering:

- Project name and purpose
- Main features
- Technology stack
- System architecture
- Required environment variables
- Local development setup
- Database setup
- API setup
- Frontend and backend run commands
- Testing instructions
- Deployment information
- Git/GitHub workflow

Never place actual credentials in the README.

### GitHub and Deployment Relationship

GitHub is the source-control repository. It is not the application's database or application server.

The intended relationship is:

```text
Developer / Antigravity IDE
        ↓
      Git
        ↓
     GitHub
        ↓
 ┌──────┴────────┐
 ↓               ↓
Frontend       Backend
Hosting        Hosting
 ↓               ↓
       Supabase
      PostgreSQL
```

The frontend/backend hosting provider may be selected during deployment, while Supabase remains the database platform specified by this design.

### Git Agent Rules

When making project changes:

1. Inspect the current Git status before modifying files.
2. Make the smallest appropriate change.
3. Test the change.
4. Review changed files.
5. Check that no secrets are staged.
6. Commit with a descriptive message when instructed.
7. Push to GitHub only when explicitly requested or required by the agreed workflow.
8. Never force-push or rewrite Git history unless explicitly authorized.
