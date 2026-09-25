// rust
use std::fs;
use std::path::PathBuf;
use std::env;
use base64::{engine::general_purpose, Engine as _};
use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_fs;
use serde::Serialize;
use epub::doc::EpubDoc;
use log::{error, info, warn};

#[derive(Serialize)]
struct EpubMetadata {
    title: String,
    author: String,
    cover: String,
    path: String,
    description: String,
    identifier: String,
}

#[tauri::command]
async fn parse_epub_metadata(
    _app: tauri::AppHandle,
    file_path: String,
) -> Result<EpubMetadata, String> {
    info!("Received file_path: {}", file_path);

    let file_data = fs::read(&file_path).map_err(|e| {
        error!("Failed to read original file {}: {}", file_path, e);
        format!("Failed to read file: {}", e)
    })?;
    info!("Successfully read original file: {}", file_path);

    let file_name = PathBuf::from(&file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown.epub")
        .to_string();
    info!("Extracted file_name: {}", file_name);
    
    let exe = env::current_exe().map_err(|e| {
        error!("Failed to get current executable path: {}", e);
        format!("current_exe error: {}", e)
    })?;
    info!("Current executable path: {:?}", exe);

    let mut base = exe.parent()
        .and_then(|p| p.parent())
        .and_then(|p| p.parent()) // Go up to /Volumes/BGSSD/code/Bukee/src-tauri
        .and_then(|p| p.parent()) // Go up to /Volumes/BGSSD/code/Bukee
        .map(PathBuf::from)
        .ok_or_else(|| {
            error!("Failed to determine base path from executable.");
            "Failed to determine base path".to_string()
        })?;
    info!("Determined base path: {:?}", base);

    base.push("public");
    base.push("books");
    info!("Target public books directory: {:?}", base);

    fs::create_dir_all(&base).map_err(|e| {
        error!("Failed to create public books directory {:?}: {}", base, e);
        format!("Failed to create books directory: {}", e)
    })?;
    info!("Ensured public books directory exists: {:?}", base);

    let saved_path_on_disk = base.join(&file_name);
    info!("Attempting to save file to: {:?}", saved_path_on_disk);
    fs::write(&saved_path_on_disk, &file_data).map_err(|e| {
        error!("Failed to save file to {:?}: {}", saved_path_on_disk, e);
        format!("Failed to save file: {}", e)
    })?;
    info!("Successfully saved file to: {:?}", saved_path_on_disk);

    let public_path = format!("/books/{}", file_name);
    info!("Public path for frontend: {}", public_path);

    // Parse metadata
    let mut doc = EpubDoc::new(&file_path).map_err(|e| {
        error!("Failed to open EPUB {}: {}", file_path, e);
        format!("Failed to open EPUB: {}", e)
    })?;
    info!("Successfully opened EPUB for parsing: {}", file_path);
    
    let title = doc.mdata("title").unwrap_or_else(|| "Unknown Title".to_string());
    let author = doc.mdata("creator").unwrap_or_else(|| "Unknown Author".to_string());
    info!("EPUB Title: '{}', Author: '{}'", title, author);

    let description = doc.mdata("description").unwrap_or_else(|| "".to_string());
    let identifier = doc.mdata("identifier").unwrap_or_else(|| "".to_string());
    info!("EPUB Description: '{}'", description);
    info!("EPUB Identifier: '{}'", identifier);

    let cover_data_url = if let Ok(cover_data) = doc.get_cover() {
        // We get raw image data, so we have to guess the mime type.
        // 'image/jpeg' is a common default for EPUB covers.
        let mime_type = "image/jpeg";
        let base64_cover = general_purpose::STANDARD.encode(&cover_data);
        info!("Generated Base64 cover data URL.");
        format!("data:{};base64,{}", mime_type, base64_cover)
    } else {
        warn!("No cover found or failed to get cover for EPUB: {}", file_path);
        "".to_string()
    };

    Ok(EpubMetadata {
        title,
        author,
        cover: cover_data_url,
        path: public_path,
        description,
        identifier,
    })
}

fn find_kindle() -> Option<PathBuf> {
    let volumes = PathBuf::from("/Volumes");
    for entry in fs::read_dir(&volumes).ok()?.flatten() {
        let path = entry.path();
        if path.join("documents").is_dir() && path.join("system").is_dir() {
            return Some(path);
        }
    }
    None
}

#[tauri::command]
fn detect_kindle() -> Option<String> {
    find_kindle().map(|p| p.to_string_lossy().into_owned())
}

#[tauri::command]
fn eject_kindle() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let kindle = find_kindle()
            .ok_or_else(|| "No se encontró un Kindle conectado por USB".to_string())?;
        let path = kindle.to_string_lossy().into_owned();
        let output = std::process::Command::new("/usr/sbin/diskutil")
            .arg("eject")
            .arg(&path)
            .output()
            .map_err(|e| format!("No se pudo ejecutar diskutil: {}", e))?;
        if output.status.success() {
            info!("Kindle expulsado de forma segura: {}", path);
            return Ok(());
        }
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let detail = if !stderr.is_empty() { stderr } else { stdout };
        return Err(format!("No se pudo expulsar el Kindle: {}", detail));
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("La expulsión segura solo está disponible en macOS".to_string())
    }
}

