'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

// Constant for the absolute maximum frames in public/frames/
const MAX_FRAMES = 96;

export default function ScrollCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [totalFramesCount, setTotalFramesCount] = useState(MAX_FRAMES);

  // Motion hooks to track scroll progress over the 500vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Map scroll progress to canvas opacity (retains full 100% opacity at the end to keep the frame visible)
  const canvasOpacity = useTransform(scrollYProgress, [0.85, 0.92, 1.0], [1.0, 1.0, 1.0]);

  // Motion transforms for all 5 text overlay scenes
  // Scene 1: Center Header
  const scene1Opacity = useTransform(scrollYProgress, [0.0, 0.15, 0.22, 0.25], [1, 1, 0, 0]);
  const scene1Y = useTransform(scrollYProgress, [0.0, 0.25], [0, -40]);

  // Scene 2: Left-aligned, right stat chip
  const scene2Opacity = useTransform(scrollYProgress, [0.18, 0.23, 0.40, 0.45], [0, 1, 1, 0]);
  const scene2Y = useTransform(scrollYProgress, [0.18, 0.23, 0.40, 0.45], [40, 0, 0, -40]);

  // Scene 3: Center Routines
  const scene3Opacity = useTransform(scrollYProgress, [0.42, 0.47, 0.60, 0.65], [0, 1, 1, 0]);
  const scene3Y = useTransform(scrollYProgress, [0.42, 0.47, 0.60, 0.65], [40, 0, 0, -40]);

  // Scene 4: Right-aligned, 3 staggered stat chips
  const scene4Opacity = useTransform(scrollYProgress, [0.62, 0.67, 0.80, 0.85], [0, 1, 1, 0]);
  const scene4Y = useTransform(scrollYProgress, [0.62, 0.67, 0.80, 0.85], [40, 0, 0, -40]);

  // Scene 5: Full Center CTA
  const scene5Opacity = useTransform(scrollYProgress, [0.82, 0.87, 0.95], [0, 1, 1]);
  const scene5Y = useTransform(scrollYProgress, [0.82, 0.87], [40, 0]);

  // Detect mobile & prefers-reduced-motion on mount
  useEffect(() => {
    const checkMedia = () => {
      const mobile = window.innerWidth < 768;
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      setIsMobile(mobile);
      setReducedMotion(motionQuery.matches);
      setTotalFramesCount(mobile ? Math.floor(MAX_FRAMES / 2) : MAX_FRAMES);
    };

    checkMedia();
    window.addEventListener('resize', checkMedia);
    return () => window.removeEventListener('resize', checkMedia);
  }, []);

  // Frame Draw function with aspect-ratio cover logic
  const drawImageCover = useCallback((ctx: CanvasRenderingContext2D, img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  }, []);

  // Procedural 3D Neon Gyroscope fallback renderer
  const drawProceduralFallback = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.25;
    
    // Create futuristic grid lines
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 80;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Gyroscope parameters
    const ringCount = 3;
    const particlesPerRing = 100;
    const time = progress * Math.PI * 6; // Rotation driven by scroll position
    const focalLength = baseRadius * 3; // Dynamically scale focal length to avoid negative project coordinates on large viewports

    for (let r = 0; r < ringCount; r++) {
      const angleOffset = (r * Math.PI) / ringCount;
      const speedMultiplier = r % 2 === 0 ? 1 : -1;
      const angleY = time * speedMultiplier + angleOffset;
      const angleX = time * 0.5 * speedMultiplier;

      // Color scheme for rings
      let ringColor = 'rgba(0, 245, 255, '; // Cyan
      if (r === 1) ringColor = 'rgba(57, 255, 20, '; // Green
      if (r === 2) ringColor = 'rgba(255, 255, 255, '; // White

      ctx.beginPath();
      for (let p = 0; p <= particlesPerRing; p++) {
        const phi = (p * Math.PI * 2) / particlesPerRing;
        
        // 3D coordinates on a circle ring
        let x3d = baseRadius * Math.cos(phi);
        let y3d = baseRadius * Math.sin(phi);
        let z3d = 0;

        // Apply rotation around Y-axis
        let cosY = Math.cos(angleY);
        let sinY = Math.sin(angleY);
        let xRotY = x3d * cosY - z3d * sinY;
        let zRotY = x3d * sinY + z3d * cosY;

        // Apply rotation around X-axis
        let cosX = Math.cos(angleX);
        let sinX = Math.sin(angleX);
        let yRotX = y3d * cosX - zRotY * sinX;
        let zRotX = y3d * sinX + zRotY * cosX;

        // Depth projection mapping
        const scale = focalLength / (focalLength + zRotX);
        const screenX = centerX + xRotY * scale;
        const screenY = centerY + yRotX * scale;
        const alpha = Math.max(0.1, Math.min(1.0, scale * (1.2 - zRotX / (baseRadius * 1.5))));

        if (p === 0) {
          ctx.moveTo(screenX, screenY);
        } else {
          ctx.lineTo(screenX, screenY);
        }
      }
      ctx.strokeStyle = ringColor + '0.15)';
      ctx.lineWidth = 2 + r;
      ctx.stroke();

      // Draw particle points on the rings
      for (let p = 0; p < particlesPerRing; p += 5) {
        const phi = (p * Math.PI * 2) / particlesPerRing;
        let x3d = baseRadius * Math.cos(phi);
        let y3d = baseRadius * Math.sin(phi);
        let z3d = 0;

        let cosY = Math.cos(angleY);
        let sinY = Math.sin(angleY);
        let xRotY = x3d * cosY - z3d * sinY;
        let zRotY = x3d * sinY + z3d * cosY;

        let cosX = Math.cos(angleX);
        let sinX = Math.sin(angleX);
        let yRotX = y3d * cosX - zRotY * sinX;
        let zRotX = y3d * sinX + zRotY * cosX;

        const scale = focalLength / (focalLength + zRotX);
        const screenX = centerX + xRotY * scale;
        const screenY = centerY + yRotX * scale;
        const alpha = Math.max(0.1, Math.min(1.0, scale * (1.2 - zRotX / (baseRadius * 1.5))));
        const radius = Math.max(1, 4 * scale);

        ctx.fillStyle = ringColor + alpha + ')';
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Dynamic glow highlights on closest particles
        if (zRotX < -baseRadius * 0.5) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = r === 1 ? '#39FF14' : '#00F5FF';
          ctx.beginPath();
          ctx.arc(screenX, screenY, radius * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }
    }
  }, []);

  // Preloading image frames
  useEffect(() => {
    if (reducedMotion) {
      setLoadingProgress(100);
      setIsLoaded(true);
      return;
    }

    const framesToLoad = isMobile ? Math.floor(MAX_FRAMES / 2) : MAX_FRAMES;
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    const handleImageLoad = (img: HTMLImageElement) => {
      loadedCount++;
      const progress = Math.min(100, Math.round((loadedCount / framesToLoad) * 100));
      setLoadingProgress(progress);
      if (loadedCount === framesToLoad) {
        framesRef.current = loadedImages;
        setIsLoaded(true);
      }
    };

    const handleImageError = () => {
      // In case image files fail to load (e.g. 404 or folder missing), trigger fallback mode
      console.warn("Failed to load image frame. Activating procedural 3D fallback mode.");
      setUseFallback(true);
      setIsLoaded(true);
      setLoadingProgress(100);
    };

    // Load frames upfront - bind onload/onerror BEFORE setting src to handle cached images correctly
    for (let i = 0; i < framesToLoad; i++) {
      const img = new Image();
      // Map to 1..96 range. On mobile we load every other frame (i * 2 + 1)
      const frameIndex = isMobile ? (i * 2) + 1 : i + 1;
      img.onload = () => handleImageLoad(img);
      img.onerror = handleImageError;
      img.src = `/frames/frame_${String(frameIndex).padStart(4, '0')}.png`;
      loadedImages.push(img);
    }

    // Set a safety timeout: if frames take too long (e.g. 5s), default to fallback mode
    const safetyTimeout = setTimeout(() => {
      if (loadedCount < framesToLoad) {
        console.warn("Frame loading timed out. Activating procedural 3D fallback.");
        setUseFallback(true);
        setIsLoaded(true);
        setLoadingProgress(100);
      }
    }, 6000);

    return () => clearTimeout(safetyTimeout);
  }, [isMobile, reducedMotion]);

  // Adjust Canvas dimension on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Force redraw of current frame
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const progress = scrollYProgress.get();
        if (useFallback) {
          drawProceduralFallback(ctx, canvas, progress);
        } else if (framesRef.current.length > 0) {
          const index = Math.min(
            framesRef.current.length - 1,
            Math.round(progress * (framesRef.current.length - 1))
          );
          if (framesRef.current[index]) {
            drawImageCover(ctx, framesRef.current[index], canvas);
          }
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [useFallback, drawImageCover, drawProceduralFallback, scrollYProgress]);

  // Trigger initial frame draw when loading completes so canvas is not black/blank on load
  useEffect(() => {
    if (isLoaded) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const progress = scrollYProgress.get();
      if (useFallback) {
        drawProceduralFallback(ctx, canvas, progress);
      } else if (framesRef.current.length > 0) {
        const index = Math.min(
          framesRef.current.length - 1,
          Math.round(progress * (framesRef.current.length - 1))
        );
        const img = framesRef.current[index];
        if (img) {
          if (img.complete) {
            drawImageCover(ctx, img, canvas);
          } else {
            img.onload = () => drawImageCover(ctx, img, canvas);
          }
        }
      }
    }
  }, [isLoaded, useFallback, drawImageCover, drawProceduralFallback, scrollYProgress]);

  // Scroll listener that renders frames using requestAnimationFrame
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    requestAnimationFrame(() => {
      if (useFallback) {
        drawProceduralFallback(ctx, canvas, latest);
      } else if (framesRef.current.length > 0) {
        const index = Math.min(
          framesRef.current.length - 1,
          Math.round(latest * (framesRef.current.length - 1))
        );
        const img = framesRef.current[index];
        if (img && img.complete) {
          drawImageCover(ctx, img, canvas);
        }
      }
    });
  });

  return (
    <div ref={containerRef} className="relative w-full h-[150vh] bg-[#050510]">
      {/* 1. Loading Preloader Overlay Removed */}

      {/* 2. Sticky Canvas Video Sequence Container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden z-0 bg-[#050510]">
        {reducedMotion ? (
          // Static poster display if prefers-reduced-motion is true
          <div 
            className="w-full h-full bg-cover bg-center" 
            style={{ 
              backgroundImage: `url('/frames/frame_0001.png')`,
              backgroundColor: '#050510'
            }} 
          />
        ) : (
          <motion.canvas 
            ref={canvasRef} 
            className="w-full h-full block object-cover"
            style={{ opacity: canvasOpacity }}
          />
        )}

        {/* 3. Text Overlay Scenes (Moved inside the sticky container so they align relative to 100vh and show instantly) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
        
        {/* SCENE 1 (0% - 20% scroll) */}
        <motion.div 
          style={{ opacity: scene1Opacity, y: scene1Y }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
        >
          <div className="max-w-4xl flex flex-col items-center bg-radial-glow py-8 rounded-3xl">
            <span className="mb-6 px-4 py-1.5 rounded-full border border-cyan/25 text-cyan text-xs font-semibold uppercase tracking-[0.25em] bg-[#0F1928]/60 backdrop-blur-sm shadow-[0_0_15px_rgba(0,245,255,0.1)]">
              AI-Powered Fitness
            </span>
            <h1 className="text-white font-headline font-bold text-4xl sm:text-5xl md:text-7xl leading-tight tracking-tight drop-shadow-md">
              Build habits that<br />actually stick.
            </h1>
          </div>
        </motion.div>

        {/* SCENE 2 (20% - 45% scroll) */}
        <motion.div 
          style={{ opacity: scene2Opacity, y: scene2Y }}
          className="absolute inset-0 flex items-center justify-between px-8 md:px-[8vw]"
        >
          {/* Left Hero Header */}
          <div className="max-w-md bg-radial-glow py-6 rounded-2xl">
            <span className="text-cyan text-xs font-semibold tracking-[0.2em] uppercase font-body">
              REAL-TIME ANALYSIS
            </span>
            <h2 className="text-white font-headline text-3xl sm:text-5xl md:text-6xl font-bold mt-3 leading-[1.15]">
              Every muscle.<br />Tracked.
            </h2>
          </div>

          {/* Right Floating glass stat chip */}
          <div className="hidden sm:block animate-float">
            <div className="glass-chip flex items-center gap-3">
              <span className="text-cyan text-xl">🔥</span>
              <span>847 kcal burned today</span>
            </div>
          </div>
        </motion.div>

        {/* SCENE 3 (45% - 65% scroll) */}
        <motion.div 
          style={{ opacity: scene3Opacity, y: scene3Y }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
        >
          <div className="max-w-2xl bg-radial-glow p-8 rounded-3xl">
            <span className="text-cyan text-xs font-semibold tracking-[0.2em] uppercase font-body">
              INTELLIGENT INSIGHTS
            </span>
            <h2 className="text-white font-headline text-3xl sm:text-5xl font-bold mt-4 leading-tight">
              Your plan,<br />generated instantly.
            </h2>
            <p className="mt-6 text-[#8892A4] font-body text-sm sm:text-base leading-relaxed">
              FitTrack analyzes your history, goals, and recovery to build tomorrow's workout — automatically.
            </p>
          </div>
        </motion.div>

        {/* SCENE 4 (65% - 85% scroll) */}
        <motion.div 
          style={{ opacity: scene4Opacity, y: scene4Y }}
          className="absolute inset-0 flex items-center justify-between flex-row-reverse px-8 md:px-[8vw]"
        >
          {/* Right Text */}
          <div className="max-w-md bg-radial-glow py-6 rounded-2xl text-right">
            <span className="text-cyan text-xs font-semibold tracking-[0.2em] uppercase font-body">
              CONSISTENCY ENGINE
            </span>
            <h2 className="text-white font-headline text-3xl sm:text-5xl md:text-6xl font-bold mt-3 leading-[1.15]">
              14-day streak.<br />Keep going.
            </h2>
          </div>

          {/* Left floating chips - staggered stack */}
          <div className="hidden sm:flex flex-col gap-4">
            <div className="glass-chip animate-float flex items-center gap-3" style={{ animationDelay: '0s' }}>
              <span className="text-green text-xl">🔥</span>
              <span>Streak: 14 days</span>
            </div>
            <div className="glass-chip animate-float flex items-center gap-3 translate-x-4" style={{ animationDelay: '0.4s' }}>
              <span className="text-cyan text-xl">💪</span>
              <span>Score: 82/100</span>
            </div>
            <div className="glass-chip animate-float flex items-center gap-3" style={{ animationDelay: '0.8s' }}>
              <span className="text-white text-xl">⚡</span>
              <span>This week: 4/6 workouts</span>
            </div>
          </div>
        </motion.div>

        {/* SCENE 5 (85% - 100% scroll) */}
        <motion.div 
          style={{ opacity: scene5Opacity, y: scene5Y }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
        >
          <div className="max-w-2xl bg-radial-glow p-8 rounded-3xl pointer-events-auto">
            <h2 className="text-white font-headline text-4xl sm:text-6xl font-bold tracking-tight">
              Ready to start?
            </h2>
            <p className="mt-6 text-[#8892A4] font-body text-sm sm:text-lg">
              Join 10,000+ athletes already training with FitTrack.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register"
                className="bg-green text-[#050510] font-body text-sm font-bold px-8 py-3 rounded-full hover:shadow-[0_0_20px_rgba(57,255,20,0.6)] hover:scale-105 transition-all duration-300 cursor-pointer text-center"
              >
                Start Free Trial
              </Link>
              <button 
                onClick={() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border border-cyan text-cyan hover:bg-cyan/10 font-body text-sm font-bold px-8 py-3 rounded-full hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                Watch Demo
              </button>
            </div>
          </div>
        </motion.div>

      </div> {/* Closes Text Overlay Scenes */}
      </div> {/* Closes Sticky Canvas Video Sequence Container */}

    </div>
  );
}
