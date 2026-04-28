# dashboard-rvscas — Implementation Plan

## 1. Goal
Build a single **Next.js dashboard application** named **`dashboard-rvscas`** that allows authenticated users to:

- log in securely
- view data from **multiple MongoDB databases** in one place
- browse collections and documents easily
- search and filter records
- export data to **Excel / CSV / JSON / PDF**
- manage database connections from one central codebase

This project should be designed for **read-first admin analytics and export usage**.

---

## 2. Main Requirement
The MongoDB server contains multiple databases such as:

- `admin`
- `brochure-leads`
- `config`
- `ias-pipp-org`
- `local`
- `mba`
- `mba-2026-landing-page`
- `online-admission`
- `pipp-org`
- `rvs-school`
- `transformtech-ai`
- `transformtech-in`
- `transformtech-in-contact`

Some databases also contain multiple collections such as:

- `mba-2026-reserve-seat`
- `mba-ask-2026`
- `mba-brochure-2026`
- `mba-speak-2026`
- `atheenquiries`
- `financeenquiries`
- `transformtechpilots`
- `contacts`

The dashboard must support **showing all configured DBs and collections in a single application** after login.

---

## 3. Suggested Tech Stack
Use the following stack:

- **Next.js 14+** with App Router
- **TypeScript**
- **Tailwind CSS**
- **MongoDB Node Driver** or **Mongoose**
- **NextAuth** or custom JWT session auth
- **Zod** for validation
- **TanStack Table** for data tables
- **SheetJS / xlsx** for Excel export
- **json2csv** for CSV export
- **jsPDF / pdfmake** for PDF export
- **React Query** or server-side data fetching where useful

Preferred approach:
- Use **MongoDB native driver** for better control over multiple DB connections.
- Use **server actions / API routes** only for database access.
- Never expose MongoDB connection logic in client components.

---

## 4. High-Level Architecture
Create one dashboard app with these layers:

### Frontend
- Login page
- Sidebar with database list
- Collection list under each database
- Data table view
- Search / filter / pagination UI
- Export buttons
- Dashboard summary cards

### Backend
- Central database connection manager
- Database metadata service
- Collection query service
- Export service
- Authentication middleware
- Audit logging for exports and logins

### Security
- Route protection
- Role-based access
- Read-only access by default
- Limit query size
- Prevent direct arbitrary query execution from frontend

---

## 5. Folder Structure
Suggested project structure:

```txt
/dashboard-rvscas
    /app
      /login
      /dashboard
        /[dbName]
          /[collectionName]
      /api
        /auth
        /databases
        /collections
        /documents
        /export
    /components
      /layout
      /tables
      /filters
      /charts
      /export
      /ui
    /lib
      /auth
      /mongodb
      /services
      /utils
      /validators
    /types
    /config
  .env.local
  package.json
  README.md
```

---

## 6. Connection Strategy
Because one MongoDB server contains many databases, create a **central connection manager**.

### Recommended pattern
Use one MongoDB cluster/server connection and dynamically access databases by name.

Example idea:
- one main `MongoClient`
- `client.db('mba')`
- `client.db('mba-2026-landing-page')`
- `client.db('transformtech-ai')`

### Create these files
- `lib/mongodb/client.ts`
- `lib/mongodb/db-registry.ts`
- `lib/mongodb/getDatabase.ts`
- `lib/mongodb/getCollection.ts`

### db-registry.ts purpose
Maintain a controlled allowlist of database names and collection names.
This avoids exposing every database blindly.

Example registry structure:

```ts
export const DB_REGISTRY = {
  admin: ["users", "roles"],
  mba: ["students", "applications"],
  "mba-2026-landing-page": [
    "mba-2026-reserve-seat",
    "mba-ask-2026",
    "mba-brochure-2026",
    "mba-speak-2026"
  ],
  "transformtech-ai": [
    "atheenquiries",
    "financeenquiries",
    "transformtechpilots"
  ],
  "transformtech-in": ["contacts"],
  "transformtech-in-contact": ["contacts"]
};
```

Codex should build the app so new DBs or collections can be added by editing the registry only.

---

