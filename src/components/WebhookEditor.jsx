"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Input, Switch, Button, Textarea, Popover, PopoverTrigger, PopoverContent, ScrollShadow, Divider, Tooltip, Chip, CircularProgress } from "@nextui-org/react";
import { Trash2, Plus, MoveUp, MoveDown, Info, MessageSquare, Eye, FileText, Crown, Bot, Image as ImageIcon, Calendar, RefreshCw, AlertTriangle } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { motion, AnimatePresence } from "framer-motion";
import DiscordPreview from "./DiscordPreview";

const VariableReference = ({ type, variables }) => (
  <div>
    <h5 className="text-sm font-medium text-default-600 mb-2">{type}</h5>
    <div className="grid grid-cols-1 gap-2">
      {variables.map((variable) => (
        <div key={variable.name} className="p-2 bg-default-50 rounded-lg flex items-center gap-2">
          <code className="text-sm font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{`{${variable.name}}`}</code>
          <span className="text-sm text-default-600">{variable.description}</span>
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
        <Button isIconOnly variant="light" className="text-default-500 hover:text-primary transition-colors">
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
            <VariableReference type="Discord Variables" variables={discordVariables} />
          </ScrollShadow>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function WebhookEditor({ webhook, onSave, isDefault = false }) {
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isDefault || webhook?.id) {
      loadTemplate();
    }
  }, [webhook?.id, isDefault]);

  const loadTemplate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const webhookId = isDefault ? -1 : webhook?.use_custom_template ? webhook?.id : -1;

      const templateData = await invoke("get_webhook_template", { webhookId });

      if (templateData) {
        setTemplate({
          ...templateData,
          webhook_id: isDefault ? null : webhook?.id,
          is_default: isDefault,
        });
        setFields(JSON.parse(templateData.embed_fields));
      } else {
        // Set default values
        const defaultTemplate = {
          webhook_id: isDefault ? null : webhook?.id,
          is_default: isDefault,
          title: "🔄 Mod Update Available!",
          color: 5814783,
          content: "",
          use_embed: true,
          author_name: "",
          author_icon_url: "",
          footer_text: "",
          footer_icon_url: "",
          include_timestamp: true,
          embed_fields: JSON.stringify([
            { name: "Mod Name", value: "{modName}", inline: true },
            { name: "Author", value: "{modAuthorName}", inline: true },
            { name: "Last Updated", value: "{newReleaseDate}", inline: false },
            { name: "Latest File", value: "{lastestModFileName}", inline: false },
          ]),
        };
        setTemplate(defaultTemplate);
        setFields(JSON.parse(defaultTemplate.embed_fields));
      }
    } catch (error) {
      console.error("Failed to load webhook template:", error);
      setError("Failed to load template");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;

    try {
      setIsSaving(true);
      const updatedTemplate = {
        ...template,
        embed_fields: JSON.stringify(fields),
      };
      await invoke("update_webhook_template", { template: updatedTemplate });
      if (onSave) onSave();
    } catch (error) {
      console.error("Failed to save webhook template:", error);
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
    if ((direction === "up" && index === 0) || (direction === "down" && index === fields.length - 1)) {
      return;
    }

    const newFields = [...fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <CircularProgress size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <AlertTriangle className="text-danger" size={24} />
        <p className="text-center text-danger">{error}</p>
        <Button color="primary" variant="flat" onPress={loadTemplate}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!template) return null;

  if (!isDefault && !webhook?.use_custom_template) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg gap-4">
        <Crown size={24} className="text-primary" />
        <div className="text-center">
          <p>This webhook is using the default template</p>
          <p className="text-sm text-default-500 mt-2">Enable custom template in webhook settings to customize it</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardBody className="p-6">
        <motion.div className="h-full flex flex-col gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Template Editor</h3>
                <p className="text-sm text-default-500">Customize your notification format</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content={showPreview ? "Hide Preview" : "Show Preview"}>
                <Button isIconOnly variant="flat" color={showPreview ? "primary" : "default"} onPress={() => setShowPreview(!showPreview)}>
                  <Eye size={18} />
                </Button>
              </Tooltip>
              <TemplateVariablesHelp />
            </div>
          </div>

          {/* Main Content */}
          <div className={`grid ${showPreview ? "grid-cols-2" : "grid-cols-1"} gap-6 flex-1 min-h-0`}>
            {/* Editor Section */}
            <ScrollShadow className="pr-4">
              <div className="space-y-6 pb-6">
                {/* Message Format */}
                <Card>
                  <CardBody className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Switch isSelected={template.use_embed} onValueChange={(value) => setTemplate({ ...template, use_embed: value })}>
                        Use Embed Format
                      </Switch>
                      <Chip color={template.use_embed ? "primary" : "default"} variant="flat">
                        {template.use_embed ? "Rich Embed" : "Simple Message"}
                      </Chip>
                    </div>

                    {!template.use_embed && <Textarea label="Message Content" placeholder="Enter your message content..." value={template.content || ""} onChange={(e) => setTemplate({ ...template, content: e.target.value })} minRows={4} />}
                  </CardBody>
                </Card>

                {template.use_embed && (
                  <>
                    {/* Title and Color */}
                    <Card>
                      <CardBody className="space-y-4">
                        <Input label="Embed Title" placeholder="Enter a title..." value={template.title} onChange={(e) => setTemplate({ ...template, title: e.target.value })} startContent={<MessageSquare size={16} className="text-default-400" />} />
                        <div className="flex items-center gap-4">
                          <Input
                            type="color"
                            label="Accent Color"
                            value={`#${template.color.toString(16).padStart(6, "0")}`}
                            onChange={(e) =>
                              setTemplate({
                                ...template,
                                color: parseInt(e.target.value.slice(1), 16),
                              })
                            }
                          />
                          <div className="w-10 h-10 rounded-lg shadow-inner" style={{ backgroundColor: `#${template.color.toString(16).padStart(6, "0")}` }} />
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
                        <Input label="Author Name" placeholder="Enter author name..." value={template.author_name || ""} onChange={(e) => setTemplate({ ...template, author_name: e.target.value })} />
                        <Input label="Author Icon URL" placeholder="Enter icon URL..." value={template.author_icon_url || ""} onChange={(e) => setTemplate({ ...template, author_icon_url: e.target.value })} startContent={<ImageIcon size={16} className="text-default-400" />} />
                      </CardBody>
                    </Card>

                    {/* Embed Fields */}
                    <Card>
                      <CardBody className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">Embed Fields</h3>
                          <Button size="sm" color="primary" variant="flat" startContent={<Plus size={16} />} onPress={addField}>
                            Add Field
                          </Button>
                        </div>

                        <AnimatePresence mode="popLayout">
                          {fields.map((field, index) => (
                            <motion.div key={index} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border rounded-lg p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-default-500">Field {index + 1}</span>
                                  <Switch size="sm" isSelected={field.inline} onValueChange={(value) => updateField(index, "inline", value)}>
                                    Inline
                                  </Switch>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button isIconOnly size="sm" variant="light" onPress={() => moveField(index, "up")} isDisabled={index === 0}>
                                    <MoveUp size={16} />
                                  </Button>
                                  <Button isIconOnly size="sm" variant="light" onPress={() => moveField(index, "down")} isDisabled={index === fields.length - 1}>
                                    <MoveDown size={16} />
                                  </Button>
                                  <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeField(index)}>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <Input size="sm" label="Name" placeholder="Field name..." value={field.name} onChange={(e) => updateField(index, "name", e.target.value)} />
                                <Input size="sm" label="Value" placeholder="Field value..." value={field.value} onChange={(e) => updateField(index, "value", e.target.value)} />
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
                        <Input label="Footer Text" placeholder="Enter footer text..." value={template.footer_text || ""} onChange={(e) => setTemplate({ ...template, footer_text: e.target.value })} />
                        <Input label="Footer Icon URL" placeholder="Enter icon URL..." value={template.footer_icon_url || ""} onChange={(e) => setTemplate({ ...template, footer_icon_url: e.target.value })} startContent={<ImageIcon size={16} className="text-default-400" />} />
                        <Switch isSelected={template.include_timestamp} onValueChange={(value) => setTemplate({ ...template, include_timestamp: value })}>
                          Include Timestamp
                        </Switch>
                      </CardBody>
                    </Card>
                  </>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button color="primary" size="lg" onPress={handleSave} isLoading={isSaving} className="w-full sm:w-auto">
                    Save Changes
                  </Button>
                </div>
              </div>
            </ScrollShadow>

            {/* Preview Section */}
            {showPreview && <DiscordPreview template={template} fields={fields} />}
          </div>
        </motion.div>
      </CardBody>
    </Card>
  );
}
