'use client';

import React from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    id: 1,
    title: 'Voice AI Coach',
    subtitle: 'VAPI ASSISTANT',
    description: 'Talk directly to your AI Coach. Get real-time advice, motivation, and answers to any fitness questions via seamless voice interaction.',
    gridSpan: 'md:col-span-2 md:row-span-1',
    icon: (
      <svg className="w-6 h-6 text-cyan" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
      </svg>
    )
  },
  {
    id: 2,
    title: 'AI Workout Planner',
    subtitle: 'GEMINI ENGINE',
    description: 'Generate hyper-personalized workout plans based on your exact available equipment, time, and fitness level instantly.',
    gridSpan: 'md:col-span-1 md:row-span-1',
    icon: (
      <svg className="w-6 h-6 text-cyan" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5L9 8.25m4.5.375c-.352.352-.803.525-1.3.525-.497 0-.948-.173-1.3-.525l-1.3-1.3c-.352-.352-.525-.803-.525-1.3 0-.497.173-.948.525-1.3L11.25 3m6 6l-1.3-1.3c-.352-.352-.525-.803-.525-1.3 0-.497.173-.948.525-1.3L17.25 3" />
      </svg>
    )
  },
  {
    id: 3,
    title: 'AI Nutrition Scanner',
    subtitle: 'PHOTO ANALYSIS',
    description: 'Snap a picture of your food. Our vision AI instantly analyzes the image to estimate calories and extract detailed macros automatically.',
    gridSpan: 'md:col-span-1 md:row-span-1',
    icon: (
      <svg className="w-6 h-6 text-cyan" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.822 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    )
  },
  {
    id: 4,
    title: 'Weekly Progress',
    subtitle: 'DETAILED ANALYTICS',
    description: 'Visualize your weekly consistency, calorie burn rate, and lifting volume. See exactly how close you are to hitting your fitness goals with interactive charts.',
    gridSpan: 'md:col-span-2 md:row-span-1',
    icon: (
      <svg className="w-6 h-6 text-cyan" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    )
  },
  {
    id: 5,
    title: 'Streak Shield',
    subtitle: 'CONSISTENCY',
    description: 'Life gets busy. Our smart streak protection triggers automatic micro-workouts to keep your consistency record intact even on your busiest days.',
    gridSpan: 'md:col-span-2 md:row-span-1',
    icon: (
      <svg className="w-6 h-6 text-cyan" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    )
  },
  {
    id: 6,
    title: 'Secure Sync',
    subtitle: 'PRIVACY FIRST',
    description: 'Your biometric data belongs only to you. Enjoy zero-knowledge cloud sync to store your workout history safely.',
    gridSpan: 'md:col-span-1 md:row-span-1',
    icon: (
      <svg className="w-6 h-6 text-cyan" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    )
  }
];

export default function FeaturesSection() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] as const } 
    }
  };

  return (
    <section id="features" className="py-32 px-6 bg-[#050510] relative z-20 flex justify-center border-t border-[rgba(255,255,255,0.03)]">
      <div className="w-full max-w-5xl">
        
        {/* Section Header */}
        <div className="mb-16 text-center md:text-left">
          <span className="text-cyan text-xs font-semibold uppercase tracking-[0.25em] font-body">
            Feature Showcase
          </span>
          <h2 className="text-white font-headline text-4xl sm:text-5xl font-bold mt-4 tracking-tight leading-none">
            Habit-forming mechanics.
          </h2>
          <p className="text-[#8892A4] font-body text-sm sm:text-base mt-4 max-w-lg">
            Engineered from the ground up to keep you motivated, focused, and performing at your absolute peak.
          </p>
        </div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={cardVariants}
              className={`glass-panel rounded-2xl p-8 flex flex-col justify-between hover:border-cyan/30 hover:shadow-[0_8px_30px_rgba(0,245,255,0.05)] transition-all duration-500 group relative overflow-hidden ${feature.gridSpan}`}
            >
              {/* Subtle Radial Glow inside hover */}
              <div className="absolute inset-0 bg-radial-hover opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div>
                {/* Icon Circle */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#0F1928] border border-white/5 shadow-inner mb-6 group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>

                {/* Subtitle */}
                <span className="text-cyan/60 text-[10px] font-bold tracking-[0.2em] uppercase font-body">
                  {feature.subtitle}
                </span>

                {/* Title */}
                <h3 className="text-white font-headline text-2xl font-semibold mt-2 group-hover:text-cyan transition-colors duration-300">
                  {feature.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-[#8892A4] font-body text-xs sm:text-sm mt-4 leading-relaxed relative z-10">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <style jsx>{`
        .bg-radial-hover {
          background: radial-gradient(
            circle at top left,
            rgba(0, 245, 255, 0.04) 0%,
            transparent 60%
          );
        }
      `}</style>
    </section>
  );
}
