import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function NotificationCenter() {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch('/api/inventory');
        if (res.ok) {
          const data = await res.json();
          // Filter items below min stock
          const low = data.filter((item: any) => item.minStock && item.stock < item.minStock);
          setLowStockItems(low);
        }
      } catch (err) {
        console.error("Failed to fetch inventory for notifications", err);
      }
    };
    
    fetchInventory();
    const interval = setInterval(fetchInventory, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={notificationRef}>
      <button 
        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
        className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-on-surface-variant hover:bg-surface-variant relative transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {lowStockItems.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-on-error rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-surface-container-lowest">
            {lowStockItems.length > 9 ? '9+' : lowStockItems.length}
          </span>
        )}
      </button>
      {isNotificationsOpen && (
        <div className="absolute top-10 right-0 md:left-full md:right-auto md:ml-2 w-72 bg-surface-container border border-outline-variant rounded-xl shadow-lg z-[160] overflow-hidden">
          <div className="p-3 border-b border-outline-variant bg-surface-muted flex items-center justify-between">
            <h3 className="font-bold text-sm text-on-surface">Notifications</h3>
            {lowStockItems.length > 0 && <span className="text-xs bg-error-container text-on-error-container px-2 py-0.5 rounded font-medium">{lowStockItems.length} Alerts</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {lowStockItems.length === 0 ? (
              <div className="p-4 text-center text-sm text-on-surface-variant">No alerts at the moment.</div>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {lowStockItems.map((item) => (
                  <li key={item.id} className="p-3 hover:bg-surface-muted transition-colors">
                    <div className="text-sm font-bold text-on-surface mb-1 flex items-start gap-1">
                      <span className="material-symbols-outlined text-error text-[16px]">warning</span>
                      <span>Low Stock Alert</span>
                    </div>
                    <div className="text-sm text-on-surface-variant">
                      <span className="font-medium text-on-surface">{item.name}</span> is below minimum level.
                    </div>
                    <div className="flex gap-4 mt-2 text-xs">
                      <div className="text-on-surface-variant">Current: <span className="text-error font-bold">{item.stock}</span></div>
                      <div className="text-on-surface-variant">Min: <span className="font-bold">{item.minStock}</span></div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileHeader({ title, onBack }: { title: string, onBack?: () => void }) {
  return (
    <header className="bg-surface/90 backdrop-blur-md border-b border-outline-variant w-full z-[150] md:hidden fixed top-0 flex items-center justify-between px-4 h-16 pt-[env(safe-area-inset-top)] shadow-sm">
      <div className="flex items-center gap-2">
        {onBack ? (
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center hover:bg-surface-variant rounded-full transition-colors mr-1">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-on-primary shadow-sm mr-1">M</div>
        )}
        <h1 className="font-headline-md font-bold text-on-surface truncate">{title}</h1>
      </div>
      <NotificationCenter />
    </header>
  );
}

export function SideNavBar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const userRole = localStorage.getItem("userRole") || "Staff";
  const isManager = userRole === "Manager";
  const isPengelola = userRole === "Pengelola Apotek";

  let navItems = [
    { name: "POS", path: "/pos", icon: "point_of_sale", filled: false },
    { name: "Inventory", path: "/inventory", icon: "inventory_2", filled: true },
    { name: "Analytics", path: "/dashboard", icon: "analytics", filled: true },
    { name: "Procurement", path: "/procurement", icon: "task_alt", filled: true },
    { name: "Shift", path: "/shift", icon: "history", filled: false },
  ];

  const userBranch = localStorage.getItem("userBranch") || "Utama - Jakarta Selatan";

  return (
    <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest/90 backdrop-blur-md border-r border-outline-variant py-gutter-admin px-4 z-50 shadow-glass">
      <div className="mb-8 px-2 flex flex-col items-start">
        <div className="flex items-center justify-between w-full mb-1 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-on-primary text-xl shadow-sm">M</div>
            <span className="font-headline-md text-[18px] font-bold text-inverse-on-surface tracking-tight">Medisync <span className="text-primary">ERP</span></span>
          </div>
          <NotificationCenter />
        </div>
        <div className="flex items-center gap-3 mt-6 w-full p-3 bg-surface-container-low rounded-xl border border-outline-variant shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex flex-col overflow-hidden w-full pl-1">
            <span className="font-label-caps text-[9px] uppercase tracking-wider text-on-surface-variant font-bold mb-0.5">{userRole}</span>
            <div className="text-sm font-medium text-on-surface truncate">{userBranch}</div>
          </div>
        </div>
        <Link to="/pos" className="mt-4 w-full h-touch-target-min bg-primary text-on-primary font-headline-md text-headline-md rounded-lg flex items-center justify-center gap-2 hover:bg-on-primary-fixed-variant transition-colors shadow-sm">
          <span className="material-symbols-outlined">add</span>
          New Sale
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-on-surface-variant uppercase px-2 mb-2 tracking-widest">Operasional</div>
        <ul className="flex flex-col gap-1 mb-6">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path)
                    ? "bg-primary-container text-primary font-medium border border-primary/20"
                    : "text-on-secondary-fixed-variant hover:bg-surface-container-highest"
                }`}
              >
                <span 
                  className="material-symbols-outlined w-5 h-5 flex items-center justify-center"
                  style={{ fontVariationSettings: isActive(item.path) && item.filled ? "'FILL' 1" : "'FILL' 0", fontSize: '20px' }}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-4 border-t border-outline-variant pb-2">
        <ul className="flex flex-col gap-1">
          <li>
            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-secondary-fixed-variant hover:bg-surface-container-highest transition-all">
              <span className="material-symbols-outlined w-5 h-5 flex items-center justify-center" style={{ fontSize: '20px' }}>settings</span>
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </li>
          <li>
            <Link to="/login" onClick={() => localStorage.clear()} className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-secondary-fixed-variant hover:bg-surface-container-highest transition-all">
              <span className="material-symbols-outlined w-5 h-5 flex items-center justify-center" style={{ fontSize: '20px' }}>logout</span>
              <span className="text-sm font-medium">Logout</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export function BottomNavBar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 px-2 bg-surface border-t border-outline-variant z-50 shadow-sm">
      <Link to="/pos" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/pos') ? 'bg-primary-container text-on-primary-container font-bold rounded-full py-1 scale-90' : 'text-on-surface-variant hover:bg-surface-container'}`}>
        <span className="material-symbols-outlined mb-1">barcode_reader</span>
        <span className="font-label-caps text-label-caps">POS</span>
      </Link>
      <Link to="/inventory" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/inventory') ? 'bg-primary-container text-on-primary-container font-bold rounded-full py-1 scale-90' : 'text-on-surface-variant hover:bg-surface-container'}`}>
        <span className="material-symbols-outlined mb-1">inventory</span>
        <span className="font-label-caps text-label-caps">Inventory</span>
      </Link>
      <Link to="/dashboard" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/dashboard') ? 'bg-primary-container text-on-primary-container font-bold rounded-full py-1 scale-90' : 'text-on-surface-variant hover:bg-surface-container'}`}>
        <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isActive('/dashboard') ? "'FILL' 1" : "'FILL' 0" }}>analytics</span>
        <span className="font-label-caps text-label-caps">Analytics</span>
      </Link>
      <Link to="/shift" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/shift') ? 'bg-primary-container text-on-primary-container font-bold rounded-full py-1 scale-90' : 'text-on-surface-variant hover:bg-surface-container'}`}>
        <span className="material-symbols-outlined mb-1">history</span>
        <span className="font-label-caps text-label-caps">Shift</span>
      </Link>
    </nav>
  );
}
