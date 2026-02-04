"use client";

import { useState, useMemo } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { useBooks } from "@/hooks/useBooks";
import { Book } from "@/types";
import { BookGrid } from "@/components/BookGrid";
import { BookList } from "@/components/BookList";
import { BookDetails } from "@/components/BookDetails";
import { Sidebar } from "@/components/Sidebar";
import { BookForm } from "@/components/BookForm";

export default function Home() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const { books, loading, error, addBook, updateBook, deleteBook } = useBooks();

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [books, search]);

  const handleCreate = () => {
    setEditingBook(null);
    setIsFormOpen(true);
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteBook(id);
    if (selectedBook?.id === id) {
      setSelectedBook(null);
    }
  };

  const handleFormSubmit = async (data: Book | Omit<Book, "id">) => {
    if ("id" in data) {
      await updateBook(data as Book);
      // Update selected book if it's the one being edited
      if (selectedBook?.id === data.id) {
        setSelectedBook(data as Book);
      }
    } else {
      await addBook(data);
    }
    setIsFormOpen(false);
  };

  return (
    <main className="h-screen m-0 relative bg-background text-foreground">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      
      {isFormOpen && (
        <BookForm
          initialData={editingBook}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      <div
        className="grid h-full"
        style={{
          gridTemplateColumns: "250px 1fr",
          gridTemplateRows: "60px 1fr 260px",
        }}
      >
        <header className="col-span-3 flex items-center gap-3 px-4 bg-card border-b">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCreate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm"
            >
              Add Book
            </button>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              className={`px-3 py-1.5 rounded-full text-sm border-2 ${
                view === "grid"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-transparent"
              }`}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
            <button
              className={`px-3 py-1.5 rounded-full text-sm border-2 ${
                view === "list"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-transparent"
              }`}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>

          <input
            type="text"
            placeholder="Search..."
            className="ml-4 w-72 px-3 py-1.5 rounded-md text-sm bg-input border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </header>

        <Sidebar />

        <main className="overflow-auto">
          {loading && <p className="p-6">Loading books...</p>}
          {error && <p className="p-6 text-destructive">{error}</p>}
          {!loading && !error && (
            <>
              {view === "grid" ? (
                <BookGrid books={filteredBooks} onSelect={setSelectedBook} />
              ) : (
                <BookList books={filteredBooks} onSelect={setSelectedBook} />
              )}
            </>
          )}
        </main>

        <BookDetails 
          book={selectedBook} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </main>
  );
}