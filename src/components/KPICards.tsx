import React from "react";
import { 
  DollarSign, 
  AlertTriangle, 
  FileText, 
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";
import { Product, PurchaseOrder, Sale } from "../types";

interface KPICardsProps {
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  sales: Sale[];
  themeMode?: "dark" | "light";
}

export default function KPICards({ products, purchaseOrders, sales, themeMode = "dark" }: KPICardsProps) {
  const isDark = themeMode === "dark";

  // Dynamic calculations based on DB
  const totalValuation = products.reduce((acc, p) => acc + p.stockLevel * p.cost, 0);
  const totalItemsCount = products.reduce((acc, p) => acc + p.stockLevel, 0);
  
  const lowStockItems = products.filter(p => p.stockLevel < p.minStock);
  const lowStockCount = lowStockItems.length;
  
  const activePOs = purchaseOrders.filter(po => po.status !== "Completed");
  const activePOsCount = activePOs.length;

  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

  const cardData = [
    {
      id: "kpi-val",
      title: "Asset Valuation",
      value: `₹${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      description: `${totalItemsCount.toLocaleString()} units stocked`,
      icon: DollarSign,
      decorIcon: Layers,
      themeClass: isDark 
        ? "glow-purple border-[#5B5FFF]/20 bg-slate-900/40 text-slate-100" 
        : "bg-white border-slate-200 text-slate-800",
      accent: "#5B5FFF",
      iconColor: isDark ? "bg-[#5B5FFF]/15 text-[#5B5FFF] border-[#5B5FFF]/35" : "bg-indigo-50 text-indigo-600 border-indigo-100",
      delay: "animate-float"
    },
    {
      id: "kpi-low",
      title: "Critical Stock Alerts",
      value: lowStockCount.toString(),
      description: lowStockCount > 0 ? `${lowStockCount} items below safety limit` : "All systems optimal",
      icon: AlertTriangle,
      decorIcon: Zap,
      themeClass: isDark
        ? lowStockCount > 0 
          ? "glow-rose border-rose-500/25 bg-slate-900/40 text-rose-200" 
          : "glow-blue border-slate-800/80 bg-slate-900/40 text-slate-100"
        : "bg-white border-slate-200 text-slate-800",
      accent: lowStockCount > 0 ? "#F43F5E" : "#00E5FF",
      iconColor: lowStockCount > 0 
        ? "bg-rose-500/15 text-rose-400 border-rose-500/35" 
        : isDark ? "bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/35" : "bg-cyan-50 text-cyan-600 border-cyan-100",
      delay: "animate-float-delayed"
    },
    {
      id: "kpi-po",
      title: "Active Supply Lines",
      value: activePOsCount.toString(),
      description: `${purchaseOrders.filter(po => po.status === "Pending").length} pending, ${purchaseOrders.filter(po => po.status === "Shipped").length} transit`,
      icon: FileText,
      decorIcon: Activity,
      themeClass: isDark 
        ? "glow-blue border-[#00E5FF]/20 bg-slate-900/40 text-slate-100" 
        : "bg-white border-slate-200 text-slate-800",
      accent: "#00E5FF",
      iconColor: isDark ? "bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/35" : "bg-cyan-50 text-cyan-600 border-cyan-100",
      delay: "animate-float"
    },
    {
      id: "kpi-rev",
      title: "Sales Revenue",
      value: `₹${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      description: `${sales.length} fulfilled contracts`,
      icon: TrendingUp,
      decorIcon: Sparkles,
      themeClass: isDark 
        ? "glow-green border-emerald-500/20 bg-slate-900/40 text-slate-100" 
        : "bg-white border-slate-200 text-slate-800",
      accent: "#10B981",
      iconColor: isDark ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35" : "bg-emerald-50 text-emerald-600 border-emerald-100",
      delay: "animate-float-delayed"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="kpi-dashboard-grid">
      {cardData.map((card) => {
        const Icon = card.icon;
        const DecorIcon = card.decorIcon;
        return (
          <div 
            key={card.id}
            id={card.id}
            className={`glass-reflection border rounded-2xl p-6 flex flex-col justify-between shadow-volumetric transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer relative overflow-hidden group ${card.themeClass} ${card.delay}`}
          >
            {/* Soft decorative background glow */}
            <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500 blur-xl" style={{ backgroundColor: card.accent }} />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className={`text-[10px] font-bold font-mono tracking-widest uppercase opacity-75 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {card.title}
                </span>
                
                {/* Floating numbers with pulse effects */}
                <h3 className="text-3xl font-extrabold tracking-tight font-display mt-2 group-hover:text-white transition-colors duration-300">
                  {card.value}
                </h3>
              </div>

              {/* Icon with glowing box */}
              <div className={`p-3 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 border ${card.iconColor}`}>
                <Icon className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            
            {/* Interactive Footer & Status Description */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-500/10 relative z-10">
              <div className="flex items-center gap-2 text-[11px] font-medium opacity-85">
                {card.id === "kpi-low" && lowStockCount > 0 ? (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                ) : (
                  <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                )}
                <span>{card.description}</span>
              </div>

              <DecorIcon className="w-3.5 h-3.5 opacity-20 group-hover:opacity-45 transition-opacity duration-300" style={{ color: card.accent }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

