import React from "react";
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Info,
  Check
} from "lucide-react";
import { NotificationAlert } from "../types";

interface NotificationCenterProps {
  notifications: NotificationAlert[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  themeMode?: "dark" | "light";
}

export default function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  themeMode = "dark"
}: NotificationCenterProps) {
  const isDark = themeMode === "dark";

  const getIcon = (type: string) => {
    switch (type) {
      case "low_stock": return AlertTriangle;
      case "pending_delivery": return Clock;
      case "anomaly": return AlertTriangle;
      case "success": return CheckCircle;
      default: return Info;
    }
  };

  const getStyle = (type: string) => {
    switch (type) {
      case "low_stock": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "pending_delivery": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "anomaly": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "success": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default: return isDark ? "bg-slate-950/40 text-slate-300 border-slate-800" : "bg-slate-50 text-slate-800 border-slate-200";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div 
      className={`border rounded-2xl shadow-volumetric p-6 space-y-4 transition-all duration-300 ${
        isDark ? "bg-slate-900/35 border-slate-800/60 text-slate-100" : "bg-white border-slate-200 text-slate-800"
      }`} 
      id="notifications-widget"
    >
      <div className={`flex items-center justify-between border-b pb-4 ${isDark ? "border-slate-800/60" : "border-slate-100"}`}>
        <div className="flex items-center gap-2.5">
          <Bell className="w-4.5 h-4.5 text-[#5B5FFF] animate-pulse" />
          <h3 className={`text-sm font-extrabold tracking-tight font-display uppercase ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Active Operational Alerts
          </h3>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full animate-bounce">
              {unreadCount} NEW
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            id="btn-mark-all-read"
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1 no-scrollbar">
        {notifications.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-10 font-medium">All operational vectors nominal. No alert logs.</p>
        ) : (
          notifications.map((n) => {
            const Icon = getIcon(n.type);
            const style = getStyle(n.type);

            return (
              <div 
                key={n.id}
                id={`notification-alert-${n.id}`}
                className={`p-3.5 rounded-xl border flex items-start gap-3 justify-between transition-all ${style} ${
                  n.read ? "opacity-45" : ""
                }`}
              >
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-slate-950/40 border border-slate-500/10">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs tracking-tight">{n.title}</h4>
                    <p className="text-[11px] leading-relaxed mt-0.5 font-medium opacity-85">{n.message}</p>
                    <span className="text-[9px] font-mono opacity-60 block mt-1">
                      {new Date(n.date).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      title="Mark as Read"
                      className="p-1 hover:bg-slate-800/40 rounded-lg transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-slate-400 hover:text-slate-100" />
                    </button>
                  )}
                  <button
                    onClick={() => onDismiss(n.id)}
                    title="Dismiss alert"
                    className="p-1 hover:bg-slate-800/40 rounded-lg transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
