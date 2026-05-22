import { SideNavBar, BottomNavBar, MobileHeader } from "../components/Navigation";
import { Link } from "react-router-dom";

export default function Shift() {
  const userRole = localStorage.getItem("userRole") || "Staff";
  const isManager = userRole === "Manager";

  return (
    <div className="flex bg-surface min-h-screen relative">
      <SideNavBar />
      <MobileHeader title="Shift Management" />
      <main className="flex-1 md:ml-64 flex flex-col items-center p-4 min-h-screen relative z-10 w-full mb-16 md:mb-0 pt-[calc(1rem+4rem+env(safe-area-inset-top))] md:pt-4">
        
        {isManager && (
          <div className="w-full max-w-2xl mb-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex justify-between items-center">
            <h3 className="font-headline-md font-bold text-on-surface">Shift Management (Admin)</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded text-sm font-medium transition-colors border border-outline-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">edit</span> Edit Shifts
              </button>
              <button className="px-3 py-1.5 bg-error-container hover:bg-error-container/80 text-on-error-container rounded text-sm font-medium transition-colors border border-regulatory-alert flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">delete</span> Void Shift
              </button>
            </div>
          </div>
        )}

        <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border border-outline-variant shadow-lg backdrop-blur-sm flex flex-col overflow-hidden relative">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-muted flex justify-between items-center">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Shift Handover</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Terminal 3 • {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'})}</p>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant">
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">System Active</span>
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-8">
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-surface-muted p-4 rounded-lg border border-outline-variant">
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Outgoing Cashier</label>
                <div className="font-body-lg text-body-lg text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">person</span>
                  Sarah Jenkins
                </div>
              </div>
              <div className="bg-surface-muted p-4 rounded-lg border border-outline-variant">
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">System Expected Cash</label>
                <div className="font-data-mono text-data-mono text-on-surface flex items-center gap-2 text-lg">
                  <span className="material-symbols-outlined text-secondary">account_balance_wallet</span>
                  Rp 14,500,000
                </div>
              </div>
            </section>
            
            <hr className="border-outline-variant" />
            
            <section>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Drawer Reconciliation</h3>
              <div className="space-y-4">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface block mb-1" htmlFor="actual-cash">Actual Cash in Drawer *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-data-mono">Rp</span>
                    <input type="number" id="actual-cash" className="w-full h-12 pl-12 pr-4 bg-surface rounded-lg border border-outline focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none font-data-mono text-data-mono text-lg transition-colors" defaultValue="14500000" />
                  </div>
                </div>
                
                <div className="bg-error-container/20 border-l-4 border-regulatory-alert p-3 rounded-r-lg flex items-start gap-3">
                  <span className="material-symbols-outlined text-regulatory-alert mt-0.5">warning</span>
                  <div>
                    <p className="font-body-md text-body-md text-on-surface"><span className="font-bold">Discrepancy Detected:</span> -Rp 5,000</p>
                    <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">Tolerance limit: ±Rp 10,000. Note required below.</p>
                  </div>
                </div>
                
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface block mb-1" htmlFor="discrepancy-note">Discrepancy Note <span className="text-regulatory-alert">*</span></label>
                  <textarea id="discrepancy-note" rows={2} className="w-full p-3 bg-surface rounded-lg border border-regulatory-alert focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none font-body-md text-body-md resize-none transition-colors" placeholder="Explain the variance..."></textarea>
                  <p className="font-label-caps text-label-caps text-on-surface-variant mt-1 flex items-center gap-1"><span className="material-symbols-outlined" style={{fontSize: "14px"}}>info</span> Required for any variance</p>
                </div>
              </div>
            </section>
            
            <hr className="border-outline-variant" />
            
            <section className="bg-surface-container-low p-5 rounded-lg border border-outline-variant relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{backgroundImage: "repeating-linear-gradient(45deg, #006c49 0, #006c49 1px, transparent 0, transparent 50%)", backgroundSize: "10px 10px"}}></div>
              <div className="relative z-10">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">lock_person</span>
                  Incoming Shift Verification
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">Incoming cashier must enter PIN to accept drawer responsibility.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-label-caps text-label-caps text-on-surface block mb-1" htmlFor="next-cashier">Next Cashier ID</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined">badge</span>
                      <input type="text" id="next-cashier" className="w-full h-12 pl-10 pr-4 bg-surface-container-lowest rounded-lg border border-outline focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none font-body-md text-body-md transition-colors" placeholder="e.g., EMP-882" />
                    </div>
                  </div>
                  <div>
                    <label className="font-label-caps text-label-caps text-on-surface block mb-1" htmlFor="auth-pin">Authorization PIN</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined">dialpad</span>
                      <input type="password" id="auth-pin" maxLength={4} className="w-full h-12 pl-10 pr-4 bg-surface-container-lowest rounded-lg border border-outline focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none font-data-mono text-data-mono tracking-widest text-lg transition-colors text-center" placeholder="****" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          
          <div className="px-6 py-4 border-t border-outline-variant bg-surface flex justify-end gap-3 z-10">
            <button className="px-6 py-3 rounded-lg border border-outline text-on-surface font-headline-md text-headline-md hover:bg-surface-container-high transition-colors h-touch-target-min min-w-[120px]">
              Cancel
            </button>
            <button className="px-8 py-3 rounded-lg bg-primary text-on-primary font-headline-md text-headline-md hover:bg-surface-tint transition-colors h-touch-target-min min-w-[160px] flex items-center justify-center gap-2 shadow-sm">
              <span className="material-symbols-outlined">verified</span>
              Confirm Handover
            </button>
          </div>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}
