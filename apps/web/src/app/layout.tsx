import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SessionProvider } from "@/components/SessionProvider";
import { ReactQueryProvider } from "@/components/ReactQueryProvider";
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
  title: "AI Recruitment Screening Platform",
  description: "AI-powered recruitment screening and talent matching platform for HR professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950`}>
        <ReactQueryProvider>
          <SessionProvider>
            <AuthProvider>
              <div className="flex h-screen overflow-hidden">
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
              </div>
            </AuthProvider>
          </SessionProvider>
        </ReactQueryProvider>
        <Toaster 
          position="top-right"
          expand={false}
          richColors
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#fafafa',
            },
          }}
        />
      </body>
    </html>
  );
}