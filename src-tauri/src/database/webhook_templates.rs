use rusqlite::{Connection, Result, params};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WebhookTemplate {
    pub id: Option<i64>,
    pub is_default: bool,
    pub webhook_id: Option<i64>,
    pub title: String,
    pub color: i32,
    pub content: Option<String>,
    pub use_embed: bool,
    pub author_name: Option<String>,
    pub author_icon_url: Option<String>,
    pub footer_text: Option<String>,
    pub footer_icon_url: Option<String>,
    pub include_timestamp: bool,
    pub embed_fields: String,
}

pub fn get_webhook_template(conn: &Connection, webhook_id: i64) -> Result<WebhookTemplate> {
    let query = "SELECT id, is_default, webhook_id, title, color, content, use_embed,
                       author_name, author_icon_url, footer_text, footer_icon_url,
                       include_timestamp, embed_fields
                FROM webhook_templates
                WHERE ";

    let query = if webhook_id == -1 {
        format!("{} is_default = 1", query)
    } else {
        format!("{} webhook_id = ?1", query)
    };

    let params: Vec<&dyn rusqlite::ToSql> = if webhook_id == -1 {
        vec![]
    } else {
        vec![&webhook_id]
    };

    let template = conn.query_row(
        &query,
        params.as_slice(),
        |row| {
            Ok(WebhookTemplate {
                id: Some(row.get(0)?),
                is_default: row.get(1)?,
                webhook_id: row.get(2)?,
                title: row.get(3)?,
                color: row.get(4)?,
                content: row.get(5)?,
                use_embed: row.get(6)?,
                author_name: row.get(7)?,
                author_icon_url: row.get(8)?,
                footer_text: row.get(9)?,
                footer_icon_url: row.get(10)?,
                include_timestamp: row.get(11)?,
                embed_fields: row.get(12)?,
            })
        },
    ).or_else(|_| {
        // If no template found, return the default one
        conn.query_row(
            "SELECT id, is_default, webhook_id, title, color, content, use_embed,
                    author_name, author_icon_url, footer_text, footer_icon_url,
                    include_timestamp, embed_fields
             FROM webhook_templates
             WHERE is_default = 1",
            [],
            |row| {
                Ok(WebhookTemplate {
                    id: Some(row.get(0)?),
                    is_default: row.get(1)?,
                    webhook_id: row.get(2)?,
                    title: row.get(3)?,
                    color: row.get(4)?,
                    content: row.get(5)?,
                    use_embed: row.get(6)?,
                    author_name: row.get(7)?,
                    author_icon_url: row.get(8)?,
                    footer_text: row.get(9)?,
                    footer_icon_url: row.get(10)?,
                    include_timestamp: row.get(11)?,
                    embed_fields: row.get(12)?,
                })
            },
        )
    })?;

    Ok(template)
}

pub fn update_webhook_template(conn: &mut Connection, template: &WebhookTemplate) -> Result<()> {
    if template.is_default {
        conn.execute(
            "UPDATE webhook_templates 
             SET title = ?1, color = ?2, content = ?3, use_embed = ?4,
                 author_name = ?5, author_icon_url = ?6,
                 footer_text = ?7, footer_icon_url = ?8,
                 include_timestamp = ?9, embed_fields = ?10
             WHERE is_default = 1",
            params![
                template.title,
                template.color,
                template.content,
                template.use_embed,
                template.author_name,
                template.author_icon_url,
                template.footer_text,
                template.footer_icon_url,
                template.include_timestamp,
                template.embed_fields,
            ],
        )?;
    } else {
        conn.execute(
            "INSERT INTO webhook_templates (
                webhook_id, title, color, content, use_embed,
                author_name, author_icon_url,
                footer_text, footer_icon_url,
                include_timestamp, embed_fields
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
             ON CONFLICT(webhook_id) DO UPDATE SET
             title = ?2, color = ?3, content = ?4, use_embed = ?5,
             author_name = ?6, author_icon_url = ?7,
             footer_text = ?8, footer_icon_url = ?9,
             include_timestamp = ?10, embed_fields = ?11",
            params![
                template.webhook_id,
                template.title,
                template.color,
                template.content,
                template.use_embed,
                template.author_name,
                template.author_icon_url,
                template.footer_text,
                template.footer_icon_url,
                template.include_timestamp,
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

pub fn delete_custom_template(conn: &mut Connection, webhook_id: i64) -> Result<()> {
    let tx = conn.transaction()?;

    // Delete the custom template
    tx.execute(
        "DELETE FROM webhook_templates WHERE webhook_id = ?1",
        params![webhook_id],
    )?;

    // Update webhook to not use custom template
    tx.execute(
        "UPDATE webhooks SET use_custom_template = 0 WHERE id = ?1",
        params![webhook_id],
    )?;

    tx.commit()?;

    Ok(())
}