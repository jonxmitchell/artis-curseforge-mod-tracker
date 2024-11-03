pub mod init;
pub mod mods;
pub mod webhooks;
pub mod webhook_templates;
pub mod settings;
pub mod activities;

pub use init::{get_database_path, ensure_database_exists, initialize_database};
pub use mods::{Mod, ModWithWebhooks};
pub use webhooks::Webhook;
pub use activities::{Activity, add_activity, get_recent_activities, clear_activities};
pub use settings::{
    get_api_key,
    set_api_key,
    get_update_interval,
    set_update_interval,
    get_show_quick_start,
    set_show_quick_start,
};