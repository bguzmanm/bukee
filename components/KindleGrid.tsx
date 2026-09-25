import { KindleBook } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Circle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

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

export function KindleStatusBadge({ status }: { status?: KindleBook["status"] }) {
  const s = status ?? "sin_comenzar";
  return (
    <Badge
      variant={s === "en_curso" ? "default" : "secondary"}
      className={`gap-1.5 ${s === "en_curso" ? "" : "text-muted-foreground"}`}
      title={`Leyendo: ${STATUS_LABELS[s]}`}
    >
      <Circle className={`w-2 h-2 ${s === "en_curso" ? "fill-current" : "fill-current opacity-60"}`} />
      {STATUS_LABELS[s]}
    </Badge>
  );
}

interface KindleGridProps {
  books: KindleBook[];
  selected: KindleBook | null;
  onSelect: (book: KindleBook) => void;
  selectionMode?: boolean;
  selectedPaths?: string[];
  onToggleSelect?: (book: KindleBook) => void;
  columns?: number;
}

export function KindleGrid({
  books,
  selected,
  onSelect,
  selectionMode = false,
  selectedPaths = [],
  onToggleSelect,
  columns,
}: KindleGridProps) {
  if (books.length === 0) {
    return <p className="p-6 text-muted-foreground">No hay libros en el Kindle</p>;
  }

  return (
    <motion.div
      layout
      className="p-6 grid gap-4"
      style={{
        gridTemplateColumns: columns
          ? `repeat(${columns}, minmax(0, 1fr))`
          : "repeat(auto-fill, minmax(180px, 1fr))",
      }}
    >
      <AnimatePresence>
        {books.map((book, index) => {
          const isSelected = selectionMode && selectedPaths.includes(book.path);
          return (
            <motion.div
              key={book.path ? `${book.path}-${index}` : `kindle-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (selectionMode && onToggleSelect) {
                    onToggleSelect(book);
                  } else {
                    onSelect(book);
                  }
                }
              }}
              onClick={() => {
                if (selectionMode && onToggleSelect) {
                  onToggleSelect(book);
                } else {
                  onSelect(book);
                }
              }}
              className={`cursor-pointer text-left rounded-xl shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 overflow-hidden border bg-card ${
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
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect?.(book)}
                      aria-label={book.title}
                      className="bg-background/80 backdrop-blur-sm"
                    />
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
              {book.status !== "sin_comenzar" && typeof book.progress === "number" ? (
                <div className="mx-4 mb-3 h-1 rounded-full bg-muted overflow-hidden" title={`Progreso aprox. ${book.progress}%`}>
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(Math.max(book.progress, 2), 100)}%` }}
                  />
                </div>
              ) : (
                <div className="mb-3" />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}