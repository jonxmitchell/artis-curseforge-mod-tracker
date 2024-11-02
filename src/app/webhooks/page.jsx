"use client";

import React, { useState, useEffect } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input } from "@nextui-org/react";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import WebhookCard from "@/components/WebhookCard";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    username: "",
    avatar_url: "",
    enabled: true,
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const webhooksData = await invoke("get_webhooks");
      setWebhooks(webhooksData || []);
    } catch (error) {
      console.error("Failed to load webhooks:", error);
      setError("Failed to load webhooks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWebhook = async () => {
    try {
      const addedWebhook = await invoke("add_webhook", { webhook: newWebhook });
      setWebhooks((prevWebhooks) => [...prevWebhooks, addedWebhook]);
      setIsAddModalOpen(false);
      setNewWebhook({
        name: "",
        url: "",
        username: "",
        avatar_url: "",
        enabled: true,
      });
    } catch (error) {
      console.error("Failed to add webhook:", error);
      setError("Failed to add webhook. Please try again.");
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    try {
      await invoke("delete_webhook", { webhookId });
      setWebhooks((prevWebhooks) => prevWebhooks.filter((webhook) => webhook.id !== webhookId));
    } catch (error) {
      console.error("Failed to delete webhook:", error);
    }
  };

  const handleUpdateWebhook = async (updatedWebhook) => {
    try {
      await invoke("update_webhook", { webhook: updatedWebhook });
      setWebhooks((prevWebhooks) => prevWebhooks.map((webhook) => (webhook.id === updatedWebhook.id ? updatedWebhook : webhook)));
    } catch (error) {
      console.error("Failed to update webhook:", error);
      throw error; // Propagate error to WebhookCard for handling
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-8">Loading webhooks...</div>;
    }

    if (error) {
      return <div className="text-center p-8 text-danger">{error}</div>;
    }

    if (!webhooks || webhooks.length === 0) {
      return <div className="text-center p-8 border border-dashed rounded-lg">No webhooks configured. Add your first webhook to get started!</div>;
    }

    return (
      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <WebhookCard key={webhook.id} webhook={webhook} onDelete={handleDeleteWebhook} onUpdate={handleUpdateWebhook} />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Discord Webhooks</h1>
        <Button color="primary" startContent={<Plus size={20} />} onPress={() => setIsAddModalOpen(true)}>
          Add Webhook
        </Button>
      </div>

      {renderContent()}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Add New Webhook</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input label="Name" placeholder="Enter webhook name" value={newWebhook.name} onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })} />
              <Input label="Discord Webhook URL" placeholder="Enter Discord webhook URL" value={newWebhook.url} onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })} />
              <Input label="Bot Username (optional)" placeholder="Custom username for the webhook" value={newWebhook.username} onChange={(e) => setNewWebhook({ ...newWebhook, username: e.target.value })} />
              <Input label="Avatar URL (optional)" placeholder="Custom avatar URL for the webhook" value={newWebhook.avatar_url} onChange={(e) => setNewWebhook({ ...newWebhook, avatar_url: e.target.value })} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleAddWebhook} isDisabled={!newWebhook.name || !newWebhook.url}>
              Add Webhook
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
