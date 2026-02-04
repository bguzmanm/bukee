import { Book } from "@/types";

interface BookDetailsProps {
  book: Book | null;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
}

export function BookDetails({ book, onEdit, onDelete }: BookDetailsProps) {
  if (!book) {
    return (
      <section className="col-span-2 flex items-center justify-center border-t">
        <p className="text-muted-foreground">Selecciona un libro para ver sus detalles</p>
      </section>
    );
  }

  return (
    <section className="col-span-2 flex border-t relative group">
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(book)}
          className="px-3 py-1 text-xs rounded border bg-background hover:bg-muted"
        >
          Edit
        </button>
        <button
          onClick={() => {
            if (confirm("Are you sure you want to delete this book?")) {
              onDelete(book.id);
            }
          }}
          className="px-3 py-1 text-xs rounded border border-destructive text-destructive hover:bg-destructive/10"
        >
          Delete
        </button>
      </div>

      <div className="flex-none w-64 p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={book.cover || "/placeholder.png"}
          alt={book.title}
          className="w-44 h-64 object-cover rounded-md shadow-md bg-muted"
        />
      </div>
      <div className="flex-1 p-5">
        <h1 className="text-xl font-semibold mb-2">{book.title}</h1>
        <p className="text-sm mb-2">
          <span className="font-semibold">Autor:</span> {book.author}
        </p>
        <p className="text-sm mb-2">
          <span className="font-semibold">Rating:</span>{" "}
          {"★".repeat(book.rating)}
          {"☆".repeat(5 - book.rating)}
        </p>
        <p className="text-sm mb-2">
          <span className="font-semibold">Tags:</span> {book.tags.join(", ")}
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          Comentarios: aquí irían notas, sinopsis, etc.
        </p>
      </div>
    </section>
  );
}