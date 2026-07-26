# 🏋️‍♂️ FitTrack AI — The Ultimate Cinematic AI Fitness Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-orange?style=for-the-badge)](https://groq.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-Free_Vision-purple?style=for-the-badge)](https://openrouter.ai/)
[![Gemini API](https://img.shields.io/badge/Gemini-2.0_Flash-blue?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Vapi AI](https://img.shields.io/badge/Voice_AI-Vapi-red?style=for-the-badge)](https://vapi.ai/)

FitTrack AI is a premium, full-stack, AI-powered personal fitness and wellness ecosystem designed to deliver a cinematic user experience. Built with a futuristic dark-mode UI, rich micro-animations, real-time voice coaching, and computer vision-based nutrition scanning, FitTrack AI acts as a virtual, desi personal trainer and dietician right in your pocket.

🌐 **Live Website**: [fit-track-ai-three.vercel.app](https://fit-track-ai-three.vercel.app/)

---

## 🌟 Key Features & AI Innovations

### 🤖 1. Groq-Powered AI Coach & Workout Engine (`Llama 3.3 70B`)
* **Ultra-Fast Performance**: All text-based AI features run on Groq’s ultra-fast LPU inference engine (`llama-3.3-70b-versatile` with 14,400 requests/day limit), responding in under 0.3 seconds.
* **Automatic Failover Architecture**: If the primary 70B model reaches token limits, the backend silently fails over to `llama-3.1-8b-instant` (<0.2s latency) for zero service interruption.
* **Friendly Hinglish Persona**: The AI speaks in a warm, energetic, Hinglish coaching style (*"Bhai, aaj ka workout ready hai!"*).
* **Culturally Aware Nutrition & Workouts**: Tailors advice around Indian diets (paneer, besan chilla, sattu, dal, eggs) and custom workouts for home or gym setups.

### 🎙️ 2. Real-Time Voice Coach (Vapi AI)
* **Interactive Speech Assistant**: Powered by `@vapi-ai/web`, allowing users to talk directly to their fitness coach via natural speech on web and mobile devices.

### 🥦 3. AI Food Photo Scanner (OpenRouter Vision & Gemini Vision)
* **Dual Vision AI Pipeline**: Uses OpenRouter Free Vision (`google/gemma-4-26b-a4b-it:free`, `nvidia/nemotron-nano-12b-v2-vl:free`) with automatic 2-second retry and fallback to Google Gemini (`gemini-2.0-flash`).
* **Client-Side Canvas Compression**: Automatically resizes uploaded food photos to max 800px at 0.75 JPEG quality before transmission (reducing payload size from 10MB to ~150KB for **10x faster uploads**).
* **Interactive Portion Scaler & Editable Gram Input**: Allows users to select quick multipliers (`0.5x`, `1.0x`, `1.5x`, `2.0x`) or directly type custom gram weights (e.g. `250g`, `300g`, `500g`) with instant real-time recalculation of calories, carbs, protein, fat, fiber, and 8 micro-nutrients!

### 💧 4. AI Hydration Advisor & Profile Goal Calculator
* Calculates daily water intake targets based on body weight, climate, and exercise intensity.
* Mifflin-St Jeor TDEE formula calculations for personalized calorie targets (fat loss vs. muscle gain).

### 🛡️ 5. Unified Friendly Emoji Error Shield
* Built-in error classification (`aiErrorHelper.js`) catches rate limits, quota limits, per-minute throttles, and 503 traffic spikes.
* Shields users from raw API tracebacks by rendering friendly, emoji-rich notification toasts.

---

## 🛠️ Tech Stack

### Frontend (Next.js Client)
* **Framework**: React 19 / Next.js 15 (App Router, TypeScript)
* **Styling**: Tailwind CSS v4, custom glassmorphism components
* **Animations**: Framer Motion, HTML5 Canvas
* **State Management**: Zustand
* **Charts & Visuals**: Recharts, Lucide Icons
* **Real-Time Voice**: `@vapi-ai/web` SDK
* **Notifications**: React Hot Toast

### Backend (Express API Server)
* **Runtime**: Node.js & Express
* **Database**: MongoDB (Mongoose ODM) & `mongodb-memory-server` (In-memory DB fallback)
* **AI SDKs**: `groq-sdk`, OpenAI SDK (OpenRouter Vision), `@google/generative-ai`
* **Authentication**: JWT, bcryptjs
* **Security & Traffic**: Express Rate Limit, Helmet CORS configurations, Morgan logger

---

## 📁 Repository Structure

```text
├── cinematic-showcase/          # Next.js 15 Frontend Client
│   ├── public/                  # Static assets & favicon
│   └── src/
│       ├── app/                 # Next.js App Router (dashboard, coach, progress, login, etc.)
│       ├── components/          # React UI components
│       │   ├── charts/          # Progress graphs & Recharts visualizers
│       │   ├── dashboard/       # Stat cards & schedule rows
│       │   ├── layout/          # Topbar & Sidebar navigation
│       │   ├── nutrition/       # AI Food Photo Scanner & Portion Scaler
│       │   └── ui/              # Modal, Card, & Glassmorphism components
│       ├── lib/                 # Axios API configuration & utilities
│       └── store/               # Zustand state stores
│
├── server/                      # Node.js Express Backend Server
│   ├── controllers/             # Request handlers (aiController, workoutController, nutritionController, authController)
│   ├── middleware/              # JWT verification, rate limiter, error handling
│   ├── models/                  # Mongoose MongoDB schemas
│   ├── routes/                  # REST endpoints
│   ├── utils/                   # AI Error Helper & central utilities
│   └── server.js                # Server entry point
│
└── README.md                    # Project documentation
```

---

## ⚡ API Endpoints

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/register` - Create user profile
* `POST /api/auth/login` - Obtain JWT Token
* `GET /api/auth/profile` - Fetch biometric & user settings

### 🤖 AI Engine (`/api/ai`)
* `POST /api/ai/chat/:id` - Chat with Hinglish FitCoach AI (Groq Llama 3.3 70B)
* `POST /api/ai/scan-food` - Food photo macro & micro analysis (OpenRouter & Gemini Vision)
* `POST /api/ai/search-food-text` - Food text search & calorie lookup

### 🏋️ Workouts (`/api/workouts`)
* `POST /api/workouts/generate` - AI Custom Workout Planner
* `GET/POST /api/workouts` - Read and log completed workout routines

### 🥗 Nutrition & Hydration (`/api/nutrition`)
* `GET/POST /api/nutrition` - Meal logging & macro target tracking
* `POST /api/nutrition/hydration` - AI Hydration Advisor calculation

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/piyushlilhare123/FitTrack-AI.git
cd FitTrack-AI
```

### 2. Install Dependencies
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../cinematic-showcase
npm install
```

### 3. Set Up Environment Variables (`server/.env`)
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
GEMINI_NUTRITION_KEY=your_gemini_api_key
```

### 4. Run Development Servers
```bash
# Start Backend (Terminal 1)
cd server
npm run dev

# Start Frontend (Terminal 2)
cd cinematic-showcase
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view FitTrack AI in action! ⚡
