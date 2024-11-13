import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Checkbox, Chip, Input, ScrollShadow } from "@nextui-org/react";
import { invoke } from "@tauri-apps/api/tauri";
import { motion, AnimatePresence } from "framer-motion";
import { Webhook, Search, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function WebhookAssignModal({ isOpen, onClose, modId }) {
  const [webhooks, setWebhooks] = useState([]);
  const [selectedWebhooks, setSelectedWebhooks] = useState(new Set([]));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && modId) {
      loadWebhooks();
      setError(null);
      setSearchQuery("");
      setShowSuccess(false);
    }
  }, [isOpen, modId]);

  const loadWebhooks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [allWebhooks, modWebhooks] = await Promise.all([invoke("get_webhooks"), invoke("get_mod_assigned_webhooks", { modId })]);

      setWebhooks(allWebhooks);
      setSelectedWebhooks(new Set(modWebhooks.map((webhook) => webhook.id.toString())));
    } catch (error) {
      console.error("Failed to load webhooks:", error);
      setError("Failed to load webhooks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const currentAssignments = await invoke("get_mod_assigned_webhooks", { modId });
      const currentIds = new Set(currentAssignments.map((w) => w.id.toString()));
      const newIds = selectedWebhooks;

      // Remove unselected webhooks
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

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Failed to save webhook assignments:", error);
      setError("Failed to save webhook assignments. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredWebhooks = webhooks.filter((webhook) => webhook.name.toLowerCase().includes(searchQuery.toLowerCase()) || (webhook.username && webhook.username.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      backdrop="blur"
      classNames={{
        backdrop: "bg-background/50 backdrop-blur-sm",
        base: "border border-default-100 bg-content1",
        body: "py-6",
        closeButton: "hover:bg-default-100",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Webhook size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Manage Webhooks</h2>
            <p className="text-sm text-default-500">Assign webhooks to receive mod updates</p>
          </div>
        </ModalHeader>

        <ModalBody>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-default-500">Loading webhooks...</p>
              </motion.div>
            ) : error ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center gap-3 p-4 rounded-lg bg-danger-50/10 border border-danger-200 text-danger">
                <AlertCircle size={20} />
                <p>{error}</p>
              </motion.div>
            ) : webhooks.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-8">
                <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                  <Webhook size={24} className="text-primary" />
                </div>
                <p className="text-default-600">No webhooks available.</p>
                <p className="text-sm text-default-500 mt-2">Create some webhooks first!</p>
              </motion.div>
            ) : showSuccess ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="p-3 rounded-full bg-success-50/10">
                  <CheckCircle2 size={32} className="text-success" />
                </div>
                <p className="text-success">Webhooks updated successfully!</p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <Input
                  placeholder="Search webhooks..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  startContent={<Search size={18} className="text-default-400" />}
                  classNames={{
                    inputWrapper: "bg-default-100",
                  }}
                  isClearable
                />

                <ScrollShadow className="max-h-[400px] space-y-2" hideScrollBar>
                  {filteredWebhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-default-100 transition-background cursor-pointer"
                      onClick={() => {
                        const newSelection = new Set(selectedWebhooks);
                        if (!selectedWebhooks.has(webhook.id.toString())) {
                          newSelection.add(webhook.id.toString());
                        } else {
                          newSelection.delete(webhook.id.toString());
                        }
                        setSelectedWebhooks(newSelection);
                      }}
                    >
                      <Checkbox value={webhook.id.toString()} isSelected={selectedWebhooks.has(webhook.id.toString())} onChange={() => {}} onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{webhook.name}</span>
                          {webhook.username && <span className="text-xs text-default-500">@{webhook.username}</span>}
                        </div>
                      </Checkbox>

                      {!webhook.enabled && (
                        <Chip size="sm" color="warning" variant="flat" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          Disabled
                        </Chip>
                      )}
                    </div>
                  ))}
                </ScrollShadow>

                {filteredWebhooks.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-default-500">No webhooks found matching "{searchQuery}"</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ModalBody>

        {!isLoading && !error && webhooks.length > 0 && !showSuccess && (
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={isSaving} startContent={!isSaving && <CheckCircle2 size={18} />}>
              Save Changes
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
