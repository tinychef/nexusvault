mod commands;

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
        .run(tauri::generate_context!())
        .expect("error while running NexusVault");
}
