import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AL Huda Network LMS",
  description: "AL Huda Network Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <div className="flex min-h-screen">
              <Sidebar />
              {/* Main content — shifts right when sidebar is full (w-64) or icon-only (w-16) */}
              <main className="flex-1 md:ml-64 min-h-screen overflow-y-auto transition-all duration-300">
                <div className="container mx-auto p-6 md:p-8 max-w-7xl">
                  {children}
                </div>
              </main>
            </div>
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: "rgba(15,10,35,0.9)",
                  backdropFilter: "blur(15px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e2e8f0",
                },
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
