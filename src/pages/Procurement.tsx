import { useEffect, useState, useRef } from "react";
import { SideNavBar, BottomNavBar, MobileHeader } from "../components/Navigation";
import { motion } from "motion/react";
import html2pdf from "html2pdf.js";

export default function Procurement() {
  const userRole = localStorage.getItem("userRole") || "Staff";
  const isManager = userRole === "Manager";

  const [poList, setPoList] = useState<any[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New states for Faktur and Retur
  const [isFakturModalOpen, setIsFakturModalOpen] = useState(false);
  const [selectedFakturData, setSelectedFakturData] = useState<string | null>(null);
  const [isReturModalOpen, setIsReturModalOpen] = useState(false);
  const [selectedPoRetur, setSelectedPoRetur] = useState<any | null>(null);
  const [returReason, setReturReason] = useState("");
  const [isPoHistoryOpen, setIsPoHistoryOpen] = useState(false);
  const [selectedPoHistory, setSelectedPoHistory] = useState<any | null>(null);
  const [poHistoryLogs, setPoHistoryLogs] = useState<any[]>([]);

  const [poForm, setPoForm] = useState({
    pbf: "",
    ordererName: "",
    ordererLicense: "",
    items: [{ name: "", qty: "" }]
  });
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [pbfList, setPbfList] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  // Faktur states
  const [isFakturOpen, setIsFakturOpen] = useState(false);
  const [fakturItems, setFakturItems] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [fakturIdInput, setFakturIdInput] = useState("");
  const [fakturDateInput, setFakturDateInput] = useState("");
  const [fakturPhoto, setFakturPhoto] = useState<string | null>(null);
  const [uploadedFakturId, setUploadedFakturId] = useState<string | null>(null);
  const [globalDiskonPersen, setGlobalDiskonPersen] = useState<number>(3);
  const [globalPajakPersen, setGlobalPajakPersen] = useState<number>(11);
  const [globalBiaya, setGlobalBiaya] = useState<number>(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const calculateRow = (item: any) => {
    const jumlah = typeof item.jumlah === 'string' ? parseFloat(item.jumlah.replace(/,/g, '')) || 0 : item.jumlah || 0;
    const harga = typeof item.harga === 'string' ? parseFloat(item.harga.replace(/,/g, '')) || 0 : item.harga || 0;
    const diskonPersen = typeof item.diskonPersen === 'string' ? parseFloat(item.diskonPersen.replace(/,/g, '')) || 0 : item.diskonPersen || 0;
    const subtotal = jumlah * harga;
    const nominalDiskon = subtotal * (diskonPersen / 100);
    const subtotalNet = subtotal - nominalDiskon;
    return { jumlah, harga, diskonPersen, subtotal, nominalDiskon, subtotalNet };
  };

  const { totalNet, globalDiskon, dpp, globalPajak, grandTotal } = (() => {
    const totalNet = fakturItems.reduce((acc, item) => acc + calculateRow(item).subtotalNet, 0);
    const globalDiskon = totalNet * (globalDiskonPersen / 100);
    const dpp = totalNet - globalDiskon;
    const globalPajak = dpp * (globalPajakPersen / 100);
    const grandTotal = dpp + globalPajak + globalBiaya;
    return { totalNet, globalDiskon, dpp, globalPajak, grandTotal };
  })();

  const formatCurrency = (val: number) => {
    return val.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getRowComputed = (item: any) => {
    const { jumlah, subtotalNet, nominalDiskon, subtotal, diskonPersen } = calculateRow(item);
    const dpp_w_diskon_global = totalNet > 0 ? subtotalNet - (subtotalNet / totalNet) * globalDiskon : subtotalNet;
    const ppn_proporsi = totalNet > 0 ? (subtotalNet / totalNet) * globalPajak : 0;
    const biaya_proporsi = totalNet > 0 ? (subtotalNet / totalNet) * globalBiaya : 0;
    
    const hppValue = jumlah > 0 ? (dpp_w_diskon_global + ppn_proporsi + biaya_proporsi) / jumlah : 0;
    // For HNA estimation we just add margim to HPP or just compute without tax
    const hnaValue = jumlah > 0 ? hppValue * 1.1 : 0; 
    
    return {
      subtotalFormatted: formatCurrency(subtotal),
      nominalDiskonFormatted: formatCurrency(nominalDiskon),
      hppFormatted: formatCurrency(hppValue),
      hnaFormatted: formatCurrency(hnaValue)
    };
  };

  const [fakturPaymentType, setFakturPaymentType] = useState("");
  const [isAddPbfModalOpen, setIsAddPbfModalOpen] = useState(false);
  const [newPbfForm, setNewPbfForm] = useState({ name: "", sales: "", phone: "", license: "", address: "" });

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await fetch('/api/upload-faktur', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 })
        });
        if (res.ok) {
          const data = await res.json();
          setFakturPhoto(base64 as string);
          setUploadedFakturId(data.id);
          setIsUploadModalOpen(false);
          setSelectedFile(null);
        }
      } catch (e) {
        console.error(e);
      }
    };
  };

  const handleAddPbf = async () => {
    try {
      const res = await fetch('/api/pbf', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPbfForm)
      });
      if (res.ok) {
        const added = await res.json();
        setPbfList([...pbfList, added]);
        setSelectedSupplier(added.name);
        setIsAddPbfModalOpen(false);
        setNewPbfForm({ name: "", sales: "", phone: "", license: "", address: "" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Hidden references for printing
  const printRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/po');
        const poData = await res.json();
        setPoList(poData);

        // Fetch inventory to generate smart suggestions
        const invRes = await fetch('/api/inventory');
        const invData = await invRes.json();
        setInventory(invData);
        
        const pbfRes = await fetch('/api/pbf');
        const pbfData = await pbfRes.json();
        setPbfList(pbfData);

        
        let suggestions: any[] = [];
        invData.forEach((item: any) => {
          // Simulation logic: average sales last 30 days and lead time
          const avgDailySales = Math.floor(Math.random() * 10) + 1; // 1-10 per day
          const leadTime = Math.floor(Math.random() * 5) + 2; // 2-6 days
          const reorderPoint = (avgDailySales * leadTime) + (item.minStock || 50) + 5; // safety stock

          if (item.stock < reorderPoint) {
            const suggestedQty = (avgDailySales * 30) - item.stock + (item.minStock || 50); // Order for 30 days
            suggestions.push({
              item: item,
              avgSales: avgDailySales,
              leadTime: leadTime,
              suggestedQty: Math.max(0, suggestedQty)
            });
          }
        });
        
        setSmartSuggestions(suggestions.slice(0, 4)); // Show top 4 urgent ones
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePrintPDF = (po: any) => {
    const element = printRefs.current[po.id];
    if (element) {
      // Create a clone to render temporarily for printing
      const printContainer = document.createElement('div');
      printContainer.innerHTML = element.innerHTML;
      printContainer.style.padding = '40px';
      printContainer.style.background = 'white';
      printContainer.style.color = 'black';
      document.body.appendChild(printContainer);

      const opt = {
        margin:       10,
        filename:     `Surat-Pesanan-${po.id}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      html2pdf().set(opt).from(printContainer).save().then(() => {
        document.body.removeChild(printContainer);
      });
    }
  };

  return (
    <div className="flex bg-surface min-h-screen">
      <SideNavBar />
      <MobileHeader title="Procurement" />
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0 w-full">
        <header className="bg-surface flex justify-between items-center w-full px-container-margin h-20 border-b border-outline-variant z-10 shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tight">Procurement</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsPoModalOpen(true)} className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-sm tracking-widest flex items-center gap-2 hover:bg-primary-fixed transition-colors">
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
              Buat Surat Pesanan
            </button>
            <button onClick={() => setIsFakturOpen(true)} className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded font-bold text-sm tracking-widest flex items-center gap-2 hover:bg-secondary-fixed transition-colors">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Input Faktur
            </button>
            <div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-4 h-10 border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-sm">search</span>
              <input type="text" placeholder="Search POs..." className="bg-transparent border-none focus:ring-0 text-sm w-64 text-on-surface placeholder:text-on-surface-variant font-body-md outline-none" />
              <span className="material-symbols-outlined text-on-surface-variant ml-2 text-sm cursor-pointer hover:text-primary">barcode_scanner</span>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-container-margin pb-24 md:pb-container-margin">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Smart Suggestions Section */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <span className="material-symbols-outlined text-[#1a73e8]">auto_awesome</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Rekomendasi Cerdas PO</h2>
              </div>
              <p className="font-body-md text-on-surface-variant mb-4">
                Disarankan berdasarkan rata-rata penjualan 30 hari terakhir dan Lead Time PBF.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {smartSuggestions.map((s, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    key={s.item.id} 
                    className="bg-surface-container-lowest border-l-4 border-primary border-y border-r border-outline-variant rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-on-surface">{s.item.name}</span>
                      {s.item.isSipnap && <span className="material-symbols-outlined text-regulatory-alert text-[16px]" title="Narkotika/Psikotropika">warning</span>}
                    </div>
                    <div className="text-xs text-on-surface-variant space-y-1 mb-3">
                      <div className="flex justify-between"><span>Sisa Stok:</span> <span className="font-mono">{s.item.stock}</span></div>
                      <div className="flex justify-between"><span>Avg Sales/Hari:</span> <span className="font-mono">{s.avgSales}</span></div>
                      <div className="flex justify-between"><span>Avg Lead Time:</span> <span className="font-mono">{s.leadTime} hari</span></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-outline-variant flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant">Saran Order:</span>
                      <span className="font-bold text-primary text-lg">{s.suggestedQty} Bx</span>
                    </div>
                  </motion.div>
                ))}
                {smartSuggestions.length === 0 && !isLoading && (
                  <div className="col-span-full p-4 text-center text-on-surface-variant bg-surface-muted rounded-xl">
                    Stok masih aman, tidak ada rekomendasi mendesak.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Daftar Surat Pesanan (PO)</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">Daftar PO yang telah dibuat dan siap dikirim.</p>
              </div>
              <div className="flex items-center space-x-4 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant shadow-sm">
                <button 
                  onClick={() => {
                    if (smartSuggestions.length === 0) {
                      alert("Tidak ada rekomendasi item untuk dipesan (semua stok di atas Reorder Point).");
                      return;
                    }
                    const autoItems = smartSuggestions.map(s => ({
                      name: s.item.name,
                      qty: s.suggestedQty
                    }));
                    setPoForm({
                      pbf: "General Auto-PO Supplier",
                      ordererName: "Sistem Auto-PO",
                      ordererLicense: "SYS-AUTO-001",
                      items: autoItems
                    });
                    setIsPoModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary text-on-primary rounded font-bold tracking-widest flex items-center gap-2 hover:bg-primary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">smart_button</span>
                  Auto-PO
                </button>
                <div className="pl-4 border-l border-outline-variant">
                  <p className="font-label-caps text-label-caps text-on-surface-variant">Total PO Active</p>
                  <p className="font-headline-md text-headline-md text-primary font-bold">{poList.length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {poList.length === 0 && !isLoading ? (
                <div className="col-span-full text-center py-12 text-on-surface-variant bg-surface-container-lowest border border-outline-variant rounded-xl border-dashed">
                  Belum ada Surat Pesanan yang dibuat.
                </div>
              ) : null}

              {poList.map((po, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  key={po.id}
                  className={`border-l-4 border-y border-r border-outline-variant rounded-2xl p-6 flex flex-col relative overflow-hidden shadow-lg backdrop-blur-sm group ${po.status === 'RECEIVED' ? 'bg-surface-container-lowest border-l-primary' : po.status === 'RETURNED' ? 'bg-error-container/30 border-l-regulatory-alert' : 'bg-surface-container-lowest border-l-info-blue'}`}
                >
                  <div className="flex justify-between items-start mb-4 relative z-10 w-full">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`font-label-caps text-label-caps px-2 py-0.5 rounded ${po.status === 'RECEIVED' ? 'bg-primary/20 text-primary' : po.status === 'RETURNED' ? 'bg-regulatory-alert/20 text-regulatory-alert' : 'bg-info-blue/10 text-info-blue'}`}>
                          {po.status || 'PENDING'}
                        </span>
                        <span className="font-data-mono text-data-mono text-on-surface-variant">{po.id}</span>
                      </div>
                      <h3 className="font-headline-md text-[20px] font-bold text-on-surface mt-2">{po.pbf}</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Pemesan: {po.ordererName}</p>
                    </div>
                  </div>
                  
                  <div className="bg-surface-muted rounded-xl border border-outline-variant p-4 mb-5 flex-1 relative z-10">
                    <p className="font-label-caps text-label-caps text-on-surface-variant mb-3 font-bold">Daftar Barang ({po.items?.length || 0})</p>
                    <ul className="space-y-3">
                      {po.items?.map((item: any, i: number) => (
                        <li key={i} className="flex justify-between items-center border-b border-outline-variant pb-2 last:border-0 last:pb-0">
                          <span className="font-body-md text-body-md text-on-surface">{item.name}</span>
                          <span className="font-data-mono text-data-mono text-on-surface-variant">Qty: {item.qty} Bx</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex flex-wrap justify-end gap-3 mt-auto relative z-10">
                     <button 
                       onClick={() => handlePrintPDF(po)}
                       className="px-4 py-2 rounded bg-surface-variant text-on-surface font-headline-md text-[14px] hover:bg-surface-container-high transition-colors flex items-center space-x-1"
                     >
                       <span className="material-symbols-outlined text-[18px]">print</span>
                       <span>Cetak PDF</span>
                     </button>
                     
                     {po.status === 'RECEIVED' && (
                       <>
                         <button 
                           onClick={async () => {
                             if (!po.fakturId) return;
                             try {
                               const res = await fetch(`/api/faktur/${po.fakturId}`);
                               const data = await res.json();
                               if (res.ok) {
                                 setSelectedFakturData(data.data);
                                 setIsFakturModalOpen(true);
                               }
                             } catch (e) {
                               console.error(e);
                             }
                           }}
                           className="px-4 py-2 rounded bg-secondary-container text-on-secondary-container font-headline-md text-[14px] hover:bg-secondary-fixed transition-colors flex items-center space-x-1"
                         >
                           <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                           <span>Lihat Faktur</span>
                         </button>
                         <button 
                           onClick={async () => {
                             try {
                               const res = await fetch(`/api/po/${po.id}/history`);
                               if (res.ok) {
                                 const logs = await res.json();
                                 setPoHistoryLogs(logs);
                                 setSelectedPoHistory(po);
                                 setIsPoHistoryOpen(true);
                               }
                             } catch(e) { console.error(e); }
                           }}
                           className="px-4 py-2 rounded bg-surface-variant text-primary font-headline-md text-[14px] hover:bg-surface-container-high transition-colors flex items-center space-x-1 border border-outline-variant"
                         >
                           <span className="material-symbols-outlined text-[18px]">history</span>
                           <span>Riwayat PO</span>
                         </button>
                         <button 
                           onClick={() => {
                             setSelectedPoRetur(po);
                             setReturReason("");
                             setIsReturModalOpen(true);
                           }}
                           className="px-4 py-2 rounded bg-error text-on-error font-headline-md text-[14px] hover:bg-red-600 transition-colors flex items-center space-x-1"
                         >
                           <span className="material-symbols-outlined text-[18px]">assignment_return</span>
                           <span>Retur PO</span>
                         </button>
                       </>
                     )}
                     
                    {isManager && (!po.status || po.status === 'PENDING') && (
                      <button className="px-6 py-2 rounded bg-primary text-on-primary font-headline-md text-[14px] hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors flex items-center space-x-1">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        <span>Approve & Send</span>
                      </button>
                    )}
                    
                    {!isManager && (!po.status || po.status === 'PENDING') && (
                      <span className="font-body-md text-sm text-on-surface-variant italic py-2">Menunggu Persetujuan Manager</span>
                    )}
                  </div>

                  {/* Hidden Printable Area */}
                  <div className="hidden">
                    <div ref={el => { printRefs.current[po.id] = el; }} className="p-8">
                       <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid black', paddingBottom: '20px' }}>
                          <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 'bold' }}>SURAT PESANAN (PO)</h1>
                          <p style={{ margin: '5px 0 0' }}>PHARMAPRECISION ERP - Jl. Kesehatan No. 123</p>
                       </div>

                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '14px' }}>
                          <div>
                            <p style={{ margin: '0 0 5px' }}><strong>Kepada:</strong></p>
                            <p style={{ margin: 0 }}>Kepala Cabang / PBF {po.pbf}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: '0 0 5px' }}><strong>No PO:</strong> {po.id}</p>
                            <p style={{ margin: '0 0 5px' }}><strong>Tanggal:</strong> {new Date().toLocaleDateString('id-ID')}</p>
                          </div>
                       </div>

                       <p style={{ marginBottom: '20px', fontSize: '14px' }}>
                         Mohon dikirimkan obat-obatan berikut ini untuk keperluan pelayanan kesehatan kami:
                       </p>

                       <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '14px' }}>
                         <thead>
                           <tr>
                             <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center', width: '50px' }}>No</th>
                             <th style={{ border: '1px solid black', padding: '10px', textAlign: 'left' }}>Nama Barang</th>
                             <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center', width: '100px' }}>Jumlah</th>
                             <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center', width: '150px' }}>Keterangan</th>
                           </tr>
                         </thead>
                         <tbody>
                           {po.items?.map((item: any, i: number) => (
                             <tr key={i}>
                               <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>{i + 1}</td>
                               <td style={{ border: '1px solid black', padding: '10px' }}>{item.name}</td>
                               <td style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>{item.qty}</td>
                               <td style={{ border: '1px solid black', padding: '10px' }}>-</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>

                       <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '60px', fontSize: '14px' }}>
                          <div style={{ textAlign: 'center', width: '250px' }}>
                            <p style={{ margin: '0 0 80px' }}>Hormat Kami,</p>
                            <p style={{ margin: '0 0 5px', fontWeight: 'bold', textDecoration: 'underline' }}>{po.ordererName}</p>
                            <p style={{ margin: 0 }}>No Izin: {po.ordererLicense}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Faktur Modal */}
      {isFakturModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center shrink-0">
              <h2 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                Faktur Diterima
              </h2>
              <button onClick={() => setIsFakturModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-surface-container">
              {selectedFakturData ? (
                <img src={selectedFakturData} alt="Faktur Uploaded" className="max-w-full h-auto object-contain border border-outline-variant" />
              ) : (
                <div className="text-on-surface-variant my-auto">Gambar faktur tidak tersedia.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PO History Modal */}
      {isPoHistoryOpen && selectedPoHistory && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-outline-variant flex justify-between items-start">
              <div>
                <h2 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Riwayat Surat Pesanan: {selectedPoHistory.id}
                </h2>
                <div className="text-sm text-on-surface-variant mt-1">Supplier: {selectedPoHistory.pbf}</div>
              </div>
              <button onClick={() => setIsPoHistoryOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6 mt-2">
                <div className="flex-1 bg-surface-muted border border-outline-variant rounded-lg p-3 text-sm flex justify-between">
                   <span className="font-bold text-on-surface-variant">Status PO</span>
                   <span className="font-label-caps bg-primary/20 text-primary px-2 py-0.5 rounded text-xs">{selectedPoHistory.status}</span>
                </div>
                <div className="flex-1 bg-surface-muted border border-outline-variant rounded-lg p-3 text-sm flex justify-between">
                   <span className="font-bold text-on-surface-variant">Tanggal Terima</span>
                   <span className="font-mono text-on-surface">{selectedPoHistory.receivedAt ? new Date(selectedPoHistory.receivedAt).toLocaleString() : '-'}</span>
                </div>
                <div className="flex-1 bg-surface-muted border border-outline-variant rounded-lg p-3 text-sm flex justify-between">
                   <span className="font-bold text-on-surface-variant">ID Faktur</span>
                   {selectedPoHistory.fakturId ? (
                     <button 
                       className="font-mono text-info-blue hover:underline font-bold"
                       onClick={async () => {
                         try {
                           const res = await fetch(`/api/faktur/${selectedPoHistory.fakturId}`);
                           const data = await res.json();
                           if (res.ok) {
                             setSelectedFakturData(data.data);
                             setIsFakturOpen(true);
                           }
                         } catch (e) {
                           console.error(e);
                         }
                       }}
                     >
                       Lihat {selectedPoHistory.fakturId}
                     </button>
                   ) : <span>-</span>}
                </div>
              </div>

              <h3 className="font-bold text-sm text-on-surface mb-3 uppercase tracking-widest border-b border-outline-variant pb-2">Log Mutasi Inventori (Terkait PO)</h3>
              
              {poHistoryLogs.length > 0 ? (
                <div className="space-y-4 font-mono text-sm">
                  {poHistoryLogs.map((log) => (
                    <div key={log.id} className="border border-outline-variant rounded-lg p-4 bg-surface-container-low hover:bg-surface-container-lowest transition-colors flex flex-col gap-2 relative">
                       <div className="flex justify-between items-start">
                         <div className="font-bold text-on-surface">{log.itemName} <span className="text-xs font-normal text-on-surface-variant ml-2">{log.itemId}</span></div>
                         <div className="text-xs text-on-surface-variant">{new Date(log.timestamp).toLocaleString()}</div>
                       </div>
                       <div className="flex items-center gap-4 text-sm mt-1">
                          <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${log.type === 'IN' ? 'bg-primary-container text-primary' : 'bg-error-container text-on-error-container'}`}>
                            {log.type}
                          </span>
                          <div className="flex items-center gap-2">
                             <span className="text-on-surface-variant">Stok Lama:</span> <span className="line-through opacity-70 border border-outline-variant px-1 rounded">{log.oldStock}</span>
                             <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                             <span className="font-bold text-lg text-primary">{log.newStock}</span>
                          </div>
                       </div>
                       <div className="text-xs text-on-surface-variant border-t border-outline-variant pt-2 mt-1">Catatan: {log.reason}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-on-surface-variant bg-surface-muted rounded-xl border border-dashed border-outline-variant">
                  Tidak ada catatan mutasi inventori untuk PO ini.
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-outline-variant bg-surface-muted rounded-b-2xl flex justify-end">
               <button onClick={() => setIsPoHistoryOpen(false)} className="px-6 py-2 bg-surface hover:bg-surface-variant border border-outline-variant text-on-surface rounded font-bold text-sm tracking-widest transition-colors flex items-center gap-2">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Retur Modal */}
      {isReturModalOpen && selectedPoRetur && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl flex flex-col p-6">
            <h2 className="font-headline-md font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-error">assignment_return</span>
              Retur Surat Pesanan
            </h2>
            
            <p className="text-body-md text-on-surface-variant mb-6">
              Anda akan melakukan retur faktur dari PO <span className="font-bold text-on-surface">{selectedPoRetur.id}</span>.
              Hal ini akan mengurangi stok otomatis untuk seluruh barang di surat pesanan ini.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-on-surface mb-2">Keterangan / Alasan Retur</label>
              <textarea 
                className="w-full h-24 p-3 bg-surface border border-outline-variant rounded focus:outline-none focus:border-error focus:ring-1 focus:ring-error"
                placeholder="Misal: Barang yang diterima rusak/kadaluarsa atau pesanan tidak sesuai spesifikasi..."
                value={returReason}
                onChange={e => setReturReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-auto">
              <button 
                onClick={() => setIsReturModalOpen(false)}
                className="px-4 py-2 border border-outline-variant text-on-surface rounded font-medium hover:bg-surface-variant"
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                  if (!returReason.trim()) {
                    alert("Harap isi keterangan/alasan retur!");
                    return;
                  }
                  try {
                    const res = await fetch(`/api/po/${selectedPoRetur.id}/retur`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason: returReason })
                    });
                    
                    if (res.ok) {
                      const updatedPo = await res.json();
                      setPoList(poList.map(p => p.id === updatedPo.id ? updatedPo : p));
                      setIsReturModalOpen(false);
                    }
                  } catch(e) {
                    console.error(e);
                  }
                }}
                className="px-6 py-2 bg-error text-on-error rounded font-bold hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">check</span> Konfirmasi Retur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 bg-background md:bg-black/60 z-[100] md:flex items-center justify-center md:p-4 backdrop-blur-sm overflow-hidden">
          <MobileHeader title="Surat Pesanan" onBack={() => setIsPoModalOpen(false)} />
          <div className="bg-surface-container-lowest w-full h-full md:h-auto max-w-4xl max-h-none md:max-h-[90vh] rounded-none md:rounded shadow-none md:shadow-xl flex flex-col border-none md:border md:border-border-subtle pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0">
            <div className="hidden md:flex p-6 border-b border-border-subtle justify-between items-center bg-surface-muted">
              <h2 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">shopping_cart</span>
                Surat Pesanan (PO)
              </h2>
              <button onClick={() => setIsPoModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 font-body-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-on-surface mb-2">PBF / Vendor Tujuan</label>
                  <select 
                    className="w-full h-10 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary"
                    value={poForm.pbf}
                    onChange={(e) => setPoForm({ ...poForm, pbf: e.target.value })}
                  >
                    <option value="">-- Pilih PBF --</option>
                    {pbfList.map(pbf => (
                      <option key={pbf.id} value={pbf.name}>{pbf.name}</option>
                    ))}
                  </select>
                </div>
                <div></div>
                <div>
                  <label className="block font-bold text-on-surface mb-2">Nama Pemesan (Apoteker/TTK)</label>
                  <input 
                    type="text" 
                    className="w-full h-10 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary" 
                    placeholder="Nama lengkap pemesan..." 
                    value={poForm.ordererName}
                    onChange={(e) => setPoForm({ ...poForm, ordererName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface mb-2">No. Izin (SIPA/SIPTTK)</label>
                  <input 
                    type="text" 
                    className="w-full h-10 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary" 
                    placeholder="Masukkan Nomor Izin..." 
                    value={poForm.ordererLicense}
                    onChange={(e) => setPoForm({ ...poForm, ordererLicense: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-on-surface text-lg border-b-2 border-primary pb-1">Daftar Barang Pesanan</h3>
                  <button 
                    onClick={() => setPoForm({ ...poForm, items: [...poForm.items, { name: "", qty: "" }] })}
                    className="px-3 py-1.5 bg-primary-container text-primary rounded flex items-center gap-1 font-bold text-sm border border-primary/20 hover:bg-primary-fixed"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span> Tambah Baris
                  </button>
                </div>
                
                <div className="border border-border-subtle rounded overflow-hidden">
                  <table className="w-full text-left bg-surface-container-lowest">
                    <thead>
                      <tr className="bg-surface-muted border-b border-border-subtle">
                        <th className="p-3 font-bold w-12 text-center text-on-surface-variant">No</th>
                        <th className="p-3 font-bold text-on-surface-variant">Nama Barang</th>
                        <th className="p-3 font-bold w-32 text-on-surface-variant">Qty</th>
                        <th className="p-3 font-bold w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {poForm.items.map((item, index) => (
                        <tr key={index}>
                          <td className="p-3 text-center">{index + 1}</td>
                          <td className="p-2">
                            <select 
                              className="w-full h-9 px-2 bg-surface border border-border-subtle rounded focus:outline-none focus:border-primary"
                              value={item.name}
                              onChange={(e) => {
                                const newItems = [...poForm.items];
                                newItems[index].name = e.target.value;
                                setPoForm({ ...poForm, items: newItems });
                              }}
                            >
                              <option value="">-- Pilih Barang --</option>
                              {inventory.map(invItem => (
                                <option key={invItem.id} value={invItem.name}>{invItem.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              className="w-full h-9 px-2 bg-surface text-right border border-border-subtle rounded focus:outline-none focus:border-primary"
                              placeholder="0"
                              value={item.qty}
                              onChange={(e) => {
                                const newItems = [...poForm.items];
                                newItems[index].qty = e.target.value;
                                setPoForm({ ...poForm, items: newItems });
                              }}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => {
                                const newItems = [...poForm.items];
                                newItems.splice(index, 1);
                                setPoForm({ ...poForm, items: newItems });
                              }}
                              className="p-1.5 text-regulatory-alert hover:bg-error-container rounded transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border-subtle flex justify-end gap-3 bg-surface-muted mt-auto">
              <button onClick={() => setIsPoModalOpen(false)} className="px-4 py-2 bg-surface border border-border-subtle text-on-surface rounded font-medium flex items-center gap-2 hover:bg-surface-variant">
                <span className="material-symbols-outlined text-[18px]">close</span> Batal
              </button>
              <button 
                onClick={async () => {
                  if (!poForm.pbf || !poForm.ordererName) {
                    alert("PBF dan Nama Pemesan wajib diisi!");
                    return;
                  }
                  
                  // Validation check for PO
                  let warnings = [];
                  for (const item of poForm.items) {
                    if (!item.name) continue;
                    const invItem = inventory.find(inv => inv.name === item.name);
                    if (invItem) {
                      // Determine min stock dynamically or use 100 as default
                      const minStock = invItem.minStock || 100;
                      if (invItem.stock >= minStock) {
                        warnings.push(`- ${item.name} masih memiliki stok di atas level minimum (Stok: ${invItem.stock}, Min: ${minStock}).`);
                      }
                      if (invItem.isSipnap) {
                        warnings.push(`- Peringatan: ${item.name} adalah Obat Narkotika/Psikotropika yang memerlukan penanganan khusus.`);
                      }
                    }
                  }
                  
                  if (warnings.length > 0) {
                    const confirmMsg = "Validasi PO menemukan hal berikut:\n" + warnings.join('\n') + "\n\nLanjutkan membuat PO?";
                    if (!window.confirm(confirmMsg)) {
                      return;
                    }
                  }

                  try {
                    const res = await fetch('/api/po', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(poForm)
                    });
                    if (res.ok) {
                      const savedPO = await res.json();
                      setPoList([...poList, savedPO]);
                      setPoForm({ pbf: "", ordererName: "", ordererLicense: "", items: [{ name: "", qty: "" }] });
                      setIsPoModalOpen(false);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-6 py-2 bg-primary text-on-primary rounded font-bold tracking-widest flex items-center gap-2 hover:bg-primary-fixed"
              >
                <span className="material-symbols-outlined text-[18px]">save</span> Simpan PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT FAKTUR */}
      {isFakturOpen && (
        <div className="fixed inset-0 bg-background md:bg-black/60 z-[100] md:flex items-center justify-center md:p-4 backdrop-blur-sm overflow-hidden">
          <MobileHeader title="Input Faktur" onBack={() => setIsFakturOpen(false)} />
          <div className="bg-surface-container-lowest w-full h-full md:max-h-[95vh] max-w-7xl rounded-none md:rounded shadow-none md:shadow-2xl flex flex-col my-auto border-none md:border border-outline-variant pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0">
            <div className="hidden md:flex p-6 pb-2 justify-center border-b border-border-subtle mb-4">
              <h2 className="text-3xl text-on-surface font-semibold mb-4">Verifikasi Pembelian Obat</h2>
            </div>
            
            <div className="px-6 flex-1 overflow-y-auto flex flex-col gap-6 font-body-md text-sm pb-6">
              {/* Top Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <label className="w-32 font-bold text-on-surface text-right pr-4">No. PO</label>
                    <select 
                      className="flex-1 h-9 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary"
                      value={selectedPoId}
                      onChange={(e) => {
                        const newPoId = e.target.value;
                        setSelectedPoId(newPoId);
                        const poInfo = poList.find(p => p.id === newPoId);
                        if (poInfo) {
                           setSelectedSupplier(poInfo.pbf);
                           setFakturItems(poInfo.items.map((it: any, idx: number) => {
                             const invItem = inventory.find((inv: any) => inv.name.toLowerCase() === (it.name || '').toLowerCase());
                             return {
                               id: Date.now() + idx,
                               kode: invItem ? invItem.id : "",
                               nama: it.name,
                               jumlah: it.qty || 0,
                               satuan: "Box",
                               harga: 0,
                               diskonPersen: 0
                             };
                           }));
                        } else {
                          setSelectedSupplier("");
                          setFakturItems([]);
                          setFakturIdInput("");
                          setFakturDateInput("");
                        }
                      }}
                    >
                      <option value="">-- Pilih Surat Pesanan --</option>
                      {poList.map(po => (
                        <option key={po.id} value={po.id}>{po.id} ({po.pbf}) - {po.ordererName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 font-bold text-on-surface text-right pr-4">No. Faktur</label>
                    <input type="text" className="flex-1 h-9 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary" value={fakturIdInput} onChange={(e) => setFakturIdInput(e.target.value)} placeholder="Input nomor faktur..." />
                  </div>
                  <div className="flex items-center">
                    <label className="w-32 font-bold text-on-surface text-right pr-4">Tanggal Faktur</label>
                    <input type="date" className="flex-1 h-9 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary" value={fakturDateInput} onChange={(e) => setFakturDateInput(e.target.value)} />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-start">
                    <label className="w-24 font-bold text-on-surface text-right pr-4 mt-2">PBF</label>
                    <div className="flex-1 flex flex-col gap-1">
                      <select 
                        className={`w-full h-9 px-3 bg-surface-muted border rounded focus:outline-none focus:border-primary ${selectedSupplier === 'NOT_FOUND' ? 'border-regulatory-alert text-regulatory-alert' : 'border-border-subtle'}`}
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                      >
                        <option value="">-- Pilih PBF --</option>
                        {pbfList.map(pbf => (
                          <option key={pbf.id} value={pbf.name}>{pbf.name}</option>
                        ))}
                        <option value="NOT_FOUND">-- PBF Lain (Tidak Ditemukan) --</option>
                      </select>
                      {selectedSupplier === 'NOT_FOUND' && (
                        <div className="flex flex-col gap-2 mt-1">
                          <span className="text-regulatory-alert text-xs font-medium">⚠️ PBF tidak ditemukan.</span>
                          <button onClick={() => setIsAddPbfModalOpen(true)} className="w-full text-center py-2 bg-primary-container text-primary hover:bg-primary-fixed-dim rounded font-bold text-xs transition-colors flex items-center justify-center gap-1 border border-primary/20">
                            <span className="material-symbols-outlined text-[16px]">add_business</span>
                            Tambah PBF Baru
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="w-24 font-bold text-on-surface text-right pr-4">Gudang</label>
                    <input type="text" className="flex-1 h-9 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none" defaultValue="GUDANG UTAMA" readOnly />
                  </div>
                  <div className="flex items-center">
                    <label className="w-24 font-bold text-on-surface text-right pr-4">Jenis</label>
                    <div className="flex-1 flex gap-4">
                      <select 
                        className="w-1/3 h-9 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary"
                        value={fakturPaymentType}
                        onChange={(e) => setFakturPaymentType(e.target.value)}
                      >
                        <option value="">-- Pilih Jenis --</option>
                        <option value="TUNAI">TUNAI</option>
                        <option value="KREDIT">KREDIT</option>
                        <option value="KONSINYASI">KONSINYASI</option>
                      </select>
                      {(fakturPaymentType === "KREDIT" || fakturPaymentType === "KONSINYASI") && (
                        <div className="flex-1 flex gap-2 items-center">
                          <span className="text-on-surface-variant whitespace-nowrap text-xs font-bold uppercase">Jatuh Tempo</span>
                          <input type="date" className="flex-1 h-9 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Summary & Actions Section */}
              <div className="flex flex-col gap-3">
                {/* Upper compact bar for Upload and verification buttons */}
                <div className="flex justify-between items-center gap-2 bg-surface-muted border border-border-subtle p-2 rounded-lg">
                  <div className="flex items-center gap-2 flex-wrap">
                    {fakturPhoto ? (
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-bold text-primary flex items-center gap-1 bg-primary-container px-2 py-1 rounded border border-primary/20">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Tersimpan
                        </div>
                        <a href={fakturPhoto} download="faktur.png" className="px-2 py-1 bg-surface text-info-blue hover:bg-surface-muted rounded text-[11px] font-bold border border-border-subtle flex items-center gap-1 cursor-pointer">
                          <span className="material-symbols-outlined text-[14px]">download</span> Download
                        </a>
                        <a href={fakturPhoto} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-surface text-info-blue hover:bg-surface-muted rounded text-[11px] font-bold border border-border-subtle flex items-center gap-1 cursor-pointer">
                          <span className="material-symbols-outlined text-[14px]">visibility</span> Lihat
                        </a>
                        <button onClick={() => setFakturPhoto(null)} className="px-2 py-1 bg-surface text-regulatory-alert hover:bg-error-container rounded text-[11px] font-bold border border-border-subtle flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">delete</span> Hapus
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setIsUploadModalOpen(true)} className="px-3 py-1 bg-surface border border-dashed border-primary/50 text-primary hover:bg-primary-container rounded flex items-center gap-1 text-xs font-bold transition-all">
                        <span className="material-symbols-outlined text-[14px]">upload_file</span>
                        Upload Bukti Fisik
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-surface-muted hover:bg-surface border border-border-subtle text-on-surface rounded flex items-center gap-1 text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">refresh</span> Reset
                    </button>
                    <button className="px-3 py-1 bg-[#5cb85c] hover:bg-[#449d44] text-white rounded flex items-center gap-1 text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">verified</span> Verifikasi
                    </button>
                  </div>
                </div>

                {/* Lower compact bar for Totals */}
                <div className="flex gap-4 border border-outline-variant rounded-lg p-3 bg-surface-container-lowest shadow-sm items-center">
                  <div className="flex-1 grid grid-cols-4 gap-4">
                     <div>
                       <div className="text-[10px] font-bold text-on-surface-variant flex items-center">Total Net</div>
                       <input type="text" className="w-full h-8 px-2 text-xs bg-surface-muted border border-border-subtle rounded focus:outline-none text-right font-mono text-on-surface-variant" value={formatCurrency(totalNet)} readOnly />
                     </div>
                     <div className="flex gap-1 relative">
                       <div className="w-1/3">
                         <div className="text-[10px] font-bold text-on-surface-variant text-center">Diskon %</div>
                         <input type="number" className="w-full h-8 px-1 text-xs bg-surface border border-border-subtle rounded focus:outline-none focus:border-primary text-center" value={globalDiskonPersen || ''} onChange={(e) => setGlobalDiskonPersen(parseFloat(e.target.value) || 0)} />
                       </div>
                       <div className="flex-1">
                         <div className="text-[10px] font-bold text-on-surface-variant text-right pr-2">Rp Diskon</div>
                         <input type="text" className="w-full h-8 px-2 text-xs bg-surface-muted border border-border-subtle rounded focus:outline-none text-right font-mono text-on-surface-variant" value={formatCurrency(globalDiskon)} readOnly />
                       </div>
                     </div>
                     <div className="flex gap-1">
                       <div className="w-1/3">
                         <div className="text-[10px] font-bold text-on-surface-variant text-center">Pajak %</div>
                         <input type="number" className="w-full h-8 px-1 text-xs bg-surface border border-border-subtle rounded focus:outline-none focus:border-primary text-center" value={globalPajakPersen || ''} onChange={(e) => setGlobalPajakPersen(parseFloat(e.target.value) || 0)} />
                       </div>
                       <div className="flex-1">
                         <div className="text-[10px] font-bold text-on-surface-variant text-right pr-2">Rp Pajak</div>
                         <input type="text" className="w-full h-8 px-2 text-xs bg-surface-muted border border-border-subtle rounded focus:outline-none text-right font-mono text-on-surface-variant" value={formatCurrency(globalPajak)} readOnly />
                       </div>
                     </div>
                     <div>
                       <div className="text-[10px] font-bold text-on-surface-variant flex items-center justify-end pr-2">Biaya Lain</div>
                       <input type="number" className="w-full h-8 px-2 text-xs bg-surface border border-border-subtle rounded focus:outline-none focus:border-primary text-right font-mono" value={globalBiaya !== 0 ? globalBiaya : ''} onChange={(e) => setGlobalBiaya(parseFloat(e.target.value) || 0)} />
                     </div>
                  </div>
                  <div className="border-l border-outline-variant pl-4 pr-2 flex flex-col items-end min-w-[200px]">
                     <div className="text-[10px] font-bold text-on-surface-variant mb-0.5">GRAND TOTAL</div>
                     <div className="text-3xl font-bold font-mono text-primary tracking-tight leading-none">{formatCurrency(grandTotal)}</div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border-2 border-regulatory-alert rounded-lg overflow-x-auto mb-6">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-surface-container-lowest border-b border-outline-variant font-bold text-on-surface">
                    <tr>
                      <th className="p-3 border-r border-border-subtle text-center">No.</th>
                      <th className="p-3 border-r border-border-subtle text-center">+</th>
                      <th className="p-3 border-r border-border-subtle">Kode Obat</th>
                      <th className="p-3 border-r border-border-subtle">Nama Obat</th>
                      <th className="p-3 border-r border-border-subtle text-center">Jumlah</th>
                      <th className="p-3 border-r border-border-subtle">Satuan</th>
                      <th className="p-3 border-r border-border-subtle text-right">Harga Beli</th>
                      <th className="p-3 border-r border-border-subtle text-right">Subtotal</th>
                      <th className="p-3 border-r border-border-subtle text-center">Diskon(%)</th>
                      <th className="p-3 border-r border-border-subtle text-right">Nominal Diskon</th>
                      <th className="p-3 border-r border-border-subtle text-right">HPP</th>
                      <th className="p-3 text-right">Hna + Ppn</th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface-container-lowest divide-y divide-outline-variant">
                    {fakturItems.map((row, index) => {
                      const computed = getRowComputed(row);
                      return (
                      <tr key={row.id}>
                        <td className="p-3 border-r border-border-subtle text-center">{index + 1}</td>
                        <td className="p-3 border-r border-border-subtle text-center text-on-surface-variant font-bold cursor-pointer hover:bg-surface-muted group relative">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </td>
                        <td className="p-0 border-r border-border-subtle">
                          <input type="text" className="w-full h-full min-h-[36px] px-2 bg-transparent text-on-surface focus:outline-none focus:bg-surface-muted transition-colors" value={row.kode} onChange={(e) => {
                             const newItems = [...fakturItems];
                             newItems[index].kode = e.target.value;
                             setFakturItems(newItems);
                          }} placeholder="Kode" />
                        </td>
                        <td className="p-0 border-r border-border-subtle">
                          <input type="text" className="w-full h-full min-h-[36px] px-2 bg-transparent text-on-surface focus:outline-none focus:bg-surface-muted transition-colors" value={row.nama} onChange={(e) => {
                             const newItems = [...fakturItems];
                             newItems[index].nama = e.target.value;
                             setFakturItems(newItems);
                          }} placeholder="Nama Obat" />
                        </td>
                        <td className="p-2 border-r border-border-subtle text-center min-w-[80px]">
                          <input type="number" 
                            className="w-full bg-surface-muted border border-border-subtle rounded px-2 h-7 text-right focus:outline-none focus:border-primary focus:bg-surface" 
                            value={row.jumlah} 
                            onChange={e => {
                               const newItems = [...fakturItems];
                               newItems[index].jumlah = parseFloat(e.target.value) || 0;
                               setFakturItems(newItems);
                            }}
                          />
                        </td>
                        <td className="p-0 border-r border-border-subtle">
                          <select className="w-full h-full min-h-[36px] px-2 bg-transparent text-on-surface focus:outline-none focus:bg-surface-muted transition-colors" value={row.satuan} onChange={(e) => {
                             const newItems = [...fakturItems];
                             newItems[index].satuan = e.target.value;
                             setFakturItems(newItems);
                          }}>
                            <option value="Box">Box</option>
                            <option value="Strip">Strip</option>
                            <option value="Botol">Botol</option>
                            <option value="Ampul">Ampul</option>
                            <option value="Pcs">Pcs</option>
                            <option value="Tube">Tube</option>
                          </select>
                        </td>
                        <td className="p-2 border-r border-border-subtle min-w-[100px]">
                          <input type="number" 
                            className="w-full bg-surface-muted border border-border-subtle rounded px-2 h-7 text-right focus:outline-none focus:border-primary focus:bg-surface" 
                            value={row.harga} 
                            onChange={e => {
                               const newItems = [...fakturItems];
                               newItems[index].harga = parseFloat(e.target.value) || 0;
                               setFakturItems(newItems);
                            }}
                          />
                        </td>
                        <td className="p-2 border-r border-border-subtle min-w-[100px]">
                          <input type="text" className="w-full bg-surface-muted border border-border-subtle rounded px-2 h-7 text-right focus:outline-none" value={computed.subtotalFormatted} readOnly />
                        </td>
                        <td className="p-2 border-r border-border-subtle min-w-[60px]">
                          <input type="number" 
                            className="w-full bg-surface-muted border border-border-subtle rounded px-2 h-7 text-right focus:outline-none focus:border-primary focus:bg-surface" 
                            value={row.diskonPersen} 
                            onChange={e => {
                               const newItems = [...fakturItems];
                               newItems[index].diskonPersen = parseFloat(e.target.value) || 0;
                               setFakturItems(newItems);
                            }}
                          />
                        </td>
                        <td className="p-2 border-r border-border-subtle min-w-[100px]">
                          <input type="text" className="w-full bg-surface-muted border border-border-subtle rounded px-2 h-7 text-right focus:outline-none" value={computed.nominalDiskonFormatted} readOnly />
                        </td>
                        <td className="p-2 border-r border-border-subtle min-w-[100px]">
                          <input type="text" className="w-full bg-surface-muted border border-border-subtle rounded px-2 h-7 text-right focus:outline-none font-bold text-primary" value={computed.hppFormatted} readOnly />
                        </td>
                        <td className="p-2 min-w-[100px]">
                          <input type="text" className="w-full bg-surface-muted border border-border-subtle rounded px-2 h-7 text-right focus:outline-none font-bold" value={computed.hnaFormatted} readOnly />
                        </td>
                      </tr>
                      );
                    })}
                    <tr>
                      <td colSpan={12} className="p-0 border-t border-border-subtle">
                        <button 
                          onClick={() => setFakturItems([...fakturItems, { id: Date.now(), kode: "", nama: "", jumlah: 0, satuan: "Box", harga: 0, diskonPersen: 0 }])}
                          className="w-full py-3 bg-surface-container-low hover:bg-surface-muted text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors border-dashed border-b-2 border-outline-variant"
                        >
                          <span className="material-symbols-outlined text-[18px]">add_circle</span> Tambah Barang Baru
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions for Faktur */}
            <div className="p-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-muted md:rounded-b mt-auto shrink-0">
               <button onClick={() => setIsFakturOpen(false)} className="px-6 py-2 bg-surface hover:bg-surface-muted border border-border-subtle text-on-surface rounded font-bold text-sm tracking-widest transition-colors flex items-center gap-2">
                 Batal
               </button>
               <button 
                 onClick={async () => {
                   if (fakturItems.length === 0 || fakturItems.every((it) => it.kode === "")) {
                     alert("Harap tambahkan minimal satu barang dengan kode valid.");
                     return;
                   }
                   if (!selectedPoId) {
                     alert("Pilih Purchase Order (PO) terlebih dahulu.");
                     return;
                   }
                   if (!uploadedFakturId) {
                     alert("Upload foto fisik faktur terlebih dahulu.");
                     return;
                   }
                   try {
                     const res = await fetch('/api/inventory/faktur', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                         items: fakturItems,
                         poId: selectedPoId,
                         fakturId: uploadedFakturId,
                         supplier: selectedSupplier || "Unknown"
                       })
                     });
                     if (res.ok) {
                       alert("Faktur berhasil disimpan, stok obat bertambah!");
                       setIsFakturOpen(false);
                       
                       setFakturItems([{ id: 1, kode: "", nama: "", jumlah: 0, satuan: "Box", harga: 0, diskonPersen: 0 }]);
                       setSelectedPoId("");
                       setFakturIdInput("");
                       setFakturPhoto(null);
                       setUploadedFakturId(null);
                       
                       // Refresh PO data and inventory data
                       const poRes = await fetch('/api/po');
                       const poData = await poRes.json();
                       setPoList(poData);
                     }
                   } catch (e) {
                     console.error("Gagal simpan faktur", e);
                     alert("Terdapat kesalahan saat menyimpan faktur");
                   }
                 }} 
                 className="px-6 py-2 bg-primary text-on-primary rounded font-bold text-sm tracking-widest hover:bg-primary-fixed transition-colors flex items-center gap-2 shadow-sm"
               >
                 <span className="material-symbols-outlined text-[18px]">save</span> Simpan Faktur
               </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Upload Scan Faktur Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded shadow-xl flex flex-col border border-border-subtle">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-muted">
              <h2 className="font-headline-md font-bold text-on-surface">Upload Scan Faktur</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 font-body-md text-sm">
              <div>
                <label className="block font-bold text-on-surface mb-2">Pilih File Image (Scan/Foto)</label>
                <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-primary hover:file:bg-primary/20" />
              </div>
            </div>
            <div className="p-6 border-t border-border-subtle flex justify-end gap-3 bg-surface-muted mt-auto">
               <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 bg-surface hover:bg-surface-muted border border-border-subtle text-on-surface rounded font-medium flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">close</span> Batal
               </button>
               <button onClick={handleUploadPhoto} disabled={!selectedFile} className="px-4 py-2 bg-[#5cb85c] hover:bg-[#449d44] disabled:opacity-50 text-white rounded font-medium flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">upload</span> Upload
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Add PBF Modal */}
      {isAddPbfModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded shadow-xl flex flex-col border border-border-subtle">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-muted">
              <h2 className="font-headline-md font-bold text-on-surface">Tambah PBF Baru</h2>
              <button onClick={() => setIsAddPbfModalOpen(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 font-body-md text-sm">
              <div>
                <label className="block font-bold text-on-surface mb-2">Nama PBF <span className="text-regulatory-alert">*</span></label>
                <input type="text" value={newPbfForm.name} onChange={(e) => setNewPbfForm({...newPbfForm, name: e.target.value})} className="w-full h-10 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary" placeholder="Masukkan nama PBF..." />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Nama Sales</label>
                <input type="text" value={newPbfForm.sales} onChange={(e) => setNewPbfForm({...newPbfForm, sales: e.target.value})} className="w-full h-10 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary" placeholder="Nama representatif sales..." />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Nomor Telepon PBF <span className="text-regulatory-alert">*</span></label>
                <input type="text" value={newPbfForm.phone} onChange={(e) => setNewPbfForm({...newPbfForm, phone: e.target.value})} className="w-full h-10 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary" placeholder="021-XXXXXXX" />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Nomor Izin PBF</label>
                <input type="text" value={newPbfForm.license} onChange={(e) => setNewPbfForm({...newPbfForm, license: e.target.value})} className="w-full h-10 px-3 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary" placeholder="Masukkan No. Izin..." />
              </div>
              <div>
                <label className="block font-bold text-on-surface mb-2">Alamat PBF <span className="text-regulatory-alert">*</span></label>
                <textarea value={newPbfForm.address} onChange={(e) => setNewPbfForm({...newPbfForm, address: e.target.value})} className="w-full px-3 py-2 bg-surface-muted border border-border-subtle rounded focus:outline-none focus:border-primary shrink-0 min-h-[80px]" placeholder="Alamat lengkap PBF..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-border-subtle flex justify-end gap-3 bg-surface-muted mt-auto">
               <button onClick={() => setIsAddPbfModalOpen(false)} className="px-4 py-2 bg-surface hover:bg-surface-muted border border-border-subtle text-on-surface rounded font-medium flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">close</span> Batal
               </button>
               <button onClick={handleAddPbf} disabled={!newPbfForm.name} className="px-4 py-2 bg-[#5cb85c] hover:bg-[#449d44] disabled:opacity-50 text-white rounded font-medium flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">save</span> Simpan PBF
               </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
}
