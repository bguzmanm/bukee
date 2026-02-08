import { Book, SortConfig } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface BookListProps {
  books: Book[];
  onSelect: (book: Book) => void;
  sortConfig: SortConfig | null;
  onSort: (key: keyof Book) => void;
}

export function BookList({ books, onSelect, sortConfig, onSort }: BookListProps) {
  
  const getSortIcon = (key: keyof Book) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="w-3 h-3 ml-2 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-2 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-2 text-primary" />
    );
  };

  const renderHeader = (label: string, key?: keyof Book) => {
    if (!key) {
      return (
        <th className="bg-muted text-muted-foreground font-semibold text-xs uppercase px-4 py-3 text-left">
          {label}
        </th>
      );
    }

    return (
      <th 
        className="bg-muted text-muted-foreground font-semibold text-xs uppercase px-4 py-3 text-left cursor-pointer hover:bg-muted/80 transition-colors select-none"
        onClick={() => onSort(key)}
      >
        <div className="flex items-center">
          {label}
          {getSortIcon(key)}
        </div>
      </th>
    );
  };

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          {/* No sorting for cover image */}
          {renderHeader("Portada")}
          {renderHeader("Título", "title")}
          {renderHeader("Autor", "author")}
          {renderHeader("Rating", "rating")}
          {renderHeader("Tags", "tags")}
        </tr>
      </thead>
      <motion.tbody layout>
        <AnimatePresence mode="popLayout">
          {books.map((book, index) => (
            <motion.tr
              key={book.id ? book.id.toString() : `book-${index}`}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-0"
              onClick={() => onSelect(book)}
            >
              <td className="px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-[50px] h-[70px] rounded-md object-cover"
                />
              </td>
              <td className="px-4 py-3 font-medium">{book.title}</td>
              <td className="px-4 py-3">{book.author}</td>
              <td className="px-4 py-3">
                <span className="flex">
                  {"★".repeat(book.rating)}
                  <span className="text-muted-foreground/30">
                    {"☆".repeat(5 - book.rating)}
                  </span>
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {book.tags.join(", ")}
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </motion.tbody>
    </table>
  );
}