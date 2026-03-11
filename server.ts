import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "words.db");
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE
  );
  CREATE INDEX IF NOT EXISTS idx_word_start ON words(word COLLATE NOCASE);
`);

async function seedDatabase() {
  const count = db.prepare("SELECT COUNT(*) as count FROM words").get() as { count: number };
  if (count.count > 0) {
    console.log("Database already seeded with", count.count, "words.");
    return;
  }

  console.log("Seeding database...");
  
  // Attempt to fetch a large Indonesian word list
  // If fetch fails, we'll use a fallback small list to ensure the app works
  try {
    const url = "https://raw.githubusercontent.com/6/indonesian-wordlist/master/indonesian-wordlist.txt";
    const response = await fetch(url);
    if (response.ok) {
      const text = await response.text();
      const words = text.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
      
      const insert = db.prepare("INSERT OR IGNORE INTO words (word) VALUES (?)");
      const insertMany = db.transaction((words) => {
        for (const word of words) insert.run(word);
      });
      
      insertMany(words);
      console.log(`Seeded ${words.length} words from GitHub.`);
    } else {
      throw new Error("Failed to fetch word list");
    }
  } catch (error) {
    console.error("Error seeding from URL, using fallback:", error);
    const fallbackWords = ["ular", "ulasan", "unta", "usaha", "amanda", "armada", "dunia", "meja", "buku", "pensil", "sekolah", "belajar"];
    const insert = db.prepare("INSERT OR IGNORE INTO words (word) VALUES (?)");
    fallbackWords.forEach(w => insert.run(w));
  }
}

async function startServer() {
  await seedDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/search", (req, res) => {
    const { q, type, limit = 100 } = req.query;
    if (!q || typeof q !== "string") {
      return res.json([]);
    }

    const searchTerm = q.toLowerCase();
    let query = "";
    let params: any[] = [];

    if (type === "start") {
      query = "SELECT word FROM words WHERE word LIKE ? LIMIT ?";
      params = [`${searchTerm}%`, limit];
    } else if (type === "end") {
      query = "SELECT word FROM words WHERE word LIKE ? LIMIT ?";
      params = [`%${searchTerm}`, limit];
    } else {
      query = "SELECT word FROM words WHERE word LIKE ? LIMIT ?";
      params = [`%${searchTerm}%`, limit];
    }

    const results = db.prepare(query).all(...params);
    res.json(results.map((r: any) => r.word));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
