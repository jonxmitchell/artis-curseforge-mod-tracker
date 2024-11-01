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
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LatestFileIndex {
    #[serde(rename = "gameVersion")]
    game_version: String,
    filename: String,
}

#[derive(Debug, Serialize)]
pub struct ModUpdateInfo {
    mod_id: i64,
    name: String,
    old_version: String,
    new_version: String,
    game_version: String,
}

#[tauri::command]
pub async fn check_mod_update(
    app_handle: AppHandle,
    mod_id: i64,
    curseforge_id: i64,
    current_version: String,
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

    let curse_data: CurseForgeResponse = response
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let latest_file = curse_data.data.latest_files_indexes
        .first()
        .ok_or("No files found for mod")?;

    if latest_file.filename != current_version {
        let db_path = get_database_path(&app_handle);
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
        
        mods::update_mod_version(&conn, mod_id, &latest_file.filename)
            .map_err(|e| e.to_string())?;

        Ok(Some(ModUpdateInfo {
            mod_id,
            name: curse_data.data.name,
            old_version: current_version,
            new_version: latest_file.filename.clone(),
            game_version: latest_file.game_version.clone(),
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn add_mod(
    app_handle: AppHandle,
    curseforge_id: i64,
    api_key: String,
) -> Result<ModWithWebhooks, String> {
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

    let curse_data: CurseForgeResponse = response
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let latest_file = curse_data.data.latest_files_indexes
        .first()
        .ok_or("No files found for mod")?;

    let mod_data = Mod {
        id: None,
        curseforge_id,
        name: curse_data.data.name,
        last_version: latest_file.filename.clone(),
        last_checked: chrono::Utc::now(),
        game_version: latest_file.game_version.clone(),
    };

    let db_path = get_database_path(&app_handle);
    ensure_database_exists(&db_path).map_err(|e| e.to_string())?;
    
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let mod_id = mods::insert_mod(&conn, &mod_data).map_err(|e| e.to_string())?;

    let mut mod_with_webhooks = ModWithWebhooks {
        mod_info: mod_data,
        webhook_ids: Vec::new(),
    };
    mod_with_webhooks.mod_info.id = Some(mod_id);

    Ok(mod_with_webhooks)
}

#[tauri::command]
pub fn get_mods(app_handle: AppHandle) -> Result<Vec<ModWithWebhooks>, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    mods::get_all_mods(&conn).map_err(|e| e.to_string())
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