import { useEffect, useState, useCallback } from "react";
import { KindleBook } from "@/types";
import { detectKindle, listKindleBooks, deleteKindleBook } from "@/lib/tauri";

export function useKindle() {
  const [path, setPath] = useState<string | null>(null);
  const [books, setBooks] = useState<KindleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBooks(await listKindleBooks());
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
      await refreshBooks();
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

  useEffect(() => {
    if (path) {
      refreshBooks();
    } else {
      setBooks([]);
      setError(null);
    }
  }, [path, refreshBooks]);

  return {
    connected: path !== null,
    path,
    books,
    loading,
    error,
    refreshBooks,
    removeBook,
    removeBooks,
  };
}