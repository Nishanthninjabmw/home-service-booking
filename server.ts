import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("homeservices.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('customer', 'servicer')),
    plan TEXT DEFAULT 'free'
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    booking_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (service_id) REFERENCES services (id)
  );
`);

// Seed services if empty
const serviceCount = db.prepare("SELECT COUNT(*) as count FROM services").get() as { count: number };
if (serviceCount.count === 0) {
  const insert = db.prepare("INSERT INTO services (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)");
  insert.run("Deep Cleaning", "Thorough cleaning of all rooms, including windows and appliances.", 120, "Cleaning", "https://picsum.photos/seed/clean/800/600");
  insert.run("Emergency Plumbing", "Fix leaks, clogs, and pipe bursts quickly.", 85, "Plumbing", "https://picsum.photos/seed/plumb/800/600");
  insert.run("Electrical Repair", "Safe repair of outlets, switches, and wiring issues.", 95, "Electrical", "https://picsum.photos/seed/elec/800/600");
  insert.run("AC Maintenance", "Full service and filter cleaning for your air conditioning unit.", 75, "HVAC", "https://picsum.photos/seed/hvac/800/600");
  insert.run("Garden Landscaping", "Mowing, pruning, and general garden upkeep.", 60, "Outdoor", "https://picsum.photos/seed/garden/800/600");
  insert.run("Handyman Service", "General repairs, furniture assembly, and mounting.", 50, "General", "https://picsum.photos/seed/handy/800/600");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/register", (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    try {
      const info = db.prepare(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)"
      ).run(name, email, password, role);
      const user = db.prepare("SELECT id, name, email, role, plan FROM users WHERE id = ?").get(info.lastInsertRowid);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const user = db.prepare("SELECT id, name, email, role, plan FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/users/plan", (req, res) => {
    const { userId, plan } = req.body;
    try {
      db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update plan" });
    }
  });

  // API Routes
  app.get("/api/services", (req, res) => {
    const services = db.prepare("SELECT * FROM services").all();
    res.json(services);
  });

  app.post("/api/bookings", (req, res) => {
    const { service_id, customer_name, customer_email, booking_date } = req.body;
    if (!service_id || !customer_name || !customer_email || !booking_date) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    try {
      const info = db.prepare(
        "INSERT INTO bookings (service_id, customer_name, customer_email, booking_date) VALUES (?, ?, ?, ?)"
      ).run(service_id, customer_name, customer_email, booking_date);
      res.status(201).json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.get("/api/bookings", (req, res) => {
    const email = req.query.email as string;
    if (!email) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const bookings = db.prepare(`
      SELECT b.*, s.name as service_name 
      FROM bookings b 
      JOIN services s ON b.service_id = s.id
      WHERE b.customer_email = ?
      ORDER BY b.booking_date DESC
    `).all(email);
    res.json(bookings);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
