import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { SideNavBar, BottomNavBar, MobileHeader } from "../components/Navigation";
import { GeminiChatbot } from "../components/GeminiChatbot";
import { motion } from "motion/react";

export default function Dashboard() {
  const userRole = localStorage.getItem("userRole") || "Staff";
  const isManager = userRole === "Manager";

  const [aiInsights, setAiInsights] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [paretoData, setParetoData] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isParetoLoading, setIsParetoLoading] = useState(false);

  // States for new widgets
  const [omsetPeriod, setOmsetPeriod] = useState("1 Bulan");
  const [itoPeriod, setItoPeriod] = useState("1 Tahun");

  const [dashboardStats, setDashboardStats] = useState({
    omsetData: { sales: 0, target: 0, percentage: 0, label: "" },
    itoData: { ratio: 0, label: "" },
    todaySales: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/dashboard/stats?omsetPeriod=${omsetPeriod}&itoPeriod=${itoPeriod}`);
        const data = await res.json();
        if (res.ok) {
          setDashboardStats(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, [omsetPeriod, itoPeriod]);

  useEffect(() => {
    const fetchPareto = async () => {
      setIsParetoLoading(true);
      try {
         const res = await fetch(`/api/pareto?startDate=${startDate}&endDate=${endDate}`);
         const json = await res.json();
         if (res.ok) {
             setParetoData(json.items);
         }
      } catch(e) {
        console.error(e);
      } finally {
        setIsParetoLoading(false);
      }
    }
    fetchPareto();
  }, [startDate, endDate]);

  const generateInsights = async () => {
    setIsAnalyzing(true);
    setAiInsights("");
    try {
      const res = await fetch("/api/gemini/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Berdasarkan data penjualan Rp ${dashboardStats.todaySales.toLocaleString('id-ID')} (+12.4% vs kemarin) dan penjualan total Rp ${dashboardStats.omsetData.sales.toLocaleString('id-ID')} dengan ITO ${dashboardStats.itoData.ratio}x, berikan 2-3 poin insight singkat untuk manager apotek.` })
      });
      const data = await res.json();
      if (res.ok) {
        setAiInsights(data.text);
      } else {
        setAiInsights(`Error: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      setAiInsights("Terjadi kesalahan saat memuat AI Insights.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadParetoCSV = () => {
    if (paretoData.length === 0) return;
    const headers = ["Kelas", "SKU", "Nama Obat", "Qty Terjual", "Pendapatan", "Rekomendasi"];
    const rows = paretoData.map((item: any) => [
      item.class,
      item.id,
      `"${item.name}"`,
      item.qtySold,
      item.revenue,
      item.class === 'A' ? "Segera PO" : item.class === 'B' ? "Pertahankan Stok" : "Batas Minimum"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pareto-analysis-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex bg-surface-muted min-h-screen">
      <SideNavBar />
      <MobileHeader title="Analytics" />
      <main className="flex-1 md:ml-64 p-container-margin pt-[calc(var(--spacing-container-margin)+4rem+env(safe-area-inset-top))] md:pt-container-margin pb-24 md:pb-container-margin min-h-screen overflow-y-auto w-full">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-outline-variant">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Overview Dashboard</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">System Time: {new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'})} | Last Sync: Just now</p>
          </div>
          <div className="flex gap-4">
            {isManager && (
              <button className="h-12 px-4 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold text-sm hover:bg-primary-fixed transition-colors shadow-sm gap-2">
                <span className="material-symbols-outlined text-[18px]">edit_document</span>
                <span className="hidden md:inline">Edit Reports</span>
              </button>
            )}
            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface border border-outline-variant">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-admin mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex flex-col shadow-lg backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="font-headline-md text-headline-md text-on-surface">Total Sales (Today)</span>
              <span className="material-symbols-outlined text-primary shadow-glow">trending_up</span>
            </div>
            <div className="font-pos-total text-[24px] lg:text-[32px] font-bold text-on-surface mb-2 relative z-10 truncate">
              Rp {dashboardStats.todaySales.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-2 text-primary font-label-caps text-label-caps relative z-10 bg-primary/10 w-fit px-2 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              <span>+12.4% vs Yesterday</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex flex-col shadow-lg backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-info-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10 w-full">
              <span className="font-headline-md text-headline-md text-on-surface">Omset vs Target</span>
              <select 
                value={omsetPeriod}
                onChange={e => setOmsetPeriod(e.target.value)}
                className="bg-surface-muted border border-outline-variant rounded px-2 py-1 text-xs focus:outline-none focus:border-primary text-on-surface-variant font-bold cursor-pointer hover:bg-surface-variant transition-colors"
                title="Select Period"
              >
                <option value="Shift">Shift</option>
                <option value="1 Hari">1 Hari</option>
                <option value="1 Bulan">1 Bulan</option>
                <option value="3 Bulan">3 Bulan</option>
                <option value="1 Tahun">1 Tahun</option>
              </select>
            </div>
            
            <div className="font-pos-total text-[24px] lg:text-[28px] font-bold text-on-surface mb-1 relative z-10 truncate">
              Rp {dashboardStats.omsetData.sales.toLocaleString('id-ID')}
            </div>
            
            <div className="flex flex-col gap-2 relative z-10 mt-auto">
              <div className="flex items-center justify-between text-sm whitespace-nowrap">
                <span className="text-on-surface-variant">Target: Rp {dashboardStats.omsetData.target.toLocaleString('id-ID')}</span>
                <span className="text-primary font-bold">{dashboardStats.omsetData.percentage}%</span>
              </div>
              
              <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden flex">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(dashboardStats.omsetData.percentage, 100)}%` }}
                ></div>
                {dashboardStats.omsetData.percentage > 100 && (
                   <div 
                     className="bg-info-blue h-full rounded-r-full transition-all duration-1000 ease-out"
                     style={{ width: `${Math.min(dashboardStats.omsetData.percentage - 100, 100)}%` }}
                   ></div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex flex-col shadow-lg backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-warning-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10 w-full">
              <span className="font-headline-md text-headline-md text-on-surface">ITO (Turnover)</span>
              <select 
                value={itoPeriod}
                onChange={e => setItoPeriod(e.target.value)}
                className="bg-surface-muted border border-outline-variant rounded px-2 py-1 text-xs focus:outline-none focus:border-primary text-on-surface-variant font-bold cursor-pointer hover:bg-surface-variant transition-colors"
                title="Select Period"
              >
                <option value="1 Bulan">1 Bulan</option>
                <option value="6 Bulan">6 Bulan</option>
                <option value="1 Tahun">1 Tahun</option>
              </select>
            </div>
            
            <div className="flex items-end gap-3 mb-2 relative z-10">
              <div className="font-pos-total text-[32px] font-bold text-on-surface leading-none">{dashboardStats.itoData.ratio}x</div>
            </div>
            
            <div className="text-on-surface-variant text-sm mb-3 mt-auto">
              Perputaran persediaan inventory.
            </div>
            
            <div className={`flex items-center gap-2 font-label-caps text-label-caps relative z-10 w-fit px-2 py-1 rounded-full ${dashboardStats.itoData.ratio > 5 ? 'bg-primary/10 text-primary' : 'bg-warning-amber/10 text-warning-amber'}`}>
              <span className="material-symbols-outlined text-[16px]">{dashboardStats.itoData.ratio > 5 ? 'check_circle' : 'info'}</span>
              <span>{dashboardStats.itoData.label}</span>
            </div>
          </motion.div>
        </div>

        {/* Gemini Intelligence Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 mb-8 relative overflow-hidden shadow-glass">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1a73e8]">auto_awesome</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Gemini Intelligence Insights</h2>
            </div>
            <button 
              onClick={generateInsights}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-sm font-bold disabled:opacity-50 text-on-surface"
            >
              {isAnalyzing ? (
                <>
                  <span className="material-symbols-outlined animate-spin hidden">progress_activity</span>
                  Analyzing Data...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">magic_button</span>
                  Generate Insights
                </>
              )}
            </button>
          </div>
          <div className="min-h-[100px] flex flex-col justify-center">
            {aiInsights ? (
              <div className="markdown-body prose prose-sm max-w-none text-on-surface">
                <Markdown>{aiInsights}</Markdown>
              </div>
            ) : isAnalyzing ? (
              <div className="flex items-center gap-3 text-on-surface-variant justify-center h-full">
                <div className="w-4 h-4 rounded-full bg-[#1a73e8] animate-pulse"></div>
                <div className="w-4 h-4 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-4 h-4 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            ) : (
              <div className="text-center text-on-surface-variant text-sm">
                Klik tombol "Generate Insights" untuk mendapatkan analisis mendalam berbasis AI.
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col mb-8 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Pareto Analysis (ABC)</h2>
              <p className="text-sm text-on-surface-variant font-medium mt-1">
                Klasifikasi persediaan obat berdasarkan kontribusi pendapatan.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center bg-surface-muted p-2 rounded-lg border border-outline-variant">
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
              <span className="text-on-surface-variant text-sm font-bold"> - </span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
              {isManager && (
                <button 
                  onClick={handleDownloadParetoCSV}
                  className="ml-auto flex items-center justify-center gap-1.5 bg-surface-container-lowest border border-outline-variant hover:bg-surface-variant transition-colors text-on-surface text-sm font-bold px-3 py-1.5 rounded"
                  title="Download CSV"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span className="hidden sm:inline">CSV</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-muted border-y border-outline-variant">
                  <th className="p-4 font-bold text-on-surface-variant uppercase text-xs tracking-wider">Kelas</th>
                  <th className="p-4 font-bold text-on-surface-variant uppercase text-xs tracking-wider">SKU / Nama Obat</th>
                  <th className="p-4 font-bold text-on-surface-variant uppercase text-xs tracking-wider text-right">Qty Terjual</th>
                  <th className="p-4 font-bold text-on-surface-variant uppercase text-xs tracking-wider text-right">Pendapatan</th>
                  <th className="p-4 font-bold text-on-surface-variant uppercase text-xs tracking-wider text-center">Rekomendasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {isParetoLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                      <div className="flex justify-center items-center gap-2">
                        <span className="material-symbols-outlined animate-spin hidden">progress_activity</span>
                        Memuat data analisis pareto...
                      </div>
                    </td>
                  </tr>
                ) : paretoData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-on-surface-variant">Tidak ada data untuk periode ini</td>
                  </tr>
                ) : (
                  paretoData.map((item: any) => (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold
                          ${item.class === 'A' ? 'bg-primary-container text-primary' : 
                            item.class === 'B' ? 'bg-warning-amber/20 text-warning-amber' : 
                            'bg-surface-variant text-on-surface-variant'}`}>
                          {item.class}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-on-surface">{item.name}</div>
                        <div className="font-mono text-xs text-on-surface-variant mt-0.5">{item.id}</div>
                      </td>
                      <td className="p-4 text-right font-mono text-on-surface">
                        {item.qtySold.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-right font-bold text-on-surface">
                        Rp {item.revenue.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-center">
                        {item.class === 'A' ? (
                          <div className="flex items-center justify-center gap-1 text-regulatory-alert font-bold text-xs uppercase bg-error-container/50 px-2 py-1 rounded">
                            <span className="material-symbols-outlined text-[14px]">shopping_cart</span>
                            Segera PO
                          </div>
                        ) : item.class === 'B' ? (
                           <div className="flex items-center justify-center gap-1 text-warning-amber font-bold text-xs uppercase bg-warning-amber/10 px-2 py-1 rounded">
                             <span className="material-symbols-outlined text-[14px]">inventory</span>
                             Pertahankan Stok
                           </div>
                        ) : (
                          <span className="text-on-surface-variant text-xs uppercase font-medium">Batas Minimum</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <BottomNavBar />
      <GeminiChatbot />
    </div>
  );
}
