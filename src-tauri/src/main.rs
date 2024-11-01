#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod commands;

use database::{get_database_path, ensure_database_exists, initialize_database};
use commands::mod_commands::*;
use commands::webhook_commands::*;
use rusqlite::Connection;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = get_database_path(&app.handle());
            ensure_database_exists(&db_path)?;
            let conn = Connection::open(&db_path)?;
            initialize_database(&conn)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Mod commands
            add_mod,
            get_mods,
            delete_mod,
            assign_webhook,
            remove_webhook_assignment,
            check_mod_update,
            get_mod_assigned_webhooks,
            // Webhook commands
            add_webhook,
            get_webhooks,
            update_webhook,
            delete_webhook,
            test_webhook,
            send_update_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}