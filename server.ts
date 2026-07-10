import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  console.log("Gemini API initialized successfully.");
} else {
  console.warn("GEMINI_API_KEY is not defined. AI features will run in fallback/simulation mode.");
}

const DB_FILE = path.join(process.cwd(), "database.json");

// Helper to write to database.json
const saveDb = (data: any) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
};

// Initial realistic seed database
const defaultDb = {
  products: [
    {
      id: "prod-1",
      sku: "EL-SENS-302",
      name: "Smart IoT Temperature Sensor",
      description: "High-precision ambient thermal and humidity monitoring sensor with BLE support.",
      category: "Electronics",
      stockLevel: 145,
      unit: "pcs",
      price: 2125.00,
      cost: 975.00,
      minStock: 50,
      warehouseId: "wh-1",
      supplierId: "sup-1",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "prod-2",
      sku: "EL-BATT-088",
      name: "Lithium Polymer Battery 3000mAh",
      description: "Rechargeable flat-pack batteries for portable IoT gear. Safety certified.",
      category: "Electronics",
      stockLevel: 22, // Critical Low
      unit: "pcs",
      price: 1060.00,
      cost: 440.00,
      minStock: 60,
      warehouseId: "wh-1",
      supplierId: "sup-1",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "prod-3",
      sku: "HW-SCW-M8",
      name: "M8 Industrial Steel Screws",
      description: "Zinc-plated high tensile hexagonal head fasteners, pack of 500.",
      category: "Hardware",
      stockLevel: 450,
      unit: "packs",
      price: 1530.00,
      cost: 660.00,
      minStock: 100,
      warehouseId: "wh-2",
      supplierId: "sup-3",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "prod-4",
      sku: "PK-BOX-02",
      name: "Recycled Corrugated Cardboard Boxes",
      description: "Double-walled shipping cartons, flat packed. Dimensions 30x20x15cm. Pack of 50.",
      category: "Packaging",
      stockLevel: 8, // Out of stock / Critical Low
      unit: "packs",
      price: 2975.00,
      cost: 1190.00,
      minStock: 30,
      warehouseId: "wh-3",
      supplierId: "sup-2",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "prod-5",
      sku: "MD-BAND-100",
      name: "Sterile Medical Adhesive Bandages",
      description: "Hypoallergenic breathable skin-tone bandages, box of 100.",
      category: "Medical",
      stockLevel: 1200,
      unit: "boxes",
      price: 765.00,
      cost: 180.00,
      minStock: 200,
      warehouseId: "wh-1",
      supplierId: "sup-4",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "prod-6",
      sku: "EL-MCU-772",
      name: "Apex 32-bit Microcontroller Chip",
      description: "Low-power high-performance ARM Cortex system-on-chip with hardware security keys.",
      category: "Electronics",
      stockLevel: 14, // Critical Low
      unit: "pcs",
      price: 640.00,
      cost: 260.00,
      minStock: 150,
      warehouseId: "wh-1",
      supplierId: "sup-1",
      lastUpdated: new Date().toISOString()
    }
  ],
  suppliers: [
    {
      id: "sup-1",
      name: "Chennai Techtronics Pvt Ltd",
      contactName: "Karthik Raja",
      email: "sales@chennaitechtronics.in",
      phone: "+91-44-2455-0192",
      category: "Electronics",
      rating: 4.8,
      performanceScore: 94,
      activeOrdersCount: 1
    },
    {
      id: "sup-2",
      name: "Kovai Sustainable Packaging",
      contactName: "Senthil Kumar",
      email: "orders@kovaipack.in",
      phone: "+91-422-255-0144",
      category: "Packaging",
      rating: 4.2,
      performanceScore: 82,
      activeOrdersCount: 0
    },
    {
      id: "sup-3",
      name: "Madurai Fasteners & Alloys",
      contactName: "Murugan Swamy",
      email: "support@maduraifasteners.in",
      phone: "+91-452-255-0812",
      category: "Hardware",
      rating: 3.5,
      performanceScore: 71,
      activeOrdersCount: 1
    },
    {
      id: "sup-4",
      name: "Trichy Bio-Pharma Group",
      contactName: "Dr. Meenakshi Sundaram",
      email: "logistics@trichybiopharma.co.in",
      phone: "+91-431-255-0177",
      category: "Medical",
      rating: 4.9,
      performanceScore: 98,
      activeOrdersCount: 0
    }
  ],
  purchaseOrders: [
    {
      id: "po-101",
      supplierId: "sup-1",
      supplierName: "Chennai Techtronics Pvt Ltd",
      status: "Pending",
      totalAmount: 96000.00,
      items: [
        { productId: "prod-2", productName: "Lithium Polymer Battery 3000mAh", qty: 100, cost: 440.00 },
        { productId: "prod-6", productName: "Apex 32-bit Microcontroller Chip", qty: 200, cost: 260.00 }
      ],
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), // 4 days ago
      expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString() // 3 days from now
    },
    {
      id: "po-102",
      supplierId: "sup-3",
      supplierName: "Madurai Fasteners & Alloys",
      status: "Completed",
      totalAmount: 132000.00,
      items: [
        { productId: "prod-3", productName: "M8 Industrial Steel Screws", qty: 200, cost: 660.00 }
      ],
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      expectedDeliveryDate: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
    }
  ],
  sales: [
    // Historical sales data for predictions (6 months)
    { id: "s-1", customerName: "Alpha Manufacturing", date: "2026-02-10", items: [{ productId: "prod-1", productName: "Smart IoT Temperature Sensor", qty: 45, price: 2125.00 }], totalAmount: 95625.00 },
    { id: "s-2", customerName: "Beta Electronics", date: "2026-02-18", items: [{ productId: "prod-2", productName: "Lithium Polymer Battery 3000mAh", qty: 30, price: 1060.00 }], totalAmount: 31800.00 },
    { id: "s-3", customerName: "Omega Labs", date: "2026-03-05", items: [{ productId: "prod-1", productName: "Smart IoT Temperature Sensor", qty: 65, price: 2125.00 }], totalAmount: 138125.00 },
    { id: "s-4", customerName: "Alpha Manufacturing", date: "2026-03-20", items: [{ productId: "prod-3", productName: "M8 Industrial Steel Screws", qty: 80, price: 1530.00 }], totalAmount: 122400.00 },
    { id: "s-5", customerName: "Gamma Robotics", date: "2026-04-12", items: [{ productId: "prod-1", productName: "Smart IoT Temperature Sensor", qty: 95, price: 2125.00 }, { productId: "prod-2", productName: "Lithium Polymer Battery 3000mAh", qty: 80, price: 1060.00 }], totalAmount: 286675.00 },
    { id: "s-6", customerName: "Beta Electronics", date: "2026-05-02", items: [{ productId: "prod-1", productName: "Smart IoT Temperature Sensor", qty: 110, price: 2125.00 }], totalAmount: 233750.00 },
    { id: "s-7", customerName: "Omega Labs", date: "2026-05-25", items: [{ productId: "prod-3", productName: "M8 Industrial Steel Screws", qty: 120, price: 1530.00 }], totalAmount: 183600.00 },
    { id: "s-8", customerName: "Gamma Robotics", date: "2026-06-15", items: [{ productId: "prod-1", productName: "Smart IoT Temperature Sensor", qty: 130, price: 2125.00 }, { productId: "prod-2", productName: "Lithium Polymer Battery 3000mAh", qty: 120, price: 1060.00 }], totalAmount: 403450.00 },
    { id: "s-9", customerName: "Delta Medical", date: "2026-06-28", items: [{ productId: "prod-5", productName: "Sterile Medical Adhesive Bandages", qty: 400, price: 765.00 }], totalAmount: 306000.00 },
    { id: "s-10", customerName: "Beta Electronics", date: "2026-07-01", items: [{ productId: "prod-1", productName: "Smart IoT Temperature Sensor", qty: 155, price: 2125.00 }], totalAmount: 329375.00 }
  ],
  warehouses: [
    {
      id: "wh-1",
      name: "Chennai Mega Hub",
      location: "Chennai, Tamil Nadu",
      capacity: 15000,
      usedSpace: 5400,
      rackLayout: { racksCount: 6, shelvesPerRack: 5 }
    },
    {
      id: "wh-2",
      name: "Coimbatore Depot",
      location: "Coimbatore, Tamil Nadu",
      capacity: 8000,
      usedSpace: 2100,
      rackLayout: { racksCount: 4, shelvesPerRack: 4 }
    },
    {
      id: "wh-3",
      name: "Madurai Transit Center",
      location: "Madurai, Tamil Nadu",
      capacity: 6000,
      usedSpace: 1200,
      rackLayout: { racksCount: 3, shelvesPerRack: 4 }
    }
  ],
  logs: [
    { id: "l-1", timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(), type: "Stock Out", description: "Fulfilled sale of 155 Temperature Sensors to Beta Electronics", user: "John Doe" },
    { id: "l-2", timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), type: "PO Created", description: "Created PO-101 for supplier Chennai Techtronics Pvt Ltd", user: "Sarah Jenkins" },
    { id: "l-3", timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), type: "Transfer", description: "Moved 200 boxes of M8 Screws from Coimbatore to Madurai Transit Center", user: "David Smith" }
  ],
  notifications: [
    {
      id: "n-1",
      type: "low_stock",
      title: "Critical Low Stock",
      message: "Lithium Polymer Battery 3000mAh is under threshold. (Current: 22, Min: 60)",
      date: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      read: false
    },
    {
      id: "n-2",
      type: "low_stock",
      title: "Out Of Stock Warning",
      message: "Recycled Corrugated Cardboard Boxes is practically depleted. (Current: 8, Min: 30)",
      date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      read: false
    },
    {
      id: "n-3",
      type: "pending_delivery",
      title: "Upcoming PO Delivery",
      message: "PO-101 with 300 parts from Chennai Techtronics is due in 3 days.",
      date: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      read: false
    }
  ],
  users: [
    {
      id: "user-1",
      name: "Sarah Jenkins",
      email: "sarah@aether.io",
      passwordHash: crypto.createHash("sha256").update("password123").digest("hex"),
      role: "Logistics Coordinator"
    }
  ]
};

