use crate::database::{webhooks, Webhook, WebhookTemplate};
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
    
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let webhook_id = webhooks::insert_webhook(&mut conn, &webhook).map_err(|e| e.to_string())?;

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
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    webhooks::update_webhook(&mut conn, &webhook).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_webhook(app_handle: AppHandle, webhook_id: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    webhooks::delete_webhook(&mut conn, webhook_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_webhook(webhook: Webhook) -> Result<bool, String> {
    let client = Client::new();
    
    let test_payload = json!({
        "username": webhook.username.unwrap_or_else(|| "Mod Tracker".to_string()),
        "avatar_url": webhook.avatar_url,
        "embeds": [{
            "title": "🧪 Test Message",
            "description": "This is a test message from Arti's CurseForge Mod Tracker!",
            "color": 5814783,
            "author": {
                "name": "Mod Tracker Test",
                "icon_url": webhook.avatar_url
            },
            "footer": {
                "text": "Test completed successfully"
            },
            "timestamp": chrono::Utc::now().to_rfc3339()
        }]
    });

    let response = client
        .post(&webhook.url)
        .json(&test_payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(response.status().is_success())
}

#[tauri::command]
pub fn get_webhook_template(app_handle: AppHandle, webhook_id: i64) -> Result<WebhookTemplate, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    webhooks::get_webhook_template(&conn, webhook_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_webhook_template(app_handle: AppHandle, template: WebhookTemplate) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    webhooks::update_webhook_template(&mut conn, &template).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_custom_template(app_handle: AppHandle, webhook_id: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    webhooks::delete_custom_template(&mut conn, webhook_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn send_update_notification(
    app_handle: AppHandle,
    webhook: Webhook,
    mod_name: String,
    old_version: String,
    new_version: String,
    game_version: String
) -> Result<bool, String> {
    let client = Client::new();
    
    // Get the webhook template
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let template = webhooks::get_webhook_template(&conn, webhook.id.unwrap_or(-1))
        .map_err(|e| e.to_string())?;

    let mut embed = json!({
        "title": template.title,
        "color": template.color,
        "fields": serde_json::from_str::<Vec<serde_json::Value>>(&template.embed_fields)
            .map_err(|e| e.to_string())?
            .iter()
            .map(|field| {
                let mut field = field.clone();
                let value = field["value"].as_str().unwrap_or("");
                field["value"] = json!(value
                    .replace("{mod_name}", &mod_name)
                    .replace("{game_version}", &game_version)
                    .replace("{old_version}", &old_version)
                    .replace("{new_version}", &new_version));
                field
            })
            .collect::<Vec<_>>()
    });

    // Add author if specified
    if let Some(author_name) = template.author_name {
        let mut author = json!({
            "name": author_name
        });
        if let Some(icon_url) = template.author_icon_url {
            author["icon_url"] = json!(icon_url);
        }
        embed["author"] = author;
    }

    // Add footer if specified
    if template.footer_text.is_some() || template.footer_icon_url.is_some() || template.include_timestamp {
        let mut footer = json!({});
        if let Some(text) = template.footer_text {
            footer["text"] = json!(text);
        }
        if let Some(icon_url) = template.footer_icon_url {
            footer["icon_url"] = json!(icon_url);
        }
        embed["footer"] = footer;
    }

    // Add timestamp if enabled
    if template.include_timestamp {
        embed["timestamp"] = json!(chrono::Utc::now().to_rfc3339());
    }

    let mut payload = json!({
        "username": webhook.username.unwrap_or_else(|| "Mod Tracker".to_string()),
        "avatar_url": webhook.avatar_url,
    });

    if template.use_embed {
        payload["embeds"] = json!([embed]);
    } else {
        let content = template.content.unwrap_or_else(|| "🔄 Mod Update Available!".to_string())
            .replace("{mod_name}", &mod_name)
            .replace("{game_version}", &game_version)
            .replace("{old_version}", &old_version)
            .replace("{new_version}", &new_version);
        payload["content"] = json!(content);
    }

    let response = client
        .post(&webhook.url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(response.status().is_success())
}