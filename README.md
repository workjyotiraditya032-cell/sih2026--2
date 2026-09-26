# PackIntel — AI-Assisted Food Packaging Recommendation Platform

PackIntel is a production-ready, independently deployable decision-support platform that transforms food characteristics, storage parameters, and distribution conditions into **scientifically grounded, explainable packaging recommendations**.

---

## Production Architecture

```
User Browser
     │
     ▼
Vercel Frontend (React + TypeScript)
     │
     ▼ HTTPS REST API (CORS restricted)
Render Backend (FastAPI + Uvicorn)
     │
     ▼ MONGODB_URI (TLS encrypted)
MongoDB Atlas (Cloud Managed Database)
```

The frontend **never** connects directly to MongoDB. All data access, AI inference, and validation occur securely within the FastAPI backend on Render.

---

## Project Structure

```
PackIntel/
├── frontend/                     # React + TypeScript SPA (Vercel)
│   ├── src/
│   │   ├── components/           # UI components, layout, analysis panels
│   │   ├── pages/                # Analysis, Materials, History, Methodology
│   │   ├── services/api.ts       # Axios client using VITE_API_BASE_URL
│   │   └── types/                # TypeScript domain models & schemas
│   ├── public/                   # Public assets & HTML template
│   ├── package.json              # Clean frontend dependencies
│   ├── craco.config.js           # Webpack build & alias configuration
│   ├── vercel.json               # SPA routing rewrite rules for Vercel
│   └── .env.example              # VITE_API_BASE_URL=
│
├── backend/                      # Python FastAPI API (Render)
│   ├── app/
│   │   ├── main.py               # Application entrypoint & CORS middleware
│   │   ├── server.py             # Uvicorn 0.0.0.0:$PORT runner
│   │   ├── db/
│   │   │   └── mongodb.py        # Reusable MongoDB Atlas connection manager & GridFS
│   │   ├── repositories/         # MongoDB Atlas data repositories
│   │   ├── services/             # Recommendation, food intelligence & AIProvider
│   │   ├── models/               # Domain models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── recommendation/       # Deterministic rule & weighted scoring engine
│   │   └── api/routes/           # REST endpoints
│   ├── scripts/
│   │   └── seed_database.py      # Idempotent MongoDB Atlas seed script
│   ├── requirements.txt          # Python dependencies
│   ├── render.yaml               # Render Infrastructure-as-Code blueprint
│   └── .env.example              # Backend environment template
│
├── render.yaml                   # Root Render blueprint
├── .gitignore                    # Secrets & build artifact protection
├── .env.example                  # Root environment reference
└── README.md
```

---

## Deployment & Setup Guide

### A. MongoDB Atlas Setup

1. Log into your [MongoDB Atlas](https://cloud.mongodb.com/) account.
2. Create a free shared cluster (M0) or dedicated production cluster.
3. Under **Database Access**, create a database user with read/write privileges (e.g. `packintel_user`) and a secure password.
4. Under **Network Access**, add the IP addresses of your Render backend services or allow access from anywhere (`0.0.0.0/0`) since Render uses dynamic outbound IPs.
5. In your Cluster Overview, click **Connect** → **Drivers** → **Python** and copy your connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
6. Set the database name to `packintel`.

### B. Environment Variables Reference

#### Backend (`backend/.env` / Render Environment Variables)
| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | Yes | MongoDB database name | `packintel` |
| `FRONTEND_URL` | Yes | Vercel production frontend URL for CORS | `https://your-app.vercel.app` |
| `PORT` | Auto | Port for backend server (Render sets this) | `10000` |
| `AI_PROVIDER` | No | AI Provider (`groq`, `openai`, `gemini`, `none`) | `groq` |
| `AI_API_KEY` | No | Provider API key (backend-only) | `gsk_...` or `sk-...` |
| `AI_MODEL` | No | LLM model name | `openai/gpt-oss-120b` or `gpt-4o-mini` |
| `AI_VISION_MODEL` | No | Vision model for food image detection | `qwen/qwen3.8-27b` |

#### Frontend (`frontend/.env` / Vercel Environment Variables)
| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Yes | Render backend API base URL | `https://packintel-backend.onrender.com` |

---

### C. Database Seeding

Run the seed script to initialize MongoDB collections and realistic packaging/commodity reference data:

```bash
cd backend
python scripts/seed_database.py
```

The script is **idempotent** (safe to run multiple times without creating duplicate records) and inserts:
- 15 realistic packaging materials (LDPE, HDPE, PET, PP, BOPP, Metallized Films, Aluminum Foil Laminate, Paper-Based, Biodegradable Films, Compostable Films, Breathable Films, Micro-Perforated Films, High-Barrier Laminates, PP Cups, HDPE Bottles)
- 14 food commodities with typical moisture, oil content, pH, respiration, and sensitivity properties
- 24 food intelligence grounding profiles
- Collection indexes on `id`, `material_name`, `commodity_name`, `created_at`

---

### D. Render Backend Deployment

1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), click **New** → **Blueprint** and select your repository, OR click **New Web Service**:
   - **Environment**: Python
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. In **Environment Variables**, configure:
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `MONGODB_DB_NAME`: `packintel`
   - `FRONTEND_URL`: `https://your-packintel.vercel.app`
   - `AI_PROVIDER`: `groq` (or `openai` / `gemini` / `none`)
   - `AI_API_KEY`: Your AI API key
