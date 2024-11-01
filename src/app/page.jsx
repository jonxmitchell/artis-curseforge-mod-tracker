"use client";

import { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { Plus, Settings as SettingsIcon } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import ModCard from "@/components/ModCard";
import AddModModal from "@/components/AddModModal";
import WebhookAssignModal from "@/components/WebhookAssignModal";
import Settings from "@/components/Settings";

export default function HomePage() {
  const [mods, setMods] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModId, setSelectedModId] = useState(null);
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
      console.log("Mods data from backend:", modsData);
      setMods(modsData || []);
    } catch (error) {
      console.error("Failed to load mods:", error);
      setError("Failed to load mods. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMod = async (curseforgeId, apiKey) => {
    try {
      await invoke("add_mod", { curseforgeId, apiKey });
      await loadMods(); // Reload all mods
    } catch (error) {
      console.error("Failed to add mod:", error);
      throw error;
    }
  };

  const handleDeleteMod = async (modId) => {
    try {
      await invoke("delete_mod", { modId });
      await loadMods(); // Reload the list after deletion
    } catch (error) {
      console.error("Failed to delete mod:", error);
    }
  };

  const handleCheckUpdate = async (mod) => {
    try {
      const apiKey = await invoke("get_api_key");
      if (!apiKey) {
        setIsSettingsOpen(true);
        return;
      }

      const updateInfo = await invoke("check_mod_update", {
        modId: mod.id,
        curseforgeId: mod.curseforge_id,
        currentLastUpdated: mod.last_updated,
        apiKey,
      });

      if (updateInfo) {
        await loadMods();
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  };

  const handleManageWebhooks = (modId) => {
    setSelectedModId(modId);
    setIsWebhookModalOpen(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-8">Loading mods...</div>;
    }

    if (error) {
      return <div className="text-center p-8 text-danger">{error}</div>;
    }

    if (!mods || mods.length === 0) {
      return <div className="text-center p-8 border border-dashed rounded-lg">No mods are being tracked. Add your first mod to get started!</div>;
    }

    return (
      <div className="space-y-4">
        {mods.map((mod) => (
          <ModCard key={mod.id} mod={mod} onDelete={handleDeleteMod} onUpdate={() => handleCheckUpdate(mod)} onManageWebhooks={handleManageWebhooks} />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tracked Mods</h1>
        <div className="flex gap-2">
          <Button variant="light" isIconOnly onPress={() => setIsSettingsOpen(true)} startContent={<SettingsIcon size={20} />} />
          <Button color="primary" startContent={<Plus size={20} />} onPress={() => setIsAddModalOpen(true)}>
            Add Mod
          </Button>
        </div>
      </div>

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

      <WebhookAssignModal
        isOpen={isWebhookModalOpen}
        onClose={() => {
          setIsWebhookModalOpen(false);
          setSelectedModId(null);
        }}
        modId={selectedModId}
      />

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
