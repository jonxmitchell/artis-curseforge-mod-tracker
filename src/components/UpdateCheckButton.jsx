import { Button, Tooltip } from "@nextui-org/react";
import { RefreshCw } from "lucide-react";
import { useUpdateCheck } from "@/hooks/useUpdateCheck";

export default function UpdateCheckButton({ onSuccess, disabled }) {
  const { checkForUpdates, isChecking, cooldownRemaining, error } = useUpdateCheck(onSuccess);

  const getButtonText = () => {
    if (isChecking) return "Checking...";
    if (cooldownRemaining > 0) return `Wait ${cooldownRemaining}s`;
    return "Check Updates";
  };

  const tooltipContent = () => {
    if (error) return error;
    if (isChecking) return "Checking for mod updates...";
    if (cooldownRemaining > 0) return `Please wait ${cooldownRemaining} seconds before checking again`;
    if (disabled) return "Add some mods first to check for updates";
    return "Check all mods for updates";
  };

  return (
    <Tooltip content={tooltipContent()}>
      <Button className="group" color="primary" variant="flat" startContent={<RefreshCw size={18} className={`${isChecking ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />} isLoading={isChecking} isDisabled={cooldownRemaining > 0 || isChecking || disabled} onPress={checkForUpdates}>
        {getButtonText()}
      </Button>
    </Tooltip>
  );
}
