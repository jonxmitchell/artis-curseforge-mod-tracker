"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@nextui-org/react";
import { Webhook as WebhookIcon, Bot, Image, Plus } from "lucide-react";
import { useState } from "react";

export default function AddWebhookModal({ isOpen, onClose, onAdd }) {
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    username: "",
    avatar_url: "",
    enabled: true,
    use_custom_template: false,
  });

  const handleAdd = async () => {
    try {
      await onAdd(newWebhook);
      setNewWebhook({
        name: "",
        url: "",
        username: "",
        avatar_url: "",
        enabled: true,
        use_custom_template: false,
      });
    } catch (error) {
      console.error("Failed to add webhook:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      classNames={{
        base: "bg-content1",
        header: "border-b border-default-100",
        body: "py-6",
        footer: "border-t border-default-100",
      }}
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <WebhookIcon size={18} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold">Add New Webhook</h2>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-default-600">Required Information</h3>
              <Input
                label="Webhook Name"
                placeholder="Enter a name for this webhook"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                variant="bordered"
                classNames={{
                  label: "text-default-600",
                  inputWrapper: "bg-content1 hover:bg-content2 transition-background",
                }}
                description="A friendly name to identify this webhook"
              />
              <Input
                label="Discord Webhook URL"
                placeholder="https://discord.com/api/webhooks/..."
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                variant="bordered"
                classNames={{
                  label: "text-default-600",
                  inputWrapper: "bg-content1 hover:bg-content2 transition-background font-mono",
                }}
                description="The Discord webhook URL for sending notifications"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-default-600">Optional Settings</h3>
                <span className="text-xs text-default-400">Customize how notifications appear</span>
              </div>
              <Input
                label="Bot Username"
                placeholder="Custom username for the webhook"
                value={newWebhook.username}
                onChange={(e) => setNewWebhook({ ...newWebhook, username: e.target.value })}
                variant="bordered"
                startContent={<Bot size={16} className="text-default-400" />}
                classNames={{
                  label: "text-default-600",
                  inputWrapper: "bg-content1 hover:bg-content2 transition-background",
                }}
                description="Override the default webhook bot name"
              />
              <Input
                label="Avatar URL"
                placeholder="https://example.com/avatar.png"
                value={newWebhook.avatar_url}
                onChange={(e) => setNewWebhook({ ...newWebhook, avatar_url: e.target.value })}
                variant="bordered"
                startContent={<Image size={16} className="text-default-400" />}
                classNames={{
                  label: "text-default-600",
                  inputWrapper: "bg-content1 hover:bg-content2 transition-background",
                }}
                description="Custom avatar image URL for the webhook"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose} className="font-medium">
            Cancel
          </Button>
          <Button color="primary" onPress={handleAdd} isDisabled={!newWebhook.name || !newWebhook.url} className="font-medium" startContent={<Plus size={18} />}>
            Add Webhook
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
