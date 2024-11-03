use rusqlite::{Connection, Result, params};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Webhook {
    pub id: Option<i64>,
    pub name: String,
    pub url: String,
    pub avatar_url: Option<String>,
    pub username: Option<String>,
    pub enabled: bool,
    pub use_custom_template: bool,
}

pub fn insert_webhook(conn: &mut Connection, webhook: &Webhook) -> Result<i64> {
    conn.execute(
        "INSERT INTO webhooks (name, url, avatar_url, username, enabled, use_custom_template)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            webhook.name,
            webhook.url,
            webhook.avatar_url,
            webhook.username,
            webhook.enabled,
            webhook.use_custom_template,
        ],
    )?;

    Ok(conn.last_insert_rowid())
}

pub fn get_all_webhooks(conn: &Connection) -> Result<Vec<Webhook>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, url, avatar_url, username, enabled, use_custom_template 
         FROM webhooks
         ORDER BY name"
    )?;

    let webhooks_iter = stmt.query_map([], |row| {
        Ok(Webhook {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            url: row.get(2)?,
            avatar_url: row.get(3)?,
            username: row.get(4)?,
            enabled: row.get(5)?,
            use_custom_template: row.get(6)?,
        })
    })?;

    let mut webhooks = Vec::new();
    for webhook_result in webhooks_iter {
        webhooks.push(webhook_result?);
    }

    Ok(webhooks)
}

pub fn update_webhook(conn: &mut Connection, webhook: &Webhook) -> Result<()> {
    conn.execute(
        "UPDATE webhooks 
         SET name = ?1, url = ?2, avatar_url = ?3, username = ?4, enabled = ?5, use_custom_template = ?6
         WHERE id = ?7",
        params![
            webhook.name,
            webhook.url,
            webhook.avatar_url,
            webhook.username,
            webhook.enabled,
            webhook.use_custom_template,
            webhook.id,
        ],
    )?;

    Ok(())
}

pub fn delete_webhook(conn: &mut Connection, webhook_id: i64) -> Result<()> {
    let tx = conn.transaction()?;

    // Delete webhook assignments
    tx.execute(
        "DELETE FROM mod_webhook_assignments WHERE webhook_id = ?1",
        params![webhook_id],
    )?;

    // Delete custom template if exists
    tx.execute(
        "DELETE FROM webhook_templates WHERE webhook_id = ?1",
        params![webhook_id],
    )?;

    // Delete the webhook
    tx.execute(
        "DELETE FROM webhooks WHERE id = ?1",
        params![webhook_id],
    )?;

    tx.commit()?;

    Ok(())
}

pub fn get_mod_webhooks(conn: &Connection, mod_id: i64) -> Result<Vec<Webhook>> {
    let mut stmt = conn.prepare(
        "SELECT w.id, w.name, w.url, w.avatar_url, w.username, w.enabled, w.use_custom_template
         FROM webhooks w
         JOIN mod_webhook_assignments mwa ON w.id = mwa.webhook_id
         WHERE mwa.mod_id = ?1
         ORDER BY w.name"
    )?;

    let webhooks_iter = stmt.query_map(params![mod_id], |row| {
        Ok(Webhook {
            id: Some(row.get(0)?),
            name: row.get(1)?,
            url: row.get(2)?,
            avatar_url: row.get(3)?,
            username: row.get(4)?,
            enabled: row.get(5)?,
            use_custom_template: row.get(6)?,
        })
    })?;

    let mut webhooks = Vec::new();
    for webhook_result in webhooks_iter {
        webhooks.push(webhook_result?);
    }

    Ok(webhooks)
}