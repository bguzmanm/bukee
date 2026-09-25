import { useEffect, useState, useCallback, useMemo } from "react";
import { KindleBook } from "@/types";
import { detectKindle, listKindleBooks, deleteKindleBook, ejectKindle } from "@/lib/tauri";
import { BookRepository } from "@/lib/db";

function mergeMeta(
  books: KindleBook[],
  meta: Record<string, { tags: string[]; author: string | null }>,
): KindleBook[] {
  return books.map((book) => {
    const m = meta[book.path];
    if (!m) return book;
    return {
      ...book,
      tags: m.tags ?? book.tags,
      author: m.author || book.author,
    };
  });
}

export function useKindle() {
  const [path, setPath] = useState<string | null>(null);
  const [books, setBooks] = useState<KindleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookData, meta] = await Promise.all([
        listKindleBooks(),
        BookRepository.getAllKindleMeta(),
      ]);
      setBooks(mergeMeta(bookData, meta));
    } catch (err) {
      console.error(err);
      setError(String(err));
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function check() {
      const detected = await detectKindle().catch(() => null);
      if (!active) return;
      setPath((prev) => (prev === detected ? prev : detected));
    }
    check();
    const interval = setInterval(check, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const saveMeta = useCallback(
    async (path: string, tags: string[], author: string | null) => {
      await BookRepository.saveKindleMeta(path, tags, author);
      setBooks((prev) =>
        prev.map((b) => {
          if (b.path !== path) return b;
          return { ...b, tags, author: author || b.author };
        }),
      );
    },
    [],
  );

  const removeBooks = useCallback(
    async (paths: string[]) => {
      const failed: string[] = [];
      for (const p of paths) {
        try {
          await deleteKindleBook(p);
        } catch (err) {
          console.error(err);
          failed.push(p);
        }
      }
      await Promise.all([
        BookRepository.deleteKindleMetas(paths.filter((p) => !failed.includes(p))),
        refreshBooks(),
      ]);
      return { removed: paths.length - failed.length, failed };
    },
    [refreshBooks],
  );

  const removeBook = useCallback(
    async (path: string) => {
      const { failed } = await removeBooks([path]);
      return !failed.includes(path);
    },
    [removeBooks],
  );

  const eject = useCallback(async (): Promise<boolean> => {
    try {
      await ejectKindle();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (path) {
      refreshBooks();
    } else {
      setBooks([]);
      setError(null);
    }
  }, [path, refreshBooks]);

  const kindleTags = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      (b.tags ?? []).forEach((tag) => {
        const t = tag.trim();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [books]);

  const kindleAuthors = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      const author = b.author.trim();
      if (!author || author === "Unknown" || author === "Desconocido") return;
      counts[author] = (counts[author] || 0) + 1;
    });
    return counts;
  }, [books]);

  return {
    connected: path !== null,
    path,
    books,
    loading,
    error,
    kindleTags,
    kindleAuthors,
    refreshBooks,
    saveMeta,
    eject,
    removeBook,
    removeBooks,
  };
}