use rusqlite::{Connection, Result};
use std::path::Path;
use tauri::AppHandle;
use std::path::PathBuf;
use crate::database::settings::initialize_settings_table;
use crate::database::activities::initialize_activities_table;

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
    // Create mods table if it doesn't exist
    connection.execute(
        "CREATE TABLE IF NOT EXISTS mods (
            id INTEGER PRIMARY KEY,
            curseforge_id INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            game_name TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )",
        [],
    )?;

    // Create webhooks table if it doesn't exist
    connection.execute(
        "CREATE TABLE IF NOT EXISTS webhooks (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            avatar_url TEXT,
            username TEXT,
            enabled BOOLEAN NOT NULL DEFAULT 1,
            use_custom_template BOOLEAN NOT NULL DEFAULT 0
        )",
        [],
    )?;

    // Create mod_webhook_assignments table if it doesn't exist
    connection.execute(
        "CREATE TABLE IF NOT EXISTS mod_webhook_assignments (
            mod_id INTEGER NOT NULL,
            webhook_id INTEGER NOT NULL,
            PRIMARY KEY (mod_id, webhook_id),
            FOREIGN KEY (mod_id) REFERENCES mods (id) ON DELETE CASCADE,
            FOREIGN KEY (webhook_id) REFERENCES webhooks (id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Create webhook_templates table if it doesn't exist
    connection.execute(
        "CREATE TABLE IF NOT EXISTS webhook_templates (
            id INTEGER PRIMARY KEY,
            is_default BOOLEAN NOT NULL DEFAULT 0,
            webhook_id INTEGER UNIQUE,
            title TEXT NOT NULL DEFAULT '🔄 Mod Update Available!',
            color INTEGER NOT NULL DEFAULT 5814783,
            content TEXT,
            use_embed BOOLEAN NOT NULL DEFAULT 1,
            author_name TEXT,
            author_icon_url TEXT,
            footer_text TEXT,
            footer_icon_url TEXT,
            include_timestamp BOOLEAN NOT NULL DEFAULT 1,
            embed_fields TEXT NOT NULL DEFAULT '[
                {\"name\":\"Mod Name\",\"value\":\"{modName}\",\"inline\":true},
                {\"name\":\"Author\",\"value\":\"{modAuthorName}\",\"inline\":true},
                {\"name\":\"Last Updated\",\"value\":\"{newReleaseDate}\",\"inline\":false},
                {\"name\":\"Latest File\",\"value\":\"{lastestModFileName}\",\"inline\":false}
            ]',
            FOREIGN KEY (webhook_id) REFERENCES webhooks (id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Check if default template exists
    let default_exists: bool = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM webhook_templates WHERE is_default = 1)",
            [],
            |row| row.get(0),
        )?;

    // Only insert default template if it doesn't exist
    if !default_exists {
        connection.execute(
            "INSERT INTO webhook_templates (
                is_default, title, color, use_embed, 
                author_name, author_icon_url,
                footer_text, footer_icon_url, include_timestamp,
                embed_fields
            ) VALUES (
                1, '🔄 Mod Update Available!', 5814783, 1,
                'Mod Tracker', NULL,
                'Powered by Artis Mod Tracker', NULL, 1,
                '[
                    {\"name\":\"Mod Name\",\"value\":\"{modName}\",\"inline\":true},
                    {\"name\":\"Author\",\"value\":\"{modAuthorName}\",\"inline\":true},
                    {\"name\":\"Last Updated\",\"value\":\"{newReleaseDate}\",\"inline\":false},
                    {\"name\":\"Latest File\",\"value\":\"{lastestModFileName}\",\"inline\":false}
                ]'
            )",
            [],
        )?;
    }

    // Initialize settings table
    initialize_settings_table(connection)?;

    // Initialize activities table
    initialize_activities_table(connection)?;

    Ok(())
}