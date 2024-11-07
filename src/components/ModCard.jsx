"use client";

import { Card, CardBody, Button, Chip, Tooltip, Link } from "@nextui-org/react";
import { Trash2, Gamepad2, Clock, ExternalLink, Webhook } from "lucide-react";
import { useState } from "react";

function formatDate(dateString) {
  if (!dateString) {
    console.warn("No date string provided");
    return "Unknown";
  }

  try {
    const date = new Date(dateString);

    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Check if it's yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    }

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

export default function ModCard({ mod, onDelete, onManageWebhooks }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!mod) {
    console.error("Invalid mod data:", mod);
    return null;
  }

  const { id, name, game_name, last_updated, page_url } = mod;

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await onDelete(id);
      console.log("Mod deleted successfully:", id);
    } catch (error) {
      console.error("Error deleting mod:", error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="group bg-content1/50 hover:bg-content2/80 transition-background">
      <CardBody className="flex flex-row items-center justify-between p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <h3 className="text-lg font-semibold truncate">{name}</h3>
              {page_url && (
                <Link href={page_url} target="_blank" size="sm">
                  <ExternalLink size={16} className="text-default-400 hover:text-primary transition-colors" />
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Chip
                startContent={<Gamepad2 size={14} />}
                size="sm"
                variant="flat"
                color="secondary"
                classNames={{
                  base: "bg-secondary/10 hover:bg-secondary/20 transition-background",
                  content: "text-secondary-600",
                }}
              >
                {game_name}
              </Chip>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip content="Last Updated">
              <div className="flex items-center gap-1 text-small text-default-400">
                <Clock size={14} />
                <span>{formatDate(last_updated)}</span>
              </div>
            </Tooltip>

            <div className="h-4 w-[1px] bg-default-200" />

            <div className="flex items-center gap-2">
              <Button size="sm" variant="light" color="secondary" startContent={<Webhook size={14} />} onPress={() => onManageWebhooks(id)} className="px-2 font-normal">
                Manage Webhooks
              </Button>

              <Button size="sm" variant="light" color="danger" startContent={<Trash2 size={14} />} onPress={handleDelete} isLoading={isDeleting} isDisabled={isDeleting} className="px-2 font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
