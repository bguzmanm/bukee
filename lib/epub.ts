import ePub from "epubjs";
import { parseEpubMetadata, EpubMetadata } from "./tauri";

export async function parseEpub(filePath: string): Promise<EpubMetadata> {
  // Call the Rust backend to parse the EPUB and return metadata
  return await parseEpubMetadata(filePath);
}