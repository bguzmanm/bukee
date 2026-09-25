import { KindleBook } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { KindleStatusBadge, formatFileSize } from "./KindleGrid";

interface KindleListProps {
  books: KindleBook[];
  selected: KindleBook | null;
  onSelect: (book: KindleBook) => void;
  selectionMode?: boolean;
  selectedPaths?: string[];
  onToggleSelect?: (book: KindleBook) => void;
}

export function KindleList({
  books,
  selected,
  onSelect,
  selectionMode = false,
  selectedPaths = [],
  onToggleSelect,
}: KindleListProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          {selectionMode && (
            <th className="bg-muted text-muted-foreground font-semibold text-xs uppercase px-4 py-3 text-left w-12">
              Selección
            </th>
          )}
          <th className="bg-muted text-muted-foreground font-semibold text-xs uppercase px-4 py-3 text-left">
            Portada
          </th>
          <th className="bg-muted text-muted-foreground font-semibold text-xs uppercase px-4 py-3 text-left">
            Título
          </th>
          <th className="bg-muted text-muted-foreground font-semibold text-xs uppercase px-4 py-3 text-left">
            Autor
          </th>
          <th className="bg-muted text-muted-foreground font-semibold text-xs uppercase px-4 py-3 text-left">
            Formato · Tamaño
          </th>
          <th className="bg-muted text-muted-foreground font-semibold text-xs uppercase px-4 py-3 text-left">
            Lectura
          </th>
        </tr>
      </thead>
      <motion.tbody layout>
        <AnimatePresence mode="popLayout">
          {books.map((book, index) => {
            const isSelected =
              selectionMode && selectedPaths.includes(book.path);
            return (
              <motion.tr
                key={book.path ? `${book.path}-${index}` : `kindle-${index}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-0 ${
                  selected?.path === book.path ? "bg-primary/5" : ""
                }`}
                onClick={() => {
                  if (selectionMode && onToggleSelect) {
                    onToggleSelect(book);
                  } else {
                    onSelect(book);
                  }
                }}
              >
                {selectionMode && (
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect?.(book)}
                      aria-label={book.title}
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  {book.cover ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-[50px] h-[70px] rounded-md object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-[50px] h-[70px] rounded-md bg-muted flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium" title={book.title}>
                  {book.title}
                </td>
                <td className="px-4 py-3" title={book.author || "—"}>
                  {book.author || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {book.format} · {formatFileSize(book.size)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <KindleStatusBadge status={book.status} />
                    {book.status !== "sin_comenzar" &&
                    typeof book.progress === "number" ? (
                      <div
                        className="h-1 flex-1 rounded-full bg-muted overflow-hidden"
                        title={`Progreso aprox. ${book.progress}%`}
                      >
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(Math.max(book.progress, 2), 100)}%`,
                          }}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground flex-1">
                        —
                      </span>
                    )}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </AnimatePresence>
      </motion.tbody>
    </table>
  );
}