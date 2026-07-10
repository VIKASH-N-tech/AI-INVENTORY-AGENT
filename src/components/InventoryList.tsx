import React, { useState } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  SlidersHorizontal, 
  ArrowLeftRight, 
  Camera, 
  AlertTriangle,
  MapPin,
  Check,
  X,
  ScanLine
} from "lucide-react";
import { Product, Warehouse, Supplier } from "../types";

interface InventoryListProps {
  products: Product[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  onAddProduct: (prod: any) => Promise<void>;
  onUpdateProduct: (id: string, prod: any) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onTransferStock: (productId: string, fromWh: string, toWh: string, qty: number) => Promise<boolean>;
  themeMode?: "dark" | "light";
}

export default function InventoryList({
  products,
  warehouses,
  suppliers,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onTransferStock,
  themeMode = "dark"
}: InventoryListProps) {
  const isDark = themeMode === "dark";

  // Filter states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    category: "Electronics",
    stockLevel: 0,
    unit: "pcs",
    price: 0.00,
    cost: 0.00,
    minStock: 10,
    warehouseId: "wh-1",
    supplierId: "sup-1"
  });

  const [transferData, setTransferData] = useState({
    productId: "",
    fromWhId: "wh-1",
    toWhId: "wh-2",
    qty: 10
  });

  // Scanner Simulator states
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [scannerAction, setScannerAction] = useState<"restock" | "sell">("restock");
  const [scanQty, setScanQty] = useState(10);
  const [isScanning, setIsScanning] = useState(false);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtering logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === "Low Stock") {
      matchesStatus = p.stockLevel < p.minStock;
    } else if (statusFilter === "Optimal") {
      matchesStatus = p.stockLevel >= p.minStock;
    } else if (statusFilter === "Out of Stock") {
      matchesStatus = p.stockLevel === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      description: "",
      category: "Electronics",
      stockLevel: 50,
      unit: "pcs",
      price: 19.99,
      cost: 8.50,
      minStock: 20,
      warehouseId: warehouses[0]?.id || "wh-1",
      supplierId: suppliers[0]?.id || "sup-1"
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      stockLevel: product.stockLevel,
      unit: product.unit,
      price: product.price,
      cost: product.cost,
      minStock: product.minStock,
      warehouseId: product.warehouseId,
      supplierId: product.supplierId
    });
    setIsEditOpen(true);
  };

  const handleOpenTransfer = (product: Product) => {
    setTransferData({
      productId: product.id,
      fromWhId: product.warehouseId,
      toWhId: warehouses.find(w => w.id !== product.warehouseId)?.id || "wh-2",
      qty: Math.min(product.stockLevel, 10)
    });
    setIsTransferOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddProduct(formData);
    setIsAddOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      await onUpdateProduct(selectedProduct.id, formData);
      setIsEditOpen(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onTransferStock(
      transferData.productId,
      transferData.fromWhId,
      transferData.toWhId,
      transferData.qty
    );
    if (success) {
      setIsTransferOpen(false);
    }
  };

  // Simulate a barcode scan
  const triggerMockScan = () => {
    setIsScanning(true);
    setScannedResult(null);
    setTimeout(() => {
      setIsScanning(false);
      // Select a random product to "scan"
      if (products.length > 0) {
        const randProduct = products[Math.floor(Math.random() * products.length)];
        setScannedResult(randProduct.id);
      }
    }, 1500);
  };

  const handleApplyScanAction = async () => {
    if (!scannedResult) return;
    const prod = products.find(p => p.id === scannedResult);
    if (!prod) return;

    const delta = scannerAction === "restock" ? scanQty : -scanQty;
    const newStock = Math.max(0, prod.stockLevel + delta);
    
    await onUpdateProduct(prod.id, {
      ...prod,
      stockLevel: newStock
    });

    setIsScannerOpen(false);
    setScannedResult(null);
  };

  return (
    <div className="space-y-6" id="inventory-module">
      {/* Header Controls */}
      <div 
        className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border rounded-2xl p-5 shadow-volumetric transition-all duration-300 ${
          isDark 
            ? "bg-slate-900/35 border-slate-800/60 text-slate-100" 
            : "bg-white border-slate-200 text-slate-800"
        }`} 
        id="inventory-toolbar"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search catalog by SKU, name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="input-inventory-search"
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none border transition-all duration-300 ${
              isDark
                ? "bg-slate-950/55 border-slate-800/80 focus:border-[#5B5FFF] text-slate-100 placeholder-slate-500"
                : "bg-slate-100 border-slate-200 focus:border-[#5B5FFF] text-slate-800 placeholder-slate-400"
            }`}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-all ${
            isDark ? "border-slate-800/80 bg-slate-950/55" : "border-slate-200 bg-slate-100"
          }`}>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              id="select-category-filter"
              className={`text-xs font-semibold bg-transparent focus:outline-none cursor-pointer ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className={isDark ? "bg-[#0b1020] text-slate-100" : "bg-white text-slate-800"}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 transition-all ${
            isDark ? "border-slate-800/80 bg-slate-950/55" : "border-slate-200 bg-slate-100"
          }`}>
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              id="select-status-filter"
              className={`text-xs font-semibold bg-transparent focus:outline-none cursor-pointer ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              <option value="All" className={isDark ? "bg-[#0b1020] text-slate-100" : "bg-white text-slate-800"}>All Statuses</option>
              <option value="Low Stock" className={isDark ? "bg-[#0b1020] text-slate-100" : "bg-white text-slate-800"}>Low Stock Alerts</option>
              <option value="Optimal" className={isDark ? "bg-[#0b1020] text-slate-100" : "bg-white text-slate-800"}>Optimal Levels</option>
              <option value="Out of Stock" className={isDark ? "bg-[#0b1020] text-slate-100" : "bg-white text-slate-800"}>Empty / Out of Stock</option>
            </select>
          </div>

          {/* Barcode mock scan button */}
          <button
            onClick={() => setIsScannerOpen(true)}
            id="btn-trigger-barcode"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer border ${
              isDark
                ? "bg-indigo-500/10 border-[#5B5FFF]/20 hover:border-[#5B5FFF]/50 text-indigo-400"
                : "bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-700"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Optics Scan</span>
          </button>

          {/* Create Product button */}
          <button
            onClick={handleOpenAdd}
            id="btn-inventory-add-product"
            className="flex items-center gap-2 bg-gradient-to-r from-[#5B5FFF] to-[#00E5FF] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div 
        className={`border rounded-2xl overflow-hidden shadow-volumetric transition-all duration-300 ${
          isDark ? "bg-slate-900/35 border-slate-800/60" : "bg-white border-slate-200"
        }`} 
        id="products-table-container"
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
              isDark ? "bg-slate-950/40 border-slate-800/60 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              <th className="px-6 py-4">Product Details</th>
              <th className="px-6 py-4">SKU Code</th>
              <th className="px-6 py-4">Warehouse Hub</th>
              <th className="px-6 py-4 text-right">Available Stock</th>
              <th className="px-6 py-4 text-right">Unit Price</th>
              <th className="px-6 py-4">Status Alert</th>
              <th className="px-6 py-4 text-center">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-900">
                  No products found matching filters. Adjust constraints or add a new catalog item.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const wh = warehouses.find(w => w.id === p.warehouseId);
                const sup = suppliers.find(s => s.id === p.supplierId);
                const isLow = p.stockLevel < p.minStock;
                const isOut = p.stockLevel === 0;

                return (
                  <tr key={p.id} id={`product-row-${p.id}`} className="hover:bg-slate-800/40 transition-all">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-white block">{p.name}</span>
                        <span className="text-xs text-slate-500 mt-0.5 inline-flex items-center gap-1">
                          Category: <b className="text-slate-400 font-semibold">{p.category}</b>
                          {sup && ` • Vendor: ${sup.name}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 font-medium">{p.sku}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{wh ? wh.name : "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      <span className={isLow ? "text-red-400" : "text-slate-200"}>
                        {p.stockLevel.toLocaleString()}
                      </span>{" "}
                      <span className="text-xs text-slate-500 font-normal">{p.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-200">
                      ₹{p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
                          Out Of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs animate-pulse">
                          Low Stock Limit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
                          Optimal Supply
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                           onClick={() => handleOpenTransfer(p)}
                          title="Transfer Stock"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all cursor-pointer"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Attributes"
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          title="Remove Product"
                          className="p-1.5 hover:bg-red-500/15 text-slate-400 hover:text-red-400 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT PRODUCT DIALOGS */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-800 flex flex-col text-slate-100">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-white tracking-tight">
                {isAddOpen ? "Add New Catalog Product" : "Edit Product Details"}
              </h3>
              <button 
                onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isAddOpen ? handleAddSubmit : handleEditSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Product Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Electronics" className="bg-slate-900 text-slate-100">Electronics</option>
                    <option value="Hardware" className="bg-slate-900 text-slate-100">Hardware</option>
                    <option value="Packaging" className="bg-slate-900 text-slate-100">Packaging</option>
                    <option value="Medical" className="bg-slate-900 text-slate-100">Medical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lithium Ion Battery Pack"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Detailed Description</label>
                <textarea
                  placeholder="Material specs, certifications, dimensions, weight, or notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockLevel}
                    onChange={(e) => setFormData({ ...formData, stockLevel: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Unit Type</label>
                  <input
                    type="text"
                    required
                    placeholder="pcs, packs, etc"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Retail Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0.0 })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Wholesale Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0.0 })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Default Warehouse</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} className="bg-slate-900 text-slate-100">{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Primary Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 focus:bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  {isAddOpen ? "Create Catalog Entry" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK TRANSFER MODAL */}
      {isTransferOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800 text-slate-100">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                <span>Inter-Warehouse Stock Transfer</span>
              </h3>
              <button onClick={() => setIsTransferOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Product to Move</label>
                <div className="bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-800 text-sm font-semibold text-slate-200">
                  {products.find(p => p.id === transferData.productId)?.name || "N/A"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Source Warehouse</label>
                  <select
                    value={transferData.fromWhId}
                    onChange={(e) => setTransferData({ ...transferData, fromWhId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-slate-100 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} className="bg-slate-900 text-slate-100">{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Destination</label>
                  <select
                    value={transferData.toWhId}
                    onChange={(e) => setTransferData({ ...transferData, toWhId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-slate-100 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} className="bg-slate-900 text-slate-100">{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferData.qty}
                  onChange={(e) => setTransferData({ ...transferData, qty: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-slate-100 focus:outline-none"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  Available in source:{" "}
                  <b className="text-slate-300">
                    {products.find(p => p.id === transferData.productId)?.stockLevel || 0} units
                  </b>
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMART BARCODE & QR SCANNER MOCK */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800 text-slate-100">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <span className="font-sans tracking-tight">System Scanner Simulator</span>
              </h3>
              <button onClick={() => setIsScannerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Animated scan camera window */}
              <div className="relative aspect-video bg-slate-950 rounded-lg flex flex-col items-center justify-center overflow-hidden border border-slate-800">
                {isScanning ? (
                  <>
                    <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-lg shadow-red-500 animate-bounce"></div>
                    <ScanLine className="w-12 h-12 text-slate-800 animate-pulse" />
                    <span className="text-xs text-slate-500 mt-2 tracking-wider animate-pulse font-mono">ALIGN BARCODE WITHIN FOCUS REGION...</span>
                  </>
                ) : scannedResult ? (
                  <div className="text-center p-4">
                    <div className="inline-flex p-2 bg-emerald-500/10 text-emerald-400 rounded-full mb-2">
                      <Check className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-slate-500 font-mono block">UPC-A CODE MATCHED</span>
                    <span className="text-sm font-bold text-slate-200 mt-1 block">
                      {products.find(p => p.id === scannedResult)?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      SKU: {products.find(p => p.id === scannedResult)?.sku}
                    </span>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <span className="text-xs text-slate-500 font-medium">Optics Camera Stream Offline</span>
                    <p className="text-[10px] text-slate-600 mt-1">Press trigger to align and scan container label</p>
                  </div>
                )}
              </div>

              {!scannedResult && !isScanning && (
                <button
                  onClick={triggerMockScan}
                  id="btn-scanner-laser-trigger"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-red-500/10 cursor-pointer animate-pulse"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>TRIGGER OPTIC LASER BEAM</span>
                </button>
              )}

              {scannedResult && (
                <div className="space-y-4 border-t border-slate-800 pt-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">Operation Mode</span>
                    <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setScannerAction("restock")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          scannerAction === "restock" ? "bg-slate-800 text-white shadow-xs" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Restock
                      </button>
                      <button
                        onClick={() => setScannerAction("sell")}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          scannerAction === "sell" ? "bg-slate-800 text-white shadow-xs" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        Dispatch / Sell
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Transaction Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={scanQty}
                      onChange={(e) => setScanQty(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setScannedResult(null)}
                      className="flex-1 py-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-400 cursor-pointer"
                    >
                      Rescan
                    </button>
                    <button
                      onClick={handleApplyScanAction}
                      id="btn-scanner-apply-qty"
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Apply {scannerAction === "restock" ? "Inflow" : "Outflow"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