#[tauri::command]
fn send_to_kindle(file_path: String) -> Result<String, String> {
    let kindle = find_kindle()
        .ok_or_else(|| "No se encontró un Kindle conectado por USB".to_string())?;
    let src = PathBuf::from(&file_path);
    if !src.is_file() {
        return Err(format!("El archivo no existe en disco: {}", file_path));
    }

    let file_name = src
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Nombre de archivo inválido".to_string())?;
    let stem = src.file_stem().and_then(|s| s.to_str()).unwrap_or(file_name);
    let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("");

    let documents = kindle.join("documents");
    let dest;
    let mut dest_name = file_name.to_string();
    let mut counter = 1;
    loop {
        let candidate = documents.join(&dest_name);
        if !candidate.exists() {
            dest = candidate;
            break;
        }
        dest_name = if ext.is_empty() {
            format!("{} ({})", stem, counter)
        } else {
            format!("{} ({}).{}", stem, counter, ext)
        };
        counter += 1;
    }

    fs::copy(&src, &dest).map_err(|e| format!("Error al copiar el archivo: {}", e))?;
    Ok(dest_name)
}

const KINDLE_FORMATS: &[&str] = &[
    "epub", "mobi", "azw", "azw3", "azw3f", "azw3r", "azw6", "kfx", "prc", "pdf", "txt", "doc",
    "docx",
];

#[derive(Serialize)]
struct KindleBook {
    name: String,
    path: String,
    title: String,
    author: String,
    format: String,
    size: u64,
    cover: Option<String>,
    // Progreso de lectura que el propio Kindle registra en documents/<libro>.sdr/*.mbs
    // (campo fpr / "furthest position record"). Valores posibles de status:
    // "en_curso" (abierto recientemente), "leido" (abierto hace tiempo) o "sin_comenzar".
    status: String,
    position: Option<u64>,
    last_read: Option<u64>,
    progress: Option<u8>,
}

