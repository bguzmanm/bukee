"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { useState, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";

type Book = {
  id: number;
  title: string;
  author: string;
  cover: string;
  tags: string[];
  rating: number;
  path: string;
};

export default function Home() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const initDb = async () => {
      try {
        const db = await Database.load("sqlite:bukee.db");
        // Insert mock data if empty (optional, for testing)
        const count: any[] = await db.select("SELECT COUNT(*) as count FROM books");
        if (count[0].count === 0) {
           await db.execute("INSERT INTO books (title, author, cover, tags, rating, path) VALUES ($1, $2, $3, $4, $5, $6)", ["Fundación", "Isaac Asimov", "/covers/fundacion.jpg", "sci-fi,clásico", 5, '/books/fundacion.epub']);
           await db.execute("INSERT INTO books (title, author, cover, tags, rating, path) VALUES ($1, $2, $3, $4, $5, $6)", ["Harry Potter y la piedra filosofal", "J.K. Rowling", "/covers/hp1.jpg", "fantasía", 4, '/books/hp1.epub']);
           await db.execute("INSERT INTO books (title, author, cover, tags, rating, path) VALUES ($1, $2, $3, $4, $5, $6)", ["Proyecto Hail Mary", "Andy Weir", "/covers/hail-mary.jpg", "sci-fi", 4, "/books/hail-mary.epub"]);
        }

        const result: any[] = await db.select("SELECT title, author, cover, tags, rating, path FROM books");
        const loadedBooks = result.map((row) => ({
            ...row,
            tags: row.tags ? row.tags.split(",") : []
        }));
        setBooks(loadedBooks);
        if (loadedBooks.length > 0) {
            setSelectedBook(loadedBooks[0]);
        }
      } catch (error) {
        console.error("Failed to load database:", error);
      }
    };
    initDb();
  }, []);

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <main className="h-screen m-0 relative px-4 py-8 pl-4 pr-20 bg-background text-foreground">
      {/* Top-right theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      <div
        className="grid h-full"
        style={{
          gridTemplateColumns: "250px 1fr",
          gridTemplateRows: "60px 1fr 260px",
        }}
      >
        {/* Main card */}
        {/*<div className="w-full  bg-card rounded-2xl shadow-lg p-8 space-y-8">*/}
        {/* Header */}

        <div className="col-span-3 flex items-center gap-3 px-4 bg-neutral-900 text-white relative">
          <div className="flex items-center gap-2">
            <button className="bg-neutral-700 hover:bg-neutral-600 border-none px-3 py-1.5 rounded-md text-sm">
              Add books
            </button>
            <button className="bg-neutral-700 hover:bg-neutral-600 border-none px-3 py-1.5 rounded-md text-sm">
              Edit
            </button>
          </div>

          {/* Toggle vista */}
          <div className="ml-auto flex gap-2">
            <button
              className={`px-3 py-1.5 rounded-full text-sm border-2 ${
                view === "grid"
                  ? "bg-blue-500 border-blue-500"
                  : "bg-neutral-100 text-neutral-800 border-transparent"
              }`}
              onClick={() => setView("grid")}
            >
              Grid
            </button>
            <button
              className={`px-3 py-1.5 rounded-full text-sm border-2 ${
                view === "list"
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-neutral-100 text-neutral-800 border-transparent"
              }`}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>

          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar..."
            className="ml-4 w-72 px-3 py-1.5 rounded-md text-sm text-neutral-900 border border-neutral-400 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Nav izquierdo */}
        <aside className="border-r overflow-auto p-3">
          <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-2">
            Tags
          </h3>
          <ul className="list-none p-0 m-0 text-sm">
            <li className="px-2 py-1 rounded hover:bg-neutral-100 cursor-pointer">
              Ficción (23)
            </li>
            <li className="px-2 py-1 rounded hover:bg-neutral-100 cursor-pointer">
              Aventura (12)
            </li>
            <li className="px-2 py-1 rounded hover:bg-neutral-100 cursor-pointer">
              Ciencia ficción (8)
            </li>
          </ul>

          <h3 className="text-xs font-semibold uppercase text-neutral-500 mt-4 mb-2">
            Autores
          </h3>
          <ul className="list-none p-0 m-0 text-sm">
            <li className="px-2 py-1 rounded hover:bg-neutral-100 cursor-pointer">
              Isaac Asimov (5)
            </li>
            <li className="px-2 py-1 rounded hover:bg-neutral-100 cursor-pointer">
              J.K. Rowling (3)
            </li>
          </ul>
        </aside>

        {/* Vista central: Grid + List */}
        <main className="overflow-auto">
          {/* Grid */}
          <div
            className={`p-6 grid gap-4 ${view === "grid" ? "grid" : "hidden"}`}
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            }}
          >
            {filtered.map((book) => (
              <button
                key={book.id}
                className="text-left rounded-xl shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 overflow-hidden border "
                onClick={() => setSelectedBook(book)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-60 object-cover"
                />
                <h4 className="text-sm font-semibold mt-3 mx-4 mb-1">
                  {book.title}
                </h4>
                <p className="text-xs text-neutral-500 mx-4 mb-3">
                  {book.author}
                </p>
              </button>
            ))}
          </div>

          {/* List */}
          <div className={view === "list" ? "block" : "hidden"}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-neutral-50 text-neutral-500 font-semibold text-xs uppercase px-4 py-3 text-left">
                    Portada
                  </th>
                  <th className="bg-neutral-50 text-neutral-500 font-semibold text-xs uppercase px-4 py-3 text-left">
                    Título
                  </th>
                  <th className="bg-neutral-50 text-neutral-500 font-semibold text-xs uppercase px-4 py-3 text-left">
                    Autor
                  </th>
                  <th className="bg-neutral-50 text-neutral-500 font-semibold text-xs uppercase px-4 py-3 text-left">
                    Rating
                  </th>
                  <th className="bg-neutral-50 text-neutral-500 font-semibold text-xs uppercase px-4 py-3 text-left">
                    Tags
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-neutral-50 cursor-pointer hover:text-black"
                    onClick={() => setSelectedBook(book)}
                  >
                    <td className="px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-[50px] h-[70px] rounded-md object-cover"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {book.title}
                    </td>
                    <td className="px-4 py-3">
                      {book.author}
                    </td>
                    <td className="px-4 py-3">
                      {"★".repeat(book.rating)}
                      {"☆".repeat(5 - book.rating)}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {book.tags.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        {/* Panel detalles inferior */}
        <section className="col-span-2 flex border-t">
          {selectedBook && (
            <>
              <div className="flex-none w-64 p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedBook.cover}
                  alt={selectedBook.title}
                  className="w-44 h-64 object-cover rounded-md shadow-md"
                />
              </div>
              <div className="flex-1 p-5">
                <h1 className="text-xl font-semibold mb-2">
                  {selectedBook.title}
                </h1>
                <p className="text-sm mb-2">
                  <span className="font-semibold">Autor:</span>{" "}
                  {selectedBook.author}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-semibold">Rating:</span>{" "}
                  {"★".repeat(selectedBook.rating)}
                  {"☆".repeat(5 - selectedBook.rating)}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-semibold">Tags:</span>{" "}
                  {selectedBook.tags.join(", ")}
                </p>
                <p className="text-sm mb-2">
                  <a className="font-semibold" href={selectedBook.path} target="_blank" rel="noreferrer">EPUB</a>
                </p>
                <p className="text-sm text-neutral-600 mt-3">
                  Comentarios: aquí irían notas, sinopsis, etc.
                </p>
              </div>
            </>
          )}
        </section>

        {/* Footer / Docs */}
        {/*<footer className="text-center pt-4 border-t border-border">
          <a
            href="https://github.com/nomandhoni-cs/tauri-nextjs-shadcn-boilerplate"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition"
          >
            <BookOpen className="w-4 h-4 mr-1" />
            Read the Docs
            <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </footer>*/}
      </div>
    </main>
  );
}