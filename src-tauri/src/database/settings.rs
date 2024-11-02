use rusqlite::{Connection, Result, params, OptionalExtension};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub api_key: Option<String>,
    pub update_interval: i64, // Interval in minutes
}

pub fn initialize_settings_table(conn: &Connection) -> Result<()> {
    // Create settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )",
        [],
    )?;

    // Insert default settings if they don't exist
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('api_key', NULL)",
        [],
    )?;
    
    // Add default update interval (30 minutes)
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('update_interval', '30')",
        [],
    )?;

    Ok(())
}

pub fn get_api_key(conn: &Connection) -> Result<Option<String>> {
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = 'api_key'")?;
    let api_key = stmt.query_row([], |row| row.get(0))
        .optional()?;
    
    Ok(api_key)
}

pub fn get_update_interval(conn: &Connection) -> Result<i64> {
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = 'update_interval'")?;
    let interval = stmt.query_row([], |row| {
        let value: String = row.get(0)?;
        Ok(value.parse::<i64>().unwrap_or(30))
    }).unwrap_or(30);
    
    Ok(interval)
}

pub fn set_api_key(conn: &Connection, api_key: &str) -> Result<()> {
    conn.execute(
        "UPDATE settings SET value = ?1 WHERE key = 'api_key'",
        params![api_key],
    )?;
    
    Ok(())
}

pub fn set_update_interval(conn: &Connection, interval: i64) -> Result<()> {
    conn.execute(
        "UPDATE settings SET value = ?1 WHERE key = 'update_interval'",
        params![interval.to_string()],
    )?;
    
    Ok(())
}