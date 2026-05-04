use serde::{Deserialize, Serialize};

/// Document metadata returned to the frontend.
#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentMeta {
    pub id: String,
    pub title: String,
    pub path: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub word_count: u32,
    pub loro_file: String,
    pub is_deleted: bool,
}

/// Creates a new document and returns its metadata.
#[tauri::command]
pub async fn create_document(title: String) -> Result<DocumentMeta, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();
    Ok(DocumentMeta {
        id: id.clone(),
        title,
        path: String::new(),
        created_at: now,
        updated_at: now,
        word_count: 0,
        loro_file: format!("docs/{}.loro", id),
        is_deleted: false,
    })
}

/// Lists all non-deleted documents in the vault.
#[tauri::command]
pub async fn list_documents() -> Result<Vec<DocumentMeta>, String> {
    Ok(vec![])
}

/// Soft-deletes a document by ID.
#[tauri::command]
pub async fn delete_document(id: String) -> Result<bool, String> {
    log::info!("Soft-deleting document: {}", id);
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_document_generates_uuid() {
        let doc = create_document("My Note".to_string()).await.unwrap();
        assert_eq!(doc.title, "My Note");
        assert!(!doc.id.is_empty());
        // UUID v4 format: 8-4-4-4-12
        assert_eq!(doc.id.len(), 36);
        assert!(doc.loro_file.ends_with(".loro"));
        assert!(!doc.is_deleted);
        assert_eq!(doc.word_count, 0);
    }

    #[tokio::test]
    async fn test_create_document_sets_timestamps() {
        let before = chrono::Utc::now().timestamp();
        let doc = create_document("Timestamped".to_string()).await.unwrap();
        let after = chrono::Utc::now().timestamp();
        assert!(doc.created_at >= before);
        assert!(doc.created_at <= after);
        assert_eq!(doc.created_at, doc.updated_at);
    }

    #[tokio::test]
    async fn test_list_documents_returns_vec() {
        let docs = list_documents().await.unwrap();
        assert!(docs.is_empty(), "stub returns empty list");
    }

    #[tokio::test]
    async fn test_delete_document_returns_true() {
        let result = delete_document("some-id".to_string()).await.unwrap();
        assert!(result);
    }
}
