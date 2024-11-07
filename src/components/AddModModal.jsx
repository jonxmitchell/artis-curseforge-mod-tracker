"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Link } from "@nextui-org/react";
import { Package2, ExternalLink, AlertCircle, Key, Plus, FileText } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { motion } from "framer-motion";
import { open } from "@tauri-apps/api/shell";

export default function AddModModal({ isOpen, onClose, onAdd, onOpenSettings }) {
  const [curseforgeId, setCurseforgeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      checkApiKey();
      setError(""); // Clear any previous errors
      setCurseforgeId(""); // Reset the input
    }
  }, [isOpen]);

  const checkApiKey = async () => {
    try {
      const key = await invoke("get_api_key");
      setHasApiKey(!!key);
    } catch (error) {
      console.error("Failed to check API key:", error);
      setHasApiKey(false);
    }
  };

  const openCurseForge = async () => {
    try {
      await open("https://www.curseforge.com/");
    } catch (error) {
      console.error("Failed to open CurseForge:", error);
    }
  };

  const handleAdd = async () => {
    if (!curseforgeId.trim()) return;

    setIsLoading(true);
    setError(""); // Clear any previous errors

    try {
      const apiKey = await invoke("get_api_key");
      if (!apiKey) {
        throw new Error("No API key found");
      }
      await onAdd(parseInt(curseforgeId), apiKey);
      onClose();
    } catch (error) {
      console.error("Failed to add mod:", error);

      if (!hasApiKey) {
        onOpenSettings();
        return;
      }

      if (error.toString().includes("already exists")) {
        setError("This mod is already being tracked.");
      } else if (error.toString().includes("not found")) {
        setError("Mod not found on CurseForge. Please check the ID.");
      } else if (error.toString().includes("Failed to fetch")) {
        setError("Failed to connect to CurseForge. Please check your API key.");
      } else {
        setError("Failed to add mod. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      backdrop="blur"
      classNames={{
        backdrop: "bg-background/50 backdrop-blur-sm",
        base: "border border-default-100 bg-content1",
        body: "py-6",
        closeButton: "hover:bg-default-100",
      }}
    >
      <ModalContent>
        <ModalHeader>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Package2 size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add New Mod</h2>
              <p className="text-sm text-default-500">Start tracking a CurseForge mod</p>
            </div>
          </motion.div>
        </ModalHeader>

        <ModalBody>
          {!hasApiKey ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-warning/10">
                <Key size={24} className="text-warning" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-default-600">CurseForge API Key Required</p>
                <p className="text-sm text-default-500">Please set your API key in settings before adding mods.</p>
              </div>
              <Button color="primary" onPress={onOpenSettings} className="font-medium">
                Open Settings
              </Button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {error && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-4 rounded-xl border border-danger-200 bg-danger-50/10 text-danger">
                  <AlertCircle size={18} />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-default-50">
                  <h3 className="text-sm font-medium text-default-600 mb-3">How to find a mod&apos;s ID:</h3>
                  <ol className="space-y-2.5 text-sm text-default-500">
                    <li className="flex items-start gap-2">
                      <span className="font-medium bg-default-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0">1</span>
                      <span>Go to the mod&apos;s page on CurseForge</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium bg-default-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0">2</span>
                      <span>Find the &quot;About Project&quot; section</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium bg-default-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0">3</span>
                      <span>Look for &quot;Project ID&quot; - this is your mod ID</span>
                    </li>
                  </ol>
                  <div className="flex items-center gap-2 mt-4 p-2 rounded-lg bg-default-100">
                    <FileText size={14} className="text-default-500" />
                    <p className="text-xs text-default-500">Project ID can be found in the &quot;About Project&quot; section of any mod page</p>
                  </div>
                </div>

                <Input label="CurseForge Mod ID" placeholder="Enter the Project ID from CurseForge" value={curseforgeId} onChange={(e) => setCurseforgeId(e.target.value)} type="number" isInvalid={!!error} errorMessage={error} startContent={<span className="text-default-400 text-small">#</span>} />

                <div className="flex justify-end">
                  <Button variant="light" onPress={openCurseForge} endContent={<ExternalLink size={16} />} className="text-primary">
                    Browse CurseForge Mods
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </ModalBody>

        {hasApiKey && (
          <ModalFooter className="px-6 py-4">
            <div className="flex gap-2">
              <Button variant="flat" onPress={onClose} className="font-medium bg-default-100 hover:bg-default-200">
                Cancel
              </Button>
              <Button color="primary" onPress={handleAdd} isLoading={isLoading} isDisabled={!curseforgeId.trim()} className="font-medium bg-primary hover:bg-primary-500" startContent={!isLoading && <Plus size={18} />}>
                Add Mod
              </Button>
            </div>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
