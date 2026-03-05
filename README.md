# 🎯 PrashanBaan · IT UTSAV 4.0

> **The Arrow of Knowledge** — Real-time multiplayer quiz game show platform

Built with **Node.js + Socket.io + React + Vite + Tailwind CSS**

---

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env      # Set FRONTEND_URL if deploying
npm run dev               # → http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # Set VITE_SOCKET_URL if deploying
npm run dev               # → http://localhost:5173
```

### 3. Play
1. Open `localhost:5173` → **HOST ARENA** → enter name → **CREATE ARENA**
2. Share the 5-letter room code with players
3. Players open same URL → **JOIN BATTLE** → enter name + code
4. Host configures settings (timer, Round 1 vs Round 2)
5. Host clicks **⚡ LAUNCH ARENA**
6. Play!

---

## Game Modes

| Mode | Description |
|------|-------------|
| **Round 1 – Sequential** | Each player gets a question in turn. +10 for correct answer. |
| **Round 2 – Buzzer Blitz** | All questions go to global buzzer. +10 correct, **-5 wrong**. |

### State Machine
```
LOBBY → ACTIVE → LOCKED ──────────────────────────→ FINISHED
                    │                   ↑
                    └→ [TOSS-UP] → LOCKED → next_question
```

---

## Scoring

| Event | Points |
|-------|--------|
| Correct answer (Round 1) | +10 |
| Correct buzz answer | +10 |
| Wrong buzz answer | -5 (min score: 0) |

---

## Bug Fixes Applied (v2.0)

- ✅ `isActive` flag now correctly set on game start and every `next_question`
- ✅ `trigger_countdown` server handler added (countdown overlay now works)
- ✅ `set_custom_questions` server handler added (custom questions now load)
- ✅ StrictMode removed from `main.jsx` (fixed socket double-mount/disconnect)
- ✅ Score can't go below 0 on penalty
- ✅ Host actions validated (only host socket can start/next/tossup)
- ✅ Can't join a game already in progress

---

## Deploy

**Backend** → Railway / Render / Fly.io
```
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app
```

**Frontend** → Vercel / Netlify
```
VITE_SOCKET_URL=https://your-backend.railway.app
```
