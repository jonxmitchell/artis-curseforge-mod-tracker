"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardBody, Button, Chip, Tooltip, CircularProgress } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import UpdateCountdown from "@/components/UpdateCountdown";
import { ArrowUpRight, Package2, Webhook, Clock, Settings as SettingsIcon, Gamepad2, AlertTriangle, X, RefreshCw, Info, Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import Settings from "@/components/Settings";
import { useRouter } from "next/navigation";
import AddModModal from "@/components/AddModModal";
import { useModUpdateChecker } from "@/hooks/useModUpdateChecker";
import RecentActivity from "@/components/RecentActivity";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

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

  const groupedMods = useMemo(() => {
    const groups = new Map();
    mods.forEach((mod) => {
      const game = mod.mod_info?.game_name || mod.game_name;
      if (!groups.has(game)) groups.set(game, []);
      groups.get(game).push(mod);
    });
    return groups;
  }, [mods]);

  const stats = useMemo(
    () => ({
      totalMods: mods.length,
      totalWebhooks: webhooks.length,
      totalGames: groupedMods.size,
    }),
    [mods.length, webhooks.length, groupedMods.size]
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
              <Card className="flex-1 bg-content1/70 backdrop-blur-md">
                <CardHeader className="shrink-0 flex justify-between items-center px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Package2 size={24} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Tracked Mods</h2>
                      <p className="text-small text-default-500">By game category</p>
                    </div>
                  </div>
                  <Button color="primary" variant="light" endContent={<ArrowUpRight size={16} />} onPress={() => router.push("/mods")}>
                    View All
                  </Button>
                </CardHeader>
                <CardBody className="overflow-hidden p-0">
                  <AnimatePresence>
                    {groupedMods.size === 0 ? (
                      <EmptyModsState onAdd={() => setIsAddModalOpen(true)} />
                    ) : (
                      <div className="h-full overflow-y-auto px-6 py-4">
                        <div className="space-y-6">
                          {Array.from(groupedMods.entries()).map(([game, gameMods]) => (
                            <motion.div key={game} variants={fadeInUp} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-secondary/10">
                                  <Gamepad2 size={16} className="text-secondary" />
                                </div>
                                <p className="font-medium text-default-700">{game}</p>
                                <div className="h-[1px] flex-1 bg-default-200/30 mx-2" />
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  classNames={{
                                    base: "bg-secondary/10",
                                    content: "text-tiny font-medium text-secondary",
                                  }}
                                >
                                  {gameMods.length} {gameMods.length === 1 ? "mod" : "mods"}
                                </Chip>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {gameMods.map((mod) => {
                                  const modName = mod.mod_info?.name || mod.name;
                                  const modId = mod.mod_info?.id || mod.id;
                                  return <ModCard key={modId} name={modName} onClick={() => router.push("/mods")} />;
                                })}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </CardBody>
              </Card>
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

function EmptyModsState({ onAdd }) {
  return (
    <motion.div className="flex flex-col items-center justify-center h-full p-6" variants={fadeInUp}>
      <div className="p-4 rounded-full bg-primary/10 mb-4">
        <Package2 size={32} className="text-primary" />
      </div>
      <p className="text-lg font-medium mb-2">No mods tracked yet</p>
      <Button color="primary" variant="flat" onPress={onAdd} startContent={<Plus size={18} />}>
        Add Your First Mod
      </Button>
    </motion.div>
  );
}

function ModCard({ name, onClick }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="group">
      <Button variant="flat" className="w-full justify-start h-auto py-3 px-4 bg-content2/40 hover:bg-content2/80" onClick={onClick}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20">
            <Package2 size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-default-700">{name}</p>
            <p className="text-tiny text-default-500">Last checked: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </Button>
    </motion.div>
  );
}

function QuickStartGuide({ onDismiss }) {
  const steps = ["Add your CurseForge API key in Settings", 'Go to the Mods page and click "Add Mod"', "Enter the CurseForge mod ID", "Set up Discord webhooks to receive notifications"];

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="shrink-0">
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10">
                <Info size={24} className="text-success" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Quick Start Guide</h3>
                <p className="text-small text-default-500">Get started in 4 steps</p>
              </div>
            </div>
            <Button isIconOnly size="sm" variant="light" onPress={onDismiss} className="text-default-400 hover:text-default-600">
              <X size={20} />
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-6">
          <motion.ol className="space-y-4">
            {steps.map((step, index) => (
              <motion.li key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">{index + 1}</div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{step}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </CardBody>
      </Card>
    </motion.div>
  );
}
