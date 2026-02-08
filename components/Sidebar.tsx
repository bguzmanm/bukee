import { ChevronLeft, Tag, User, Library } from "lucide-react";
import { SidebarTooltip } from "./SidebarTooltip";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  tags: Record<string, number>;
  authors: Record<string, number>;
  selectedTag: string | null;
  selectedAuthor: string | null;
  onSelectTag: (tag: string | null) => void;
  onSelectAuthor: (author: string | null) => void;
}

export function Sidebar({ 
  isCollapsed, 
  onToggle, 
  tags, 
  authors,
  selectedTag, 
  selectedAuthor,
  onSelectTag,
  onSelectAuthor
}: SidebarProps) {
  
  const handleSelectTag = (tag: string | null) => {
    onSelectTag(tag);
    onSelectAuthor(null); // Deselect author when a tag is selected
  };

  const handleSelectAuthor = (author: string | null) => {
    onSelectAuthor(author);
    onSelectTag(null); // Deselect tag when an author is selected
  };

  const handleSelectAll = () => {
    onSelectTag(null);
    onSelectAuthor(null);
  }

  return (
    <aside
      className={`border-r p-3 bg-background transition-all duration-300 ease-in-out relative ${
        isCollapsed ? "w-[60px]" : "w-[250px]"
      }`}
    >
      <button
        onClick={onToggle}
        className="absolute -right-3 top-8 z-10 bg-background hover:bg-muted border rounded-full p-1"
      >
        <ChevronLeft
          className={`w-4 h-4 transition-transform ${
            isCollapsed ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* All Books */}
      <ul className="list-none p-0 m-0 text-sm space-y-1 mb-6">
        <SidebarTooltip content="All Books" show={isCollapsed}>
          <li 
            className={`px-2 py-1 rounded cursor-pointer flex items-center gap-2 ${
              selectedTag === null && selectedAuthor === null ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
            }`}
            onClick={handleSelectAll}
          >
            <Library className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>All Books</span>}
          </li>
        </SidebarTooltip>
      </ul>

      {/* Tags Section */}
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Tags
          </h3>
        )}
      </div>
      <ul className="list-none p-0 m-0 text-sm space-y-1">
        {Object.entries(tags).map(([tag, count]) => (
          <SidebarTooltip key={tag} content={`${tag} (${count})`} show={isCollapsed}>
            <li
              className={`px-2 py-1 rounded cursor-pointer flex items-center gap-2 ${
                selectedTag === tag ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
              }`}
              onClick={() => handleSelectTag(tag)}
            >
              <span className="flex-shrink-0">🏷️</span>
              {!isCollapsed && (
                <span className="flex-1 flex justify-between">
                  <span className="truncate">{tag}</span>
                  <span className="text-muted-foreground text-xs bg-muted px-1.5 rounded-full">{count}</span>
                </span>
              )}
            </li>
          </SidebarTooltip>
        ))}
      </ul>

      {/* Authors Section */}
      <div className="flex items-center gap-2 mt-6 mb-2">
        <User className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Authors
          </h3>
        )}
      </div>
      <ul className="list-none p-0 m-0 text-sm space-y-1">
        {Object.entries(authors).map(([author, count]) => (
          <SidebarTooltip key={author} content={`${author} (${count})`} show={isCollapsed}>
            <li
              className={`px-2 py-1 rounded cursor-pointer flex items-center gap-2 ${
                selectedAuthor === author ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
              }`}
              onClick={() => handleSelectAuthor(author)}
            >
              <span className="flex-shrink-0">✍️</span>
              {!isCollapsed && (
                <span className="flex-1 flex justify-between">
                  <span className="truncate">{author}</span>
                  <span className="text-muted-foreground text-xs bg-muted px-1.5 rounded-full">{count}</span>
                </span>
              )}
            </li>
          </SidebarTooltip>
        ))}
      </ul>
    </aside>
  );
}