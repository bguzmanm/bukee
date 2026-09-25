import { KindleBook } from "@/types";
import { BookOpen, X } from "lucide-react";
import { formatFileSize, KindleStatusBadge } from "./KindleGrid";
import { ask } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  onSaveMeta?: (path: string, tags: string[], author: string | null) => Promise<void>;
}

export function KindleBookDetails({ book, onDelete, onSaveMeta }: KindleBookDetailsProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [authorDraft, setAuthorDraft] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAuthorDraft(book?.author ?? "");
    setTagInput("");
    setTags(book?.tags ?? []);
  }, [book?.path]);

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

  function addTag() {
    const value = tagInput.trim();
    if (!value) return;
    if (!tags.includes(value)) setTags([...tags, value]);
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  async function handleSaveMeta() {
    if (!book || !onSaveMeta) return;
    setSaving(true);
    try {
      const author = authorDraft.trim();
      await onSaveMeta(book.path, tags, author || null);
      toast.success("Metadatos del Kindle actualizados");
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron guardar los metadatos");
    } finally {
      setSaving(false);
    }
  }

  if (!book) {
    return (
      <section className="col-span-2 h-full border-t bg-background/50 backdrop-blur-sm overflow-hidden relative flex items-center justify-center">
        <p className="text-muted-foreground">
          Selecciona un libro del Kindle para ver su información
        </p>
      </section>
    );
  }

  return (
    <section className="col-span-2 h-full border-t bg-background/50 backdrop-blur-sm overflow-hidden relative">
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
        <div className="flex-1 min-w-0 overflow-y-auto space-y-2">
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
            <span className="font-semibold">Formato:</span> {book.format}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Tamaño:</span>{" "}
            {formatFileSize(book.size)}
          </p>
          <p className="text-sm flex items-center gap-2">
            <span className="font-semibold">Lectura:</span>
            <KindleStatusBadge status={book.status} />
            {book.status !== "sin_comenzar" && book.progress ? (
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
          <p className="text-sm truncate" title={book.path}>
            <span className="font-semibold">Ruta:</span> {book.path}
          </p>

          <div className="border-t pt-3 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Autor
              </span>
              <input
                type="text"
                value={authorDraft}
                onChange={(e) => setAuthorDraft(e.target.value)}
                placeholder="Corregir autor (dejar vacío usa el del dispositivo)"
                className="mt-1 w-full px-3 py-1.5 rounded-md text-sm bg-input border"
              />
            </label>

            <div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Etiquetas
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Sin etiquetas
                  </span>
                )}
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-xs"
                  >
                    {tag}
                    <button
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Quitar etiqueta ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Añadir etiqueta (Enter para añadir)"
                  className="flex-1 px-3 py-1.5 rounded-md text-sm bg-input border"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-1.5 rounded-md text-sm border bg-background hover:bg-muted shadow-sm"
                >
                  Añadir
                </button>
              </div>
            </div>

            {onSaveMeta && (
              <button
                onClick={handleSaveMeta}
                disabled={saving}
                className="px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </section>
  );
}