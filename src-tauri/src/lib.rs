// rust
use std::fs;
use std::path::PathBuf;
use std::env;
use base64::{engine::general_purpose, Engine as _};
use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_fs;
use serde::Serialize;
use epub::doc::EpubDoc;

#[derive(Serialize)]
struct EpubMetadata {
    title: String,
    author: String,
    cover: String,
    path: String,
}

#[tauri::command]
async fn parse_epub_metadata(
    _app: tauri::AppHandle,
    file_path: String,
) -> Result<EpubMetadata, String> {
    // Save the file first
    let file_data = fs::read(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;
    let file_name = PathBuf::from(&file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown.epub")
        .to_string();
    
    let exe = env::current_exe().map_err(|e| format!("current_exe error: {}", e))?;
    let mut base = exe.parent()
        .and_then(|p| p.parent())
        .map(PathBuf::from)
        .ok_or_else(|| "Failed to determine base path".to_string())?;

    base.push("public");
    base.push("books");

    fs::create_dir_all(&base).map_err(|e| format!("Failed to create books directory: {}", e))?;

    let saved_path_on_disk = base.join(&file_name);
    fs::write(&saved_path_on_disk, &file_data).map_err(|e| format!("Failed to save file: {}", e))?;

    let public_path = format!("/books/{}", file_name);

    // Parse metadata
    let mut doc = EpubDoc::new(&file_path).map_err(|e| format!("Failed to open EPUB: {}", e))?;
    
    let title = doc.mdata("title").unwrap_or_else(|| "Unknown Title".to_string());
    let author = doc.mdata("creator").unwrap_or_else(|| "Unknown Author".to_string());

    let cover_data_url = if let Ok(cover_data) = doc.get_cover() {
        // We get raw image data, so we have to guess the mime type.
        // 'image/jpeg' is a common default for EPUB covers.
        let mime_type = "image/jpeg";
        let base64_cover = general_purpose::STANDARD.encode(&cover_data);
        format!("data:{};base64,{}", mime_type, base64_cover)
    } else {
        "".to_string()
    };

    Ok(EpubMetadata {
        title,
        author,
        cover: cover_data_url,
        path: public_path,
    })
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
        .plugin(tauri_plugin_fs::init())
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
        .invoke_handler(tauri::generate_handler![parse_epub_metadata])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}