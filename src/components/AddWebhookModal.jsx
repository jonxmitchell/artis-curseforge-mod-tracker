"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Divider } from "@nextui-org/react";
import { Webhook as WebhookIcon, Bot, Image, Plus, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AddWebhookModal({ isOpen, onClose, onAdd }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    username: "",
    avatar_url: "",
    enabled: true,
    use_custom_template: false,
  });

  const handleAdd = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (!newWebhook.url.startsWith("https://discord.com/api/webhooks/")) {
      setError("Please enter a valid Discord webhook URL");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await onAdd(newWebhook);
      setNewWebhook({
        name: "",
        url: "",
        username: "",
        avatar_url: "",
        enabled: true,
        use_custom_template: false,
      });
      onClose();
    } catch (error) {
      console.error("Failed to add webhook:", error);
      setError("Failed to add webhook. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
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
              <WebhookIcon size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add New Webhook</h2>
              <p className="text-sm text-default-500">Configure Discord webhook integration</p>
            </div>
          </motion.div>
        </ModalHeader>
        <ModalBody>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {error && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-4 rounded-xl border border-danger-200 bg-danger-50/10 text-danger">
                <div className="shrink-0">⚠️</div>
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            <div className="space-y-6">
              {/* Required Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-primary" />
                  <h3 className="text-sm font-medium">Required Information</h3>
                </div>
                <Input label="Webhook Name" placeholder="Enter a name for this webhook" value={newWebhook.name} onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })} description="A friendly name to identify this webhook" isRequired />
                <Input
                  label="Discord Webhook URL"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  description="The Discord webhook URL for sending notifications"
                  isRequired
                  classNames={{
                    input: "font-mono text-small",
                  }}
                />
              </div>

              <Divider />

              {/* Optional Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-primary" />
                    <h3 className="text-sm font-medium">Optional Settings</h3>
                  </div>
                  <span className="text-xs text-default-400">Customize how notifications appear</span>
                </div>

                <Input label="Bot Username" placeholder="Custom username for the webhook" value={newWebhook.username} onChange={(e) => setNewWebhook({ ...newWebhook, username: e.target.value })} startContent={<Bot size={16} className="text-default-400 shrink-0" />} description="Override the default webhook bot name" />

                <Input label="Avatar URL" placeholder="https://example.com/avatar.png" value={newWebhook.avatar_url} onChange={(e) => setNewWebhook({ ...newWebhook, avatar_url: e.target.value })} startContent={<Image size={16} className="text-default-400 shrink-0" />} description="Custom avatar image URL for the webhook" />
              </div>
            </div>
          </motion.div>
        </ModalBody>

        <ModalFooter className="px-6 py-4">
          <div className="flex gap-2">
            <Button variant="flat" onPress={onClose} className="font-medium bg-default-100 hover:bg-default-200">
              Cancel
            </Button>
            <Button color="primary" onPress={handleAdd} isLoading={isLoading} isDisabled={!newWebhook.name || !newWebhook.url} className="font-medium bg-primary hover:bg-primary-500" startContent={!isLoading && <Plus size={18} />}>
              Add Webhook
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
