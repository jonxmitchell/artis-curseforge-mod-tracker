"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Divider } from "@nextui-org/react";
import { Webhook as WebhookIcon, Bot, Image, Plus, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AddWebhookModal({ isOpen, onClose, onAdd, existingWebhooks = [] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    url: "",
    general: "",
  });
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    username: "",
    avatar_url: "",
    enabled: true,
    use_custom_template: false,
  });

  const validateWebhook = () => {
    const newErrors = {
      name: "",
      url: "",
      general: "",
    };

    // Check for empty required fields
    if (!newWebhook.name.trim()) {
      newErrors.name = "Webhook name is required";
    }

    if (!newWebhook.url.trim()) {
      newErrors.url = "Webhook URL is required";
    }

    // Check for duplicate name (case-insensitive)
    const nameExists = existingWebhooks.some((webhook) => webhook.name.toLowerCase() === newWebhook.name.trim().toLowerCase());
    if (nameExists) {
      newErrors.name = "A webhook with this name already exists";
    }

    // Check for duplicate URL
    const urlExists = existingWebhooks.some((webhook) => webhook.url === newWebhook.url.trim());
    if (urlExists) {
      newErrors.url = "This webhook URL is already in use";
    }

    // Validate Discord webhook URL format
    if (newWebhook.url && !newWebhook.url.startsWith("https://discord.com/api/webhooks/")) {
      newErrors.url = "Please enter a valid Discord webhook URL";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const resetForm = () => {
    setNewWebhook({
      name: "",
      url: "",
      username: "",
      avatar_url: "",
      enabled: true,
      use_custom_template: false,
    });
    setErrors({
      name: "",
      url: "",
      general: "",
    });
  };

  const handleAdd = async () => {
    if (!validateWebhook()) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors({ name: "", url: "", general: "" });

      // Trim all string fields
      const webhookToAdd = {
        ...newWebhook,
        name: newWebhook.name.trim(),
        url: newWebhook.url.trim(),
        username: newWebhook.username.trim(),
        avatar_url: newWebhook.avatar_url.trim(),
      };

      await onAdd(webhookToAdd);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to add webhook:", error);

      // Handle specific error cases
      if (error.toString().includes("already exists")) {
        setErrors((prev) => ({
          ...prev,
          name: "A webhook with this name already exists",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          general: "Failed to add webhook. Please try again.",
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
            {errors.general && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-4 rounded-xl border border-danger-200 bg-danger-50/10 text-danger">
                <div className="shrink-0">⚠️</div>
                <p className="text-sm">{errors.general}</p>
              </motion.div>
            )}

            <div className="space-y-6">
              {/* Required Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-primary" />
                  <h3 className="text-sm font-medium">Required Information</h3>
                </div>
                <Input
                  label="Webhook Name"
                  placeholder="Enter a name for this webhook"
                  value={newWebhook.name}
                  onChange={(e) => {
                    setNewWebhook({ ...newWebhook, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  description="A friendly name to identify this webhook"
                  isRequired
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                />
                <Input
                  label="Discord Webhook URL"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={newWebhook.url}
                  onChange={(e) => {
                    setNewWebhook({ ...newWebhook, url: e.target.value });
                    if (errors.url) setErrors({ ...errors, url: "" });
                  }}
                  description="The Discord webhook URL for sending notifications"
                  isRequired
                  isInvalid={!!errors.url}
                  errorMessage={errors.url}
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
            <Button variant="flat" onPress={handleClose} className="font-medium bg-default-100 hover:bg-default-200">
              Cancel
            </Button>
            <Button color="primary" onPress={handleAdd} isLoading={isLoading} isDisabled={!newWebhook.name || !newWebhook.url || isLoading} className="font-medium bg-primary hover:bg-primary-500" startContent={!isLoading && <Plus size={18} />}>
              Add Webhook
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
