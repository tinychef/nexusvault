const KEYRING_SERVICE: &str = "nexusvault";

/// Stores an AI provider API key in the OS native keychain.
/// Uses Windows Credential Manager / macOS Keychain / libsecret on Linux.
#[tauri::command]
pub fn save_api_key(provider: String, key: String) -> Result<(), String> {
    keyring::Entry::new(KEYRING_SERVICE, &provider)
        .and_then(|e| e.set_password(&key))
        .map_err(|e| e.to_string())
}

/// Retrieves an AI provider API key from the OS native keychain.
/// Returns None if no key has been stored yet.
#[tauri::command]
pub fn get_api_key(provider: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Removes an AI provider API key from the OS native keychain.
#[tauri::command]
pub fn delete_api_key(provider: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &provider).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_save_and_get_api_key() {
        let provider = "test-provider".to_string();
        let key = "sk-test-12345".to_string();
        save_api_key(provider.clone(), key.clone()).unwrap();
        let retrieved = get_api_key(provider.clone()).unwrap();
        assert_eq!(retrieved, Some(key));
        delete_api_key(provider).unwrap();
    }

    #[test]
    fn test_get_missing_key_returns_none() {
        let result = get_api_key("nonexistent-provider-xyz".to_string()).unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_delete_nonexistent_key_is_ok() {
        let result = delete_api_key("nonexistent-xyz".to_string());
        assert!(result.is_ok());
    }
}
