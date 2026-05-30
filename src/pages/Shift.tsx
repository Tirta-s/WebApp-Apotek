import React, { useState, useEffect, useMemo } from "react";
import { SideNavBar, BottomNavBar, MobileHeader } from "../components/Navigation";
import { Link } from "react-router-dom";

// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function Shift() {
  const userRole = localStorage.getItem("userRole") || "Staff";
  const isManager = userRole === "Manager";

  const [transactions, setTransactions] = useState<any[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Record<string, any>>({});
  
  // States for filtering
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  
  // Decide current shift based on current time
  const currentHour = today.getHours();
  let defaultShift = 1;
  if (currentHour >= 15 && currentHour < 23) defaultShift = 2;
  else if (currentHour >= 23 || currentHour < 7) defaultShift = 3;
  
  const [selectedShift, setSelectedShift] = useState(defaultShift);

  const [expandedTrx, setExpandedTrx] = useState<string | null>(null);
  
  // Kartu Stok modal states
  const [stockModalItem, setStockModalItem] = useState<{itemId: string, itemName: string} | null>(null);
  const [stockLogs, setStockLogs] = useState<any[]>([]);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const fetchTransactions = async () => {
    try {
      const resTrx = await fetch('/api/shift/transactions');
      if (resTrx.ok) {
        const dataTrx = await resTrx.json();
        setTransactions(dataTrx.reverse());
      }
      
      const resInv = await fetch('/api/inventory');
      if (resInv.ok) {
        const invData = await resInv.json();
        const map: Record<string, any> = {};
        invData.forEach((i: any) => map[i.id] = i);
        setInventoryMap(map);
      }
    } catch (e) {
      console.error("Gagal refresh data shift", e);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const intervalId = setInterval(fetchTransactions, 5 * 60 * 1000); // 5 mins
    return () => clearInterval(intervalId);
  }, []);

  const getShiftData = (isoString: string) => {
    const d = new Date(isoString);
    const hour = d.getHours();
    let shift = 1;
    let logicalDate = new Date(isoString);
    if (hour >= 7 && hour < 15) {
       shift = 1;
    } else if (hour >= 15 && hour < 23) {
       shift = 2;
    } else {
       shift = 3;
       if (hour < 7) {
         logicalDate.setDate(logicalDate.getDate() - 1);
       }
    }
    return {
      year: logicalDate.getFullYear(),
      month: logicalDate.getMonth(),
      day: logicalDate.getDate(),
      shift
    };
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(trx => {
      if (!trx.timestamp) return false;
      const t = getShiftData(trx.timestamp);
      return t.year === selectedYear && 
             t.month === selectedMonth && 
             t.day === selectedDay && 
             t.shift === selectedShift;
    });
  }, [transactions, selectedYear, selectedMonth, selectedDay, selectedShift]);

  const summary = useMemo(() => {
    return {
      totalSales: filteredTransactions.reduce((acc, curr) => acc + (curr.total || 0), 0),
      transactionCount: filteredTransactions.length
    }
  }, [filteredTransactions]);

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const openStockModal = async (itemId: string, itemName: string) => {
    setStockModalItem({ itemId, itemName });
    setIsStockModalOpen(true);
    setStockLogs([]);
    try {
      const res = await fetch(`/api/inventory/${itemId}/logs`);
      if (res.ok) {
        const data = await res.json();
        setStockLogs(data.reverse()); // latest first
      }
    } catch(e) {
      console.error(e);
    }
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const handlePrintPdf = () => {
    // create a hidden div
    const printElement = document.createElement("div");
    printElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #000; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 10px;">
          <h1 style="margin: 0; font-size: 24px;">PHARMAPRECISION ERP</h1>
          <p style="margin: 5px 0 0; font-size: 14px;">Jl. Raya Apotek No. 123, Jakarta Selatan</p>
          <p style="margin: 5px 0 0; font-size: 12px; font-weight: bold;">LAPORAN SHIFT TRANSAKSI</p>
        </div>
        <div style="margin-bottom: 20px; font-size: 14px;">
          <p><strong>Tanggal:</strong> ${selectedDay}-${selectedMonth + 1}-${selectedYear}</p>
          <p><strong>Shift:</strong> ${selectedShift}</p>
          <p><strong>Total Penjualan:</strong> Rp ${new Intl.NumberFormat('id-ID').format(summary.totalSales)}</p>
          <p><strong>Total Transaksi:</strong> ${summary.transactionCount} Struk</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px;">No</th>
              <th style="border: 1px solid #000; padding: 8px;">ID Transaksi</th>
              <th style="border: 1px solid #000; padding: 8px;">Waktu</th>
              <th style="border: 1px solid #000; padding: 8px;">Metode</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map((trx, index) => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #000; padding: 8px;">${trx.id}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${new Date(trx.timestamp).toLocaleTimeString('id-ID')}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${trx.paymentMethod || 'Cash'}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right;">Rp ${new Intl.NumberFormat('id-ID').format(trx.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        
        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
          <div style="text-align: center; width: 200px;">
            <p>Mengetahui,</p>
            <br><br><br><br>
            <p style="text-decoration: underline;">Penanggung Jawab</p>
          </div>
          <div style="text-align: center; width: 200px;">
            <p>Dibuat Oleh,</p>
            <br><br><br><br>
            <p style="text-decoration: underline;">Petugas Shift</p>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin:       10,
      filename:     `Laporan-Shift-${selectedYear}-${selectedMonth+1}-${selectedDay}-Shift${selectedShift}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    document.body.appendChild(printElement);
    html2pdf().set(opt).from(printElement).save().then(() => {
      document.body.removeChild(printElement);
    });
  };

  return (
    <div className="flex bg-surface min-h-screen relative">
      <SideNavBar />
      <MobileHeader title="Shift Laporan" />
      <main className="flex-1 md:ml-64 flex flex-col p-4 min-h-screen relative z-10 mb-16 md:mb-0 pt-[calc(1rem+4rem+env(safe-area-inset-top))] md:pt-4">
        
        <div className="max-w-6xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div className="flex flex-col justify-between items-start gap-1">
              <h2 className="text-3xl font-bold text-on-surface tracking-tight">Laporan Shift & Transaksi</h2>
              <p className="text-on-surface-variant font-medium">Laporan runut berdasarkan Bulan, Hari, dan Shift</p>
            </div>
            {isManager && (
              <button 
                onClick={handlePrintPdf}
                className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-sm tracking-widest flex items-center gap-2 hover:bg-primary-fixed transition-colors"
               >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Cetak Laporan PDF
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1.5 block uppercase tracking-wider">Tahun</label>
              <select className="w-full h-10 px-3 rounded-lg border border-border-subtle bg-surface focus:outline-none focus:border-primary font-medium"
                value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1.5 block uppercase tracking-wider">Bulan</label>
              <select className="w-full h-10 px-3 rounded-lg border border-border-subtle bg-surface focus:outline-none focus:border-primary font-medium"
                value={selectedMonth} onChange={e => {
                  setSelectedMonth(parseInt(e.target.value));
                  if (selectedDay > new Date(selectedYear, parseInt(e.target.value) + 1, 0).getDate()) {
                    setSelectedDay(new Date(selectedYear, parseInt(e.target.value) + 1, 0).getDate());
                  }
                }}>
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1.5 block uppercase tracking-wider">Tanggal</label>
              <select className="w-full h-10 px-3 rounded-lg border border-border-subtle bg-surface focus:outline-none focus:border-primary font-medium"
                value={selectedDay} onChange={e => setSelectedDay(parseInt(e.target.value))}>
                {Array.from({length: daysInMonth}, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1.5 block uppercase tracking-wider">Shift Kerja</label>
              <select className="w-full h-10 px-3 rounded-lg border border-border-subtle bg-surface focus:outline-none focus:border-primary font-medium text-primary"
                value={selectedShift} onChange={e => setSelectedShift(parseInt(e.target.value))}>
                <option value={1}>Shift 1 (07:00 - 15:00)</option>
                <option value={2}>Shift 2 (15:00 - 23:00)</option>
                <option value={3}>Shift 3 (23:00 - 07:00)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-primary mb-1 uppercase tracking-widest">Total Penjualan Shift</span>
              <div className="text-4xl font-light font-mono text-on-surface">
                Rp {new Intl.NumberFormat('id-ID').format(summary.totalSales)}
              </div>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-widest">Total Transaksi</span>
              <div className="text-4xl font-light text-on-surface">
                {summary.transactionCount} <span className="text-base text-on-surface-variant font-medium">Struk</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
             <div className="px-5 py-4 border-b border-outline-variant bg-surface-muted flex justify-between items-center">
               <h3 className="font-bold text-on-surface flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">receipt_long</span>
                 Daftar Transaksi Shift {selectedShift}
               </h3>
             </div>
             <table className="w-full text-left border-collapse">
               <thead className="bg-[#f9f9f9] text-xs uppercase font-bold text-on-surface-variant border-b border-outline-variant">
                 <tr>
                   <th className="px-5 py-3">Waktu</th>
                   <th className="px-5 py-3">No Transaksi</th>
                   <th className="px-5 py-3 text-center">Metode</th>
                   <th className="px-5 py-3 text-right">Total</th>
                   <th className="px-5 py-3 w-12 text-center">Detail</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-outline-variant text-sm">
                 {filteredTransactions.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-5 py-12 text-center text-on-surface-variant">
                       <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                       <p>Tidak ada transaksi pada hari dan shift ini.</p>
                     </td>
                   </tr>
                 ) : (
                   filteredTransactions.map(trx => (
                     <React.Fragment key={trx.id}>
                       <tr className={`hover:bg-surface-muted/50 transition-colors cursor-pointer ${expandedTrx === trx.id ? 'bg-surface-muted/30' : ''}`} onClick={() => setExpandedTrx(expandedTrx === trx.id ? null : trx.id)}>
                         <td className="px-5 py-4 whitespace-nowrap">
                           {new Date(trx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                         </td>
                         <td className="px-5 py-4 font-mono font-bold text-primary">{trx.id}</td>
                         <td className="px-5 py-4 text-center">
                           <span className="text-[10px] font-bold px-2.5 py-1 bg-surface-container rounded-sm border border-border-subtle">{trx.paymentMethod}</span>
                         </td>
                         <td className="px-5 py-4 text-right font-mono font-bold text-on-surface">
                           Rp {new Intl.NumberFormat('id-ID').format(trx.total)}
                         </td>
                         <td className="px-5 py-4 text-center">
                           <span className="material-symbols-outlined text-on-surface-variant transition-transform bg-surface border border-outline-variant rounded-full p-0.5" style={{transform: expandedTrx === trx.id ? 'rotate(180deg)' : 'rotate(0deg)'}}>expand_more</span>
                         </td>
                       </tr>
                       {expandedTrx === trx.id && (
                         <tr className="bg-[#fafafa]">
                           <td colSpan={5} className="px-5 py-4 border-b border-primary/10">
                             <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-sm">
                               <h4 className="text-xs font-bold text-on-surface-variant mb-3 uppercase tracking-wider flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[16px]">shopping_basket</span> 
                                 Item Terjual
                               </h4>
                               <table className="w-full text-left text-sm mb-1">
                                 <thead>
                                   <tr className="text-xs text-on-surface-variant border-b border-border-subtle">
                                     <th className="pb-2 font-medium w-2/5">Nama Item / Obat</th>
                                     <th className="pb-2 font-medium text-center">Qty</th>
                                     <th className="pb-2 font-medium text-right">Harga</th>
                                     <th className="pb-2 font-medium text-right">Subtotal</th>
                                     <th className="pb-2 font-medium text-center">Aksi (Stok)</th>
                                   </tr>
                                 </thead>
                                 <tbody className="divide-y divide-border-subtle/50">
                                   {trx.items?.map((item: any, i: number) => (
                                     <tr key={i} className="hover:bg-surface-muted/30">
                                       <td className="py-2.5 font-medium">{item.name}</td>
                                       <td className="py-2.5 text-center font-mono font-medium">{item.qty}</td>
                                       <td className="py-2.5 text-right font-mono text-on-surface-variant">Rp {new Intl.NumberFormat('id-ID').format(item.price)}</td>
                                       <td className="py-2.5 text-right font-mono font-bold text-on-surface">Rp {new Intl.NumberFormat('id-ID').format((item.price * item.qty) || 0)}</td>
                                       <td className="py-2.5 text-center">
                                         {item.itemId ? (
                                           <button 
                                             onClick={(e) => { e.stopPropagation(); openStockModal(item.itemId, item.name); }}
                                             className="text-[10px] font-bold px-3 py-1 bg-surface-container-lowest hover:bg-surface-container text-primary border border-border-subtle hover:border-primary/50 shadow-sm rounded-full inline-flex items-center gap-1 transition-all">
                                             <span className="material-symbols-outlined text-[14px]">query_stats</span> Kartu Stok
                                           </button>
                                         ) : (
                                           <span className="text-[10px] text-on-surface-variant italic cursor-help" title="Barang ini tidak memiliki ID Unik">N/A</span>
                                         )}
                                       </td>
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
                             </div>
                           </td>
                         </tr>
                       )}
                     </React.Fragment>
                   ))
                 )}
               </tbody>
             </table>
          </div>
        </div>

      </main>

      {/* Kartu Stok Modal */}
      {isStockModalOpen && stockModalItem && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border-subtle bg-surface">
              <div>
                <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary p-1 bg-primary/10 rounded-lg">inventory_2</span>
                  Kartu Stok Obat
                </h3>
                <p className="text-sm text-on-surface-variant font-medium mt-1">Menampilkan riwayat mutasi stok untuk obat ini.</p>
              </div>
              <button 
                onClick={() => setIsStockModalOpen(false)}
                className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors bg-surface-container-lowest border border-border-subtle"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="px-6 py-4 bg-surface-muted border-b border-outline-variant flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border-subtle">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">medication</span>
                <span className="font-bold text-sm text-on-surface">{stockModalItem.itemName}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg border border-border-subtle">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">tag</span>
                <span className="font-mono text-sm text-on-surface-variant">{stockModalItem.itemId}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[#fafafa]">
              <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm">
                 <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-surface font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="p-4 border-b border-outline-variant">Waktu Mutasi</th>
                        <th className="p-4 border-b border-outline-variant">User / Role</th>
                        <th className="p-4 border-b border-outline-variant text-center">Tipe Mutasi</th>
                        <th className="p-4 border-b border-outline-variant">Keterangan Referensi</th>
                        <th className="p-4 border-b border-outline-variant text-right">In / Out</th>
                        <th className="p-4 border-b border-outline-variant text-right">Stok Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/60">
                      {stockLogs.length > 0 ? (
                        stockLogs.map((log: any) => {
                          const mutasi = log.newStock - log.oldStock;
                          const isMutasiPos = mutasi > 0;
                          return (
                            <tr key={log.id} className="hover:bg-surface-muted/50 transition-colors">
                              <td className="p-4 whitespace-nowrap text-on-surface-variant text-xs font-mono font-medium">
                                {new Date(log.timestamp).toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-on-surface">{log.userId}</div>
                                <div className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mt-0.5">{log.userRole}</div>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-sm border uppercase tracking-wider ${log.type === 'IN' ? 'bg-primary/5 text-primary border-primary/20' : log.type === 'OUT' ? 'bg-regulatory-alert/5 text-regulatory-alert border-regulatory-alert/20' : 'bg-surface-container text-on-surface border-border-subtle'}`}>
                                  {log.type}
                                </span>
                              </td>
                              <td className="p-4 max-w-[200px] truncate text-on-surface-variant font-medium text-xs" title={log.reason}>{log.reason}</td>
                              <td className={`p-4 text-right font-mono text-base font-bold ${isMutasiPos ? 'text-primary' : mutasi < 0 ? 'text-regulatory-alert' : 'text-on-surface'}`}>
                                {isMutasiPos ? '+' : ''}{mutasi}
                              </td>
                              <td className="p-4 text-right font-mono text-lg font-bold text-on-surface">
                                {log.newStock}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-40">hourglass_empty</span>
                            <p>Belum ada histori mutasi stok untuk item ini.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                 </table>
              </div>
            </div>
            
            <div className="p-6 border-t border-border-subtle bg-surface flex justify-end gap-3">
              <button 
                onClick={() => setIsStockModalOpen(false)}
                className="px-8 py-2.5 bg-surface border-2 border-border-subtle text-on-surface rounded-lg font-bold text-sm hover:bg-surface-muted hover:border-outline-variant transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                Tutup Kartu Stok
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
}
