"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { ReactNode, PointerEvent as ReactPointerEvent } from "react";
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
import { KindleList } from "@/components/KindleList";
import { KindleBookDetails } from "@/components/KindleBookDetails";
import { StatsSheet } from "@/components/StatsSheet";
import { Dashboard } from "@/components/Dashboard";
import { KindleBook, KindleStatusFilter } from "@/types";
import { ask } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { BookGridSkeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronsUpDown, BarChart3, LayoutGrid, List, Loader2, LucideLibrary, Plus, Usb } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
      {icon}
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="text-sm text-muted-foreground max-w-sm">{hint}</p>}
    </div>
  );
}

const PANEL_MIN = 90;
const PANEL_MAX = 420;
const PANEL_DEFAULT = 260;

function useContentSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

function useDetailsPanel() {
  const [height, setHeight] = useState<number>(PANEL_DEFAULT);
  const [collapsed, setCollapsed] = useState(false);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem("bukee-panel-height"));
    if (Number.isFinite(saved) && saved >= PANEL_MIN && saved <= PANEL_MAX) {
      setHeight(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("bukee-panel-height", String(height));
  }, [height]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      dragRef.current = { startY: e.clientY, startH: height };
      setCollapsed(false);
      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        const next = d.startH - (ev.clientY - d.startY);
        setHeight(Math.min(PANEL_MAX, Math.max(PANEL_MIN, next)));
      };
      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [height],
  );

  return {
    height,
    collapsed,
    setCollapsed,
    onPointerDown,
  };
}

