import Database from "@tauri-apps/plugin-sql";
import { Book } from "@/types";

const DB_NAME = "sqlite:bukee.db";

let dbInstance: Database | null = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load(DB_NAME);
  }
  return dbInstance;
}

export const BookRepository = {
  async init() {
    const db = await getDb();
    // Check if empty and seed
    const count: any[] = await db.select("SELECT COUNT(*) as count FROM books");
    if (count[0].count === 0) {
      await this.create({
        title: "Fundación",
        author: "Isaac Asimov",
        cover: "/covers/fundacion.jpg",
        tags: ["sci-fi", "clásico"],
        rating: 5,
      } as Book);
      await this.create({
        title: "Harry Potter y la piedra filosofal",
        author: "J.K. Rowling",
        cover: "/covers/hp1.jpg",
        tags: ["fantasía"],
        rating: 4,
      } as Book);
      await this.create({
        title: "Proyecto Hail Mary",
        author: "Andy Weir",
        cover: "/covers/hailmary.jpg",
        tags: ["sci-fi"],
        rating: 4,
      } as Book);
    }
  },

  async getAll(): Promise<Book[]> {
    const db = await getDb();
    const result: any[] = await db.select("SELECT * FROM books");
    return result.map((row) => ({
      ...row,
      tags: row.tags ? row.tags.split(",") : [],
    }));
  },

  async getTagsWithCounts(): Promise<Record<string, number>> {
    const db = await getDb();
    const result: { tags: string }[] = await db.select("SELECT tags FROM books WHERE tags != ''");
    
    const tagCounts: Record<string, number> = {};
    
    result.forEach(row => {
      const tags = row.tags.split(',');
      tags.forEach(tag => {
        const trimmedTag = tag.trim();
        if (trimmedTag) {
          tagCounts[trimmedTag] = (tagCounts[trimmedTag] || 0) + 1;
        }
      });
    });

    return tagCounts;
  },

  async getAuthorsWithCounts(): Promise<Record<string, number>> {
    const db = await getDb();
    const result: { author: string, count: number }[] = await db.select(
      "SELECT author, COUNT(*) as count FROM books GROUP BY author"
    );
    
    const authorCounts: Record<string, number> = {};
    result.forEach(row => {
      authorCounts[row.author] = row.count;
    });
    
    return authorCounts;
  },

  async create(book: Omit<Book, "id">): Promise<void> {
    const db = await getDb();
    const tagsString = book.tags.join(",");
    await db.execute(
      "INSERT INTO books (title, author, cover, tags, rating) VALUES ($1, $2, $3, $4, $5)",
      [book.title, book.author, book.cover, tagsString, book.rating]
    );
  },

  async update(book: Book): Promise<void> {
    const db = await getDb();
    const tagsString = book.tags.join(",");
    await db.execute(
      "UPDATE books SET title = $1, author = $2, cover = $3, tags = $4, rating = $5, path = $6 WHERE id = $7",
      [book.title, book.author, book.cover, tagsString, book.rating, book.path, book.id]
    );
  },

  async deleteById(id: number): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM books WHERE id = $1", [id]);
  },
};