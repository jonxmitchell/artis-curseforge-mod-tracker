"use client";

import { NextUIProvider } from "@nextui-org/react";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <NextUIProvider>{children}</NextUIProvider>
      </body>
    </html>
  );
}