// Lee el progreso de lectura de un libro: busca su carpeta .sdr, localiza el
// archivo .mbs y extrae la posición (offset 52 del payload base64 del campo
// fpr) y la fecha de la última lectura (mtime del .mbs).
//
// El estado se calcula comparando la posición con el tamaño del archivo:
// el Kindle anota posiciones en bytes del texto, así que un libro terminado
// muestra una proporción cercana o por encima de 1 (el archivo suele estar
// comprimido). Umbral empírico calibrado con los datos de este dispositivo:
// finished >= 0.8. No es 100% fiable (libros con pocas imágenes y texto muy
// comprimido pueden acabar por debajo del umbral y viceversa).
fn kindle_progress(kindle: &std::path::Path, book: &std::path::Path) -> (String, Option<u64>, Option<u64>, Option<u8>) {
    const FINISHED_RATIO: f64 = 0.8;
const STARTED_MIN_PCT: u8 = 3;
    let documents = kindle.join("documents");
    let fname = book.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let stem = match fname.rfind('.') {
        Some(dot) => fname[..dot].to_string(),
        None => fname.clone(),
    };

    let find_sdr = |dir: &std::path::Path, stem: &str| -> Option<std::path::PathBuf> {
        let exact = dir.join(format!("{stem}.sdr"));
        if exact.is_dir() {
            return Some(exact);
        }
        let mut best: Option<(usize, std::path::PathBuf)> = None;
        let Ok(entries) = fs::read_dir(dir) else {
            return None;
        };
        for entry in entries.flatten() {
            let p = entry.path();
            if !p.is_dir() {
                continue;
            }
            let Some(n) = p.file_name().map(|n| n.to_string_lossy().into_owned()) else {
                continue;
            };
            let Some(base) = n.strip_suffix(".sdr") else {
                continue;
            };
            if base.len() >= 20 && stem.starts_with(base) {
                let len = base.len();
                if best.as_ref().map(|(l, _)| len > *l).unwrap_or(true) {
                    best = Some((len, p.clone()));
                }
            }
        }
        best.map(|(_, p)| p)
    };

    let parse_mbs = |sdr: &std::path::Path| -> (Option<u64>, Option<u64>) {
        let Ok(entries) = fs::read_dir(sdr) else {
            return (None, None);
        };
        for entry in entries.flatten() {
            let p = entry.path();
            let Some(n) = p.file_name().map(|n| n.to_string_lossy().into_owned()) else {
                continue;
            };
            if !n.ends_with(".mbs") {
                continue;
            }
            let Ok(data) = fs::read(&p) else {
                continue;
            };
            let Ok(md) = fs::metadata(&p) else {
                continue;
            };
            let last_read = md.modified().ok().and_then(|t| {
                t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs())
            });
            // El valor del fpr empieza en el primer ":REFU" (también existe una
            // segunda clave "lpr" con el mismo valor, por eso usamos la primera).
            let Some(i) = data.windows(5).position(|w| w == b":REFU") else {
                return (None, last_read);
            };
            // Hasta el primer NUL; el base64 va partido por un \n y puede haber
            // bytes de relleno (ff/02) antes de la siguiente clave: se filtran.
            let end = data[i + 1..].iter().position(|&b| b == 0).map(|e| i + 1 + e).unwrap_or(data.len());
            let b64: Vec<u8> = data[i + 1..end]
                .iter()
                .copied()
                .filter(|&b| b.is_ascii_alphanumeric() || b == b'+' || b == b'/' || b == b'=')
                .collect();
            let Ok(buf) = general_purpose::STANDARD
                .decode(&b64)
                .or_else(|_| general_purpose::STANDARD_NO_PAD.decode(&b64))
            else {
                return (None, last_read);
            };
            let pos = buf
                .get(52..56)
                .and_then(|s| s.try_into().ok())
                .map(u32::from_be_bytes)
                .map(|v| v as u64);
            let pos = pos.filter(|&v| v > 0);
            return (pos, last_read);
        }
        (None, None)
    };

    let sdr_root = book
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| documents.clone());
    let sdr = find_sdr(&sdr_root, &stem);
    let (position, last_read) = sdr.as_deref().map(parse_mbs).unwrap_or((None, None));
    let size = fs::metadata(book).map(|m| m.len()).unwrap_or(0);
    let progress = position
        .filter(|_| size > 0)
        .map(|p| ((p as f64 / size as f64) * 100.0).clamp(1.0, 100.0) as u8);
    let status = match (position, progress) {
        (None, _) => "sin_comenzar".to_string(),
        (Some(_), Some(p)) if p >= ((FINISHED_RATIO * 100.0) as u8) => "leido".to_string(),
        (Some(_), Some(p)) if p < STARTED_MIN_PCT => "sin_comenzar".to_string(),
        (Some(_), _) => "en_curso".to_string(),
    };
    (status, position, last_read, progress)
}

