# 🖥️ FitTrack AI — Frontend Client

This is the cinematic frontend client for **FitTrack AI**, built with **Next.js 15**, **React 19**, and **Tailwind CSS v4**.

It features full integration with `@vapi-ai/web` for voice assistance, Google Gemini for nutrition vision scanning, and interactive progress analytics using Recharts.

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the backend API server running first. Refer to the [Root README](../README.md) for full system setup and environment configuration.

### 🔧 Installation & Run

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Start production server**:
   ```bash
   npm run start
   ```

---

## 🎨 Technology Highlights
* **Core**: Next.js 15 (App Router), React 19, TypeScript
* **Animations**: Framer Motion & custom Canvas animations (`ScrollCanvas.tsx`)
* **State Management**: Zustand stores
* **Analytics**: Recharts, custom gauge animations, and progressive milestone displays
* **Biometrics Scanner**: Client-side image upload and base64 parsing for AI food analysis

For more details on the architecture, backend API endpoints, and configuration, please visit the [Main Project README](../README.md).
