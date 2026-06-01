import { useState, useEffect, Fragment, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { BottomNavBar, SideNavBar, MobileHeader } from "../components/Navigation";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";

export default function POS() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [receiptToPrint, setReceiptToPrint] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (receiptToPrint) {
      setTimeout(() => {
        const element = document.getElementById('printable-receipt');
        if (element) {
          // Temporarily unhide to take snapshot
          element.classList.remove('hidden');
          const opt: any = {
            margin:       5,
            filename:     `Receipt_${receiptToPrint.transactionId}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: [80, 297], orientation: 'portrait' } // Receipt format
          };
          html2pdf().set(opt).from(element).save().then(() => {
             element.classList.add('hidden');
             setReceiptToPrint(null);
          });
        } else {
             setReceiptToPrint(null);
        }
      }, 300);
    }
  }, [receiptToPrint]);

  useBarcodeScanner((barcode) => {
    const item = inventory.find(i => i.id.toLowerCase() === barcode.toLowerCase() || i.id === barcode);
    if (item) {
      addToCart(item);
    } else {
      setSearchTerm(barcode); // Pre-fill if not found or scan fail
    }
  });

  const [showSipnapForm, setShowSipnapForm] = useState(false);
  const [transactionType, setTransactionType] = useState<"Resep" | "Non-Resep">("Non-Resep");
  const [prescriptionData, setPrescriptionData] = useState({
    prescriptionNumber: "",
    patientNik: "",
    patientName: "",
    address: "",
    prescribingDoctor: "",
    doctorAddress: ""
  });
  const [patientData, setPatientData] = useState({ nik: "", name: "", doctor: "", sip: "" });
  
  const [patientsDB, setPatientsDB] = useState<any[]>([]);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ nik: "", name: "", address: "" });

  const [embalaseOptions, setEmbalaseOptions] = useState<any[]>([]);
  const [selectedEmbalaseId, setSelectedEmbalaseId] = useState<string>("");
  
  const [isCompoundingOpen, setIsCompoundingOpen] = useState(false);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
  const [isPreviewReceiptOpen, setIsPreviewReceiptOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Cash");
  const [printerStatus, setPrinterStatus] = useState("Connected");
  const [compoundingType, setCompoundingType] = useState("Kapsul");
  const [compoundingQty, setCompoundingQty] = useState<number>(1);
  const [compoundingFee, setCompoundingFee] = useState<number>(5000);
  const [compoundingIngredients, setCompoundingIngredients] = useState([{ name: "", qtyUsed: 1 }]);
  const [editingCompoundingIdx, setEditingCompoundingIdx] = useState<number | null>(null);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

  const userRole = localStorage.getItem("userRole") || "Staff";
  const isManager = userRole === "Manager";

  const [conversions, setConversions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => setInventory(data));

    fetch('/api/embalase')
      .then(res => res.json())
      .then(data => {
        setEmbalaseOptions(data);
        if(data.length > 0) setSelectedEmbalaseId(data[0].id);
      });

    fetch('/api/patients')
      .then(res => res.json())
      .then(data => setPatientsDB(data));

    fetch('/api/conversions')
      .then(res => res.json())
      .then(data => setConversions(data));
  }, []);

  useEffect(() => {
    setShowSipnapForm(cart.some(item => item.isSipnap));
  }, [cart]);

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id && !c.isCompounded);
    if (existing) {
      setCart(cart.map(c => c.id === item.id && !c.isCompounded ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
    setSearchTerm("");
  };

  const updateQty = (index: number, delta: number) => {
    const newCart = [...cart];
    const currentQty = Number(newCart[index].qty) || 0;
    newCart[index].qty = currentQty + delta;
    if (newCart[index].qty <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const submitCompounded = () => {
    // Validasi basic
    if (compoundingQty <= 0) {
      alert("QTY harus lebih dari 0");
      return;
    }
    const validIngredients = compoundingIngredients.filter(ing => ing.name.trim() !== "");
    if (validIngredients.length === 0) {
      alert("Masukkan setidaknya satu obat");
      return;
    }

    const invalidIngredients = validIngredients.filter(ing => 
      !inventory.some(inv => inv.name.toLowerCase() === ing.name.toLowerCase())
    );

    if (invalidIngredients.length > 0) {
      alert(`Obat berikut tidak dimiliki di database: ${invalidIngredients.map(i => i.name).join(", ")}`);
      return;
    }

    let totalIngredientsPrice = 0;
    validIngredients.forEach(ing => {
      const invItem = inventory.find(inv => inv.name.toLowerCase() === ing.name.toLowerCase());
      if (invItem) {
        totalIngredientsPrice += (invItem.price * ing.qtyUsed);
      }
    });

    const finalPrice = totalIngredientsPrice + compoundingFee;

    const compounded = {
      id: editingCompoundingIdx !== null ? cart[editingCompoundingIdx].id : "CMP-" + Date.now(),
      name: `Racikan ${compoundingType} (${compoundingQty} pcs)`,
      isCompounded: true,
      compoundingType,
      compoundingQty,
      compoundingIngredients: validIngredients,
      ingredients: validIngredients.map(ing => `${ing.name} (Qty: ${ing.qtyUsed})`),
      price: finalPrice,
      qty: editingCompoundingIdx !== null ? cart[editingCompoundingIdx].qty : 1,
      isSipnap: false
    };

    if (editingCompoundingIdx !== null) {
      const newCart = [...cart];
      newCart[editingCompoundingIdx] = compounded;
      setCart(newCart);
    } else {
      setCart([...cart, compounded]);
    }
    
    closeCompoundingModal();
  };

  const closeCompoundingModal = () => {
    setIsCompoundingOpen(false);
    setEditingCompoundingIdx(null);
    setCompoundingType("Kapsul");
    setCompoundingQty(1);
    setCompoundingFee(5000);
    setCompoundingIngredients([{ name: "", qtyUsed: 1 }]);
  };

  const editCompounded = (index: number) => {
    const item = cart[index];
    setCompoundingType(item.compoundingType || "Kapsul");
    setCompoundingQty(item.compoundingQty || 1);
    setCompoundingFee(item.price || 5000);
    setCompoundingIngredients(item.compoundingIngredients && item.compoundingIngredients.length > 0 ? [...item.compoundingIngredients] : [{ name: "", qtyUsed: 1 }]);
    setEditingCompoundingIdx(index);
    setIsCompoundingOpen(true);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * (Number(item.qty) || 0)), 0);
  
  const selectedEmbalaseObj = embalaseOptions.find(e => e.id === selectedEmbalaseId);
  const embalasePrice = selectedEmbalaseObj ? selectedEmbalaseObj.price : 0;
  const embalase = transactionType === "Resep" ? embalasePrice : 0;
  
  const tax = subtotal * 0.11;
  const total = subtotal + embalase + tax;

  const checkout = async (paymentMethod: string) => {
    if (transactionType === "Resep" && (!prescriptionData.patientName || !prescriptionData.prescribingDoctor || !patientData.sip)) {
      alert("Please fill in Patient Name, Doctor Name, and SIP for Prescription items.");
      return;
    }
    
    // For SIPNAP via Non-Resep fallback
    if (showSipnapForm && transactionType === "Non-Resep" && (!patientData.name || !patientData.doctor || !patientData.sip)) {
      alert("Please fill all regulatory fields for SIPNAP items.");
      return;
    }
    
    try {
      // Save patient to DB if provided
      const currentNik = transactionType === "Resep" ? prescriptionData.patientNik : (patientData as any).nik || "";
      const currentName = transactionType === "Resep" ? prescriptionData.patientName : patientData.name;
      const currentAddress = transactionType === "Resep" ? prescriptionData.address : "";
      
      if (currentNik && currentName) {
        const existingInfo = patientsDB.find(p => p.nik === currentNik);
        if (!existingInfo) {
          await fetch('/api/patients', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nik: currentNik, name: currentName, address: currentAddress })
          });
          // optionally refresh local db
          fetch('/api/patients').then(r => r.json()).then(setPatientsDB);
        }
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cart, 
          patient: transactionType === "Resep" ? prescriptionData.patientName : patientData.name,
          doctor: transactionType === "Resep" ? prescriptionData.prescribingDoctor : patientData.doctor,
          sip: patientData.sip,
          doctorAddress: transactionType === "Resep" ? prescriptionData.doctorAddress : '',
          paymentMethod 
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsPaymentModalOpen(false);
        // We do not show alert anymore since we want direct download
        setReceiptToPrint({
          transactionId: data.transactionId,
          date: new Date().toLocaleString(),
          cart: [...cart],
          subtotal,
          tax,
          total,
          paymentMethod
        });

        setCart([]);
        setPatientData({ nik: "", name: "", doctor: "", sip: "" });
        setPrescriptionData({ prescriptionNumber: "", patientNik: "", patientName: "", address: "", prescribingDoctor: "", doctorAddress: "" });
        // Reload inventory internally if possible, but the page handles state via refresh or we can just hope it's updated on next page load.
        // POS isn't managing full inventory state, only a local search dropdown
        fetch('/api/inventory').then(r => r.json()).then(setInventory);
      } else {
        alert(data.error || "Checkout failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPatient = async () => {
    try {
      const res = await fetch('/api/patients', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatientForm)
      });
      if (res.ok) {
        const added = await res.json();
        setPatientsDB([...patientsDB, added]);
        setNewPatientForm({ nik: "", name: "", address: "" });
        setIsAddPatientModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const searchResults = searchTerm ? inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.toLowerCase().includes(searchTerm.toLowerCase())) : [];

  return (
    <div className="bg-surface text-on-surface font-body-md h-screen overflow-hidden flex flex-col pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0">
      <MobileHeader title="POS Terminal" />
      
      <main className="flex-1 flex overflow-hidden w-full max-w-[1440px] mx-auto p-4 md:p-gutter-pos gap-gutter-pos bg-background h-[calc(100vh-64px)] md:h-screen pl-0 md:pl-20 lg:pl-64">
        
        <SideNavBar />
        
        <section className="flex-1 flex flex-col bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-lg backdrop-blur-sm overflow-hidden relative">
          <div className="p-4 bg-surface-container-low border-b border-border-subtle flex gap-2 items-center z-10 shrink-0">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-xl">barcode_scanner</span>
              <input 
                ref={searchInputRef}
                autoFocus 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const item = inventory.find(i => i.id.toLowerCase() === searchTerm.toLowerCase() || i.id === searchTerm);
                    if (item) {
                      addToCart(item);
                    }
                  }
                }}
                className="w-full pl-10 pr-48 h-12 bg-surface-container-lowest border-2 border-primary rounded font-body-lg text-body-lg text-on-surface focus:outline-none focus:ring-0 shadow-sm placeholder:text-on-surface-variant" 
                placeholder="Scan barcode or type item name..." 
                type="text" 
              />
              <div className="absolute right-36 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-on-surface-variant bg-surface-variant px-1 rounded font-data-mono hidden sm:block">
                Ctrl K
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary-container px-2 py-1 rounded border border-primary/20 pointer-events-none tracking-widest hidden sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                SCANNER ACTIVE
              </div>
              
              {searchResults.length > 0 && (
                <div className="absolute top-14 left-0 w-full bg-surface-container-lowest border border-outline-variant rounded shadow-lg max-h-64 overflow-y-auto z-50">
                  {searchResults.map(item => (
                    <div key={item.id} onClick={() => addToCart(item)} className="p-3 border-b border-outline-variant hover:bg-surface-muted cursor-pointer flex justify-between items-center">
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {item.name}
                          {item.isSipnap && <span className="text-[10px] bg-regulatory-alert text-on-error px-1 py-0.5 rounded">SIPNAP</span>}
                        </div>
                        <div className="text-sm font-data-mono text-on-surface-variant">{item.id} | Stock: {item.stock}</div>
                      </div>
                      <div className="font-data-mono font-bold">Rp {item.price.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setIsCompoundingOpen(true)} className="bg-surface-container-highest hover:bg-surface-variant text-on-surface font-headline-md text-headline-md px-4 h-12 rounded border border-border-subtle flex items-center justify-center gap-2 transition-colors">
              <span className="material-symbols-outlined">vaccines</span>
              <span className="hidden lg:inline">Obat Racikan</span>
            </button>
            <button onClick={() => setIsPrinterSettingsOpen(true)} className="bg-surface-container-highest hover:bg-surface-variant text-on-surface font-headline-md text-headline-md px-4 h-12 rounded border border-border-subtle flex items-center justify-center gap-2 transition-colors">
              <span className="material-symbols-outlined">print</span>
              <span className="hidden lg:inline">Printer</span>
            </button>
          </div>

          {showSipnapForm && (
            <div className="bg-error-container border-l-4 border-regulatory-alert p-3 m-4 rounded-r-DEFAULT shrink-0">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-regulatory-alert filled mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>warning</span>
                <div>
                  <h4 className="font-headline-md text-body-md text-on-error-container font-bold">SIPNAP Item Added</h4>
                  <p className="font-body-md text-body-md text-on-error-container opacity-80 text-sm">Regulatory data required for Narkotika/Psikotropika items before checkout.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-surface-container-lowest">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="bg-surface-muted sticky top-0 border-b border-border-subtle z-0">
                <tr>
                  <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant w-12">#</th>
                  <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant">Item</th>
                  <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant text-right">Qty</th>
                  <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant text-right">Price</th>
                  <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant text-right">Total</th>
                  <th className="py-3 px-4 font-label-caps text-label-caps text-on-surface-variant w-12"></th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-on-surface-variant">Cart is empty. Scan an item or search above.</td>
                  </tr>
                ) : cart.map((item, index) => (
                  <motion.tr 
                    key={`${item.id}-${index}`} 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className={`border-b border-border-subtle hover:bg-surface-container-low transition-colors group ${item.isSipnap ? 'bg-surface-muted border-l-4 border-l-regulatory-alert' : ''}`}>
                    <td className="py-3 px-4 text-on-surface-variant">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-on-surface">{item.name}</span>
                        {item.isSipnap && <span className="bg-regulatory-alert text-on-error font-label-caps text-label-caps px-1.5 py-0.5 rounded-sm text-[10px]">SIPNAP</span>}
                        {item.isCompounded && <span className="bg-secondary text-on-secondary font-label-caps text-label-caps px-1.5 py-0.5 rounded-sm text-[10px]">CMPND</span>}
                      </div>
                      <div className="font-data-mono text-data-mono text-on-surface-variant text-sm mt-1">
                        {item.isCompounded ? (
                          item.ingredients.map((ing: string, i: number) => <div key={i}>- {ing}</div>)
                        ) : (
                          `SKU: ${item.id}`
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right align-top">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => updateQty(index, -1)} className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-on-surface-variant hover:bg-surface-variant">-</button>
                          <input 
                            type="number" 
                            min="1" 
                            value={item.qty} 
                            onChange={(e) => {
                              const val = e.target.value;
                              const newCart = [...cart];
                              newCart[index].qty = val === "" ? "" : (parseInt(val) || 0);
                              setCart(newCart);
                            }}
                            onBlur={() => {
                              const newCart = [...cart];
                              if (newCart[index].qty === "" || newCart[index].qty <= 0) {
                                newCart[index].qty = 1;
                              }
                              setCart(newCart);
                            }}
                            className={`w-12 text-center font-data-mono text-data-mono bg-transparent border-b focus:outline-none ${(() => {
                              if (!item.isCompounded) {
                                const invItem = inventory.find(i => i.id === item.id);
                                if (invItem && (Number(item.qty) || 0) > invItem.stock) {
                                  return 'text-regulatory-alert border-regulatory-alert font-bold';
                                }
                              }
                              return 'border-border-subtle';
                            })()}`} 
                          />
                          <button onClick={() => updateQty(index, 1)} className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-on-surface-variant hover:bg-surface-variant">+</button>
                        </div>
                        {(!item.isCompounded && inventory.find(i => i.id === item.id)?.conversionId) && (
                          (() => {
                            const invItem = inventory.find(i => i.id === item.id);
                            const conv = conversions.find(c => c.id === invItem?.conversionId);
                            if (!conv) return null;
                            return (
                              <select 
                                value={item.satuan || conv.kecil} 
                                onChange={(e) => {
                                  const newCart = [...cart];
                                  const sel = e.target.value;
                                  newCart[index].satuan = sel;
                                  let multi = 1;
                                  if (sel === conv.besar) {
                                    multi = (Number(conv.sedang_qty) || 1) * (Number(conv.kecil_qty) || 1);
                                  } else if (sel === conv.sedang) {
                                    multi = (Number(conv.kecil_qty) || 1);
                                  }
                                  newCart[index].price = (invItem.price || 0) * multi;
                                  setCart(newCart);
                                }}
                                className="text-xs bg-surface-muted border border-border-subtle rounded px-1 max-w-[80px]"
                              >
                                {conv.besar && <option value={conv.besar}>{conv.besar}</option>}
                                {conv.sedang && <option value={conv.sedang}>{conv.sedang}</option>}
                                {conv.kecil && <option value={conv.kecil}>{conv.kecil}</option>}
                              </select>
                            );
                          })()
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-data-mono text-data-mono text-on-surface-variant align-top pt-5">Rp {item.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-data-mono text-data-mono font-semibold align-top pt-5">Rp {(item.price * (Number(item.qty) || 0)).toLocaleString()}</td>
                    <td className="py-3 px-4 align-top pt-4 text-center">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.isCompounded && (
                          <button onClick={() => editCompounded(index)} className="text-info-blue p-2 hover:bg-surface-variant rounded">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                        )}
                        <button onClick={() => {
                          const newCart = [...cart];
                          newCart.splice(index, 1);
                          setCart(newCart);
                        }} className="text-tertiary p-2 hover:bg-surface-variant rounded">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-surface-container-low border-t border-border-subtle flex gap-2 shrink-0 overflow-x-auto">
            <button className="whitespace-nowrap px-4 py-2 bg-surface-container-lowest border border-border-subtle rounded text-on-surface-variant font-body-md text-body-md hover:bg-surface-variant transition-colors flex items-center gap-1 text-sm">
              <span className="material-symbols-outlined text-[18px]">pause</span> Hold Bill
            </button>
            <button onClick={() => setIsAddPatientModalOpen(true)} className="whitespace-nowrap px-4 py-2 bg-surface-container-lowest border border-border-subtle rounded text-on-surface-variant font-body-md text-body-md hover:bg-surface-variant transition-colors flex items-center gap-1 text-sm">
              <span className="material-symbols-outlined text-[18px]">person_add</span> Add Patient
            </button>
          </div>
        </section>

        <section className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto mb-16 md:mb-0 hidden md:flex">
          <div className="flex w-full shrink-0 shadow-sm border border-outline-variant rounded overflow-hidden">
            <button 
              onClick={() => setTransactionType("Resep")}
              className={`flex-1 py-2 text-center text-sm font-bold ${transactionType === "Resep" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"} transition-colors`}
            >
              Resep
            </button>
            <button 
              onClick={() => setTransactionType("Non-Resep")}
              className={`flex-1 py-2 text-center text-sm font-bold ${transactionType === "Non-Resep" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"} transition-colors`}
            >
              Non-Resep
            </button>
          </div>

          {transactionType === "Resep" && (
            <div className="bg-surface-container-lowest border border-outline-variant flex flex-col gap-3 shrink-0 shadow-sm backdrop-blur-sm pb-4">
              <div className="flex items-center gap-2 p-3 border-b border-border-subtle shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]">prescriptions</span>
                <h3 className="font-headline-md text-xs font-bold text-on-surface-variant uppercase tracking-widest">Prescription Details</h3>
              </div>
              
              <div className="px-4 flex flex-col gap-4">
                <datalist id="patients-db">
                  {patientsDB.map((p, idx) => (
                    <option key={p.id || idx} value={p.nik}>{p.name} - {p.address}</option>
                  ))}
                </datalist>

                <div className="relative mt-1">
                  <label className="text-[10px] font-bold text-on-surface-variant absolute -top-2 left-2 bg-surface-container-lowest px-1">Prescription Number</label>
                  <input value={prescriptionData.prescriptionNumber} onChange={e => setPrescriptionData({...prescriptionData, prescriptionNumber: e.target.value})} placeholder="e.g. RX-2026-0001" className="w-full bg-surface-container-lowest border border-border-subtle rounded p-2 focus:outline-none focus:border-primary text-sm font-data-mono h-10" type="text" />
                </div>
                
                <div className="relative">
                  <label className="text-[10px] font-bold text-on-surface-variant absolute -top-2 left-2 bg-surface-container-lowest px-1">Patient NIK</label>
                  <input 
                    list="patients-db"
                    value={prescriptionData.patientNik} 
                    onChange={e => {
                      const val = e.target.value;
                      const matched = patientsDB.find(p => p.nik === val);
                      if (matched) {
                         setPrescriptionData({...prescriptionData, patientNik: matched.nik, patientName: matched.name, address: matched.address});
                      } else {
                         setPrescriptionData({...prescriptionData, patientNik: val});
                      }
                    }} 
                    placeholder="16-digit NIK" 
                    className="w-full bg-surface-container-lowest border border-border-subtle rounded p-2 focus:outline-none focus:border-primary text-sm font-data-mono h-10" 
                    type="text" 
                  />
                </div>
                
                <div className="relative">
                  <label className="text-[10px] font-bold text-on-surface-variant absolute -top-2 left-2 bg-surface-container-lowest px-1">Patient Name</label>
                  <input value={prescriptionData.patientName} onChange={e => setPrescriptionData({...prescriptionData, patientName: e.target.value})} placeholder="Full Name" className="w-full bg-surface-container-lowest border border-border-subtle rounded p-2 focus:outline-none focus:border-primary text-sm h-10" type="text" />
                </div>
                
                <div className="relative">
                  <label className="text-[10px] font-bold text-on-surface-variant absolute -top-2 left-2 bg-surface-container-lowest px-1">Address</label>
                  <input value={prescriptionData.address} onChange={e => setPrescriptionData({...prescriptionData, address: e.target.value})} placeholder="Patient Address" className="w-full bg-surface-container-lowest border border-border-subtle rounded p-2 focus:outline-none focus:border-primary text-sm h-10" type="text" />
                </div>
                
                <div className="relative">
                  <label className="text-[10px] font-bold text-on-surface-variant absolute -top-2 left-2 bg-surface-container-lowest px-1">Prescribing Doctor Info</label>
                  <div className="flex flex-col gap-2 bg-surface-container-lowest border border-border-subtle rounded p-2 pt-3">
                    <input value={prescriptionData.prescribingDoctor} onChange={e => setPrescriptionData({...prescriptionData, prescribingDoctor: e.target.value})} placeholder="Doctor Name" className="w-full bg-transparent focus:outline-none focus:border-b focus:border-primary text-sm h-8" type="text" />
                    <input value={patientData.sip} onChange={e => setPatientData({...patientData, sip: e.target.value})} placeholder="Doctor SIP (License Number)" className="w-full bg-transparent focus:outline-none focus:border-b focus:border-primary text-sm h-8" type="text" />
                    <input value={prescriptionData.doctorAddress} onChange={e => setPrescriptionData({...prescriptionData, doctorAddress: e.target.value})} placeholder="Doctor Address" className="w-full bg-transparent focus:outline-none focus:border-b focus:border-primary text-sm h-8" type="text" />
                  </div>
                </div>

                <div className="relative">
                   <label className="text-[10px] font-bold text-on-surface-variant absolute -top-2 left-2 bg-surface-container-lowest px-1">Embalase (Packaging) Fee</label>
                   <select 
                     value={selectedEmbalaseId} 
                     onChange={e => setSelectedEmbalaseId(e.target.value)} 
                     className="w-full bg-surface-container-lowest border border-border-subtle rounded p-2 focus:outline-none focus:border-primary text-sm h-10"
                   >
                      {embalaseOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name} - Rp {opt.price.toLocaleString()}</option>
                      ))}
                   </select>
                </div>
              </div>
            </div>
          )}

          {showSipnapForm && transactionType !== "Resep" && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col gap-3 shrink-0 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-regulatory-alert text-xl" style={{fontVariationSettings: "'FILL' 1"}}>gavel</span>
                <h3 className="font-headline-md text-body-lg font-bold text-on-surface">Regulatory Info</h3>
              </div>
              <div className="relative">
                <label className="font-label-caps text-label-caps text-on-surface-variant absolute -top-2 left-2 bg-surface-container-lowest px-1">Patient NIK</label>
                <input 
                  list="patients-db"
                  value={patientData.nik} 
                  onChange={e => {
                    const val = e.target.value;
                    const matched = patientsDB.find(p => p.nik === val);
                    if (matched) {
                       setPatientData({...patientData, nik: matched.nik, name: matched.name});
                    } else {
                       setPatientData({...patientData, nik: val});
                    }
                  }} 
                  className="w-full bg-surface-container-lowest border border-border-subtle rounded p-2 font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-10 font-data-mono" 
                  type="text" 
                  placeholder="16-digit NIK"
                />
              </div>
              <div className="relative mt-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant absolute -top-2 left-2 bg-surface-container-lowest px-1">Patient Name <span className="text-regulatory-alert">*</span></label>
                <input value={patientData.name} onChange={e => setPatientData({...patientData, name: e.target.value})} className="w-full bg-surface-container-lowest border border-border-subtle rounded p-2 font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-10" type="text" />
              </div>
              <div className="relative mt-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant absolute -top-2 left-2 bg-surface-container-lowest px-1">Doctor Name <span className="text-regulatory-alert">*</span></label>
                <input value={patientData.doctor} onChange={e => setPatientData({...patientData, doctor: e.target.value})} className="w-full bg-surface-container-lowest border border-border-subtle rounded p-2 font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-10" type="text" />
              </div>
              <div className="relative mt-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant absolute -top-2 left-2 bg-surface-container-lowest px-1">Doctor SIP <span className="text-regulatory-alert">*</span></label>
                <input value={patientData.sip} onChange={e => setPatientData({...patientData, sip: e.target.value})} className="w-full bg-surface-container-lowest border border-border-subtle rounded p-2 font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-10" type="text" />
              </div>
            </div>
          )}

          <div className="bg-surface-container-lowest border border-outline-variant p-6 mt-auto shadow-sm backdrop-blur-sm shrink-0">
            <div className="flex justify-between items-center mb-2 text-sm text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-data-mono font-bold">Rp {subtotal.toLocaleString()}</span>
            </div>
            {transactionType === "Resep" && (
              <div className="flex justify-between items-center mb-2 text-sm text-on-surface-variant">
                <span>Embalase (Packaging)</span>
                <span className="font-data-mono font-bold">Rp {embalase.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-4 text-sm text-on-surface-variant">
              <span>Tax (11%)</span>
              <span className="font-data-mono font-bold">Rp {tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="border-t border-border-subtle pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-headline-md text-on-surface font-bold">Total</span>
                <span className="font-pos-total text-primary font-bold text-2xl">Rp {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button disabled={cart.length === 0} onClick={() => setIsPreviewReceiptOpen(true)} className="disabled:opacity-50 w-full bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-on-surface rounded font-bold flex items-center justify-center gap-2 transition-all shadow-sm py-2">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Preview Receipt
              </button>
              <button disabled={cart.length === 0} onClick={() => setIsPaymentModalOpen(true)} className="disabled:opacity-50 w-full bg-primary hover:opacity-90 text-on-primary rounded font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm py-3 text-base">
                <span className="material-symbols-outlined text-[20px]">payments</span>
                PROCESS PAYMENT [F12]
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL OBAT RACIKAN */}
      {isCompoundingOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl shrink-0">
              <h2 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">vaccines</span>
                Tambah Obat Racikan
              </h2>
              <button onClick={() => setIsCompoundingOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Info Racikan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Jenis Racikan</label>
                  <select 
                    value={compoundingType}
                    onChange={(e) => setCompoundingType(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary"
                  >
                    <option value="Kapsul">Kapsul</option>
                    <option value="Saset">Puyer / Saset</option>
                    <option value="Sirup">Sirup</option>
                    <option value="Pot">Salep / Pot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">QTY yang Dibuat</label>
                  <input 
                    type="number" 
                    min="1"
                    value={compoundingQty}
                    onChange={(e) => setCompoundingQty(parseInt(e.target.value) || 1)}
                    className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Harga Jasa (Total)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">Rp</span>
                    <input 
                      type="number" 
                      min="0"
                      value={compoundingFee}
                      onChange={(e) => setCompoundingFee(parseInt(e.target.value) || 0)}
                      className="w-full h-10 pl-8 pr-3 bg-surface-container-low border border-outline-variant rounded focus:outline-none focus:border-primary font-bold" 
                    />
                  </div>
                </div>
              </div>

              {/* Daftar Obat */}
              <div>
                <h3 className="font-bold text-on-surface mb-3 uppercase tracking-widest text-sm border-b border-outline-variant pb-2">Komposisi Bahan (Obat)</h3>
                
                <div className="space-y-3 pb-32">
                  {compoundingIngredients.map((ing, i) => {
                    const ingSearchResults = ing.name && activeSearchIndex === i ? inventory.filter(item => item.name.toLowerCase().includes(ing.name.toLowerCase()) || item.id.toLowerCase().includes(ing.name.toLowerCase())) : [];
                    
                    return (
                    <div key={i} className="flex items-start gap-3 bg-surface-muted p-2 rounded-lg border border-outline-variant relative">
                      <div className="w-8 text-center text-on-surface-variant font-bold text-xs pt-2.5">{i+1}</div>
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          placeholder="Nama Obat (Ketik untuk mencari...)" 
                          value={ing.name}
                          onFocus={() => setActiveSearchIndex(i)}
                          onChange={(e) => {
                            const newIngs = [...compoundingIngredients];
                            newIngs[i].name = e.target.value;
                            setCompoundingIngredients(newIngs);
                          }}
                          className={`w-full h-9 px-3 bg-surface-container-lowest border rounded text-sm focus:outline-none ${ing.name && !inventory.some(inv => inv.name.toLowerCase() === ing.name.toLowerCase()) ? 'border-regulatory-alert focus:border-regulatory-alert' : 'border-outline-variant focus:border-primary'}`} 
                        />
                        {ing.name && !inventory.some(inv => inv.name.toLowerCase() === ing.name.toLowerCase()) && (
                          <div className="text-regulatory-alert text-[10px] mt-1 font-bold ml-1">Obat tidak dimiliki di database</div>
                        )}

                        {activeSearchIndex === i && ingSearchResults.length > 0 && (
                          <div className="absolute top-10 left-0 w-[400px] bg-surface-container-lowest border border-outline-variant rounded shadow-xl max-h-48 overflow-y-auto z-50">
                            {ingSearchResults.map(item => (
                              <div key={item.id} onClick={() => {
                                const newIngs = [...compoundingIngredients];
                                newIngs[i].name = item.name;
                                setCompoundingIngredients(newIngs);
                                setActiveSearchIndex(null);
                              }} className="p-3 border-b border-outline-variant hover:bg-surface-muted cursor-pointer flex justify-between items-center">
                                <div>
                                  <div className="font-bold flex items-center gap-2 text-sm text-on-surface">
                                    {item.name}
                                    {item.isSipnap && <span className="text-[10px] bg-regulatory-alert text-on-error px-1 py-0.5 rounded">SIPNAP</span>}
                                  </div>
                                  <div className="text-xs font-data-mono text-on-surface-variant flex gap-2">
                                    <span>{item.id}</span>
                                    <span>|</span>
                                    <span>Stock: {item.stock}</span>
                                  </div>
                                </div>
                                <div className="font-data-mono font-bold text-sm text-on-surface">Rp {item.price.toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="w-24">
                        <input 
                          type="number" 
                          min="1"
                          placeholder="Qty Dipakai"
                          value={ing.qtyUsed}
                          onChange={(e) => {
                            const newIngs = [...compoundingIngredients];
                            newIngs[i].qtyUsed = parseInt(e.target.value) || 1;
                            setCompoundingIngredients(newIngs);
                          }}
                          className="w-full h-9 px-3 bg-surface-container-lowest border border-outline-variant rounded text-sm text-center focus:outline-none focus:border-primary" 
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newIngs = [...compoundingIngredients];
                          newIngs.splice(i, 1);
                          setCompoundingIngredients(newIngs);
                        }}
                        disabled={compoundingIngredients.length === 1}
                        className="p-1.5 mt-0.5 hover:bg-error-container text-regulatory-alert rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  )})}
                </div>
                
                <button 
                  onClick={() => setCompoundingIngredients([...compoundingIngredients, { name: "", qtyUsed: 1 }])}
                  className="mt-3 w-full border border-dashed border-primary/50 text-primary py-2 rounded-lg font-bold text-sm hover:bg-primary-container/30 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span> Tambah Bahan
                </button>
              </div>
            </div>
            
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl shrink-0">
               <button 
                onClick={() => setIsCompoundingOpen(false)} 
                className="px-4 py-2 border border-outline-variant rounded font-bold text-sm hover:bg-surface-variant transition-colors"
               >
                 Batal
               </button>
               <button 
                 onClick={submitCompounded} 
                 className="px-6 py-2 bg-primary text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors flex items-center gap-2"
               >
                 <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                 Tambahkan
               </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTER SETTINGS MODAL */}
      {isPrinterSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-xl flex flex-col border border-outline-variant overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-muted">
              <h2 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">print</span>
                Printer Settings
              </h2>
              <button onClick={() => setIsPrinterSettingsOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${printerStatus === "Connected" ? "bg-primary-container text-primary" : "bg-error-container text-on-error-container"}`}>
                   <span className="material-symbols-outlined text-[24px]">
                      {printerStatus === "Connected" ? "bluetooth_connected" : "bluetooth_disabled"}
                   </span>
                </div>
                <div>
                  <div className="text-xs uppercase font-bold text-on-surface-variant tracking-wider">Status</div>
                  <div className={`font-bold text-lg ${printerStatus === "Connected" ? "text-primary" : "text-regulatory-alert"}`}>
                    {printerStatus}
                  </div>
                  <div className="text-xs font-data-mono text-on-surface-variant">TM-T82III (Bluetooth)</div>
                </div>
              </div>

              {printerStatus === "Connected" ? (
                 <button onClick={() => setPrinterStatus("Disconnected")} className="w-full py-3 border border-outline-variant rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-surface-variant text-on-surface-variant transition-colors">
                    <span className="material-symbols-outlined text-[18px]">power_off</span>
                    Simulate Disconnect
                 </button>
              ) : (
                 <button 
                  onClick={() => {
                    setPrinterStatus("Connecting...");
                    setTimeout(() => setPrinterStatus("Connected"), 2000);
                  }} 
                  disabled={printerStatus === "Connecting..."}
                  className="w-full py-3 bg-primary text-on-primary rounded-lg font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-primary-fixed transition-colors disabled:opacity-50"
                 >
                    <span className="material-symbols-outlined text-[18px]">bluetooth</span>
                    {printerStatus === "Connecting..." ? "Connecting..." : "Reconnect"}
                 </button>
              )}

              <button 
                onClick={() => {
                   if (printerStatus !== "Connected") {
                     alert("Printer is not connected");
                     return;
                   }
                   setReceiptToPrint({
                     transactionId: "TEST-" + Date.now(),
                     date: new Date().toLocaleString(),
                     cart: [
                       { name: "Test Item 1", qty: 2, price: 15000 },
                       { name: "Test Item 2", qty: 1, price: 50000 }
                     ],
                     subtotal: 80000,
                     tax: 8800,
                     total: 88800
                   });
                }}
                disabled={printerStatus !== "Connected"}
                className="w-full py-3 border-2 border-primary text-primary rounded-lg font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-primary-container transition-colors disabled:opacity-50 disabled:border-outline-variant disabled:text-on-surface-variant disabled:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Test Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {isAddPatientModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl">
              <h2 className="font-headline-md font-bold text-on-surface">Add New Patient</h2>
              <button onClick={() => setIsAddPatientModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block font-bold text-on-surface mb-2">Patient NIK</label>
                <input type="text" value={newPatientForm.nik} onChange={e => setNewPatientForm({...newPatientForm, nik: e.target.value})} className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" placeholder="16-digit NIK" />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Patient Name</label>
                <input type="text" value={newPatientForm.name} onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})} className="w-full h-10 px-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" placeholder="Full Name" />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Address</label>
                <textarea value={newPatientForm.address} onChange={e => setNewPatientForm({...newPatientForm, address: e.target.value})} className="w-full p-3 bg-surface-muted border border-outline-variant rounded focus:outline-none focus:border-primary focus:bg-surface transition-colors" rows={3} placeholder="Full Address"></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted rounded-b-2xl mt-auto">
               <button onClick={() => setIsAddPatientModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface rounded font-bold text-sm hover:bg-surface-variant transition-colors">Cancel</button>
               <button onClick={handleAddPatient} disabled={!newPatientForm.name || !newPatientForm.nik} className="px-6 py-2 bg-primary disabled:opacity-50 text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors">Save Patient</button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl shrink-0">
              <h2 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Select Payment Method
              </h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 font-body-md">
              <div className="text-center mb-4">
                <div className="text-sm text-on-surface-variant uppercase font-bold tracking-wider mb-2">Total Payment</div>
                <div className="text-4xl font-pos-total text-primary font-bold">Rp {total.toLocaleString()}</div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {['Cash', 'Card / Debit', 'QR Code / E-Wallet'].map((method) => (
                  <button 
                    key={method}
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`p-4 border-2 rounded-xl flex items-center justify-between transition-colors ${selectedPaymentMethod === method ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant hover:bg-surface-muted text-on-surface'}`}
                  >
                     <div className="flex items-center gap-3 font-bold text-lg">
                       <span className="material-symbols-outlined">
                         {method === 'Cash' ? 'payments' : method === 'Card / Debit' ? 'credit_card' : 'qr_code_scanner'}
                       </span>
                       {method}
                     </div>
                     {selectedPaymentMethod === method && <span className="material-symbols-outlined text-primary">check_circle</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant bg-surface-muted flex gap-3 rounded-b-2xl shrink-0">
              <button 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="flex-1 py-4 text-on-surface-variant font-bold border border-outline-variant rounded-xl hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => checkout(selectedPaymentMethod)} 
                className="flex-[2] py-4 bg-primary text-on-primary font-bold rounded-xl hover:bg-surface-tint shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg"
              >
                <span className="material-symbols-outlined">done_all</span>
                CONFIRM PAYMENT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW RECEIPT MODAL */}
      {isPreviewReceiptOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-muted rounded-t-2xl shrink-0">
              <h2 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Preview Receipt
              </h2>
              <button onClick={() => setIsPreviewReceiptOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-surface-container">
              {/* Thermal Paper Simulation */}
              <div id="receipt-pdf-content" className="bg-white w-full max-w-[300px] shadow-sm p-4 font-mono text-black text-sm relative" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>MEDISYNC ERP</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>Jl. Kesehatan No. 123</p>
                </div>
                <div style={{ fontSize: '0.8rem', borderBottom: '1px dashed black', paddingBottom: '5px', marginBottom: '5px' }}>
                  <div>TRX: <span className="text-gray-500 italic">PENDING...</span></div>
                  <div>Date: {new Date().toLocaleString()}</div>
                </div>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                  <tbody>
                    {cart.map((item: any, idx: number) => (
                      <Fragment key={idx}>
                        <tr>
                          <td colSpan={3} style={{ paddingBottom: '2px' }}>{item.name}</td>
                        </tr>
                        <tr>
                          <td style={{ width: '30%', paddingBottom: '5px' }}>{item.qty}x</td>
                          <td style={{ width: '35%', textAlign: 'right', paddingBottom: '5px' }}>{item.price.toLocaleString()}</td>
                          <td style={{ width: '35%', textAlign: 'right', paddingBottom: '5px' }}>{(Number(item.qty || 0) * item.price).toLocaleString()}</td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
                <div style={{ borderTop: '1px dashed black', paddingTop: '5px', marginTop: '5px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>Rp {subtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tax (11%):</span>
                    <span>Rp {tax.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', marginTop: '5px' }}>
                    <span>TOTAL:</span>
                    <span>Rp {total.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem' }}>
                  <p style={{ margin: 0 }}>Thank you for your purchase!</p>
                  <p style={{ margin: 0 }}>Simpan struk ini sebagai bukti.</p>
                </div>
                
                {/* Torn edge effect at bottom */}
                <div className="absolute left-0 right-0 -bottom-2 h-4 w-full bg-[radial-gradient(circle,transparent,transparent_50%,#fff_50%,#fff)] bg-[length:10px_10px]" style={{ transform: 'rotate(180deg)' }}></div>
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant bg-surface-muted flex gap-3 rounded-b-2xl shrink-0">
              <button 
                onClick={() => setIsPreviewReceiptOpen(false)} 
                className="flex-1 py-3 text-on-surface-variant font-bold border border-outline-variant rounded-lg hover:bg-surface-variant transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={() => {
                  setIsPreviewReceiptOpen(false);
                  setIsPaymentModalOpen(true);
                }} 
                className="flex-[2] py-3 bg-primary text-on-primary font-bold rounded-lg hover:bg-surface-tint shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">payments</span>
                BAYAR SEKARANG
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptToPrint && (
        <div id="printable-receipt" className="hidden">
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>MEDISYNC ERP</h2>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>Jl. Kesehatan No. 123</p>
          </div>
          <div style={{ fontSize: '0.8rem', borderBottom: '1px dashed black', paddingBottom: '5px', marginBottom: '5px' }}>
            <div>TRX: {receiptToPrint.transactionId}</div>
            <div>Date: {receiptToPrint.date}</div>
          </div>
          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
            <tbody>
              {receiptToPrint.cart.map((item: any, idx: number) => (
                <Fragment key={idx}>
                  <tr>
                    <td colSpan={3} style={{ paddingBottom: '2px' }}>{item.name}</td>
                  </tr>
                  <tr>
                    <td style={{ width: '30%', paddingBottom: '5px' }}>{item.qty}x</td>
                    <td style={{ width: '35%', textAlign: 'right', paddingBottom: '5px' }}>{item.price.toLocaleString()}</td>
                    <td style={{ width: '35%', textAlign: 'right', paddingBottom: '5px' }}>{(item.qty * item.price).toLocaleString()}</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: '1px dashed black', paddingTop: '5px', marginTop: '5px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>Rp {receiptToPrint.subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tax (11%):</span>
              <span>Rp {receiptToPrint.tax.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', marginTop: '5px' }}>
              <span>TOTAL:</span>
              <span>Rp {receiptToPrint.total.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem' }}>
            <p style={{ margin: 0 }}>Thank you for your purchase!</p>
            <p style={{ margin: 0 }}>Simpan struk ini sebagai bukti.</p>
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
}
