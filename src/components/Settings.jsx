import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Divider } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/tauri";
import { emit } from "@tauri-apps/api/event";
import { Key, Lock, Clock, Eye, EyeOff, AlertCircle, Save, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { open } from "@tauri-apps/api/shell";

const UPDATE_INTERVALS = [
  { value: 1, label: "Every minute" },
  { value: 5, label: "Every 5 minutes" },
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every hour" },
  { value: 120, label: "Every 2 hours" },
  { value: 360, label: "Every 6 hours" },
  { value: 720, label: "Every 12 hours" },
  { value: 1440, label: "Every 24 hours" },
];

export default function Settings({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState("");
  const [updateInterval, setUpdateInterval] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [key, interval] = await Promise.all([invoke("get_api_key"), invoke("get_update_interval")]);
      setApiKey(key || "");
      setUpdateInterval(interval.toString());
    } catch (error) {
      console.error("Failed to load settings:", error);
      setError("Failed to load settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await Promise.all([invoke("set_api_key", { apiKey }), invoke("set_update_interval", { interval: parseInt(updateInterval) })]);
      emit("update_interval_changed", { interval: parseInt(updateInterval) });
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const openApiKeyPage = async () => {
    try {
      await open("https://console.curseforge.com/#/api-keys");
    } catch (error) {
      console.error("Failed to open link:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
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
              <Key size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Settings</h2>
              <p className="text-sm text-default-500">Configure your application preferences</p>
            </div>
          </motion.div>
        </ModalHeader>

        <ModalBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
              {error && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-4 rounded-xl border border-danger-200 bg-danger-50/10 text-danger">
                  <AlertCircle size={18} />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              <div className="space-y-8">
                {/* API Key Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lock size={16} className="text-primary" />
                      <h3 className="text-sm font-medium">CurseForge API Key</h3>
                    </div>
                    <Button size="sm" variant="flat" onPress={openApiKeyPage} endContent={<ExternalLink size={16} />} className="text-primary font-medium bg-primary/10 hover:bg-primary/20">
                      Get API Key
                    </Button>
                  </div>
                  <Input
                    label="API Key"
                    placeholder="Enter your CurseForge API key"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    endContent={
                      <Button isIconOnly variant="light" onPress={() => setShowKey(!showKey)} className="text-default-400 hover:text-primary">
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    }
                    description="Your API key is securely stored and used for all mod operations"
                  />
                </div>

                <Divider />

                {/* Update Interval Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-primary" />
                    <h3 className="text-sm font-medium">Update Check Interval</h3>
                  </div>
                  <Select
                    label="Check Frequency"
                    selectedKeys={[updateInterval]}
                    onChange={(e) => setUpdateInterval(e.target.value)}
                    description="How often the application should check for mod updates"
                    classNames={{
                      base: "max-w-full",
                      mainWrapper: "h-12",
                      trigger: "h-12 bg-default-100/50 hover:bg-default-200/50 transition-background",
                      value: "text-small",
                      label: "text-default-600 font-medium",
                      description: "text-tiny text-default-400",
                    }}
                  >
                    {UPDATE_INTERVALS.map((interval) => (
                      <SelectItem key={interval.value} value={interval.value} className="text-small">
                        {interval.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </motion.div>
          )}
        </ModalBody>

        <ModalFooter className="px-6 py-4">
          <div className="flex gap-2">
            <Button variant="flat" onPress={onClose} className="font-medium bg-default-100 hover:bg-default-200">
              Cancel
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={isSaving} isDisabled={isLoading || !apiKey} className="font-medium bg-primary hover:bg-primary-500" startContent={!isSaving && <Save size={18} />}>
              Save Changes
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
