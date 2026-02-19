# 🚀 Complete Deployment Guide - How to Run Your System

## Overview
Your PAE Account Multiagent System has two main parts:
1. **Backend** - FastAPI server running on port 8000
2. **Frontend** - TypeScript/Next.js app running on port 3000

Both must run simultaneously in separate terminals.

---

## System Architecture

```
Your Computer
├── Backend (FastAPI) → http://localhost:8000
│   ├── Python process running
│   ├── Listening on port 8000
│   ├── API endpoints at /api/v1/*
│   └── CORS enabled for frontend
│
└── Frontend (Next.js/TypeScript) → http://localhost:3000
    ├── Node.js process running
    ├── Listening on port 3000
    ├── Makes requests to backend via axios
    └── Displays UI in browser
```

---

## Method 1: Using the Automatic Deployment Script (Easiest)

### **On Windows (PowerShell):**

```powershell
# 1. Navigate to project root
cd C:\Users\Jhon\Documents\GitHub\Proyecto

# 2. Run the deployment script
.\deploy-local.ps1
```

**What the script does:**
- ✅ Validates Python is installed
- ✅ Creates Python virtual environment (if needed)
- ✅ Installs dependencies
- ✅ Creates .env files
- ✅ Starts backend in a new PowerShell window
- ✅ Starts frontend in another window
- ✅ Shows you all available URLs

**Expected output:**
```
===============================================
PAE Account Multiagent System - Local Deployment
===============================================

📍 Available URLs:
  • Backend:    http://localhost:8000
  • Docs API:   http://localhost:8000/docs
  • Frontend:   http://localhost:3000
```

Two new windows should appear:
- **Window 1:** Backend logs (FastAPI server starting)
- **Window 2:** Frontend logs (npm dev server starting)

---

### **On Linux/macOS (Bash):**

```bash
# 1. Navigate to project root
cd /path/to/Proyecto

# 2. Make script executable
chmod +x deploy-local.sh

# 3. Run the deployment script
./deploy-local.sh
```

**What happens:**
- Both services start in the background
- Returns PIDs so you can stop them later
- Shows you log file locations

---

## Method 2: Manual Deployment (Learn How It Works)

### **Step 1: Start the Backend**

```powershell
# 1. Navigate to backend folder
cd C:\Users\Jhon\Documents\GitHub\Proyecto\backend_pae_account_multiagent_system

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1
# You should see: (venv) before your prompt

# 3. Start the server
python main.py
```

**What you should see:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

✅ **Backend is now running!** Keep this window open.

**How to verify it's working:**
```powershell
# Open ANOTHER terminal and run:
Invoke-WebRequest http://localhost:8000/health | ConvertTo-Json
# You should see: {"status": "healthy"}
```

---

### **Step 2: Configure and Start the Frontend**

**In a NEW terminal/PowerShell window:**

```powershell
# 1. Navigate to frontend folder
cd C:\Users\Jhon\Documents\GitHub\Proyecto\frontend_pae_account_multiagent_system

# 2. Check if package.json exists
ls package.json
# If it doesn't exist, you need to create it first (see below)

# 3. Install dependencies
npm install
# This downloads all required packages

# 4. Start the development server
npm run dev
```

**What you should see:**
```
> next dev

  ▲ Next.js 15.1.3

  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 1234ms
```

✅ **Frontend is now running!** 

---

## Important: Creating package.json (If It Doesn't Exist)

If your frontend folder doesn't have `package.json`, you need to create it first:

### **Option A: For Next.js Frontend**
```bash
# From inside frontend_pae_account_multiagent_system folder
npm create next-app@latest . --typescript --tailwind --eslint
```

### **Option B: For Vite Frontend**
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install axios
```

### **Option C: Minimal Setup**
```bash
npm init -y
npm install axios next react react-dom
```

---

## Step 3: Verify Everything is Connected

### **Test 1: Check Backend Health (in PowerShell)**
```powershell
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### **Test 2: Check API Documentation**
Open in your browser:
```
http://localhost:8000/docs
```
You should see the **Swagger UI** with all available endpoints.

### **Test 3: Check Frontend is Accessible**
Open in your browser:
```
http://localhost:3000
```
You should see your frontend application.

### **Test 4: Check CORS is Working**
Open browser DevTools (F12) → Console, then run:
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(d => console.log('Backend says:', d))
```

You should see:
```
Backend says: {status: "healthy"}
```

If you see CORS errors, make sure `CORS middleware` is in `backend/main.py`.

---

## Understanding the Terminal Windows

### **Backend Terminal** (Port 8000)
Shows:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Uvicorn running with 4 worker processes
...
INFO:     GET /health - Returned 200 OK
INFO:     POST /api/v1/ingest/upload - Returned 200 OK
```

**This tells you:**
- ✅ Backend is listening
- ✅ Requests are coming in
- ✅ Routes are responding

**If you see errors:**
- Port already in use → Kill process on port 8000
- Import error → Dependencies not installed properly
- Syntax error → Check main.py for typos

