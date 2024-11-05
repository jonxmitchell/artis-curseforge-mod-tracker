"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardBody, Tooltip } from "@nextui-org/react";
import { Clock, RefreshCw } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { useModUpdateChecker } from "@/hooks/useModUpdateChecker";

export default function UpdateCountdown() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(30);
  const { isChecking, checkForUpdates } = useModUpdateChecker();
  const unlistenRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let timer;
    let unlisten;

    const setup = async () => {
      try {
        unlisten = await listen("update_interval_changed", (event) => {
          const newInterval = event.payload.interval;
          setUpdateInterval(newInterval);
          const now = new Date();
          const nextCheck = new Date(now.getTime() + newInterval * 60 * 1000);
          localStorage.setItem("nextCheckTime", nextCheck.toISOString());
          updateCountdown();
        });

        await initializeCountdown();
        timer = setInterval(updateCountdown, 1000);

        unlistenRef.current = unlisten;
        timeoutRef.current = timer;
      } catch (error) {
        console.error("Failed to setup countdown:", error);
      }
    };

    setup();

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);

  const initializeCountdown = async () => {
    try {
      const interval = await invoke("get_update_interval");
      setUpdateInterval(interval);

      let nextCheck = localStorage.getItem("nextCheckTime");

      if (!nextCheck || new Date(nextCheck) <= new Date()) {
        const now = new Date();
        nextCheck = new Date(now.getTime() + interval * 60 * 1000).toISOString();
        localStorage.setItem("nextCheckTime", nextCheck);
      }

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
        await checkForUpdates(updateInterval);
        const newNext = new Date(now.getTime() + updateInterval * 60 * 1000);
        localStorage.setItem("nextCheckTime", newNext.toISOString());
        updateCountdown();
      } else {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    } catch (error) {
      console.error("Failed to update countdown:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-primary/10`}>
              <Clock size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-default-600">Next Check</p>
              <div className="h-8 w-32 bg-default-100 animate-pulse rounded-md mt-1" />
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!timeLeft) return null;

  return (
    <Card className="bg-content1/50 backdrop-blur-md">
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <Tooltip content={isChecking ? "Checking for updates..." : "Time until next check"}>
            <div className={`p-2 rounded-xl bg-primary/10`}>{isChecking ? <RefreshCw size={24} className="text-primary animate-spin" /> : <Clock size={24} className="text-primary" />}</div>
          </Tooltip>

          <div className="flex-1">
            <p className="text-sm font-medium text-default-600">Next Check In</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <TimeUnit value={timeLeft.hours} unit="h" />
              <span className="text-default-400 text-xl">:</span>
              <TimeUnit value={timeLeft.minutes} unit="m" />
              <span className="text-default-400 text-xl">:</span>
              <TimeUnit value={timeLeft.seconds} unit="s" />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function TimeUnit({ value, unit }) {
  return (
    <div className="flex items-center group">
      <span className="font-bold text-2xl min-w-[32px] text-center tabular-nums">{String(value).padStart(2, "0")}</span>
      <span className="text-xs text-default-400 group-hover:text-primary transition-colors ml-0.5">{unit}</span>
    </div>
  );
}
