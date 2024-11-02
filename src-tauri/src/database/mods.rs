use rusqlite::{Connection, Result, params};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Mod {
    pub id: Option<i64>,
    pub curseforge_id: i64,
    pub name: String,
    pub game_name: String,
    pub last_updated: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModWithWebhooks {
    #[serde(flatten)]
    pub mod_info: Mod,
    pub webhook_ids: Vec<i64>,
}

pub fn get_all_mods(conn: &Connection) -> Result<Vec<ModWithWebhooks>> {
    let mut stmt = conn.prepare(
        "SELECT m.id, m.curseforge_id, m.name, m.game_name, m.last_updated,
         GROUP_CONCAT(mwa.webhook_id) as webhook_ids
         FROM mods m
         LEFT JOIN mod_webhook_assignments mwa ON m.id = mwa.mod_id
         GROUP BY m.id
         ORDER BY m.game_name, m.name"
    )?;

    let mods_iter = stmt.query_map([], |row| {
        let webhook_ids_str: Option<String> = row.get(5)?;
        let webhook_ids = webhook_ids_str
            .map(|ids| {
                ids.split(',')
                    .filter_map(|id| id.parse::<i64>().ok())
                    .collect()
            })
            .unwrap_or(Vec::new());

        let mod_info = Mod {
            id: Some(row.get(0)?),
            curseforge_id: row.get(1)?,
            name: row.get(2)?,
            game_name: row.get(3)?,
            last_updated: row.get(4)?,
        };

        Ok(ModWithWebhooks {
            mod_info,
            webhook_ids,
        })
    })?;

    let mut mods = Vec::new();
    for mod_result in mods_iter {
        mods.push(mod_result?);
    }

    Ok(mods)
}

pub fn insert_mod(conn: &Connection, mod_data: &Mod) -> Result<i64> {
    conn.execute(
        "INSERT INTO mods (curseforge_id, name, game_name, last_updated)
         VALUES (?1, ?2, ?3, ?4)",
        params![
            mod_data.curseforge_id,
            mod_data.name,
            mod_data.game_name,
            mod_data.last_updated,
        ],
    )?;

    Ok(conn.last_insert_rowid())
}

pub fn update_mod_last_updated(conn: &Connection, mod_id: i64, last_updated: &str) -> Result<()> {
    conn.execute(
        "UPDATE mods SET last_updated = ?1 WHERE id = ?2",
        params![last_updated, mod_id],
    )?;

    Ok(())
}

pub fn delete_mod(conn: &Connection, mod_id: i64) -> Result<()> {
    // First delete webhook assignments
    conn.execute(
        "DELETE FROM mod_webhook_assignments WHERE mod_id = ?1",
        params![mod_id],
    )?;

    // Then delete the mod
    conn.execute(
        "DELETE FROM mods WHERE id = ?1",
        params![mod_id],
    )?;

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