'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section id="cta" className="py-24 bg-[#050510] relative z-20 flex justify-center overflow-hidden border-t border-[rgba(255,255,255,0.03)]">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-5xl px-6 relative z-10">
        <div className="glass-panel rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
          
          {/* Subtle overlay lines */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          
          <div className="max-w-2xl mx-auto relative z-10">
            <span className="text-green text-xs font-semibold uppercase tracking-[0.25em] font-body">
              Get Started Instantly
            </span>
            
            <h2 className="text-white font-headline text-4xl sm:text-5xl md:text-6xl font-bold mt-6 tracking-tight leading-tight">
              Start your FitTrack journey.
            </h2>
            
            <p className="text-[#8892A4] font-body text-sm sm:text-base mt-6 leading-relaxed">
              Experience the power of real-time joint tracking, consistency shields, and dynamic routine updates. No credit card required. Cancel anytime.
            </p>
            
            <motion.div 
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Link 
                href="/register"
                className="bg-green text-[#050510] font-body text-sm font-bold px-8 py-4 rounded-full hover:shadow-[0_0_25px_rgba(57,255,20,0.6)] hover:scale-105 transition-all duration-300 cursor-pointer text-center"
              >
                Start Free Trial
              </Link>
              <button 
                onClick={() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border border-white/10 hover:border-white/20 bg-white/2 hover:bg-white/5 text-white font-body text-sm font-bold px-8 py-4 rounded-full hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                Learn More
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }
      `}</style>
    </section>
  );
}
