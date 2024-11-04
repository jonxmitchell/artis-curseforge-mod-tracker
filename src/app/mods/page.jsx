"use client";

import { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import ModCard from "@/components/ModCard";
import AddModModal from "@/components/AddModModal";
import WebhookAssignModal from "@/components/WebhookAssignModal";
import Settings from "@/components/Settings";
import { useModUpdateChecker } from "@/hooks/useModUpdateChecker";

export default function ModsPage() {
  const [mods, setMods] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [selectedModId, setSelectedModId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { checkForUpdates } = useModUpdateChecker();

  useEffect(() => {
    loadMods();
  }, []);

  const loadMods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const modsData = await invoke("get_mods");
      setMods(modsData || []);
    } catch (err) {
      console.error("Failed to load mods:", err);
      setError("Failed to load mods. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMod = async (curseforgeId, apiKey) => {
    try {
      const addedMod = await invoke("add_mod", { curseforgeId, apiKey });
      setMods((prevMods) => [...prevMods, addedMod]);
      return true;
    } catch (error) {
      console.error("Failed to add mod:", error);
      throw error;
    }
  };

  const handleDeleteMod = async (modId) => {
    try {
      await invoke("delete_mod", { modId });
      setMods((prevMods) => {
        const newMods = prevMods.filter((mod) => {
          const currentId = mod.mod_info ? mod.mod_info.id : mod.id;
          return currentId !== modId;
        });
        console.log("Updated mods state:", newMods);
        return newMods;
      });
    } catch (error) {
      console.error("Failed to delete mod:", error);
      // Add user notification here
      throw error;
    }
  };

  const handleUpdateCheck = async (modId) => {
    const mod = mods.find((m) => (m.mod_info ? m.mod_info.id : m.id) === modId);
    if (!mod) return;

    await checkForUpdates();
    await loadMods(); // Reload mods to get updated data
  };

  const handleManageWebhooks = (modId) => {
    setSelectedModId(modId);
    setIsWebhookModalOpen(true);
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading mods...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8 text-danger">
        {error}
        <Button className="mt-4" color="primary" onClick={loadMods}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mods</h1>
        <Button color="primary" startContent={<Plus size={20} />} onPress={() => setIsAddModalOpen(true)}>
          Add Mod
        </Button>
      </div>

      {mods.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">No mods added yet. Add your first mod to get started!</div>
      ) : (
        <div className="space-y-4">
          {mods.map((mod) => {
            const modInfo = mod.mod_info || mod;
            return <ModCard key={modInfo.id} mod={modInfo} onDelete={handleDeleteMod} onUpdate={() => handleUpdateCheck(modInfo.id)} onManageWebhooks={handleManageWebhooks} />;
          })}
        </div>
      )}

      <AddModModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMod}
        onOpenSettings={() => {
          setIsAddModalOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <WebhookAssignModal
        isOpen={isWebhookModalOpen}
        onClose={() => {
          setIsWebhookModalOpen(false);
          setSelectedModId(null);
        }}
        modId={selectedModId}
      />
    </div>
  );
}
