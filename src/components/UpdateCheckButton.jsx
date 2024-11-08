import { useState, useRef, useEffect } from "react";
import { Button, Tooltip } from "@nextui-org/react";
import { RefreshCw } from "lucide-react";
import { useModUpdateChecker } from "@/hooks/useModUpdateChecker";

// Constants
const COOLDOWN_DURATION = 30; // 30 seconds cooldown
const COOLDOWN_STORAGE_KEY = "update_check_cooldown_timestamp";

export default function UpdateCheckButton({ onSuccess, disabled }) {
  const { checkForUpdates, isChecking: isCheckingMods } = useModUpdateChecker();
  const cooldownTimerRef = useRef(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(() => {
    // Initialize state with current remaining time
    const cooldownEndTimestamp = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (cooldownEndTimestamp) {
      const endTime = parseInt(cooldownEndTimestamp, 10);
      const now = Date.now();
      const remaining = Math.ceil((endTime - now) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  });

  const clearCooldownTimer = () => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  };

  const calculateRemainingTime = () => {
    const cooldownEndTimestamp = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (cooldownEndTimestamp) {
      const endTime = parseInt(cooldownEndTimestamp, 10);
      const now = Date.now();
      const remaining = Math.ceil((endTime - now) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return 0;
  };

  const startCooldownTimer = (initialTimeRemaining = COOLDOWN_DURATION) => {
    clearCooldownTimer();

    // Only set new timestamp if not already set
    if (!localStorage.getItem(COOLDOWN_STORAGE_KEY)) {
      const endTimestamp = Date.now() + initialTimeRemaining * 1000;
      localStorage.setItem(COOLDOWN_STORAGE_KEY, endTimestamp.toString());
    }

    cooldownTimerRef.current = setInterval(() => {
      const remaining = calculateRemainingTime();
      if (remaining <= 0) {
        clearCooldownTimer();
        localStorage.removeItem(COOLDOWN_STORAGE_KEY);
        setCooldownRemaining(0);
      } else {
        setCooldownRemaining(remaining);
      }
    }, 1000);
  };

  // Initialize cooldown state on mount
  useEffect(() => {
    const remaining = calculateRemainingTime();
    if (remaining > 0) {
      setCooldownRemaining(remaining);
      startCooldownTimer(remaining);
    }

    return () => clearCooldownTimer();
  }, []);

  const handleCheck = async () => {
    // Double-check cooldown before proceeding
    const remaining = calculateRemainingTime();
    if (remaining > 0 || isCheckingMods) return;

    try {
      const result = await checkForUpdates(null, onSuccess);
      if (result.success) {
        const endTimestamp = Date.now() + COOLDOWN_DURATION * 1000;
        localStorage.setItem(COOLDOWN_STORAGE_KEY, endTimestamp.toString());
        setCooldownRemaining(COOLDOWN_DURATION);
        startCooldownTimer(COOLDOWN_DURATION);
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  };

  const getButtonText = () => {
    if (isCheckingMods) return "Checking...";
    if (cooldownRemaining > 0) return `Wait ${cooldownRemaining}s`;
    return "Check Updates";
  };

  const tooltipContent = () => {
    if (isCheckingMods) return "Checking for mod updates...";
    if (cooldownRemaining > 0) return `Please wait ${cooldownRemaining} seconds before checking again`;
    if (disabled) return "Add some mods first to check for updates";
    return "Check all mods for updates";
  };

  return (
    <Tooltip content={tooltipContent()}>
      <Button className="group" color="primary" variant="flat" startContent={<RefreshCw size={18} className={`${isCheckingMods ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />} isLoading={isCheckingMods} isDisabled={cooldownRemaining > 0 || isCheckingMods || disabled} onPress={handleCheck}>
        {getButtonText()}
      </Button>
    </Tooltip>
  );
}
