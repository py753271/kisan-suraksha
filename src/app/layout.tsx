import type { Metadata, Viewport } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'Kisan Suraksha — Official Disaster Intelligence & Warning',
  description: 'Official Early Warning & Disaster Intelligence Platform for Indian Farmers. Real-time CWC, IMD and NDMA safety alerts.',
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              <AccessibilityProvider>
                <ThemeProvider>
                  <main className="w-full min-h-screen relative pb-16 md:pb-0 md:pl-0">
                    {children}
                  </main>
                </ThemeProvider>
              </AccessibilityProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
