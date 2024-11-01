"use client";

import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, CheckboxGroup, Checkbox } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/tauri";

export default function WebhookAssignModal({ isOpen, onClose, modId }) {
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhooks, setSelectedWebhooks] = useState(new Set([]));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && modId) {
      loadWebhooks();
    }
  }, [isOpen, modId]);

  const loadWebhooks = async () => {
    try {
      const [allWebhooks, modWebhooks] = await Promise.all([invoke("get_webhooks"), invoke("get_mod_assigned_webhooks", { modId })]);

      setWebhooks(allWebhooks);
      setSelectedWebhooks(new Set(modWebhooks.map((webhook) => webhook.id.toString())));
    } catch (error) {
      console.error("Failed to load webhooks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Get current assignments to determine what needs to change
      const currentAssignments = await invoke("get_mod_assigned_webhooks", { modId });
      const currentIds = new Set(currentAssignments.map((w) => w.id.toString()));
      const newIds = selectedWebhooks;

      // Remove webhooks that were unselected
      for (const id of currentIds) {
        if (!newIds.has(id)) {
          await invoke("remove_webhook_assignment", {
            modId,
            webhookId: parseInt(id),
          });
        }
      }

      // Add newly selected webhooks
      for (const id of newIds) {
        if (!currentIds.has(id)) {
          await invoke("assign_webhook", {
            modId,
            webhookId: parseInt(id),
          });
        }
      }

      onClose();
    } catch (error) {
      console.error("Failed to save webhook assignments:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>Manage Webhooks</ModalHeader>
        <ModalBody>
          {isLoading ? (
            <div className="text-center p-4">Loading webhooks...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center p-4">No webhooks available. Create some webhooks first!</div>
          ) : (
            <CheckboxGroup value={Array.from(selectedWebhooks)} onChange={(values) => setSelectedWebhooks(new Set(values))}>
              {webhooks.map((webhook) => (
                <Checkbox key={webhook.id} value={webhook.id.toString()}>
                  {webhook.name}
                </Checkbox>
              ))}
            </CheckboxGroup>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSave}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
