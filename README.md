
# 🏥 Pharmacy Management System (PMS) — Backend API

An enterprise-grade, highly scalable, and secure RESTful backend API designed to orchestrate pharmacy retail operations, inventory control, procurement, digital prescription tracking, sales point-of-sale (POS) systems, automated reporting, and background worker alerts.

Built on top of the progressive **NestJS** framework, this project implements a highly modular and robust architecture with strict design patterns, security compliance, and comprehensive diagnostic logging.

---

## 🚀 Key Architectural Features & Modules

The backend is organized into isolated, cohesive feature modules located in `src/modules/`:

- **🔐 Authentication & RBAC (`AuthModule`)**
  - Secure JWT-based Token Management with Access and Refresh Tokens.
  - Multi-tier Role-Based Access Control (RBAC) supporting `Super Admin`, `Admin`, `Pharmacist`, `Cashier`, and `Viewer`.
  - Secure password hashing using BCrypt.

- **📦 Inventory & Stock Movement (`InventoryModule`)**
  - Unified database for medicine assets with generic names, SKUs, unique barcode indexing, and dosage forms.
  - Dynamic Stock Movements tracking (Purchases, Sales, Returns, Adjustments, Transfers, Expiry, Damage).
  - Automated low-stock and upcoming-expiry detection with configurable thresholds.

- **🤝 Supplier Management (`SuppliersModule`)**
  - Comprehensive supplier directories, contact profiles, credit limits, and payment statuses.
  - Integration with procurement workflows to track supplier reliability.

- **🛒 Purchase Orders & Procurement (`PurchaseOrdersModule`)**
  - Full lifecycle procurement system: `Draft` ➔ `Sent` ➔ `Partially Received` ➔ `Received` ➔ `Cancelled`.
  - Automated updates to stock levels upon receiving products.

- **👥 Customer Relations & Loyalty (`CustomersModule`)**
  - Profiles mapping contact details, loyalty points tracking, and unified history of prescriptions and sales.

- **🩺 Digital Prescriptions (`PrescriptionsModule`)**
  - Prescription ingestion and digital verification matching doctor details.
  - Strict compliance check ensuring prescription-only medicines are validated against verified prescriptions before sales checkout.

- **💳 Point of Sale & Billing (`SalesModule`)**
  - Real-time POS checkout pipeline managing line-item subtotals, tax (HSN/GST), discounts, and net totals.
  - Dual-transaction integrity: checkout triggers atomic stock decrements and generates compliant invoices.
  - Multiple payment channel bindings: Cash, Card, Mobile, Insurance, and Credit.

- **📊 BI, Auditing & Reports (`ReportsModule`, `AuditModule`)**
  - Multi-dimensional sales dashboards, inventory valuations, low-stock reports, and profit-margin analytics.
  - **Compliance Audit Logs**: Enterprise-grade, immutable logging capturing user actions, changes (old/new values via `jsonb` snapshots), endpoints, IP addresses, and user-agent strings.

- **⏰ Cron Jobs & Notifications (`JobsModule`, `NotificationsModule`)**
  - Automated background queue processing powered by `@nestjs/schedule`.
  - Daily scheduled medicine expiry checks (triggering high/critical warning notifications).
  - Hourly active stock level checking to warn cashiers/admin of low stock.

---

## 🛠️ Technology Stack & System Topology

The backend utilizes an optimized set of core technologies:

| Technology | Layer / Purpose | Details |
| :--- | :--- | :--- |
| **NestJS v11** | Backend Framework | Modular architectures, IoC container, robust HTTP abstractions. |
| **PostgreSQL** | Primary Database | Relational database handling transactions with high ACID compliance. |
| **TypeORM** | Object-Relational Mapper | TypeScript entities, migrations, and repository patterns. |
| **Redis** | Caching & Jobs Queue | In-memory store for high-performance caches and Bull worker queues. |
| **Passport & JWT** | Identity Verification | Bearer token authorization and stateless user sessions. |
| **Helmet & Throttler** | Security & Rate-Limiting | Secure headers setup, CORS filtering, and express rate-limiting. |
| **Winston Logger** | Diagnostic Logging | Structured files and console logging with runtime levels. |

### System Data Flow Topology

