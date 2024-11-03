"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button, Chip } from "@nextui-org/react";
import UpdateCountdown from "@/components/UpdateCountdown";
import { ArrowUpRight, Package2, Webhook, Clock, Bell, Settings as SettingsIcon, Gamepad2, AlertTriangle, X, RefreshCw } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import Settings from "@/components/Settings";
import { useRouter } from "next/navigation";
import AddModModal from "@/components/AddModModal";

export default function DashboardPage() {
  const router = useRouter();
  const [mods, setMods] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(30);
  const [lastChecked, setLastChecked] = useState(null);
  const [showQuickStart, setShowQuickStart] = useState(true);

  useEffect(() => {
    loadData();
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
    try {
      setIsChecking(true);
      setError(null);

      // First, load the latest data
      const latestMods = await invoke("get_mods");
      console.log("Starting update check for", latestMods.length, "mods");

      // Check each mod for updates using the latest data
      for (const mod of latestMods) {
        const modId = mod.mod_info ? mod.mod_info.id : mod.id;
        const curseforgeId = mod.mod_info ? mod.mod_info.curseforge_id : mod.curseforge_id;
        const currentLastUpdated = mod.mod_info ? mod.mod_info.last_updated : mod.last_updated;

        console.log("Checking mod:", {
          modId,
          curseforgeId,
          currentLastUpdated,
        });

        const apiKey = await invoke("get_api_key");
        const updateInfo = await invoke("check_mod_update", {
          modId,
          curseforgeId,
          currentLastUpdated,
          apiKey,
        });

        console.log("Update check result:", updateInfo);

        if (updateInfo) {
          console.log("Update found for mod:", modId);

          // If there's an update, send notifications through enabled webhooks
          const modWebhooks = await invoke("get_mod_assigned_webhooks", { modId });
          console.log("Assigned webhooks:", modWebhooks);

          for (const webhook of modWebhooks) {
            if (webhook.enabled) {
              console.log("Sending notification through webhook:", webhook.id);
              console.log("UpdateInfo data:", updateInfo);
              try {
                const result = await invoke("send_update_notification", {
                  webhook,
                  modName: updateInfo.name,
                  modAuthor: updateInfo.mod_author,
                  newReleaseDate: updateInfo.new_update_time,
                  oldReleaseDate: updateInfo.old_update_time,
                  latestFileName: updateInfo.latest_file_name, // Changed from latest_file_name to latestFileName
                  modId: updateInfo.mod_id,
                });
                console.log("Notification result:", result);
              } catch (error) {
                console.error("Failed to send webhook notification:", error);
                console.error("Webhook data:", webhook);
                console.error("Update info:", updateInfo);
              }
            }
          }
        } else {
          console.log("No update found for mod:", modId);
        }
      }

      // Reset countdown timer
      localStorage.setItem("nextCheckTime", new Date(Date.now() + updateInterval * 60 * 1000).toISOString());

      // Update state with latest data
      setMods(latestMods);
      setLastChecked(new Date());
    } catch (error) {
      console.error("Failed to check for updates:", error);
      setError("Failed to check for updates. Please try again.");
    } finally {
      setIsChecking(false);
    }
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

  if (isLoading) {
    return <div className="text-center p-8">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-danger mb-4" />
        <p className="text-danger">{error}</p>
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
              <p>Checking every {updateInterval} minutes</p>
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

          <Card>
            <CardHeader className="flex gap-2">
              <Clock size={24} className="text-primary" />
              <div>
                <p className="text-md font-bold">Recent Activity</p>
                <p className="text-small text-default-500">Latest mod updates</p>
              </div>
            </CardHeader>
            <CardBody>{stats.totalMods === 0 ? <p className="text-center text-default-500">No mods being tracked yet</p> : <p className="text-center text-default-500">No recent updates</p>}</CardBody>
          </Card>
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