4. Deploy the service. Once deployed, test the health check:
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "api": "online",
     "version": "1.0.0",
     "database": {
       "engine": "MongoDB Atlas",
       "connected": true,
       "detail": "Connected"
     },
     "data_source": "mongodb"
   }
   ```

---

### E. Vercel Frontend Deployment

1. In [Vercel Dashboard](https://vercel.com/), click **Add New** → **Project** and import your repository.
2. Set the **Root Directory** to `frontend`.
3. Framework Preset: **Create React App**.
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com`
5. Click **Deploy**. Vercel will automatically build the React application with `vercel.json` routing rules enabled.

---

### F. Local Development

#### 1. Backend Local Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your MONGODB_URI
python server.py          # Runs on http://0.0.0.0:8000
```
Interactive OpenAPI documentation: `http://localhost:8000/api/docs`

#### 2. Frontend Local Setup
```bash
cd frontend
yarn install
cp .env.example .env
# Set: VITE_API_BASE_URL=http://localhost:8000
yarn start               # Opens http://localhost:3000
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check verifying API and MongoDB Atlas connectivity |
| `GET` | `/api/materials` | List packaging materials (aliases: `/api/packaging-materials`) |
| `GET` | `/api/materials/{id}` | Material details (aliases: `/api/packaging-materials/{id}`) |
| `GET` | `/api/commodities` | List food commodities reference data |
| `POST` | `/api/recommend` | Generate packaging recommendation (aliases: `/api/recommendations`) |
| `GET` | `/api/analyses` | Search past recommendation history (aliases: `/api/recommendations/history`) |
| `GET` | `/api/analyses/{id}` | Reopen a saved analysis snapshot (aliases: `/api/recommendations/{id}`) |
| `POST` | `/api/analyze-food` | Food intelligence identification and KB grounding |
| `POST` | `/api/feedback` | Store user rating and qualitative feedback |
| `GET` | `/api/engine/config` | Scoring weights and algorithm configuration metadata |

---

## Recommendation Engine & AI Architecture

1. **Deterministic Primary Engine**: The core recommendation algorithm evaluates Oxygen Transmission Rate (OTR), Water Vapor Transmission Rate (WVTR), thickness, mechanical strength, seal integrity, and storage compatibility deterministically. It operates fully without an external LLM.
2. **Provider-Independent AI (`AIProvider`)**: An abstraction layer in `backend/app/services/ai_provider.py` supports Groq, OpenAI, and Gemini for qualitative explanation, synthesis, and vision-assisted food identification.
3. **Graceful Degradation**: If an AI provider key is not configured or an upstream service experiences downtime, the system automatically falls back to curated knowledge-base explanations without failing the user's request.

---

## Security Notes

1. **Zero Secret Leakage**: Database connection strings, API keys, and internal credentials exist strictly in backend environment variables and are never bundled into the client build.
2. **CORS Enforcement**: The backend restricts origins strictly to `FRONTEND_URL` in production; wildcard origins (`*`) are disallowed.
3. **Credential Rotation**: Any API keys or credentials previously committed in past repository revisions should be regenerated immediately.
4. **Input Sanitization**: Request payloads are validated through Pydantic schemas with length and character-set constraints.
