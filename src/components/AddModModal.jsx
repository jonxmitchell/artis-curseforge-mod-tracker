"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Link } from "@nextui-org/react";
import { ExternalLink } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";

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

  const handleAdd = async () => {
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

      // Handle different error cases
      if (!hasApiKey) {
        onOpenSettings();
        return;
      }

      // Set user-friendly error message
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>Add New Mod</ModalHeader>
        <ModalBody>
          {!hasApiKey ? (
            <div className="text-center p-4">
              <p className="text-sm text-default-500 mb-4">Please set your CurseForge API key in settings before adding mods.</p>
              <Button color="primary" onPress={onOpenSettings}>
                Open Settings
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-default-500 mb-2">To find a mod&apos;s ID:</p>
                <ol className="text-sm text-default-500 list-decimal list-inside space-y-1">
                  <li>Go to the mod&apos;s page on CurseForge</li>
                  <li>The ID is the number in the URL after &quot;/projects/&quot;</li>
                </ol>
                <p className="text-sm text-default-500 mt-2">Example: For &quot;https://www.curseforge.com/minecraft/mc-mods/jei/files&quot;, the mod ID is &quot;238222&quot;</p>
              </div>

              <Input
                label="CurseForge Mod ID"
                type="number"
                value={curseforgeId}
                onChange={(e) => setCurseforgeId(e.target.value)}
                placeholder="Enter the mod ID from CurseForge"
                isInvalid={!!error}
                errorMessage={error}
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">#</span>
                  </div>
                }
              />

              <div className="flex justify-end">
                <Link isExternal href="https://www.curseforge.com/minecraft/mc-mods" showAnchorIcon className="text-sm">
                  Browse CurseForge Mods
                </Link>
              </div>
            </div>
          )}
        </ModalBody>
        {hasApiKey && (
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleAdd} isLoading={isLoading} isDisabled={!curseforgeId}>
              Add Mod
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
