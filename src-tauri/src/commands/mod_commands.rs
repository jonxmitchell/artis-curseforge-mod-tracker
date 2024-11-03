use crate::database::{mods, Mod, ModWithWebhooks};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use crate::database::{get_database_path, ensure_database_exists};
use anyhow::Result;
use reqwest::header::HeaderMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct CurseForgeResponse {
    data: CurseForgeModData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CurseForgeModData {
    id: i64,
    name: String,
    #[serde(rename = "latestFilesIndexes")]
    latest_files_indexes: Vec<LatestFileIndex>,
    #[serde(rename = "gameId")]
    game_id: i64,
    #[serde(rename = "dateModified")]
    date_modified: String,
    #[serde(rename = "dateReleased")]
    date_released: String,
    authors: Vec<ModAuthor>,
    #[serde(rename = "latestFiles")]
    latest_files: Vec<ModFile>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModAuthor {
    name: String,
    url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModFile {
    #[serde(rename = "fileName")]
    file_name: String,
    #[serde(rename = "gameVersion")]
    game_version: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LatestFileIndex {
    #[serde(rename = "gameVersion")]
    game_version: String,
    filename: String,
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

#[derive(Debug, Serialize)]
pub struct ModUpdateInfo {
    pub mod_id: i64,
    pub name: String,
    pub old_update_time: String,
    pub new_update_time: String,
    pub game_version: String,
    pub old_version: String,
    pub new_version: String,
    pub mod_author: String,
    pub latest_file_name: String,
}

async fn get_game_name(client: &reqwest::Client, game_id: i64, api_key: &str) -> Result<String, String> {
    let mut headers = HeaderMap::new();
    headers.insert("x-api-key", api_key.parse().unwrap());

    let url = format!(
        "https://api.curseforge.com/v1/games/{}", 
        game_id
    );

    let response = client
        .get(url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Failed to fetch game details: {}", response.status()));
    }

    let game_data: CurseForgeGameResponse = response
        .json()
        .await
        .map_err(|e| e.to_string())?;

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
        |_| Ok(())
    );

    if let Ok(_) = existing_mod {
        return Err("A mod with this CurseForge ID already exists.".to_string());
    }

    // Create HTTP client for reuse
    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert("x-api-key", api_key.parse().unwrap());

    // Fetch mod data
    let url = format!(
        "https://api.curseforge.com/v1/mods/{}", 
        curseforge_id
    );

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
        return Err(format!("Failed to fetch mod from CurseForge: {}", response.status()));
    }

    let curse_data: CurseForgeResponse = response
        .json()
        .await
        .map_err(|e| e.to_string())?;

    // Fetch game name
    let game_name = get_game_name(&client, curse_data.data.game_id, &api_key).await?;
    println!("Found game: {} (ID: {})", game_name, curse_data.data.game_id);

    let mod_data = Mod {
        id: None,
        curseforge_id,
        name: curse_data.data.name,
        game_name,
        last_updated: curse_data.data.date_modified,
    };

    ensure_database_exists(&db_path).map_err(|e| e.to_string())?;
    
    let mod_id = mods::insert_mod(&conn, &mod_data).map_err(|e| e.to_string())?;

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

    let url = format!(
        "https://api.curseforge.com/v1/mods/{}", 
        curseforge_id
    );

    let response = client
        .get(url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Failed to fetch mod from CurseForge: {}", response.status()));
    }

    let curse_data: CurseForgeResponse = response
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let new_date = curse_data.data.date_modified.clone();

    if new_date != current_last_updated {
        let db_path = get_database_path(&app_handle);
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
        
        mods::update_mod_last_updated(&conn, mod_id, &new_date)
            .map_err(|e| e.to_string())?;

        // Extract the latest file info and game version
        let latest_file = curse_data.data.latest_files.first()
            .ok_or_else(|| "No files found for mod".to_string())?;
        let game_version = latest_file.game_version.first()
            .ok_or_else(|| "No game version found".to_string())?;

        // Extract the author info
        let author_name = curse_data.data.authors.first()
            .map(|author| author.name.clone())
            .unwrap_or_else(|| "Unknown Author".to_string());

        Ok(Some(ModUpdateInfo {
            mod_id,
            name: curse_data.data.name,
            old_update_time: current_last_updated,
            new_update_time: new_date,
            game_version: game_version.clone(),
            old_version: "Previous Version".to_string(), // You might want to store and track this
            new_version: latest_file.file_name.clone(),
            mod_author: author_name,
            latest_file_name: latest_file.file_name.clone(),
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
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    mods::delete_mod(&conn, mod_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn assign_webhook(app_handle: AppHandle, mod_id: i64, webhook_id: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    mods::assign_webhook_to_mod(&conn, mod_id, webhook_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_webhook_assignment(app_handle: AppHandle, mod_id: i64, webhook_id: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    mods::remove_webhook_from_mod(&conn, mod_id, webhook_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_mod_assigned_webhooks(app_handle: AppHandle, mod_id: i64) -> Result<Vec<crate::database::Webhook>, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    crate::database::webhooks::get_mod_webhooks(&conn, mod_id).map_err(|e| e.to_string())
}