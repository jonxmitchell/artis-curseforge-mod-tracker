// src/components/WebhookEditorModal.jsx
"use client";

import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/react";
import WebhookEditor from "./WebhookEditor";

export default function WebhookEditorModal({ isOpen, onClose, webhook }) {
  const handleSave = async () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>Edit Webhook Content</ModalHeader>
        <ModalBody className="pb-6">
          <WebhookEditor webhook={webhook} onSave={handleSave} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
