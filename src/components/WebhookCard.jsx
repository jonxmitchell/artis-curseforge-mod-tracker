// src/components/WebhookCard.jsx
"use client";

import { Card, CardBody, Button, Switch, Tooltip } from "@nextui-org/react";
import { Trash2, TestTubes, Bot, Webhook, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export default function WebhookCard({ webhook, onDelete, onUpdate }) {
  const [isTesting, setIsTesting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(webhook.enabled);
  const [useCustomTemplate, setUseCustomTemplate] = useState(webhook.use_custom_template);
  const [testError, setTestError] = useState(null);
  const [testSuccess, setTestSuccess] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    setTestError(null);
    setTestSuccess(false);
    try {
      const success = await invoke("test_webhook", { webhook });
      if (!success) {
        throw new Error("Failed to send test message");
      }
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000); // Clear success after 3 seconds
    } catch (error) {
      console.error("Failed to test webhook:", error);
      setTestError(error.toString());
      setTimeout(() => setTestError(null), 5000); // Clear error after 5 seconds
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggle = async (enabled) => {
    try {
      const updatedWebhook = {
        ...webhook,
        enabled,
      };
      await onUpdate(updatedWebhook);
      setIsEnabled(enabled);
    } catch (error) {
      console.error("Failed to update webhook:", error);
      setIsEnabled(!enabled);
    }
  };

  const handleTemplateToggle = async (useCustom) => {
    try {
      const updatedWebhook = {
        ...webhook,
        use_custom_template: useCustom,
      };

      await onUpdate(updatedWebhook);
      setUseCustomTemplate(useCustom);

      if (!useCustom) {
        await invoke("delete_custom_template", { webhookId: webhook.id });
      }
    } catch (error) {
      console.error("Failed to update template settings:", error);
      setUseCustomTemplate(!useCustom);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(webhook.id);
    } catch (error) {
      console.error("Failed to delete webhook:", error);
    }
  };

  return (
    <Card className="group bg-content1/50 hover:bg-content2/80 transition-background">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-xl ${isEnabled ? "bg-primary/10" : "bg-default-100"}`}>
                <Webhook size={20} className={isEnabled ? "text-primary" : "text-default-400"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{webhook.name}</h3>
                  {webhook.username && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-default-100 rounded-full">
                      <Bot size={14} className="text-default-500" />
                      <span className="text-xs text-default-500 truncate max-w-[200px]">{webhook.username}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Switch
              isSelected={isEnabled}
              onValueChange={handleToggle}
              size="sm"
              classNames={{
                wrapper: "group-data-[selected=true]:bg-primary",
              }}
            >
              {isEnabled ? "Active" : "Disabled"}
            </Switch>
          </div>

          {/* Status Messages */}
          {(testError || testSuccess) && (
            <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${testError ? "bg-danger-50" : "bg-success-50"}`}>
              {testError ? <AlertCircle size={16} className="text-danger" /> : <CheckCircle2 size={16} className="text-success" />}
              <p className={`text-small ${testError ? "text-danger" : "text-success"}`}>{testError || "Test message sent successfully!"}</p>
            </div>
          )}

          {/* URL Preview - Modified for better wrapping */}
          <div className="px-3 py-2 bg-default-50 rounded-lg">
            <p className="text-small text-default-500 font-mono break-all">{webhook.url}</p>
          </div>

          {/* Actions Section */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Tooltip content="Test Webhook">
                <Button variant="flat" color="primary" size="sm" onPress={handleTest} isLoading={isTesting} className="opacity-0 group-hover:opacity-100 transition-opacity" startContent={!isTesting && <TestTubes size={18} />}>
                  Test
                </Button>
              </Tooltip>
              <Tooltip content="Delete Webhook">
                <Button variant="flat" color="danger" size="sm" onPress={handleDelete} className="opacity-0 group-hover:opacity-100 transition-opacity" startContent={<Trash2 size={18} />}>
                  Delete
                </Button>
              </Tooltip>
            </div>

            <div className="flex items-center gap-3">
              <Tooltip content={useCustomTemplate ? "Using custom template" : "Using default template"}>
                <div className="flex items-center gap-2">
                  <Switch
                    size="sm"
                    isSelected={useCustomTemplate}
                    onValueChange={handleTemplateToggle}
                    classNames={{
                      wrapper: "group-data-[selected=true]:bg-secondary",
                    }}
                  >
                    Custom Template
                  </Switch>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
