'use client';

import React, { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubscribed(true);
        setEmail('');
      } else {
        setErrorMsg(data.message || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#050510] relative z-20 py-16 px-6 border-t border-[rgba(255,255,255,0.03)] flex justify-center">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-white/5">
          
          {/* Brand & Description */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-headline text-3xl font-bold tracking-tight">
              FitTrack
            </h3>
            <p className="text-[#8892A4] font-body text-xs sm:text-sm leading-relaxed max-w-xs">
              Next-generation biomechanics tracking and routine planning. Your goals. Your rules. Built for elite performance.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-white font-body text-xs font-bold uppercase tracking-[0.2em]">
              Sitemap
            </h4>
            <div className="grid grid-cols-2 gap-3 font-body text-xs sm:text-sm text-[#8892A4]">
              <button onClick={() => scrollTo('features')} className="text-left hover:text-cyan transition-colors cursor-pointer">
                Features
              </button>
              <button onClick={() => scrollTo('metrics')} className="text-left hover:text-cyan transition-colors cursor-pointer">
                Metrics
              </button>
              <button onClick={() => scrollTo('testimonials')} className="text-left hover:text-cyan transition-colors cursor-pointer">
                Testimonials
              </button>
              <button onClick={() => scrollTo('cta')} className="text-left hover:text-cyan transition-colors cursor-pointer">
                Join
              </button>
              <a href="#" className="hover:text-cyan transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-cyan transition-colors">
                Terms
              </a>
            </div>
          </div>

          {/* Newsletter Input */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-white font-body text-xs font-bold uppercase tracking-[0.2em]">
              Subscribe
            </h4>
            <p className="text-[#8892A4] font-body text-xs">
              Join 10,000+ athletes receiving weekly training insights.
            </p>
            {subscribed ? (
              <div className="text-green font-body text-xs py-2">
                ✓ Thank you for subscribing!
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    disabled={loading}
                    placeholder={loading ? "Submitting..." : "Enter email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#0F1928] border border-white/10 rounded-xl px-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan/50 flex-grow font-body disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-cyan/15 hover:bg-cyan/25 border border-cyan/40 text-cyan px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 font-body cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "..." : "Join"}
                  </button>
                </form>
                {errorMsg && (
                  <p className="text-red-500 font-body text-[10px] text-left">
                    ⚠ {errorMsg}
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Legal Text */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-[#8892A4] font-body text-[10px] sm:text-xs space-y-4 sm:space-y-0">
          <div>
            © {new Date().getFullYear()} FitTrack. All rights reserved.
          </div>
          <div>
            Designed with precision for Awwwards Showcase.
          </div>
        </div>
      </div>
    </footer>
  );
}