// Initialize DB on disk if it doesn't exist
const getDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    saveDb(defaultDb);
    return defaultDb;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.users) {
      parsed.users = [
        {
          id: "user-1",
          name: "Sarah Jenkins",
          email: "sarah@aether.io",
          passwordHash: crypto.createHash("sha256").update("password123").digest("hex"),
          role: "Logistics Coordinator"
        }
      ];
      saveDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("Failed to parse database.json, reverting to default seed.");
    return defaultDb;
  }
};

// Helper functions for authentication
const generateToken = (userId: string) => {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = `${userId}:${expiry}`;
  return Buffer.from(payload).toString("base64");
};

const verifyToken = (token: string, db: any) => {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [userId, expiryStr] = decoded.split(":");
    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) return null;
    return db.users.find((u: any) => u.id === userId) || null;
  } catch {
    return null;
  }
};

// Authentication Middleware to set req.user if a token is supplied
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const db = getDb();
    const user = verifyToken(token, db);
    req.user = user;
  } else {
    req.user = null;
  }
  next();
};

app.use(authMiddleware);

// Auth Endpoints
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields: name, email, password, and role are required." });
  }

  const db = getDb();
  const lowerEmail = email.toLowerCase().trim();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === lowerEmail);
  if (existingUser) {
    return res.status(400).json({ error: "Email already registered. Please log in instead." });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: lowerEmail,
    passwordHash: crypto.createHash("sha256").update(password).digest("hex"),
    role: role
  };

  db.users.push(newUser);
  saveDb(db);

  const token = generateToken(newUser.id);
  
  // Return user info and token
  const { passwordHash, ...userResponse } = newUser;
  res.status(201).json({
    user: userResponse,
    token
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const db = getDb();
  const lowerEmail = email.toLowerCase().trim();
  const user = db.users.find((u: any) => u.email.toLowerCase() === lowerEmail);
  
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const loginHash = crypto.createHash("sha256").update(password).digest("hex");
  if (loginHash !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = generateToken(user.id);
  const { passwordHash, ...userResponse } = user;
  res.json({
    user: userResponse,
    token
  });
});

app.get("/api/auth/me", (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  const { passwordHash, ...userResponse } = req.user;
  res.json(userResponse);
});

app.put("/api/auth/profile", (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }
  const { name, role } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: "Name and role are required." });
  }

  const db = getDb();
  const user = db.users.find((u: any) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  user.name = name.trim();
  user.role = role.trim();
  saveDb(db);

  const { passwordHash, ...userResponse } = user;
  res.json(userResponse);
});

// Google Auth URL Endpoint
app.get("/api/auth/google/url", (req, res) => {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl.replace(/\/$/, "")}/auth/google/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent"
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    res.json({ url: authUrl, isSimulated: false });
  } else {
    // If not configured, route to simulated consent page with forwarded query parameters
    const queryParams = new URLSearchParams();
    if (req.query.email) queryParams.append("email", req.query.email as string);
    if (req.query.name) queryParams.append("name", req.query.name as string);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const simulatedUrl = `/auth/google/simulated-consent${queryString}`;
    res.json({ url: simulatedUrl, isSimulated: true });
  }
});

