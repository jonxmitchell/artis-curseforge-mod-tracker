"use client";

import { Card, CardBody, Button, Switch, Tooltip, Input } from "@nextui-org/react";
import { Trash2, TestTubes, Bot, Webhook, CheckCircle2, AlertCircle, FileText, Pencil, X } from "lucide-react";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function WebhookCard({ webhook, onDelete, onUpdate, existingWebhooks }) {
  const [isTesting, setIsTesting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(webhook.enabled);
  const [useCustomTemplate, setUseCustomTemplate] = useState(webhook.use_custom_template);
  const [testError, setTestError] = useState(null);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(webhook.name);
  const [renameError, setRenameError] = useState("");

  const validateName = (name) => {
    if (!name.trim()) {
      return "Webhook name cannot be empty";
    }

    // Check if name exists in other webhooks (case-insensitive)
    const nameExists = existingWebhooks.some((w) => w.id !== webhook.id && w.name.toLowerCase() === name.trim().toLowerCase());

    if (nameExists) {
      return "A webhook with this name already exists";
    }

    return "";
  };

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
    // If enabling custom template, no confirmation needed
    if (useCustom) {
      try {
        const updatedWebhook = {
          ...webhook,
          use_custom_template: true,
        };
        await onUpdate(updatedWebhook);
        setUseCustomTemplate(true);
      } catch (error) {
        console.error("Failed to update template settings:", error);
      }
      return;
    }

    // If disabling custom template, show confirmation
    setIsTemplateModalOpen(true);
  };

  const handleStartRename = () => {
    setIsRenaming(true);
    setNewName(webhook.name);
    setRenameError("");
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setNewName(webhook.name);
    setRenameError("");
  };

  const handleSaveRename = async () => {
    const error = validateName(newName);
    if (error) {
      setRenameError(error);
      return;
    }

    if (newName.trim() === webhook.name) {
      handleCancelRename();
      return;
    }

    try {
      const updatedWebhook = {
        ...webhook,
        name: newName.trim(),
      };
      await onUpdate(updatedWebhook);
      setIsRenaming(false);
      setRenameError("");
    } catch (error) {
      console.error("Failed to rename webhook:", error);
      if (error.toString().includes("already exists")) {
        setRenameError("A webhook with this name already exists");
      } else {
        setRenameError("Failed to rename webhook");
      }
      setNewName(webhook.name);
    }
  };

  const handleConfirmTemplateDisable = async () => {
    try {
      const updatedWebhook = {
        ...webhook,
        use_custom_template: false,
      };
      await onUpdate(updatedWebhook);
      await invoke("delete_custom_template", { webhookId: webhook.id });
      setUseCustomTemplate(false);
    } catch (error) {
      console.error("Failed to update template settings:", error);
      throw error;
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await onDelete(webhook.id);
    } catch (error) {
      console.error("Failed to delete webhook:", error);
      throw error;
    }
  };

  return (
    <>
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
                    {isRenaming ? (
                      <div className="flex flex-col gap-2 w-full max-w-md">
                        <div className="flex items-center gap-2">
                          <Input
                            size="sm"
                            value={newName}
                            onChange={(e) => {
                              setNewName(e.target.value);
                              setRenameError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename();
                              if (e.key === "Escape") handleCancelRename();
                            }}
                            isInvalid={!!renameError}
                            autoFocus
                            classNames={{
                              input: "text-lg font-semibold",
                              inputWrapper: "h-9",
                            }}
                          />
                          <Button isIconOnly size="sm" color="primary" variant="light" onPress={handleSaveRename}>
                            <CheckCircle2 size={18} />
                          </Button>
                          <Button isIconOnly size="sm" variant="light" onPress={handleCancelRename}>
                            <X size={18} />
                          </Button>
                        </div>
                        {renameError && <span className="text-danger text-xs">{renameError}</span>}
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold">{webhook.name}</h3>
                        <Tooltip content="Rename Webhook">
                          <Button isIconOnly size="sm" variant="light" onPress={handleStartRename} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil size={14} />
                          </Button>
                        </Tooltip>
                      </>
                    )}
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

            {/* URL Preview */}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="Delete Webhook" message="This will permanently delete this webhook and remove all mod assignments associated with it as well the custom template if one is created for this webhook. Any future updates for assigned mods will no longer be sent to this webhook." itemType="webhook" icon={Trash2} iconColor="danger" />

      {/* Template Disable Confirmation Modal */}
      <DeleteConfirmationModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} onConfirm={handleConfirmTemplateDisable} title="Disable Custom Template" message="This will permanently delete the custom template for this webhook. The webhook will revert to using the default template for all notifications. This action cannot be reversed, and you'll need to recreate the template if you want to use it again." itemType="template" icon={FileText} iconColor="warning" />
    </>
  );
}
