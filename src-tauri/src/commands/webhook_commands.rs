use crate::database::{
    webhooks, Webhook,
    webhook_templates::get_webhook_template,
    activities::{Activity, add_activity},
    get_database_path, ensure_database_exists,
};
use reqwest::Client;
use serde_json::json;
use chrono::{DateTime, Utc, Datelike};
use rusqlite::Connection;
use tauri::AppHandle;

#[derive(Debug)]
struct ModUpdateData {
    mod_id: i64,
    mod_name: String,
    mod_author: String,
    new_release_date: String,
    old_release_date: String,
    latest_file_name: String,
}

fn get_ordinal_suffix(day: u32) -> &'static str {
    if (11..=13).contains(&(day % 100)) {
        return "th";
    }
    match day % 10 {
        1 => "st",
        2 => "nd",
        3 => "rd",
        _ => "th",
    }
}

fn format_date(date_str: &str) -> String {
    if let Ok(date) = DateTime::parse_from_rfc3339(date_str) {
        let utc_date: DateTime<Utc> = date.into();
        let day = utc_date.day();
        let suffix = get_ordinal_suffix(day);
        
        format!(
            "{}{} {} {} at {:02}:{:02} UTC",
            day,
            suffix,
            utc_date.format("%B"),
            utc_date.format("%Y"),
            utc_date.format("%H"),
            utc_date.format("%M")
        )
    } else {
        date_str.to_string()
    }
}

fn replace_template_variables(text: &str, data: &ModUpdateData) -> String {
    let mut result = text.to_string();
    
    // Basic replacements
    let replacements = vec![
        ("{modID}", data.mod_id.to_string()),
        ("{modName}", data.mod_name.clone()),
        ("{newReleaseDate}", data.new_release_date.clone()),
        ("{oldPreviousDate}", data.old_release_date.clone()),
        ("{everyone}", "@everyone".to_string()),
        ("{here}", "@here".to_string()),
        ("{lastestModFileName}", data.latest_file_name.clone()),
        ("{modAuthorName}", data.mod_author.clone()),
    ];

    for (key, value) in replacements {
        result = result.replace(key, &value);
    }

    // Role mentions
    while let Some(start) = result.find("{&") {
        if let Some(end) = result[start..].find("}") {
            let role_id = &result[start + 2..start + end];
            if let Ok(id) = role_id.parse::<u64>() {
                result = result.replace(&format!("{{&{}}}", role_id), &format!("<@&{}>", id));
            }
        } else {
            break;
        }
    }

    // Channel mentions
    while let Some(start) = result.find("{#") {
        if let Some(end) = result[start..].find("}") {
            let channel_id = &result[start + 2..start + end];
            if let Ok(id) = channel_id.parse::<u64>() {
                result = result.replace(&format!("{{#{}}}", channel_id), &format!("<#{}>", id));
            }
        } else {
            break;
        }
    }

    result
}

