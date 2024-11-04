use crate::database::{Activity, add_activity, get_recent_activities, clear_activities, get_database_path};
use rusqlite::Connection;
use tauri::AppHandle;
use chrono::Utc;

#[tauri::command]
pub async fn add_activity_entry(
    app_handle: AppHandle,
    activity_type: String,
    mod_id: Option<i64>,
    mod_name: Option<String>,
    description: String,
    metadata: Option<String>,
) -> Result<i64, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    let activity = Activity {
        id: None,
        activity_type,
        mod_id,
        mod_name,
        description,
        timestamp: Utc::now(),
        metadata,
    };

    add_activity(Some(&app_handle), &conn, &activity).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_activities(
    app_handle: AppHandle,
    limit: Option<i64>,
) -> Result<Vec<Activity>, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    get_recent_activities(&conn, limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_activity_history(
    app_handle: AppHandle,
) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    clear_activities(&conn).map_err(|e| e.to_string())
}