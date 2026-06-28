# FraudGuard - Enterprise Credit Card Fraud Detection System

A production-ready, enterprise-grade SaaS-style full-stack web application designed to monitor, analyze, and predict credit card transaction fraud in real-time. It features a high-performance React 19 dashboard, a FastAPI backend service, secure JWT session management, SQLite storage, and an integrated CatBoost ML model.

---

## 🎨 Technology Stack

### Frontend
*   **Core**: React 19, TypeScript, Vite
*   **Routing**: React Router DOM (v6)
*   **Animations**: Framer Motion
*   **Styling**: Tailwind CSS (class-based Light/Dark Mode)
*   **State & Querying**: TanStack React Query (Axios client)
*   **Analytics Charts**: Recharts

### Backend
*   **Framework**: FastAPI, Uvicorn server
*   **Database ORM**: SQLAlchemy (SQLite backend database)
*   **Authentication**: JWT (python-jose, direct bcrypt hashing)
*   **ML Inference**: CatBoost, joblib, Scikit-Learn
*   **Diagnostics**: psutil (hardware memory / CPU stats)
*   **Reporting**: ReportLab (for PDF reports)

---

## ✨ Upgraded UI/UX & Features

1.  **Circular Risk Gauge**: Custom animated SVG risk gauge illustrating fraud probability severity (0-100) dynamically.
2.  **Explainable AI (XAI)**:
    *   Generates positive/negative vector metrics showing what features drove the ML model's decision.
    *   Horizontal bar charts displaying vector feature offsets.
    *   Human-readable model reasoning sentences.
3.  **Collapsible advanced features**: PCA vector fields (V1–V28) collapse cleanly to maintain a minimal form profile.
4.  **Batch Predictor (`/batch`)**: Drag and drop multi-row CSV files to batch-run predictions, trace real-time execution states, evaluate against dataset ground-truth labels, and download prediction output logs.
5.  **Interactive Analytics**: Graded Area charts mapping daily transaction histories and interactive Split Donut charts.
6.  **Slide-Out Audit Logs**: Review complete parameter arrays for any historical transaction in a slide-out drawer inside the history log page.
7.  **Profile Customization**: Control sensitivity metrics by adjusting the **Inference Threshold** slider (0.1 - 0.9) to calibrate False Negatives / False Positives.
8.  **Pulsing Health Telemetry**: Live Admin console metrics monitoring CPU usage, database status, loaded model versions, and a real-time running uptime clock.

---

## 📂 Project Structure

```text
credit-card-fraud-system/
├── backend/
│   ├── api/                   # API routers (auth, predictions, system stats)
│   ├── authentication/        # Password hashing and JWT generation
│   ├── config/                # App Settings (Pydantic-Settings)
│   ├── database/              # DB connection factory
│   ├── models/                # SQLAlchemy schemas
│   ├── services/              # ML predictor, PDF/CSV exporters
│   ├── ml_assets/             # CatBoost model and scaler binaries
│   ├── app.py                 # FastAPI application root
│   └── requirements.txt       # Backend dependencies
├── data/
│   └── creditcard.csv         # Raw transactions source dataset (class balanced)
├── frontend/
│   ├── src/
│   │   ├── components/        # Sidebar Layout, ProtectedRoute, Toast notifications, Skeletons
│   │   ├── pages/             # Dashboard, Predictor, Batch Upload, History Logs, Profile settings, Admin
│   │   ├── services/          # Axios API communication Client
│   │   ├── App.tsx            # Routes configuration
│   │   ├── main.tsx           # Entry boot script
│   │   └── index.css          # Tailwind, animations and typography styles
│   ├── package.json           # React dependencies
│   ├── tsconfig.json          # TypeScript configurations
│   ├── tailwind.config.js     # Tailwind setup
│   └── vite.config.ts         # Vite proxy setup
├── docker/
│   ├── backend.Dockerfile     # Uvicorn container
│   ├── frontend.Dockerfile    # Node build + Nginx compiled assets server
│   └── nginx.conf             # Nginx reverse proxy routing
├── docker-compose.yml         # Container orchestration
├── .env.example               # Environment variables template
└── README.md                  # Documentation
```

---

## 🚀 How to Run Locally

### 1. Run the Backend (FastAPI)
Run these commands from the **root directory** of the project to maintain proper python path mappings:
1.  Install dependencies:
    ```bash
    pip install -r backend/requirements.txt
    ```
2.  Launch the FastAPI server:
    ```bash
    python -m uvicorn backend.app:app --port 8000
    ```
    *   **API Docs**: Open `http://localhost:8000/docs` to test endpoint schemas via Swagger UI.

### 2. Run the Frontend (React)
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install packages:
    ```bash
    npm install --legacy-peer-deps
    ```
3.  Launch the Vite dev server:
    ```bash
    npm run dev
    ```
    *   **Interface**: Open `http://localhost:5173` to access the portal.

---

## 🐳 Docker Deployment (Single Command)

To containerize and launch the entire stack using Docker Compose:

1.  Make sure you have Docker and Docker Compose installed.
2.  Run the orchestration build command at the root directory:
    ```bash
    docker-compose up --build
    ```
3.  Open `http://localhost` in your browser. The Nginx reverse proxy routes UI traffic to Nginx and `/api` requests to the Uvicorn container.

---

## 🔒 Security Practices

1.  **JWT Authentication**: Implements Access (60-minute expiry) and Refresh (7-day expiry) tokens to manage sessions securely.
2.  **Bcrypt Hashing**: User credentials are encrypted using native bcrypt salts (bypasses passlib compatibility limitations).
3.  **Role-Based Access Control (RBAC)**: Endpoint route protections restrict admin console metrics `/admin/health` and logs `/admin/logs` strictly to accounts with the `Admin` role.
4.  **CORS & Input Validation**: Safe Pydantic schemas validate input vectors to block injection payloads.
Intern ID:CMPPJXZLO0
