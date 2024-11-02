"use client";

import { Card, CardBody, Button, Switch, Tooltip } from "@nextui-org/react";
import { Trash2, TestTubes, Bot } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export default function WebhookCard({ webhook, onDelete, onUpdate }) {
  const [isTesting, setIsTesting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(webhook.enabled);

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
      setIsEnabled(enabled); // Only update local state after successful API call
    } catch (error) {
      console.error("Failed to update webhook:", error);
      setIsEnabled(!enabled); // Revert the switch if the update failed
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
          <Button isIconOnly variant="light" color="danger" onClick={() => onDelete(webhook.id)} startContent={<Trash2 size={20} />} />
        </div>
      </CardBody>
    </Card>
  );
}
