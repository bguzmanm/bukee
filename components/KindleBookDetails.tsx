import { KindleBook } from "@/types";
import { BookOpen } from "lucide-react";
import { formatFileSize, KindleStatusBadge } from "./KindleGrid";
import { ask } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

function formatLastRead(ts?: number | null): string | null {
  if (!ts) return null;
  return new Date(ts * 1000).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface KindleBookDetailsProps {
  book: KindleBook | null;
  onDelete?: (book: KindleBook) => Promise<boolean>;
}

export function KindleBookDetails({ book, onDelete }: KindleBookDetailsProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!book || !onDelete) return;
    if (
      !(await ask(
        `Estás seguro de eliminar "${book.title}" del Kindle?\nSe borrará el archivo y su carpeta de datos (.sdr).`,
        { title: "Bukee", kind: "warning" },
      ))
    ) {
      return;
    }
    setDeleting(true);
    setError("");
    const ok = await onDelete(book);
    setDeleting(false);
    if (!ok) setError("No se pudo eliminar el libro del Kindle");
  }

  if (!book) {
    return (
      <section className="col-span-2 border-t bg-background/50 backdrop-blur-sm overflow-hidden relative flex items-center justify-center">
        <p className="text-muted-foreground">
          Selecciona un libro del Kindle para ver su información
        </p>
      </section>
    );
  }

  return (
    <section className="col-span-2 border-t bg-background/50 backdrop-blur-sm overflow-hidden relative">
      <div className="flex h-full p-5 gap-5">
        <div className="flex-none w-44 h-56 bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {book.cover ? (
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <BookOpen className="w-16 h-16 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold mb-2">{book.title}</h2>
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-none px-3 py-1 text-xs rounded border border-destructive text-destructive hover:bg-destructive/10 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Eliminando..." : "Eliminar del Kindle"}
              </button>
            )}
          </div>
          <p className="text-sm">
            <span className="font-semibold">Autor:</span> {book.author || "—"}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Formato:</span> {book.format}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Tamaño:</span>{" "}
            {formatFileSize(book.size)}
          </p>
          <p className="text-sm flex items-center gap-2">
            <span className="font-semibold">Lectura:</span>
            <KindleStatusBadge status={book.status} />
            {book.progress ? (
              <span className="text-muted-foreground">
                · Aprox. {book.progress}%{book.position ? ` · Posición ${book.position}` : ""}
              </span>
            ) : null}
          </p>
          {formatLastRead(book.last_read) && (
            <p className="text-sm text-muted-foreground">
              Última lectura: {formatLastRead(book.last_read)}
            </p>
          )}
          <p className="text-sm truncate">
            <span className="font-semibold">Ruta:</span> {book.path}
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </section>
  );
}