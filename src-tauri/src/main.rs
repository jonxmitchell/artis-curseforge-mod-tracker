#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod commands;

use database::{get_database_path, ensure_database_exists, initialize_database};
use commands::mod_commands::*;
use commands::webhook_commands::*;
use commands::webhook_template_commands::*;
use commands::settings_commands::*;
use commands::activity_commands::*;
use rusqlite::Connection;

use tauri_plugin_context_menu::init as init_context_menu;


fn main() {
    tauri::Builder::default()
    .plugin(init_context_menu())
    .setup(|app| {
        let db_path = get_database_path(&app.handle());
        ensure_database_exists(&db_path)?;
        let mut conn = Connection::open(&db_path)?;
        initialize_database(&mut conn)?;
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
            // Webhook template commands
            get_webhook_template,
            update_webhook_template,
            delete_custom_template,
            // Settings commands
            get_api_key,
            set_api_key,
            get_update_interval,
            set_update_interval,
            get_show_quick_start,
            set_show_quick_start,
            // Activity commands
            add_activity_entry,
            get_activities,
            clear_activity_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}