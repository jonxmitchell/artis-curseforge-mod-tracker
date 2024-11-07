"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollShadow, Button } from "@nextui-org/react";
import { Settings, LayoutDashboard, Package2, Webhook, TextCursor, ChevronRight, ChevronLeft, Github } from "lucide-react";
import { useState, useEffect } from "react";
import SettingsModal from "./Settings";
import { open } from "@tauri-apps/api/shell";

const SIDEBAR_STATE_KEY = "sidebar_collapsed_state";
const APP_VERSION = "v0.0.1";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SIDEBAR_STATE_KEY) === "true";
    }
    return false;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, isCollapsed.toString());
  }, [isCollapsed]);

  const handleExternalLink = async (url) => {
    try {
      await open(url);
    } catch (error) {
      console.error("Failed to open external link:", error);
    }
  };

  const menuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={22} />,
      path: "/",
    },
    {
      key: "mods",
      label: "Mods",
      icon: <Package2 size={22} />,
      path: "/mods",
    },
    {
      key: "webhooks",
      label: "Webhooks",
      icon: <Webhook size={22} />,
      path: "/webhooks",
    },
    {
      key: "webhook-templates",
      label: "Templates",
      icon: <TextCursor size={22} />,
      path: "/webhook-templates",
    },
  ];

  const getCurrentRoute = () => {
    return pathname === "/" ? "dashboard" : pathname.substring(1);
  };

  const sidebarVariants = {
    expanded: {
      width: "16rem",
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 26,
      },
    },
    collapsed: {
      width: "5rem",
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 26,
      },
    },
  };

  const toggleButtonVariants = {
    expanded: {
      rotate: 0,
      transition: {
        duration: 0.3,
      },
    },
    collapsed: {
      rotate: 180,
      transition: {
        duration: 0.3,
      },
    },
  };

  const contentVariants = {
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        delay: 0.1,
      },
    },
    hidden: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <>
      <motion.div initial={false} animate={isCollapsed ? "collapsed" : "expanded"} variants={sidebarVariants} className="relative h-screen border-r border-divider bg-background/60 backdrop-blur-lg flex flex-col">
        {/* Toggle Button */}
        <motion.div className="absolute -right-3 top-6 z-50" animate={isCollapsed ? "collapsed" : "expanded"} variants={toggleButtonVariants}>
          <Button isIconOnly variant="flat" className="bg-background border border-divider shadow-lg hover:scale-105 transition-transform" size="sm" onPress={() => setIsCollapsed(!isCollapsed)}>
            <ChevronLeft size={16} />
          </Button>
        </motion.div>

        {/* Header */}
        <div className="p-4 border-b border-divider shrink-0">
          <div className="flex items-center gap-3">
            <motion.div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Package2 size={20} className="text-primary" />
            </motion.div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div initial="hidden" animate="visible" exit="hidden" variants={contentVariants} className="flex flex-col">
                  <h1 className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Mod Tracker</h1>
                  <span className="text-xs text-default-500">{APP_VERSION}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <ScrollShadow className="flex-1 overflow-y-auto">
          <nav className="p-2 space-y-2">
            {menuItems.map((item) => {
              const isActive = getCurrentRoute() === item.key;
              return (
                <motion.button
                  key={item.key}
                  onClick={() => router.push(item.path)}
                  className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive ? "bg-primary/10 text-primary" : "hover:bg-default-100 text-default-600 hover:text-default-900"}
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div className={`shrink-0 ${isActive ? "text-primary" : "text-default-500 group-hover:text-default-700"}`} whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }}>
                    {item.icon}
                  </motion.div>
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.div initial="hidden" animate="visible" exit="hidden" variants={contentVariants} className="flex flex-1 items-center justify-between">
                        <span className="font-medium">{item.label}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!isCollapsed && isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </ScrollShadow>

        {/* Footer */}
        <div className="p-4 border-t border-divider space-y-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="soft" className="w-full justify-start" startContent={<Settings size={20} className="text-default-500" />} onPress={() => setIsSettingsOpen(true)}>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span className="font-medium" initial="hidden" animate="visible" exit="hidden" variants={contentVariants}>
                    Settings
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div initial="hidden" animate="visible" exit="hidden" variants={contentVariants}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="light" className="w-full justify-start gap-3" startContent={<Github size={20} className="text-default-500" />} onPress={() => handleExternalLink("https://github.com/jonxmitchell/artis-curseforge-mod-tracker")}>
                    <span className="font-medium">GitHub</span>
                  </Button>
                </motion.div>

                <div className="pt-2 text-center">
                  <p className="text-xs text-default-500">
                    Developed by{" "}
                    <Button as="span" variant="light" className="p-0 h-auto min-w-0 text-primary hover:text-primary-500 transition-colors" onPress={() => handleExternalLink("https://discord.gg/sGgerkNSWQ")}>
                      arti.artificial
                    </Button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
