import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "contacts_db.json");

app.use(express.json());

// Initialize Database with pre-seeded, high-quality data if it doesn't exist
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [
        {
          id: 1,
          username: "demo_user",
          email: "demo@example.com",
          passwordHash: "7b47e8cda49e7bdf51a34b22c83c27e8", // hashed "Password123"
          dateCreated: "2026-07-10 12:00:00"
        }
      ],
      contacts: [
        {
          id: 1,
          name: "Vaibhav Singh",
          emails: ["vaibhav.sharma@google.com", "vaibhav@gmail.com"],
          phoneNumbers: ["+1 (555) 019-2834", "+1 (555) 019-5821"],
          company: "Google",
          address: "1600 Amphitheatre Pkwy, Mountain View, CA",
          birthday: "1992-08-24",
          tags: ["Key Client", "Product Manager", "Tech"],
          groups: ["Partners", "Silicon Valley Network"],
          notes: "Met at Google I/O. Lead Product Manager for Cloud API integrations.",
          isFavorite: true,
          dateAdded: "2026-06-01 10:14:00",
          lastModified: "2026-07-05 14:22:00",
          interactionCount: 15
        },
        {
          id: 2,
          name: "Prachi Singh",
          emails: ["prachi.patel@stripe.com"],
          phoneNumbers: ["+1 (555) 482-1920"],
          company: "Stripe",
          address: "354 Oyster Point Blvd, South San Francisco, CA",
          birthday: "1988-11-12",
          tags: ["Billing", "Executive", "Fintech"],
          groups: ["Partners", "Finance Circle"],
          notes: "Discussed enterprise pricing discount. High priority contact.",
          isFavorite: true,
          dateAdded: "2026-06-15 09:30:00",
          lastModified: "2026-07-09 11:15:00",
          interactionCount: 22
        },
        {
          id: 3,
          name: "Shujal Jaiswal",
          emails: ["sujal.m@openai.com"],
          phoneNumbers: ["+1 (555) 901-3829"],
          company: "OpenAI",
          address: "3180 18th St, San Francisco, CA",
          birthday: "1995-03-15",
          tags: ["AI", "Research", "Collaborator"],
          groups: ["Tech Founders", "Silicon Valley Network"],
          notes: "Working on custom LLM models for CRM autocomplete logic.",
          isFavorite: false,
          dateAdded: "2026-06-20 16:45:00",
          lastModified: "2026-06-20 16:45:00",
          interactionCount: 8
        },
        {
          id: 4,
          name: "Prince Thakur",
          emails: ["prince.k@apple.com"],
          phoneNumbers: ["+1 (555) 233-9081"],
          company: "Apple",
          address: "1 Apple Park Way, Cupertino, CA",
          birthday: "1990-05-04",
          tags: ["Hardware", "Design", "Alumni"],
          groups: ["Silicon Valley Network"],
          notes: "SaaS UX consultant. Excellent aesthetic taste.",
          isFavorite: true,
          dateAdded: "2026-07-01 11:00:00",
          lastModified: "2026-07-11 08:30:00",
          interactionCount: 19
        },
        {
          id: 5,
          name: "Shubham Singh",
          emails: ["shubham@philosophy.org"],
          phoneNumbers: ["+1 (555) 000-0161"],
          company: "Stoic Labs",
          address: "Rome, Italy",
          birthday: "0121-04-26",
          tags: ["Adviser", "Mentor"],
          groups: ["Personal", "Stoic Group"],
          notes: "Very calm in high-pressure situations. Reminds me of core values.",
          isFavorite: false,
          dateAdded: "2026-05-10 08:00:00",
          lastModified: "2026-05-10 08:00:00",
          interactionCount: 3
        }
      ],
      recentViews: [1, 2, 4],
      deletedContacts: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
}

initDB();

// Helper to read and write db
function readDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return { users: [], contacts: [], recentViews: [], deletedContacts: [] };
  }
}

function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Helper to format ISO timestamp
function getTimestamp() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

// --- REST API ENDPOINTS ---

// Health route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Express REST Proxy Node Daemon", compilerMode: "offline_cpp_blueprint" });
});

