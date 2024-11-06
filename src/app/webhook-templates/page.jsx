"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Button, CircularProgress, Tabs, Tab, Select, SelectItem, ScrollShadow } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/tauri";
import { motion, AnimatePresence } from "framer-motion";
import WebhookEditor from "@/components/WebhookEditor";
import { MessageSquare, AlertTriangle, RefreshCw, FileCode, Bot } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function WebhookTemplatesPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [defaultTemplate, setDefaultTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("default");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [webhooksData, defaultTemplateData] = await Promise.all([invoke("get_webhooks"), invoke("get_webhook_template", { webhookId: -1 })]);
      setWebhooks(webhooksData || []);
      setDefaultTemplate(defaultTemplateData);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load templates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    await loadData();
  };

  const handleWebhookSelect = (value) => {
    const webhook = webhooks.find((w) => w.id.toString() === value);
    setSelectedWebhook(webhook || null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-background/60 backdrop-blur-sm">
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <CircularProgress size="lg" color="primary" aria-label="Loading" />
          <p className="text-lg font-medium text-default-600">Loading templates...</p>
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
          <Button color="primary" variant="shadow" onPress={loadData} startContent={<RefreshCw size={18} />}>
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Webhook Templates</h1>
              {webhooks.length > 0 && (
                <div className="px-3 py-1 rounded-full bg-primary/10">
                  <span className="text-sm text-primary font-medium">
                    {webhooks.length} {webhooks.length === 1 ? "Template" : "Templates"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={setSelectedTab}
            variant="underlined"
            classNames={{
              tabList: "gap-6",
              cursor: "bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary",
            }}
          >
            <Tab
              key="default"
              title={
                <div className="flex items-center gap-2">
                  <FileCode size={18} />
                  <span>Default Template</span>
                </div>
              }
            />
            <Tab
              key="custom"
              title={
                <div className="flex items-center gap-2">
                  <Bot size={18} />
                  <span>Custom Templates</span>
                </div>
              }
            />
          </Tabs>

          {/* Content */}
          <ScrollShadow className="flex-1 min-h-0" hideScrollBar>
            <AnimatePresence mode="wait">
              {selectedTab === "default" && defaultTemplate ? (
                <motion.div {...fadeInUp}>
                  <Card className="bg-content1/50 backdrop-blur-md">
                    <CardBody className="gap-4">
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold">Default Template</h2>
                        <p className="text-sm text-default-500">This template will be used for all webhooks unless they have a custom template enabled.</p>
                      </div>
                      <WebhookEditor template={defaultTemplate} onSave={handleSaveTemplate} isDefault={true} />
                    </CardBody>
                  </Card>
                </motion.div>
              ) : (
                selectedTab === "custom" && (
                  <motion.div className="space-y-6" {...fadeInUp}>
                    {webhooks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                        <div className="p-4 rounded-full bg-primary/10 mb-4">
                          <Bot size={24} className="text-primary" />
                        </div>
                        <p className="text-default-600">No webhooks found. Add webhooks first to customize their templates!</p>
                      </div>
                    ) : (
                      <>
                        <Card className="bg-content1/50 backdrop-blur-md">
                          <CardBody>
                            <Select
                              label="Select Webhook"
                              placeholder="Choose a webhook to customize"
                              selectedKeys={selectedWebhook ? [selectedWebhook.id.toString()] : []}
                              onChange={(e) => handleWebhookSelect(e.target.value)}
                              classNames={{
                                trigger: "bg-content1",
                              }}
                            >
                              {webhooks.map((webhook) => (
                                <SelectItem key={webhook.id.toString()} value={webhook.id} textValue={webhook.name}>
                                  <div className="flex justify-between items-center gap-2">
                                    <span>{webhook.name}</span>
                                    <div className="flex items-center gap-2 text-default-500">
                                      <MessageSquare size={14} />
                                      <span className="text-xs">{webhook.use_custom_template ? "Custom" : "Default"}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </Select>
                          </CardBody>
                        </Card>

                        {selectedWebhook ? (
                          <Card className="bg-content1/50 backdrop-blur-md">
                            <CardBody className="gap-4">
                              <div className="space-y-2">
                                <h2 className="text-xl font-bold">Template for {selectedWebhook.name}</h2>
                                <p className="text-sm text-default-500">Customize how notifications appear for this specific webhook.</p>
                              </div>
                              <WebhookEditor webhook={selectedWebhook} onSave={handleSaveTemplate} isDefault={false} />
                            </CardBody>
                          </Card>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                            <p className="text-default-600">Select a webhook above to customize its template.</p>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </ScrollShadow>
        </div>
      </motion.div>
    </div>
  );
}
