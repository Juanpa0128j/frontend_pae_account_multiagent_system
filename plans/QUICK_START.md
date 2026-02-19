# 🚀 Quick Start Guide - Backend + Frontend

## ⚡ Quick Start (Windows)

```powershell
# 1. Open PowerShell as administrator
# 2. Navigate to the project folder
# 3. Run:

.\deploy-local.ps1
```

The script automatically:
- ✅ Installs backend dependencies
- ✅ Creates Python virtual environment
- ✅ Starts backend server on port 8000
- ✅ Creates .env files if they don't exist
- ✅ Starts frontend server on port 3000

---

## ⚡ Quick Start (Linux/macOS)

```bash
# 1. In terminal, navigate to the project folder
# 2. Give execution permission to script:
chmod +x deploy-local.sh

# 3. Run:
./deploy-local.sh
```

---

## 📍 Available URLs

| Component | URL | Description |
|-----------|-----|-------------|
| **Backend** | `http://localhost:8000` | Main REST API |
| **API Docs** | `http://localhost:8000/docs` | Interactive documentation (Swagger) |
| **Frontend** | `http://localhost:3000` | Main application |
| **Health** | `http://localhost:8000/health` | Check backend status |

---

## ⚙️ Manual Configuration (if scripts don't work)

### Backend:
```bash
cd backend_pae_account_multiagent_system

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -e .
pip install fastapi-cors

# Start
python main.py
```

### Frontend:
```bash
cd frontend_pae_account_multiagent_system

# Install dependencies (if using npm)
npm install

# Or if using yarn
yarn install

# Start development server
npm run dev
# or
yarn dev
```

---

## 🔍 Connection Verification

### 1. Backend is running:
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### 2. CORS is configured:
Open DevTools (F12) in the browser → Console
- If no CORS errors, excellent! ✅
- If you see `CORS policy blocked` error, check main.py configuration

### 3. Frontend connects to backend:
From the interface, try uploading a test PDF
- Check Network tab in DevTools
- POST request should go to `http://localhost:8000/api/v1/ingest/upload`
- Status should be 200 or 400 (NOT 0 or connection error)

---

## 📋 Pre-requisite Checklist

- [ ] Python 3.11+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed (`npm --version` or `yarn --version`)
- [ ] Internet access (to download dependencies)
- [ ] GEMINI_API_KEY configured in `.env` (optional for initial tests)

---

## 🐛 Troubleshooting

### Error: "Port 8000 is already in use"
```bash
# Find what process uses port 8000:
# Windows:
netstat -ano | findstr :8000

# Linux/Mac:
lsof -i :8000

# Kill the process or change port in .env
```

### Error: "Cannot find module 'fastapi-cors'"
```bash
pip install fastapi-cors
```

### Error: "CORS policy: blocked by CORS policy"
1. Verify that `main.py` has `CORSMiddleware` imported and configured
2. Restart backend
3. Clear browser cache (Ctrl+Shift+Delete)

### Frontend can't connect to backend
1. Verify that `/.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:8000`
2. Restart frontend server
3. Check browser console (F12) for more details

---

## 📚 Complete Documentation

For detailed information, see:
- [REPORTE_INTEGRACION_BACKEND_FRONTEND.md](./REPORTE_INTEGRACION_BACKEND_FRONTEND.md)
- Backend: `backend_pae_account_multiagent_system/README.md`
- Frontend: `frontend_pae_account_multiagent_system/README.md`

---

## 🛑 Stop Servers

**Windows:**
- In each PowerShell window: `Ctrl + C`
- Then press `Y` to confirm

**Linux/macOS:**
```bash
# Stop backend
kill <PID>

# Or find by port:
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

---

**Questions?** Check the detailed report included in this project.
