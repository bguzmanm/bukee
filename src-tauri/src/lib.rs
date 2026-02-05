// rust
use std::fs;
use std::path::PathBuf;
use std::env;
use base64::{engine::general_purpose, Engine as _};
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
async fn save_epub_file(
    _app: tauri::AppHandle,
    file_name: String,
    file_data_base64: String,
) -> Result<String, String> {
    let bytes = general_purpose::STANDARD
        .decode(&file_data_base64)
        .map_err(|e| format!("base64 decode error: {}", e))?;

    let exe = env::current_exe().map_err(|e| format!("current_exe error: {}", e))?;
    let mut base = exe.parent()
        .and_then(|p| p.parent())
        .map(PathBuf::from)
        .ok_or_else(|| "Failed to determine base path".to_string())?;

    base.push("public");
    base.push("books");

    fs::create_dir_all(&base).map_err(|e| format!("Failed to create books directory: {}", e))?;

    let file_path = base.join(&file_name);
    fs::write(&file_path, &bytes).map_err(|e| format!("Failed to save file: {}", e))?;

    Ok(format!("/public/books/{}", file_name))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, author TEXT, cover TEXT, tags TEXT, rating INTEGER, path TEXT);",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:bukee.db", migrations)
                .build(),
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_epub_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}