// Simulated Google Consent Page
app.get("/auth/google/simulated-consent", (req, res) => {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl.replace(/\/$/, "")}/auth/google/callback`;

  const defaultEmail = (req.query.email as string || "operator@aether.io").toLowerCase().trim();
  const db = getDb();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === defaultEmail);
  const defaultName = (req.query.name as string) || (existingUser ? existingUser.name : "Aether Operator");

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in with Google - Simulation</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-slate-200 min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <!-- Visual Accent -->
        <div class="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-red-500 via-blue-500 to-green-500"></div>
        
        <!-- Header -->
        <div class="text-center pb-6 border-b border-slate-800/60">
          <div class="inline-flex items-center justify-center gap-1.5 mb-3">
            <svg class="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.66-.35-1.36-.35-2.09z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span class="font-bold text-slate-100 tracking-tight text-lg">Google Accounts</span>
          </div>
          <h2 class="text-md font-bold text-slate-300">Choose an account</h2>
          <p class="text-xs text-slate-500 mt-1">to continue to <span class="text-indigo-400 font-semibold">Aether Logistics</span></p>
        </div>

        <!-- Simulation Info Alert -->
        <div class="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-2.5">
          <div class="text-indigo-400 text-sm">💡</div>
          <div class="text-xs text-slate-400 leading-relaxed">
            <strong class="text-indigo-300">Simulation Active:</strong> <code class="text-slate-300 bg-slate-950 px-1 py-0.5 rounded text-[10px]">GOOGLE_CLIENT_ID</code> is not configured. Real Google login is fully coded; this simulation lets you test the instant registration and flow.
          </div>
        </div>

        <form action="${redirectUri}" method="GET" class="space-y-4 mt-5">
          <input type="hidden" name="code" value="mock-google-code">
          
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">Your Google Account Name</label>
            <input type="text" name="name" required value="${defaultName}" class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-3 text-slate-200 placeholder-slate-600 text-sm font-medium outline-none">
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">Google Email Address</label>
            <input type="email" name="email" required value="${defaultEmail}" class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-3 text-slate-200 placeholder-slate-600 text-sm font-medium outline-none">
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase block">Select Logistics Role</label>
            <select name="role" class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-3 text-slate-200 text-sm font-medium outline-none appearance-none cursor-pointer">
              <option value="Logistics Coordinator">Logistics Coordinator</option>
              <option value="Warehouse Manager">Warehouse Manager</option>
              <option value="Inventory Controller">Inventory Controller</option>
              <option value="System Administrator">System Administrator</option>
            </select>
          </div>

          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-xl py-2.5 text-xs font-bold font-mono tracking-wider uppercase transition-all cursor-pointer shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-[0.98]">
            Sign in & Register with Google
          </button>
        </form>

        <div class="mt-4 text-center">
          <p class="text-[10px] text-slate-500 font-mono">
            Secure sandbox simulation • OpenID scope requested
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Google OAuth Callback Handler
app.get(["/auth/google/callback", "/auth/google/callback/"], async (req, res) => {
  const { code, name: mockName, email: mockEmail, role: mockRole } = req.query;
  const db = getDb();

  let userEmail = "";
  let userName = "";
  let userPicture = "";
  let userRole = (mockRole as string) || "Logistics Coordinator";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (clientId && clientSecret && code && code !== "mock-google-code") {
    // Real Google OAuth Flow
    try {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const redirectUri = `${appUrl.replace(/\/$/, "")}/auth/google/callback`;

      // 1. Exchange authorization code for token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code"
        }).toString()
      });

      if (!tokenRes.ok) {
        const errorDetail = await tokenRes.text();
        throw new Error(`Failed to exchange token: ${errorDetail}`);
      }

      const tokens = await tokenRes.json();
      const accessToken = tokens.access_token;

      // 2. Fetch User Profile
      const userinfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
      if (!userinfoRes.ok) {
        throw new Error("Failed to fetch userinfo from Google.");
      }

      const profile = await userinfoRes.json();
      userEmail = profile.email;
      userName = profile.name || profile.given_name || "Google User";
      userPicture = profile.picture || "";
    } catch (err: any) {
      console.error("Google Auth error:", err);
      return res.send(`
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-slate-950 text-slate-200 min-h-screen flex items-center justify-center p-4">
            <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
              <div class="text-rose-500 font-bold mb-2">Google Authentication Failed</div>
              <p class="text-xs text-slate-400 mb-4">${err.message || "An error occurred during code exchange."}</p>
              <button onclick="window.close()" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-mono">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }
  } else {
    // Simulated or fallback flow
    userEmail = (mockEmail as string) || "operator@aether.io";
    userName = (mockName as string) || "Aether Operator";
  }

  // Common: Create or Login user
  const lowerEmail = userEmail.toLowerCase().trim();
  let user = db.users.find((u: any) => u.email.toLowerCase() === lowerEmail);

  if (!user) {
    // Register new user from Google
    user = {
      id: `user-${Date.now()}`,
      name: userName,
      email: lowerEmail,
      passwordHash: "", // No local password for Google logins
      role: userRole,
      picture: userPicture,
      authProvider: "google"
    };
    db.users.push(user);
    saveDb(db);
  }

  const token = generateToken(user.id);

  if (req.query.json === "true") {
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }

  // Return success HTML that communicates back to the client via postMessage
  res.send(`
    <html>
      <body class="bg-slate-950 text-slate-200 flex items-center justify-center min-h-screen font-sans">
        <div class="text-center space-y-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p class="text-sm font-medium text-slate-300">Completing Aether login...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: "OAUTH_AUTH_SUCCESS",
              payload: {
                token: "${token}",
                user: {
                  id: "${user.id}",
                  name: "${user.name.replace(/"/g, '\\"')}",
                  email: "${user.email}",
                  role: "${user.role}"
                }
              }
            }, "*");
            window.close();
          } else {
            // Fallback: save token to localStorage if not a popup
            localStorage.setItem("aether_auth_token", "${token}");
            window.location.href = "/";
          }
        </script>
      </body>
    </html>
  `);
});

// REST API Routes

// Get full DB state
app.get("/api/db/snapshot", (req, res) => {
  res.json(getDb());
});

// Reset database
app.post("/api/db/reset", (req, res) => {
  saveDb(defaultDb);
  res.json({ message: "Database reseeded successfully", db: defaultDb });
});

