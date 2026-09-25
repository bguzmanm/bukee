import { invoke } from "@tauri-apps/api/core";
import type { KindleBook } from "@/types";
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

export async function detectKindle(): Promise<string | null> {
  return invoke<string | null>("detect_kindle");
}

export async function ejectKindle(): Promise<void> {
  return invoke<void>("eject_kindle");
}

export async function sendToKindle(filePath: string): Promise<string> {
  return invoke<string>("send_to_kindle", { filePath });
}

export async function listKindleBooks(): Promise<KindleBook[]> {
  return invoke<KindleBook[]>("list_kindle_books");
}

export async function deleteKindleBook(path: string): Promise<void> {
  return invoke<void>("delete_kindle_book", { path });
}
