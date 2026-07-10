import React, { useState } from "react";
import { 
  TrendingUp, 
  Brain, 
  AlertCircle, 
  HelpCircle, 
  Sparkles,
  ShoppingBag,
  ArrowRight,
  LineChart as LineIcon
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from "recharts";
import { ProductForecast } from "../types";

interface ForecastSectionProps {
  forecasts: ProductForecast[];
  onTriggerForecast: () => Promise<void>;
  isLoading: boolean;
  onCreatePOFromForecast: (supplierId: string, items: { productId: string; qty: number }[]) => Promise<void>;
  products: any[];
}

export default function ForecastSection({
  forecasts,
  onTriggerForecast,
  isLoading,
  onCreatePOFromForecast,
  products
}: ForecastSectionProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(forecasts[0]?.productId || "");

  const activeForecast = forecasts.find(f => f.productId === selectedProductId) || forecasts[0];

  // Prepare trend data for charts: 6 months of historical + 1 month predicted
  const getTrendData = (fc: ProductForecast) => {
    if (!fc) return [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const data = fc.historicalSales.map((qty, idx) => ({
      name: months[idx] || `Mo ${idx+1}`,
      "Historical Sales": qty,
      "AI Predicted": null
    }));

    // Append future forecast prediction
    data.push({
      name: "Jul Forecast",
      "Historical Sales": null,
      "AI Predicted": fc.predictedDemand as any
    });

    // Handle seamless transition in line chart from historical to prediction
    // Make the last historical data also present on prediction start
    if (data.length > 1) {
      data[data.length - 1]["Historical Sales"] = fc.historicalSales[fc.historicalSales.length - 1] as any;
      data[data.length - 2]["AI Predicted"] = fc.historicalSales[fc.historicalSales.length - 1] as any;
    }

    return data;
  };

  const trendData = activeForecast ? getTrendData(activeForecast) : [];

  const handleAutoReorder = async (fc: ProductForecast) => {
    const prod = products.find(p => p.id === fc.productId);
    if (!prod) return;

    // Create a PO automatically
    await onCreatePOFromForecast(prod.supplierId, [
      { productId: fc.productId, qty: fc.recommendedReorderQty }
    ]);
  };

  return (
    <div className="space-y-6" id="forecasting-module">
      {/* Top Banner and AI model controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm" id="forecasting-hero">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h2 className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-1.5">
              Gemini AI Replenishment Agent
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Advanced demand projection utilizing machine learning on historical consumption and vendor lead times.
          </p>
        </div>

        <button
          onClick={onTriggerForecast}
          disabled={isLoading}
          id="btn-trigger-forecast"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50"
        >
          <Brain className={`w-4 h-4 ${isLoading ? "animate-spin text-white" : ""}`} />
          <span>{isLoading ? "Analyzing Lead Times..." : "Run AI Demand Forecast"}</span>
        </button>
      </div>

      {/* Main Analysis Panel Layout */}
      {forecasts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Brain className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="font-medium text-slate-300">No forecast logs generated in this session.</p>
          <button 
            onClick={onTriggerForecast}
            className="text-indigo-400 hover:text-indigo-300 font-bold text-xs mt-2 underline cursor-pointer"
          >
            Trigger analysis engine now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="forecast-analytics-grid">
          
          {/* Replenishment Table List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs space-y-4" id="forecast-products-list-card">
            <div>
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">Demand Velocity and Reorder Advice</h3>
              <p className="text-xs text-slate-400">Auto-calculated recommended stock inflows based on July projected burn rates</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Product Item</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-right">July Projected</th>
                    <th className="px-4 py-3 text-right">Advised Inflow</th>
                    <th className="px-4 py-3 text-center">Confidence</th>
                    <th className="px-4 py-3 text-right">Restock Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 text-xs">
                  {forecasts.map((fc) => {
                    const isSelected = selectedProductId === fc.productId;
                    const needsReorder = fc.recommendedReorderQty > 0;

                    return (
                      <tr 
                        key={fc.productId}
                        id={`forecast-row-${fc.productId}`}
                        onClick={() => setSelectedProductId(fc.productId)}
                        className={`cursor-pointer transition-all ${
                          isSelected ? "bg-indigo-500/10 font-semibold" : "hover:bg-slate-950/40"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-bold text-slate-100 block">{fc.productName}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{fc.reasoning.substring(0, 48)}...</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-300">{fc.currentStock}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-100">{fc.predictedDemand}</td>
                        <td className="px-4 py-3 text-right">
                          {needsReorder ? (
                            <span className="text-indigo-400 font-bold">+{fc.recommendedReorderQty} units</span>
                          ) : (
                            <span className="text-slate-500 font-semibold">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            fc.confidenceScore >= 90 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>
                            {fc.confidenceScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {needsReorder ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutoReorder(fc);
                              }}
                              id={`btn-reorder-fc-${fc.productId}`}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-bold text-[10px] shadow-sm transition-all cursor-pointer"
                            >
                              Dispatch Order
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px] font-semibold">Stock Optimal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Forecast Trend curves */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between" id="forecast-visual-curves-card">
            {activeForecast ? (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight">Demand Velocity Trend Curve</h3>
                  <p className="text-xs text-slate-400">{activeForecast.productName}</p>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "1px solid #334155", color: "#f8fafc" }}
                        itemStyle={{ fontSize: "11px" }}
                      />
                      <Legend verticalAlign="top" height={24} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "10px" }} />
                      <Line 
                        type="monotone" 
                        dataKey="Historical Sales" 
                        stroke="#64748b" 
                        strokeWidth={2} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="AI Predicted" 
                        stroke="#6366f1" 
                        strokeDasharray="5 5" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Insight Box */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <Brain className="w-6 h-6 text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200">Operational Reasoning:</span>
                    <p className="mt-1 font-medium text-slate-400">{activeForecast.reasoning}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <LineIcon className="w-10 h-10 text-slate-700 mx-auto mb-2 animate-pulse" />
                <p className="text-xs">Select a product item from list to chart demand curves</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
