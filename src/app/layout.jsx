"use client";

import { NextUIProvider } from "@nextui-org/react";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { UpdateServiceProvider } from "@/contexts/UpdateServiceContext";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground select-none`}>
        <NextUIProvider>
          <UpdateServiceProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 p-8">{children}</main>
            </div>
          </UpdateServiceProvider>
        </NextUIProvider>
      </body>
    </html>
  );
}
