import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Settings as SettingsIcon, 
  Database, 
  HelpCircle,
  Clock,
  User,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  Plus,
  ShoppingBag,
  PlusCircle,
  X,
  FileText,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Search,
  CloudSun,
  Cpu,
  Download,
  Printer
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import KPICards from "./components/KPICards";
import InventoryChart from "./components/InventoryChart";
import InventoryList from "./components/InventoryList";
import SupplierSection from "./components/SupplierSection";
import WarehouseSection from "./components/WarehouseSection";
import ForecastSection from "./components/ForecastSection";
import InsightsSection from "./components/InsightsSection";
import AIChatCopilot from "./components/AIChatCopilot";
import NotificationCenter from "./components/NotificationCenter";
import AuthScreen from "./components/AuthScreen";
import { LogOut } from "lucide-react";
import { 
  Product, 
  Supplier, 
  PurchaseOrder, 
  Sale, 
  Warehouse, 
  AuditLog, 
  NotificationAlert, 
  ProductForecast, 
  AIInsight 
} from "./types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: {
    action: "DRAFT_PO" | "UPDATE_STOCK" | "TRANSFER_STOCK";
    payload: any;
  } | null;
  actionExecuted?: boolean;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("aether_auth_token"));
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Local scoped fetch wrapper to automatically inject Authorization token
  const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const activeToken = token || localStorage.getItem("aether_auth_token");
    const headers = {
      ...init?.headers,
      ...(activeToken ? { "Authorization": `Bearer ${activeToken}` } : {})
    };
    return window.fetch(input, { ...init, headers });
  };

  // Primary Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const [forecasts, setForecasts] = useState<ProductForecast[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  // Copilot Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // General Loading States
  const [isAiFallback, setIsAiFallback] = useState(false);
  const [isAiQuotaExceeded, setIsAiQuotaExceeded] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isResettingDb, setIsResettingDb] = useState(false);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  // Premium Enterprise State Variables
  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("aether_theme_mode") as "dark" | "light") || "dark";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.warn("Fullscreen permission denied:", err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => console.warn(err));
      }
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextTheme);
    localStorage.setItem("aether_theme_mode", nextTheme);
  };

  // Sales Dispatch Modal State
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleCustomer, setSaleCustomer] = useState("");
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQty, setSaleQty] = useState(1);

  // Profile Edit States
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileRole(currentUser.role);
    }
  }, [currentUser]);

  const handleUpdateProfile = async (name: string, role: string) => {
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setCurrentUser(updatedUser);
        setIsProfileModalOpen(false);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update profile.");
      }
    } catch (e) {
      console.error("Update profile error:", e);
      alert("Failed to connect to the server.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Fetch full DB Snapshot
  const fetchSnapshot = async () => {
    try {
      const res = await fetch("/api/db/snapshot");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setSuppliers(data.suppliers || []);
        setPurchaseOrders(data.purchaseOrders || []);
        setSales(data.sales || []);
        setWarehouses(data.warehouses || []);
        setLogs(data.logs || []);
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to load snapshot from server:", e);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Token validation and profile loading on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("aether_auth_token") || token;
    if (savedToken) {
      window.fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${savedToken}`
        }
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("Invalid session token");
        }
      })
      .then(user => {
        setCurrentUser(user);
        setToken(savedToken);
      })
      .catch(() => {
        localStorage.removeItem("aether_auth_token");
        setToken(null);
        setCurrentUser(null);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
    } else {
      setIsAuthLoading(false);
    }
  }, [token]);

  // Fetch snapshot when authenticated
  useEffect(() => {
    if (currentUser) {
      fetchSnapshot();
    }
  }, [currentUser]);

  // Seed DB Helper
  const handleResetDb = async () => {
    setIsResettingDb(true);
    try {
      const res = await fetch("/api/db/reset", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.db.products);
        setSuppliers(data.db.suppliers);
        setPurchaseOrders(data.db.purchaseOrders);
        setSales(data.db.sales);
        setWarehouses(data.db.warehouses);
        setLogs(data.db.logs);
        setNotifications(data.db.notifications);
        setForecasts([]);
        setInsights([]);
        setChatMessages([]);
        alert("Demo Database successfully reseeded to high-fidelity defaults.");
      }
    } catch (e) {
      console.error("Failed to reset DB:", e);
    } finally {
      setIsResettingDb(false);
    }
  };

  // REST handlers

  const handleAddProduct = async (prodData: any) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prodData)
      });
      if (res.ok) {
        await fetchSnapshot();
      }
    } catch (e) {
      console.error("Add product error:", e);
    }
  };

  const handleUpdateProduct = async (id: string, prodData: any) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prodData)
      });
      if (res.ok) {
        await fetchSnapshot();
      }
    } catch (e) {
      console.error("Update product error:", e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSnapshot();
      }
    } catch (e) {
      console.error("Delete product error:", e);
    }
  };

  const handleTransferStock = async (productId: string, fromWh: string, toWh: string, qty: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/products/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, fromWhId: fromWh, toWhId: toWh, qty })
      });
      if (res.ok) {
        await fetchSnapshot();
        return true;
      } else {
        const err = await res.json();
        alert(err.error || "Stock transfer failed.");
        return false;
      }
    } catch (e) {
      console.error("Stock transfer error:", e);
      return false;
    }
  };

  const handleAddSupplier = async (supData: any) => {
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supData)
      });
      if (res.ok) {
        await fetchSnapshot();
      }
    } catch (e) {
      console.error("Add supplier error:", e);
    }
  };

  const handleCreatePO = async (poData: any) => {
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(poData)
      });
      if (res.ok) {
        await fetchSnapshot();
      }
    } catch (e) {
      console.error("Create PO error:", e);
    }
  };

  const handleReceivePO = async (id: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      });
      if (res.ok) {
        await fetchSnapshot();
      }
    } catch (e) {
      console.error("Receive PO error:", e);
    }
  };

  // Sales Order Dispatcher
  const handleDispatchSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === saleProductId);
    if (!prod) return;

    const total = prod.price * saleQty;

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: saleCustomer,
          items: [{ productId: saleProductId, productName: prod.name, qty: saleQty, price: prod.price }],
          totalAmount: total
        })
      });

      if (res.ok) {
        setIsSaleModalOpen(false);
        setSaleCustomer("");
        setSaleQty(1);
        await fetchSnapshot();
      } else {
        const err = await res.json();
        alert(err.error || "Dispatch failed.");
      }
    } catch (e) {
      console.error("Dispatch sale error:", e);
    }
  };

  // AI Analytics triggers

  const handleTriggerForecast = async () => {
    setIsForecastLoading(true);
    try {
      const res = await fetch("/api/ai/forecast");
      if (res.headers.get("x-ai-fallback") === "true") {
        setIsAiFallback(true);
      }
      if (res.headers.get("x-ai-quota-exceeded") === "true") {
        setIsAiQuotaExceeded(true);
      }
      if (res.ok) {
        const data = await res.json();
        setForecasts(data);
      }
    } catch (e) {
      console.warn("Forecasting run failed, using client simulation:", e);
    } finally {
      setIsForecastLoading(false);
    }
  };

  const handleTriggerInsights = async () => {
    setIsInsightsLoading(true);
    try {
      const res = await fetch("/api/ai/insights");
      if (res.headers.get("x-ai-fallback") === "true") {
        setIsAiFallback(true);
      }
      if (res.headers.get("x-ai-quota-exceeded") === "true") {
        setIsAiQuotaExceeded(true);
      }
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (e) {
      console.warn("Insights run failed, using client simulation:", e);
    } finally {
      setIsInsightsLoading(false);
    }
  };

  // Trigger default forecast on tab switch to AI if empty
  useEffect(() => {
    if (currentTab === "ai" && forecasts.length === 0) {
      handleTriggerForecast();
      handleTriggerInsights();
    }
  }, [currentTab]);

  // Alert Notifications center handlers
  const handleMarkNotificationRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      if (res.ok) {
        await fetchSnapshot();
      }
    } catch (e) {
      console.error("Mark read error:", e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch(`/api/notifications/read-all`, { method: "PUT" });
      if (res.ok) {
        await fetchSnapshot();
      }
    } catch (e) {
      console.error("Mark all read error:", e);
    }
  };

  const handleDismissNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSnapshot();
      }
    } catch (e) {
      console.error("Dismiss notification error:", e);
    }
  };

  // Copilot Chat message dispatch
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text
    };

    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs })
      });

      if (res.headers.get("x-ai-fallback") === "true") {
        setIsAiFallback(true);
      }
      if (res.headers.get("x-ai-quota-exceeded") === "true") {
        setIsAiQuotaExceeded(true);
      }

      if (res.ok) {
        const data = await res.json();
        setChatMessages([
          ...newMsgs,
          {
            id: `m-${Date.now() + 1}`,
            role: "assistant",
            content: data.content,
            action: data.action,
            actionExecuted: false
          }
        ]);
      }
    } catch (e) {
      console.warn("AI Chat communication error, falling back:", e);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Executing actions returned from chatbot agent (Real Transactions!)
  const handleExecutePOAction = async (payload: any) => {
    const supplier = suppliers.find(s => s.id === payload.supplierId);
    if (!supplier) return;

    // Calculate PO total based on payload
    let total = 0;
    const items = payload.items.map((item: any) => {
      const p = products.find(prod => prod.id === item.productId);
      const cost = p ? p.cost : item.cost || 10;
      total += cost * item.qty;
      return {
        productId: item.productId,
        productName: p ? p.name : "Unknown Item",
        qty: item.qty,
        cost
      };
    });

    await handleCreatePO({
      supplierId: payload.supplierId,
      supplierName: supplier.name,
      totalAmount: total,
      items
    });
  };

  const handleExecuteStockAction = async (payload: any) => {
    const p = products.find(prod => prod.id === payload.productId);
    if (!p) return;

    await handleUpdateProduct(payload.productId, {
      ...p,
      stockLevel: payload.newStock
    });
  };

  const handleExecuteTransferAction = async (payload: any) => {
    await handleTransferStock(payload.productId, payload.fromWhId, payload.toWhId, payload.qty);
  };

  const lowStockCount = products.filter(p => p.stockLevel < p.minStock).length;
  const unresolvedAlertsCount = notifications.filter(n => !n.read).length;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="font-mono text-xs font-semibold tracking-wider uppercase">Verifying Security Credentials...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen 
        onAuthSuccess={(user, token) => {
          setToken(token);
          setCurrentUser(user);
        }} 
      />
    );
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="font-mono text-xs font-semibold tracking-wider uppercase">Booting AETHER AI Logistics Engine...</span>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex transition-colors duration-300 relative ${
        themeMode === "dark" 
          ? "bg-[#0B1020] text-slate-100 bg-grid-animation" 
          : "bg-slate-50 text-slate-900 bg-grid-animation-light"
      }`} 
      id="aether-app"
    >
      {/* Background glow effects for Apple Vision Pro style */}
      {themeMode === "dark" && (
        <>
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full filter blur-[140px] pointer-events-none animate-pulse-glow" style={{ animationDelay: "2s" }} />
        </>
      )}

      {/* SIDEBAR NAVIGATION PANEL */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        lowStockCount={lowStockCount}
        unresolvedAlertsCount={unresolvedAlertsCount}
        onResetDb={handleResetDb}
        isResetting={isResettingDb}
        themeMode={themeMode}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden relative z-10">
        {/* Global Nav Header (Glassmorphic) */}
        <header 
          className={`h-20 px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 ${
            themeMode === "dark" 
              ? "bg-[#0B1020]/75 backdrop-blur-md border-b border-slate-800/60" 
              : "bg-white/75 backdrop-blur-md border-b border-slate-200"
          }`} 
          id="app-header"
        >
          {/* Left: Search Box and Active Hub label */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2.5">
              <span className={`text-[10px] font-bold font-mono tracking-widest uppercase ${themeMode === "dark" ? "text-indigo-400" : "text-indigo-600"}`}>
                Operational Unit:
              </span>
              <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${
                themeMode === "dark" 
                  ? "bg-indigo-500/10 border-indigo-500/20 text-[#00E5FF] glow-blue" 
                  : "bg-indigo-50 border-indigo-100 text-indigo-700"
              }`}>
                {currentTab === "ai" ? "AI Predictive Analytics" : currentTab}
              </span>
            </div>

            {/* Premium Interactive Search Box */}
            <div className="relative w-56 lg:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search premium inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all duration-300 ${
                  themeMode === "dark"
                    ? "bg-slate-950/55 border-slate-800/80 focus:border-[#5B5FFF] focus:ring-1 focus:ring-[#5B5FFF]/40 text-slate-200 placeholder-slate-500"
                    : "bg-slate-100 border-slate-200 focus:border-[#5B5FFF] focus:ring-1 focus:ring-indigo-200 text-slate-800 placeholder-slate-400"
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: Weather, Date/Time, AI Status, Record Sale, User Widget */}
          <div className="flex items-center gap-4">
            
            {/* Live Weather Widget */}
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-[10px] ${
              themeMode === "dark" 
                ? "bg-slate-900/30 border-slate-800/60 text-slate-400" 
                : "bg-slate-100 border-slate-200 text-slate-600"
            }`}>
              <CloudSun className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" />
              <span className="font-semibold text-slate-300">Chennai Hub:</span>
              <span className="text-[#00E5FF] font-bold">31°C</span>
              <span className="opacity-40">|</span>
              <span className="text-indigo-400 font-bold">Rainy</span>
            </div>

            {/* Live Time & Date Widget */}
            <div className={`hidden sm:flex flex-col items-end font-mono text-[11px] px-3 py-1.5 rounded-xl border ${
              themeMode === "dark" ? "bg-slate-900/30 border-slate-800/60" : "bg-slate-100 border-slate-200"
            }`}>
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <Clock className="w-3 h-3 text-[#5B5FFF]" />
                <span className="text-[#00E5FF]">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              <span className="text-[9px] opacity-60 mt-0.5">{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* AI Core Status */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold ${
              themeMode === "dark" ? "bg-slate-900/30 border-slate-800/60 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="tracking-wide uppercase">AI SECURE OPTIMAL</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                themeMode === "dark"
                  ? "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-white"
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-800"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Light/Dark Toggle */}
            <button
              onClick={handleToggleTheme}
              title={themeMode === "dark" ? "Enable Light Mode" : "Enable Dark/Cyber Mode"}
              className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                themeMode === "dark"
                  ? "bg-slate-900/40 border-[#5B5FFF]/20 hover:border-[#5B5FFF]/50 text-yellow-400 glow-blue"
                  : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-indigo-600"
              }`}
            >
              {themeMode === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Record Sale Button (glowing cyber aesthetic) */}
            <button
              onClick={() => {
                if (products.length > 0) {
                  setSaleProductId(products[0].id);
                  setIsSaleModalOpen(true);
                }
              }}
              id="btn-trigger-sale-modal"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase bg-gradient-to-r from-[#5B5FFF] to-[#00E5FF] hover:opacity-90 active:scale-95 text-white glow-purple cursor-pointer transition-all duration-300"
            >
              <ShoppingBag className="w-4 h-4 animate-bounce" />
              <span>Record Sale</span>
            </button>

            {/* User Profile Widget */}
            {currentUser && (
              <div className={`flex items-center gap-2 pl-3 border-l ${themeMode === "dark" ? "border-slate-800/60" : "border-slate-200"}`}>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  title="Configure System profile"
                  className={`flex items-center gap-2.5 p-1 rounded-xl transition-all duration-300 text-left cursor-pointer group ${
                    themeMode === "dark" ? "hover:bg-slate-900/40" : "hover:bg-slate-100"
                  }`}
                >
                  <div className="text-right hidden xl:block">
                    <span className={`text-xs font-bold block transition-colors ${themeMode === "dark" ? "text-slate-200 group-hover:text-[#00E5FF]" : "text-slate-800 group-hover:text-indigo-600"}`}>
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-mono font-medium tracking-wide uppercase mt-0.5">{currentUser.role}</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B5FFF] to-[#00E5FF] p-[1px] shadow-sm">
                    <div className="w-full h-full rounded-xl bg-slate-950 text-slate-100 flex items-center justify-center font-extrabold text-[10px] tracking-widest font-display">
                      {((currentUser.name || "User").split(" ").map((n: string) => n ? n[0] : "").join("") || "U").slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("aether_auth_token");
                    setToken(null);
                    setCurrentUser(null);
                    setProducts([]);
                    setSuppliers([]);
                    setPurchaseOrders([]);
                    setSales([]);
                    setWarehouses([]);
                  }}
                  title="Sign Out of Aether Secure Core"
                  className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                    themeMode === "dark"
                      ? "bg-slate-900/40 border-slate-800/80 hover:border-rose-500/40 text-slate-400 hover:text-rose-400"
                      : "bg-slate-100 border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                  }`}
                  id="btn-logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* PAGE VIEWS */}
        <div className="p-8 space-y-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in" id="dashboard-tab">
              {/* Dashboard Subheader with Export/Print actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-500/10 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-300">
                    Aether Core Intel Systems
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Real-time telemetry, robotic inventory control, and predictive routing models</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Export CSV Button */}
                  <button
                    onClick={() => {
                      if (products.length === 0) return alert("No active records to export.");
                      const headers = ["Product ID", "Name", "Category", "Warehouse", "Stock Level", "Safety Stock", "Cost (INR)"];
                      const rows = products.map(p => [
                        p.id,
                        `"${p.name.replace(/"/g, '""')}"`,
                        p.category,
                        p.warehouseName,
                        p.stockLevel,
                        p.minStock,
                        p.cost
                      ]);
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `AETHER_AI_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer border ${
                      themeMode === "dark"
                        ? "bg-slate-900/40 border-slate-800/80 hover:border-[#00E5FF]/40 text-slate-300 hover:text-[#00E5FF] hover:shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                        : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  {/* Print Report Button */}
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer border ${
                      themeMode === "dark"
                        ? "bg-slate-900/40 border-slate-800/80 hover:border-[#5B5FFF]/40 text-slate-300 hover:text-[#5B5FFF] hover:shadow-[0_0_15px_rgba(91,95,255,0.15)]"
                        : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              {/* KPIs indicators */}
              <KPICards 
                products={products} 
                purchaseOrders={purchaseOrders} 
                sales={sales} 
                themeMode={themeMode}
              />

              {/* Graphical Analysis */}
              <InventoryChart products={products} themeMode={themeMode} />

              {/* Two Column Layout: Logs and Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Real-time Alert Notifications */}
                <div className="lg:col-span-1">
                  <NotificationCenter
                    notifications={notifications}
                    onMarkRead={handleMarkNotificationRead}
                    onMarkAllRead={handleMarkAllNotificationsRead}
                    onDismiss={handleDismissNotification}
                    themeMode={themeMode}
                  />
                </div>

                {/* Warehouse System Audit Logs */}
                <div 
                  className={`lg:col-span-2 border rounded-2xl p-6 shadow-volumetric space-y-4 transition-all duration-300 ${
                    themeMode === "dark"
                      ? "bg-slate-900/35 border-slate-800/60 text-slate-200"
                      : "bg-white border-slate-200 text-slate-800"
                  }`} 
                  id="audit-logs-card"
                >
                  <div className={`flex items-center justify-between border-b pb-4 ${themeMode === "dark" ? "border-slate-800/60" : "border-slate-100"}`}>
                    <div>
                      <h3 className={`text-sm font-extrabold tracking-tight font-display uppercase ${themeMode === "dark" ? "text-slate-100" : "text-slate-900"}`}>
                        Active Operations Audit Ledger
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Autonomous sensor logs & physical ledger adjustments</p>
                    </div>
                    <span className={`text-[10px] border px-2.5 py-1 rounded-lg font-mono font-extrabold uppercase ${
                      themeMode === "dark" ? "bg-slate-950/60 border-slate-800 text-[#00E5FF]" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>
                      SECURE-LEDGER
                    </span>
                  </div>

                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`flex gap-4 p-3.5 rounded-xl transition-all text-xs border ${
                          themeMode === "dark" 
                            ? "hover:bg-slate-900/20 border-slate-900 hover:border-slate-800/80" 
                            : "hover:bg-slate-50 border-transparent hover:border-slate-100"
                        }`} 
                        id={`log-entry-${log.id}`}
                      >
                        <div className="text-slate-500 font-mono text-[10px] w-18 pt-0.5 shrink-0 font-semibold">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={`shrink-0 font-mono font-extrabold uppercase text-[9px] px-2.5 py-0.5 rounded-lg border h-fit ${
                          themeMode === "dark"
                            ? "text-[#00E5FF] bg-cyan-950/20 border-cyan-500/25"
                            : "text-slate-700 bg-slate-100 border-slate-200"
                        }`}>
                          {log.type}
                        </div>
                        <div className={`flex-1 font-medium ${themeMode === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                          {log.description}
                          <span className="text-slate-400 block text-[10px] mt-1 font-normal">Operator: {log.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {currentTab === "inventory" && (
            <div className="animate-fade-in" id="inventory-tab">
              <InventoryList
                products={products}
                warehouses={warehouses}
                suppliers={suppliers}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onTransferStock={handleTransferStock}
                themeMode={themeMode}
              />
            </div>
          )}

          {currentTab === "suppliers" && (
            <div className="animate-fade-in" id="suppliers-tab">
              <SupplierSection
                suppliers={suppliers}
                purchaseOrders={purchaseOrders}
                products={products}
                onAddSupplier={handleAddSupplier}
                onCreatePO={handleCreatePO}
                onReceivePO={handleReceivePO}
              />
            </div>
          )}

          {currentTab === "warehouses" && (
            <div className="animate-fade-in" id="warehouses-tab">
              <WarehouseSection
                warehouses={warehouses}
                products={products}
                onTransferStock={handleTransferStock}
              />
            </div>
          )}

          {currentTab === "ai" && (
            <div className="space-y-8 animate-fade-in" id="ai-tab">
              {isAiFallback && (
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in" id="ai-quota-exceeded-banner">
                  <div className="flex gap-3 items-start sm:items-center">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-sm">
                      ✨
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {isAiQuotaExceeded 
                          ? "Google Gemini API Quota Exceeded (Free Tier Limit)" 
                          : "Aether AI Core Operational Mode"}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                        {isAiQuotaExceeded 
                          ? "The Gemini API free-tier limit of 20 requests/day has been reached. Aether's industrial intelligence has automatically switched to high-fidelity simulated forecasting to keep your operations active."
                          : "Aether is currently running on the high-fidelity local physics & inventory prediction simulation mode."}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-1 rounded font-mono font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase shrink-0 w-fit self-end sm:self-auto">
                    ACTIVE SIMULATION
                  </span>
                </div>
              )}

              <ForecastSection
                forecasts={forecasts}
                products={products}
                onTriggerForecast={handleTriggerForecast}
                isLoading={isForecastLoading}
                onCreatePOFromForecast={async (supplierId, items) => {
                  const sup = suppliers.find(s => s.id === supplierId);
                  if (!sup) return;
                  let total = 0;
                  const structuredItems = items.map(item => {
                    const p = products.find(prod => prod.id === item.productId);
                    const cost = p ? p.cost : 10;
                    total += cost * item.qty;
                    return { productId: item.productId, productName: p ? p.name : "Item", qty: item.qty, cost };
                  });
                  await handleCreatePO({ supplierId, supplierName: sup.name, totalAmount: total, items: structuredItems });
                  alert("Restock Purchase Order created from AI recommendation!");
                }}
              />

              <InsightsSection
                insights={insights}
                onTriggerInsights={handleTriggerInsights}
                isLoading={isInsightsLoading}
              />
            </div>
          )}

          {currentTab === "copilot" && (
            <div className="animate-fade-in space-y-6" id="copilot-tab">
              {isAiFallback && (
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in" id="copilot-quota-exceeded-banner">
                  <div className="flex gap-3 items-start sm:items-center">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-sm">
                      ✨
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {isAiQuotaExceeded 
                          ? "Google Gemini API Quota Exceeded (Free Tier Limit)" 
                          : "Aether AI Core Operational Mode"}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                        {isAiQuotaExceeded 
                          ? "The Gemini API free-tier limit of 20 requests/day has been reached. Aether's industrial intelligence has automatically switched to high-fidelity simulated forecasting to keep your operations active."
                          : "Aether is currently running on the high-fidelity local physics & inventory prediction simulation mode."}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-1 rounded font-mono font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase shrink-0 w-fit self-end sm:self-auto">
                    ACTIVE SIMULATION
                  </span>
                </div>
              )}

              <AIChatCopilot
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
                onExecutePOAction={handleExecutePOAction}
                onExecuteStockAction={handleExecuteStockAction}
                onExecuteTransferAction={handleExecuteTransferAction}
                themeMode={themeMode}
              />
            </div>
          )}

          {currentTab === "settings" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 max-w-2xl" id="settings-tab">
              <div>
                <h3 className="font-bold text-slate-900 tracking-tight text-base">Logistics Control Settings</h3>
                <p className="text-xs text-slate-500">Coordinate alert thresholds and update user credentials</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProfile(profileName, profileRole);
              }} className="space-y-4 border-t border-slate-100 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold uppercase tracking-wider text-[10px] mb-1">Standard Operator Name</label>
                    <input 
                      type="text" 
                      required
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold uppercase tracking-wider text-[10px] mb-1">Operator System Role</label>
                    <select
                      value={profileRole} 
                      onChange={(e) => setProfileRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="Logistics Coordinator">Logistics Coordinator</option>
                      <option value="Warehouse Manager">Warehouse Manager</option>
                      <option value="Inventory Controller">Inventory Controller</option>
                      <option value="System Administrator">System Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSavingProfile ? "Saving Profile..." : "Save User Settings"}
                  </button>
                </div>
              </form>

              <div className="space-y-4 border-t border-slate-100 pt-4 text-xs">
                <div className="bg-amber-500/5 border border-amber-200/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-amber-800">Database Administration Node</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    If you wish to test fresh operations, you can clear all active state changes and restore the system to high-fidelity factory defaults.
                  </p>
                  <button
                    onClick={handleResetDb}
                    disabled={isResettingDb}
                    id="btn-settings-reset-db"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Operational Logs</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* SALES RECORD MODAL */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">Record Sales Order Outflow</h3>
              <button onClick={() => setIsSaleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchSale} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer / Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gamma Robotics"
                  value={saleCustomer}
                  onChange={(e) => setSaleCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Dispatched SKU</label>
                <select
                  value={saleProductId}
                  onChange={(e) => setSaleProductId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none font-semibold cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (In stock: {p.stockLevel} • ₹{p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dispatch Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={saleQty}
                  onChange={(e) => setSaleQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Total order price: <b className="text-slate-700">
                    ₹{((products.find(p => p.id === saleProductId)?.price || 0) * saleQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </b>
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Dispatch Sales Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">Edit Operator Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateProfile(profileName, profileRole);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Operator Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Operator System Role</label>
                <select
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="Logistics Coordinator">Logistics Coordinator</option>
                  <option value="Warehouse Manager">Warehouse Manager</option>
                  <option value="Inventory Controller">Inventory Controller</option>
                  <option value="System Administrator">System Administrator</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-100 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
