"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Input, Switch, Button, Textarea } from "@nextui-org/react";
import { Trash2, Plus, Move } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";

export default function WebhookEditor({ webhook, onSave, isDefault = false }) {
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplate();
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
          embed_fields: JSON.stringify([
            { name: "Mod Name", value: "{mod_name}", inline: true },
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
          </div>
          {!template.use_embed && <Textarea label="Message Content" placeholder="Enter your message content" value={template.content || ""} onChange={(e) => setTemplate({ ...template, content: e.target.value })} />}
        </CardBody>
      </Card>

      {template.use_embed && (
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-lg font-semibold">Embed Settings</h3>
            <Input label="Title" value={template.title} onChange={(e) => setTemplate({ ...template, title: e.target.value })} />
            <Input
              label="Color"
              type="color"
              value={`#${template.color.toString(16)}`}
              onChange={(e) =>
                setTemplate({
                  ...template,
                  color: parseInt(e.target.value.slice(1), 16),
                })
              }
            />
          </CardBody>
        </Card>
      )}

      {template.use_embed && (
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
                    <Input label="Field Name" value={field.name} onChange={(e) => updateField(index, "name", e.target.value)} />
                    <Input label="Field Value" value={field.value} onChange={(e) => updateField(index, "value", e.target.value)} />
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
      )}

      <div className="flex justify-end">
        <Button color="primary" onPress={handleSave} isLoading={isSaving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
