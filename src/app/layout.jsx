"use client";

import { NextUIProvider } from "@nextui-org/react";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { UpdateServiceProvider } from "@/contexts/UpdateServiceContext";
import "@/styles/globals.css";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

// Dynamically import components that use Tauri APIs with ssr disabled
const DynamicContextMenu = dynamic(
  () =>
    import("@/hooks/useContextMenu").then((mod) => {
      const Component = () => {
        mod.useContextMenu();
        return null;
      };
      return Component;
    }),
  { ssr: false }
);

const DynamicPreventShortcuts = dynamic(
  () =>
    import("@/hooks/usePreventBrowserShortcuts").then((mod) => {
      const Component = () => {
        mod.usePreventBrowserShortcuts();
        return null;
      };
      return Component;
    }),
  { ssr: false }
);

const DynamicCloseConfirmationModal = dynamic(
  () => import("@/components/CloseConfirmationModal"),
  { ssr: false }
);

function ClientLayout({ children }) {
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    let unlisten;

    const setupWindow = async () => {
      try {
        const { appWindow } = await import("@tauri-apps/api/window");
        const { invoke } = await import("@tauri-apps/api/tauri");

        // Listen for the close requested event
        unlisten = await appWindow.onCloseRequested(async (event) => {
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
      } catch (error) {
        console.error("Error setting up window handlers:", error);
      }
    };

    setupWindow();

    return () => {
      if (unlisten) {
        unlisten.then((fn) => fn());
      }
    };
  }, []);

  const handleMinimizeToTray = async () => {
    try {
      const { appWindow } = await import("@tauri-apps/api/window");
      await appWindow.hide();
      setShowCloseModal(false);
    } catch (error) {
      console.error("Error minimizing to tray:", error);
    }
  };

  const handleQuit = async () => {
    try {
      const { appWindow } = await import("@tauri-apps/api/window");
      await appWindow.close();
    } catch (error) {
      console.error("Error quitting application:", error);
    }
  };

  return (
    <NextUIProvider>
      <UpdateServiceProvider>
        <DynamicContextMenu />
        <DynamicPreventShortcuts />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
        <DynamicCloseConfirmationModal
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
