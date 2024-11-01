"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Tab, Tabs, Button, Divider } from "@nextui-org/react";
import { Settings, AlertTriangle, Clock, Package2, Bell, BarChart3 } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import ModCard from "@/components/ModCard";
import AddModModal from "@/components/AddModModal";
import SettingsModal from "@/components/Settings";
import WebhookAssignModal from "@/components/WebhookAssignModal";

export default function DashboardPage() {
  const [mods, setMods] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModId, setSelectedModId] = useState(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(30);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [modsData, webhooksData, interval] = await Promise.all([invoke("get_mods"), invoke("get_webhooks"), invoke("get_update_interval")]);
      setMods(modsData || []);
      setWebhooks(webhooksData || []);
      setUpdateInterval(interval);
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

  const handleDeleteMod = async (modId) => {
    await invoke("delete_mod", { modId });
    setMods((prevMods) => prevMods.filter((mod) => (mod.mod_info ? mod.mod_info.id : mod.id) !== modId));
  };

  const handleCheckUpdate = async (mod) => {
    const modInfo = mod.mod_info || mod;
    const result = await invoke("check_mod_update", {
      modId: modInfo.id,
      curseforgeId: modInfo.curseforge_id,
      currentLastUpdated: modInfo.last_updated,
      apiKey: await invoke("get_api_key"),
    });

    if (result) {
      const updatedMods = await invoke("get_mods");
      setMods(updatedMods);
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

  const renderStats = () => {
    const totalMods = mods.length;
    const totalWebhooks = webhooks.length;
    const gameMap = getModsByGame();
    const totalGames = gameMap.size;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Package2 className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-default-500">Total Mods</p>
              <p className="text-2xl font-bold">{totalMods}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary/10">
              <Bell className="text-secondary" size={24} />
            </div>
            <div>
              <p className="text-sm text-default-500">Active Webhooks</p>
              <p className="text-2xl font-bold">{totalWebhooks}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <BarChart3 className="text-success" size={24} />
            </div>
            <div>
              <p className="text-sm text-default-500">Games Tracked</p>
              <p className="text-2xl font-bold">{totalGames}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  };

  const renderGameSection = (gameName, gameMods) => (
    <div key={gameName} className="mb-6">
      <h2 className="text-xl font-semibold mb-4">{gameName}</h2>
      <div className="space-y-4">
        {gameMods.map((mod) => (
          <ModCard
            key={mod.mod_info ? mod.mod_info.id : mod.id}
            mod={mod.mod_info || mod}
            onDelete={handleDeleteMod}
            onUpdate={() => handleCheckUpdate(mod)}
            onManageWebhooks={(modId) => {
              setSelectedModId(modId);
              setIsWebhookModalOpen(true);
            }}
          />
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
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

    return (
      <>
        {renderStats()}

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

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tracked Mods</h1>
          <div className="flex gap-2">
            <Button color="primary" onPress={() => setIsAddModalOpen(true)}>
              Add Mod
            </Button>
            <Button isIconOnly variant="flat" onPress={() => setIsSettingsOpen(true)}>
              <Settings size={20} />
            </Button>
          </div>
        </div>

        {mods.length === 0 ? (
          <Card>
            <CardBody className="py-8 text-center">
              <Package2 className="mx-auto h-12 w-12 text-default-500 mb-4" />
              <p className="text-default-500">No mods are being tracked yet.</p>
              <Button color="primary" className="mt-4" onPress={() => setIsAddModalOpen(true)}>
                Add Your First Mod
              </Button>
            </CardBody>
          </Card>
        ) : (
          Array.from(gameMap.entries()).map(([game, gameMods]) => renderGameSection(game, gameMods))
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto max-w-5xl">
      {renderContent()}

      <AddModModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMod}
        onOpenSettings={() => {
          setIsAddModalOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <WebhookAssignModal isOpen={isWebhookModalOpen} onClose={() => setIsWebhookModalOpen(false)} modId={selectedModId} />
    </div>
  );
}
