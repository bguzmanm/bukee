import { invoke } from "@tauri-apps/api/core";
export interface EpubMetadata {
  title: string;
  author: string;
  cover: string;
  path: string;
  description: string;
  identifier: string;
}

export async function parseEpubMetadata(filePath: string): Promise<EpubMetadata> {
  return await invoke<EpubMetadata>("parse_epub_metadata", { filePath });
}