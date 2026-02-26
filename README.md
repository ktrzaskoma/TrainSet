# Trainset

**Trainset** is a full-stack web application for managing train schedules and passenger services of the Warsaw Commuter Railway (*pl. Warszawska Kolej Dojazdowa*). It is compliant with the [GTFS (General Transit Feed Specification)](https://gtfs.org/) standard and built on a microservices architecture.

---

## Features

- **Schedule search** — search connections by departure/arrival station and date, browse earlier/later trains
- **Intermediate stops** — view all stops along a route with arrival and departure times
- **Real-time disruptions** — display delays (with reason and duration) and cancellations with visual indicators
- **User authentication** — registration with strong password policy, login, and profile management
- **Ticket purchasing** — buy tickets for selected connections, view purchase history
- **Email notifications** — automated emails for ticket purchases, cancellations, and delay alerts
- **Admin panel** — manage delays and cancellations, import GTFS data

---

## Architecture

The application is composed of 7 Docker containers communicating over an internal bridge network.

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (Browser)                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP
                        ┌───────▼────────┐
                        │    Frontend    │  React + Nginx
                        │   Port: 3000   │
                        └───────┬────────┘
                                │ HTTP
                        ┌───────▼────────┐
                        │    Gateway     │  Spring Cloud Gateway
                        │   Port: 8080   │
                        └──┬──┬──┬──┬───┘
               ┌───────────┘  │  │  └───────────┐
               │              │  │               │
       ┌───────▼──────┐  ┌────▼──▼───┐  ┌───────▼──────┐
       │   Schedule   │  │   User    │  │  Ticketing   │
       │  Port: 8081  │  │ Port:8084 │  │  Port: 8082  │
       └──────┬───────┘  └─────┬─────┘  └──────┬───────┘
              │                │               │
              │       ┌────────▼───────┐       │
              │       │  Notification  │◄──────┘
              │       │   Port: 8083   │
              │       └───────┬────────┘
              │               │
       ┌──────▼───────────────▼──────┐
       │         PostgreSQL 16        │  Port: 5432
       │  trainset_schedule           │
       │  trainset_user               │
       │  trainset_ticketing          │
       │  trainset_notification       │
       └─────────────────────────────┘
```

Inter-service communication uses Spring Cloud OpenFeign HTTP clients:
- `user` → `notification`, `ticketing`
- `ticketing` → `schedule`, `notification`
- `notification` → `schedule`, `ticketing`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, React Router 7, Tailwind CSS, Axios |
| API Gateway | Spring Boot 3.4.6, Spring Cloud Gateway 2024.0.2 |
| Microservices | Java 21 (Amazon Corretto), Spring Boot 3.4.6, Spring Security, Spring Data JPA |
| Inter-service comms | Spring Cloud OpenFeign |
| Database | PostgreSQL 16 |
| Email | Spring Mail (Gmail SMTP) |
| GTFS parsing | OpenCSV 5.9 |
| Containerization | Docker, Docker Compose |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Git

### 1. Clone the repository

```bash
git clone <repository-url>
cd trainset
```

### 2. Configure environment variables

Navigate to the deployment directory and create a `.env` file:

```bash
cd deploy/trainset
cp .env.example .env   # or create .env manually
```

Edit `.env` with your values:

```env
POSTGRES_USER=trainset
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=postgres

PG_DB_USERNAME=trainset
PG_DB_PASSWORD=your_secure_password

MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your_gmail_app_password

SPRING_PROFILES_ACTIVE=prod
```

> **Note:** For `MAIL_PASSWORD`, use a [Gmail App Password](https://support.google.com/accounts/answer/185833), not your regular Gmail password.

### 3. Start all services

```bash
cd deploy/trainset
docker compose up --build
```

Docker Compose will start all services in the correct order using health checks. The startup sequence is:

```
PostgreSQL → microservices (parallel) → Gateway → Frontend
```

### 4. Access the application

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Schedule Service | http://localhost:8081 |
| Ticketing Service | http://localhost:8082 |
| Notification Service | http://localhost:8083 |
| User Service | http://localhost:8084 |

---

## Project Structure

```
trainset/
├── frontend/           # React SPA (TypeScript, Tailwind CSS)
├── gateway/            # Spring Cloud Gateway — routes all API traffic
├── schedule/           # Schedule service — GTFS data, delays, cancellations
├── user/               # User service — authentication, registration
├── ticketing/          # Ticketing service — ticket purchase and history
├── notification/       # Notification service — email alerts
├── deploy/
│   └── trainset/
│       ├── docker-compose.yaml
│       ├── .env                # Environment variables (not committed)
│       └── trainset_init.sql   # Database initialization script
└── diagram/            # PlantUML architecture and database diagrams
```

---

## Services

### Frontend
React SPA served by Nginx. Provides:
- Connection search with station autocomplete
- Delay/cancellation status indicators
- Protected routes with role-based access (user / admin)

### Gateway (`/gateway`)
Spring Cloud Gateway routing all external requests to the appropriate microservice. Handles CORS for the frontend.

### Schedule (`/schedule`)
Core GTFS-compliant service managing agencies, routes, stops, trips, and stop times. Handles delay and cancellation records. Supports GTFS CSV data imports.

### User (`/user`)
Authentication and user management. Enforces password policy (min. 8 characters, uppercase, lowercase, digit, special character). Integrates with the Notification and Ticketing services.

### Ticketing (`/ticketing`)
Manages ticket purchases and history. Validates trips against the Schedule service and triggers purchase confirmation emails via the Notification service.

### Notification (`/notification`)
Sends transactional emails (ticket purchase, cancellation, delay alerts). Stores notification history in its own database schema.

---

## Health Checks

All Spring Boot services expose a health endpoint via Spring Boot Actuator:

```
GET /actuator/health
```

Docker Compose uses these endpoints to determine readiness before starting dependent services.

---

## Database

A single PostgreSQL 16 instance hosts four separate schemas, one per microservice:

| Schema | Owner service |
|---|---|
| `trainset_schedule` | schedule |
| `trainset_user` | user |
| `trainset_ticketing` | ticketing |
| `trainset_notification` | notification |

Schema initialization is performed automatically on first startup via `trainset_init.sql`.


## Disclaimer

The TrainSet app is part of an engineering thesis.