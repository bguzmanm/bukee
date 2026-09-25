"use client";

import { useState, useMemo, useEffect } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { useBooks } from "@/hooks/useBooks";
import { Book, SortConfig, SortDirection } from "@/types";
import { BookGrid } from "@/components/BookGrid";
import { BookList } from "@/components/BookList";
import { BookDetails } from "@/components/BookDetails";
import { Sidebar } from "@/components/Sidebar";
import { BookForm } from "@/components/BookForm";
import { DragDropOverlay } from "@/components/DragDropOverlay";
import { Pagination } from "@/components/Pagination";
import { motion, AnimatePresence } from "framer-motion";
import { parseEpub } from "@/lib/epub";
import { listen } from "@tauri-apps/api/event";
import { readFile } from "@tauri-apps/plugin-fs";
import { useKindle } from "@/hooks/useKindle";
import { KindleGrid } from "@/components/KindleGrid";
import { KindleBookDetails } from "@/components/KindleBookDetails";
import { KindleBook, KindleStatusFilter } from "@/types";
import { ask } from "@tauri-apps/plugin-dialog";

const ITEMS_PER_PAGE = 8;

export default function Home() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isKindleView, setIsKindleView] = useState(false);
  const [selectedKindleBook, setSelectedKindleBook] = useState<KindleBook | null>(null);
  const [kindleSelectionMode, setKindleSelectionMode] = useState(false);
  const [selectedKindlePaths, setSelectedKindlePaths] = useState<string[]>([]);
  const [kindleStatusFilter, setKindleStatusFilter] = useState<KindleStatusFilter>("todos");
  const kindle = useKindle();

  const filteredKindleBooks = useMemo(() => {
    if (kindleStatusFilter === "todos") return kindle.books;
    return kindle.books.filter((b) => (b.status ?? "sin_comenzar") === kindleStatusFilter);
  }, [kindle.books, kindleStatusFilter]);
  
  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const {
    books,
    tags,
    authors,
    loading,
    error,
    addBook,
    updateBook,
    deleteBook,
  } = useBooks();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedTag, selectedAuthor, view]);

  useEffect(() => {
    console.log("Setting up Tauri event listeners...");
    let unlistenDragEnter: (() => void) | undefined;
    let unlistenDragLeave: (() => void) | undefined;
    let unlistenDragDrop: (() => void) | undefined;
    let unlistenDragOver: (() => void) | undefined;

    listen("tauri://drag-enter", (event) => {
      if (event.payload) {
        setIsDragging(true);
      }
    }).then(fn => { unlistenDragEnter = fn; }).catch(console.error);

    listen("tauri://drag-leave", () => {
      setIsDragging(false);
    }).then(fn => { unlistenDragLeave = fn; }).catch(console.error);

    listen("tauri://drag-over", (event) => {
      // This event fires frequently.
    }).then(fn => { unlistenDragOver = fn; }).catch(console.error);

    listen("tauri://drag-drop", async (event) => {
      setIsDragging(false);
      const payload = event.payload as { paths: string[] } | null;
      const filePaths = payload?.paths || null;

      if (filePaths && filePaths.length > 0) {
        const epubFiles = filePaths.filter((path) =>
          path.toLowerCase().endsWith(".epub"),
        );

        if (epubFiles.length > 0) {
          const filePath = epubFiles[0];
          try {
            // Read the file using Tauri's fs plugin (readFile returns Uint8Array)
            const binaryContent = await readFile(filePath);
            
            // Convert Uint8Array to ArrayBuffer explicitly to satisfy TS
            const arrayBuffer = binaryContent.buffer.slice(
              binaryContent.byteOffset, 
              binaryContent.byteOffset + binaryContent.byteLength
            ) as ArrayBuffer;

            const metadata = await parseEpub(arrayBuffer);
            
            const newBook: Book = {
              id: 0, 
              title: metadata.title || "Untitled",
              author: metadata.author || "Unknown",
              cover: metadata.cover || "",
              tags: metadata.tags || [],
              rating: metadata.rating || 0,
              description: metadata.description || "",
              identifier: metadata.identifier || "",
              path: filePath, // Store the actual file path
            };
            
            setEditingBook(newBook); 
            setIsFormOpen(true);
          } catch (err) {
            console.error("Error parsing EPUB:", err);
            alert(`Failed to parse EPUB file: ${err}`);
          }
        } else {
          alert("Por favor arrastra un archivo .epub válido");
        }
      }
    }).then(fn => { unlistenDragDrop = fn; }).catch(console.error);

    return () => {
      console.log("Cleaning up Tauri event listeners...");
      unlistenDragEnter && unlistenDragEnter();
      unlistenDragLeave && unlistenDragLeave();
      unlistenDragDrop && unlistenDragDrop();
      unlistenDragOver && unlistenDragOver();
    };
  }, []);

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

  // Sorting Logic
  const sortedBooks = useMemo(() => {
    if (!sortConfig) return filteredBooks;

    return [...filteredBooks].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        const aString = aValue.join(", ").toLowerCase();
        const bString = bValue.join(", ").toLowerCase();
        return sortConfig.direction === "asc" 
          ? aString.localeCompare(bString)
          : bString.localeCompare(aString);
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });
  }, [filteredBooks, sortConfig]);

  // Pagination Logic
  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedBooks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedBooks, currentPage]);

  const totalPages = Math.ceil(sortedBooks.length / ITEMS_PER_PAGE);

  const handleSort = (key: keyof Book) => {
    let direction: SortDirection = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

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

  const handleKindleDelete = async (book: KindleBook) => {
    const ok = await kindle.removeBook(book.path);
    if (ok && selectedKindleBook?.path === book.path) {
      setSelectedKindleBook(null);
    }
    return ok;
  };

  const toggleKindleSelect = (book: KindleBook) => {
    setSelectedKindlePaths((prev) =>
      prev.includes(book.path)
        ? prev.filter((p) => p !== book.path)
        : [...prev, book.path],
    );
  };

  const toggleSelectAllKindle = () => {
    const all = filteredKindleBooks.map((b) => b.path);
    setSelectedKindlePaths((prev) =>
      all.every((p) => prev.includes(p)) ? [] : all,
    );
  };

  const handleKindleBulkDelete = async () => {
    const n = selectedKindlePaths.length;
    if (n === 0) return;
    const ok = await ask(
      `Estás seguro de eliminar ${n} ${n === 1 ? "libro" : "libros"} del Kindle?\nSe borrarán los archivos y sus carpetas de datos (.sdr).`,
      { title: "Bukee", kind: "warning" },
    );
    if (!ok) return;

    const attempted = new Set(selectedKindlePaths);
    const { failed } = await kindle.removeBooks(selectedKindlePaths);
    const failedSet = new Set(failed);

    if (
      selectedKindleBook &&
      attempted.has(selectedKindleBook.path) &&
      !failedSet.has(selectedKindleBook.path)
    ) {
      setSelectedKindleBook(null);
    }
    // Mantener solo las rutas que fallaron
    setSelectedKindlePaths(
      (prev) => prev.filter((p) => !attempted.has(p) || failedSet.has(p)),
    );
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
      <DragDropOverlay isDragging={isDragging} />

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
          kindleConnected={kindle.connected}
          activeView={isKindleView ? "kindle" : "library"}
          onSelectLibrary={() => setIsKindleView(false)}
          onSelectKindle={() => {
            setSelectedBook(null);
            setSelectedKindleBook(null);
            setIsKindleView(true);
          }}
        />

        <main className="relative flex flex-col min-h-0 overflow-hidden">
          {isKindleView && (
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-card flex-none">
              <button
                onClick={() => {
                  setKindleSelectionMode((v) => !v);
                  setSelectedKindlePaths([]);
                  setSelectedKindleBook(null);
                }}
                    className={`px-3 py-1.5 rounded-md text-sm border-2 transition-colors ${
                      kindleSelectionMode
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                    }`}
                  >
                    {kindleSelectionMode ? "Cancelar selección" : "Seleccionar"}
                  </button>
                  <select
                    value={kindleStatusFilter}
                    onChange={(e) => setKindleStatusFilter(e.target.value as KindleStatusFilter)}
                    className="px-2 py-1.5 rounded-md text-sm border bg-background"
                  >
                    <option value="todos">Todos</option>
                    <option value="en_curso">En curso</option>
                    <option value="leido">Leídos</option>
                    <option value="sin_comenzar">Sin comenzar</option>
                  </select>
                  {kindleSelectionMode && (
                    <>
                      <span className="text-sm text-muted-foreground">
                        {selectedKindlePaths.length}{" "}
                        {selectedKindlePaths.length === 1
                          ? "libro seleccionado"
                          : "libros seleccionados"}
                      </span>
                      <button
                        onClick={toggleSelectAllKindle}
                        className="px-3 py-1.5 rounded-md text-sm border-2 border-transparent text-muted-foreground hover:bg-muted/80"
                      >
                        {filteredKindleBooks.length > 0 &&
                        selectedKindlePaths.length === filteredKindleBooks.length
                          ? "Ninguno"
                          : "Todos"}
                      </button>
                      <button
                        onClick={handleKindleBulkDelete}
                        disabled={selectedKindlePaths.length === 0}
                        className="px-3 py-1.5 rounded-md text-sm border border-destructive text-destructive hover:bg-destructive/10 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                      >
                        Eliminar seleccionados ({selectedKindlePaths.length})
                      </button>
                    </>
                  )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-0">
            {isKindleView ? (
              <>
                {kindle.loading && <p className="p-6">Cargando libros del Kindle...</p>}
                {kindle.error && <p className="p-6 text-destructive">{kindle.error}</p>}
                {!kindle.loading && !kindle.error && (
                  <KindleGrid
                    books={filteredKindleBooks}
                    selected={selectedKindleBook}
                    onSelect={setSelectedKindleBook}
                    selectionMode={kindleSelectionMode}
                    selectedPaths={selectedKindlePaths}
                    onToggleSelect={toggleKindleSelect}
                  />
                )}
              </>
            ) : (
              <>
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
                        <BookGrid books={paginatedBooks} onSelect={setSelectedBook} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="list"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <BookList 
                          books={paginatedBooks} 
                          onSelect={setSelectedBook}
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </>
            )}
          </div>

          {!isKindleView && !loading && !error && (
             <Pagination 
               currentPage={currentPage}
               totalPages={totalPages}
               onPageChange={setCurrentPage}
             />
          )}
        </main>

        {isKindleView ? (
          <KindleBookDetails
            book={selectedKindleBook}
            onDelete={handleKindleDelete}
          />
        ) : (
          <BookDetails
            book={selectedBook}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onKindleSent={kindle.refreshBooks}
          />
        )}
      </div>
    </main>
  );
}