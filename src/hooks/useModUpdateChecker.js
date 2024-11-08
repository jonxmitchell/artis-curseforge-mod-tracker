import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";

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
      // If there's an update, send notifications through enabled webhooks
      const modWebhooks = await invoke("get_mod_assigned_webhooks", { modId });
      console.log("Mod update found, assigned webhooks:", modWebhooks);

      // Use sequential sending instead of Promise.all to avoid rate limits
      for (const webhook of modWebhooks) {
        if (webhook.enabled) {
          try {
            // Add delay between webhook calls to prevent rate limiting
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

      const latestMods = await invoke("get_mods");
      console.log("Starting update check for", latestMods.length, "mods");

      let updatesFound = false;

      // Check each mod for updates
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

      // Reset countdown timer if provided
      if (updateInterval) {
        localStorage.setItem("nextCheckTime", new Date(Date.now() + updateInterval * 60 * 1000).toISOString());
      }

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(latestMods, updatesFound);
      }

      return { success: true, mods: latestMods, updatesFound };
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
