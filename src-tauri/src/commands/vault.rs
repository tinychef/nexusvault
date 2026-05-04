use serde::Serialize;

/// Basic vault information returned to the frontend.
#[derive(Debug, Serialize)]
pub struct VaultInfo {
    pub name: String,
    pub path: String,
    pub document_count: u32,
}

/// Returns metadata about the current vault.
#[tauri::command]
pub async fn get_vault_info() -> Result<VaultInfo, String> {
    Ok(VaultInfo {
        name: "Default Vault".to_string(),
        path: String::new(),
        document_count: 0,
    })
}

/// Opens a vault from the given directory path.
#[tauri::command]
pub async fn open_vault(path: String) -> Result<VaultInfo, String> {
    Ok(VaultInfo {
        name: "Vault".to_string(),
        path,
        document_count: 0,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_vault_info_returns_default() {
        let info = get_vault_info().await.unwrap();
        assert_eq!(info.name, "Default Vault");
        assert_eq!(info.document_count, 0);
    }

    #[tokio::test]
    async fn test_open_vault_returns_provided_path() {
        let path = "/Users/test/vault".to_string();
        let info = open_vault(path.clone()).await.unwrap();
        assert_eq!(info.path, path);
        assert_eq!(info.name, "Vault");
    }
}