// Resolución de carátulas de libros del Kindle.
// Orden: 1) miniatura cacheada por el propio Kindle (EXTH tipo 113 = id del
// libro en el dispositivo -> system/thumbnails/thumbnail_<id>_EBOK_portrait.jpg);
// 2) extracción de la imagen de portada embebida en el archivo MOBI/AZW3
// (el bloque EXTH queda en claro aunque el header esté ofuscado por DRM).
// Los resultados se cachean en memoria: el listado se refresca cada 5 s y no
// queremos releer cientos de libros con cada poll de la UI.

fn read_exth(d: &[u8]) -> Option<std::collections::HashMap<u32, Vec<u8>>> {
    let start = d.windows(4).position(|w| w == b"EXTH")?;
    if start + 12 > d.len() {
        return None;
    }
    let len = u32::from_be_bytes(d[start + 4..start + 8].try_into().ok()?) as usize;
    let count = u32::from_be_bytes(d[start + 8..start + 12].try_into().ok()?) as usize;
    let mut map = std::collections::HashMap::new();
    let mut q = start + 12;
    let end = (start + len).min(d.len());
    for _ in 0..count {
        if q + 8 > end {
            break;
        }
        let t = u32::from_be_bytes(d[q..q + 4].try_into().ok()?);
        let rl = u32::from_be_bytes(d[q + 4..q + 8].try_into().ok()?) as usize;
        let rec_end = (q + rl).min(end);
        map.insert(t, d[q + 8..rec_end].to_vec());
        q += rl;
    }
    Some(map)
}

fn mb_data_url(bytes: Vec<u8>) -> String {
    format!("data:image/jpeg;base64,{}", general_purpose::STANDARD.encode(bytes))
}

fn thumbnail_variant(thumbnails: &std::path::Path, uid: &str) -> Option<String> {
    if uid.is_empty() || !uid.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
        return None;
    }
    for name in [
        format!("thumbnail_{uid}_EBOK_portrait.jpg"),
        format!("thumbnail_{uid}_EBOK_CV_P3756_portrait.jpg"),
    ] {
        if let Ok(data) = fs::read(thumbnails.join(name)) {
            let b64 = general_purpose::STANDARD.encode(data);
            return Some(format!("data:image/jpeg;base64,{b64}"));
        }
    }
    None
}

fn mobi_embedded_cover(d: &[u8]) -> Option<Vec<u8>> {
    if d.len() < 78 {
        return None;
    }
    let num = u16::from_be_bytes(d[76..78].try_into().ok()?) as usize;
    let exth = read_exth(d)?;
    let off201 = if let Some(v) = exth.get(&201) {
        u32::from_be_bytes(v.get(..4)?.try_into().ok()?) as usize
    } else {
        return None;
    };
    // primer registro que es un JPEG (carátulas laterales = índice relativo)
    let mut first_img = None;
    for i in 0..num {
        let ro = u32::from_be_bytes(d.get(78 + i * 8..78 + i * 8 + 4)?.try_into().ok()?);
        let ro = ro as usize;
        if ro + 2 <= d.len() && d[ro..ro + 2] == [0xff, 0xd8] {
            first_img = Some((i, ro));
            break;
        }
    }
    let (fi, _ro) = first_img?;
    let off = 78 + (fi + off201) * 8;
    if off + 4 > d.len() {
        return None;
    }
    let rr = u32::from_be_bytes(d[off..off + 4].try_into().ok()?) as usize;
    if rr + 2 > d.len() || d[rr..rr + 2] != [0xff, 0xd8] {
        return None;
    }
    // fin del JPEG: marcador FFD9
    let endp = d[rr..].windows(2).position(|w| w[0] == 0xff && w[1] == 0xd9);
    match endp {
        Some(e) => Some(d[rr..rr + e + 2].to_vec()),
        None => None,
    }
}

fn compute_cover(kindle: &std::path::Path, book: &std::path::Path) -> Option<String> {
    let thumbnails = kindle.join("system/thumbnails");
    let mut f = fs::File::open(book).ok()?;
    let mut chunk = vec![0u8; 1 << 20];
    let n = std::io::Read::read(&mut f, &mut chunk).ok()?;
    chunk.truncate(n.min(chunk.len()));
    if let Some(exth) = read_exth(&chunk) {
        if let Some(uid) = exth.get(&113) {
            let uid = String::from_utf8_lossy(uid);
            if let Some(url) = thumbnail_variant(&thumbnails, &uid) {
                return Some(url);
            }
        }
    }
    let full = fs::read(book).ok()?;
    mobi_embedded_cover(&full).map(mb_data_url)
}

