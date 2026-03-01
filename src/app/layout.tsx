import type { Metadata } from 'next';
import './globals.css';
import { SupabaseProvider } from '@/supabase';
import { Toaster } from '@/components/ui/toaster';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { ThemeColorMeta } from '@/components/theme-color-meta';

export const metadata: Metadata = {
  title: "E-Moorm - Hyperlocal Marketplace",
  description: "Discover and purchase authentic, locally produced goods from Oriental Mindoro, Philippines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="transparent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="E-Moorm" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body className="font-body antialiased bg-white text-foreground dark:bg-[#050505] transition-colors duration-300">
        <SupabaseProvider>
          {children}
          <Toaster />
          <PWAInstallPrompt />
          <ThemeColorMeta />
        </SupabaseProvider>
      </body>
    </html>
  );
}
