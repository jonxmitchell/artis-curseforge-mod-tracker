"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Input, Switch, Button, Textarea, Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";
import { Trash2, Plus, Move, Info } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";

function TemplateVariablesHelp() {
  return (
    <Popover placement="right">
      <PopoverTrigger>
        <Button isIconOnly variant="light" size="sm">
          <Info size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="p-4">
          <h4 className="text-lg font-semibold mb-2">Available Variables</h4>
          <div className="space-y-2">
            <p className="text-sm">
              <code>{"{modID}"}</code> - Mod ID
            </p>
            <p className="text-sm">
              <code>{"{modName}"}</code> - Mod name
            </p>
            <p className="text-sm">
              <code>{"{newReleaseDate}"}</code> - New release date
            </p>
            <p className="text-sm">
              <code>{"{oldPreviousDate}"}</code> - Previous release date
            </p>
            <p className="text-sm">
              <code>{"{everyone}"}</code> - @everyone mention
            </p>
            <p className="text-sm">
              <code>{"{here}"}</code> - @here mention
            </p>
            <p className="text-sm">
              <code>{"{&roleID}"}</code> - Mention a role (e.g., {"{&123456789}"})
            </p>
            <p className="text-sm">
              <code>{"{#channelID}"}</code> - Channel link (e.g., {"{#987654321}"})
            </p>
            <p className="text-sm">
              <code>{"{lastestModFileName}"}</code> - Latest mod file name
            </p>
            <p className="text-sm">
              <code>{"{modAuthorName}"}</code> - Mod author name
            </p>
            <p className="text-sm">
              <code>{"{game_version}"}</code> - Game version
            </p>
            <p className="text-sm">
              <code>{"{old_version}"}</code> - Old version
            </p>
            <p className="text-sm">
              <code>{"{new_version}"}</code> - New version
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function WebhookEditor({ webhook, onSave, isDefault = false }) {
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDefault || webhook?.id) {
      loadTemplate();
    }
  }, [webhook?.id, isDefault]);

  const loadTemplate = async () => {
    try {
      setIsLoading(true);
      // If this is not the default template and the webhook doesn't use custom template,
      // load the default template instead
      const webhookId = isDefault ? -1 : webhook?.use_custom_template ? webhook?.id : -1;

      const templateData = await invoke("get_webhook_template", {
        webhookId: webhookId,
      });

      if (templateData) {
        setTemplate({
          ...templateData,
          webhook_id: isDefault ? null : webhook?.id,
          is_default: isDefault,
        });
        setFields(JSON.parse(templateData.embed_fields));
      } else {
        // Set default template values if no template exists
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
            { name: "Game Version", value: "{game_version}", inline: true },
            { name: "Old Version", value: "{old_version}", inline: true },
            { name: "New Version", value: "{new_version}", inline: true },
          ]),
        };
        setTemplate(defaultTemplate);
        setFields(JSON.parse(defaultTemplate.embed_fields));
      }
    } catch (error) {
      console.error("Failed to load webhook template:", error);
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
    return <div className="text-center">Loading template...</div>;
  }

  if (!template) {
    return null;
  }

  // If this is not the default template and the webhook doesn't use custom template,
  // show a message instead
  if (!isDefault && !webhook?.use_custom_template) {
    return (
      <div className="text-center p-6 border border-dashed rounded-lg">
        <p>This webhook is using the default template.</p>
        <p className="text-sm text-default-500 mt-2">Enable custom template in webhook settings to customize it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <h3 className="text-lg font-semibold">Message Settings</h3>
          <div className="flex items-center gap-4">
            <Switch isSelected={template.use_embed} onValueChange={(value) => setTemplate({ ...template, use_embed: value })}>
              Use Embed
            </Switch>
            <TemplateVariablesHelp />
          </div>
          {!template.use_embed && (
            <div className="flex items-start gap-2">
              <Textarea label="Message Content" placeholder="Enter your message content" value={template.content || ""} onChange={(e) => setTemplate({ ...template, content: e.target.value })} />
              <TemplateVariablesHelp />
            </div>
          )}
        </CardBody>
      </Card>

      {template.use_embed && (
        <>
          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-lg font-semibold">Author Settings</h3>
              <div className="flex items-center gap-2">
                <Input label="Author Name" value={template.author_name || ""} onChange={(e) => setTemplate({ ...template, author_name: e.target.value })} placeholder="Enter author name" />
                <TemplateVariablesHelp />
              </div>
              <div className="flex items-center gap-2">
                <Input label="Author Icon URL" value={template.author_icon_url || ""} onChange={(e) => setTemplate({ ...template, author_icon_url: e.target.value })} placeholder="Enter author icon URL" />
                <TemplateVariablesHelp />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-lg font-semibold">Embed Settings</h3>
              <div className="flex items-center gap-2">
                <Input label="Title" value={template.title} onChange={(e) => setTemplate({ ...template, title: e.target.value })} />
                <TemplateVariablesHelp />
              </div>
              <Input
                label="Color"
                type="color"
                value={`#${template.color.toString(16).padStart(6, "0")}`}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    color: parseInt(e.target.value.slice(1), 16),
                  })
                }
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-lg font-semibold">Footer Settings</h3>
              <div className="flex items-center gap-2">
                <Input label="Footer Text" value={template.footer_text || ""} onChange={(e) => setTemplate({ ...template, footer_text: e.target.value })} placeholder="Enter footer text" />
                <TemplateVariablesHelp />
              </div>
              <div className="flex items-center gap-2">
                <Input label="Footer Icon URL" value={template.footer_icon_url || ""} onChange={(e) => setTemplate({ ...template, footer_icon_url: e.target.value })} placeholder="Enter footer icon URL" />
                <TemplateVariablesHelp />
              </div>
              <Switch isSelected={template.include_timestamp} onValueChange={(value) => setTemplate({ ...template, include_timestamp: value })}>
                Include Timestamp
              </Switch>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Embed Fields</h3>
                <Button color="primary" variant="flat" startContent={<Plus size={20} />} onPress={addField}>
                  Add Field
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={index} className="flex gap-4 items-start border p-4 rounded-lg">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2">
                        <Input label="Field Name" value={field.name} onChange={(e) => updateField(index, "name", e.target.value)} />
                        <TemplateVariablesHelp />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input label="Field Value" value={field.value} onChange={(e) => updateField(index, "value", e.target.value)} />
                        <TemplateVariablesHelp />
                      </div>
                      <Switch isSelected={field.inline} onValueChange={(value) => updateField(index, "inline", value)}>
                        Inline
                      </Switch>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button isIconOnly variant="light" onPress={() => moveField(index, "up")} isDisabled={index === 0}>
                        <Move className="rotate-180" size={20} />
                      </Button>
                      <Button isIconOnly variant="light" onPress={() => moveField(index, "down")} isDisabled={index === fields.length - 1}>
                        <Move size={20} />
                      </Button>
                      <Button isIconOnly variant="light" color="danger" onPress={() => removeField(index)}>
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button color="primary" onPress={handleSave} isLoading={isSaving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
