"use client";

import { NextUIProvider } from "@nextui-org/react";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { UpdateServiceProvider } from "@/contexts/UpdateServiceContext";
import "@/styles/globals.css";
import { useContextMenu } from "@/hooks/useContextMenu";
import { usePreventBrowserShortcuts } from "@/hooks/usePreventBrowserShortcuts";
import CloseConfirmationModal from "@/components/CloseConfirmationModal";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";

const inter = Inter({ subsets: ["latin"] });

function ClientLayout({ children }) {
  useContextMenu();
  usePreventBrowserShortcuts();
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    // Listen for the close requested event
    const unlisten = appWindow.onCloseRequested(async (event) => {
      // Prevent the default close
      event.preventDefault();

      try {
        // Check if close to tray is enabled
        const closeToTray = await invoke("handle_close_requested");

        if (closeToTray) {
          setShowCloseModal(true);
        } else {
          // If close to tray is disabled, just quit
          await appWindow.close();
        }
      } catch (error) {
        console.error("Error handling close request:", error);
        await appWindow.close();
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleMinimizeToTray = async () => {
    try {
      await appWindow.hide();
      setShowCloseModal(false);
    } catch (error) {
      console.error("Error minimizing to tray:", error);
    }
  };

  const handleQuit = async () => {
    try {
      await appWindow.close();
    } catch (error) {
      console.error("Error quitting application:", error);
    }
  };

  return (
    <NextUIProvider>
      <UpdateServiceProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
        <CloseConfirmationModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          onMinimize={handleMinimizeToTray}
          onQuit={handleQuit}
        />
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
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground select-none`}
      >
        {mounted ? <ClientLayout>{children}</ClientLayout> : null}
      </body>
    </html>
  );
}
