import { SideNavBar, BottomNavBar, MobileHeader } from "../components/Navigation";

export default function Procurement() {
  const userRole = localStorage.getItem("userRole") || "Staff";
  const isManager = userRole === "Manager";

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
            <div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-4 h-10 border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-sm">search</span>
              <input type="text" placeholder="Search POs..." className="bg-transparent border-none focus:ring-0 text-sm w-64 text-on-surface placeholder:text-on-surface-variant font-body-md outline-none" />
              <span className="material-symbols-outlined text-on-surface-variant ml-2 text-sm cursor-pointer hover:text-primary">barcode_scanner</span>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-container-margin pb-24 md:pb-container-margin">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Auto-PO Approval Queue</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">System-generated drafts based on minimum stock thresholds.</p>
              </div>
              <div className="flex items-center space-x-4 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                    <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>health_and_safety</span>
                  </div>
                  <div>
                    <p className="font-label-caps text-label-caps text-on-surface-variant">Global Inventory Health</p>
                    <p className="font-headline-md text-headline-md text-primary font-bold">92% <span className="text-sm font-normal text-on-surface-variant ml-1">Safe</span></p>
                  </div>
                </div>
                <div className="h-10 w-px bg-outline-variant mx-2"></div>
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant">Pending POs</p>
                  <p className="font-headline-md text-headline-md text-warning-amber font-bold">4</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest border-l-4 border-warning-amber border-y border-r border-outline-variant rounded-2xl p-6 flex flex-col relative overflow-hidden shadow-lg backdrop-blur-sm group">
                <div className="absolute inset-0 bg-gradient-to-br from-warning-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-label-caps text-label-caps bg-warning-amber/20 text-warning-amber px-2 py-0.5 rounded">URGENT</span>
                      <span className="font-data-mono text-data-mono text-on-surface-variant">PO-2023-11A-049</span>
                    </div>
                    <h3 className="font-headline-md text-[20px] font-bold text-on-surface mt-2">Medipharm Logistics Inc.</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">Estimated Total</p>
                    <p className="font-pos-total text-pos-total text-on-surface text-[28px] font-bold leading-tight drop-shadow-sm">Rp 65.5M</p>
                  </div>
                </div>
                
                <div className="bg-surface-muted rounded-xl border border-outline-variant p-4 mb-5 flex-1 relative z-10">
                  <p className="font-label-caps text-label-caps text-on-surface-variant mb-3 font-bold">Items Reaching Min Stock (3)</p>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center border-b border-outline-variant pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-regulatory-alert"></span>
                        <span className="font-body-md text-body-md text-on-surface">OxyContin 10mg (SIPNAP)</span>
                      </div>
                      <span className="font-data-mono text-data-mono text-on-surface-variant">Req: 100 Bx</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-outline-variant pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-warning-amber"></span>
                        <span className="font-body-md text-body-md text-on-surface">Ibuprofen 400mg</span>
                      </div>
                      <span className="font-data-mono text-data-mono text-on-surface-variant">Req: 200 Bx</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-warning-amber"></span>
                        <span className="font-body-md text-body-md text-on-surface">Omeprazole 20mg</span>
                      </div>
                      <span className="font-data-mono text-data-mono text-on-surface-variant">Req: 150 Bx</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-3 mt-auto">
                  {isManager ? (
                    <>
                      <button className="px-4 py-2 rounded border border-outline-variant text-on-surface font-headline-md text-[14px] hover:bg-surface-container transition-colors">Reject</button>
                      <button className="px-4 py-2 rounded bg-secondary-container text-on-secondary-container font-headline-md text-[14px] hover:bg-secondary-fixed transition-colors">Edit Items</button>
                      <button className="px-6 py-2 rounded bg-primary text-on-primary font-headline-md text-[14px] hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors flex items-center space-x-1">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>Approve PO</span>
                      </button>
                    </>
                  ) : (
                    <span className="font-body-md text-sm text-on-surface-variant italic py-2">Menunggu Persetujuan Manager</span>
                  )}
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col relative shadow-lg backdrop-blur-sm group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-surface-variant/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-label-caps text-label-caps bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded">STANDARD</span>
                      <span className="font-data-mono text-data-mono text-on-surface-variant">PO-2023-11A-050</span>
                    </div>
                    <h3 className="font-headline-md text-[20px] font-bold text-on-surface mt-2">Global Pharma Supplies</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">Estimated Total</p>
                    <p className="font-pos-total text-pos-total text-on-surface text-[28px] font-bold leading-tight drop-shadow-sm">Rp 22.8M</p>
                  </div>
                </div>
                
                <div className="bg-surface-muted rounded-xl border border-outline-variant p-4 mb-5 flex-1 relative z-10">
                  <p className="font-label-caps text-label-caps text-on-surface-variant mb-3 font-bold">Items Reaching Min Stock (2)</p>
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center border-b border-outline-variant pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-warning-amber"></span>
                        <span className="font-body-md text-body-md text-on-surface">Paracetamol 500mg</span>
                      </div>
                      <span className="font-data-mono text-data-mono text-on-surface-variant">Req: 300 Bx</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-warning-amber"></span>
                        <span className="font-body-md text-body-md text-on-surface">Cetirizine 10mg</span>
                      </div>
                      <span className="font-data-mono text-data-mono text-on-surface-variant">Req: 100 Bx</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-3 mt-auto">
                  {isManager ? (
                    <>
                      <button className="px-4 py-2 rounded border border-outline-variant text-on-surface font-headline-md text-[14px] hover:bg-surface-container transition-colors">Reject</button>
                      <button className="px-4 py-2 rounded bg-secondary-container text-on-secondary-container font-headline-md text-[14px] hover:bg-secondary-fixed transition-colors">Edit Items</button>
                      <button className="px-6 py-2 rounded bg-primary text-on-primary font-headline-md text-[14px] hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors flex items-center space-x-1">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>Approve PO</span>
                      </button>
                    </>
                  ) : (
                    <span className="font-body-md text-sm text-on-surface-variant italic py-2">Menunggu Persetujuan Manager</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}
