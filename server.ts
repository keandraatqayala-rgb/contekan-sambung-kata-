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
  if (count.count > 1000) {
    console.log("Database already seeded with", count.count, "words.");
    return;
  }

  console.log("Seeding database...");
  
  try {
    // Using a more reliable large Indonesian word list source
    const url = "https://raw.githubusercontent.com/6/indonesian-wordlist/master/indonesian-wordlist.txt";
    const response = await fetch(url);
    if (response.ok) {
      const text = await response.text();
      const words = text.split(/\r?\n/)
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 1 && /^[a-z]+$/.test(w)); // Only alphabetic words
      
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
    // Fallback with a decent amount of words if fetch fails
    const fallbackWords = ["ular", "ulasan", "unta", "usaha", "amanda", "armada", "dunia", "meja", "buku", "pensil", "sekolah", "belajar", "makan", "minum", "tidur", "lari", "jalan", "lompat", "terbang", "berenang"];
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
    const { q, type, length, limit = 100 } = req.query;
    
    let query = "SELECT word FROM words WHERE 1=1";
    let params: any[] = [];

    if (q && typeof q === "string") {
      const searchTerm = q.toLowerCase();
      if (type === "start") {
        query += " AND word LIKE ?";
        params.push(`${searchTerm}%`);
      } else if (type === "end") {
        query += " AND word LIKE ?";
        params.push(`%${searchTerm}`);
      } else if (type === "middle") {
        query += " AND word LIKE ?";
        params.push(`%${searchTerm}%`);
      } else {
        query += " AND word LIKE ?";
        params.push(`%${searchTerm}%`);
      }
    }

    if (length) {
      query += " AND LENGTH(word) = ?";
      params.push(parseInt(length as string));
    }

    query += " LIMIT ?";
    params.push(parseInt(limit as string));

    try {
      const results = db.prepare(query).all(...params);
      res.json(results.map((r: any) => r.word));
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/random", (req, res) => {
    const result = db.prepare("SELECT word FROM words ORDER BY RANDOM() LIMIT 1").get() as { word: string };
    res.json(result);
  });

  app.get("/api/stats", (req, res) => {
    const count = db.prepare("SELECT COUNT(*) as count FROM words").get() as { count: number };
    res.json(count);
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
