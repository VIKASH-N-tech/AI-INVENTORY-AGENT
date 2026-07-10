import React from "react";
import { 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  ShieldAlert
} from "lucide-react";
import { AIInsight } from "../types";

interface InsightsSectionProps {
  insights: AIInsight[];
  onTriggerInsights: () => Promise<void>;
  isLoading: boolean;
}

export default function InsightsSection({
  insights,
  onTriggerInsights,
  isLoading
}: InsightsSectionProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "risk": return ShieldAlert;
      case "opportunity": return TrendingUp;
      case "anomaly": return AlertTriangle;
      case "pricing": return Zap;
      default: return Sparkles;
    }
  };

  const getStyle = (type: string, score: number) => {
    if (score >= 90) {
      return {
        card: "bg-red-500/5 border-red-900/40 shadow-xs",
        badge: "bg-red-500/15 text-red-400 border-red-500/20",
        icon: "bg-red-500/15 text-red-400"
      };
    }
    switch (type) {
      case "risk":
        return {
          card: "bg-red-500/5 border-red-900/40 shadow-xs",
          badge: "bg-red-500/15 text-red-400 border-red-500/20",
          icon: "bg-red-500/15 text-red-400"
        };
      case "anomaly":
        return {
          card: "bg-amber-500/5 border-amber-900/40 shadow-xs",
          badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",
          icon: "bg-amber-500/15 text-amber-400"
        };
      case "opportunity":
      case "pricing":
        return {
          card: "bg-emerald-500/5 border-emerald-900/40 shadow-xs",
          badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
          icon: "bg-emerald-500/15 text-emerald-400"
        };
      default:
        return {
          card: "bg-slate-900 border-slate-800 shadow-xs",
          badge: "bg-slate-800 text-slate-300 border-slate-700",
          icon: "bg-slate-800 text-slate-300"
        };
    }
  };

  return (
    <div className="space-y-6" id="insights-module">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3" id="insights-header">
        <div>
          <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Operational Smart Auditing & Insights</span>
          </h3>
          <p className="text-xs text-slate-400">Autonomous reviews of supplier timelines, overstocked working capital, and pricing models</p>
        </div>

        <button
          onClick={onTriggerInsights}
          disabled={isLoading}
          id="btn-retrigger-insights"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 bg-slate-900 text-slate-300 hover:text-slate-100 hover:bg-slate-950 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          <span>Audit Supply Lines</span>
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
          <p className="font-medium text-xs text-slate-300">Run auditing to generate actionable insights.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="insights-grid">
          {insights.map((ins) => {
            const Icon = getIcon(ins.type);
            const style = getStyle(ins.type, ins.impactScore);

            return (
              <div 
                key={ins.id}
                id={`insight-card-${ins.id}`}
                className={`border rounded-xl p-5 flex flex-col justify-between shadow-xs hover:border-slate-755 transition-all ${style.card}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${style.badge}`}>
                      {ins.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">Impact Weight: {ins.impactScore}/100</span>
                  </div>

                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center ${style.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 tracking-tight text-sm leading-snug">{ins.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">{ins.description}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-800 pt-3 mt-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Suggested Resolution:</span>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <p className="text-xs font-bold text-indigo-300 leading-normal">{ins.actionableStep}</p>
                    <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
