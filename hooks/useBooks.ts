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
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function addBook(book: Omit<Book, "id">) {
    try {
      await BookRepository.create(book);
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to add book");
    }
  }

  async function updateBook(book: Book) {
    try {
      await BookRepository.update(book);
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to update book");
    }
  }

  async function deleteBook(id: number) {
    try {
      await BookRepository.deleteById(id);
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to delete book");
    }
  }

  return { books, tags, authors, loading, error, refresh: loadData, addBook, updateBook, deleteBook };
}