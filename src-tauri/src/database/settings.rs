use rusqlite::{Connection, Result, params, OptionalExtension};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub api_key: Option<String>,
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

    // Insert default API key if it doesn't exist
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('api_key', NULL)",
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

pub fn set_api_key(conn: &Connection, api_key: &str) -> Result<()> {
    conn.execute(
        "UPDATE settings SET value = ?1 WHERE key = 'api_key'",
        params![api_key],
    )?;
    
    Ok(())
}