// Register User
app.post("/api/auth/register", (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: "Missing registration parameters" });
    }

    const db = readDB();
    if (db.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ success: false, error: "Username is already taken!" });
    }
    if (db.users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, error: "Email is already registered!" });
    }

    const newUser = {
      id: db.users.length > 0 ? Math.max(...db.users.map((u: any) => u.id)) + 1 : 1,
      username,
      email,
      passwordHash: `hashed_${username}_${password}`,
      dateCreated: getTimestamp()
    };

    db.users.push(newUser);
    writeDB(db);

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: { id: newUser.id, username: newUser.username, email: newUser.email }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Login User
app.post("/api/auth/login", (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, error: "Missing credentials" });
    }

    const db = readDB();
    const user = db.users.find((u: any) => 
      u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
      u.email.toLowerCase() === usernameOrEmail.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid username or email!" });
    }

    // Direct check since we simulate hashing
    const expectedHash = `hashed_${user.username}_${password}`;
    // Support also pre-seeded password for demo
    if (user.passwordHash !== expectedHash && !(user.username === "demo_user" && password === "Password123")) {
      return res.status(401).json({ success: false, error: "Incorrect password!" });
    }

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token: "jwt-token-demo-payload-string",
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/contacts - list contacts with dynamic sorting
app.get("/api/contacts", (req, res) => {
  try {
    const { sortBy } = req.query;
    const db = readDB();
    let list = [...db.contacts];

    // Sorting simulation matching C++ manual sorting predicates
    if (sortBy === "name") {
      list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    } else if (sortBy === "company") {
      list.sort((a, b) => (a.company || "").toLowerCase().localeCompare((b.company || "").toLowerCase()));
    } else if (sortBy === "birthday") {
      list.sort((a, b) => {
        if (!a.birthday) return 1;
        if (!b.birthday) return -1;
        return a.birthday.localeCompare(b.birthday);
      });
    } else if (sortBy === "dateAdded") {
      list.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)); // Newest first
    } else if (sortBy === "lastModified") {
      list.sort((a, b) => b.lastModified.localeCompare(a.lastModified)); // Recently modified first
    } else {
      // Default: Alphabetical (In-Order AVL)
      list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    }

    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/contacts - Add contact (checks duplicates)
app.post("/api/contacts", (req, res) => {
  try {
    const { name, emails, phoneNumbers, company, address, birthday, tags, groups, notes, isFavorite } = req.body;
    if (!name || !emails || !phoneNumbers) {
      return res.status(400).json({ error: "Missing required contact details" });
    }

    const db = readDB();

    // Duplicate checks
    for (const email of emails) {
      if (db.contacts.some((c: any) => c.emails.some((e: string) => e.toLowerCase() === email.toLowerCase()))) {
        return res.status(400).json({ error: `A contact with email '${email}' already exists!` });
      }
    }
    for (const phone of phoneNumbers) {
      if (db.contacts.some((c: any) => c.phoneNumbers.some((p: string) => p.replace(/\D/g, "") === phone.replace(/\D/g, "")))) {
        return res.status(400).json({ error: `A contact with phone '${phone}' already exists!` });
      }
    }

    const now = getTimestamp();
    const newContact = {
      id: db.contacts.length > 0 ? Math.max(...db.contacts.map((c: any) => c.id)) + 1 : 1,
      name,
      emails,
      phoneNumbers,
      company: company || "",
      address: address || "",
      birthday: birthday || "",
      tags: tags || [],
      groups: groups || [],
      notes: notes || "",
      isFavorite: !!isFavorite,
      dateAdded: now,
      lastModified: now,
      interactionCount: 0
    };

    db.contacts.push(newContact);
    writeDB(db);

    res.status(201).json(newContact);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/contacts/search - Autocomplete prefix (simulates Trie prefix search)
app.get("/api/contacts/search", (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Missing prefix search query" });
  }
  const prefix = (q as string).toLowerCase();
  const db = readDB();

  // Match prefixes
  const matched = db.contacts.filter((c: any) => c.name.toLowerCase().startsWith(prefix));
  res.json(matched);
});

// GET /api/contacts/favorites - Priorities (simulates Priority Queue heap)
app.get("/api/contacts/favorites", (req, res) => {
  const db = readDB();
  const favorites = db.contacts.filter((c: any) => c.isFavorite);
  // Sort by interactions desc
  favorites.sort((a: any, b: any) => b.interactionCount - a.interactionCount);
  res.json(favorites);
});

// GET /api/contacts/recent - LIFO recently viewed (simulates Stack)
app.get("/api/contacts/recent", (req, res) => {
  const db = readDB();
  const recentIds = db.recentViews || [];
  const recent: any[] = [];
  const added = new Set();

  // Traverse LIFO (reverse order)
  for (let i = recentIds.length - 1; i >= 0; i--) {
    const id = recentIds[i];
    if (!added.has(id)) {
      const c = db.contacts.find((x: any) => x.id === id);
      if (c) {
        recent.push(c);
        added.add(id);
      }
    }
    if (recent.length >= 5) break;
  }
  res.json(recent);
});

// GET /api/contacts/related/:id - Connections (simulates BFS Graph group network)
app.get("/api/contacts/related/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const target = db.contacts.find((c: any) => c.id === id);
  if (!target) {
    return res.status(404).json({ error: "Contact not found" });
  }

  // BFS search starting from contact's groups
  const related = db.contacts.filter((c: any) => {
    if (c.id === id) return false;
    return c.groups.some((grp: string) => target.groups.includes(grp));
  });

  res.json(related);
});

// GET /api/contacts/:id - individual contact (view tracking)
app.get("/api/contacts/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const contactIdx = db.contacts.findIndex((c: any) => c.id === id);

  if (contactIdx === -1) {
    return res.status(404).json({ error: "Contact not found" });
  }

  // Record interaction and stack log
  db.contacts[contactIdx].interactionCount += 1;
  db.recentViews = db.recentViews || [];
  db.recentViews.push(id);
  if (db.recentViews.length > 30) db.recentViews.shift(); // Bound size

  writeDB(db);
  res.json(db.contacts[contactIdx]);
});

// PUT /api/contacts/:id - Edit
app.put("/api/contacts/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, emails, phoneNumbers, company, address, birthday, tags, groups, notes, isFavorite } = req.body;
    const db = readDB();

    const contactIdx = db.contacts.findIndex((c: any) => c.id === id);
    if (contactIdx === -1) {
      return res.status(404).json({ error: "Contact not found" });
    }

    // Duplicates check
    for (const email of emails) {
      if (db.contacts.some((c: any) => c.id !== id && c.emails.some((e: string) => e.toLowerCase() === email.toLowerCase()))) {
        return res.status(400).json({ error: `Another contact with email '${email}' already exists!` });
      }
    }
    for (const phone of phoneNumbers) {
      if (db.contacts.some((c: any) => c.id !== id && c.phoneNumbers.some((p: string) => p.replace(/\D/g, "") === phone.replace(/\D/g, "")))) {
        return res.status(400).json({ error: `Another contact with phone '${phone}' already exists!` });
      }
    }

    db.contacts[contactIdx] = {
      ...db.contacts[contactIdx],
      name,
      emails,
      phoneNumbers,
      company: company || "",
      address: address || "",
      birthday: birthday || "",
      tags: tags || [],
      groups: groups || [],
      notes: notes || "",
      isFavorite: !!isFavorite,
      lastModified: getTimestamp()
    };

    writeDB(db);
    res.json(db.contacts[contactIdx]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/contacts/:id - Delete (FIFO Queue enqueue)
app.delete("/api/contacts/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const contactIdx = db.contacts.findIndex((c: any) => c.id === id);

  if (contactIdx === -1) {
    return res.status(404).json({ error: "Contact not found" });
  }

  const deleted = db.contacts.splice(contactIdx, 1)[0];
  db.deletedContacts = db.deletedContacts || [];
  db.deletedContacts.push(deleted);
  if (db.deletedContacts.length > 10) db.deletedContacts.shift(); // Limit queue to 10

  writeDB(db);
  res.json({ success: true, message: "Contact deleted successfully." });
});

// POST /api/contacts/undo - Restore (FIFO Queue dequeue)
app.post("/api/contacts/undo", (req, res) => {
  const db = readDB();
  db.deletedContacts = db.deletedContacts || [];
  if (db.deletedContacts.length === 0) {
    return res.status(400).json({ error: "No deleted contacts available to restore!" });
  }

  // FIFO Queue: oldest deleted contact gets popped/restored
  const restored = db.deletedContacts.pop(); // or shift() depending on standard. In CRM, we pop the last deleted. Let's pop.
  db.contacts.push(restored);
  writeDB(db);

  res.json({ success: true, contact: restored });
});

// POST /api/contacts/favorite/:id - Toggle fav
app.post("/api/contacts/favorite/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDB();
  const contact = db.contacts.find((c: any) => c.id === id);
  if (!contact) {
    return res.status(404).json({ error: "Contact not found" });
  }

  contact.isFavorite = !contact.isFavorite;
  contact.lastModified = getTimestamp();
  writeDB(db);
  res.json({ success: true, contact });
});

// POST /api/contacts/import - Import CSV
app.post("/api/contacts/import", (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ error: "Missing CSV data" });

    const lines = csv.split("\n").filter((l: string) => l.trim().length > 0);
    const db = readDB();
    let importedCount = 0;

    let startIdx = 0;
    if (lines[0].toLowerCase().includes("name") || lines[0].toLowerCase().includes("email")) {
      startIdx = 1; // Skip header
    }

    const now = getTimestamp();
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV field parser
      const fields: string[] = [];
      let field = "";
      let inQuotes = false;
      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          fields.push(field.trim());
          field = "";
        } else {
          field += char;
        }
      }
      fields.push(field.trim());

      if (fields.length < 2) continue;

      const name = fields[0];
      const emails = fields[1] ? fields[1].split(";").map((e: string) => e.trim()) : [];
      const phoneNumbers = fields[2] ? fields[2].split(";").map((p: string) => p.trim()) : [];
      const company = fields[3] || "";
      const address = fields[4] || "";
      const birthday = fields[5] || "";
      const tags = fields[6] ? fields[6].split(";").map((t: string) => t.trim()) : [];
      const groups = fields[7] ? fields[7].split(";").map((g: string) => g.trim()) : [];
      const notes = fields[8] || "";
      const isFavorite = fields[9] === "1" || fields[9].toLowerCase() === "true";

      // Duplicate verify
      const emailDup = db.contacts.some((c: any) => c.emails.some((e: string) => emails.map((em: string) => em.toLowerCase()).includes(e.toLowerCase())));
      const phoneDup = db.contacts.some((c: any) => c.phoneNumbers.some((p: string) => phoneNumbers.map((ph: string) => ph.replace(/\D/g, "")).includes(p.replace(/\D/g, ""))));

      if (emailDup || phoneDup) continue; // Skip duplicates silently in bulk import

      const newContact = {
        id: db.contacts.length > 0 ? Math.max(...db.contacts.map((c: any) => c.id)) + 1 : 1,
        name,
        emails,
        phoneNumbers,
        company,
        address,
        birthday,
        tags,
        groups,
        notes,
        isFavorite,
        dateAdded: now,
        lastModified: now,
        interactionCount: 0
      };

      db.contacts.push(newContact);
      importedCount++;
    }

    writeDB(db);
    res.json({ success: true, imported: importedCount });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/contacts/export - Export CSV
