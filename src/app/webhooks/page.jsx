"use client";

import { useState, useEffect, useMemo } from "react";
import { Button, CircularProgress, ScrollShadow, Input } from "@nextui-org/react";
import { Plus, AlertTriangle, RefreshCw, Webhook as WebhookIcon, Search } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { motion, AnimatePresence } from "framer-motion";
import WebhookCard from "@/components/WebhookCard";
import AddWebhookModal from "@/components/AddWebhookModal";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter webhooks based on search
  const filteredWebhooks = useMemo(() => {
    if (!searchQuery.trim()) return webhooks;

    const query = searchQuery.toLowerCase();
    return webhooks.filter((webhook) => webhook.name.toLowerCase().includes(query) || (webhook.username && webhook.username.toLowerCase().includes(query)));
  }, [webhooks, searchQuery]);

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

  const handleAddWebhook = async (webhook) => {
    try {
      const addedWebhook = await invoke("add_webhook", { webhook });
      setWebhooks((prevWebhooks) => [...prevWebhooks, addedWebhook]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to add webhook:", error);
      throw error;
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
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-background/60 backdrop-blur-sm">
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <CircularProgress size="lg" color="primary" aria-label="Loading" />
          <p className="text-lg font-medium text-default-600">Loading webhooks...</p>
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
          <Button color="primary" variant="shadow" onPress={loadWebhooks} startContent={<RefreshCw size={18} />}>
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Discord Webhooks</h1>
              {webhooks.length > 0 && (
                <div className="px-3 py-1 rounded-full bg-primary/10">
                  <span className="text-sm text-primary font-medium">{webhooks.length} Webhooks</span>
                </div>
              )}
            </div>
            <Button color="primary" startContent={<Plus size={20} />} onPress={() => setIsAddModalOpen(true)} variant="shadow">
              Add Webhook
            </Button>
          </div>

          {/* Search Bar - Only show if there are webhooks */}
          {webhooks.length > 0 && (
            <div className="flex items-center gap-4">
              <Input
                classNames={{
                  base: "w-full max-w-md",
                  inputWrapper: "bg-content1 shadow-sm",
                }}
                placeholder="Search webhooks..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search size={18} className="text-default-400" />}
                isClearable
                onClear={() => setSearchQuery("")}
              />
              {searchQuery && (
                <p className="text-sm text-default-500">
                  Found {filteredWebhooks.length} {filteredWebhooks.length === 1 ? "webhook" : "webhooks"}
                </p>
              )}
            </div>
          )}

          {/* Webhooks List */}
          <ScrollShadow className="flex-1 min-h-0" hideScrollBar>
            <AnimatePresence mode="wait">
              {!webhooks || webhooks.length === 0 ? (
                <motion.div className="flex flex-col items-center justify-center h-full" {...fadeInUp}>
                  <div className="text-center p-8 border border-dashed rounded-lg max-w-lg mx-auto">
                    <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                      <WebhookIcon size={24} className="text-primary" />
                    </div>
                    <p className="text-default-600 mb-4">No webhooks configured yet. Add your first webhook to start receiving mod update notifications!</p>
                    <Button color="primary" startContent={<Plus size={20} />} onPress={() => setIsAddModalOpen(true)}>
                      Add Webhook
                    </Button>
                  </div>
                </motion.div>
              ) : filteredWebhooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-center p-8">
                    <p className="text-default-600">No webhooks found matching "{searchQuery}"</p>
                    <Button color="primary" variant="light" className="mt-4" onPress={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pr-2">
                  {filteredWebhooks.map((webhook, index) => (
                    <motion.div key={webhook.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2, delay: index * 0.05 }}>
                      <WebhookCard webhook={webhook} onDelete={handleDeleteWebhook} onUpdate={handleUpdateWebhook} />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollShadow>

          {/* Add Webhook Modal */}
          <AddWebhookModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddWebhook} />
        </div>
      </motion.div>
    </div>
  );
}
