'use client';

import React from 'react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote: "The real-time motion tracking is game-changing. I fixed my squat hip shift within a single week of training.",
    author: "Marcus Vance",
    role: "Competitive Powerlifter",
    avatar: "🏋️‍♂️",
    rating: 5
  },
  {
    quote: "FitTrack feels like it was engineered by kinesiologists, not just software devs. The biomechanics feedback is spot on.",
    author: "Dr. Sarah Lin",
    role: "Sports Medicine Specialist",
    avatar: "🏃‍♀️",
    rating: 5
  },
  {
    quote: "My current streak is at 42 days. The streak shield saved my consistency records twice during heavy travel weeks.",
    author: "Ethan Ross",
    role: "Tech Executive",
    avatar: "💼",
    rating: 5
  },
  {
    quote: "This is hands-down the most gorgeous fitness app UI on the market. The transitions make tracking workouts actually fun.",
    author: "Mia Takahashi",
    role: "Product Designer",
    avatar: "🎨",
    rating: 5
  },
  {
    quote: "Clean code philosophy visible in the product. Minimalist, high performance, dark mode native. Perfection.",
    author: "David Wright",
    role: "Lead Software Architect",
    avatar: "💻",
    rating: 5
  },
  {
    quote: "The recovery-based routine generator adapts to my heart rate data instantly. My fatigue levels have dropped 30%.",
    author: "Elena Guseva",
    role: "Triathlete",
    avatar: "🚴‍♀️",
    rating: 5
  }
];

export default function TestimonialsSection() {
  // We duplicate the list to make a seamless infinite loop
  const marqueeItems = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="py-24 bg-[#050510] relative z-20 overflow-hidden border-t border-[rgba(255,255,255,0.03)]">
      <div className="w-full max-w-5xl mx-auto px-6 mb-16 text-center">
        <span className="text-cyan text-xs font-semibold uppercase tracking-[0.25em] font-body">
          Client Feedback
        </span>
        <h2 className="text-white font-headline text-4xl sm:text-5xl font-bold mt-4 tracking-tight leading-none">
          Trusted by athletes.
        </h2>
      </div>

      {/* Marquee Wrapper with side gradient masks for premium fade edge effect */}
      <div className="relative w-full overflow-hidden py-4 mask-edges">
        <div className="flex gap-6 animate-marquee w-max select-none">
          {marqueeItems.map((item, index) => (
            <div
              key={index}
              className="glass-panel w-[320px] sm:w-[380px] rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:border-cyan/25 hover:shadow-[0_0_25px_rgba(0,245,255,0.03)] transition-all duration-300 cursor-pointer"
            >
              <div>
                {/* Star Rating */}
                <div className="flex gap-1 text-cyan mb-4">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <span key={i} className="text-xs">★</span>
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-[#C4CDD8] font-body text-xs sm:text-sm leading-relaxed italic">
                  "{item.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-[#0F1928] border border-white/5 flex items-center justify-center text-lg shadow-inner">
                  {item.avatar}
                </div>
                <div>
                  <h4 className="text-white font-body text-xs sm:text-sm font-semibold">
                    {item.author}
                  </h4>
                  <p className="text-[#8892A4] font-body text-[10px] sm:text-xs">
                    {item.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .mask-edges {
          mask-image: linear-gradient(
            to right,
            transparent,
            rgba(0, 0, 0, 1) 15%,
            rgba(0, 0, 0, 1) 85%,
            transparent
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent,
            rgba(0, 0, 0, 1) 15%,
            rgba(0, 0, 0, 1) 85%,
            transparent
          );
        }
      `}</style>
    </section>
  );
}
