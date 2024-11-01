use crate::database::{webhooks, Webhook};
use rusqlite::Connection;
use tauri::AppHandle;
use crate::database::{get_database_path, ensure_database_exists};
use reqwest::Client;
use serde_json::json;
use anyhow::Result;

#[tauri::command]
pub fn add_webhook(app_handle: AppHandle, webhook: Webhook) -> Result<Webhook, String> {
    let db_path = get_database_path(&app_handle);
    ensure_database_exists(&db_path).map_err(|e| e.to_string())?;
    
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let webhook_id = webhooks::insert_webhook(&conn, &webhook).map_err(|e| e.to_string())?;

    let mut new_webhook = webhook;
    new_webhook.id = Some(webhook_id);
    
    Ok(new_webhook)
}

#[tauri::command]
pub fn get_webhooks(app_handle: AppHandle) -> Result<Vec<Webhook>, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    webhooks::get_all_webhooks(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_webhook(app_handle: AppHandle, webhook: Webhook) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    webhooks::update_webhook(&conn, &webhook).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_webhook(app_handle: AppHandle, webhook_id: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    webhooks::delete_webhook(&conn, webhook_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_webhook(webhook: Webhook) -> Result<bool, String> {
    let client = Client::new();
    
    let payload = json!({
        "username": webhook.username.unwrap_or_else(|| "Mod Tracker".to_string()),
        "avatar_url": webhook.avatar_url,
        "content": "🧪 This is a test message from Arti's CurseForge Mod Tracker!"
    });

    let response = client
        .post(&webhook.url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(response.status().is_success())
}

#[tauri::command]
pub async fn send_update_notification(
    webhook: Webhook,
    mod_name: String,
    old_version: String,
    new_version: String,
    game_version: String
) -> Result<bool, String> {
    let client = Client::new();
    
    let payload = json!({
        "username": webhook.username.unwrap_or_else(|| "Mod Tracker".to_string()),
        "avatar_url": webhook.avatar_url,
        "embeds": [{
            "title": "🔄 Mod Update Available!",
            "color": 5814783,
            "fields": [
                {
                    "name": "Mod Name",
                    "value": mod_name,
                    "inline": true
                },
                {
                    "name": "Game Version",
                    "value": game_version,
                    "inline": true
                },
                {
                    "name": "Old Version",
                    "value": old_version,
                    "inline": true
                },
                {
                    "name": "New Version",
                    "value": new_version,
                    "inline": true
                }
            ],
            "timestamp": chrono::Utc::now().to_rfc3339()
        }]
    });

    let response = client
        .post(&webhook.url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(response.status().is_success())
}