import {Book}from "@/types";
import {motion, AnimatePresence} from "framer-motion";
import { ask } from '@tauri-apps/plugin-dialog';


interface BookDetailsProps {
  book: Book | null;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
}

export function BookDetails({book, onEdit, onDelete}: BookDetailsProps) {
  return (
    <section className="col-span-2 border-t bg-background/50 backdrop-blur-sm overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!book ? (
          <motion.div
            key="empty"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
            className="h-full flex items-center justify-center"
          >
            <p className="text-muted-foreground">
              Selecciona un libro para ver sus detalles
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={book.id}
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -20}}
            transition={{duration: 0.3, ease: "easeOut"}}
            className="flex h-full relative group"
          >
            {/* Action Buttons */}
            <div
              className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={() => onEdit(book)}
                className="px-3 py-1 text-xs rounded border bg-background hover:bg-muted shadow-sm"
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  if (await ask("Estás seguro de eliminar este libro?", { title: 'Bukee', kind: 'warning'})) {
                    onDelete(book.id);
                  }
                }}
                className="px-3 py-1 text-xs rounded border border-destructive text-destructive hover:bg-destructive/10 shadow-sm"
              >
                Delete
              </button>
            </div>

            {/* Cover Image */}
            <div className="flex-none w-64 p-5 flex items-center justify-center">
              <motion.img
                layoutId={`cover-${book.id}`} // Optional: Shared layout animation if we linked it to the grid
                src={book.cover || "/placeholder.png"}
                alt={book.title}
                className="w-44 h-64 object-cover rounded-md shadow-md bg-muted"
                initial={{scale: 0.9, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                transition={{delay: 0.1, duration: 0.3}}
              />
            </div>

            {/* Text Content */}
            <div className="flex-1 p-5 overflow-auto">
              <motion.h1
                className="text-xl font-semibold mb-2"
                initial={{opacity: 0, x: -10}}
                animate={{opacity: 1, x: 0}}
                transition={{delay: 0.1}}
              >
                {book.title}
              </motion.h1>

              <motion.div
                className="space-y-2"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{delay: 0.2}}
              >
                <p className="text-sm">
                  <span className="font-semibold">ISBN:</span> {book.identifier}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Autor:</span> {book.author}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Rating:</span>{" "}
                  <span className="text-yellow-500">
                    {"★".repeat(book.rating)}
                  </span>
                  <span className="text-muted-foreground/30">
                    {"☆".repeat(5 - book.rating)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Tags:</span>{" "}
                  {book.tags.map((tag, i) => (
                    <span key={i}
                          className="inline-block bg-muted px-2 py-0.5 rounded-full text-xs mr-1">
                      {tag}
                    </span>
                  ))}
                </p>
                <p className="text-sm">
                  <a href={book.path} className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md text-sm">
                    <span className="font-semibold">Descargar</span>
                  </a>
                </p>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  {book.description}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}