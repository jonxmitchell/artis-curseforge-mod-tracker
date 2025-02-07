pub mod activities;
pub mod init;
pub mod mods;
pub mod settings;
pub mod webhook_templates;
pub mod webhooks;

pub use activities::{add_activity, clear_activities, get_recent_activities, Activity};
pub use init::{ensure_database_exists, get_database_path, initialize_database};
pub use settings::{
    get_api_key, get_close_to_tray, get_minimize_to_tray, get_show_quick_start,
    get_update_interval, set_api_key, set_close_to_tray, set_minimize_to_tray,
    set_show_quick_start, set_update_interval,
};
pub use webhooks::Webhook;