## 7. Authentication Plan
Users must log in before viewing data.

### Recommended auth roles
- `super_admin` → can view all databases and export all data
- `manager` → can view selected databases and export selected collections
- `viewer` → read-only, limited database access

### Login requirements
- secure login form
- hashed passwords with bcrypt
- session-based auth
- protected routes for `/dashboard/*`
- redirect unauthenticated users to `/login`

### Optional later
- OTP / email login
- Google sign-in
- IP restriction for internal staff use

### Current auth extension
- built-in `.env.local` super admin login remains supported
- super admin can open a **Settings** page inside the dashboard
- super admin can create dashboard users
- each created user can be assigned:
  - `manager` or `viewer` role
  - specific database access
- settings option must be hidden for non-super-admin users
- non-super-admin users must only see the databases assigned to them

---

## 8. Core Features to Build

### Phase 1 — Foundation
1. Create Next.js project `dashboard-rvscas`
2. Configure TypeScript and Tailwind
3. Set up auth
4. Create MongoDB connection manager
5. Create DB registry config
6. Build protected dashboard layout

### Phase 2 — Database Explorer
1. Show all allowed databases in sidebar
2. On click, show collections under selected database
3. On collection click, fetch documents
4. Show documents in paginated table
5. Add sorting, search, and filters
6. Add document count display

### Phase 3 — Export Tools
1. Export visible rows to CSV
2. Export filtered data to Excel
3. Export single document to JSON
4. Export table view to PDF
5. Add date-range export

### Phase 4 — Quality and Security
1. Add loading states and error handling
2. Add audit logs for login and exports
3. Add query limits and server validation
4. Add role-based access control
5. Add reusable filter schema validation

### Phase 5 — Nice-to-Have
1. Dashboard cards for total databases / collections / records
2. Charts by enquiry source / date / campaign
3. Saved filters
4. Collection-specific column presets
5. Dark mode

---

## 9. Important Product Decisions
Codex should follow these rules:

### A. Read-only first
The first version should be **view + export only**.
Do not allow insert, update, or delete in v1.

### B. Controlled access only
Do not allow users to type raw MongoDB queries.
Only allow:
- pagination
- search
- filter
- sort
- export

### C. Secure server-only DB access
All DB operations must happen on the server.
No connection strings in frontend code.

### D. Registry-driven design
All visible DBs and collections must come from a central config file.

### E. Generic reusable table
Build one reusable data table component that works for any collection.

---

## 10. API / Server Route Plan
Create these endpoints or server handlers:

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

### Metadata
- `GET /api/databases`
- `GET /api/databases/:dbName/collections`

### Data
- `GET /api/data/:dbName/:collectionName`
- supports:
  - `page`
  - `limit`
  - `search`
  - `sortBy`
  - `sortOrder`
  - `dateFrom`
  - `dateTo`

### Export
- `GET /api/export/:dbName/:collectionName?type=csv`
- `GET /api/export/:dbName/:collectionName?type=xlsx`
- `GET /api/export/:dbName/:collectionName?type=json`
- `GET /api/export/:dbName/:collectionName?type=pdf`

---

## 11. UI Plan

### Login Page
- clean login form
- email / username
- password
- remember me optional

### Dashboard Layout
- left sidebar: database list
- expandable collections under each DB
- topbar: user info, search, export actions
- main area: table + filters + stats

### Collection View Page
Show:
- database name
- collection name
- total records
- filters
- search bar
- export buttons
- paginated data table

### Summary Page
At `/dashboard` show:
- total configured databases
- total collections
- latest records count
- recent export logs

---

## 12. Filtering Strategy
Since collections may have different structures, build a **generic filter engine**.

### Minimum filters
- keyword search
- date range filter
- exact field filter
- sort ascending / descending

### Smart enhancement
Codex can inspect sample documents and generate useful filters per collection such as:
- `createdAt`
- `name`
- `email`
- `phone`
- `course`
- `status`
- `source`
- `campaign`

---

## 13. Export Strategy
The export system must work from the current filtered dataset.

### Export formats
- **CSV** → lightweight tabular export
- **Excel** → best for admin usage
- **JSON** → raw developer/admin export
- **PDF** → printable summary export

