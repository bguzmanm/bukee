import { Book } from "@/types";

interface BookGridProps {
  books: Book[];
  onSelect: (book: Book) => void;
}

export function BookGrid({ books, onSelect }: BookGridProps) {
  return (
    <div
      className="p-6 grid gap-4"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      }}
    >
      {books.map((book) => (
        <button
          key={book.id}
          className="text-left rounded-xl shadow-md hover:shadow-lg transition-shadow transform hover:-translate-y-1 overflow-hidden border bg-card"
          onClick={() => onSelect(book)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-60 object-cover"
          />
          <h4 className="text-sm font-semibold mt-3 mx-4 mb-1 truncate">
            {book.title}
          </h4>
          <p className="text-xs text-muted-foreground mx-4 mb-3 truncate">
            {book.author}
          </p>
        </button>
      ))}
    </div>
  );
}