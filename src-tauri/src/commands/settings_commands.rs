use crate::database::{
    get_api_key as get_api_key_db, get_close_to_tray as get_close_to_tray_db, get_database_path,
    get_minimize_to_tray as get_minimize_to_tray_db,
    get_show_quick_start as get_show_quick_start_db, get_update_interval as get_update_interval_db,
    set_api_key as set_api_key_db, set_close_to_tray as set_close_to_tray_db,
    set_minimize_to_tray as set_minimize_to_tray_db,
    set_show_quick_start as set_show_quick_start_db, set_update_interval as set_update_interval_db,
};
use rusqlite::Connection;
use tauri::AppHandle;

#[tauri::command]
pub async fn get_api_key(app_handle: AppHandle) -> Result<Option<String>, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| {
        println!("Failed to open database: {}", e);
        e.to_string()
    })?;

    match get_api_key_db(&conn) {
        Ok(maybe_key) => {
            println!(
                "Successfully retrieved API key status: {}",
                maybe_key.is_some()
            );
            Ok(maybe_key)
        }
        Err(e) => {
            println!("Error retrieving API key: {}", e);
            Err(format!("Failed to retrieve API key: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_update_interval(app_handle: AppHandle) -> Result<i64, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| {
        println!("Failed to open database: {}", e);
        e.to_string()
    })?;

    match get_update_interval_db(&conn) {
        Ok(interval) => {
            println!("Successfully retrieved update interval: {}", interval);
            Ok(interval)
        }
        Err(e) => {
            println!("Error retrieving update interval: {}", e);
            Err(format!("Failed to retrieve update interval: {}", e))
        }
    }
}

#[tauri::command]
pub async fn set_api_key(app_handle: AppHandle, api_key: String) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| {
        println!("Failed to open database: {}", e);
        e.to_string()
    })?;

    match set_api_key_db(&conn, &api_key) {
        Ok(_) => {
            println!("Successfully set API key");
            Ok(())
        }
        Err(e) => {
            println!("Error setting API key: {}", e);
            Err(format!("Failed to set API key: {}", e))
        }
    }
}

#[tauri::command]
pub async fn set_update_interval(app_handle: AppHandle, interval: i64) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| {
        println!("Failed to open database: {}", e);
        e.to_string()
    })?;

    match set_update_interval_db(&conn, interval) {
        Ok(_) => {
            println!("Successfully set update interval to {}", interval);
            Ok(())
        }
        Err(e) => {
            println!("Error setting update interval: {}", e);
            Err(format!("Failed to set update interval: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_show_quick_start(app_handle: AppHandle) -> Result<bool, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| {
        println!("Failed to open database: {}", e);
        e.to_string()
    })?;

    match get_show_quick_start_db(&conn) {
        Ok(show) => {
            println!("Successfully retrieved quick start setting: {}", show);
            Ok(show)
        }
        Err(e) => {
            println!("Error retrieving quick start setting: {}", e);
            Err(format!("Failed to retrieve quick start setting: {}", e))
        }
    }
}

#[tauri::command]
pub async fn set_show_quick_start(app_handle: AppHandle, show: bool) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| {
        println!("Failed to open database: {}", e);
        e.to_string()
    })?;

    match set_show_quick_start_db(&conn, show) {
        Ok(_) => {
            println!("Successfully set quick start setting to {}", show);
            Ok(())
        }
        Err(e) => {
            println!("Error setting quick start setting: {}", e);
            Err(format!("Failed to set quick start setting: {}", e))
        }
    }
}

#[tauri::command]
pub async fn get_minimize_to_tray(app_handle: AppHandle) -> Result<bool, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    get_minimize_to_tray_db(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_minimize_to_tray(app_handle: AppHandle, enabled: bool) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    set_minimize_to_tray_db(&conn, enabled).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_close_to_tray(app_handle: AppHandle) -> Result<bool, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    get_close_to_tray_db(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_close_to_tray(app_handle: AppHandle, enabled: bool) -> Result<(), String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    set_close_to_tray_db(&conn, enabled).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn handle_close_requested(app_handle: AppHandle) -> Result<bool, String> {
    let db_path = get_database_path(&app_handle);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    get_close_to_tray_db(&conn).map_err(|e| e.to_string())
}
