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
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  const { books, tags, authors, loading, error, addBook, updateBook, deleteBook } = useBooks();

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch = (() => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
        );
      })();

      const matchesTag = selectedTag 
        ? b.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase())
        : true;
      
      const matchesAuthor = selectedAuthor
        ? b.author.toLowerCase() === selectedAuthor.toLowerCase()
        : true;

      return matchesSearch && matchesTag && matchesAuthor;
    });
  }, [books, search, selectedTag, selectedAuthor]);

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
      
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <BookForm
              initialData={editingBook}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="grid h-full transition-all duration-300"
        style={{
          gridTemplateColumns: "auto 1fr",
          gridTemplateRows: "60px 1fr 260px",
        }}
      >
        <header className="col-span-2 flex items-center gap-3 px-4 bg-card border-b">
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
              className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
                view === "grid"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              }`}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
            <button
              className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${
                view === "list"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              }`}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>

          <input
            type="text"
            placeholder="Search..."
            className="ml-4 w-72 px-3 py-1.5 rounded-md text-sm bg-input border focus:ring-2 focus:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </header>

        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          tags={tags}
          authors={authors}
          selectedTag={selectedTag}
          selectedAuthor={selectedAuthor}
          onSelectTag={setSelectedTag}
          onSelectAuthor={setSelectedAuthor}
        />

        <main className="overflow-auto relative">
          {loading && <p className="p-6">Loading books...</p>}
          {error && <p className="p-6 text-destructive">{error}</p>}
          {!loading && !error && (
            <AnimatePresence mode="wait">
              {view === "grid" ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <BookGrid books={filteredBooks} onSelect={setSelectedBook} />
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <BookList books={filteredBooks} onSelect={setSelectedBook} />
                </motion.div>
              )}
            </AnimatePresence>
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