### **Frontend Terminal** (Port 3000)
Shows:
```
▲ Next.js 15.1.3
- Local:        http://localhost:3000
✓ Ready in 1200ms
```

**This tells you:**
- ✅ Frontend server is ready
- ✅ You can access http://localhost:3000

**If you see errors:**
- Module not found → Run `npm install`
- Port already in use → Another app is on 3000
- Build error → Check for syntax errors in .tsx files

---

## Complete Workflow Example

### **Scenario: You want to test an API endpoint**

1. **Backend running?** Check: http://localhost:8000/health
2. **Frontend running?** Check: http://localhost:3000 loads
3. **Try the API in Swagger UI:**
   - Go to http://localhost:8000/docs
   - Click on an endpoint (e.g., `/api/v1/ingest/upload`)
   - Click "Try it out"
   - Upload a test PDF
   - Click "Execute"
4. **See response** in the response section

---

## Stopping the Services

### **Stop Backend (while in backend terminal)**
```
Press: Ctrl + C
```

### **Stop Frontend (while in frontend terminal)**
```
Press: Ctrl + C
```

### **Kill all Node processes (if stuck)**
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### **Kill all Python processes (if stuck)**
```powershell
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## Environment Files Explained

### **Backend .env** 
Location: `backend_pae_account_multiagent_system/.env`

```env
PORT=8000              # Port the backend listens on
HOST=0.0.0.0           # Accept connections from any IP
API_V1_STR=/api/v1     # API version prefix for routes
GEMINI_API_KEY=xxx     # Your AI API key (for PDF processing)
```

### **Frontend .env.local**
Location: `frontend_pae_account_multiagent_system/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
# Tells frontend where to find the backend
```

---

## Troubleshooting Common Issues

### **Issue: "Port 8000 already in use"**
```powershell
# Find what's using port 8000
Get-NetTCPConnection -LocalPort 8000

# Kill that process (replace NNNN with PID)
Stop-Process -Id NNNN -Force

# Try starting backend again
python main.py
```

### **Issue: "npm: command not found"**
```
Solution: Install Node.js from https://nodejs.org/
```

### **Issue: "python: command not found"**
```
Solution: Install Python from https://python.org/
Make sure "Add Python to PATH" is checked
```

### **Issue: Frontend can't find backend (CORS error)**
```
1. Check backend is running: http://localhost:8000/health
2. Check .env.local has: NEXT_PUBLIC_API_URL=http://localhost:8000
3. Check main.py has CORSMiddleware configured
4. Restart frontend: npm run dev
```

### **Issue: "Module not found" error in frontend**
```powershell
# You're in frontend folder
cd frontend_pae_account_multiagent_system

# Reinstall all dependencies
npm install

# Then start
npm run dev
```

---

## Monitoring Your Deployment

### **Check Both Services Status**

Create a simple check script (optional):

```powershell
# Check if backend is responding
$backend = try {
    Invoke-WebRequest http://localhost:8000/health -UseBasicParsing
    "✅ Backend OK"
} catch {
    "❌ Backend DOWN"
}

# Check if port 3000 is listening
$frontend = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue) -ne $null ?
"✅ Frontend Running" : "❌ Frontend NOT Running"

Write-Host $backend
Write-Host $frontend
```

---

## Performance: What to Expect

| Component | Startup Time | Memory | CPU |
|-----------|--------------|--------|-----|
| Backend | ~5 seconds | 150-200 MB | Low |
| Frontend | ~30 seconds | 100-150 MB | Low |
| Combined | ~40 seconds | 250-350 MB | Low |

---

## Next: Testing Your API

Once everything is running:

1. **Upload a PDF:**
   - Go to http://localhost:3000
   - Select a PDF file
   - Click upload
   - Watch backend logs for processing

2. **Generate Reports:**
   - Check balance sheet
   - Check P&L statement
   - Check cash flow

3. **Check Logs:**
   - Backend terminal shows API calls
   - Frontend console (DevTools) shows responses

---

## Quick Reference Commands

```powershell
# Start backend
cd backend_pae_account_multiagent_system
.\venv\Scripts\Activate.ps1
python main.py

# Start frontend (in another terminal)
cd frontend_pae_account_multiagent_system
npm install  # Only first time
npm run dev

# Check health
curl http://localhost:8000/health

# View API docs
# Open: http://localhost:8000/docs

# View frontend
# Open: http://localhost:3000

# Stop either service
Ctrl + C
```

---

## Summary

✅ **Everything Setup?**
- Backend: ✅ running on http://localhost:8000
- Frontend: ✅ configured and ready to start
- CORS: ✅ configured for local development
- Environment: ✅ files created

🎯 **Next Steps:**
1. Run the deployment script OR manually start both services
2. Open http://localhost:3000 in your browser
3. Test by uploading a PDF
4. Check the API docs at http://localhost:8000/docs

---

**You now understand how to deploy and run your entire system!** 🎉