### Export rules
- export current filters only
- include export timestamp
- include DB name and collection name
- optionally include total records in file metadata/header

### Optional enhancement
- export selected rows only
- bulk export multiple collections later

---

## 14. Performance Rules
Codex must follow these performance rules:

- never fetch unlimited documents in UI
- default page size = 25 or 50
- max page size = 100
- add indexes for common fields if needed
- use projection to reduce payload size
- avoid full collection scan where possible
- add debounce for search input

---

## 15. Security Rules
Codex must follow these security rules strictly:

- store Mongo URI only in `.env.local`
- never expose secrets to client
- validate `dbName` and `collectionName` using registry allowlist
- sanitize search/filter input
- rate-limit login endpoint if possible
- log export activity
- block dangerous operators from user input
- use HTTPS in production
- set secure cookies

---

## 16. Environment Variables
Suggested `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
ADMIN_DEFAULT_EMAIL=admin@example.com
ADMIN_DEFAULT_PASSWORD=change_this
```

If using custom auth instead of NextAuth, adapt accordingly.

---

## 17. Database Registry Example
Codex should create a config file like this and use it everywhere:

```ts
export const DB_REGISTRY = [
  {
    dbName: "admin",
    label: "Admin",
    collections: []
  },
  {
    dbName: "mba-2026-landing-page",
    label: "MBA 2026 Landing Page",
    collections: [
      "mba-2026-reserve-seat",
      "mba-ask-2026",
      "mba-brochure-2026",
      "mba-speak-2026"
    ]
  },
  {
    dbName: "transformtech-ai",
    label: "TransformTech AI",
    collections: [
      "atheenquiries",
      "financeenquiries",
      "transformtechpilots"
    ]
  },
  {
    dbName: "transformtech-in",
    label: "TransformTech IN",
    collections: ["contacts"]
  },
  {
    dbName: "transformtech-in-contact",
    label: "TransformTech IN Contact",
    collections: ["contacts"]
  }
];
```

Later, Codex may extend this registry after inspecting existing data.

---

## 18. Delivery Plan for Codex
Tell Codex to implement in this order:

### Step 1
Scaffold project:
- Next.js with TypeScript
- Tailwind setup
- ESLint + Prettier
- app router structure

### Step 2
Create reusable backend utilities:
- Mongo client singleton
- DB registry config
- auth helper
- role guard
- response helper

### Step 3
Build auth flow:
- login page
- session handling
- middleware route protection

### Step 4
Build dashboard shell:
- sidebar
- topbar
- dashboard home page

### Step 5
Build metadata routes:
- list databases
- list collections by DB

### Step 6
Build generic collection viewer:
- table rendering
- pagination
- sorting
- search
- empty state
- loading state

### Step 7
Build exports:
- CSV
- Excel
- JSON
- PDF

### Step 8
Add polish:
- audit logs
- error boundaries
- permissions
- responsive improvements

---

## 19. Acceptance Criteria
The work is complete only when:

- user can log in successfully
- user can see all allowed databases in sidebar
- user can open collections from each database
- user can view data in paginated tables
- user can search and filter records
- user can export filtered data
- app is secure and server-driven
- adding a new database requires only registry update

---

## 20. Extra Instruction for Codex
Codex should write the project in a way that is:

- modular
- scalable
- typed properly
- easy to maintain
- easy to add new databases and collections
- optimized for admin dashboard usage

Codex should prefer reusable utilities over repeated logic.

---

## 21. Suggested First Release Scope
For v1, complete only:

- login
- sidebar DB explorer
- collection data table
- search
- pagination
- CSV / Excel / JSON export
- role-based protected access

Leave advanced charts and analytics for v2.

---

## 22. Final Build Instruction
**Build a production-ready Next.js admin dashboard named `dashboard-rvscas` that connects to one MongoDB server containing multiple databases, shows allowed DBs and collections after login, lets users browse records safely, and supports filtered data export in CSV, Excel, JSON, and PDF. Use a registry-driven architecture, secure server-side database access, reusable table components, and read-only admin workflows in v1.**

