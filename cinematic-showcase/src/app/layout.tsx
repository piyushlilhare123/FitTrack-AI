import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitTrack — Build habits that actually stick.",
  description: "Experience cinema-quality scrollytelling. FitTrack maps your scroll position to 3D video frames for responsive, real-time biomechanics tracking insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#0F1928',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '13px',
              borderRadius: '12px'
            }
          }} 
        />
        {children}
      </body>
    </html>
  );
}
