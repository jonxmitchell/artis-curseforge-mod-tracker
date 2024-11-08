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
  const [isChecking, setIsChecking] = useState(false);
  const unlistenRef = useRef(null);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const updateIntervalRef = useRef(30); // Keep track of current interval
  const { checkForUpdates } = useModUpdateChecker();

  // Function to get the current interval from the database
  const getCurrentInterval = async () => {
    try {
      const interval = await invoke("get_update_interval");
      console.log("Fetched current interval from DB:", interval);
      setUpdateInterval(interval);
      updateIntervalRef.current = interval;
      return interval;
    } catch (error) {
      console.error("Failed to get current interval:", error);
      return updateIntervalRef.current;
    }
  };

  const performAutoCheck = async () => {
    setIsChecking(true);
    try {
      const currentInterval = await getCurrentInterval();
      await checkForUpdates(currentInterval);
      await resetCountdown(currentInterval);
    } catch (error) {
      console.error("Auto-check failed:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const resetCountdown = async (interval) => {
    console.log("Resetting countdown with interval:", interval);
    const now = new Date();
    const nextCheck = new Date(now.getTime() + interval * 60 * 1000);
    localStorage.setItem("nextCheckTime", nextCheck.toISOString());
    localStorage.setItem("currentInterval", interval.toString());
    updateCountdown();

    // Reset interval timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(updateCountdown, 1000);
  };

  useEffect(() => {
    let updateCheckUnlisten;
    let intervalChangeUnlisten;

    const setup = async () => {
      try {
        // Listen for manual update checks
        updateCheckUnlisten = await listen("update_check_completed", async (event) => {
          console.log("Manual update check completed event received:", event);
          const interval = event.payload.interval;
          await resetCountdown(interval);
        });

        // Listen for interval changes
        intervalChangeUnlisten = await listen("update_interval_changed", async (event) => {
          const newInterval = event.payload.interval;
          console.log("Interval change event received:", newInterval);
          setUpdateInterval(newInterval);
          updateIntervalRef.current = newInterval;
          await resetCountdown(newInterval);
        });

        // Initial setup
        await initializeCountdown();
      } catch (error) {
        console.error("Failed to setup countdown:", error);
      }
    };

    setup();

    return () => {
      if (updateCheckUnlisten) updateCheckUnlisten();
      if (intervalChangeUnlisten) intervalChangeUnlisten();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const initializeCountdown = async () => {
    try {
      const interval = await getCurrentInterval();
      console.log("Initializing countdown with interval:", interval);

      let nextCheck = localStorage.getItem("nextCheckTime");
      const now = new Date();

      if (!nextCheck || new Date(nextCheck) <= now) {
        nextCheck = new Date(now.getTime() + interval * 60 * 1000).toISOString();
        localStorage.setItem("nextCheckTime", nextCheck);
        localStorage.setItem("currentInterval", interval.toString());
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(updateCountdown, 1000);

      updateCountdown();
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to initialize countdown:", error);
      setIsLoading(false);
    }
  };

  const updateCountdown = () => {
    try {
      const nextCheck = localStorage.getItem("nextCheckTime");
      if (!nextCheck) return;

      const now = new Date();
      const next = new Date(nextCheck);
      const diff = next - now;

      if (diff <= 0) {
        // Time for automatic check
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        performAutoCheck();
      }

      // Update displayed time
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours, minutes, seconds });
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
          <Tooltip content={isChecking ? "Checking for updates..." : `Time until next check (${updateInterval}min interval)`}>
            <div className={`p-2 rounded-xl bg-primary/10`}>{isChecking ? <RefreshCw size={24} className="text-primary animate-spin" /> : <Clock size={24} className="text-primary" />}</div>
          </Tooltip>

          <div className="flex-1">
            <p className="text-sm font-medium text-default-600">Next Check In {updateInterval}min cycle</p>
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
