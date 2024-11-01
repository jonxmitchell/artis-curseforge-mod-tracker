"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/tauri";

export default function Settings({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadApiKey();
    }
  }, [isOpen]);

  const loadApiKey = async () => {
    try {
      setIsLoading(true);
      const key = await invoke("get_api_key");
      if (key) {
        setApiKey(key);
      }
    } catch (error) {
      console.error("Failed to load API key:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await invoke("set_api_key", { apiKey });
      onClose();
    } catch (error) {
      console.error("Failed to save API key:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="text-center p-4">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">CurseForge API Key</h3>
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your CurseForge API key"
                  endContent={
                    <Button size="sm" variant="light" onPress={() => setShowKey(!showKey)}>
                      {showKey ? "Hide" : "Show"}
                    </Button>
                  }
                />
                <p className="text-xs text-default-400 mt-1">Your API key will be securely stored and used for all mod operations.</p>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSave} isLoading={isSaving} isDisabled={!apiKey}>
            Save Settings
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
