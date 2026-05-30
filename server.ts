import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Database
  const db = {
    inventory: [] as any[],
    shifts: [],
    pos: [],
    fakturs: [] as any[],
    opnameSessions: [] as any[],
    inventoryLogs: [] as any[],
    auditLogs: [] as any[],
    posData: [] as any[],
    conversions: [] as any[],
    accounts: [
      { id: "A01", name: "Budi Darmawan", role: "Manager", username: "manager", password: "password123" },
      { id: "A02", name: "Siti Aminah", role: "Pengelola Apotek", username: "pengelola", password: "password123" },
      { id: "A03", name: "Andi Saputra", role: "Staff", username: "staff", password: "password123" }
    ] as any[],
    transactions: [] as any[],
    patients: [] as any[],
    pbf: [] as any[],
    embalase: [] as any[],
    targets: {
      shift: 2500000,
      day: 5000000,
      month: 150000000,
      quarter: 450000000,
      year: 1800000000
    }
  };

  // helper for audit logging
  const logAudit = (actor: string, action: string, detail: string) => {
    db.auditLogs.unshift({
      id: "AL" + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      actor,
      action,
      detail
    });
  };

  // API Routes
  app.get("/api/audit-logs", (req, res) => {
    res.json(db.auditLogs);
  });

  app.get("/api/targets", (req, res) => {
    res.json(db.targets);
  });
  
  app.put("/api/targets", (req, res) => {
    db.targets = { ...db.targets, ...req.body };
    res.json(db.targets);
  });

  // Embalase Settings
  app.get("/api/embalase", (req, res) => {
    res.json(db.embalase);
  });
  
  app.put("/api/embalase", (req, res) => {
    db.embalase = req.body;
    const actor = req.headers['x-actor'] as string || 'Anonym';
    logAudit(actor, "UPDATE_EMBALASE", "Memperbarui data dan harga Embalase/Kemasan.");
    res.json(db.embalase);
  });

  app.post("/api/embalase", (req, res) => {
    const newEmbalase = {
      id: `EMB-${Date.now()}`,
      name: req.body.name,
      price: Number(req.body.price)
    };
    db.embalase.push(newEmbalase);
    const actor = req.headers['x-actor'] as string || 'Anonym';
    logAudit(actor, "ADD_EMBALASE", `Menambah Embalase baru: ${newEmbalase.name} (Rp ${newEmbalase.price})`);
    res.json(newEmbalase);
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/patients", (req, res) => {
    res.json(db.patients);
  });

  app.post("/api/patients", (req, res) => {
    const newPatient = {
      id: `PAT-${Date.now()}`,
      nik: req.body.nik || "",
      name: req.body.name || "",
      address: req.body.address || ""
    };
    db.patients.push(newPatient);
    res.json(newPatient);
  });

  app.put("/api/patients/:id", (req, res) => {
    const index = db.patients.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
      db.patients[index] = { ...db.patients[index], nik: req.body.nik, name: req.body.name, address: req.body.address };
      res.json(db.patients[index]);
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  });

  app.delete("/api/patients/:id", (req, res) => {
    const index = db.patients.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
      db.patients.splice(index, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Patient not found" });
    }
  });

  app.get("/api/shift/summary", (req, res) => {
    let totalSales = 0;
    let transactionCount = 0;
    if (db.transactions.length > 0) {
       totalSales += db.transactions.reduce((acc, curr) => acc + curr.total, 0);
       transactionCount += db.transactions.length;
    }
    res.json({
      totalSales: totalSales,
      transactionCount: transactionCount,
      cashDifference: 0
    });
  });

  app.get("/api/shift/transactions", (req, res) => {
    res.json(db.transactions);
  });

  app.get("/api/conversions", (req, res) => {
    res.json(db.conversions);
  });

  app.post("/api/conversions", (req, res) => {
    const { name, rule, besar, sedang_qty, sedang, kecil_qty, kecil } = req.body;
    const newConv = { id: `conv-${Date.now()}`, name, rule, besar, sedang_qty, sedang, kecil_qty, kecil };
    db.conversions.push(newConv);
    const actor = req.headers['x-actor'] as string || 'Anonym';
    logAudit(actor, "ADD_DRUG_MASTER", `Menambahkan master obat baru: ${name}`);
    res.json(newConv);
  });

  app.put("/api/conversions/:id", (req, res) => {
    const { id } = req.params;
    const { name, rule, besar, sedang_qty, sedang, kecil_qty, kecil } = req.body;
    const actor = req.headers['x-actor'] as string || 'Anonym';
    const index = db.conversions.findIndex(item => item.id === id);
    if (index !== -1) {
      db.conversions[index] = { ...db.conversions[index], name, rule, besar, sedang_qty, sedang, kecil_qty, kecil };
      logAudit(actor, "EDIT_DRUG_MASTER", `Mengubah data/harga master obat: ${name}`);
      res.json(db.conversions[index]);
    } else {
      res.status(404).json({ error: "Conversion not found" });
    }
  });

  app.delete("/api/conversions/:id", (req, res) => {
    const { id } = req.params;
    const actor = req.headers['x-actor'] as string || 'Anonym';
    const conv = db.conversions.find(c => c.id === id);
    if (conv) {
      logAudit(actor, "DELETE_DRUG_MASTER", `Menghapus master obat: ${conv.name}`);
      db.conversions = db.conversions.filter(item => item.id !== id);
    }
    res.json({ success: true });
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const account = db.accounts.find(a => a.username === username && a.password === password);
    if (account) {
      res.json({ success: true, user: account });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  });

  app.get("/api/accounts", (req, res) => {
    res.json(db.accounts);
  });

  app.post("/api/accounts", (req, res) => {
    const { name, role, username, password } = req.body;
    const actor = req.headers['x-actor'] as string || 'Anonym';
    // Check if username exists
    if (db.accounts.some(a => a.username === username)) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const newAcc = { id: `A0${db.accounts.length + 1}`, name, role, username, password };
    db.accounts.push(newAcc);
    logAudit(actor, "ADD_ACCOUNT", `Menambahkan akun baru: ${username} (${role})`);
    res.json(newAcc);
  });

  app.put("/api/accounts/:id", (req, res) => {
    const { id } = req.params;
    const { name, role, username, password } = req.body;
    const actor = req.headers['x-actor'] as string || 'Anonym';
    const index = db.accounts.findIndex(item => item.id === id);
    if (index !== -1) {
      const oldRole = db.accounts[index].role;
      // Check if new username conflicts with another existing account
      if (username !== db.accounts[index].username && db.accounts.some(a => a.username === username)) {
        return res.status(400).json({ error: "Username already exists" });
      }
      db.accounts[index] = { ...db.accounts[index], name, role, username, password: password || db.accounts[index].password };
      if (oldRole !== role) {
         logAudit(actor, "CHANGE_ACCOUNT_ROLE", `Mengubah peran ${username} dari ${oldRole} menjadi ${role}`);
      } else {
         logAudit(actor, "EDIT_ACCOUNT", `Memperbarui data akun: ${username}`);
      }
      res.json(db.accounts[index]);
    } else {
      res.status(404).json({ error: "Account not found" });
    }
  });

  app.delete("/api/accounts/:id", (req, res) => {
    const { id } = req.params;
    const actor = req.headers['x-actor'] as string || 'Anonym';
    const account = db.accounts.find(a => a.id === id);
    if (account) {
       logAudit(actor, "DELETE_ACCOUNT", `Menghapus akun: ${account.username}`);
       db.accounts = db.accounts.filter(item => item.id !== id);
    }
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
    const { items, patient, doctor, sip, paymentMethod } = req.body;
    const hasSipnap = items.some((item: any) => item.isSipnap);
    if (hasSipnap && (!patient || !doctor || !sip)) {
      return res.status(400).json({ error: "Missing mandatory regulatory data for Narkotika/Psikotropika." });
    }

    // Deduct stock
    let totalValue = 0;
    for (const item of items) {
      totalValue += (item.price || 0) * (Number(item.qty) || 0);
      const index = db.inventory.findIndex(inv => inv.id === item.id);
      if (index !== -1) {
        db.inventory[index].stock = Math.max(0, db.inventory[index].stock - (Number(item.qty) || 0));
        
        // Log the transaction
        db.inventoryLogs.push({
          id: `LOG-TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          itemId: item.id,
          userId: "System",
          userRole: "POS",
          timestamp: new Date().toISOString(),
          type: "OUT",
          oldStock: db.inventory[index].stock + (Number(item.qty) || 0),
          newStock: db.inventory[index].stock,
          reason: `Terjual via POS (${paymentMethod || 'Cash'})`
        });
      }
    }

    const trxId = "TRX-" + Date.now();
    db.transactions.push({
      id: trxId,
      timestamp: new Date().toISOString(),
      items: items.map((i: any) => ({ itemId: i.id, name: i.name, qty: i.qty, price: i.price })),
      total: totalValue,
      paymentMethod: paymentMethod || "Cash",
      patient: patient || "General",
      doctor: doctor || "",
    });

    res.json({ success: true, transactionId: trxId, paymentMethod });
  });

  app.post("/api/inventory/faktur", (req, res) => {
    const { items, poId, supplier, fakturId } = req.body;
    
    // Process each item in the faktur
    for (const item of items) {
      if (!item.kode || item.jumlah <= 0) continue;
      
      const index = db.inventory.findIndex((inv: any) => inv.id === item.kode);
      if (index !== -1) {
        const oldStock = db.inventory[index].stock;
        const newStock = oldStock + Number(item.jumlah);
        
        db.inventory[index].stock = newStock;
        
        // Log the transaction
        db.inventoryLogs.push({
          id: `LOG-FAK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          itemId: item.kode,
          userId: "System",
          userRole: "Inventory",
          timestamp: new Date().toISOString(),
          type: "IN",
          oldStock: oldStock,
          newStock: newStock,
          reason: `Penerimaan Faktur ${fakturId || ''} (PO: ${poId || ''}) dari ${supplier || ''}`
        });
      }
    }
    
    // Update PO status to received
    if (poId) {
      const poIndex = db.posData.findIndex((p: any) => p.id === poId);
      if (poIndex !== -1) {
        db.posData[poIndex].status = "RECEIVED";
        db.posData[poIndex].fakturId = fakturId;
        db.posData[poIndex].receivedAt = new Date().toISOString();
      }
    }
    
    res.json({ success: true, message: "Faktur processed successfully" });
  });

  app.get("/api/po/:id/history", (req, res) => {
    const poId = req.params.id;
    const logs = db.inventoryLogs.filter((log: any) => log.reason.includes(`(PO: ${poId})`) || log.reason.includes(`Retur PO ${poId}`));
    
    // Attach item name for better context
    const enrichedLogs = logs.map((log: any) => {
      const invItem = db.inventory.find((i: any) => i.id === log.itemId);
      return { ...log, itemName: invItem ? invItem.name : "Unknown Item" };
    });
    
    res.json(enrichedLogs);
  });

  app.post("/api/po", (req, res) => {
    const po = {
      id: "PO-" + Date.now(),
      status: "PENDING",
      ...req.body,
      createdAt: new Date().toISOString()
    };
    db.posData.push(po);
    res.json(po);
  });

  app.post("/api/po/:id/retur", (req, res) => {
    const poId = req.params.id;
    const { reason } = req.body;
    
    const poIndex = db.posData.findIndex((p: any) => p.id === poId);
    if (poIndex === -1) return res.status(404).json({ error: "PO not found" });
    
    const po = db.posData[poIndex];
    if (po.status !== "RECEIVED") return res.status(400).json({ error: "Only received POs can be returned" });
    
    // Reduce stock for items in PO
    if (po.items && Array.isArray(po.items)) {
      for (const item of po.items) {
        const index = db.inventory.findIndex((inv: any) => inv.name === item.name);
        if (index !== -1) {
          const oldStock = db.inventory[index].stock;
          const newStock = Math.max(0, oldStock - Number(item.qty));
          
          db.inventory[index].stock = newStock;
          
          db.inventoryLogs.push({
            id: `LOG-RET-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            itemId: db.inventory[index].id,
            userId: "System",
            userRole: "Inventory",
            timestamp: new Date().toISOString(),
            type: "OUT",
            oldStock: oldStock,
            newStock: newStock,
            reason: `Retur PO ${poId}: ${reason}`
          });
        }
      }
    }
    
    db.posData[poIndex].status = "RETURNED";
    db.posData[poIndex].returReason = reason;
    db.posData[poIndex].returDate = new Date().toISOString();
    
    res.json(db.posData[poIndex]);
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

  app.get("/api/dashboard/stats", (req, res) => {
    const { omsetPeriod, itoPeriod } = req.query;

    const now = new Date();
    
    // Calculate Omset
    let omsetDays = 30; // 1 Bulan default
    let target = db.targets.month || 150000000;
    
    if (omsetPeriod === 'Shift') {
      omsetDays = 0.5; // Roughly 12 hours
      target = db.targets.shift || 2500000;
    } else if (omsetPeriod === '1 Hari') {
      omsetDays = 1;
      target = db.targets.day || 5000000;
    } else if (omsetPeriod === '3 Bulan') {
      omsetDays = 90;
      target = db.targets.quarter || 450000000;
    } else if (omsetPeriod === '1 Tahun') {
      omsetDays = 365;
      target = db.targets.year || 1800000000;
    }
    
    const omsetTime = new Date(now.getTime() - omsetDays * 24 * 60 * 60 * 1000);
    const todayTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 Hari for today metric
    
    // Calculate total transactions in omset period
    let totalSales = 0;
    let todaySales = 0;
    for (const trx of db.transactions) {
      if (new Date(trx.timestamp) >= omsetTime) {
        totalSales += trx.total || 0;
      }
      if (new Date(trx.timestamp) >= todayTime) {
        todaySales += trx.total || 0;
      }
    }
    
    let percentage = target > 0 ? (totalSales / target) * 100 : 0;
    let label = `${(percentage - 100 > 0 ? '+' : '')}${(percentage - 100).toFixed(1)}% vs target`;

    const omsetData = {
      sales: totalSales,
      target: target,
      percentage: Number(percentage.toFixed(1)),
      label
    };

    // Calculate ITO
    let itoDays = 30; // 1 Bulan default
    if (itoPeriod === '6 Bulan') itoDays = 180;
    else if (itoPeriod === '1 Tahun') itoDays = 365;
    
    const itoTime = new Date(now.getTime() - itoDays * 24 * 60 * 60 * 1000);
    let itoSales = 0;
    for (const trx of db.transactions) {
      if (new Date(trx.timestamp) >= itoTime) {
        itoSales += trx.total || 0;
      }
    }
    
    let totalInvValue = 0;
    for (const inv of db.inventory) {
      totalInvValue += (inv.stock || 0) * (inv.price || 0);
    }
    
    let itoRatio = totalInvValue > 0 ? (itoSales / totalInvValue) : 0;
    let itoLabel = itoRatio > 5 ? "High Turnover" : (itoRatio >= 1.5 ? "Good Turnover" : "Normal Turnover");

    const itoData = {
      ratio: Number(itoRatio.toFixed(1)),
      label: itoLabel
    };

    res.json({ omsetData, itoData, todaySales });
  });

  app.get("/api/pareto", (req, res) => {
    const { startDate, endDate } = req.query;
    
    // Map genuine transactions sum to items
    const soldQtyMap: Record<string, number> = {};
    for (const trx of db.transactions) {
       for (const item of trx.items) {
          if (item.itemId) {
              soldQtyMap[item.itemId] = (soldQtyMap[item.itemId] || 0) + (item.qty || 0);
          } else {
              // fallback if we just have name match (which is how old dummy TRXs were)
              const matchedInv = db.inventory.find((i: any) => i.name === item.name);
              if (matchedInv) {
                  soldQtyMap[matchedInv.id] = (soldQtyMap[matchedInv.id] || 0) + (item.qty || 0);
              }
          }
       }
    }
    
    let items = db.inventory.map((item, index) => {
      let qtySold = soldQtyMap[item.id] || 0;
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
      const cumulativePercent = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;
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
