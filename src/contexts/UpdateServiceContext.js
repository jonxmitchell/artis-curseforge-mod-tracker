"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen } from "@tauri-apps/api/event";
import { useModUpdateChecker } from "@/hooks/useModUpdateChecker";

const UpdateServiceContext = createContext(null);

export function UpdateServiceProvider({ children }) {
  const [lastChecked, setLastChecked] = useState(null);
  const [nextCheckTime, setNextCheckTime] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(30);
  const [isChecking, setIsChecking] = useState(false);
  const timeoutRef = useRef(null);
  const processedEventsRef = useRef(new Set());
  const { checkForUpdates } = useModUpdateChecker();

  const performCheck = async () => {
    if (isChecking) return;

    setIsChecking(true);
    try {
      const interval = await invoke("get_update_interval");
      await checkForUpdates(interval);
      setLastChecked(new Date());
      scheduleNextCheck(interval);
    } catch (error) {
      console.error("Failed to perform update check:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const scheduleNextCheck = (interval) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const nextCheck = new Date(Date.now() + interval * 60 * 1000);
    setNextCheckTime(nextCheck);
    localStorage.setItem("nextCheckTime", nextCheck.toISOString());

    timeoutRef.current = setTimeout(() => {
      performCheck();
    }, interval * 60 * 1000);
  };

  useEffect(() => {
    let unlistenInterval;
    let unlistenUpdate;
    let cleanupInterval;

    const setup = async () => {
      try {
        // Listen for interval changes
        unlistenInterval = await listen("update_interval_changed", async (event) => {
          const newInterval = event.payload.interval;
          setUpdateInterval(newInterval);
          scheduleNextCheck(newInterval);
        });

        // Listen for manual update checks
        unlistenUpdate = await listen("update_check_completed", (event) => {
          if (event.payload.eventId && processedEventsRef.current.has(event.payload.eventId)) {
            return;
          }

          if (event.payload.eventId) {
            processedEventsRef.current.add(event.payload.eventId);
          }

          setLastChecked(new Date(event.payload.timestamp));
          scheduleNextCheck(event.payload.interval);
        });

        // Clear processed events periodically
        cleanupInterval = setInterval(() => {
          processedEventsRef.current.clear();
        }, 60000);

        // Initialize the service
        const interval = await invoke("get_update_interval");
        setUpdateInterval(interval);

        // Check if we need to perform an immediate check
        const storedNextCheck = localStorage.getItem("nextCheckTime");
        if (!storedNextCheck || new Date(storedNextCheck) <= new Date()) {
          performCheck();
        } else {
          setNextCheckTime(new Date(storedNextCheck));
          const timeUntilNext = new Date(storedNextCheck) - new Date();
          timeoutRef.current = setTimeout(() => {
            performCheck();
          }, timeUntilNext);
        }
      } catch (error) {
        console.error("Failed to setup update service:", error);
      }
    };

    setup();

    return () => {
      if (unlistenInterval) unlistenInterval();
      if (unlistenUpdate) unlistenUpdate();
      if (cleanupInterval) clearInterval(cleanupInterval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const value = {
    lastChecked,
    nextCheckTime,
    isChecking,
    updateInterval,
    performCheck,
  };

  return <UpdateServiceContext.Provider value={value}>{children}</UpdateServiceContext.Provider>;
}

export function useUpdateService() {
  const context = useContext(UpdateServiceContext);
  if (!context) {
    throw new Error("useUpdateService must be used within an UpdateServiceProvider");
  }
  return context;
}
