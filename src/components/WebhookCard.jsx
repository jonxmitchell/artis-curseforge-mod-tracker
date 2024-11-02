"use client";

import { Card, CardBody, Button, Switch, Tooltip, Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";
import { Trash2, TestTubes, Bot, Settings, MessageSquare } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export default function WebhookCard({ webhook, onDelete, onUpdate }) {
  const [isTesting, setIsTesting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(webhook.enabled);
  const [useCustomTemplate, setUseCustomTemplate] = useState(webhook.use_custom_template);

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const success = await invoke("test_webhook", { webhook });
      // You could add a toast notification here to show success/failure
    } catch (error) {
      console.error("Failed to test webhook:", error);
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
        // Delete custom template when switching back to default
        await invoke("delete_custom_template", { webhookId: webhook.id });
      }
    } catch (error) {
      console.error("Failed to update template settings:", error);
      setUseCustomTemplate(!useCustom); // Revert on error
    }
  };

  return (
    <Card className="w-full">
      <CardBody className="flex flex-row items-center justify-between p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{webhook.name}</h3>
            {webhook.username && (
              <Tooltip content="Discord Username">
                <div className="flex items-center gap-1 text-sm text-default-500">
                  <Bot size={16} />
                  {webhook.username}
                </div>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-default-500 truncate max-w-lg">{webhook.url}</p>
          <div className="flex items-center gap-2 mt-2">
            <MessageSquare size={16} className="text-default-400" />
            <span className="text-sm text-default-400">Using {useCustomTemplate ? "custom" : "default"} template</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            isSelected={isEnabled}
            onValueChange={handleToggle}
            aria-label="Enable webhook"
            classNames={{
              base: "inline-flex flex-row-reverse gap-2",
              wrapper: "group-data-[selected=true]:bg-primary",
            }}
          />
          <Button isIconOnly variant="light" onClick={handleTest} isLoading={isTesting} startContent={!isTesting && <TestTubes size={20} />} />
          <Popover placement="bottom-end">
            <PopoverTrigger>
              <Button isIconOnly variant="light" startContent={<Settings size={20} />} />
            </PopoverTrigger>
            <PopoverContent>
              <div className="p-4 space-y-4">
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-semibold">Template Settings</h4>
                  <Switch isSelected={useCustomTemplate} onValueChange={handleTemplateToggle}>
                    Use Custom Template
                  </Switch>
                </div>
                <Button color="danger" variant="flat" className="w-full" startContent={<Trash2 size={18} />} onClick={() => onDelete(webhook.id)}>
                  Delete Webhook
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardBody>
    </Card>
  );
}
