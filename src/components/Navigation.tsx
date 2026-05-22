import { Link, useLocation } from "react-router-dom";

export function MobileHeader({ title, onBack }: { title: string, onBack?: () => void }) {
  return (
    <header className="bg-surface/90 backdrop-blur-md border-b border-outline-variant w-full z-[150] md:hidden fixed top-0 flex items-center px-4 h-16 pt-[env(safe-area-inset-top)] shadow-sm">
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
        <div className="flex items-center gap-2 mb-1 mt-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-on-primary text-xl shadow-sm">M</div>
          <span className="font-headline-md text-[18px] font-bold text-inverse-on-surface tracking-tight">Medisync <span className="text-primary">ERP</span></span>
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
