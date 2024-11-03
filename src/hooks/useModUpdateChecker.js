import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export function useModUpdateChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);

  const checkForUpdates = async (updateInterval, onSuccess) => {
    try {
      setIsChecking(true);
      setError(null);

      // First, load the latest data
      const latestMods = await invoke("get_mods");
      console.log("Starting update check for", latestMods.length, "mods");

      let updatesFound = false;

      // Check each mod for updates using the latest data
      for (const mod of latestMods) {
        const modId = mod.mod_info ? mod.mod_info.id : mod.id;
        const curseforgeId = mod.mod_info ? mod.mod_info.curseforge_id : mod.curseforge_id;
        const currentLastUpdated = mod.mod_info ? mod.mod_info.last_updated : mod.last_updated;

        console.log("Checking mod:", {
          modId,
          curseforgeId,
          currentLastUpdated,
        });

        const apiKey = await invoke("get_api_key");
        const updateInfo = await invoke("check_mod_update", {
          modId,
          curseforgeId,
          currentLastUpdated,
          apiKey,
        });

        console.log("Update check result:", updateInfo);

        if (updateInfo) {
          updatesFound = true;
          console.log("Update found for mod:", modId);

          // If there's an update, send notifications through enabled webhooks
          const modWebhooks = await invoke("get_mod_assigned_webhooks", { modId });
          console.log("Assigned webhooks:", modWebhooks);

          for (const webhook of modWebhooks) {
            if (webhook.enabled) {
              console.log("Sending notification through webhook:", webhook.id);
              console.log("UpdateInfo data:", updateInfo);
              try {
                const result = await invoke("send_update_notification", {
                  webhook,
                  modName: updateInfo.name,
                  modAuthor: updateInfo.mod_author,
                  newReleaseDate: updateInfo.new_update_time,
                  oldReleaseDate: updateInfo.old_update_time,
                  latestFileName: updateInfo.latest_file_name,
                  modId: updateInfo.mod_id,
                });
                console.log("Notification result:", result);
              } catch (error) {
                console.error("Failed to send webhook notification:", error);
                console.error("Webhook data:", webhook);
                console.error("Update info:", updateInfo);
              }
            }
          }
        } else {
          console.log("No update found for mod:", modId);
        }
      }

      // Reset countdown timer
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
    }
  };

  /**
   * Get the loading state of the update check
   */
  const getIsChecking = () => isChecking;

  /**
   * Get any error that occurred during the update check
   */
  const getError = () => error;

  /**
   * Clear any error that occurred during the update check
   */
  const clearError = () => setError(null);

  return {
    isChecking,
    error,
    checkForUpdates,
    getIsChecking,
    getError,
    clearError,
  };
}
