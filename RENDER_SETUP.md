# Render Deployment Setup Guide

## Problem: Why Render Wasn't Working

1. **Missing `DATABASE_URL`** — Render needs the MongoDB connection string as an environment variable.
2. **No Prisma generation** — The Prisma client must be generated before the app starts.
3. **Cross-platform script issues** — Windows-only commands (`xcopy`) fail on Render's Linux environment.
4. **Missing `render.yaml`** — Render didn't know the exact build & start commands.

---

## Solution: Environment Setup on Render

### Step 1: Set Environment Variables on Render Dashboard

Go to your Render service settings and add these environment variables:

| Variable       | Value                                                                                | Description                    |
| -------------- | ------------------------------------------------------------------------------------ | ------------------------------ |
| `DATABASE_URL` | `mongodb+srv://user:password@cluster.mongodb.net/super8?retryWrites=true&w=majority` | Your MongoDB connection string |
| `JWT_SECRET`   | `super8-secret-very-strong` (or change to your own)                                  | Secret key for JWT tokens      |
| `NODE_ENV`     | `production`                                                                         | Environment mode               |

**How to add them:**

1. Go to Render dashboard → your service → **Environment**
2. Click **"Add Environment Variable"**
3. Enter the key and value, then save

### Step 2: Verify Build & Start Commands on Render

Your Render service should have these settings:

- **Build Command:** `cd backend && npm install && npm run build`
- **Start Command:** `cd backend && npm start`
- **Root Directory:** `.` (root of the repo, not `backend/`)

(The `render.yaml` file in the repo root should auto-configure these, but double-check in the dashboard.)

### Step 3: Redeploy

Once you've:

1. ✅ Set the environment variables
2. ✅ Pushed the latest code (with our fixes)

Trigger a manual redeploy in Render or push a new commit to main.

---

## Local Development

### Run Backend + Frontend

**Terminal 1: Backend (port 3000)**

```bash
cd backend
npm install
npm start
```

**Terminal 2: Frontend (port 5173)**

```bash
cd frontend
npm install
npm run dev
```

By default, frontend on localhost will call localhost backend. To override:

```bash
# In frontend/.env:
VITE_API_URL=http://localhost:3000
```

### Test API Endpoints Locally

```bash
# Register a user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"123456"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'

# List Super8 tournaments (requires token from login)
curl http://localhost:3000/super8 \
  -H "Authorization: Bearer <TOKEN_FROM_LOGIN>"
```

---

## Troubleshooting

### "Cannot GET /" on Render

- **Cause:** App crashed or DATABASE_URL not set.
- **Fix:** Check Render logs (dashboard → Logs tab). Ensure `DATABASE_URL` is set.

### "connect ECONNREFUSED" or database errors

- **Cause:** `DATABASE_URL` is wrong or MongoDB isn't reachable.
- **Fix:** Verify the connection string on MongoDB Atlas and in Render env vars.

### "Module not found: ./generated/prisma"

- **Cause:** Prisma client wasn't generated.
- **Fix:** Ensure `npm run build` runs during the build phase (it calls `prisma generate`).

### CORS errors when frontend calls backend

- **Cause:** Frontend domain not allowed by CORS.
- **Fix:** Backend has `app.use(cors())` which allows all origins. If you want to restrict, update `server.js`:
  ```javascript
  app.use(
    cors({
      origin: ["https://super8-1.onrender.com", "http://localhost:5173"],
    })
  );
  ```

---

## Files Changed

- `backend/package.json` — Added `postinstall` and `build` scripts to ensure Prisma generates.
- `backend/.env.example` — Template for required environment variables.
- `render.yaml` — Explicit build and start commands for Render.
- `.gitignore` — Excludes `.env` (secrets) but includes generated files.
- `backend/server.js` — Uses `process.env.PORT` and serves static frontend if available.

---

## Next Steps

1. **Commit and push:**

   ```bash
   git add .
   git commit -m "Fix Render deployment: add env vars, Prisma generation, cross-platform scripts, render.yaml"
   git push
   ```

2. **Redeploy on Render:**

   - Dashboard → Manual Deploy, or
   - Push to main and auto-redeploy triggers

3. **Test:** Visit `https://super8-1.onrender.com/` and confirm you see "API is running...".

---

## MongoDB Atlas Quick Setup (if you don't have a connection string yet)

1. Go to [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database)
2. Create a free cluster
3. Create a database user with a password
4. Click **Connect** → **Drivers** → copy the connection string
5. Replace `<password>` and `<dbname>` placeholders
6. Add to Render env vars as `DATABASE_URL`
