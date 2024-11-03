use crate::database::webhook_templates::{
    WebhookTemplate,
    get_webhook_template as db_get_webhook_template,
    update_webhook_template as db_update_webhook_template,
    delete_custom_template as db_delete_custom_template
};
use rusqlite::Connection;
use tauri::AppHandle;
use crate::database::get_database_path;
use serde_json::Value;

/// Gets the template for a webhook. If webhook_id is -1, returns the default template.
/// Otherwise, returns the custom template for the specified webhook if it exists,
/// or falls back to the default template.
#[tauri::command]
pub fn get_webhook_template(app_handle: AppHandle, webhook_id: i64) -> Result<WebhookTemplate, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    db_get_webhook_template(&conn, webhook_id).map_err(|e| e.to_string())
}

/// Updates a webhook template. If the template is marked as default (is_default = true),
/// updates the default template. Otherwise, creates or updates a custom template for
/// the specified webhook.
#[tauri::command]
pub fn update_webhook_template(app_handle: AppHandle, template: WebhookTemplate) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    // Validate embed fields format
    validate_embed_fields(&template.embed_fields)
        .map_err(|e| format!("Invalid embed fields format: {}", e))?;
    
    db_update_webhook_template(&mut conn, &template)
        .map_err(|e| e.to_string())
}

/// Deletes a custom template for a webhook and resets it to use the default template.
#[tauri::command]
pub fn delete_custom_template(app_handle: AppHandle, webhook_id: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let mut conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    db_delete_custom_template(&mut conn, webhook_id).map_err(|e| e.to_string())
}

/// Validates that the embed fields string is proper JSON in the expected format
fn validate_embed_fields(fields_str: &str) -> Result<(), String> {
    let fields: Vec<Value> = serde_json::from_str(fields_str)
        .map_err(|e| format!("Invalid JSON: {}", e))?;
    
    for (i, field) in fields.iter().enumerate() {
        // Check that each field is an object
        if !field.is_object() {
            return Err(format!("Field {} is not an object", i));
        }

        let obj = field.as_object().unwrap();

        // Check required fields
        if !obj.contains_key("name") {
            return Err(format!("Field {} missing 'name' property", i));
        }
        if !obj.contains_key("value") {
            return Err(format!("Field {} missing 'value' property", i));
        }
        if !obj.contains_key("inline") {
            return Err(format!("Field {} missing 'inline' property", i));
        }

        // Validate types
        if !obj["name"].is_string() {
            return Err(format!("Field {} 'name' must be a string", i));
        }
        if !obj["value"].is_string() {
            return Err(format!("Field {} 'value' must be a string", i));
        }
        if !obj["inline"].is_boolean() {
            return Err(format!("Field {} 'inline' must be a boolean", i));
        }
    }

    Ok(())
}