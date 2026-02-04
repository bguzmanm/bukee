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
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        author: initialData.author,
        cover: initialData.cover,
        tags: initialData.tags.join(", "),
        rating: initialData.rating,
        path: initialData.path,
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
    };

    if (initialData?.id) {
      // It's an update, include the ID
      onSubmit({ ...bookPayload, id: initialData.id });
    } else {
      // It's a creation, don't include the ID
      onSubmit(bookPayload);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-xl w-96 border">
        <h2 className="text-xl font-bold mb-4">
          {initialData ? "Edit Book" : "Add New Book"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              required
              className="w-full p-2 rounded border bg-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Author</label>
            <input
              required
              className="w-full p-2 rounded border bg-input"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cover URL</label>
            <input
              className="w-full p-2 rounded border bg-input"
              value={formData.cover}
              onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
              placeholder="/covers/default.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input
              className="w-full p-2 rounded border bg-input"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="sci-fi, classic"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rating (0-5)</label>
            <input
              type="number"
              min="0"
              max="5"
              className="w-full p-2 rounded border bg-input"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">EPub URL</label>
            <input
                className="w-full p-2 rounded border bg-input"
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                placeholder="/books/default.jpg"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded border hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}