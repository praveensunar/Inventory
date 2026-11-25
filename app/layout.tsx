import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "SasthaStock | Enterprise Inventory & Operations Suite",
  description: "Connected real-time inventory management with purchase orders, sales invoices, stock movement tracking, and godown views.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Instant Theme Initialization Script (Prevents White Flash and Synchronizes Dark Mode) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedMode = localStorage.getItem('sastha_mode');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = savedMode === 'dark' || (!savedMode && prefersDark);
                  var root = document.documentElement;
                  if (isDark) {
                    root.classList.add('dark');
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.remove('dark');
                    root.style.colorScheme = 'light';
                  }
                  var savedTheme = localStorage.getItem('sastha_theme');
                  if (savedTheme && savedTheme !== 'sapphire') {
                    root.setAttribute('data-theme', savedTheme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Automatically unregisters any stale localhost service workers (e.g. Flutter/PWA) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (var r of registrations) {
                    r.unregister();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider>
          <InventoryProvider>
            <AppShell>{children}</AppShell>
          </InventoryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
