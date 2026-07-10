import React from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie 
} from "recharts";
import { Product } from "../types";

interface InventoryChartProps {
  products: Product[];
  themeMode?: "dark" | "light";
}

export default function InventoryChart({ products, themeMode = "dark" }: InventoryChartProps) {
  const isDark = themeMode === "dark";

  // Data for bar chart: Stock level vs Safety Limit (minStock)
  const barData = products.map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 13) + "..." : p.name,
    "Current Stock": p.stockLevel,
    "Safety Limit": p.minStock
  }));

  // Data for category breakdown: sum of cost * stock level (valuation)
  const categoryDataMap: { [key: string]: number } = {};
  products.forEach((p) => {
    const valuation = p.stockLevel * p.cost;
    categoryDataMap[p.category] = (categoryDataMap[p.category] || 0) + valuation;
  });

  const pieData = Object.keys(categoryDataMap).map((cat) => ({
    name: cat,
    value: Math.round(categoryDataMap[cat])
  }));

  // Futuristic palette
  const COLORS = ["#5B5FFF", "#00E5FF", "#10B981", "#EC4899", "#F59E0B", "#A855F7"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-container">
      {/* Stock Level vs Threshold Bar Chart */}
      <div 
        className={`lg:col-span-2 border rounded-2xl p-6 shadow-volumetric transition-all duration-300 ${
          isDark ? "bg-slate-900/35 border-slate-800/60 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`} 
        id="stock-level-bar-chart-card"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-sm font-extrabold tracking-tight font-display uppercase ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              Stock Levels vs. Safety Thresholds
            </h3>
            <p className="text-xs text-slate-400 mt-1">Autonomous sensor levels checked against reorder points</p>
          </div>
          <span className={`text-[10px] border px-2.5 py-1 rounded-lg font-mono font-extrabold uppercase ${
            isDark ? "bg-indigo-950/20 border-indigo-500/25 text-[#00E5FF]" : "bg-indigo-50 border-indigo-100 text-indigo-700"
          }`}>
            Robotic Telemetry
          </span>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#e2e8f0"} />
              <XAxis dataKey="name" tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? "#070c19" : "#ffffff", 
                  borderRadius: "12px", 
                  border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0", 
                  color: isDark ? "#f8fafc" : "#1e293b",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                }}
                itemStyle={{ fontSize: "12px" }}
                labelStyle={{ fontWeight: "bold", fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b" }} />
              {/* Premium color fills: Purple neon for Stock, hot pink/rose for Safety limit */}
              <Bar dataKey="Current Stock" fill={isDark ? "#5B5FFF" : "#6366f1"} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Safety Limit" fill="#F43F5E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Value Distribution Pie Chart */}
      <div 
        className={`border rounded-2xl p-6 shadow-volumetric flex flex-col justify-between transition-all duration-300 ${
          isDark ? "bg-slate-900/35 border-slate-800/60 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        }`} 
        id="category-distribution-pie-chart-card"
      >
        <div>
          <h3 className={`text-sm font-extrabold tracking-tight font-display uppercase ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Asset Distribution by Category
          </h3>
          <p className="text-xs text-slate-400 mt-1">Total stored financial valuation split (INR)</p>
        </div>

        <div className="h-56 relative flex items-center justify-center my-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`₹${value.toLocaleString()}`, "Asset Value"]}
                contentStyle={{ 
                  backgroundColor: isDark ? "#070c19" : "#ffffff", 
                  borderRadius: "12px", 
                  border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0", 
                  color: isDark ? "#f8fafc" : "#1e293b" 
                }}
                itemStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute text-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Value</span>
            <span className={`text-xl font-extrabold block tracking-tight font-display ${isDark ? "text-white" : "text-slate-950"}`}>
              ₹{pieData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Custom Legend */}
        <div className="space-y-2 mt-2">
          {pieData.map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className={isDark ? "text-slate-400" : "text-slate-600"}>{item.name}</span>
              </div>
              <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>₹{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

