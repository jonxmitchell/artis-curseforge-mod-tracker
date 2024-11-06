"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardBody, Button, Tooltip, CircularProgress } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import UpdateCountdown from "@/components/UpdateCountdown";
import { Package2, Webhook, Clock, Settings as SettingsIcon, Gamepad2, AlertTriangle, RefreshCw } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import Settings from "@/components/Settings";
import { useRouter } from "next/navigation";
import AddModModal from "@/components/AddModModal";
import { useModUpdateChecker } from "@/hooks/useModUpdateChecker";
import RecentActivity from "@/components/RecentActivity";
import TrackedMods from "@/components/TrackedMods";
import QuickStartGuide from "@/components/QuickStartGuide";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function StatsCard({ title, value, icon: Icon, color, onClick }) {
  return (
    <Card isPressable={!!onClick} onPress={onClick} className="bg-content1/50 backdrop-blur-md transition-all duration-300">
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-${color}/10`}>
            <Icon size={24} className={`text-${color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-default-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function DashboardPage() {
  const [mods, setMods] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(30);
  const [lastChecked, setLastChecked] = useState(null);
  const [showQuickStart, setShowQuickStart] = useState(true);
  const { isChecking, error: updateError, checkForUpdates } = useModUpdateChecker();
  const router = useRouter();

  useEffect(() => {
    let unlisten;
    const setup = async () => {
      unlisten = await listen("update_interval_changed", (event) => {
        setUpdateInterval(event.payload.interval);
      });
      await loadData();
    };
    setup();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [modsData, webhooksData, interval, quickStartVisible] = await Promise.all([invoke("get_mods"), invoke("get_webhooks"), invoke("get_update_interval"), invoke("get_show_quick_start")]);
      setMods(modsData || []);
      setWebhooks(webhooksData || []);
      setUpdateInterval(interval);
      setShowQuickStart(quickStartVisible);
      setLastChecked(new Date());
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMod = async (curseforgeId, apiKey) => {
    const newMod = await invoke("add_mod", { curseforgeId, apiKey });
    setMods((prevMods) => [...prevMods, newMod]);
  };

  const handleManualCheck = async () => {
    await checkForUpdates(updateInterval, (latestMods) => {
      setMods(latestMods);
      setLastChecked(new Date());
    });
  };

  const stats = useMemo(
    () => ({
      totalMods: mods.length,
      totalWebhooks: webhooks.length,
      totalGames: new Set(mods.map((mod) => (mod.mod_info || mod).game_name)).size,
    }),
    [mods, webhooks]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-background/60 backdrop-blur-sm">
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <CircularProgress size="lg" color="primary" aria-label="Loading" />
          <p className="text-lg font-medium text-default-600">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error || updateError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-background/60 backdrop-blur-sm">
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <AlertTriangle className="h-16 w-16 text-danger" />
          <p className="text-xl font-medium text-danger">{error || updateError}</p>
          <Button color="primary" variant="shadow" onPress={loadData} startContent={<RefreshCw size={18} />}>
            Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <motion.div className="h-full" initial="initial" animate="animate" variants={fadeInUp}>
        <div className="h-full w-full mx-auto flex flex-col gap-6">
          {/* Header */}
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dashboard</h1>
              {lastChecked && (
                <Tooltip content="Last update check">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-default-100 text-sm">
                    <Clock size={14} className="text-default-500" />
                    {lastChecked.toLocaleTimeString()}
                  </div>
                </Tooltip>
              )}
            </div>
            <div className="flex gap-3">
              <Button className="group" color="primary" variant="flat" startContent={<RefreshCw size={18} className={`${isChecking ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />} onPress={handleManualCheck} isLoading={isChecking} isDisabled={isChecking || mods.length === 0}>
                Check Updates
              </Button>
              <Button color="primary" variant="solid" startContent={<SettingsIcon size={18} />} onPress={() => setIsSettingsOpen(true)}>
                Settings
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 shrink-0">
            <StatsCard title="Tracked Mods" value={stats.totalMods} icon={Package2} color="primary" onClick={() => router.push("/mods")} />
            <StatsCard title="Games" value={stats.totalGames} icon={Gamepad2} color="secondary" />
            <StatsCard title="Webhooks" value={stats.totalWebhooks} icon={Webhook} color="success" onClick={() => router.push("/webhooks")} />
            <UpdateCountdown interval={updateInterval} />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-3 gap-6 h-full min-h-0">
            {/* Mods Section */}
            <div className="col-span-2 h-full flex flex-col min-h-0">
              <TrackedMods mods={mods} onAddMod={() => setIsAddModalOpen(true)} />
            </div>

            {/* Activity Section */}
            <div className="h-full flex flex-col gap-4 min-h-0">
              <AnimatePresence>{showQuickStart && <QuickStartGuide onDismiss={() => setShowQuickStart(false)} />}</AnimatePresence>
              <Card className="flex-1 bg-content1/50 backdrop-blur-md min-h-0">
                <RecentActivity />
              </Card>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AddModModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMod}
        onOpenSettings={() => {
          setIsAddModalOpen(false);
          setIsSettingsOpen(true);
        }}
      />
    </div>
  );
}
