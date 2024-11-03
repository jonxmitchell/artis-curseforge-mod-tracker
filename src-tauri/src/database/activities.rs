use rusqlite::{Connection, Result, params};
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct Activity {
    pub id: Option<i64>,
    pub activity_type: String,  // "mod_added", "mod_updated", "mod_removed", etc.
    pub mod_id: Option<i64>,    // Optional as some activities might not be mod-specific
    pub mod_name: Option<String>,
    pub description: String,
    pub timestamp: DateTime<Utc>,
    pub metadata: Option<String>, // JSON string for additional activity-specific data
}

const MAX_ACTIVITIES: i64 = 50;

pub fn initialize_activities_table(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY,
            activity_type TEXT NOT NULL,
            mod_id INTEGER,
            mod_name TEXT,
            description TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            metadata TEXT,
            FOREIGN KEY (mod_id) REFERENCES mods (id) ON DELETE SET NULL
        )",
        [],
    )?;

    Ok(())
}

pub fn add_activity(conn: &Connection, activity: &Activity) -> Result<i64> {
    // First, check if we need to remove old activities
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM activities",
        [],
        |row| row.get(0),
    )?;

    if count >= MAX_ACTIVITIES {
        // Delete oldest activities to make room
        let to_delete = count - MAX_ACTIVITIES + 1;
        conn.execute(
            "DELETE FROM activities WHERE id IN (
                SELECT id FROM activities ORDER BY timestamp ASC LIMIT ?1
            )",
            params![to_delete],
        )?;
    }

    // Insert new activity
    conn.execute(
        "INSERT INTO activities (
            activity_type, mod_id, mod_name, description, timestamp, metadata
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            activity.activity_type,
            activity.mod_id,
            activity.mod_name,
            activity.description,
            activity.timestamp.to_rfc3339(),
            activity.metadata,
        ],
    )?;

    Ok(conn.last_insert_rowid())
}

pub fn get_recent_activities(conn: &Connection, limit: Option<i64>) -> Result<Vec<Activity>> {
    let limit = limit.unwrap_or(MAX_ACTIVITIES);
    let mut stmt = conn.prepare(
        "SELECT id, activity_type, mod_id, mod_name, description, timestamp, metadata
         FROM activities
         ORDER BY timestamp DESC
         LIMIT ?1"
    )?;

    let activities = stmt.query_map(params![limit], |row| {
        Ok(Activity {
            id: Some(row.get(0)?),
            activity_type: row.get(1)?,
            mod_id: row.get(2)?,
            mod_name: row.get(3)?,
            description: row.get(4)?,
            timestamp: DateTime::parse_from_rfc3339(&row.get::<_, String>(5)?)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                    5,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                ))?
                .into(),
            metadata: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for activity in activities {
        result.push(activity?);
    }

    Ok(result)
}

pub fn clear_activities(conn: &Connection) -> Result<()> {
    conn.execute("DELETE FROM activities", [])?;
    Ok(())
}