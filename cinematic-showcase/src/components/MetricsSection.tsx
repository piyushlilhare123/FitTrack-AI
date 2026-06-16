'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, animate } from 'framer-motion';

interface MetricCardProps {
  value: number;
  suffix: string;
  label: string;
  description: string;
}

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (inView) {
      const controls = animate(0, value, {
        duration: 2.0,
        ease: 'easeOut',
        onUpdate: (latest) => {
          setDisplayValue(Math.floor(latest));
        }
      });
      return () => controls.stop();
    }
  }, [inView, value]);

  return (
    <span ref={ref} className="text-cyan font-headline text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight drop-shadow-[0_0_20px_rgba(0,245,255,0.2)]">
      {displayValue}
      {suffix}
    </span>
  );
}

const metricsList: MetricCardProps[] = [
  {
    value: 10,
    suffix: 'K+',
    label: 'Active Athletes',
    description: 'Relying on FitTrack daily'
  },
  {
    value: 98,
    suffix: '%',
    label: 'Tracking Accuracy',
    description: 'Precision joint tracking data'
  },
  {
    value: 50,
    suffix: 'M+',
    label: 'Workouts Completed',
    description: 'Logged and analyzed routines'
  },
  {
    value: 14,
    suffix: ' Days',
    label: 'Average Streak',
    description: 'Double the industry average'
  }
];

export default function MetricsSection() {
  return (
    <section id="metrics" className="py-24 bg-[#050510] relative z-20 flex justify-center border-t border-[rgba(255,255,255,0.03)]">
      <div className="w-full max-w-5xl px-6">
        
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="text-cyan text-xs font-semibold uppercase tracking-[0.25em] font-body">
            By The Numbers
          </span>
          <h2 className="text-white font-headline text-4xl sm:text-5xl font-bold mt-4 tracking-tight leading-none">
            Empirical efficiency.
          </h2>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metricsList.map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
              className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col justify-between text-center relative overflow-hidden group hover:border-cyan/25 transition-colors duration-300"
            >
              {/* Subtle background card pattern */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/2 rounded-full blur-xl group-hover:bg-cyan/5 transition-all duration-500" />
              
              <div className="mb-4">
                <Counter value={metric.value} suffix={metric.suffix} />
              </div>
              
              <div>
                <h3 className="text-white font-body text-sm sm:text-base font-semibold tracking-wide">
                  {metric.label}
                </h3>
                <p className="text-[#8892A4] font-body text-xs mt-2 leading-snug">
                  {metric.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
