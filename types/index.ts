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