"use client";

import { useState, useEffect, useMemo } from "react";
import { Button, Tooltip, CircularProgress, ScrollShadow, Card, CardHeader, Chip, Input } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/tauri";
import { Plus, Settings as SettingsIcon, AlertTriangle, RefreshCw, Gamepad2, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import ModCard from "@/components/ModCard";
import AddModModal from "@/components/AddModModal";
import WebhookAssignModal from "@/components/WebhookAssignModal";
import SettingsModal from "@/components/Settings";
import { useModUpdateChecker } from "@/hooks/useModUpdateChecker";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function ModsPage() {
  const [mods, setMods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [selectedModId, setSelectedModId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isChecking, checkForUpdates } = useModUpdateChecker();

  // Filter and group mods based on search query
  const groupedMods = useMemo(() => {
    const filteredMods = mods.filter((mod) => {
      const modInfo = mod.mod_info || mod;
      const searchLower = searchQuery.toLowerCase();
      return modInfo.name.toLowerCase().includes(searchLower) || modInfo.game_name.toLowerCase().includes(searchLower);
    });

    const groups = new Map();

    filteredMods.forEach((mod) => {
      const modInfo = mod.mod_info || mod;
      const gameName = modInfo.game_name;

      if (!groups.has(gameName)) {
        groups.set(gameName, []);
      }

      groups.get(gameName).push(modInfo);
    });

    return Array.from(groups.entries()).sort(([gameA], [gameB]) => gameA.localeCompare(gameB));
  }, [mods, searchQuery]);

  // Get total mod count for search results
  const filteredModCount = useMemo(() => {
    return groupedMods.reduce((total, [_, gameMods]) => total + gameMods.length, 0);
  }, [groupedMods]);

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
    const mod = await invoke("add_mod", { curseforgeId, apiKey });
    setMods((prevMods) => [...prevMods, mod]);
  };

  const handleDeleteMod = async (modId) => {
    try {
      await invoke("delete_mod", { modId });
      setMods((prevMods) => prevMods.filter((mod) => (mod.mod_info ? mod.mod_info.id !== modId : mod.id !== modId)));
    } catch (error) {
      console.error("Failed to delete mod:", error);
      throw error;
    }
  };

  const handleModUpdate = async (modId, curseforgeId, lastUpdated) => {
    try {
      const apiKey = await invoke("get_api_key");
      await invoke("check_mod_update", {
        modId,
        curseforgeId,
        currentLastUpdated: lastUpdated,
        apiKey,
      });
      await loadMods();
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  };

  const openWebhookModal = (modId) => {
    setSelectedModId(modId);
    setIsWebhookModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-background/60 backdrop-blur-sm">
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <CircularProgress size="lg" color="primary" aria-label="Loading" />
          <p className="text-lg font-medium text-default-600">Loading mods...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-background/60 backdrop-blur-sm">
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <AlertTriangle className="h-16 w-16 text-danger" />
          <p className="text-xl font-medium text-danger">{error}</p>
          <Button color="primary" variant="shadow" onPress={loadMods} startContent={<RefreshCw size={18} />}>
            Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <motion.div className="h-full" initial="initial" animate="animate" variants={fadeInUp}>
        <div className="h-full w-full mx-auto flex flex-col gap-6 p-1">
          {/* Header */}
          <div className="flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Tracked Mods</h1>
              {mods.length > 0 && (
                <div className="px-3 py-1 rounded-full bg-primary/10">
                  <span className="text-sm text-primary font-medium">
                    {mods.length} {mods.length === 1 ? "Mod" : "Mods"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button color="primary" startContent={<Plus size={20} />} onPress={() => setIsAddModalOpen(true)}>
                Add Mod
              </Button>
              <Button color="primary" variant="flat" startContent={<SettingsIcon size={20} />} onPress={() => setIsSettingsOpen(true)}>
                Settings
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {mods.length > 0 && (
            <div className="flex gap-4 items-center">
              <Input
                classNames={{
                  base: "w-full max-w-md",
                  inputWrapper: "bg-content1 shadow-sm",
                }}
                placeholder="Search mods or games..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search size={18} className="text-default-400" />}
                isClearable
                onClear={() => setSearchQuery("")}
              />
              {searchQuery && (
                <p className="text-sm text-default-500">
                  Found {filteredModCount} {filteredModCount === 1 ? "mod" : "mods"}
                </p>
              )}
            </div>
          )}

          {/* Mods List */}
          <ScrollShadow className="flex-1 min-h-0" hideScrollBar>
            {!mods || mods.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <p className="text-default-600">No mods tracked yet. Add your first mod to get started!</p>
                  <Button color="primary" className="mt-4" startContent={<Plus size={20} />} onPress={() => setIsAddModalOpen(true)}>
                    Add Mod
                  </Button>
                </div>
              </div>
            ) : groupedMods.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center p-8">
                  <p className="text-default-600">No mods found matching "{searchQuery}"</p>
                  <Button color="primary" variant="light" className="mt-4" onPress={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-6 pr-2">
                  {groupedMods.map(([gameName, gameMods], groupIndex) => (
                    <motion.div key={gameName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: groupIndex * 0.1 }}>
                      <Card className="bg-content1/50 backdrop-blur-md">
                        <CardHeader className="flex justify-between items-center px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-secondary/10">
                              <Gamepad2 size={16} className="text-secondary" />
                            </div>
                            <span className="font-medium text-default-700">{gameName}</span>
                          </div>
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
                        </CardHeader>
                        <div className="px-4 pb-4 space-y-4">
                          {gameMods.map((mod, index) => (
                            <motion.div key={mod.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }}>
                              <ModCard mod={mod} onDelete={handleDeleteMod} onUpdate={() => handleModUpdate(mod.id, mod.curseforge_id, mod.last_updated)} onManageWebhooks={openWebhookModal} />
                            </motion.div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </ScrollShadow>
        </div>
      </motion.div>

      {/* Modals */}
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
