import {Book} from "@/types";
import {motion, AnimatePresence} from "framer-motion";
import { BookOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface BookGridProps {
  books: Book[];
  onSelect: (book: Book) => void;
  selectionMode?: boolean;
  selectedIds?: number[];
  onToggleSelect?: (book: Book) => void;
  columns?: number;
}

export function BookGrid({books, onSelect, selectionMode = false, selectedIds = [], onToggleSelect, columns}: BookGridProps) {
  return (
    <div>
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
          {books.map((book, index) => (
              <motion.div
                key={book.id ? book.id.toString() : `book-${index}`}
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
                className={`cursor-pointer text-left rounded-xl shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 overflow-hidden border bg-card ${
                  selectionMode && selectedIds.includes(book.id)
                    ? "border-primary ring-2 ring-primary"
                    : "border-border"
                }`}
              onClick={() => {
                if (selectionMode && onToggleSelect) {
                  onToggleSelect(book);
                } else {
                  onSelect(book);
                }
              }}
              title={book.title}
            >
              <div className="w-full h-60 bg-muted relative overflow-hidden">
                {book.cover ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
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
                      checked={selectedIds.includes(book.id)}
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
              <p className="text-xs text-muted-foreground mx-4 mb-3 truncate">
                {book.author}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
    ;
}