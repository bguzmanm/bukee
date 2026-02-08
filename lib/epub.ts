import ePub from "epubjs";
import { Book } from "@/types";

export async function parseEpub(arrayBuffer: ArrayBuffer): Promise<Partial<Book>> {
  try {
    const book = ePub(arrayBuffer);
    await book.ready;
    
    const metadata = await book.loaded.metadata;
    console.log("EPUB Metadata:", metadata); // Log para depurar

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

    return {
      title: metadata.title || "Untitled",
      author: metadata.creator || "Unknown",
      description: metadata.description || "",
      identifier: metadata.identifier || "",
      cover: coverDataUrl || "",
      tags: [], 
      rating: 0,
    };
  } catch (err) {
    console.error("Error in epub.js parsing:", err);
    throw err;
  }
}