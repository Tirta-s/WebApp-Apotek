import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (!username || !password) {
        setError("Silakan masukkan username dan password.");
        return;
      }
      
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userName", data.user.name);
        navigate("/pos");
      } else {
        setError(data.error || "Username atau password yang dimasukkan salah.");
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-glass backdrop-blur-md overflow-hidden flex flex-col relative z-10 group">
        <div className="p-8 border-b border-outline-variant bg-surface-container-low flex flex-col items-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center font-bold text-on-primary text-4xl mb-4 shadow-lg shadow-primary/20">
            M
          </div>
          <h1 className="text-2xl font-semibold text-inverse-on-surface tracking-tight text-center">
            Medisync <span className="text-primary">ERP</span>
          </h1>
          <p className="text-sm font-medium text-on-surface-variant mt-2 text-center uppercase tracking-widest">
            Authentication Portal
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-error-container/20 border border-regulatory-alert rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-regulatory-alert text-sm">error</span>
                  <span className="text-sm font-medium text-regulatory-alert">{error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5" htmlFor="username">
                  Username / ID
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    person
                  </span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan ID Anda"
                    required
                    className="w-full pl-10 pr-4 h-12 bg-surface-muted border border-outline-variant rounded-xl text-sm font-medium text-inverse-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    lock
                  </span>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 h-12 bg-surface-muted border border-outline-variant rounded-xl text-sm font-medium text-inverse-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-primary text-on-primary font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">login</span>
              Log In
            </button>
          </form>
        </div>

        <div className="px-8 py-4 bg-surface-muted border-t border-outline-variant text-center">
          <p className="text-[10px] text-on-surface-variant font-mono">
            PharmaPrecision ERP v2.4.1 - Encrypted PWA Tunnel
          </p>
        </div>
      </div>
    </div>
  );
}
