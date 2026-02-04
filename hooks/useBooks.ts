import { useState, useEffect } from "react";
import { Book } from "@/types";
import { BookRepository } from "@/lib/db";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    try {
      setLoading(true);
      await BookRepository.init();
      const data = await BookRepository.getAll();
      setBooks(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load books");
    } finally {
      setLoading(false);
    }
  }

  async function addBook(book: Omit<Book, "id">) {
    try {
      await BookRepository.create(book);
      await loadBooks();
    } catch (err) {
      console.error(err);
      setError("Failed to add book");
    }
  }

  async function updateBook(book: Book) {
    try {
      await BookRepository.update(book);
      await loadBooks();
    } catch (err) {
      console.error(err);
      setError("Failed to update book");
    }
  }

  async function deleteBook(id: number) {
    try {
      await BookRepository.deleteById(id);
      await loadBooks();
    } catch (err) {
      console.error(err);
      setError("Failed to delete book");
    }
  }

  return { books, loading, error, refresh: loadBooks, addBook, updateBook, deleteBook };
}