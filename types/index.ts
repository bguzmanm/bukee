export interface Book {
  id: number;
  title: string;
  author: string;
  cover: string;
  tags: string[];
  rating: number;
  path?: string;
  description?: string;
  identifier?: string;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  key: keyof Book;
  direction: SortDirection;
}

export interface KindleBook {
  name: string;
  path: string;
  title: string;
  author: string;
  format: string;
  size: number;
  cover?: string | null;
  status?: "en_curso" | "leido" | "sin_comenzar";
  position?: number | null;
  last_read?: number | null;
  progress?: number | null;
  tags?: string[];
}

export type KindleStatusFilter = "todos" | "en_curso" | "leido" | "sin_comenzar";