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

#[derive(Debug, Serialize, Deserialize)]
pub struct WebhookTemplate {
    pub id: Option<i64>,
    pub is_default: bool,
    pub webhook_id: Option<i64>,
    pub title: String,
    pub color: i32,
    pub content: Option<String>,
    pub use_embed: bool,
    pub embed_fields: String,
}

pub fn insert_webhook(conn: &Connection, webhook: &Webhook) -> Result<i64> {
    conn.execute(
        "INSERT INTO webhooks (name, url, avatar_url, username, enabled)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            webhook.name,
            webhook.url,
            webhook.avatar_url,
            webhook.username,
            webhook.enabled,
        ],
    )?;

    Ok(conn.last_insert_rowid())
}

pub fn get_all_webhooks(conn: &Connection) -> Result<Vec<Webhook>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, url, avatar_url, username, enabled, use_custom_template FROM webhooks"
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

pub fn update_webhook(conn: &Connection, webhook: &Webhook) -> Result<()> {
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

pub fn delete_webhook(conn: &Connection, webhook_id: i64) -> Result<()> {
    conn.execute("DELETE FROM webhooks WHERE id = ?1", params![webhook_id])?;
    Ok(())
}

pub fn get_mod_webhooks(conn: &Connection, mod_id: i64) -> Result<Vec<Webhook>> {
    let mut stmt = conn.prepare(
        "SELECT w.id, w.name, w.url, w.avatar_url, w.username, w.enabled, w.use_custom_template
         FROM webhooks w
         JOIN mod_webhook_assignments mwa ON w.id = mwa.webhook_id
         WHERE mwa.mod_id = ?1"
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

pub fn get_webhook_template(conn: &Connection, webhook_id: i64) -> Result<WebhookTemplate> {
    // First try to get custom template
    let custom_template = conn.query_row(
        "SELECT id, is_default, webhook_id, title, color, content, use_embed, embed_fields 
         FROM webhook_templates 
         WHERE webhook_id = ?1",
        params![webhook_id],
        |row| {
            Ok(WebhookTemplate {
                id: Some(row.get(0)?),
                is_default: row.get(1)?,
                webhook_id: Some(row.get(2)?),
                title: row.get(3)?,
                color: row.get(4)?,
                content: row.get(5)?,
                use_embed: row.get(6)?,
                embed_fields: row.get(7)?,
            })
        },
    );

    match custom_template {
        Ok(template) => Ok(template),
        Err(_) => {
            // If no custom template, get default template
            conn.query_row(
                "SELECT id, is_default, webhook_id, title, color, content, use_embed, embed_fields 
                 FROM webhook_templates 
                 WHERE is_default = 1",
                [],
                |row| {
                    Ok(WebhookTemplate {
                        id: Some(row.get(0)?),
                        is_default: row.get(1)?,
                        webhook_id: None,
                        title: row.get(3)?,
                        color: row.get(4)?,
                        content: row.get(5)?,
                        use_embed: row.get(6)?,
                        embed_fields: row.get(7)?,
                    })
                },
            )
        }
    }
}

pub fn update_webhook_template(conn: &Connection, template: &WebhookTemplate) -> Result<()> {
    if template.is_default {
        conn.execute(
            "UPDATE webhook_templates 
             SET title = ?1, color = ?2, content = ?3, use_embed = ?4, embed_fields = ?5
             WHERE is_default = 1",
            params![
                template.title,
                template.color,
                template.content,
                template.use_embed,
                template.embed_fields,
            ],
        )?;
    } else {
        conn.execute(
            "INSERT INTO webhook_templates (webhook_id, title, color, content, use_embed, embed_fields)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(webhook_id) DO UPDATE SET
             title = ?2, color = ?3, content = ?4, use_embed = ?5, embed_fields = ?6",
            params![
                template.webhook_id,
                template.title,
                template.color,
                template.content,
                template.use_embed,
                template.embed_fields,
            ],
        )?;

        // Update webhook to use custom template
        if let Some(webhook_id) = template.webhook_id {
            conn.execute(
                "UPDATE webhooks SET use_custom_template = 1 WHERE id = ?1",
                params![webhook_id],
            )?;
        }
    }

    Ok(())
}

pub fn delete_custom_template(conn: &Connection, webhook_id: i64) -> Result<()> {
    conn.execute(
        "DELETE FROM webhook_templates WHERE webhook_id = ?1",
        params![webhook_id],
    )?;

    conn.execute(
        "UPDATE webhooks SET use_custom_template = 0 WHERE id = ?1",
        params![webhook_id],
    )?;

    Ok(())
}