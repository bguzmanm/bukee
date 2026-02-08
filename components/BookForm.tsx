import React, { useState, useEffect } from "react";
import { Book } from "@/types";

interface BookFormProps {
  initialData?: Book | null;
  onSubmit: (book: Omit<Book, "id"> | Book) => void;
  onCancel: () => void;
}

export function BookForm({ initialData, onSubmit, onCancel }: BookFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    cover: "",
    tags: "",
    rating: 0,
    path: "",
    description: "",
    identifier: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        author: initialData.author || "",
        cover: initialData.cover || "",
        tags: initialData.tags ? initialData.tags.join(", ") : "",
        rating: initialData.rating ?? 0,
        path: initialData.path || "",
        description: initialData.description || "",
        identifier: initialData.identifier || "",
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const bookPayload = {
      title: formData.title,
      author: formData.author,
      cover: formData.cover,
      rating: formData.rating,
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      path: formData.path,
      description: formData.description,
      identifier: formData.identifier,
    };

    if (initialData?.id) {
      onSubmit({ ...bookPayload, id: initialData.id });
    } else {
      onSubmit(bookPayload);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl border flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b flex-none">
          <h2 className="text-xl font-bold">
            {initialData ? "Edit Book" : "Add New Book"}
          </h2>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="book-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input
                  required
                  className="w-full p-2 rounded border bg-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Author</label>
                <input
                  required
                  className="w-full p-2 rounded border bg-input"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating (0-5)</label>
                <input
                  className="w-full p-2 rounded border bg-input"
                  type="number"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Identifier (ISBN)</label>
                <input
                  className="w-full p-2 rounded border bg-input"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <input
                className="w-full p-2 rounded border bg-input"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="sci-fi, classic"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full p-2 rounded border bg-input min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">File Paths</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Cover URL / Path</label>
                  <input
                    className="w-full p-2 rounded border bg-input text-sm font-mono"
                    value={formData.cover}
                    onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                    placeholder="/covers/default.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">EPub File Path</label>
                  <input
                      className="w-full p-2 rounded border bg-input text-sm font-mono"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      placeholder="/books/my-book.epub"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/10 flex justify-end gap-2 flex-none">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="book-form"
            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>

      </div>
    </div>
  );
}