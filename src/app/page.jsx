"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button, Chip } from "@nextui-org/react";
import UpdateCountdown from "@/components/UpdateCountdown";
import { ArrowUpRight, Package2, Webhook, Clock, Settings as SettingsIcon, Gamepad2, AlertTriangle, X, RefreshCw } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import Settings from "@/components/Settings";
import { useRouter } from "next/navigation";
import AddModModal from "@/components/AddModModal";
import { useModUpdateChecker } from "@/hooks/useModUpdateChecker";
import RecentActivity from "@/components/RecentActivity";

export default function DashboardPage() {
  const router = useRouter();
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

  useEffect(() => {
    let unlisten;

    const setup = async () => {
      // Setup event listener for interval changes
      unlisten = await listen("update_interval_changed", (event) => {
        setUpdateInterval(event.payload.interval);
      });

      await loadData();
    };

    setup();

    // Cleanup listener on unmount
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
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMod = async (curseforgeId, apiKey) => {
    const newMod = await invoke("add_mod", { curseforgeId, apiKey });
    setMods((prevMods) => [...prevMods, newMod]);
  };

  const handleManualCheck = async () => {
    await checkForUpdates(updateInterval, (latestMods, updatesFound) => {
      setMods(latestMods);
      setLastChecked(new Date());
    });
  };

  const getModsByGame = () => {
    const gameMap = new Map();
    mods.forEach((mod) => {
      const game = mod.mod_info ? mod.mod_info.game_name : mod.game_name;
      if (!gameMap.has(game)) {
        gameMap.set(game, []);
      }
      gameMap.get(game).push(mod);
    });
    return gameMap;
  };

  const handleHideQuickStart = async () => {
    try {
      await invoke("set_show_quick_start", { show: false });
      setShowQuickStart(false);
    } catch (error) {
      console.error("Failed to update quick start preference:", error);
    }
  };

  const formatInterval = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading dashboard...</div>;
  }

  if (error || updateError) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-danger mb-4" />
        <p className="text-danger">{error || updateError}</p>
        <Button color="primary" variant="light" className="mt-4" onPress={loadData}>
          Retry
        </Button>
      </div>
    );
  }

  const gameMap = getModsByGame();
  const stats = {
    totalMods: mods.length,
    totalWebhooks: webhooks.length,
    totalGames: gameMap.size,
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button color="primary" variant="flat" startContent={<RefreshCw size={20} className={isChecking ? "animate-spin" : ""} />} onPress={handleManualCheck} isLoading={isChecking} isDisabled={isChecking || mods.length === 0}>
            Check Updates
          </Button>
          <Button color="primary" variant="ghost" startContent={<SettingsIcon size={20} />} onPress={() => setIsSettingsOpen(true)}>
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Package2 size={20} className="text-primary" />
              <div>
                <p className="text-sm font-medium">Tracked Mods</p>
                <p className="text-2xl font-bold">{stats.totalMods}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Gamepad2 size={20} className="text-primary" />
              <div>
                <p className="text-sm font-medium">Games Tracked</p>
                <p className="text-2xl font-bold">{stats.totalGames}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="py-3">
            <div className="flex items-center gap-2">
              <Webhook size={20} className="text-primary" />
              <div>
                <p className="text-sm font-medium">Active Webhooks</p>
                <p className="text-2xl font-bold">{stats.totalWebhooks}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <UpdateCountdown interval={updateInterval} />
      </div>

      <Card className="mb-6">
        <CardBody className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Clock size={20} className="text-default-500" />
            <div>
              <p className="text-sm text-default-500">Update Interval</p>
              <p>Checking every {formatInterval(updateInterval)}</p>
            </div>
          </div>
          {lastChecked && (
            <div className="text-right">
              <p className="text-sm text-default-500">Last Checked</p>
              <p>{lastChecked.toLocaleString()}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex gap-2">
              <Package2 size={24} className="text-primary" />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-md font-bold">Tracked Mods</p>
                    <p className="text-small text-default-500">By game</p>
                  </div>
                  <Button size="sm" color="primary" variant="ghost" onPress={() => router.push("/mods")}>
                    View All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {gameMap.size === 0 ? (
                <div className="text-center text-default-500">
                  <p>No mods being tracked yet</p>
                  <Button color="primary" variant="flat" size="sm" className="mt-2" onPress={() => setIsAddModalOpen(true)}>
                    Add Your First Mod
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from(gameMap.entries()).map(([game, gameMods]) => (
                    <div key={game} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Gamepad2 size={16} className="text-default-500" />
                        <h3 className="font-medium">{game}</h3>
                      </div>
                      <div className="ml-6 flex flex-wrap gap-2">
                        {gameMods.map((mod) => (
                          <Chip
                            key={mod.mod_info ? mod.mod_info.id : mod.id}
                            variant="flat"
                            size="sm"
                            classNames={{
                              base: "cursor-pointer transition-all",
                              content: "text-default-600",
                            }}
                            onClick={() => router.push("/mods")}
                          >
                            {mod.mod_info ? mod.mod_info.name : mod.name}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          {showQuickStart && (
            <Card>
              <CardHeader className="flex gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <ArrowUpRight size={24} className="text-primary" />
                  <div>
                    <p className="text-md font-bold">Quick Start</p>
                    <p className="text-small text-default-500">Track your first mod</p>
                  </div>
                </div>
                <Button isIconOnly size="sm" variant="light" onPress={handleHideQuickStart} className="text-default-400 hover:text-default-600">
                  <X size={20} />
                </Button>
              </CardHeader>
              <CardBody>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Add your CurseForge API key in Settings</li>
                  <li>Go to the Mods page and click "Add Mod"</li>
                  <li>Enter the CurseForge mod ID</li>
                  <li>Set up Discord webhooks to receive notifications</li>
                </ol>
              </CardBody>
            </Card>
          )}

          <RecentActivity />
        </div>
      </div>

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
