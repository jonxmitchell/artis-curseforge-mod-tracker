"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/react";
import { Clock } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";

export default function UpdateCountdown() {
  const [nextCheck, setNextCheck] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(null);

  useEffect(() => {
    // Get the update interval when component mounts
    const fetchInterval = async () => {
      try {
        const interval = await invoke("get_update_interval");
        setUpdateInterval(interval);
        // Set the next check time
        const now = new Date();
        const next = new Date(now.getTime() + interval * 60 * 1000);
        setNextCheck(next);
      } catch (error) {
        console.error("Failed to fetch update interval:", error);
      }
    };
    fetchInterval();
  }, []);

  useEffect(() => {
    if (!nextCheck) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = nextCheck - now;

      if (diff <= 0) {
        // Reset the countdown
        const next = new Date(now.getTime() + updateInterval * 60 * 1000);
        setNextCheck(next);
      } else {
        // Calculate remaining time
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft({ minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextCheck, updateInterval]);

  if (!timeLeft) return null;

  return (
    <Card>
      <CardBody className="py-3">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          <div>
            <p className="text-sm font-medium">Next update check in:</p>
            <p className="text-2xl font-bold text-primary">
              {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
