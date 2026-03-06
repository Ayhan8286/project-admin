import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { Prefetcher } from "@/components/Prefetcher";

const geistSans = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {/* Main Application Shell */}
            <div className="flex h-screen overflow-hidden bg-[#f4f6f4] dark:bg-[#0c1a0d] text-foreground transition-colors duration-200 relative">
              {/* Gradient mesh orbs — personality layer */}
              <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
                <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-primary/[0.06] dark:bg-primary/[0.05] blur-[120px]" />
                <div className="absolute -bottom-40 -left-20 w-[440px] h-[440px] rounded-full bg-emerald-500/[0.06] dark:bg-emerald-400/[0.04] blur-[100px]" />
                <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full bg-teal-400/[0.04] dark:bg-teal-300/[0.025] blur-[80px]" />
              </div>
              <Prefetcher />
              <Sidebar />
              <main className="flex-1 overflow-y-auto relative z-10 bg-transparent flex flex-col custom-scrollbar">
                {children}
              </main>
            </div>
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: "rgba(12, 26, 13, 0.92)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(19, 236, 55, 0.15)",
                  color: "#e2f5e4",
                  borderRadius: "1rem",
                },
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
