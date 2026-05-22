import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // In-Memory Database Simulation for Demo Purposes
  const db = {
    inventory: [
      { id: "OXY-10-TAB", name: "OxyContin 10mg", category: "NARKOTIKA", batch: "BT-492-A", expiry: "2025-11", stock: 57, isSipnap: true, price: 55000 },
      { id: "AMX-500-CAP", name: "Amoxicillin 500mg", category: "ANTIBIOTIC", batch: "BT-110-C", expiry: "2026-02", stock: 135, isSipnap: false, price: 12000 },
      { id: "PAR-500-TAB", name: "Paracetamol 500mg", category: "OTC", batch: "BT-882-X", expiry: "2027-08", stock: 750, isSipnap: false, price: 3500 },
      { id: "DZP-005-N", name: "Diazepam 5mg Tab", category: "PSIKOTROPIKA", batch: "BT-DZP-9", expiry: "2025-05", stock: 35, isSipnap: true, price: 45000 }
    ],
    shifts: [],
    transactions: [],
    pos: [],
    fakturs: [] as any[],
    opnameSessions: [] as any[],
    inventoryLogs: [
      {
        id: "LOG-1",
        itemId: "OXY-10-TAB",
        userId: "Budi Darmawan",
        userRole: "Manager",
        timestamp: "2026-05-20T14:30:00Z",
        type: "TERJUAL",
        oldStock: 59,
        newStock: 57,
        reason: "Transaksi POS #TRX-90123"
      }
    ],
    posData: [] as any[],
    conversions: [
      { id: "conv-1", name: "Type A", rule: "1 Box = 10 Strips = 100 Tabs" },
      { id: "conv-2", name: "Type B", rule: "1 Botol = 60ml" }
    ],
    accounts: [
      { id: "A01", name: "Budi Darmawan", role: "Manager" },
      { id: "A02", name: "Siti Aminah", role: "Pengelola Apotek" },
      { id: "A03", name: "Andi Saputra", role: "Staff" }
    ],
    pbf: [
      { id: "VEND-201", name: "PT Hwato Traditional Farma", sales: "", phone: "", license: "", address: "", isApproved: true },
      { id: "VEND-202", name: "PT Bina San Prima", sales: "", phone: "", license: "", address: "", isApproved: true },
      { id: "VEND-203", name: "PT Anugerah Pharmindo Lestari", sales: "", phone: "", license: "", address: "", isApproved: true },
      { id: "VEND-204", name: "PT Enseval Putera Megatrading", sales: "", phone: "", license: "", address: "", isApproved: true }
    ]
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/conversions", (req, res) => {
    res.json(db.conversions);
  });

  app.post("/api/conversions", (req, res) => {
    const { name, rule, besar, sedang_qty, sedang, kecil_qty, kecil } = req.body;
    const newConv = { id: `conv-${Date.now()}`, name, rule, besar, sedang_qty, sedang, kecil_qty, kecil };
    db.conversions.push(newConv);
    res.json(newConv);
  });

  app.put("/api/conversions/:id", (req, res) => {
    const { id } = req.params;
    const { name, rule, besar, sedang_qty, sedang, kecil_qty, kecil } = req.body;
    const index = db.conversions.findIndex(item => item.id === id);
    if (index !== -1) {
      db.conversions[index] = { ...db.conversions[index], name, rule, besar, sedang_qty, sedang, kecil_qty, kecil };
      res.json(db.conversions[index]);
    } else {
      res.status(404).json({ error: "Conversion not found" });
    }
  });

  app.delete("/api/conversions/:id", (req, res) => {
    const { id } = req.params;
    db.conversions = db.conversions.filter(item => item.id !== id);
    res.json({ success: true });
  });

  app.get("/api/accounts", (req, res) => {
    res.json(db.accounts);
  });

  app.post("/api/accounts", (req, res) => {
    const { name, role } = req.body;
    const newAcc = { id: `A0${db.accounts.length + 1}`, name, role };
    db.accounts.push(newAcc);
    res.json(newAcc);
  });

  app.put("/api/accounts/:id", (req, res) => {
    const { id } = req.params;
    const { name, role } = req.body;
    const index = db.accounts.findIndex(item => item.id === id);
    if (index !== -1) {
      db.accounts[index] = { ...db.accounts[index], name, role };
      res.json(db.accounts[index]);
    } else {
      res.status(404).json({ error: "Account not found" });
    }
  });

  app.delete("/api/accounts/:id", (req, res) => {
    const { id } = req.params;
    db.accounts = db.accounts.filter(item => item.id !== id);
    res.json({ success: true });
  });

  app.get("/api/inventory", (req, res) => {
    res.json(db.inventory);
  });
  
  app.post("/api/inventory", (req, res) => {
    const { name, category, type } = req.body;
    const newDrug = {
      id: `DRG-${Date.now()}`,
      name,
      category: category || "OTC",
      type: type || "Tablet",
      batch: "N/A",
      expiry: "2026-12",
      stock: 0,
      isSipnap: false,
      price: 0
    };
    db.inventory.push(newDrug);
    res.json(newDrug);
  });


  
  app.put("/api/inventory/:id", (req, res) => {
    const { id } = req.params;
    const { name, type } = req.body;
    const index = db.inventory.findIndex(item => item.id === id);
    if (index !== -1) {
      db.inventory[index] = { ...db.inventory[index], name, type };
      res.json(db.inventory[index]);
    } else {
      res.status(404).json({ error: "Drug not found" });
    }
  });

  app.put("/api/inventory/:id/stock", (req, res) => {
    const { id } = req.params;
    const { stock, userRole, userId, reason } = req.body;
    
    const index = db.inventory.findIndex(item => item.id === id);
    if (index !== -1) {
      const item = db.inventory[index];
      const oldTotal = item.stock;
      const newTotal = Number(stock);

      db.inventoryLogs.push({
        id: `LOG-${Date.now()}`,
        itemId: id,
        userId: userId || "Unknown",
        userRole: userRole || "Staff",
        timestamp: new Date().toISOString(),
        type: newTotal >= oldTotal ? "IN" : "OUT",
        oldStock: oldTotal,
        newStock: newTotal,
        reason: reason || "Manual adjustment"
      });

      db.inventory[index] = { ...item, stock: Number(stock) };
      res.json(db.inventory[index]);
    } else {
      res.status(404).json({ error: "Drug not found" });
    }
  });

  app.get("/api/inventory/:id/logs", (req, res) => {
    const logs = db.inventoryLogs.filter((l: any) => l.itemId === req.params.id);
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(logs);
  });

  app.delete("/api/inventory/:id", (req, res) => {
    const { id } = req.params;
    db.inventory = db.inventory.filter(item => item.id !== id);
    res.json({ success: true });
  });

  app.get("/api/opname", (req, res) => {
    // Return sessions sorted by date desc
    const sorted = [...db.opnameSessions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(sorted);
  });

  app.post("/api/opname", (req, res) => {
    const { userId, userRole, items, sessionNotes } = req.body;
    
    const opnameSession = {
      id: `OPN-${Date.now()}`,
      userId,
      userRole,
      timestamp: new Date().toISOString(),
      items: items,
      notes: sessionNotes || "Stok Opname Rutin"
    };

    db.opnameSessions.push(opnameSession);

    for (const item of items) {
      const index = db.inventory.findIndex(i => i.id === item.itemId);
      if (index !== -1) {
        const invItem = db.inventory[index];
        const oldTotal = invItem.stock;
        const newTotal = item.newStock;

        if (oldTotal !== newTotal) {
           db.inventory[index] = { ...invItem, stock: item.newStock };

           db.inventoryLogs.push({
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            itemId: item.itemId,
            userId: userId || "Unknown",
            userRole: userRole || "Manager",
            timestamp: opnameSession.timestamp,
            type: "OPNAME",
            oldStock: oldTotal,
            newStock: newTotal,
            reason: `Stok Opname ${opnameSession.id} - ${item.notes || ''}`
          });
        }
      }
    }

    res.json(opnameSession);
  });

  app.get("/api/pbf", (req, res) => {
    res.json(db.pbf);
  });

  app.post("/api/pbf", (req, res) => {
    const newPbf = {
      id: `VEND-${200 + db.pbf.length + 1}`,
      name: req.body.name,
      sales: req.body.sales || "",
      phone: req.body.phone || "",
      license: req.body.license || "",
      address: req.body.address || "",
      isApproved: true
    };
    db.pbf.push(newPbf);
    res.json(newPbf);
  });

  app.put("/api/pbf/:id", (req, res) => {
    const index = db.pbf.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "PBF not found" });
    
    db.pbf[index] = {
      ...db.pbf[index],
      name: req.body.name || db.pbf[index].name,
      sales: req.body.sales !== undefined ? req.body.sales : db.pbf[index].sales,
      phone: req.body.phone !== undefined ? req.body.phone : db.pbf[index].phone,
      license: req.body.license !== undefined ? req.body.license : db.pbf[index].license,
      address: req.body.address !== undefined ? req.body.address : db.pbf[index].address,
    };
    res.json(db.pbf[index]);
  });

  app.delete("/api/pbf/:id", (req, res) => {
    const index = db.pbf.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "PBF not found" });
    
    db.pbf.splice(index, 1);
    res.json({ success: true });
  });

  app.post("/api/checkout", (req, res) => {
    // Basic mock checkout handling
    const { items, patient, doctor, sip } = req.body;
    const hasSipnap = items.some((item: any) => item.isSipnap);
    if (hasSipnap && (!patient || !doctor || !sip)) {
      return res.status(400).json({ error: "Missing mandatory regulatory data for Narkotika/Psikotropika." });
    }
    res.json({ success: true, transactionId: "TRX-" + Date.now() });
  });

  app.post("/api/po", (req, res) => {
    const po = {
      id: "PO-" + Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    db.posData.push(po);
    res.json(po);
  });

  app.get("/api/po", (req, res) => {
    res.json(db.posData);
  });

  app.post("/api/upload-faktur", (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "No image provided" });
    const id = `FAKTUR-${Date.now()}`;
    db.fakturs.push({ id, data: imageBase64 });
    res.json({ id, url: `/api/faktur/${id}` });
  });

  app.get("/api/faktur/:id", (req, res) => {
    const faktur = db.fakturs.find((f: any) => f.id === req.params.id);
    if (!faktur) return res.status(404).json({ error: "Faktur not found" });
    
    // Send as JSON data instead of raw image buffer for simplicity
    res.json({ id: faktur.id, data: faktur.data });
  });

  app.get("/api/pareto", (req, res) => {
    const { startDate, endDate } = req.query;
    
    let items = db.inventory.map((item, index) => {
      let qtySold = 0;
      if (item.id === "OXY-10-TAB") qtySold = 1500; 
      else if (item.id === "PAR-500-TAB") qtySold = 850; 
      else if (item.id === "AMX-500-CAP") qtySold = 300; 
      else if (item.id === "DZP-005-N") qtySold = 50; 
      else qtySold = Math.floor(Math.random() * 100);

      const revenue = qtySold * item.price;
      return {
        ...item,
        qtySold,
        revenue
      };
    });

    items.sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0);
    
    let cumulativeRevenue = 0;
    items = items.map(item => {
      cumulativeRevenue += item.revenue;
      const cumulativePercent = (cumulativeRevenue / totalRevenue) * 100;
      let cls = 'C';
      if (cumulativePercent <= 80) cls = 'A';
      else if (cumulativePercent <= 95) cls = 'B';
      
      return { ...item, cumulativePercent, class: cls };
    });

    res.json({
      startDate,
      endDate,
      totalRevenue,
      items
    });
  });

  app.post("/api/gemini/insights", async (req, res) => {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: req.body.prompt || "Berikan ringkasan singkat tentang performa penjualan apotek hari ini",
        config: { systemInstruction: "You are a professional pharmacy analyst." }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate insights" });
    }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: req.body.message || "Hi",
        config: { systemInstruction: "Anda adalah asisten virtual Medisync ERP, sistem manajemen apotek yang ramah." }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate chat response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
