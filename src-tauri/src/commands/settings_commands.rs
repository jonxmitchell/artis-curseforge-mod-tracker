use tauri::AppHandle;
use rusqlite::Connection;
use crate::database::{
    get_database_path,
    get_api_key as get_api_key_db,
    set_api_key as set_api_key_db,
    get_update_interval as get_update_interval_db,
    set_update_interval as set_update_interval_db,
    get_show_quick_start as get_show_quick_start_db,
    set_show_quick_start as set_show_quick_start_db,
};

#[tauri::command]
pub async fn get_api_key(app_handle: AppHandle) -> Result<Option<String>, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    get_api_key_db(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_update_interval(app_handle: AppHandle) -> Result<i64, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    get_update_interval_db(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_api_key(app_handle: AppHandle, api_key: String) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    set_api_key_db(&conn, &api_key).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_update_interval(app_handle: AppHandle, interval: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    set_update_interval_db(&conn, interval).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_show_quick_start(app_handle: AppHandle) -> Result<bool, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    get_show_quick_start_db(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_show_quick_start(app_handle: AppHandle, show: bool) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    set_show_quick_start_db(&conn, show).map_err(|e| e.to_string())
}