use std::sync::{LazyLock, Mutex};
static COVER_CACHE: LazyLock<Mutex<std::collections::HashMap<String, Option<String>>>> =
    LazyLock::new(|| Mutex::new(std::collections::HashMap::new()));

fn cover_for(kindle: &std::path::Path, book: &std::path::Path) -> Option<String> {
    let key = book.to_string_lossy().into_owned();
    {
        if let Ok(cache) = COVER_CACHE.lock() {
            if let Some(v) = cache.get(&key) {
                return v.clone();
            }
        }
    }
    let val = compute_cover(kindle, book);
    if let Ok(mut cache) = COVER_CACHE.lock() {
        cache.insert(key, val.clone());
    }
    val
}

fn strip_amazon_suffix(name: &str) -> String {
    let mut s = name.to_string();
    loop {
        let before = s.clone();
        // (A) token glued at the very end (hash appended to the extension), e.g. "foo.azw3_V53D6QM2LEIS..."
        let removed_a = match s.rfind('_') {
            Some(pos) => {
                let tail = &s[pos + 1..];
                let is_hash = tail.len() >= 8
                    && tail.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit());
                if is_hash {
                    s.truncate(pos);
                    true
                } else {
                    false
                }
            }
            None => false,
        };
        // (B) hash/ASIN chunk right before the extension, e.g. "foo_B00HF7TRYG.kfx"
        let removed_b = if !removed_a {
            match (s.rfind('.'), s.rfind('_')) {
                (Some(dot), Some(pos)) if pos < dot => {
                    let seg = &s[pos + 1..dot];
                    let is_hash = seg.len() >= 8
                        && seg.chars().all(|c| c.is_ascii_uppercase() || c.is_ascii_digit());
                    let is_uuid = seg.len() >= 32
                        && seg.chars().all(|c| c.is_ascii_hexdigit() || c == '-');
                    if is_hash || is_uuid {
                        s.drain(pos..dot);
                        true
                    } else {
                        false
                    }
                }
                _ => false,
            }
        } else {
            false
        };
        // (C) trailing 32-char hex glued to the stem (KOReader/Calibre copies), e.g. "foo264ac...e6385.azw3f"
        let mut removed_c = false;
        if !removed_a && !removed_b {
            if let Some(dot) = s.rfind('.') {
                let open = &s[..dot];
                let len = open.len();
                if len >= 32 && open[len - 32..].chars().all(|c| c.is_ascii_hexdigit()) {
                    let mut out = s[..dot - 32].to_string();
                    out.push_str(&s[dot..]);
                    s = out;
                    removed_c = true;
                }
            }
        }
        if !removed_a && !removed_b && !removed_c && s == before {
            break;
        }
    }
    for suffix in [" (Spanish Edition)", " (English Edition)"] {
        s = s.replace(suffix, "");
    }
    s.trim().to_string()
}

fn clean_kindle_name(name: &str) -> (String, String) {
    let cleaned = strip_amazon_suffix(name);
    match cleaned.rfind('.') {
        Some(dot) => (
            cleaned[..dot].trim().to_string(),
            cleaned[dot + 1..].to_lowercase(),
        ),
        None => (cleaned, String::new()),
    }
}

fn split_title_author(title: &str) -> (String, String) {
    match title.rfind(" - ") {
        Some(pos) => (
            title[..pos].trim().to_string(),
            title[pos + 3..].trim().to_string(),
        ),
        None => (title.to_string(), String::new()),
    }
}