// Get all products
app.get("/api/products", (req, res) => {
  const db = getDb();
  res.json(db.products);
});

// Create product
app.post("/api/products", (req: any, res) => {
  const db = getDb();
  const newProduct = {
    id: `prod-${Date.now()}`,
    lastUpdated: new Date().toISOString(),
    ...req.body
  };
  db.products.push(newProduct);

  // Add an audit log
  db.logs.unshift({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: "Stock In",
    description: `Added new product ${newProduct.name} (SKU: ${newProduct.sku})`,
    user: req.user ? req.user.name : "System Admin"
  });

  saveDb(db);
  res.status(201).json(newProduct);
});

// Update product
app.put("/api/products/:id", (req, res) => {
  const db = getDb();
  const idx = db.products.findIndex((p: any) => p.id === req.params.id);
  if (idx !== -1) {
    const updated = {
      ...db.products[idx],
      ...req.body,
      lastUpdated: new Date().toISOString()
    };
    db.products[idx] = updated;

    // Check low stock alert trigger
    if (updated.stockLevel < updated.minStock) {
      const alreadyAlerted = db.notifications.some((n: any) => n.type === "low_stock" && n.message.includes(updated.name) && !n.read);
      if (!alreadyAlerted) {
        db.notifications.unshift({
          id: `n-${Date.now()}`,
          type: "low_stock",
          title: "Low Stock Alert",
          message: `${updated.name} has dropped below the threshold. (Current: ${updated.stockLevel}, Min: ${updated.minStock})`,
          date: new Date().toISOString(),
          read: false
        });
      }
    }

    saveDb(db);
    res.json(updated);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// Delete product
app.delete("/api/products/:id", (req, res) => {
  const db = getDb();
  const filtered = db.products.filter((p: any) => p.id !== req.params.id);
  if (filtered.length !== db.products.length) {
    db.products = filtered;
    saveDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// Stock transfer route
app.post("/api/products/transfer", (req: any, res) => {
  const { productId, fromWhId, toWhId, qty } = req.body;
  const db = getDb();
  const product = db.products.find((p: any) => p.id === productId);
  const fromWh = db.warehouses.find((w: any) => w.id === fromWhId);
  const toWh = db.warehouses.find((w: any) => w.id === toWhId);

  if (!product || !fromWh || !toWh) {
    return res.status(400).json({ error: "Invalid product or warehouse ids" });
  }

  if (product.stockLevel < qty) {
    return res.status(400).json({ error: "Insufficient stock level for transfer" });
  }

  // Create log entry
  db.logs.unshift({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: "Transfer",
    description: `Transferred ${qty} ${product.unit} of ${product.name} from ${fromWh.name} to ${toWh.name}`,
    user: req.user ? req.user.name : "System Admin"
  });

  saveDb(db);
  res.json({ success: true, message: `Transferred ${qty} units successfully.` });
});

// Suppliers
app.get("/api/suppliers", (req, res) => {
  const db = getDb();
  res.json(db.suppliers);
});

app.post("/api/suppliers", (req, res) => {
  const db = getDb();
  const newSupplier = {
    id: `sup-${Date.now()}`,
    rating: 5,
    performanceScore: 90,
    activeOrdersCount: 0,
    ...req.body
  };
  db.suppliers.push(newSupplier);
  saveDb(db);
  res.status(201).json(newSupplier);
});

// Purchase Orders
app.get("/api/purchase-orders", (req, res) => {
  const db = getDb();
  res.json(db.purchaseOrders);
});

app.post("/api/purchase-orders", (req: any, res) => {
  const db = getDb();
  const newPo = {
    id: `po-${100 + db.purchaseOrders.length + 1}`,
    createdAt: new Date().toISOString(),
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), // 7 days default
    status: "Pending",
    ...req.body
  };
  db.purchaseOrders.unshift(newPo);

  // Update supplier order count
  const supplier = db.suppliers.find((s: any) => s.id === newPo.supplierId);
  if (supplier) {
    supplier.activeOrdersCount = (supplier.activeOrdersCount || 0) + 1;
  }

  db.logs.unshift({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: "PO Created",
    description: `Created PO ${newPo.id} to ${newPo.supplierName} for a total of $${newPo.totalAmount.toFixed(2)}`,
    user: req.user ? req.user.name : "System Admin"
  });

  saveDb(db);
  res.status(201).json(newPo);
});

// Update PO status
app.put("/api/purchase-orders/:id/status", (req: any, res) => {
  const { status } = req.body;
  const db = getDb();
  const poIndex = db.purchaseOrders.findIndex((p: any) => p.id === req.params.id);
  if (poIndex === -1) {
    return res.status(404).json({ error: "Purchase order not found" });
  }

  const po = db.purchaseOrders[poIndex];
  const oldStatus = po.status;
  po.status = status;

  if (status === "Completed" && oldStatus !== "Completed") {
    // Delivery received! Add stock levels to items
    po.items.forEach((item: any) => {
      const product = db.products.find((p: any) => p.id === item.productId);
      if (product) {
        product.stockLevel += item.qty;
      }
    });

    // Reduce active order count for supplier
    const supplier = db.suppliers.find((s: any) => s.id === po.supplierId);
    if (supplier) {
      supplier.activeOrdersCount = Math.max(0, (supplier.activeOrdersCount || 1) - 1);
    }

    db.logs.unshift({
      id: `l-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "PO Status Change",
      description: `Completed delivery for PO ${po.id}. Restocked items: ${po.items.map((i: any) => `${i.qty}x ${i.productName}`).join(", ")}`,
      user: req.user ? req.user.name : "Warehouse Clerk"
    });

    db.notifications.unshift({
      id: `n-${Date.now()}`,
      type: "success",
      title: "Purchase Order Completed",
      message: `PO ${po.id} from ${po.supplierName} has been received and restocked.`,
      date: new Date().toISOString(),
      read: false
    });
  } else {
    db.logs.unshift({
      id: `l-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "PO Status Change",
      description: `Updated status of PO ${po.id} to ${status}`,
      user: req.user ? req.user.name : "System Admin"
    });
  }

  saveDb(db);
  res.json(po);
});

// Sales
app.get("/api/sales", (req, res) => {
  const db = getDb();
  res.json(db.sales);
});

app.post("/api/sales", (req: any, res) => {
  const db = getDb();
  const { customerName, items, totalAmount } = req.body;

  const newSale = {
    id: `s-${db.sales.length + 1}`,
    date: new Date().toISOString().split("T")[0],
    customerName,
    items,
    totalAmount
  };

  // Deduct stock levels
  let stockError = null;
  items.forEach((item: any) => {
    const product = db.products.find((p: any) => p.id === item.productId);
    if (product) {
      if (product.stockLevel < item.qty) {
        stockError = `Insufficient stock for product ${product.name}. Available: ${product.stockLevel}`;
      }
    }
  });

  if (stockError) {
    return res.status(400).json({ error: stockError });
  }

  items.forEach((item: any) => {
    const product = db.products.find((p: any) => p.id === item.productId);
    if (product) {
      product.stockLevel -= item.qty;
      product.lastUpdated = new Date().toISOString();

      // Trigger low stock if hit
      if (product.stockLevel < product.minStock) {
        db.notifications.unshift({
          id: `n-${Date.now()}`,
          type: "low_stock",
          title: "Low Stock Triggered",
          message: `${product.name} is now low in stock. (Current: ${product.stockLevel}, Min: ${product.minStock})`,
          date: new Date().toISOString(),
          read: false
        });
      }
    }
  });

  db.sales.push(newSale);

  db.logs.unshift({
    id: `l-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: "Stock Out",
    description: `Dispatched order ${newSale.id} to ${customerName}. Value: $${totalAmount.toFixed(2)}`,
    user: req.user ? req.user.name : "Sales Dispatch"
  });

  saveDb(db);
  res.status(201).json(newSale);
});

// Warehouses
app.get("/api/warehouses", (req, res) => {
  const db = getDb();
  res.json(db.warehouses);
});

// Audit Logs
app.get("/api/logs", (req, res) => {
  const db = getDb();
  res.json(db.logs);
});

// Notifications
app.get("/api/notifications", (req, res) => {
  const db = getDb();
  res.json(db.notifications);
});

app.put("/api/notifications/:id/read", (req, res) => {
  const db = getDb();
  const alert = db.notifications.find((n: any) => n.id === req.params.id);
  if (alert) {
    alert.read = true;
    saveDb(db);
    res.json(alert);
  } else {
    res.status(404).json({ error: "Notification not found" });
  }
});

app.put("/api/notifications/read-all", (req, res) => {
  const db = getDb();
  db.notifications.forEach((n: any) => (n.read = true));
  saveDb(db);
  res.json({ success: true });
});

app.delete("/api/notifications/:id", (req, res) => {
  const db = getDb();
  db.notifications = db.notifications.filter((n: any) => n.id !== req.params.id);
  saveDb(db);
  res.json({ success: true });
});

// AI AGENT ENDPOINTS USING GEMINI SDK

// Demand forecasting using Gemini
app.get("/api/ai/forecast", async (req, res) => {
  const db = getDb();

  // If Gemini SDK is initialized, run real analysis. Otherwise, generate robust mock results.
  if (ai) {
    try {
      const prompt = `
        You are an advanced inventory planning and demand forecasting agent.
        Analyze the current product levels and past sales data from our inventory database.
        
        PRODUCTS SNAPSHOT:
        ${JSON.stringify(db.products.map(p => ({ id: p.id, name: p.name, stock: p.stockLevel, minStock: p.minStock, unit: p.unit, sku: p.sku })))}
        
        PAST SALES LOGS:
        ${JSON.stringify(db.sales)}
        
        Tasks:
        1. For each product, analyze historical monthly trends and predict next month's demand (next 30 days predicted sales).
        2. Give a recommended reorder quantity (if current stock - predicted demand <= minStock, recommend reorder quantity to get stock back to optimal. Keep in mind minStock thresholds!).
        3. Provide a confidence score (0-100%) and a concise 1-sentence analytical reasoning explaining the prediction (mentioning trends, seasonality, or critical low triggers if applicable).
        
        Respond STRICTLY with a JSON array that maps to this TypeScript interface:
        interface ProductForecast {
          productId: string;
          productName: string;
          currentStock: number;
          minStock: number;
          historicalSales: number[]; // Estimated last 6 months sales of this item specifically e.g. [12, 18, 15, 20, 24, 28] based on the sales logs.
          predictedDemand: number;
          recommendedReorderQty: number;
          confidenceScore: number;
          reasoning: string;
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productId: { type: Type.STRING },
                productName: { type: Type.STRING },
                currentStock: { type: Type.NUMBER },
                minStock: { type: Type.NUMBER },
                historicalSales: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER }
                },
                predictedDemand: { type: Type.NUMBER },
                recommendedReorderQty: { type: Type.NUMBER },
                confidenceScore: { type: Type.NUMBER },
                reasoning: { type: Type.STRING }
              },
              required: ["productId", "productName", "currentStock", "minStock", "historicalSales", "predictedDemand", "recommendedReorderQty", "confidenceScore", "reasoning"]
            }
          }
        }
      });

      const responseText = response.text || "[]";
      const forecastData = JSON.parse(responseText.trim());

      // Add a log of forecast run
      db.logs.unshift({
        id: `l-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "Forecast Run",
        description: "Generated 30-day smart demand forecast utilizing Gemini LLM analytics",
        user: "System AI Agent"
      });
      saveDb(db);

      res.setHeader("x-ai-fallback", "false");
      return res.json(forecastData);
    } catch (err) {
      res.setHeader("x-ai-fallback", "true");
      res.setHeader("x-ai-quota-exceeded", "true");
      console.warn("Gemini Forecast API limit/quota exceeded or failed. Seamlessly routing to high-fidelity simulated demand prediction engine.");
    }
  } else {
    res.setHeader("x-ai-fallback", "true");
  }

  // High fidelity fallback/simulation forecasting output
  const simulationForecast = db.products.map(p => {
    // Approximate monthly sales based on items
    let baseSales = [15, 12, 19, 25, 30, 28];
    if (p.id === "prod-1") baseSales = [45, 65, 95, 110, 130, 155]; // Smart Sensors (Growing!)
    if (p.id === "prod-2") baseSales = [30, 45, 80, 95, 120, 110]; // Battery Packs
    if (p.id === "prod-3") baseSales = [80, 90, 100, 120, 115, 130]; // M8 Screws
    if (p.id === "prod-4") baseSales = [5, 12, 18, 25, 28, 32]; // Packaging Boxes
    if (p.id === "prod-5") baseSales = [200, 250, 310, 350, 400, 420]; // Bandages

    const avgSales = Math.round(baseSales.reduce((a, b) => a + b, 0) / baseSales.length);
    const predicted = Math.round(avgSales * (p.id === "prod-1" ? 1.25 : 1.05)); // Growth multiplier for sensors
    const needsReorder = (p.stockLevel - predicted) <= p.minStock;
    const reorderQty = needsReorder ? Math.max(0, Math.round(p.minStock * 2.5 - p.stockLevel + predicted)) : 0;

    let reasoning = `Steady historical sales of ~${avgSales} ${p.unit}/mo. Stable warehouse demand path.`;
    if (p.id === "prod-1") reasoning = `Sales rose 240% over 6 months. High demand predicted for Next-gen smart grid installations.`;
    if (p.id === "prod-2") reasoning = `Battery pack stock level (${p.stockLevel}) is dangerously below safety threshold of ${p.minStock}. Urgent reorder.`;
    if (p.id === "prod-4") reasoning = `Packaging supply depleted (Current: ${p.stockLevel}). Cardboard box demand spikes predicted for end-of-quarter shipping.`;

    return {
      productId: p.id,
      productName: p.name,
      currentStock: p.stockLevel,
      minStock: p.minStock,
      historicalSales: baseSales,
      predictedDemand: predicted,
      recommendedReorderQty: reorderQty,
      confidenceScore: p.id === "prod-1" ? 92 : 85,
      reasoning
    };
  });

  return res.json(simulationForecast);
});

// AI smart insights anomalies and opportunities
app.get("/api/ai/insights", async (req, res) => {
  const db = getDb();

  if (ai) {
    try {
      const prompt = `
        You are an elite operational efficiency and inventory intelligence agent.
        Analyze our current supply chain state:
        
        PRODUCTS:
        ${JSON.stringify(db.products.map(p => ({ name: p.name, stock: p.stockLevel, min: p.minStock, cost: p.cost, price: p.price, category: p.category })))}
        
        SUPPLIERS:
        ${JSON.stringify(db.suppliers)}
        
        PENDING PURCHASE ORDERS:
        ${JSON.stringify(db.purchaseOrders.filter(p => p.status !== "Completed"))}
        
        Generate exactly 4-5 high-value inventory insights, risk analyses, or opportunities (such as slow-moving capital lockups, supplier reliability risks based on performance scores under 80, upcoming low-stock bottlenecks, or pricing optimization gaps where margins can be boosted).
        
        Respond STRICTLY with a JSON array of insights matching this TypeScript interface:
        interface AIInsight {
          id: string;
          type: 'risk' | 'opportunity' | 'anomaly' | 'pricing';
          title: string;
          description: string;
          impactScore: number; // 0 to 100 rating of importance
          actionableStep: string; // Precise physical action the user can click or trigger to solve this
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                impactScore: { type: Type.NUMBER },
                actionableStep: { type: Type.STRING }
              },
              required: ["id", "type", "title", "description", "impactScore", "actionableStep"]
            }
          }
        }
      });

      const insights = JSON.parse((response.text || "[]").trim());
      res.setHeader("x-ai-fallback", "false");
      return res.json(insights);
    } catch (err) {
      res.setHeader("x-ai-fallback", "true");
      res.setHeader("x-ai-quota-exceeded", "true");
      console.warn("Gemini Insights API limit/quota exceeded or failed. Seamlessly routing to high-fidelity simulated operational intelligence engine.");
    }
  } else {
    res.setHeader("x-ai-fallback", "true");
  }

  // Pre-baked elite insights if AI key is offline
  const simulationInsights = [
    {
      id: "ins-1",
      type: "risk",
      title: "Supplier Risk Detected: Madurai Fasteners",
      description: "Madurai Fasteners & Alloys has a performance score of 71% (below 80% benchmark) with delayed order logs. Critical screws are stored here.",
      impactScore: 84,
      actionableStep: "Establish secondary supply line with Chennai Techtronics Fasteners division or audit Madurai SLA."
    },
    {
      id: "ins-2",
      type: "anomaly",
      title: "Working Capital Bottleneck: Medical Bandages",
      description: "Medical Bandages stock (1,200 boxes) exceeds safety levels. $2,520 in working capital is bound to slow-moving storage.",
      impactScore: 68,
      actionableStep: "Halt medical bandage intake and consider bundled sales promotion to accelerate stock rotation."
    },
    {
      id: "ins-3",
      type: "opportunity",
      title: "Pricing Gap: Smart IoT Temperature Sensors",
      description: "High demand growth (240% over 6 mo) and superior 94% supplier delivery. Margin is currently 54% ($11.50 cost vs $24.99 retail).",
      impactScore: 78,
      actionableStep: "Consider raising retail price by 10% to $27.49. High demand velocity shows extreme price inelasticity."
    },
    {
      id: "ins-4",
      type: "anomaly",
      title: "Upcoming Packaging Stock Depletion",
      description: "Recycled corrugated box supply is at 8 packs. Normal fulfillment of electronic shipments will halt within 48 hours without shipping containers.",
      impactScore: 95,
      actionableStep: "Draft urgent Purchase Order to Kovai Sustainable Packaging for 100 boxes immediately."
    }
  ];

  return res.json(simulationInsights);
});

