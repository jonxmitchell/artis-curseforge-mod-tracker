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

function getRelativeTime(dateString) {
  if (!dateString) {
    return "Unknown";
  }

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((date - now) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (Math.abs(diffInDays) >= 30) {
      return formatDate(dateString);
    } else if (Math.abs(diffInDays) >= 1) {
      return rtf.format(diffInDays, "day");
    } else if (Math.abs(diffInHours) >= 1) {
      return rtf.format(diffInHours, "hour");
    } else if (Math.abs(diffInMinutes) >= 1) {
      return rtf.format(diffInMinutes, "minute");
    } else {
      return rtf.format(diffInSeconds, "second");
    }
  } catch (error) {
    console.error("Error calculating relative time:", error);
    return "Unknown";
  }
}

export default function ModCard({ mod, onDelete, onUpdate, onManageWebhooks }) {
  const [isChecking, setIsChecking] = useState(false);

  if (!mod) {
    console.error("Invalid mod data:", mod);
    return null;
  }

  const { id, name, game_name, last_updated, last_checked } = mod;

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
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-default-400" />
              <span className="text-sm text-default-400">Updated: {formatDate(last_updated)}</span>
            </div>
            <div className="text-xs text-default-400">Last checked: {getRelativeTime(last_checked)}</div>
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
                <Button color="danger" variant="flat" className="w-full" startContent={<Trash2 size={18} />} onClick={() => onDelete(id)}>
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
