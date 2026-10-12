import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import Script from "next/script";
import { ReactGrabInit } from "@/components/common/ReactGrabInit";

export const metadata: Metadata = {
  title: "مدیریت پروژه",
  description: "سامانه جامع مدیریت پروژه، وظایف، کانبان، تقویم جلالی و کنترل تیم",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
        <Script
          src="//unpkg.com/react-grab/dist/index.global.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ReactGrabInit />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
