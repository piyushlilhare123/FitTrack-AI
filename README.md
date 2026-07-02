# 🏋️‍♂️ FitTrack AI — The Ultimate Cinematic AI Fitness Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-8E75C2?style=for-the-badge&logo=googlegemini)](https://deepmind.google/technologies/gemini/)
[![Vapi AI](https://img.shields.io/badge/Voice_AI-Vapi-orange?style=for-the-badge)](https://vapi.ai/)

FitTrack AI is a premium, full-stack, AI-powered personal fitness and wellness ecosystem designed to deliver a cinematic user experience. With a futuristic dark-mode UI, rich micro-animations, real-time voice coaching, and computer vision-based nutrition scanning, FitTrack AI goes beyond typical trackers to act as a virtual, desi personal trainer and dietician in your pocket.

---

## 🌟 Key Features

### 🎙️ 1. Voice & Text AI Coach (Vapi & Gemini)
* **Interactive Voice Assistant**: Powered by `@vapi-ai/web`, allowing users to talk directly to their coach via natural speech on mobile and web platforms.
* **Friendly Hinglish Persona**: The AI speaks in a warm, energetic, Hinglish coaching style (e.g., *"Bhai, aaj ka plan ready hai!"*), mimicking a local personal trainer.
* **Culturally Aware Advice**: Recommends Indian food alternatives (e.g., paneer, dal, besan chilla, sattu, Rohu fish) and custom workouts tailored to home gym or minimal equipment configurations.
* **Math-Backed Coaching**: Performs precise TDEE calculations (Mifflin-St Jeor formula) and macro breakdowns (fat loss vs. muscle gain).

### 🥦 2. AI Nutrition Scanner (Gemini Vision)
* **Food Recognition**: Upload or drag-and-drop a photo of any meal.
* **Macronutrient Breakdown**: The vision model parses the image and instantly outputs estimated grams and percentages of carbohydrates, proteins, fats, and fiber.
* **Health Scoring & Badges**: Categorizes meals into smart badges like *Very Healthy*, *High Protein*, *Balanced*, *High Carb*, or *High Fat*.

### 🏋️ 3. Hyper-Personalized Workout Planner
* Generates custom routines based on equipment, fitness level, time, and target muscle groups.
* Integrates seamlessly with active trackers to record sets, reps, and cardiovascular volume.

### 📊 4. Cinematic Interactive Dashboard
* **Dynamic Canvas Backgrounds**: High-fidelity scrolling canvas animations (`ScrollCanvas.tsx`) that bring the application to life.
* **Advanced Progress Analytics**: Interactive weight, calorie, and workout consistency tracking powered by **Recharts**.
* **Gamified Experience**: Includes a **Trophy Room** for unlocked consistency badges, milestones, and streak shields.

### 🔒 5. Secure Sync & Database Fallbacks
* JWT-based token authentication for private biometric data.
* **Smart DB Connection Fallback**: If the server fails to connect to MongoDB Atlas (e.g., due to IP whitelisting issues), it automatically spins up an **in-memory database** (`mongodb-memory-server`) so testing and demos can run completely uninterrupted.

---

## 🛠️ Tech Stack

### Frontend (Next.js Client)
* **Framework**: React 19 / Next.js 15 (App Router, TypeScript)
* **Styling**: Tailwind CSS v4, custom glassmorphism components
* **Animations**: Framer Motion, HTML5 Canvas
* **State Management**: Zustand
* **Charts & Visuals**: Recharts, Lucide Icons
* **Real-time Voice**: `@vapi-ai/web` SDK
* **Notifications**: React Hot Toast

### Backend (Express API Server)
* **Runtime**: Node.js & Express
* **Database**: MongoDB (Mongoose ODM)
* **In-Memory Db (Fallback)**: `mongodb-memory-server`
* **Authentication**: JWT, bcryptjs
* **File Uploads**: Multer
* **AI Services**: Google Generative AI (`@google/generative-ai` for Vision) & direct Gemini Rest API integrations
* **Security & Traffic**: Helmet (CORS configurations), Express Rate Limit, Morgan logger

---

## 📁 Repository Structure

```text
├── cinematic-showcase/          # Next.js 15 Frontend Client
│   ├── public/                  # Static assets & favicon
│   └── src/
│       ├── app/                 # App Router (dashboard, login, register, etc.)
│       ├── components/          # React components
│       │   ├── charts/          # Progress graphs
│       │   ├── dashboard/       # Stat cards & schedule rows
│       │   ├── layout/          # Topbar & Sidebar navigation
│       │   ├── nutrition/       # Gemini AI Nutrition Scanner
│       │   └── ui/              # Modal, Card reusables
│       ├── lib/                 # Axios API configuration & utilities
│       └── store/               # Zustand state stores
│
├── server/                      # Node.js Express Backend Server
│   ├── controllers/             # Request handlers (AI, auth, workouts, nutrition)
│   ├── middleware/              # JWT verification, rate limiter, error handling
│   ├── models/                  # Mongoose MongoDB schemas
│   ├── routes/                  # REST endpoints
│   ├── uploads/                 # Temporary stored user images
│   └── server.js                # Server entry point
│
├── fitness.tsx                  # Framer Rolling Text component
├── fitness2.tsx                 # Framer Circular Progress component
└── README.md                    # Main documentation
```

---

## 🚀 Getting Started

### 📋 Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* [MongoDB](https://www.mongodb.com/) (Local Community Server or Atlas account)

---

### 🔧 Installation & Setup

#### 1. Setup the Backend Server
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory and configure the variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Gemini AI Credentials
GEMINI_API_KEY=your_gemini_api_key
GEMINI_VOICE_KEY=your_voice_specific_api_key
GEMINI_TEXT_KEY=your_text_specific_api_key
GEMINI_NUTRITION_KEY=your_vision_specific_api_key

# OpenAI Fallback API Credentials (Optional)
OPENAI_API_KEY=your_openai_api_key
```

Run the development server:
```bash
npm run dev
```
*Note: If the MongoDB URI fails to connect (e.g. IP whitelist block), it will print your current public IP address and automatically launch an in-memory database fallback.*

---

#### 2. Setup the Frontend Client
Navigate to the client directory and install dependencies:
```bash
cd ../cinematic-showcase
npm install
```

Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your cinematic dashboard!

---

## ⚡ API Endpoints

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/register` - Create user profile
* `POST /api/auth/login` - Obtain JWT Token
* `GET /api/auth/profile` - Fetch biometric & user settings

### 🤖 AI Engine (`/api/ai`)
* `POST /api/ai/chat/:id` - Chat with Hinglish FitCoach AI
* `POST /api/ai/scan-food` - Upload image for Gemini macro analysis

### 🥗 Trackers (`/api/...`)
* `GET/POST /api/workouts` - Read/Write workouts logs
* `GET/POST /api/nutrition` - Log meals & track daily macro targets
* `GET/POST /api/progress` - Save bodyweight, stats, and milestones
* `GET/POST /api/feed` - Read community feed & posts

---

## 🎨 UI & UX Features
* **Rich Glassmorphism**: Tailored HSL dark palettes combined with semi-transparent backdrops (`bg-[#161A22]`).
* **Micro-Animations**: Hover transitions, card tilt shadows, and Canvas particles that make the site feel alive.
* **Responsive Layouts**: Fully adaptive dashboards designed to look excellent on both standard computer screens and mobile displays.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
