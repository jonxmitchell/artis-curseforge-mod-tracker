// src/app/webhook-templates/page.jsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner, Tabs, Tab, Select, SelectItem } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/tauri";
import WebhookEditor from "@/components/WebhookEditor";
import { MessageSquare } from "lucide-react";

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
      const [webhooksData, defaultTemplateData] = await Promise.all([
        invoke("get_webhooks"),
        invoke("get_webhook_template", { webhookId: -1 }), // Special ID for default template
      ]);
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Spinner size="lg" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8 text-danger">
          {error}
          <Button color="primary" variant="light" onClick={loadData} className="mt-4">
            Try Again
          </Button>
        </div>
      );
    }

    if (selectedTab === "default" && defaultTemplate) {
      return (
        <Card>
          <CardBody>
            <h2 className="text-xl font-bold mb-4">Default Template</h2>
            <p className="text-sm text-default-500 mb-4">This template will be used for all webhooks unless they have a custom template enabled.</p>
            <WebhookEditor template={defaultTemplate} onSave={handleSaveTemplate} isDefault={true} />
          </CardBody>
        </Card>
      );
    }

    if (selectedTab === "custom") {
      if (!webhooks || webhooks.length === 0) {
        return <div className="text-center p-8 border border-dashed rounded-lg">No webhooks found. Add webhooks first to customize their templates!</div>;
      }

      return (
        <div className="space-y-6">
          <Card>
            <CardBody>
              <Select label="Select Webhook" placeholder="Choose a webhook to customize" selectedKeys={selectedWebhook ? [selectedWebhook.id.toString()] : []} onChange={(e) => handleWebhookSelect(e.target.value)}>
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

          {selectedWebhook && (
            <Card>
              <CardBody>
                <h2 className="text-xl font-bold mb-4">Template for {selectedWebhook.name}</h2>
                <WebhookEditor webhook={selectedWebhook} onSave={handleSaveTemplate} isDefault={false} />
              </CardBody>
            </Card>
          )}

          {!selectedWebhook && <div className="text-center p-8 border border-dashed rounded-lg">Select a webhook above to customize its template.</div>}
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Webhook Templates</h1>
      </div>

      <Tabs selectedKey={selectedTab} onSelectionChange={setSelectedTab} className="mb-6">
        <Tab key="default" title="Default Template" />
        <Tab key="custom" title="Custom Templates" />
      </Tabs>

      {renderContent()}
    </div>
  );
}
