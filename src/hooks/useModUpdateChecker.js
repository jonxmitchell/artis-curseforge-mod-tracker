import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { emit } from "@tauri-apps/api/event";

export function useModUpdateChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const checkInProgressRef = useRef(false);

  const performUpdate = async (modId, curseforgeId, currentLastUpdated, apiKey) => {
    const updateInfo = await invoke("check_mod_update", {
      modId,
      curseforgeId,
      currentLastUpdated,
      apiKey,
    });

    if (updateInfo) {
      const modWebhooks = await invoke("get_mod_assigned_webhooks", { modId });
      console.log("Mod update found, assigned webhooks:", modWebhooks);

      for (const webhook of modWebhooks) {
        if (webhook.enabled) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await invoke("send_update_notification", {
              webhook,
              modName: updateInfo.name,
              modAuthor: updateInfo.mod_author,
              newReleaseDate: updateInfo.new_update_time,
              oldReleaseDate: updateInfo.old_update_time,
              latestFileName: updateInfo.latest_file_name,
              modId: updateInfo.mod_id,
              logoUrl: updateInfo.logo_url,
            });
          } catch (error) {
            console.error("Failed to send webhook notification:", error);
          }
        }
      }
    }
    return updateInfo;
  };

  const checkForUpdates = async (updateInterval, onSuccess) => {
    if (checkInProgressRef.current) {
      console.log("Update check already in progress, skipping...");
      return;
    }

    try {
      setIsChecking(true);
      checkInProgressRef.current = true;
      setError(null);

      const apiKey = await invoke("get_api_key");
      if (!apiKey) {
        throw new Error("No API key found");
      }

      // Get current interval if not provided
      const currentInterval = updateInterval || (await invoke("get_update_interval"));

      const latestMods = await invoke("get_mods");
      console.log("Starting update check for", latestMods.length, "mods");

      let updatesFound = false;

      for (const mod of latestMods) {
        const modId = mod.mod_info ? mod.mod_info.id : mod.id;
        const curseforgeId = mod.mod_info ? mod.mod_info.curseforge_id : mod.curseforge_id;
        const currentLastUpdated = mod.mod_info ? mod.mod_info.last_updated : mod.last_updated;

        try {
          const updateInfo = await performUpdate(modId, curseforgeId, currentLastUpdated, apiKey);
          if (updateInfo) updatesFound = true;
        } catch (error) {
          console.error(`Error checking mod ${modId}:`, error);
        }
      }

      // Emit event with current timestamp and interval
      const checkTime = new Date();
      await emit("update_check_completed", {
        timestamp: checkTime.toISOString(),
        interval: currentInterval,
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(latestMods, checkTime);
      }

      return { success: true, mods: latestMods, updatesFound, timestamp: checkTime };
    } catch (error) {
      console.error("Failed to check for updates:", error);
      setError("Failed to check for updates. Please try again.");
      return { success: false, error };
    } finally {
      setIsChecking(false);
      checkInProgressRef.current = false;
    }
  };

  return {
    isChecking,
    error,
    checkForUpdates,
  };
}
