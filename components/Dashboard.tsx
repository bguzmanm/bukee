"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  BookOpenCheck,
  Clock,
  LibraryBig,
  Search,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import type { Book, KindleBook } from "@/types";

interface DashboardProps {
  books: Book[];
  tags: Record<string, number>;
  authors: Record<string, number>;
  kindleBooks: KindleBook[];
  onOpenBook: (b: Book) => void;
  onSearch: (query: string) => void;
}

function CoverThumb({ title, src }: { title: string; src?: string | null }) {
  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={src} alt={title} className="h-full w-full object-cover" draggable={false} />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground/60">
      <BookOpen className="h-5 w-5" />
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

export function Dashboard({
  books,
  tags,
  authors,
  kindleBooks,
  onOpenBook,
  onSearch,
}: DashboardProps) {
  const [query, setQuery] = useState("");

  const now = new Date();
  const hour = now.getHours();
  const saludo =
    hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  const fecha = new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(now);

  const destacados = useMemo(
    () => [...books].sort((a, b) => b.rating - a.rating).slice(0, 5),
    [books],
  );

  const ultimos = useMemo(
    () => [...books].sort((a, b) => b.id - a.id).slice(0, 6),
    [books],
  );

  const enCurso = useMemo(
    () =>
      kindleBooks
        .filter((b) => b.status === "en_curso")
        .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0)),
    [kindleBooks],
  );

  const metrics = [
    { label: "Títulos", value: books.length, icon: <LibraryBig className="h-5 w-5" /> },
    { label: "Autores", value: Object.keys(authors).length, icon: <User className="h-5 w-5" /> },
    { label: "Etiquetas", value: Object.keys(tags).length, icon: <Tag className="h-5 w-5" /> },
    { label: "En curso", value: enCurso.length, icon: <BookOpenCheck className="h-5 w-5" /> },
  ];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <motion.header {...fade} transition={{ duration: 0.35 }}>
          <h1 className="font-serif text-3xl font-semibold">{saludo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{fecha}</p>
        </motion.header>

        <motion.form
          {...fade}
          transition={{ delay: 0.06, duration: 0.35 }}
          onSubmit={submitSearch}
          className="flex items-center gap-2 rounded-xl border bg-card p-1.5 shadow-sm"
        >
          <Search className="ml-2 h-5 w-5 flex-shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en tu biblioteca y Entrar para ir a la lista…"
            className="w-full bg-transparent py-1.5 text-sm outline-none"
          />
          <button
            type="submit"
            className="flex-shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Buscar
          </button>
        </motion.form>

        <motion.div
          {...fade}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold">{m.value}</span>
                <span className="text-muted-foreground">{m.icon}</span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {m.label}
              </p>
            </div>
          ))}
        </motion.div>

        {destacados.length > 0 && (
          <motion.section {...fade} transition={{ delay: 0.18, duration: 0.35 }}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Destacados
            </h2>
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-5">
              {destacados.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onOpenBook(b)}
                  className="group text-left"
                >
                  <div className="aspect-[2/3] w-full overflow-hidden rounded-md border shadow-sm transition-transform group-hover:-translate-y-1">
                    <CoverThumb title={b.title} src={b.cover} />
                  </div>
                  <p className="mt-1.5 truncate text-xs font-medium">{b.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {b.author}
                  </p>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {ultimos.length > 0 && (
          <motion.section {...fade} transition={{ delay: 0.24, duration: 0.35 }}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Clock className="h-4 w-4" />
              Últimos libros
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {ultimos.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onOpenBook(b)}
                  className="flex w-full items-center gap-3 rounded-lg border bg-card p-2 text-left shadow-sm transition-colors hover:bg-muted/60"
                >
                  <div className="h-14 w-10 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                    <CoverThumb title={b.title} src={b.cover} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.author}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {enCurso.length > 0 && (
          <motion.section {...fade} transition={{ delay: 0.3, duration: 0.35 }}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <BookOpenCheck className="h-4 w-4" />
              En curso en el Kindle
            </h2>
            <div className="space-y-2">
              {enCurso.slice(0, 5).map((b) => (
                <div
                  key={b.path}
                  className="flex items-center gap-3 rounded-lg border bg-card p-2.5 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.author}
                    </p>
                  </div>
                  {typeof b.progress === "number" && (
                    <div className="h-1.5 w-24 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${b.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}