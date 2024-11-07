import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@nextui-org/react";
import { AlertTriangle, FileText } from "lucide-react";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "This action cannot be undone.",
  itemType = "item",
  icon: Icon = AlertTriangle, // Allow custom icon
  iconColor = "danger", // Allow custom icon color
}) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [userInputs, setUserInputs] = useState(Array(6).fill(""));
  const [isValid, setIsValid] = useState(Array(6).fill(false));
  const inputRefs = useRef([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(newCode);
      setUserInputs(Array(6).fill(""));
      setIsValid(Array(6).fill(false));
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newInputs = [...userInputs];
    const newValid = [...isValid];

    newInputs[index] = value;
    newValid[index] = value === verificationCode[index];

    setUserInputs(newInputs);
    setIsValid(newValid);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !userInputs[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isConfirmEnabled = userInputs.join("") === verificationCode;

  const handleConfirm = async () => {
    if (!isConfirmEnabled) return;

    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Operation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      classNames={{
        backdrop: "bg-background/50 backdrop-blur-sm",
        base: "border border-default-100 bg-content1",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-${iconColor}/10`}>
            <Icon size={18} className={`text-${iconColor}`} />
          </div>
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-sm text-default-500">Enter the verification code to proceed</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div className={`flex items-start gap-3 p-4 rounded-xl bg-${iconColor}/10`}>
              <Icon size={20} className={`text-${iconColor} shrink-0 mt-0.5`} />
              <div className="space-y-2">
                <p className={`text-${iconColor} font-medium`}>Warning: This action cannot be undone</p>
                <p className="text-sm text-default-600">{message}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-center">
                <p className="font-mono text-xl tracking-wider bg-default-100 px-4 py-2 rounded-lg">{verificationCode}</p>
              </div>
              <p className="text-center text-sm text-default-500">Type the code above to confirm</p>
              <div className="flex justify-center gap-2">
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      value={userInputs[index]}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      maxLength={1}
                      className="w-12"
                      classNames={{
                        input: "text-center font-mono text-lg",
                        inputWrapper: userInputs[index] ? (isValid[index] ? "bg-success-50 border-success" : "bg-danger-50 border-danger") : "bg-default-100",
                      }}
                    />
                  ))}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button color={iconColor} onPress={handleConfirm} isLoading={isLoading} isDisabled={!isConfirmEnabled}>
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteConfirmationModal;
