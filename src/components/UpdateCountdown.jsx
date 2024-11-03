// UpdateCountdown.jsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/react";
import { Clock } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { useModUpdateChecker } from "@/hooks/useModUpdateChecker";

export default function UpdateCountdown() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(30);
  const { isChecking, checkForUpdates } = useModUpdateChecker();

  useEffect(() => {
    let timer;
    let unlisten;

    const setup = async () => {
      // Listen for interval changes
      unlisten = await listen("update_interval_changed", (event) => {
        const newInterval = event.payload.interval;
        setUpdateInterval(newInterval);
        // Reset countdown with new interval
        const now = new Date();
        const nextCheck = new Date(now.getTime() + newInterval * 60 * 1000);
        localStorage.setItem("nextCheckTime", nextCheck.toISOString());
        updateCountdown();
      });

      // Initialize countdown on mount
      await initializeCountdown();

      // Start the timer
      timer = setInterval(updateCountdown, 1000);
    };

    setup();

    return () => {
      if (timer) clearInterval(timer);
      if (unlisten) unlisten();
    };
  }, []);

  const initializeCountdown = async () => {
    try {
      // Get the current interval from settings
      const interval = await invoke("get_update_interval");
      setUpdateInterval(interval);

      // Get stored next check time
      let nextCheck = localStorage.getItem("nextCheckTime");

      // If no stored time or it's in the past, create new one
      if (!nextCheck || new Date(nextCheck) <= new Date()) {
        const now = new Date();
        nextCheck = new Date(now.getTime() + interval * 60 * 1000).toISOString();
        localStorage.setItem("nextCheckTime", nextCheck);
      }

      // Initial countdown calculation
      updateCountdown();
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to initialize countdown:", error);
      setIsLoading(false);
    }
  };

  const updateCountdown = async () => {
    try {
      const nextCheck = localStorage.getItem("nextCheckTime");
      if (!nextCheck) return;

      const now = new Date();
      const next = new Date(nextCheck);
      const diff = next - now;

      if (diff <= 0) {
        // Time to check for updates
        await checkForUpdates(updateInterval);

        // Reset the countdown after check completes
        const newNext = new Date(now.getTime() + updateInterval * 60 * 1000);
        localStorage.setItem("nextCheckTime", newNext.toISOString());
        updateCountdown();
      } else {
        // Calculate remaining time
        const hours = Math.floor(diff / 3600000); // Convert to hours
        const minutes = Math.floor((diff % 3600000) / 60000); // Remaining minutes
        const seconds = Math.floor((diff % 60000) / 1000); // Remaining seconds
        setTimeLeft({ hours, minutes, seconds });
      }
    } catch (error) {
      console.error("Failed to update countdown:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody className="py-3">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            <div>
              <p className="text-sm font-medium">Next update check in:</p>
              <p className="text-2xl font-bold text-primary">--:--:--</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!timeLeft) return null;

  return (
    <Card>
      <CardBody className="py-3">
        <div className="flex items-center gap-2">
          <Clock size={20} className={`text-primary ${isChecking ? "animate-spin" : ""}`} />
          <div>
            <p className="text-sm font-medium">Next update check in:</p>
            <p className="text-2xl font-bold text-primary">
              {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
