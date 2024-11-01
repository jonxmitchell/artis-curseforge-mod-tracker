use rusqlite::{Connection, Result};
use std::path::Path;
use tauri::AppHandle;
use std::path::PathBuf;

pub fn get_database_path(handle: &AppHandle) -> PathBuf {
    handle.path_resolver()
        .resolve_resource("curseforge_tracker.db")
        .expect("failed to resolve resource")
}

pub fn ensure_database_exists(db_path: &Path) -> Result<()> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(1), Some(e.to_string())
        ))?;
    }
    Ok(())
}

pub fn initialize_database(connection: &Connection) -> Result<()> {
    // Create mods table
    connection.execute(
        "CREATE TABLE IF NOT EXISTS mods (
            id INTEGER PRIMARY KEY,
            curseforge_id INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            last_version TEXT NOT NULL,
            last_checked TEXT NOT NULL,
            game_version TEXT NOT NULL
        )",
        [],
    )?;

    // Create webhooks table
    connection.execute(
        "CREATE TABLE IF NOT EXISTS webhooks (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            avatar_url TEXT,
            username TEXT,
            enabled BOOLEAN NOT NULL DEFAULT 1
        )",
        [],
    )?;

    // Create mod_webhook_assignments table for many-to-many relationship
    connection.execute(
        "CREATE TABLE IF NOT EXISTS mod_webhook_assignments (
            mod_id INTEGER NOT NULL,
            webhook_id INTEGER NOT NULL,
            PRIMARY KEY (mod_id, webhook_id),
            FOREIGN KEY (mod_id) REFERENCES mods (id),
            FOREIGN KEY (webhook_id) REFERENCES webhooks (id)
        )",
        [],
    )?;

    Ok(())
}