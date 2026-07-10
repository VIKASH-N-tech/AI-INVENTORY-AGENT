import React from "react";
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Warehouse, 
  TrendingUp, 
  MessageSquare, 
  Settings, 
  Database,
  RefreshCw,
  Bell,
  Cpu
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lowStockCount: number;
  unresolvedAlertsCount: number;
  onResetDb: () => void;
  isResetting: boolean;
  themeMode?: "dark" | "light";
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  lowStockCount, 
  unresolvedAlertsCount,
  onResetDb,
  isResetting,
  themeMode = "dark"
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: "suppliers", label: "Suppliers & POs", icon: Truck },
    { id: "warehouses", label: "Warehouse Map", icon: Warehouse },
    { id: "ai", label: "AI Forecast & Insights", icon: TrendingUp },
    { id: "copilot", label: "AI Copilot Chat", icon: MessageSquare, highlight: true },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const isDark = themeMode === "dark";

  return (
    <aside 
      className={`w-68 flex flex-col h-screen sticky top-0 transition-all duration-300 relative z-30 ${
        isDark 
          ? "bg-[#0B1020]/95 border-r border-slate-800/80 text-slate-300" 
          : "bg-slate-50/95 border-r border-slate-200 text-slate-700"
      }`} 
      id="app-sidebar"
    >
      {/* Background radial highlight */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className={`p-6 border-b flex items-center justify-between relative ${isDark ? "border-slate-800/60" : "border-slate-200"}`}>
        <div className="flex items-center gap-3">
          {/* Animated AI Logo (3D orbital rings styled via standard SVG and animation) */}
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#5B5FFF] to-[#00E5FF] rounded-xl blur-[6px] opacity-40 animate-pulse-glow" />
            <div className="relative w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center border border-indigo-500/30 shadow-inner">
              <Cpu className="w-4.5 h-4.5 text-[#00E5FF] animate-spin [animation-duration:8s] absolute" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#5B5FFF] animate-ping" />
            </div>
          </div>
          
          <div>
            <h1 className="text-sm font-extrabold tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-200 to-[#00E5FF] flex items-center gap-1">
              AETHER <span className="text-[#5B5FFF] font-extrabold glow-blue">AI</span>
            </h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-wider font-semibold uppercase mt-0.5">Tamil Nadu Network</p>
          </div>
        </div>

        {unresolvedAlertsCount > 0 && (
          <div className="flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full text-[10px] font-bold glow-rose animate-pulse">
            <Bell className="w-3 h-3" />
            <span>{unresolvedAlertsCount}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
        <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase px-3 mb-3">SYSTEM MENU</p>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full group relative flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer overflow-hidden ${
                isActive 
                  ? isDark
                    ? "text-white shadow-volumetric bg-gradient-to-r from-indigo-500/15 to-transparent border-l-2 border-[#5B5FFF]" 
                    : "text-indigo-600 bg-indigo-50 border-l-2 border-[#5B5FFF]"
                  : item.highlight
                    ? "text-[#00E5FF] hover:text-white bg-indigo-500/5 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-transparent border-l border-dashed border-indigo-500/30"
                    : isDark 
                      ? "text-slate-400 hover:text-white hover:bg-slate-800/40 hover:-translate-y-0.5" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {/* Scale / 3D Lift Highlight Background */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#5B5FFF]/10 to-[#00E5FF]/5 opacity-60 pointer-events-none rounded-xl" />
              )}
              
              <div className="flex items-center gap-3 relative z-10">
                <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                  isActive 
                    ? "text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]" 
                    : item.highlight
                      ? "text-indigo-400"
                      : isDark ? "text-slate-400 group-hover:text-slate-200" : "text-slate-500 group-hover:text-indigo-600"
                }`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="bg-rose-500/15 text-rose-400 border border-rose-500/25 text-[9px] px-2 py-0.5 rounded-full font-bold relative z-10 shadow-sm">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Control */}
      <div className={`p-4 border-t space-y-3 relative z-10 ${isDark ? "border-slate-800/60 bg-slate-950/40" : "border-slate-200 bg-slate-100/50"}`}>
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>AETHER-CORE</span>
          </div>
          <span className="font-mono opacity-80 text-[9px]">TN-NODE-LIVE</span>
        </div>
        
        <button
          onClick={onResetDb}
          disabled={isResetting}
          id="btn-sidebar-reset-db"
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[10px] font-extrabold tracking-widest uppercase rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 ${
            isDark 
              ? "text-slate-300 border border-slate-800 hover:border-indigo-500/40 bg-slate-900/30 hover:bg-indigo-500/10 hover:text-white"
              : "text-slate-700 border border-slate-200 hover:border-indigo-500/40 bg-white hover:bg-indigo-50"
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${isResetting ? "animate-spin text-[#00E5FF]" : ""}`} />
          <span>{isResetting ? "Synchronizing..." : "Synchronize System"}</span>
        </button>
      </div>
    </aside>
  );
}

