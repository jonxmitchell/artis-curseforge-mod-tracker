"use client";

import { NextUIProvider } from "@nextui-org/react";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { UpdateServiceProvider } from "@/contexts/UpdateServiceContext";
import "@/styles/globals.css";
import { useContextMenu } from "@/hooks/useContextMenu";
import { usePreventBrowserShortcuts } from "@/hooks/usePreventBrowserShortcuts";

const inter = Inter({ subsets: ["latin"] });

function ClientLayout({ children }) {
  useContextMenu();
  usePreventBrowserShortcuts();
  return (
    <NextUIProvider>
      <UpdateServiceProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </UpdateServiceProvider>
    </NextUIProvider>
  );
}

export default function RootLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground select-none`}>{mounted ? <ClientLayout>{children}</ClientLayout> : null}</body>
    </html>
  );
}