#[tauri::command]
pub fn add_webhook(app_handle: AppHandle, webhook: Webhook) -> Result<Webhook, String> {
    let db_path = get_database_path(&app_handle);
    ensure_database_exists(&db_path).map_err(|e| e.to_string())?;
    
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;  // Changed to mut
    let webhook_id = webhooks::insert_webhook(&mut conn, &webhook).map_err(|e| e.to_string())?;  // Added mut

    // Log activity for webhook addition
    let activity = Activity {
        id: None,
        activity_type: "webhook_added".to_string(),
        mod_id: None,
        mod_name: None,
        description: format!("Added webhook \"{}\"", webhook.name),
        timestamp: Utc::now(),
        metadata: Some(json!({
            "webhook_name": webhook.name,
            "webhook_id": webhook_id,
        }).to_string()),
    };
    add_activity(Some(&app_handle), &conn, &activity).map_err(|e| e.to_string())?;

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
    webhooks::update_webhook(&mut conn, &webhook).map_err(|e| e.to_string())?;

    // Log activity for webhook update
    let activity = Activity {
        id: None,
        activity_type: "webhook_updated".to_string(),
        mod_id: None,
        mod_name: None,
        description: format!("Updated webhook \"{}\"", webhook.name),
        timestamp: Utc::now(),
        metadata: Some(json!({
            "webhook_name": webhook.name,
            "webhook_id": webhook.id,
        }).to_string()),
    };
    add_activity(Some(&app_handle), &conn, &activity).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_webhook(app_handle: AppHandle, webhook_id: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    // Get webhook info before deletion
    let webhook_name: String = conn.query_row(
        "SELECT name FROM webhooks WHERE id = ?1",
        [webhook_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    // Delete the webhook
    webhooks::delete_webhook(&mut conn, webhook_id).map_err(|e| e.to_string())?;

    // Log activity for webhook deletion
    let activity = Activity {
        id: None,
        activity_type: "webhook_removed".to_string(),
        mod_id: None,
        mod_name: None,
        description: format!("Removed webhook \"{}\"", webhook_name),
        timestamp: Utc::now(),
        metadata: Some(json!({
            "webhook_name": webhook_name,
            "webhook_id": webhook_id,
        }).to_string()),
    };
    add_activity(Some(&app_handle), &conn, &activity).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn test_webhook(webhook: Webhook) -> Result<bool, String> {
    let client = Client::new();
    
    let mut payload = json!({
        "embeds": [{
            "title": "🧪 Test Message",
            "description": "This is a test message from Arti's CurseForge Mod Tracker!",
            "color": 5814783,
            "footer": {
                "text": "Test completed successfully"
            },
            "timestamp": chrono::Utc::now().to_rfc3339()
        }]
    });

    payload["username"] = json!(webhook.username
        .and_then(|u| if u.trim().is_empty() { None } else { Some(u) })
        .unwrap_or_else(|| "Mod Tracker".to_string()));

    if let Some(avatar_url) = &webhook.avatar_url {
        if !avatar_url.trim().is_empty() {
            payload["avatar_url"] = json!(avatar_url);
        }
    }

    println!("Sending test webhook payload: {}", serde_json::to_string_pretty(&payload).unwrap());

    let response = client
        .post(&webhook.url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        println!("Discord API error: {}", error_text);
        return Err(format!("Discord API error: {}", error_text));
    }

    Ok(response.status().is_success())
}

#[tauri::command]
pub async fn send_update_notification(
    app_handle: AppHandle,
    webhook: Webhook,
    mod_name: String,
    mod_author: String,
    new_release_date: String,
    old_release_date: String,
    latest_file_name: String,
    mod_id: i64,
) -> Result<bool, String> {
    let client = Client::new();
    
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    let template = get_webhook_template(&conn, webhook.id.unwrap_or(-1))
        .map_err(|e| e.to_string())?;

    let update_data = ModUpdateData {
        mod_id,
        mod_name: mod_name.clone(),
        mod_author,
        new_release_date: format_date(&new_release_date),
        old_release_date: format_date(&old_release_date),
        latest_file_name,
    };

    let mut embed = json!({
        "title": replace_template_variables(&template.title, &update_data),
        "color": template.color,
        "fields": serde_json::from_str::<Vec<serde_json::Value>>(&template.embed_fields)
            .map_err(|e| e.to_string())?
            .iter()
            .map(|field| {
                let mut new_field = field.clone();
                let name = field["name"].as_str().unwrap_or("");
                let value = field["value"].as_str().unwrap_or("");
                new_field["name"] = json!(replace_template_variables(name, &update_data));
                new_field["value"] = json!(replace_template_variables(value, &update_data));
                new_field
            })
            .collect::<Vec<_>>()
    });

    if let Some(author_name) = &template.author_name {
        if !author_name.trim().is_empty() {
            let mut author = json!({
                "name": replace_template_variables(author_name, &update_data)
            });
            if let Some(icon_url) = &template.author_icon_url {
                if !icon_url.trim().is_empty() {
                    author["icon_url"] = json!(replace_template_variables(icon_url, &update_data));
                }
            }
            embed["author"] = author;
        }
    }

    if template.footer_text.as_ref().map_or(false, |t| !t.trim().is_empty()) 
        || template.footer_icon_url.as_ref().map_or(false, |u| !u.trim().is_empty()) 
        || template.include_timestamp 
    {
        let mut footer = json!({});
        if let Some(text) = &template.footer_text {
            if !text.trim().is_empty() {
                footer["text"] = json!(replace_template_variables(text, &update_data));
            }
        }
        if let Some(icon_url) = &template.footer_icon_url {
            if !icon_url.trim().is_empty() {
                footer["icon_url"] = json!(replace_template_variables(icon_url, &update_data));
            }
        }
        embed["footer"] = footer;
    }

    if template.include_timestamp {
        embed["timestamp"] = json!(chrono::Utc::now().to_rfc3339());
    }

    let mut payload = json!({
        "username": webhook.username
            .and_then(|u| if u.trim().is_empty() { None } else { Some(u) })
            .unwrap_or_else(|| "Mod Tracker".to_string()),
    });

    if let Some(avatar_url) = &webhook.avatar_url {
        if !avatar_url.trim().is_empty() {
            payload["avatar_url"] = json!(avatar_url);
        }
    }

    if template.use_embed {
        payload["embeds"] = json!([embed]);
    } else {
        let content = template.content
            .unwrap_or_else(|| "🔄 Mod Update Available!".to_string());
        payload["content"] = json!(replace_template_variables(&content, &update_data));
    }

    println!("Sending webhook payload: {}", serde_json::to_string_pretty(&payload).unwrap());

    let response = client
        .post(&webhook.url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let result = response.status().is_success();
    let error_text = if !result {
        Some(response.text().await.unwrap_or_else(|_| "Unknown error".to_string()))
    } else {
        None
    };

    // Log activity for notification result
    let activity = Activity {
        id: None,
        activity_type: if result { "notification_sent".to_string() } else { "webhook_error".to_string() },
        mod_id: Some(mod_id),
        mod_name: Some(mod_name.clone()),
        description: if result {
            format!("Sent update notification for \"{}\" to webhook \"{}\"", mod_name, webhook.name)
        } else {
            format!("Failed to send update notification for \"{}\" to webhook \"{}\"", mod_name, webhook.name)
        },
        timestamp: Utc::now(),
        metadata: Some(json!({
            "webhook_name": webhook.name,
            "webhook_id": webhook.id,
            "error": error_text,
        }).to_string()),
    };
    add_activity(Some(&app_handle), &conn, &activity).map_err(|e| e.to_string())?;

    if !result {
        if let Some(error_text) = error_text {
            println!("Discord API error: {}", error_text);
            return Err(format!("Discord API error: {}", error_text));
        }
    }

    Ok(result)
}