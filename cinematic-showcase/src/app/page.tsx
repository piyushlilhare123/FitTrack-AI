import Navbar from '@/components/Navbar';
import ScrollCanvas from '@/components/ScrollCanvas';
import FeaturesSection from '@/components/FeaturesSection';
import MetricsSection from '@/components/MetricsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="relative bg-[#050510] text-[#C4CDD8] min-h-screen selection:bg-cyan/30 selection:text-white">
      {/* Pinned Navigation Bar */}
      <Navbar />

      {/* Main Canvas Scroll-driven interaction (500vh) */}
      <ScrollCanvas />

      {/* Bento Grid Features Section */}
      <FeaturesSection />

      {/* Stat Count-up Metrics Section */}
      <MetricsSection />

      {/* Seamless looping marquee testimonials */}
      <TestimonialsSection />

      {/* Radial Glow CTA Section */}
      <CTASection />

      {/* Glass Structured Footer */}
      <Footer />
    </main>
  );
}
export const metadata = {
  title: 'FitTrack — Build habits that actually stick.',
  description: 'Experience cinema-quality scrollytelling. FitTrack maps your scroll position to 3D video frames for responsive, real-time biomechanics tracking insights.',
};
