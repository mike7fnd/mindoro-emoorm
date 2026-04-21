import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SupabaseProvider } from '@/supabase';
import { Toaster } from '@/components/ui/toaster';
import { ThemeColorMeta } from '@/components/theme-color-meta';
import { AdminRouteGuard } from '@/components/admin-route-guard';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#29a366",
};

export const metadata: Metadata = {
  title: "E-Moorm - Hyperlocal Marketplace",
  description: "Discover and purchase authentic, locally produced goods from Oriental Mindoro, Philippines.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "E-Moorm",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="E-Moorm" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
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
      <body
        className="font-body antialiased bg-white text-foreground dark:bg-[#050505] transition-colors duration-300"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          WebkitPaddingTop: 'env(safe-area-inset-top)',
          WebkitPaddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <SupabaseProvider>
          <AdminRouteGuard>
            {children}
          </AdminRouteGuard>
          <Toaster />
          <ThemeColorMeta />
        </SupabaseProvider>
      </body>
    </html>
  );
}
