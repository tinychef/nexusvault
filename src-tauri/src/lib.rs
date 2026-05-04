mod commands;

use commands::{document, secrets, vault};
use tauri_plugin_sql::{Migration, MigrationKind};

/// Initializes and runs the NexusVault Tauri application.
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_documents_links_tags",
            sql: include_str!("../migrations/001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_fts_index",
            sql: include_str!("../migrations/002_fts.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_embeddings_table",
            sql: include_str!("../migrations/003_embeddings.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:nexusvault.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            vault::get_vault_info,
            vault::open_vault,
            document::create_document,
            document::list_documents,
            document::delete_document,
            secrets::save_api_key,
            secrets::get_api_key,
            secrets::delete_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NexusVault");
}
