import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { emit } from "@tauri-apps/api/event";

export function useModUpdateChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const checkInProgressRef = useRef(false);
  const lastUpdateRef = useRef(null);

  const performUpdate = async (modId, curseforgeId, currentLastUpdated, apiKey) => {
    const updateInfo = await invoke("check_mod_update", {
      modId,
      curseforgeId,
      currentLastUpdated,
      apiKey,
    });

    if (updateInfo) {
      // Generate unique update identifier
      const updateId = `${modId}-${Date.now()}`;

      // Check if this exact update was just processed
      if (lastUpdateRef.current === updateId) {
        console.log("Duplicate update detected, skipping webhook notifications");
        return updateInfo;
      }

      lastUpdateRef.current = updateId;

      // If there's an update, send notifications through enabled webhooks
      const modWebhooks = await invoke("get_mod_assigned_webhooks", { modId });
      console.log(`Mod "${updateInfo.name}" updated, sending notifications to ${modWebhooks.length} webhooks`);

      // Set of processed webhook IDs to prevent duplicates
      const processedWebhooks = new Set();

      // Process each webhook sequentially with proper delays
      for (const webhook of modWebhooks) {
        if (webhook.enabled && !processedWebhooks.has(webhook.id)) {
          processedWebhooks.add(webhook.id);

          try {
            // Add substantial delay between webhook calls
            await new Promise((resolve) => setTimeout(resolve, 2000));

            console.log(`Sending notification to webhook: ${webhook.name}`);
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
            console.log(`Successfully sent notification to webhook: ${webhook.name}`);
          } catch (error) {
            if (error.toString().includes("rate limited")) {
              // Wait longer for rate limit
              console.log(`Rate limited for webhook ${webhook.name}, waiting 5 seconds before retry...`);
              await new Promise((resolve) => setTimeout(resolve, 5000));

              try {
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
                console.log(`Retry successful for webhook: ${webhook.name}`);
              } catch (retryError) {
                console.error(`Failed to send webhook notification after retry: ${webhook.name}`, retryError);
              }
            } else {
              console.error(`Failed to send webhook notification: ${webhook.name}`, error);
            }
          }

          // Add delay after processing each webhook regardless of success/failure
          await new Promise((resolve) => setTimeout(resolve, 1000));
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

      const currentInterval = updateInterval || (await invoke("get_update_interval"));
      const latestMods = await invoke("get_mods");
      console.log("Starting update check for", latestMods.length, "mods");

      let updatesFound = false;

      // Clear last update reference at start of new check
      lastUpdateRef.current = null;

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

      const checkTime = new Date();
      // Add unique identifier to event to prevent duplicates
      const eventId = Date.now().toString();
      await emit("update_check_completed", {
        timestamp: checkTime.toISOString(),
        interval: currentInterval,
        eventId,
      });

      if (onSuccess) {
        onSuccess(latestMods, checkTime);
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
