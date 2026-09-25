import { KindleBook } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Check, Circle } from "lucide-react";

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

const STATUS_LABELS: Record<NonNullable<KindleBook["status"]>, string> = {
  en_curso: "En curso",
  leido: "Leído",
  sin_comenzar: "Sin comenzar",
};

const STATUS_COLORS: Record<NonNullable<KindleBook["status"]>, string> = {
  en_curso: "text-green-500",
  leido: "text-muted-foreground",
  sin_comenzar: "text-muted-foreground/70",
};

export function KindleStatusBadge({ status }: { status?: KindleBook["status"] }) {
  const s = status ?? "sin_comenzar";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${STATUS_COLORS[s]} ${
        s === "en_curso" ? "font-medium" : ""
      }`}
      title={`Leyendo: ${STATUS_LABELS[s]}`}
    >
      <Circle
        className={`w-2 h-2 ${s === "en_curso" ? "fill-green-500" : "fill-current opacity-60"}`}
      />
      {STATUS_LABELS[s]}
    </span>
  );
}

interface KindleGridProps {
  books: KindleBook[];
  selected: KindleBook | null;
  onSelect: (book: KindleBook) => void;
  selectionMode?: boolean;
  selectedPaths?: string[];
  onToggleSelect?: (book: KindleBook) => void;
}

export function KindleGrid({
  books,
  selected,
  onSelect,
  selectionMode = false,
  selectedPaths = [],
  onToggleSelect,
}: KindleGridProps) {
  if (books.length === 0) {
    return <p className="p-6 text-muted-foreground">No hay libros en el Kindle</p>;
  }

  return (
    <motion.div
      layout
      className="p-6 grid gap-4"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      }}
    >
      <AnimatePresence>
        {books.map((book, index) => {
          const isSelected = selectionMode && selectedPaths.includes(book.path);
          return (
            <motion.button
              key={book.path ? `${book.path}-${index}` : `kindle-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (selectionMode && onToggleSelect) {
                  onToggleSelect(book);
                } else {
                  onSelect(book);
                }
              }}
              className={`text-left rounded-xl shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 overflow-hidden border bg-card ${
                selectionMode && isSelected
                  ? "border-primary ring-2 ring-primary"
                  : selected?.path === book.path
                    ? "border-primary ring-1 ring-primary"
                    : "border-border"
              }`}
            >
              <div className="w-full h-60 bg-muted relative overflow-hidden">
                {book.cover ? (
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                {selectionMode && (
                  <div
                    className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center backdrop-blur-sm transition-colors ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "bg-background/70 border-muted-foreground/50"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                )}
              </div>
              <h4 className="text-sm font-semibold mt-3 mx-4 mb-1 truncate">
                {book.title}
              </h4>
              <p className="text-xs text-muted-foreground mx-4 mb-1 truncate">
                {book.author || "—"}
              </p>
              <p className="text-xs text-muted-foreground mx-4 mb-1 flex items-center justify-between gap-2">
                <span>
                  {book.format} · {formatFileSize(book.size)}
                </span>
                <KindleStatusBadge status={book.status} />
              </p>
              {typeof book.progress === "number" ? (
                <div className="mx-4 mb-3 h-1 rounded-full bg-muted overflow-hidden" title={`Progreso aprox. ${book.progress}%`}>
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(Math.max(book.progress, 2), 100)}%` }}
                  />
                </div>
              ) : (
                <div className="mb-3" />
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}