function PanelResizeHandle({
  collapsed,
  onToggle,
  onPointerDown,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onPointerDown: (e: ReactPointerEvent) => void;
}) {
  return (
    <div className="relative h-5 flex items-center justify-center border-t bg-card flex-none group">
      <div
        className="absolute inset-0 cursor-ns-resize"
        onPointerDown={onPointerDown}
        title="Arrastra para redimensionar el panel"
      />
      <ChevronsUpDown className="absolute left-1/2 -translate-x-1/2 w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      <button
        onClick={onToggle}
        className="relative z-10 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title={collapsed ? "Mostrar panel de detalles" : "Ocultar panel de detalles"}
        aria-label={collapsed ? "Mostrar panel de detalles" : "Ocultar panel de detalles"}
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
        />
      </button>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [librarySelectionMode, setLibrarySelectionMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [mainView, setMainView] = useState<"home" | "library" | "kindle">("home");
  const isHomeView = mainView === "home";
  const isKindleView = mainView === "kindle";
  const [selectedKindleBook, setSelectedKindleBook] = useState<KindleBook | null>(null);
  const [kindleSelectionMode, setKindleSelectionMode] = useState(false);
  const [selectedKindlePaths, setSelectedKindlePaths] = useState<string[]>([]);
  const [kindleStatusFilter, setKindleStatusFilter] = useState<KindleStatusFilter>("todos");
  const [selectedKindleTag, setSelectedKindleTag] = useState<string | null>(null);
  const [selectedKindleAuthor, setSelectedKindleAuthor] = useState<string | null>(null);
  const [kindlePage, setKindlePage] = useState(1);
  const [ejecting, setEjecting] = useState(false);
  const detailsPanel = useDetailsPanel();
  const kindle = useKindle();
  const { ref: contentRef, size: contentSize } = useContentSize();

  const { itemsPerPage, gridColumns } = useMemo(() => {
    const w = contentSize.width || 900;
    const h = contentSize.height || 640;
    const cols = Math.max(2, Math.floor(w / 196));
    if (view === "list") {
      return { itemsPerPage: Math.max(4, Math.floor(h / 90)), gridColumns: cols };
    }
    const rows = Math.max(2, Math.floor(h / 330));
    return { itemsPerPage: cols * rows, gridColumns: cols };
  }, [contentSize, view]);

  useEffect(() => {
    setCurrentPage(1);
    setKindlePage(1);
  }, [itemsPerPage]);

  const filteredKindleBooks = useMemo(() => {
    return kindle.books.filter((b) => {
      if (kindleStatusFilter !== "todos" && (b.status ?? "sin_comenzar") !== kindleStatusFilter) {
        return false;
      }
      if (selectedKindleTag && !(b.tags ?? []).includes(selectedKindleTag)) {
        return false;
      }
      if (selectedKindleAuthor && b.author !== selectedKindleAuthor) {
        return false;
      }
      return true;
    });
  }, [kindle.books, kindleStatusFilter, selectedKindleTag, selectedKindleAuthor]);

  const { paginatedKindleBooks, kindleTotalPages } = useMemo(() => {
    const startIndex = (kindlePage - 1) * itemsPerPage;
    return {
      paginatedKindleBooks: filteredKindleBooks.slice(startIndex, startIndex + itemsPerPage),
      kindleTotalPages: Math.max(1, Math.ceil(filteredKindleBooks.length / itemsPerPage)),
    };
  }, [filteredKindleBooks, kindlePage, itemsPerPage]);
  
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
    deleteBooks,
  } = useBooks();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedTag, selectedAuthor, view]);

  useEffect(() => {
    setKindlePage(1);
  }, [kindleStatusFilter, selectedKindleTag, selectedKindleAuthor]);

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
              title: metadata.title || "Sin título",
              author: metadata.author || "Desconocido",
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
            toast.error(`No se pudo leer el EPUB: ${err}`);
          }
        } else {
          toast.error("Por favor arrastra un archivo .epub válido");
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
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedBooks.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedBooks, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);

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
    const ok = await deleteBook(id);
    if (ok) {
      toast.success("Libro eliminado");
    } else {
      toast.error("No se pudo eliminar el libro");
    }
    if (selectedBook?.id === id) {
      setSelectedBook(null);
    }
  };

  const handleKindleDelete = async (book: KindleBook) => {
    const ok = await kindle.removeBook(book.path);
    if (ok) {
      toast.success("Libro eliminado del Kindle");
    } else {
      toast.error("No se pudo eliminar el libro (¿archivo protegido o en uso?)");
    }
    if (ok && selectedKindleBook?.path === book.path) {
      setSelectedKindleBook(null);
    }
    return ok;
  };

  const handleEjectKindle = async () => {
    if (!kindle.connected) return;
    const confirmed = await ask(
      "¿Expulsar el Kindle de forma segura?\nPodrás desconectarlo por USB cuando termine.",
      { title: "Bukee", kind: "warning" },
    );
    if (!confirmed) return;
    setEjecting(true);
    try {
      const ok = await kindle.eject();
      if (ok) {
        toast.success("Kindle expulsado de forma segura");
      } else {
        toast.error("No se pudo expulsar el Kindle (¿está en uso?)");
      }
    } finally {
      setEjecting(false);
    }
  };

  const toggleLibrarySelect = (book: Book) => {
    setSelectedBookIds((prev) =>
      prev.includes(book.id)
        ? prev.filter((id) => id !== book.id)
        : [...prev, book.id],
    );
  };

  const toggleSelectAllLibrary = () => {
    const all = paginatedBooks.map((b) => b.id);
    setSelectedBookIds((prev) => {
      const uniqueAll = all.filter((id) => !prev.includes(id));
      return all.every((id) => prev.includes(id)) ? [] : [...prev, ...uniqueAll];
    });
  };

  const handleLibraryBulkDelete = async () => {
    const n = selectedBookIds.length;
    if (n === 0) return;
    const ok = await ask(
      `Estás seguro de eliminar ${n} ${n === 1 ? "libro" : "libros"} de tu biblioteca?\nEsta acción no se puede deshacer.`,
      { title: "Bukee", kind: "warning" },
    );
    if (!ok) return;

    const deletedIds = new Set(selectedBookIds);
    const okDelete = await deleteBooks(selectedBookIds);
    if (okDelete) {
      toast.success(n === 1 ? "Se eliminó 1 libro" : `Se eliminaron ${n} libros`);
    } else {
      toast.error("No se pudieron eliminar los libros seleccionados");
    }
    if (selectedBook && deletedIds.has(selectedBook.id)) {
      setSelectedBook(null);
    }
    setSelectedBookIds([]);
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
    const { removed, failed } = await kindle.removeBooks(selectedKindlePaths);
    const failedSet = new Set(failed);

    if (removed > 0) {
      toast.success(
        removed === 1
          ? "Se eliminó 1 libro del Kindle"
          : `Se eliminaron ${removed} libros del Kindle`,
      );
    }
    if (failedSet.size > 0) {
      toast.error(
        failedSet.size === 1
          ? "No se pudo eliminar 1 archivo (¿está protegido o en uso?)"
          : `No se pudieron eliminar ${failedSet.size} archivos`,
      );
    }

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
    let ok: boolean;
    if ("id" in data) {
      ok = await updateBook(data as Book);
      if (selectedBook?.id === data.id) {
        setSelectedBook(data as Book);
      }
    } else {
      ok = await addBook(data);
    }
    setIsFormOpen(false);
    if (ok) {
      toast.success("id" in data ? "Libro actualizado" : "Libro añadido");
    } else {
      toast.error("No se pudo guardar el libro");
    }
  };

  return (
    <main className="h-screen m-0 relative bg-background text-foreground">
      <DragDropOverlay isDragging={isDragging} />

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

      <StatsSheet
        open={statsOpen}
        onOpenChange={setStatsOpen}
        view={isKindleView ? "Kindle" : "Biblioteca"}
        tags={isKindleView ? kindle.kindleTags : tags}
        authors={isKindleView ? kindle.kindleAuthors : authors}
      />

      <div className="flex h-full flex-col transition-all duration-300">
        <header className="flex-none flex items-center gap-3 px-4 bg-card border-b">
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm"
          >
            <Plus className="w-4 h-4" />
            Añadir libro
          </button>

          <div className="ml-auto flex gap-2">
            <button
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
              Cuadrícula
            </button>
            <button
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => setView("list")}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              onClick={() => setStatsOpen(true)}
            >
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </button>
            <div className="w-px bg-border mx-1" />
            <ModeToggle />
          </div>

          {!isHomeView && (
            <input
              type="text"
              placeholder="Buscar..."
              className="ml-4 w-72 px-3 py-1.5 rounded-md text-sm bg-input border transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </header>

        <div className="flex flex-1 min-h-0">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          tags={isKindleView ? kindle.kindleTags : tags}
          authors={isKindleView ? kindle.kindleAuthors : authors}
          selectedTag={isKindleView ? selectedKindleTag : selectedTag}
          selectedAuthor={isKindleView ? selectedKindleAuthor : selectedAuthor}
          onSelectTag={(tag) => {
            if (isKindleView) setSelectedKindleTag(tag);
            else setSelectedTag(tag);
          }}
          onSelectAuthor={(author) => {
            if (isKindleView) setSelectedKindleAuthor(author);
            else setSelectedAuthor(author);
          }}
          kindleConnected={kindle.connected}
          kindleCount={kindle.books.length}
          libraryCount={books.length}
          activeView={mainView}
          onSelectHome={() => {
            setSearch("");
            setMainView("home");
          }}
          onSelectLibrary={() => {
            setSelectedTag(null);
            setSelectedAuthor(null);
            setMainView("library");
          }}
          onSelectKindle={() => {
            setSelectedBook(null);
            setSelectedKindleBook(null);
            setSelectedKindleTag(null);
            setSelectedKindleAuthor(null);
            setMainView("kindle");
          }}
        />

        <main className="relative flex flex-1 flex-col min-h-0 overflow-hidden">
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
                  <Select
                    value={kindleStatusFilter}
                    onValueChange={(v) => setKindleStatusFilter(v as KindleStatusFilter)}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="en_curso">En curso</SelectItem>
                      <SelectItem value="leido">Leídos</SelectItem>
                      <SelectItem value="sin_comenzar">Sin comenzar</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <button
                    onClick={handleEjectKindle}
                    disabled={ejecting}
                    className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border bg-background hover:bg-muted shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Expulsa el Kindle de forma segura antes de desconectarlo"
                  >
                    {ejecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Usb className="w-4 h-4" />
                    )}
                    {ejecting ? "Expulsando..." : "Expulsar"}
                  </button>
            </div>
          )}
          {!isHomeView && !isKindleView && (
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-card flex-none">
              <button
                onClick={() => {
                  setLibrarySelectionMode((v) => !v);
                  setSelectedBookIds([]);
                  setSelectedBook(null);
                }}
                className={`px-3 py-1.5 rounded-md text-sm border-2 transition-colors ${
                  librarySelectionMode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                }`}
              >
                {librarySelectionMode ? "Cancelar selección" : "Seleccionar"}
              </button>
              {librarySelectionMode && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedBookIds.length}{" "}
                    {selectedBookIds.length === 1
                      ? "libro seleccionado"
                      : "libros seleccionados"}
                  </span>
                  <button
                    onClick={toggleSelectAllLibrary}
                    className="px-3 py-1.5 rounded-md text-sm border-2 border-transparent text-muted-foreground hover:bg-muted/80"
                  >
                    {paginatedBooks.length > 0 &&
                    selectedBookIds.length === paginatedBooks.length
                      ? "Ninguno"
                      : "Todos"}
                  </button>
                  <button
                    onClick={handleLibraryBulkDelete}
                    disabled={selectedBookIds.length === 0}
                    className="px-3 py-1.5 rounded-md text-sm border border-destructive text-destructive hover:bg-destructive/10 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                  >
                    Eliminar seleccionados ({selectedBookIds.length})
                  </button>
                </>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-0" ref={contentRef}>
            {isHomeView ? (
              <Dashboard
                books={books}
                tags={tags}
                authors={authors}
                kindleBooks={kindle.books}
                onOpenBook={(b) => {
                  setSelectedBook(b);
                  setMainView("library");
                }}
                onSearch={(q) => {
                  setSearch(q);
                  setMainView("library");
                }}
              />
            ) : isKindleView ? (
              <>
                {kindle.loading && <BookGridSkeleton count={8} />}
                {kindle.error && (
                  <div className="p-6 text-destructive">
                    <p>No se pudo cargar el contenido del Kindle</p>
                    <p className="text-sm text-muted-foreground">{kindle.error}</p>
                  </div>
                )}
                {!kindle.loading &&
                  !kindle.error &&
                  filteredKindleBooks.length === 0 && (
                    <EmptyState
                      title="No hay libros que coincidan con este filtro"
                      hint={kindleStatusFilter === "todos" ? "Conecta un Kindle para ver tus libros" : "Prueba con otro filtro de estado"}
                    />
                  )}
                {!kindle.loading && !kindle.error && filteredKindleBooks.length > 0 && (
                  view === "grid" ? (
                    <KindleGrid
                      books={paginatedKindleBooks}
                      selected={selectedKindleBook}
                      onSelect={setSelectedKindleBook}
                      selectionMode={kindleSelectionMode}
                      selectedPaths={selectedKindlePaths}
                      onToggleSelect={toggleKindleSelect}
                      columns={gridColumns}
                    />
                  ) : (
                    <KindleList
                      books={paginatedKindleBooks}
                      selected={selectedKindleBook}
                      onSelect={setSelectedKindleBook}
                      selectionMode={kindleSelectionMode}
                      selectedPaths={selectedKindlePaths}
                      onToggleSelect={toggleKindleSelect}
                    />
                  )
                )}
              </>
            ) : (
              <>
                {loading && (
                  <div>
                    <BookGridSkeleton count={8} />
                  </div>
                )}
                {error && <p className="p-6 text-destructive">{error}</p>}
                {!loading && !error && books.length === 0 && (
                  <EmptyState
                    icon={<LucideLibrary className="w-10 h-10 text-muted-foreground/40" />}
                    title="Tu biblioteca está vacía"
                    hint="Añade tu primer libro con el botón «Añadir libro» o arrastrando un archivo EPUB a esta ventana."
                  />
                )}
                {!loading && !error && books.length > 0 && (
                  <AnimatePresence mode="wait">
                    {sortedBooks.length === 0 ? (
                      <EmptyState
                        key="no-results"
                        title="Sin resultados"
                        hint="No hay libros que coincidan con tu búsqueda o filtros actuales."
                      />
                    ) : view === "grid" ? (
                      <motion.div
                        key="grid"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <BookGrid
                          books={paginatedBooks}
                          onSelect={setSelectedBook}
                          selectionMode={librarySelectionMode}
                          selectedIds={selectedBookIds}
                          onToggleSelect={toggleLibrarySelect}
                          columns={gridColumns}
                        />
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
                          selectionMode={librarySelectionMode}
                          selectedIds={selectedBookIds}
                          onToggleSelect={toggleLibrarySelect}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </>
            )}
          </div>

          {!isHomeView && (!isKindleView ? (
             <Pagination 
               currentPage={currentPage}
               totalPages={totalPages}
               onPageChange={setCurrentPage}
               perPage={itemsPerPage}
             />
          ) : (
            filteredKindleBooks.length > itemsPerPage && (
              <Pagination
                currentPage={kindlePage}
                totalPages={kindleTotalPages}
                onPageChange={setKindlePage}
                perPage={itemsPerPage}
              />
            )
          ))}
        </main>
        </div>

        <div
          className="flex-none flex flex-col min-h-0 overflow-hidden"
          style={{ height: detailsPanel.collapsed ? 20 : detailsPanel.height }}
        >
          <PanelResizeHandle
            collapsed={detailsPanel.collapsed}
            onToggle={() => detailsPanel.setCollapsed((v) => !v)}
            onPointerDown={detailsPanel.onPointerDown}
          />
          <div className="flex-1 min-h-0">
            {isHomeView ? null : isKindleView ? (
              <KindleBookDetails
                book={selectedKindleBook}
                onDelete={handleKindleDelete}
                onSaveMeta={kindle.saveMeta}
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
        </div>
      </div>
    </main>
  );
}