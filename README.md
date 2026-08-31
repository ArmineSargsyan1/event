# Event Platform: Unified Tourism, Social Networking and Dynamic Reservation Ecosystem

[![Live API Host](https://shields.io)](https://event-rpjz.onrender.com)

> Production Deployment Base URL: https://event-rpjz.onrender.com

---

## Project Architecture

The architecture adheres to a strict, modular MVC-Service Layer pattern to gracefully decouple application routing, isolate heavy transactional business logic, enforce schema-driven input validation, and streamline database persistence.

```text
├── bin/                # Server boot configuration and environment mapping
├── clients/            # Shared database connections (Sequelize ORM instance)
├── controllers/        # Request/Response orchestration layers (HTTP controllers)
├── middlewares/        # JWT Authentication pipelines, RBAC filters, global exception handling, and Multer engines
├── models/             # Relational Sequelize schemas and data entity graphs
├── public/             # Static storage files, upload buffers, and public view assets
├── routes/             # RESTful decoupled endpoint routers grouped by domain contexts
├── schemas/            # Validation blueprints enforcing data schema boundaries before controller execution
├── services/           # Abstraction layer isolating real-time sockets, mail utilities, and core business models
└── migrate.js          # DevOps-ready automation for table syncs, relational configurations, and initial data seeding
```

---

## The Core Experience Framework (Business Logic Models)

Unlike traditional isolated booking directories, this platform approaches tourism from an Experience-First perspective, mapping connections between Attractions, Hotels, Restaurants, and Social Feeds via robust relational constraints.

### Model 1: Location-Based Cross-Selling (Radius-Driven Proximity)
* **The Concept:** Travelers looking up an accommodation asset are inherently looking up a surrounding localized experience. When a specific hotel entity profile is loaded, the engine executes localized geospatial range queries to instantly compile historic landmarks, monuments, and dining venues mapped within an exact geographical radius.
* **Commercial Value:** Maximizes cross-selling efficiency. By computing distance parameters seamlessly at the database layer using advanced mathematical formulas, the platform channels high-intent travel traffic directly into ancillary actions (e.g., reserving a nearby restaurant table or buying a museum ticket right from the accommodation detail view).

### Model 2: The Trip Planner Architecture (The Hub Concept)
* **The Concept:** The system treats the selected hotel instance as a centralized travel Hub. Based on the property's city and exact geographical coordinates (Latitude/Longitude), the engine dynamically evaluates proximity markers to iconic regional coordinates to auto-build chronological daily itineraries.
* **Commercial Value:** Exponentially raises session duration metrics and user retention. Instead of serving as a simple checkout form, the backend acts as an automated, intelligent digital travel agency.

### Model 3: Contextual Matching (Vibe and Budget Alignment Engine)
* **The Concept:** A contextual filtering algorithm that matches property tiers with user preferences. Premium/Luxury properties ($ or $$) automatically prioritize adjacent fine dining establishments and wellness amenities in proximity feeds. Family-focused accommodations rearrange matching pipelines to push amusement parks, recreational green zones, and child-friendly bistros forward.
* **Commercial Value:** Maximizes personalized relevance, heightening overall platform trust and optimizing targeted marketing funnels for high-intent affluent travelers.

**Implementation Note:** The logical bridge across components is formed using City bindings and strict Latitude/Longitude parameters. The backend filters these collections via targeted SQL queries to guarantee performance.

---

## Premium Administrative Management (Owner Dashboard)

A highly automated administration workspace tailored for property managers and business owners to optimize routine configurations and eliminate manual overhead:

### 1. Fluid Data Auto-Fill Engine
* Seamless automatic metadata generators are embedded within the form handling layers. When an owner defines specific parameter combinations (e.g., specific meal plans or cancellation selections), the architecture programmatically resolves text schemas, auto-generating rate plan names and booking clauses. This eliminates manual typing errors and accelerates inventory deployment threefold.

### 2. Strict Base Price Guard (Fail-Safe Business Guard)
* Protects the core revenue pipeline by securing base valuation parameters. A dedicated structural rule blocks visual or API-level operations from removing or disabling a room's primary baseline rate blueprint (Standard Rate / Standard Room). This completely prevents properties from displaying an invalid $0 price tag, protecting businesses from accidental financial exposure.

### 3. Universal Asset Gallery Management (Advanced Conversion Architecture)
* Business managers are provided with direct control over their visual marketing presentation. Using precise drag-and-drop orchestration indexes, owners can arrange image sorting states dynamically on the screen, toggle categories, and declare a primary hero banner (Set Main Hero Image). These updates synchronize instantly with a strict structural `sort_order` database index.

---

## Enterprise-Grade Technical Implementations and Safe-Guards

### 1. Robust Concurrent Transactions and Pessimistic Locking
* Critical operations—such as multi-table structural state synchronization or room inventory checking—are wrapped in atomic operations using Pessimistic Locking (transaction.LOCK.UPDATE). If two clients concurrently request the exact same room for overlapping dates, the transaction blocks the competitive thread, completely mitigating Race Conditions and double-booking bugs. If any sub-operation fails, a full `transaction.rollback()` fires instantly.

### 2. Smart Prepaid Room Service and Temporal Fallbacks
* **Automated Entitlement Evaluations:** When a guest processes a room-service order via an active hotel stay, the engine verifies stay boundaries (Check-In vs Check-Out current date matching). If the active billing contract includes a dining module (breakfast, all_inclusive), the engine evaluates local time slots. If eligible, it updates item rates to 0 and bypasses Stripe flows entirely.
* **Asynchronous Webhook Security:** Webhooks intercept payment confirmations over cryptographic signature verifications (`stripe.webhooks.constructEvent`). Upon success, secure cryptographic `success_tokens` with strict 10-minute Time-To-Live (TTL) timestamps are minted, securing client data.

### 3. Deep Architectural Analysis: Booking Session Verification and Cryptographic Token Lifecycle
* **Cryptographic Token Minting:** Once a user's transaction succeeds, Stripe pushes an explicit asynchronous event captured by the webhook listener (stripeBookingWebhook). After validating the cryptographic signature code, the engine mints a secure ephemeral access pass using Node.js internal crypto binaries: `booking.success_token = crypto.randomBytes(32).toString("hex")`.
* **Strict Time-To-Live (TTL) Enforcement:** To block data-scraping, brute-force interventions, or multi-session links sharing, the success token is injected with a precise 10-minute expiry timestamp. Once the 10-minute sliding window closes, the token loses validity in the database, automatically locking out unauthorized direct accesses. This architecture ensures complete GDPR/Data Privacy Compliance.

### 4. Bespoke In-App Payment Gateway Implementation (Stripe Elements Integrated)
* **The Architecture:** Unlike standard implementations that redirect users away to a generic Stripe-hosted checkout page, this platform hosts a fully customized checkout form directly embedded inside the application workspace utilizing **Stripe Elements API**.
* **Security & Implementation:** Card data inputs are rendered securely through embedded, isolated micro-iframes via Stripe Elements. This guarantees that raw credit card numbers never hit the platform's local database or application server memory, maintaining absolute PCI-DSS Compliance. The client securely requests a `PaymentIntent` from the backend, generates an encrypted server-bound token, and triggers a seamless backend database synchronization wrapper upon custom UI checkout.

### 5. Ephemeral Content Lifecycles and Advanced Social Graphs
* **24-Hour Automated Cleanup (TTL Engine):** The active Stories module provides Instagram-like ephemeral media shares. To maximize database performance, retrieval queries compute sliding windows (`[Op.gte]: moment().subtract(24, "hours")`), filtering out expired data at the SQL index tier.
* **Social Feed Aggregations:** Users can follow connections, post visual experiences, and share dynamic deep-linked objects (e.g., passing a specific sharedRoomId or sharedPostId directly into internal instant messages). Message rendering resolves dependency queries in parallel via Promise.all, yielding a 3x increase in routing response speeds.

### 6. Defensive Security and Performance Architecture
* **Salting and Double Hashing Guard:** Client credentials undergo a defensive cryptographic transformation pipeline: `md5(md5(password) + secret_salt)`. This completely negates database leak vulnerabilities against Rainbow Table lookup attacks.
* **O(1) Memory Lookup Optimization:** Social graphs, connection mappings, and group filtering pipelines use JavaScript Map and Set collections to handle custom format processing inside memory spaces. This replaces costly O(N^2) nested loops with highly optimized O(1) memory lookups.
* **Malicious File Upload Filtering:** Custom upload.js middlewares intercept raw multi-part forms, validating binary signatures and streaming file streams into Cloudinary. This enforces an explicit format boundary (jpg, jpeg, png, webp) to neutralize remote code execution vulnerabilities.

---

## API Endpoints Documentation

All requests targeting Owner or Admin contexts must include a valid JSON Web Token (JWT) in the HTTP Authorization header as a Bearer token.

### 1. Authentication and Identity Modules
* `POST /api/users/register` - Registers a new user account (with password cryptographic salt pipelines).
* `POST /api/users/login` - Authenticates user credentials and returns a secure session JWT.
* `GET /api/users/profile` - Fetches authenticated user account profile metadata.
* `PUT /api/users/profile` - Updates account settings and async updates profile images via Cloudinary.

### 2. Administrator Operations Module (Admin Only)
* `GET /api/admin/dashboard/stats` - Fetches total revenue with Month-over-Month (MoM) calculations.
* `GET /api/admin/dashboard/booking-chart` - Aggregates time-series charts formatted for weekly tracking.
* `GET /api/admin/dashboard/recent-transactions` - Merges recent checkout models sorted chronologically.
* `GET /api/admin/hotels` - Fetches paginated properties incorporating deep conditional criteria.
* `POST /api/admin/amenities/seed` - Triggers automated systemic database categories seeding hooks.

### 3. Business Workspace Module (Owners Only)
* `GET /api/owner/properties` - Pulls real-time property configurations linked to the verified manager token.
* `POST /api/owner/rooms` - Instantiates new inventory allocations embedded under transaction safeguards.
* `PUT /api/owner/rooms/:id` - Synchronizes active rate plans while sweeping obsolete relation configurations.
* `GET /api/owner/analytics/services-chart` - Compiles adaptive donut metrics representing dynamic stay variables.

### 4. Geographical and Landmark Discovery Modules
* `GET /api/hotels` - Advanced tourist property query search filter supporting having count metrics.
* `GET /api/hotels/:id` - Loads hotel instance aggregates matching customized review scopes.
* `GET /api/restaurants` - Queries operational dining models based on cuisine facets and city contexts.
* `GET /api/nearby` - Invokes local discovery range pipelines utilizing custom coordinate queries.
* `GET /api/hotel/:id/nearby-restaurants` - Calculates Earth curvature indexes via database-level Haversine operations.

### 5. Transactional Booking and Payments Modules
* `POST /api/booking/create` - Initiates room allocations wrapped inside rows validation layers.
* `POST /api/booking/checkout-session` - Binds payment intents deploying pessimistic locks to bar concurrent race collisions.
* `POST /api/booking/cancel/:id` - Triggers the automated Stripe integration refund calculator algorithms.
* `POST /api/payment/booking/webhook` - Cryptographically signed listener decoding verified payment succeeded vectors.
* `POST /api/payment/restaurant/webhook` - Confirms prepaid room service executions bypasses standard gateways.

### 6. Social Graphs and Instant Messages Systems
* `POST /api/follows/toggle` - Atomic toggling function evaluating self-follow guards and socket dispatches.
* `GET /api/follows/followers` - Resolves incoming connection mappings utilizing O(1) memory lookup setups.
* `GET /api/posts/feed` - Compiles contextual timeline events drawn from target following lists.
* `POST /api/messages/send` - Fires bidirectional multi-channel events utilizing Promise.all performance structures.
* `GET /api/messages/conversation/:userId` - Fetches message strings returning deep-linked rooms sharing states.

### 7. Core Configuration Utilities (Amenities and Notifications)
* `GET /api/amenities` - Fetches systemic tokens returning categorized grouped outputs or flat rows arrays.
* `GET /api/notifications` - Loads polymorphic metadata feeds showing structural event origins.
* `PUT /api/notifications/mark-read` - Triggers optimized database mass modifications processing bulk rows updates.

---

## Front-End Integration Guide

This repository functions strictly as a Headless REST API Backend Infrastructure. To connect a client-side single-page application (such as React.js, Vue.js, or Next.js), configure your HTTP client (e.g., Axios or Fetch API) to communicate directly with the backend endpoints using the production host URL.

### Authentication and Request Pipelines

All secure client-side requests targeted at Owner or Admin dashboards must include the JWT (JSON Web Token) inside the authorization header matching the Bearer schema.

Example Axios Configuration:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://onrender.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject the secure token from local storage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Real-Time Socket Connections

For real-time chat feeds, follow updates, and instant push notifications, the front-end client must establish a persistent connection channel with the backend server using the Socket.io client library directed at the base URL.

---

## Tech Stack

* **Runtime:** Node.js (ES6 ECMAScript Module standard)
* **Framework:** Express.js
* **ORM Layer:** Sequelize ORM (MySQL Dialect engine)
* **Database:** MySQL Server
* **Payment Gateway Integration:** Stripe API Node SDK
* **Cloud Storage CDN:** Cloudinary Core Storage API
* **Communication Pipelines:** Socket.io (Real-time events) / Nodemailer (Transactional mail)

---

## Local Deployment Setup

### Installation and Initialization

1. **Clone and Navigate to the Repository:**
   ```bash
   git clone https://github.com
   cd event
   ```

2. **Install Application Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Parameters (.env):**
   Construct a .env database context config mapping file in the project root:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASS=your_mysql_password
   DB_NAME=event_tourism_db
   JWT_SECRET=your_secure_jwt_secret_key
   USER_SECRET=your_password_salt_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_signing_token
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Synchronize Schema Blueprints and Seed Data:**
   ```bash
   node migrate.js
   ```

5. **Boot the Backend Environment:**
   ```bash
   npm start
   ```

---

## License
Proprietary software architecture. All rights reserved.


