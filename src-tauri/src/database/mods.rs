use rusqlite::{Connection, Result, params};
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct Mod {
    pub id: Option<i64>,
    pub curseforge_id: i64,
    pub name: String,
    pub last_version: String,
    pub last_checked: DateTime<Utc>,
    pub game_version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModWithWebhooks {
    #[serde(flatten)]
    pub mod_info: Mod,
    pub webhook_ids: Vec<i64>,
}

pub fn insert_mod(conn: &Connection, mod_data: &Mod) -> Result<i64> {
    conn.execute(
        "INSERT INTO mods (curseforge_id, name, last_version, last_checked, game_version)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            mod_data.curseforge_id,
            mod_data.name,
            mod_data.last_version,
            mod_data.last_checked.to_rfc3339(),
            mod_data.game_version,
        ],
    )?;

    Ok(conn.last_insert_rowid())
}

pub fn get_all_mods(conn: &Connection) -> Result<Vec<ModWithWebhooks>> {
    let mut stmt = conn.prepare(
        "SELECT m.id, m.curseforge_id, m.name, m.last_version, m.last_checked, m.game_version,
         GROUP_CONCAT(mwa.webhook_id) as webhook_ids
         FROM mods m
         LEFT JOIN mod_webhook_assignments mwa ON m.id = mwa.mod_id
         GROUP BY m.id"
    )?;

    let mods_iter = stmt.query_map([], |row| {
        let webhook_ids_str: Option<String> = row.get(6)?;
        let webhook_ids = webhook_ids_str
            .map(|ids| {
                ids.split(',')
                    .filter_map(|id| id.parse::<i64>().ok())
                    .collect()
            })
            .unwrap_or(Vec::new());

        Ok(ModWithWebhooks {
            mod_info: Mod {
                id: Some(row.get(0)?),
                curseforge_id: row.get(1)?,
                name: row.get(2)?,
                last_version: row.get(3)?,
                last_checked: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                    .unwrap()
                    .with_timezone(&Utc),
                game_version: row.get(5)?,
            },
            webhook_ids,
        })
    })?;

    let mut mods = Vec::new();
    for mod_result in mods_iter {
        mods.push(mod_result?);
    }

    Ok(mods)
}

pub fn update_mod_version(conn: &Connection, mod_id: i64, new_version: &str) -> Result<()> {
    conn.execute(
        "UPDATE mods SET last_version = ?1, last_checked = ?2 WHERE id = ?3",
        params![new_version, Utc::now().to_rfc3339(), mod_id],
    )?;

    Ok(())
}

pub fn delete_mod(conn: &Connection, mod_id: i64) -> Result<()> {
    conn.execute("DELETE FROM mods WHERE id = ?1", params![mod_id])?;
    Ok(())
}

pub fn assign_webhook_to_mod(conn: &Connection, mod_id: i64, webhook_id: i64) -> Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO mod_webhook_assignments (mod_id, webhook_id) VALUES (?1, ?2)",
        params![mod_id, webhook_id],
    )?;
    Ok(())
}

pub fn remove_webhook_from_mod(conn: &Connection, mod_id: i64, webhook_id: i64) -> Result<()> {
    conn.execute(
        "DELETE FROM mod_webhook_assignments WHERE mod_id = ?1 AND webhook_id = ?2",
        params![mod_id, webhook_id],
    )?;
    Ok(())
}