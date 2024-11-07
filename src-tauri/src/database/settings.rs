use rusqlite::{Connection, Result, params};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub api_key: Option<String>,
    pub update_interval: i64,
    pub show_quick_start: bool,
}

pub fn initialize_settings_table(conn: &mut Connection) -> Result<()> {
    println!("Initializing settings table...");
    
    // Create settings table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )",
        [],
    )?;
    
    // Insert default settings using a transaction
    let tx = conn.transaction()?;
    
    // Insert default values if they don't exist
    tx.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('api_key', NULL)",
        [],
    )?;

    tx.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('update_interval', '30')",
        [],
    )?;

    tx.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('show_quick_start', 'true')",
        [],
    )?;

    tx.commit()?;
    println!("Settings table initialized successfully");
    Ok(())
}

pub fn get_api_key(conn: &Connection) -> Result<Option<String>> {
    println!("Fetching API key from database...");
    match conn.query_row(
        "SELECT value FROM settings WHERE key = 'api_key'",
        [],
        |row| row.get::<_, Option<String>>(0)
    ) {
        Ok(value) => {
            println!("API key fetched successfully: {:?}", value.is_some());
            Ok(value)
        }
        Err(e) => {
            println!("Error fetching API key: {:?}", e);
            Err(e)
        }
    }
}

pub fn get_update_interval(conn: &Connection) -> Result<i64> {
    println!("Fetching update interval from database...");
    let value: Option<String> = conn.query_row(
        "SELECT value FROM settings WHERE key = 'update_interval'",
        [],
        |row| row.get::<_, Option<String>>(0)
    )?;
    
    let interval = value
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(30);
    
    println!("Update interval fetched: {}", interval);
    Ok(interval)
}

pub fn set_api_key(conn: &Connection, api_key: &str) -> Result<()> {
    println!("Setting API key in database...");
    conn.execute(
        "UPDATE settings SET value = ?1 WHERE key = 'api_key'",
        params![api_key],
    )?;
    println!("API key set successfully");
    Ok(())
}

pub fn set_update_interval(conn: &Connection, interval: i64) -> Result<()> {
    println!("Setting update interval in database: {}", interval);
    conn.execute(
        "UPDATE settings SET value = ?1 WHERE key = 'update_interval'",
        params![interval.to_string()],
    )?;
    println!("Update interval set successfully");
    Ok(())
}

pub fn get_show_quick_start(conn: &Connection) -> Result<bool> {
    println!("Fetching quick start setting from database...");
    let value: Option<String> = conn.query_row(
        "SELECT value FROM settings WHERE key = 'show_quick_start'",
        [],
        |row| row.get::<_, Option<String>>(0)
    )?;
    
    let show = value
        .and_then(|v| v.parse::<bool>().ok())
        .unwrap_or(true);
    
    println!("Quick start setting fetched: {}", show);
    Ok(show)
}

pub fn set_show_quick_start(conn: &Connection, show: bool) -> Result<()> {
    println!("Setting quick start setting in database: {}", show);
    conn.execute(
        "UPDATE settings SET value = ?1 WHERE key = 'show_quick_start'",
        params![show.to_string()],
    )?;
    println!("Quick start setting set successfully");
    Ok(())
}