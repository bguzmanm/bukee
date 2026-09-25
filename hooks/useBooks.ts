import { useState, useEffect } from "react";
import { Book } from "@/types";
import { BookRepository } from "@/lib/db";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [tags, setTags] = useState<Record<string, number>>({});
  const [authors, setAuthors] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      await BookRepository.init();
      const [booksData, tagsData, authorsData] = await Promise.all([
        BookRepository.getAll(),
        BookRepository.getTagsWithCounts(),
        BookRepository.getAuthorsWithCounts()
      ]);
      setBooks(booksData);
      setTags(tagsData);
      setAuthors(authorsData);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los libros");
    } finally {
      setLoading(false);
    }
  }

  async function addBook(book: Omit<Book, "id">): Promise<boolean> {
    try {
      await BookRepository.create(book);
      await loadData();
      return true;
    } catch (err) {
      console.error(err);
      setError("No se pudo añadir el libro");
      return false;
    }
  }

  async function updateBook(book: Book): Promise<boolean> {
    try {
      await BookRepository.update(book);
      await loadData();
      return true;
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el libro");
      return false;
    }
  }

  async function deleteBook(id: number): Promise<boolean> {
    try {
      await BookRepository.deleteById(id);
      await loadData();
      return true;
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el libro");
      return false;
    }
  }

  async function deleteBooks(ids: number[]): Promise<boolean> {
    if (ids.length === 0) return true;
    try {
      await BookRepository.deleteByIds(ids);
      await loadData();
      return true;
    } catch (err) {
      console.error(err);
      setError("No se pudieron eliminar los libros");
      return false;
    }
  }

  return { books, tags, authors, loading, error, refresh: loadData, addBook, updateBook, deleteBook, deleteBooks };
}