fn collect_kindle_books(dir: &std::path::Path, kindle: &std::path::Path, out: &mut Vec<KindleBook>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') {
            continue;
        }
        if path.is_dir() {
            if name == "dictionaries" || name.ends_with(".sdr") {
                continue;
            }
            collect_kindle_books(&path, kindle, out);
            continue;
        }
        let (raw_title, ext) = clean_kindle_name(&name);
        if !KINDLE_FORMATS.contains(&ext.as_str()) {
            continue;
        }
        let (title, author) = split_title_author(&raw_title);
        let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
        let cover = cover_for(kindle, &path);
        let (status, position, last_read, progress) = kindle_progress(kindle, &path);
        out.push(KindleBook {
            name,
            path: path.to_string_lossy().into_owned(),
            title,
            author,
            format: ext.to_uppercase(),
            size,
            cover,
            status,
            position,
            last_read,
            progress,
        });
    }
}

#[tauri::command]
fn list_kindle_books() -> Result<Vec<KindleBook>, String> {
    let kindle = find_kindle()
        .ok_or_else(|| "No se encontró un Kindle conectado por USB".to_string())?;
    let documents = kindle.join("documents");
    if !documents.is_dir() {
        return Err("El Kindle no tiene carpeta documents".to_string());
    }
    let mut books = Vec::new();
    collect_kindle_books(&documents, &kindle, &mut books);
    books.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    Ok(books)
}

#[tauri::command]
fn delete_kindle_book(path: String) -> Result<(), String> {
    let kindle = find_kindle()
        .ok_or_else(|| "No se encontró un Kindle conectado por USB".to_string())?;
    let documents = kindle.join("documents");
    let target = PathBuf::from(&path);
    // Seguridad: solo se permite borrar libros dentro de documents del Kindle
    if !target.starts_with(&documents) {
        return Err(
            "Solo se pueden eliminar libros dentro de la carpeta documents del Kindle".to_string(),
        );
    }
    if !target.is_file() {
        return Err(format!("El archivo ya no existe en el Kindle: {}", path));
    }

    // Miniatura cacheada por el dispositivo (EXTH tipo 113 = id del libro), si existe
    if let Ok(mut f) = fs::File::open(&target) {
        use std::io::Read;
        let mut chunk = Vec::with_capacity(1 << 20);
        let mut buf = [0u8; 1 << 20];
        if let Ok(n) = f.read(&mut buf) {
            chunk.extend_from_slice(&buf[..n]);
            if let Some(exth) = read_exth(&chunk) {
                if let Some(uid) = exth.get(&113) {
                    let uid = String::from_utf8_lossy(uid);
                    if uid.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
                        && !uid.is_empty()
                    {
                        let thumbs = kindle.join("system/thumbnails");
                        for name in [
                            format!("thumbnail_{uid}_EBOK_portrait.jpg"),
                            format!("thumbnail_{uid}_EBOK_CV_P3756_portrait.jpg"),
                            format!("thumbnail_{uid}_LANDSCAPE.jpg"),
                        ] {
                            let _ = fs::remove_file(thumbs.join(name));
                        }
                    }
                }
            }
        }
    }

    fs::remove_file(&target).map_err(|e| format!("Error al eliminar el archivo: {}", e))?;

    // Carpeta .sdr con el progreso/índice de Amazon asociada al libro
    let sdr_name = format!("{}.sdr", target.file_name().map(|n| n.to_string_lossy()).unwrap_or_default());
    let sdr = target.with_file_name(&sdr_name);
    if sdr.is_dir() {
        fs::remove_dir_all(&sdr)
            .map_err(|e| format!("Error al eliminar la carpeta de datos: {}", e))?;
    }

    // Invalidar la carátula cacheada para que un futuro listado la recalcule
    if let Ok(mut cache) = COVER_CACHE.lock() {
        cache.remove(&target.to_string_lossy().into_owned());
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, author TEXT, cover TEXT, tags TEXT, rating INTEGER, path TEXT, description TEXT, identifier TEXT);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_kindle_meta",
            sql: "CREATE TABLE kindle_meta (path TEXT PRIMARY KEY, tags TEXT, author TEXT);",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:bukee.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
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
        .invoke_handler(tauri::generate_handler![
            parse_epub_metadata,
            detect_kindle,
            eject_kindle,
            send_to_kindle,
            list_kindle_books,
            delete_kindle_book
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}