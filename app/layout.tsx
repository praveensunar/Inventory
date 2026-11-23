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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider>
          <InventoryProvider>
            <AppShell>{children}</AppShell>
          </InventoryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
