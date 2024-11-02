"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/tauri";

const UPDATE_INTERVALS = [
  { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 360, label: "6 hours" },
  { value: 720, label: "12 hours" },
  { value: 1440, label: "24 hours" },
];

export default function Settings({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState("");
  const [updateInterval, setUpdateInterval] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const [key, interval] = await Promise.all([invoke("get_api_key"), invoke("get_update_interval")]);
      if (key) {
        setApiKey(key);
      }
      setUpdateInterval(interval.toString());
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await Promise.all([invoke("set_api_key", { apiKey }), invoke("set_update_interval", { interval: parseInt(updateInterval) })]);
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
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

              <div>
                <h3 className="text-sm font-medium mb-2">Update Check Interval</h3>
                <Select label="Check for updates every" selectedKeys={[updateInterval]} onChange={(e) => setUpdateInterval(e.target.value)}>
                  {UPDATE_INTERVALS.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </Select>
                <p className="text-xs text-default-400 mt-1">How often the application should check for mod updates.</p>
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
