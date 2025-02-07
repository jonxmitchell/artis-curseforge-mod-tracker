import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { MinimizeIcon, X, MinusCircle } from "lucide-react";

export default function CloseConfirmationModal({
  isOpen,
  onClose,
  onMinimize,
  onQuit,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      classNames={{
        backdrop: "bg-background/50 backdrop-blur-sm",
        base: "border border-default-100 bg-content1",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Close Application</h2>
          <p className="text-sm text-default-500">
            Choose how you want to close the application
          </p>
        </ModalHeader>
        <ModalBody>
          <p className="text-default-600">
            Do you want to minimize to system tray or quit the application
            completely?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            variant="flat"
            onPress={onMinimize}
            startContent={<MinusCircle size={18} />}
          >
            Minimize to Tray
          </Button>
          <Button
            color="danger"
            onPress={onQuit}
            startContent={<X size={18} />}
          >
            Quit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