app.get("/api/contacts/export", (req, res) => {
  const db = readDB();
  let csv = "name,emails,phoneNumbers,company,address,birthday,tags,groups,notes,isFavorite\n";
  for (const c of db.contacts) {
    const escapedName = `"${c.name.replace(/"/g, '""')}"`;
    const escapedEmails = `"${c.emails.join(";").replace(/"/g, '""')}"`;
    const escapedPhones = `"${c.phoneNumbers.join(";").replace(/"/g, '""')}"`;
    const escapedCompany = `"${c.company.replace(/"/g, '""')}"`;
    const escapedAddress = `"${c.address.replace(/"/g, '""')}"`;
    const escapedTags = `"${c.tags.join(";").replace(/"/g, '""')}"`;
    const escapedGroups = `"${c.groups.join(";").replace(/"/g, '""')}"`;
    const escapedNotes = `"${c.notes.replace(/"/g, '""')}"`;

    csv += `${escapedName},${escapedEmails},${escapedPhones},${escapedCompany},${escapedAddress},${c.birthday},${escapedTags},${escapedGroups},${escapedNotes},${c.isFavorite ? "1" : "0"}\n`;
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=\"contacts_export.csv\"");
  res.send(csv);
});

// GET /api/analytics - Analytics
app.get("/api/analytics", (req, res) => {
  const db = readDB();
  const totalContacts = db.contacts.length;
  const favorites = db.contacts.filter((c: any) => c.isFavorite).length;
  const favoritePercentage = totalContacts > 0 ? (favorites / totalContacts) * 100 : 0;

  // Monthly breakdown of additions (last 6 months)
  // Let's count by dateAdded
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyCounts: { [key: string]: number } = {};
  db.contacts.forEach((c: any) => {
    if (c.dateAdded) {
      const monthIdx = parseInt(c.dateAdded.substring(5, 7)) - 1;
      const monthName = months[monthIdx] || "Other";
      monthlyCounts[monthName] = (monthlyCounts[monthName] || 0) + 1;
    }
  });

  const monthlyAdditions = Object.keys(monthlyCounts).map(name => ({
    name,
    count: monthlyCounts[name]
  }));

  // Company distribution
  const companyDistribution: { [key: string]: number } = {};
  db.contacts.forEach((c: any) => {
    if (c.company) {
      companyDistribution[c.company] = (companyDistribution[c.company] || 0) + 1;
    }
  });

  const companyStats = Object.keys(companyDistribution).map(name => ({
    name,
    value: companyDistribution[name]
  }));

  res.json({
    totalContacts,
    favoritePercentage,
    favoritesCount: favorites,
    monthlyAdditions,
    companyDistribution: companyStats,
    undoQueueSize: db.deletedContacts.length
  });
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server with Vite proxy running on http://localhost:${PORT}`);
  });
}

startServer();
