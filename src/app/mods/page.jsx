"use client";

import { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { Package2, AlertTriangle, Settings } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import ModCard from "@/components/ModCard";
import AddModModal from "@/components/AddModModal";
import SettingsModal from "@/components/Settings";
import WebhookAssignModal from "@/components/WebhookAssignModal";

export default function ModsPage() {
  const [mods, setMods] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModId, setSelectedModId] = useState(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMods();
  }, []);

  const loadMods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const modsData = await invoke("get_mods");
      setMods(modsData || []);
    } catch (error) {
      console.error("Failed to load mods:", error);
      setError("Failed to load mods. Please try again.");
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
      return <div className="text-center p-8">Loading mods...</div>;
    }

    if (error) {
      return (
        <div className="text-center p-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-danger mb-4" />
          <p className="text-danger">{error}</p>
          <Button color="primary" variant="light" className="mt-4" onPress={loadMods}>
            Retry
          </Button>
        </div>
      );
    }

    const gameMap = getModsByGame();

    return (
      <>
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
          <div className="text-center p-8 border border-dashed rounded-lg">
            <Package2 className="mx-auto h-12 w-12 text-default-500 mb-4" />
            <p className="text-default-500">No mods are being tracked yet.</p>
            <Button color="primary" className="mt-4" onPress={() => setIsAddModalOpen(true)}>
              Add Your First Mod
            </Button>
          </div>
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
