import ePub from "epubjs";
import { Book } from "@/types";
import { saveEpubFile } from "./tauri";

export interface EpubParseResult extends Partial<Book> {
  filePath?: string;
}

export async function parseEpub(file: File): Promise<EpubParseResult> {
  return new Promise(async (resolve, reject) => {
    try {
      // Primero, guardamos el archivo
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      let filePath = "";
      try {
        filePath = await saveEpubFile(file.name, uint8Array);
      } catch (err) {
        console.warn("Could not save EPUB file to disk:", err);
        // Continuamos sin guardarlo en disco
      }

      // Luego, parseamos los metadatos
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const book = ePub(arrayBuffer);

          await book.ready;

          const metadata = await book.loaded.metadata;
          const coverUrl = await book.coverUrl();

          let coverDataUrl = "";
          if (coverUrl) {
            try {
              const response = await fetch(coverUrl);
              const blob = await response.blob();
              coverDataUrl = await new Promise((res) => {
                const r = new FileReader();
                r.onloadend = () => res(r.result as string);
                r.readAsDataURL(blob);
              });
            } catch (err) {
              console.warn("Could not process cover image", err);
            }
          }

          resolve({
            title: metadata.title || file.name.replace(".epub", ""),
            author: metadata.creator || "Unknown",
            cover: coverDataUrl || "",
            tags: [],
            rating: 0,
            path: filePath || `/books/${file.name}`,
          });
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } catch (err) {
      reject(err);
    }
  });
}
