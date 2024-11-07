import { useState, useRef, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { emit } from "@tauri-apps/api/event";

// Constants
const COOLDOWN_DURATION = 30; // 30 seconds cooldown
const COOLDOWN_STORAGE_KEY = "update_check_cooldown";

export function useUpdateCheck(onSuccess) {
  const [isChecking, setIsChecking] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(() => {
    try {
      const storedCooldown = localStorage.getItem(COOLDOWN_STORAGE_KEY);
      if (storedCooldown) {
        const cooldownEnd = parseInt(storedCooldown, 10);
        const now = Date.now();
        if (cooldownEnd > now) {
          return Math.ceil((cooldownEnd - now) / 1000);
        }
      }
      return 0;
    } catch (error) {
      console.error("Failed to get stored cooldown:", error);
      return 0;
    }
  });
  const [error, setError] = useState(null);
  const cooldownTimerRef = useRef(null);

  const clearCooldownTimer = () => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  };

  const startCooldownTimer = () => {
    clearCooldownTimer();

    // Store cooldown end time in localStorage
    const cooldownEnd = Date.now() + COOLDOWN_DURATION * 1000;
    localStorage.setItem(COOLDOWN_STORAGE_KEY, cooldownEnd.toString());

    setCooldownRemaining(COOLDOWN_DURATION);

    cooldownTimerRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearCooldownTimer();
          localStorage.removeItem(COOLDOWN_STORAGE_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Initialize/resume cooldown timer if needed
  useEffect(() => {
    if (cooldownRemaining > 0 && !cooldownTimerRef.current) {
      cooldownTimerRef.current = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            clearCooldownTimer();
            localStorage.removeItem(COOLDOWN_STORAGE_KEY);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearCooldownTimer();
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (isChecking || cooldownRemaining > 0) return;

    try {
      setIsChecking(true);
      setError(null);

      // Get API key
      const apiKey = await invoke("get_api_key");
      if (!apiKey) {
        throw new Error("No API key found");
      }

      // Get current interval
      const currentInterval = await invoke("get_update_interval");

      // Get all mods
      const mods = await invoke("get_mods");

      // Check each mod for updates
      for (const mod of mods) {
        const modInfo = mod.mod_info || mod;
        await invoke("check_mod_update", {
          modId: modInfo.id,
          curseforgeId: modInfo.curseforge_id,
          currentLastUpdated: modInfo.last_updated,
          apiKey,
        });
      }

      // If all successful, start cooldown
      startCooldownTimer();

      // Emit event for successful update check
      const checkTime = new Date();
      await emit("update_check_completed", {
        timestamp: checkTime.toISOString(),
        interval: currentInterval,
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(mods, checkTime);
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      setError(error.toString());
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, cooldownRemaining, onSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCooldownTimer();
      // Don't remove the localStorage value on unmount
      // so it persists between page navigations
    };
  }, []);

  return {
    checkForUpdates,
    isChecking,
    cooldownRemaining,
    error,
  };
}
