import { invoke } from "@tauri-apps/api/core";

/**
 * Guarda un archivo EPUB en la carpeta de libros de la aplicación
 * @param fileName - Nombre del archivo
 * @param fileData - Contenido del archivo como array de bytes
 * @returns Ruta relativa del archivo guardado
 */
/*export async function saveEpubFile(
  fileName: string,
  fileData: Uint8Array,
): Promise<string> {
  try {
    // Convertir Uint8Array a Array para poder enviarlo a Tauri
    const dataArray = Array.from(fileData);
    const result = await invoke<string>("save_epub_file", {
      fileName,
      fileData: dataArray,
    });
    return result;
  } catch (error) {
    console.error("Error saving EPUB file:", error);
    throw new Error(`Failed to save EPUB file: ${error}`);
  }
}*/

function uint8ArrayToBase64(u8: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  let index = 0;
  const length = u8.length;
  let result = "";
  while (index < length) {
    const slice = u8.subarray(index, Math.min(index + CHUNK_SIZE, length));
    // apply may have typing issues, cast to any
    result += String.fromCharCode.apply(null, slice as any);
    index += CHUNK_SIZE;
  }
  return btoa(result);
}

export async function saveEpubFile(fileName: string, data: Uint8Array): Promise<string> {
  const file_data_base64 = uint8ArrayToBase64(data);
  // El nombre del campo coincide con el parámetro en Rust: file_data_base64
  return await invoke<string>("save_epub_file", { file_name: fileName, file_data_base64 });
}