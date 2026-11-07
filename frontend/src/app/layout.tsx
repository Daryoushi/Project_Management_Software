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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.location.hostname === 'project-management-software-black-six.vercel.app') {
                window.location.replace('https://project-management-software.vercel.app' + window.location.pathname + window.location.search + window.location.hash);
              }
            `,
          }}
        />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        {process.env.NODE_ENV === "development" && <ReactGrabInit />}
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