```
[ Client Request ]
       │
       ▼
 [ Helmet / CORS ]  ──► (Http Security Checks)
       │
       ▼
[ Throttler Guard ] ──► (Rate Limiting)
       │
       ▼
 [ JWT Guard / RBAC ] ──► (Authentication & Authorization)
       │
       ▼
[ Request ID Middleware ] ──► (Attaches X-Request-ID Header)
       │
       ▼
[ Logging Interceptor ] ──► (Logs Execution Speed & Payload)
       │
       ▼
 [ Validation Pipe ] ──► (Payload DTO Sanitization & Checks)
       │
       ▼
  [ Controllers ] ──► [ Services Layer ] ──► [ TypeORM Entities ]
                                                    │
                                                    ├──► [ PostgreSQL ] (Persistent Data)
                                                    └──► [ Redis Cache / Jobs Queue ]
```

---

## ⚙️ Environment Variables

A `.env` file should be configured in the project root. Refer to `.env.example` for details:

```ini
# Application configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1
API_PREFIX=api

# Database connection details
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=pharma_db
DB_SSL=false
DB_SYNC=false
DB_LOGGING=false

# Authentication credentials
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d

# Throttling & Upload constraints
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760

# CORS & Logging
CORS_ORIGINS=http://localhost:3000,http://localhost:4200
LOG_LEVEL=debug
```

---

## 📦 Local Installation & Setup

### 📋 Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v20.x or above)
- **npm** (v10.x or above)
- **PostgreSQL** database instance
- **Redis** service instance

### 1. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 2. Run Database & Cache (Optional: via Docker Compose)
If you prefer running PostgreSQL and Redis inside Docker containers, launch the development compose stack:
```bash
docker-compose up -d
```

### 3. Start Development Server
Run the NestJS application in watch mode:
```bash
npm run start:dev
```
The application will launch on `http://localhost:3000` (or the `PORT` specified in your `.env`).

---

## 🛠️ NPM Script Commands

- **Development Build & Start**
  ```bash
  # Start app in standard development mode
  npm run start
  
  # Start app with file hot-reloading (watch mode)
  npm run start:dev
  
  # Start app with debug listener active
  npm run start:debug
  ```

- **Production Build & Execution**
  ```bash
  # Compile TypeScript code to vanilla JS distribution (/dist)
  npm run build
  
  # Launch the compiled distribution
  npm run start:prod
  ```

- **Testing Suits**
  ```bash
  # Run unit test specs via Jest
  npm run test
  
  # Run e2e tests
  npm run test:e2e
  
  # Generate Jest code coverage reports
  npm run test:cov
  ```

- **Code Quality & Linting**
  ```bash
  # Fix files formatting via Prettier
  npm run format
  
  # Audit and auto-fix typescript/eslint violations
  npm run lint
  ```

---

## 📑 API Documentation & Interactive Playground

The backend exposes an interactive **Swagger UI** for developers to explore and try out API endpoints during non-production builds.

- **Documentation Portal**: `http://localhost:3000/api/v1/docs`
- **Specification Format**: OpenAPI 3.0

### Accessing Protected Endpoints:
1. Trigger a token generation request via the `POST /api/v1/auth/login` endpoint.
2. Copy the resulting `accessToken`.
3. Click the **Authorize** button at the top of the Swagger UI dashboard.
4. Input the token under the Bearer scheme header and save.

---

## 👤 Author Profile

This project is actively maintained and designed by:

### **Sajjad Hossain**
**Full-Stack Engineer**
*Specializing in Next.js · NestJS · TypeScript · AWS Cloud Architecture*

* **📞 Phone**: [+880 1813 594 487](tel:+8801813594487)
* **✉️ Email**: [sajjad19397@gmail.com](mailto:sajjad19397@gmail.com)
* **📍 Location**: Dhaka, Bangladesh
* **🌐 GitHub**: [github.com/sajjadhossain67](https://github.com/sajjadhossain67)
* **👔 LinkedIn**: [linkedin.com/in/sajjad19397](https://www.linkedin.com/in/sajjad19397/)
* **💼 Portfolio**: [sajjad-hossain.netlify.app](https://sajjad-hossain.netlify.app/)

---

## 📄 License
This application is proprietary and closed-source. All rights reserved. Licensed under private terms.

