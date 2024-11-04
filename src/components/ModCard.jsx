"use client";

import { Card, CardBody, Button, Chip, Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";
import { RefreshCw, Trash2, Settings, Gamepad2, Clock } from "lucide-react";
import { useState } from "react";

function formatDate(dateString) {
  if (!dateString) {
    console.warn("No date string provided");
    return "Unknown";
  }

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Unknown";
  }
}

export default function ModCard({ mod, onDelete, onUpdate, onManageWebhooks }) {
  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!mod) {
    console.error("Invalid mod data:", mod);
    return null;
  }

  const { id, name, game_name, last_updated } = mod;

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    try {
      await onUpdate();
    } catch (error) {
      console.error("Error checking for updates:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await onDelete(id);
      console.log("Mod deleted successfully:", id);
    } catch (error) {
      console.error("Error deleting mod:", error);
      // Add user notification here
      throw error; // Re-throw to be handled by parent component
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardBody className="flex flex-row items-center justify-between p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">{name}</h3>
            <Chip startContent={<Gamepad2 size={14} />} size="sm" variant="flat" color="secondary">
              {game_name}
            </Chip>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-default-400" />
            <span className="text-sm text-default-400">Last Updated: {formatDate(last_updated)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button isIconOnly variant="light" onClick={handleCheckUpdate} isLoading={isChecking} startContent={!isChecking && <RefreshCw size={20} />} />
          <Popover placement="bottom-end">
            <PopoverTrigger>
              <Button isIconOnly variant="light" startContent={<Settings size={20} />} />
            </PopoverTrigger>
            <PopoverContent>
              <div className="p-2">
                <Button color="primary" variant="flat" className="w-full mb-2" onClick={() => onManageWebhooks(id)}>
                  Manage Webhooks
                </Button>
                <Button color="danger" variant="flat" className="w-full" startContent={<Trash2 size={18} />} onClick={handleDelete} isLoading={isDeleting}>
                  Delete Mod
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardBody>
    </Card>
  );
}
