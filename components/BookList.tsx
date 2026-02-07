import { Book } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface BookListProps {
  books: Book[];
  onSelect: (book: Book) => void;
}

export function BookList({ books, onSelect }: BookListProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
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
            Rating
          </th>
          <th className="bg-muted text-muted-foreground font-semibold text-xs uppercase px-4 py-3 text-left">
            Tags
          </th>
        </tr>
      </thead>
      <motion.tbody layout>
        <AnimatePresence>
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
                {"★".repeat(book.rating)}
                {"☆".repeat(5 - book.rating)}
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