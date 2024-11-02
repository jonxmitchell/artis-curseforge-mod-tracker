use tauri::AppHandle;
use rusqlite::Connection;
use crate::database::{get_database_path, settings};

#[tauri::command]
pub async fn get_api_key(app_handle: AppHandle) -> Result<Option<String>, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    settings::get_api_key(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_update_interval(app_handle: AppHandle) -> Result<i64, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    settings::get_update_interval(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_api_key(app_handle: AppHandle, api_key: String) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    settings::set_api_key(&conn, &api_key).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_update_interval(app_handle: AppHandle, interval: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    settings::set_update_interval(&conn, interval).map_err(|e| e.to_string())
}