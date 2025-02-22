"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Switch,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Chip,
  ScrollShadow,
  Popover,
  PopoverTrigger,
  PopoverContent,
  CircularProgress,
  Textarea,
} from "@nextui-org/react";
import {
  Paintbrush,
  Plus,
  MoveUp,
  MoveDown,
  Info,
  MessageSquare,
  Eye,
  FileText,
  Crown,
  Bot,
  Image as ImageIcon,
  Calendar,
  RefreshCw,
  AlertCircle,
  Check,
  Trash2,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { motion, AnimatePresence } from "framer-motion";
import DiscordPreview from "./DiscordPreview";
import ColorPicker from "./ColorPicker";

const SaveNotification = ({ status, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
        status === "success"
          ? "bg-success-50 text-success border border-success-200"
          : "bg-danger-50 text-danger border border-danger-200"
      }`}
    >
      {status === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
      <span className="text-sm font-medium">
        {status === "success"
          ? "Changes saved successfully"
          : "Failed to save changes"}
      </span>
    </motion.div>
  );
};

const VariableReference = ({ type, variables }) => (
  <div>
    <h5 className="text-sm font-medium text-default-600 mb-2">{type}</h5>
    <div className="grid grid-cols-1 gap-2">
      {variables.map((variable) => (
        <div
          key={variable.name}
          className="p-2 bg-default-50 rounded-lg flex items-center gap-2"
        >
          <code className="text-sm font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{`{${variable.name}}`}</code>
          <span className="text-sm text-default-600">
            {variable.description}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const TemplateVariablesHelp = () => {
  const modVariables = [
    { name: "modID", description: "Mod ID" },
    { name: "modName", description: "Mod name" },
    { name: "newReleaseDate", description: "New update time" },
    { name: "oldPreviousDate", description: "Previous update time" },
    { name: "lastestModFileName", description: "Latest mod file name" },
    { name: "modAuthorName", description: "Mod author name" },
    { name: "modURL", description: "URL to mod page" },
    { name: "changelog", description: "Latest version changelog" },
  ];

  const discordVariables = [
    { name: "everyone", description: "@everyone mention" },
    { name: "here", description: "@here mention" },
    { name: "&roleID", description: "Mention a role (e.g., {&123456789})" },
    { name: "#channelID", description: "Channel link (e.g., {#987654321})" },
  ];

  return (
    <Popover placement="right" showArrow>
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          className="text-default-500 hover:text-primary transition-colors"
        >
          <Info size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-primary" />
            <h4 className="text-lg font-semibold">Available Variables</h4>
          </div>
          <ScrollShadow className="max-h-[400px] space-y-6" hideScrollBar>
            <VariableReference type="Mod Variables" variables={modVariables} />
            <Divider />
            <VariableReference
              type="Discord Variables"
              variables={discordVariables}
            />
          </ScrollShadow>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function WebhookEditor({
  template: initialTemplate,
  webhook,
  onSave,
  isDefault = false,
}) {
  const [template, setTemplate] = useState(initialTemplate || null);
  const [fields, setFields] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const prevTemplateRef = useRef(null);

  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
      setFields(JSON.parse(initialTemplate.embed_fields));
    }
  }, [initialTemplate]);

  useEffect(() => {
    prevTemplateRef.current = template;
  }, [template]);

  const handleSave = async () => {
    if (!template) return;

    try {
      setIsSaving(true);
      const updatedTemplate = {
        ...template,
        embed_fields: JSON.stringify(fields),
        is_default: isDefault,
        webhook_id: webhook?.id || null,
      };

      // Ensure we're passing the complete template
      await invoke("update_webhook_template", { template: updatedTemplate });
      setSaveStatus("success");

      if (onSave) {
        // Pass back the updated template
        onSave(updatedTemplate);
      }
    } catch (error) {
      console.error("Failed to save webhook template:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const addField = () => {
    setFields([...fields, { name: "", value: "", inline: true }]);
  };

  const updateField = (index, key, value) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setFields(updatedFields);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [
      newFields[newIndex],
      newFields[index],
    ];
    setFields(newFields);
  };

  if (!template) return null;

  if (!isDefault && !webhook?.use_custom_template) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg gap-4">
        <Crown size={24} className="text-primary" />
        <div className="text-center">
          <p>This webhook is using the default template</p>
          <p className="text-sm text-default-500 mt-2">
            Enable custom template in webhook settings to customize it
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TemplateVariablesHelp />
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content={showPreview ? "Hide Preview" : "Show Preview"}>
              <Button
                isIconOnly
                variant="flat"
                color={showPreview ? "primary" : "default"}
                onPress={() => setShowPreview(!showPreview)}
              >
                <Eye size={18} />
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`grid ${
            showPreview ? "grid-cols-2" : "grid-cols-1"
          } gap-6`}
        >
          <div className="space-y-6">
            {/* Message Format */}
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <Switch
                    isSelected={template.use_embed}
                    onValueChange={(value) =>
                      setTemplate({ ...template, use_embed: value })
                    }
                  >
                    Use Embed Format
                  </Switch>
                  <Chip
                    color={template.use_embed ? "primary" : "default"}
                    variant="flat"
                  >
                    {template.use_embed ? "Rich Embed" : "Simple Message"}
                  </Chip>
                </div>

                {!template.use_embed && (
                  <Textarea
                    label="Message Content"
                    placeholder="Enter your message content..."
                    value={template.content || ""}
                    onChange={(e) =>
                      setTemplate({ ...template, content: e.target.value })
                    }
                    minRows={4}
                  />
                )}
              </CardBody>
            </Card>

            {template.use_embed && (
              <>
                {/* Title and Color */}
                <Card>
                  <CardBody className="space-y-4">
                    <Input
                      label="Embed Title"
                      placeholder="Enter a title..."
                      value={template.title}
                      onChange={(e) =>
                        setTemplate({ ...template, title: e.target.value })
                      }
                      startContent={
                        <MessageSquare size={16} className="text-default-400" />
                      }
                    />
                    <ColorPicker
                      color={template.color}
                      onChange={(color) => setTemplate({ ...template, color })}
                    />
                  </CardBody>
                </Card>

                {/* Thumbnail Settings */}
                <Card>
                  <CardBody className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon size={16} className="text-primary" />
                      Thumbnail Settings
                    </h3>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <Switch
                          isSelected={template.use_thumbnail}
                          onValueChange={(value) =>
                            setTemplate({ ...template, use_thumbnail: value })
                          }
                        >
                          Show Mod Icon Thumbnail
                        </Switch>
                        <p className="text-xs text-default-500">
                          Displays the mod's icon image in the embed
                        </p>
                      </div>
                      {template.use_thumbnail && (
                        <div className="w-16 h-16 rounded-lg bg-default-100 flex items-center justify-center">
                          <ImageIcon size={24} className="text-default-400" />
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Author Section */}
                <Card>
                  <CardBody className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Bot size={16} className="text-primary" />
                      Author Settings
                    </h3>
                    <Input
                      label="Author Name"
                      placeholder="Enter author name..."
                      value={template.author_name || ""}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          author_name: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Author Icon URL"
                      placeholder="Enter icon URL..."
                      value={template.author_icon_url || ""}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          author_icon_url: e.target.value,
                        })
                      }
                      startContent={
                        <ImageIcon size={16} className="text-default-400" />
                      }
                    />
                  </CardBody>
                </Card>

                {/* Embed Fields */}
                <Card>
                  <CardBody className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Embed Fields</h3>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={<Plus size={16} />}
                        onPress={addField}
                      >
                        Add Field
                      </Button>
                    </div>

                    <AnimatePresence mode="popLayout">
                      {fields.map((field, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="border rounded-lg p-4 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-default-500">
                                Field {index + 1}
                              </span>
                              <Switch
                                size="sm"
                                isSelected={field.inline}
                                onValueChange={(value) =>
                                  updateField(index, "inline", value)
                                }
                              >
                                Inline
                              </Switch>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => moveField(index, "up")}
                                isDisabled={index === 0}
                              >
                                <MoveUp size={16} />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => moveField(index, "down")}
                                isDisabled={index === fields.length - 1}
                              >
                                <MoveDown size={16} />
                              </Button>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => removeField(index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Input
                              size="sm"
                              label="Name"
                              placeholder="Field name..."
                              value={field.name}
                              onChange={(e) =>
                                updateField(index, "name", e.target.value)
                              }
                            />
                            <Input
                              size="sm"
                              label="Value"
                              placeholder="Field value..."
                              value={field.value}
                              onChange={(e) =>
                                updateField(index, "value", e.target.value)
                              }
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </CardBody>
                </Card>

                {/* Footer Settings */}
                <Card>
                  <CardBody className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      Footer Settings
                    </h3>
                    <Input
                      label="Footer Text"
                      placeholder="Enter footer text..."
                      value={template.footer_text || ""}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          footer_text: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Footer Icon URL"
                      placeholder="Enter icon URL..."
                      value={template.footer_icon_url || ""}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          footer_icon_url: e.target.value,
                        })
                      }
                      startContent={
                        <ImageIcon size={16} className="text-default-400" />
                      }
                    />
                    <Switch
                      isSelected={template.include_timestamp}
                      onValueChange={(value) =>
                        setTemplate({ ...template, include_timestamp: value })
                      }
                    >
                      Include Timestamp
                    </Switch>
                  </CardBody>
                </Card>
              </>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                color="primary"
                size="lg"
                onPress={handleSave}
                isLoading={isSaving}
                className="w-full sm:w-auto"
                startContent={!isSaving && <RefreshCw size={18} />}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <ScrollShadow className="h-full">
              <DiscordPreview template={template} fields={fields} />
            </ScrollShadow>
          )}
        </div>
      </div>

      {/* Save Status Notification */}
      <AnimatePresence>
        {saveStatus && (
          <SaveNotification
            status={saveStatus}
            onClose={() => setSaveStatus(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
