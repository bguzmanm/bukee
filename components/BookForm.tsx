"use client";

import React, { useState, useEffect } from "react";
import { Book } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  const [open, setOpen] = useState(true);

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
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar libro" : "Añadir libro"}
          </DialogTitle>
          <DialogDescription>
            Completa los datos. Los campos marcados son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form id="book-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="book-title">Título</Label>
              <Input
                id="book-title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-author">Autor</Label>
              <Input
                id="book-author"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Puntuación</Label>
              <Select
                value={String(formData.rating)}
                onValueChange={(v) => setFormData({ ...formData, rating: parseInt(v) || 0 })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una puntuación" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n === 0 ? "Sin calificar" : `${n} ${n === 1 ? "estrella" : "estrellas"}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-identifier">Identificador (ISBN)</Label>
              <Input
                id="book-identifier"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="book-tags">Etiquetas (separadas por coma)</Label>
            <Input
              id="book-tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="ciencia ficción, clásico"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="book-description">Descripción</Label>
            <Textarea
              id="book-description"
              className="min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Rutas de archivo</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-cover" className="text-xs">Portada (URL o ruta)</Label>
                <Input
                  id="book-cover"
                  className="text-sm font-mono"
                  value={formData.cover}
                  onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                  placeholder="/covers/default.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-path" className="text-xs">Ruta del archivo EPUB</Label>
                <Input
                  id="book-path"
                  className="text-sm font-mono"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/books/mi-libro.epub"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setOpen(false); onCancel(); }}>
              Cancelar
            </Button>
            <Button type="submit" form="book-form">
              {initialData ? "Guardar cambios" : "Añadir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}