// AI Interactive Copilot Chat
app.post("/api/ai/chat", async (req, res) => {
  const { messages } = req.body;
  const db = getDb();

  // Create robust prompt context with full current DB state and Tamil Nadu places directory
  const systemInstruction = `
    You are an expert full-stack "AI Inventory Management Copilot". You have real-time visibility and transaction power over the warehouse inventory system.
    
    CURRENT INVENTORY SYSTEM STATE:
    - Products: ${JSON.stringify(db.products.map(p => ({ id: p.id, name: p.name, SKU: p.sku, stock: p.stockLevel, unit: p.unit, min: p.minStock, price: p.price, cost: p.cost, supplierId: p.supplierId })))}
    - Suppliers: ${JSON.stringify(db.suppliers.map(s => ({ id: s.id, name: s.name, contact: s.contactName, score: s.performanceScore, rating: s.rating, category: s.category })))}
    - Pending Purchase Orders: ${JSON.stringify(db.purchaseOrders.filter(po => po.status !== "Completed"))}
    - Warehouses: ${JSON.stringify(db.warehouses.map(w => ({ id: w.id, name: w.name, capacity: w.capacity, used: w.usedSpace, location: w.location })))}

    TAMIL NADU DISTRICTS AND PLACES NETWORK STATE:
    We track and manage industrial projects, factories, and warehouses across all 38 districts of Tamil Nadu, India, categorized in 5 zones:
    - North TN: Chennai (Guindy SIDCO, Ambattur Complex, Ennore), Kanchipuram (Sriperumbudur SIPCOT, Irungattukottai), Tiruvallur (Oragadam Auto Hub), Ranipet (Ranipet SIPCOT), Vellore (Katpadi SIDCO), Chengalpattu (Maraimalai Nagar, Mahindra World City), Tiruvannamalai (Cheyyar SIPCOT), Tirupathur (Vaniyambadi Leather Cluster).
    - West TN: Coimbatore (Peelamedu Tech Zone, Kurichi SIDCO, Sulur Engineering), Tiruppur (Nethaji Apparel Park, Palladam Hi-Tech Weaving), Erode (Perundurai SIPCOT), Salem (Karuppur Industrial Complex, Magnesite Mines), Namakkal (Poultry Zone, Feed Mills), Nilgiris (Coonoor Tea Estates), Krishnagiri (Hosur SIPCOT), Dharmapuri (Laligam Industrial Area).
    - South TN: Madurai (Kappalur Industrial Estate, Melur Agriculture Hub), Thoothukudi (Meelavittan SIPCOT), Tirunelveli (Gangaikondan SIPCOT), Kanyakumari (Nagercoil Coir Cluster), Virudhunagar (Sivakasi Printing Estate, Fireworks), Dindigul (Dindigul Lock Cluster), Ramanathapuram (Sayalkudi Salt Zone), Sivagangai (Karaikudi SIDCO), Theni (Bodinayakanur Spices), Tenkasi (Shencottai Agro Area).
    - Central TN: Tiruchirappalli (Thuvakudi Heavy Industrial Area, Ariyamangalam SIDCO), Karur (Puliyur Cement & Textiles, Bus Bodybuilding), Ariyalur (Ariyalur Cement Area), Perambalur (Elambalur SIDCO), Villupuram (Vandipalayam SIDCO), Kallakurichi (Ulundurpet SIDCO).
    - East TN: Thanjavur (Sengipatti SIPCOT), Nagapattinam (Nagore Marine Cluster), Tiruvarur (Mannargudi Agro Area), Mayiladuthurai (Sirkazhi Fishery Zone), Cuddalore (SIPCOT Cuddalore).

    CRITICAL RULES:
    1. Provide direct, highly professional, precise operational guidance. No fluff, no robotic filler text.
    2. Answer questions accurately based ONLY on the provided system state.
    3. You can perform "INTELLIGENT ACTIONS". If the user asks you to:
       - Draft a purchase order (e.g., "Order 50 batteries from GlobalTech", "Reorder low stock packaging from EcoPack").
       - Adjust/restock stock (e.g. "Add 50 screws to stock", "Manually increment battery stock by 10").
       - Transfer stock between warehouses.
       Provide the direct text answer AND attach a structured, JSON-parseable Action block in your response.
       
    To trigger an action, embed a code block with the language "action-json" containing:
    \`\`\`action-json
    {
      "action": "DRAFT_PO" | "UPDATE_STOCK" | "TRANSFER_STOCK",
      "payload": { ... }
    }
    \`\`\`

    - DRAFT_PO payload layout:
      { "supplierId": "sup-1", "items": [{ "productId": "prod-2", "qty": 100 }] }
    - UPDATE_STOCK payload layout:
      { "productId": "prod-1", "newStock": 150 }
    - TRANSFER_STOCK payload layout:
      { "productId": "prod-3", "fromWhId": "wh-1", "toWhId": "wh-2", "qty": 50 }

    Keep the conversational tone helpful and focused. Be ready to write actions!
  `;

  const runLocalFallback = () => {
    const lastUserMsg = messages[messages.length - 1].content.toLowerCase();
    let responseText = "Our AI processing unit is currently running in local backup mode. Let me help you coordinate operations:";
    let action: any = null;

    if (lastUserMsg.includes("tamil") || lastUserMsg.includes("place") || lastUserMsg.includes("factory") || lastUserMsg.includes("industry")) {
      responseText = `### 🏢 Tamil Nadu Complete Industrial Places & Factory Directory
Here is a comprehensive directory of the industrial hubs, SIPCOTs, SIDCOs, and factory clusters across all 38 districts of Tamil Nadu:

| Zone | District | Major Industrial Hub / SIPCOT / SIDCO | Primary Factory Name | Status |
| :--- | :--- | :--- | :--- | :--- |
| **North** | Chennai | Guindy SIDCO, Ambattur Complex, Ennore | Guindy Precision Tools, Ambattur Heavy Machineries | Active |
| | Kanchipuram | Sriperumbudur SIPCOT, Irungattukottai | Sriperumbudur Assembly Line, Silk Looms | Active |
| | Tiruvallur | Oragadam Auto Hub, Gummidipoondi | Oragadam EV Plant, Auto Ancillaries | Active |
| | Ranipet | Ranipet SIPCOT, BHEL Auxiliaries | Ranipet Boiler Auxiliaries | Active |
| | Vellore | Katpadi SIDCO Estate | Katpadi Leather Tannery Unit 4 | Active |
| | Chengalpattu | Maraimalai Nagar, Mahindra World City | MM Nagar Auto Ancillary Unit 12 | Active |
| | Tiruvannamalai | Cheyyar SIPCOT, SEZ Complex | Cheyyar Footwear SEZ Complex | Active |
| | Tirupathur | Vaniyambadi Leather, Ambur Cluster | Vaniyambadi Tannery Unit | Proposed |
| **West** | Coimbatore | Peelamedu Tech Zone, Kurichi SIDCO, Sulur | Peelamedu Smart Motors, Kurichi Castings | Active |
| | Tiruppur | Nethaji Apparel Park, Palladam Hi-Tech | Nethaji Knitwear Factory, Palladam Loom | Active |
| | Erode | Perundurai SIPCOT | Perundurai Bio-Chemicals | Active |
| | Salem | Karuppur Industrial Complex, Magnesite | Karuppur Steel Rolling Unit 1 | Active |
| | Namakkal | Namakkal Poultry Zone | Namakkal Feed Mill | Active |
| | Nilgiris | Coonoor Tea Estates | Coonoor Tea Packaging | Active |
| | Krishnagiri | Hosur SIPCOT | Hosur Electronics Plant | Active |
| | Dharmapuri | Laligam Industrial Area | Laligam Agro Processing | Proposed |
| **South** | Madurai | Kappalur Industrial Estate, Melur Hub | Kappalur Polymers Ltd, Melur Agri Foods | Active |
| | Thoothukudi | Meelavittan SIPCOT | Meelavittan Chemical Processing | Active |
| | Tirunelveli | Gangaikondan SIPCOT | Gangaikondan Cement Plant | Active |
| | Kanyakumari | Nagercoil Coir Cluster | Nagercoil Fiber Mills | Active |
| | Virudhunagar | Sivakasi Printing Estate, Fireworks | Sivakasi Offset Presses | Active |
| | Dindigul | Dindigul Lock Cluster, Leather Tanning | Dindigul Metallic Lock Works | Active |
| | Ramanathapuram | Sayalkudi Salt Zone | Sayalkudi Marine Refining | Proposed |
| | Sivagangai | Karaikudi SIDCO | Karaikudi Graphite Unit | Proposed |
| | Theni | Bodinayakanur Spices | Bodi Cardamom Sorting | Proposed |
| | Tenkasi | Shencottai Agro Area | Shencottai Distilleries | Proposed |
| **Central**| Tiruchirappalli | Thuvakudi Heavy Industrial Area, Ariyamangalam | Thuvakudi Boilers & Alloys | Active |
| | Karur | Puliyur Cement & Textiles, Bus Bodybuilding | Puliyur Loom Unit | Active |
| | Ariyalur | Ariyalur Cement Area | Ariyalur Cement Factory Panel B | Active |
| | Perambalur | Elambalur SIDCO | Elambalur Starch Unit | Proposed |
| | Villupuram | Vandipalayam SIDCO | Vandipalayam Sugar Plant | Proposed |
| | Kallakurichi | Ulundurpet SIDCO | Ulundurpet Flour Mills | Proposed |
| **East** | Thanjavur | Sengipatti SIPCOT | Sengipatti Agro Hub | Proposed |
| | Nagapattinam| Nagore Marine Cluster | Nagore Seafood Canning Unit A | Proposed |
| | Tiruvarur | Mannargudi Agro Area | Mannargudi Modern Rice Mill | Proposed |
| | Mayiladuthurai| Sirkazhi Fishery Zone | Sirkazhi Cold Storage Complex | Proposed |
| | Cuddalore | SIPCOT Cuddalore | Cuddalore Pharma Complex | Active |

Feel free to ask me to draft a purchase order or plan transfers between any of these places!`;
    } else if (lastUserMsg.includes("low") || lastUserMsg.includes("alert")) {
      const lowStockItems = db.products.filter(p => p.stockLevel < p.minStock);
      responseText = `We currently have **${lowStockItems.length} items** below critical safety stock thresholds:\n\n` +
        lowStockItems.map(p => `- **${p.name}** (${p.sku}): Current **${p.stockLevel}**, Min Threshold is **${p.minStock}**`).join("\n") +
        `\n\nWould you like me to draft a restock purchase order for these items?`;
    } else if (lastUserMsg.includes("draft") || lastUserMsg.includes("po") || lastUserMsg.includes("purchase order")) {
      responseText = `I have automatically analyzed supplier performance metrics and drafted a Purchase Order for depletion recovery:

**Draft Purchase Order PO-103**
- **Supplier**: Chennai Techtronics Pvt Ltd
- **Delivery Target**: 5-7 working days
- **Items**: 
  - 100x Lithium Polymer Battery 3000mAh ($5.20 cost ea)
  - 150x Apex 32-bit Microcontroller Chip ($3.10 cost ea)
- **Total Estimated Value**: **$985.00**

I've prepared the transaction block. Click **Confirm Order Draft** below to dispatch this order directly to Karthik Raja!`;

      action = {
        action: "DRAFT_PO",
        payload: {
          supplierId: "sup-1",
          items: [
            { productId: "prod-2", qty: 100, cost: 5.20 },
            { productId: "prod-6", qty: 150, cost: 3.10 }
          ]
        }
      };
    } else if (lastUserMsg.includes("transfer") || lastUserMsg.includes("move")) {
      responseText = `Prepared stock movement transaction. I'm moving 100 units of M8 Screws from Coimbatore Depot (Coimbatore) to Chennai Mega Hub (Chennai) to meet upcoming manufacturing surges. Check the transfer card below.`;
      action = {
        action: "TRANSFER_STOCK",
        payload: {
          productId: "prod-3",
          fromWhId: "wh-2",
          toWhId: "wh-1",
          qty: 100
        }
      };
    } else if (lastUserMsg.includes("valuation") || lastUserMsg.includes("value") || lastUserMsg.includes("inventory")) {
      const totalVal = db.products.reduce((acc, p) => acc + p.stockLevel * p.cost, 0);
      const totalItems = db.products.reduce((acc, p) => acc + p.stockLevel, 0);
      responseText = `**Inventory Valuation & Asset Report:**\n\n` +
        `- **Total Stocked Assets**: **${totalItems.toLocaleString()}** items across all divisions.\n` +
        `- **Total Asset Valuation (Cost-basis)**: **$${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**\n` +
        `- **Active Warehouse Footprint**: Chennai Mega Hub is currently running at **36% capacity**; Coimbatore Depot is at **26% capacity**.\n\nEverything looks optimal outside of the ${db.products.filter(p => p.stockLevel < p.minStock).length} pending stock low alerts.`;
    } else {
      responseText = `Welcome back! I am your **AI Inventory Agent (Tamil Nadu Service)**. I monitor Tamil Nadu supply lines and warehouse logistics.

Here is what you can ask me:
1. *"Which products are low in stock?"*
2. *"Draft a purchase order for battery packs"*
3. *"Show a valuation of our physical inventory"*
4. *"Transfer M8 Screws to Chennai Mega Hub"*
5. *"Show me the whole Tamil Nadu places, industries, and factories"*`;
    }

    return { content: responseText, action };
  };

  if (ai) {
    try {
      // Map frontend message objects to Gemini SDK contents format
      const contents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      // Get last message as input, we pass the previous history to recreate chat state if needed
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          ...contents
        ],
        config: {
          temperature: 0.2
        }
      });

      const responseText = response.text || "";
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      // Scan responseText for action blocks and parse them to pass back in structured format
      let action = null;
      const jsonMatch = responseText.match(/```action-json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          action = JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          console.error("Failed to parse embedded Action JSON from response:", e);
        }
      }

      res.setHeader("x-ai-fallback", "false");
      return res.json({
        content: responseText.replace(/```action-json[\s\S]*?```/g, "").trim(), // Strip raw JSON codeblock from final text
        action: action
      });
    } catch (err: any) {
      res.setHeader("x-ai-fallback", "true");
      res.setHeader("x-ai-quota-exceeded", "true");
      console.warn("Gemini Chat API limit/quota exceeded or failed. Seamlessly routing to offline copilot simulator.");
      const fallbackResult = runLocalFallback();
      return res.json(fallbackResult);
    }
  }

  // Key is missing, run normal local simulation
  res.setHeader("x-ai-fallback", "true");
  const fallbackResult = runLocalFallback();
  return res.json(fallbackResult);
});

// VITE MIDDLEWARE & STATIC ASSET HANDLERS
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Inventory Agent server booting at http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
