export function Sidebar() {
  return (
    <aside className="border-r overflow-auto p-3 bg-background">
      <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
        Tags
      </h3>
      <ul className="list-none p-0 m-0 text-sm">
        <li className="px-2 py-1 rounded hover:bg-muted cursor-pointer">
          Ficción (23)
        </li>
        <li className="px-2 py-1 rounded hover:bg-muted cursor-pointer">
          Aventura (12)
        </li>
        <li className="px-2 py-1 rounded hover:bg-muted cursor-pointer">
          Ciencia ficción (8)
        </li>
      </ul>

      <h3 className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-2">
        Autores
      </h3>
      <ul className="list-none p-0 m-0 text-sm">
        <li className="px-2 py-1 rounded hover:bg-muted cursor-pointer">
          Isaac Asimov (5)
        </li>
        <li className="px-2 py-1 rounded hover:bg-muted cursor-pointer">
          J.K. Rowling (3)
        </li>
      </ul>
    </aside>
  );
}