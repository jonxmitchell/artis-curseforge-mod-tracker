use crate::database::{
    activities::{add_activity, Activity},
    ensure_database_exists, get_database_path,
    mods::{self, Mod, ModWithWebhooks},
};
use chrono::Utc;
use html_escape;
use reqwest::header::HeaderMap;
use rusqlite::{params, Connection, OptionalExtension, Result};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct CurseForgeResponse {
    data: CurseForgeModData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CurseForgeModData {
    pub id: i64,
    pub name: String,
    #[serde(rename = "dateModified")]
    pub date_modified: String,
    #[serde(rename = "dateReleased")]
    pub date_released: String,
    #[serde(rename = "dateCreated")]
    pub date_created: String,
    pub authors: Vec<ModAuthor>,
    #[serde(rename = "latestFiles")]
    pub latest_files: Vec<ModFile>,
    #[serde(rename = "gameId")]
    pub game_id: i64,
    pub logo: Option<ModLogo>,
    pub links: ModLinks,
    #[serde(rename = "mainFileId")]
    pub main_file_id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModLinks {
    #[serde(rename = "websiteUrl")]
    pub website_url: Option<String>,
    #[serde(rename = "wikiUrl")]
    pub wiki_url: Option<String>,
    #[serde(rename = "issuesUrl")]
    pub issues_url: Option<String>,
    #[serde(rename = "sourceUrl")]
    pub source_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModAuthor {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModFile {
    #[serde(rename = "fileName")]
    pub file_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModLogo {
    pub id: i64,
    #[serde(rename = "modId")]
    pub mod_id: i64,
    pub title: String,
    pub description: String,
    #[serde(rename = "thumbnailUrl")]
    pub thumbnail_url: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModUpdateInfo {
    pub mod_id: i64,
    pub curseforge_id: i64,
    pub name: String,
    pub old_update_time: String,
    pub new_update_time: String,
    pub mod_author: String,
    pub latest_file_name: String,
    pub logo_url: Option<String>,
    pub changelog: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CurseForgeGameResponse {
    data: CurseForgeGameData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CurseForgeGameData {
    id: i64,
    name: String,
}

async fn get_game_name(
    client: &reqwest::Client,
    game_id: i64,
    api_key: &str,
) -> Result<String, String> {
    let mut headers = HeaderMap::new();
    headers.insert("x-api-key", api_key.parse().unwrap());

    let url = format!("https://api.curseforge.com/v1/games/{}", game_id);

    let response = client
        .get(url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to fetch game details: {}",
            response.status()
        ));
    }

    let game_data: CurseForgeGameResponse = response.json().await.map_err(|e| e.to_string())?;

    Ok(game_data.data.name)
}

#[tauri::command]
pub async fn add_mod(
    app_handle: AppHandle,
    curseforge_id: i64,
    api_key: String,
) -> Result<ModWithWebhooks, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // Check for existing mod
    let existing_mod = conn.query_row(
        "SELECT id FROM mods WHERE curseforge_id = ?1",
        [curseforge_id],
        |_| Ok(()),
    );

    if let Ok(_) = existing_mod {
        return Err("A mod with this CurseForge ID already exists.".to_string());
    }

    // Create HTTP client for reuse
    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert("x-api-key", api_key.parse().unwrap());

    // Fetch mod data
    let url = format!("https://api.curseforge.com/v1/mods/{}", curseforge_id);

    let response = client
        .get(url)
        .headers(headers.clone())
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        if response.status().as_u16() == 404 {
            return Err("Mod not found on CurseForge.".to_string());
        }
        return Err(format!(
            "Failed to fetch mod from CurseForge: {}",
            response.status()
        ));
    }

    let curse_data: CurseForgeResponse = response.json().await.map_err(|e| e.to_string())?;

    // Get page URL from the response
    let page_url = curse_data.data.links.website_url.unwrap_or_default();

    // Fetch game name
    let game_name = get_game_name(&client, curse_data.data.game_id, &api_key).await?;
    println!(
        "Found game: {} (ID: {})",
        game_name, curse_data.data.game_id
    );

    let mod_data = Mod {
        id: None,
        curseforge_id,
        name: curse_data.data.name.clone(),
        game_name: game_name.clone(),
        last_updated: curse_data.data.date_released.clone(),
        page_url: Some(page_url.clone()),
    };

    ensure_database_exists(&db_path).map_err(|e| e.to_string())?;

    let mod_id = mods::insert_mod(&conn, &mod_data).map_err(|e| e.to_string())?;

    // Log activity for mod addition
    let activity = Activity {
        id: None,
        activity_type: "mod_added".to_string(),
        mod_id: Some(mod_id),
        mod_name: Some(curse_data.data.name.clone()),
        description: format!("Added mod \"{}\"", curse_data.data.name),
        timestamp: Utc::now(),
        metadata: Some(
            json!({
                "game": game_name,
                "curseforge_id": curseforge_id,
                "initial_version_date": curse_data.data.date_released,
                "page_url": page_url,
            })
            .to_string(),
        ),
    };
    add_activity(Some(&app_handle), &conn, &activity).map_err(|e| e.to_string())?;

    let mut mod_with_webhooks = ModWithWebhooks {
        mod_info: mod_data,
        webhook_ids: Vec::new(),
    };
    mod_with_webhooks.mod_info.id = Some(mod_id);

    Ok(mod_with_webhooks)
}

#[tauri::command]
pub async fn check_mod_update(
    app_handle: AppHandle,
    mod_id: i64,
    curseforge_id: i64,
    current_last_updated: String,
    api_key: String,
) -> Result<Option<ModUpdateInfo>, String> {
    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert("x-api-key", api_key.parse().unwrap());

    let url = format!("https://api.curseforge.com/v1/mods/{}", curseforge_id);

    let response = client
        .get(&url)
        .headers(headers.clone())
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to fetch mod from CurseForge: {}",
            response.status()
        ));
    }

    let curse_data: CurseForgeResponse = response.json().await.map_err(|e| e.to_string())?;

    let new_date = curse_data.data.date_released.clone();

    if new_date != current_last_updated {
        let db_path = get_database_path(&app_handle);
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

        // Get changelog for the latest file
        let changelog_url = format!(
            "https://api.curseforge.com/v1/mods/{}/files/{}/changelog",
            curseforge_id, curse_data.data.main_file_id
        );

        let changelog_response = client
            .get(&changelog_url)
            .headers(headers.clone())
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let changelog_text = if changelog_response.status().is_success() {
            let changelog: serde_json::Value =
                changelog_response.json().await.map_err(|e| e.to_string())?;

            changelog["data"].as_str().map(|html| {
                html_escape::decode_html_entities(html)
                    .to_string()
                    .replace(|c: char| !c.is_ascii() && !c.is_whitespace(), "")
                    .replace("<p>", "") // Remove opening p tags
                    .replace("</p>", "\n") // Replace closing p tags with newlines
                    .replace("<br>", "\n") // Replace br tags with newlines
                    .replace("<br/>", "\n") // Replace self-closing br tags
                    .replace("<br />", "\n") // Replace self-closing br tags with space
                    .trim() // Remove any leading/trailing whitespace
                    .to_string()
            })
        } else {
            None
        };

        mods::update_mod_last_updated(&conn, mod_id, &new_date).map_err(|e| e.to_string())?;

        // Extract the latest file info
        let latest_file = curse_data
            .data
            .latest_files
            .first()
            .ok_or_else(|| "No files found for mod".to_string())?;

        let author_name = curse_data
            .data
            .authors
            .first()
            .map(|author| author.name.clone())
            .unwrap_or_else(|| "Unknown Author".to_string());

        // Get logo URL if available
        let logo_url = curse_data.data.logo.map(|logo| logo.url);

        // Always log the mod update activity
        let activity = Activity {
            id: None,
            activity_type: "mod_updated".to_string(),
            mod_id: Some(mod_id),
            mod_name: Some(curse_data.data.name.clone()),
            description: format!("\"{}\" has been updated", curse_data.data.name),
            timestamp: Utc::now(),
            metadata: Some(
                json!({
                    "old_version_date": current_last_updated,
                    "new_version_date": new_date,
                    "author": author_name.clone(),
                    "latest_file": latest_file.file_name.clone(),
                    "logo_url": logo_url,
                    "page_url": curse_data.data.links.website_url,
                    "changelog": changelog_text,
                })
                .to_string(),
            ),
        };
        add_activity(Some(&app_handle), &conn, &activity).map_err(|e| e.to_string())?;

        Ok(Some(ModUpdateInfo {
            mod_id,
            curseforge_id,
            name: curse_data.data.name,
            old_update_time: current_last_updated,
            new_update_time: new_date,
            mod_author: author_name,
            latest_file_name: latest_file.file_name.clone(),
            logo_url,
            changelog: changelog_text,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn get_mods(app_handle: AppHandle) -> Result<Vec<ModWithWebhooks>, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let mods = mods::get_all_mods(&conn).map_err(|e| e.to_string())?;
    Ok(mods)
}

#[tauri::command]
pub fn delete_mod(app_handle: AppHandle, mod_id: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // Enable foreign key support
    conn.execute("PRAGMA foreign_keys = ON", [])
        .map_err(|e| e.to_string())?;

    // Start a transaction
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    println!("Starting mod deletion process for mod_id: {}", mod_id);

    // Get mod info before deletion for activity log
    let mod_info: Option<(String, String)> = tx
        .query_row(
            "SELECT name, game_name FROM mods WHERE id = ?1",
            params![mod_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if let Some((name, game_name)) = mod_info {
        // Clear relations first
        println!("Clearing mod webhook assignments...");
        tx.execute(
            "DELETE FROM mod_webhook_assignments WHERE mod_id = ?1",
            params![mod_id],
        )
        .map_err(|e| format!("Failed to delete webhook assignments: {}", e))?;

        println!("Updating activities...");
        tx.execute(
            "UPDATE activities SET mod_id = NULL WHERE mod_id = ?1",
            params![mod_id],
        )
        .map_err(|e| format!("Failed to update activities: {}", e))?;

        // Delete the mod
        println!("Deleting mod {}...", name);
        tx.execute("DELETE FROM mods WHERE id = ?1", params![mod_id])
            .map_err(|e| format!("Failed to delete mod: {}", e))?;

        // Add deletion activity
        println!("Logging deletion activity...");
        tx.execute(
            "INSERT INTO activities (
                activity_type, mod_id, mod_name, description, timestamp, metadata
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                "mod_removed",
                Option::<i64>::None,
                name.clone(),
                format!("Removed mod \"{}\"", name),
                Utc::now().to_rfc3339(),
                json!({
                    "game": game_name,
                    "deleted_mod_id": mod_id
                })
                .to_string(),
            ],
        )
        .map_err(|e| format!("Failed to log activity: {}", e))?;

        println!("Committing transaction...");
        tx.commit()
            .map_err(|e| format!("Failed to commit transaction: {}", e))?;

        println!("Mod deletion completed successfully");
        Ok(())
    } else {
        Err("Mod not found".to_string())
    }
}

#[tauri::command]
pub fn assign_webhook(app_handle: AppHandle, mod_id: i64, webhook_id: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // Get mod and webhook info for activity log
    let mod_name: String = conn
        .query_row("SELECT name FROM mods WHERE id = ?1", [mod_id], |row| {
            row.get(0)
        })
        .map_err(|e| e.to_string())?;

    let webhook_name: String = conn
        .query_row(
            "SELECT name FROM webhooks WHERE id = ?1",
            [webhook_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Assign webhook
    mods::assign_webhook_to_mod(&conn, mod_id, webhook_id).map_err(|e| e.to_string())?;

    // Log activity for webhook assignment
    let activity = Activity {
        id: None,
        activity_type: "webhook_assigned".to_string(),
        mod_id: Some(mod_id),
        mod_name: Some(mod_name.clone()),
        description: format!(
            "Assigned webhook \"{}\" to mod \"{}\"",
            webhook_name, mod_name
        ),
        timestamp: Utc::now(),
        metadata: Some(
            json!({
                "webhook_id": webhook_id,
                "webhook_name": webhook_name
            })
            .to_string(),
        ),
    };
    add_activity(Some(&app_handle), &conn, &activity).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn remove_webhook_assignment(
    app_handle: AppHandle,
    mod_id: i64,
    webhook_id: i64,
) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // Get mod and webhook info for activity log
    let mod_name: String = conn
        .query_row("SELECT name FROM mods WHERE id = ?1", [mod_id], |row| {
            row.get(0)
        })
        .map_err(|e| e.to_string())?;

    let webhook_name: String = conn
        .query_row(
            "SELECT name FROM webhooks WHERE id = ?1",
            [webhook_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Remove webhook assignment
    mods::remove_webhook_from_mod(&conn, mod_id, webhook_id).map_err(|e| e.to_string())?;

    // Log activity for webhook removal
    let activity = Activity {
        id: None,
        activity_type: "webhook_unassigned".to_string(),
        mod_id: Some(mod_id),
        mod_name: Some(mod_name.clone()),
        description: format!(
            "Removed webhook \"{}\" from mod \"{}\"",
            webhook_name, mod_name
        ),
        timestamp: Utc::now(),
        metadata: Some(
            json!({
                "webhook_id": webhook_id,
                "webhook_name": webhook_name
            })
            .to_string(),
        ),
    };
    add_activity(Some(&app_handle), &conn, &activity).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_mod_assigned_webhooks(
    app_handle: AppHandle,
    mod_id: i64,
) -> Result<Vec<crate::database::Webhook>, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    crate::database::webhooks::get_mod_webhooks(&conn, mod_id).map_err(|e| e.to_string())
}
