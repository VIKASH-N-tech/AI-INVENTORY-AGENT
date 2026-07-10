import React, { useState } from "react";
import { 
  Truck, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  PlusCircle, 
  Trash2, 
  MapPin, 
  Calendar,
  AlertCircle,
  Star,
  Activity,
  X
} from "lucide-react";
import { Supplier, PurchaseOrder, Product } from "../types";

interface SupplierSectionProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  onAddSupplier: (sup: any) => Promise<void>;
  onCreatePO: (po: any) => Promise<void>;
  onReceivePO: (id: string) => Promise<void>;
}

export default function SupplierSection({
  suppliers,
  purchaseOrders,
  products,
  onAddSupplier,
  onCreatePO,
  onReceivePO
}: SupplierSectionProps) {
  const [activeTab, setActiveTab] = useState<"suppliers" | "pos">("suppliers");
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);

  // Add Supplier form state
  const [supForm, setSupForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    category: "Electronics"
  });

  // Create PO form states
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poItems, setPoItems] = useState<{ productId: string; qty: number }[]>([]);

  const handleAddSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddSupplier(supForm);
    setIsAddSupplierOpen(false);
    setSupForm({ name: "", contactName: "", email: "", phone: "", category: "Electronics" });
  };

  const handleOpenCreatePO = () => {
    if (suppliers.length > 0) {
      setPoSupplierId(suppliers[0].id);
      setPoItems([{ productId: products[0]?.id || "", qty: 50 }]);
      setIsCreatePOOpen(true);
    }
  };

  const handleAddPOItem = () => {
    setPoItems([...poItems, { productId: products[0]?.id || "", qty: 50 }]);
  };

  const handleRemovePOItem = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handlePOItemChange = (idx: number, field: "productId" | "qty", value: any) => {
    const updated = [...poItems];
    updated[idx] = {
      ...updated[idx],
      [field]: field === "qty" ? parseInt(value) || 0 : value
    };
    setPoItems(updated);
  };

  const handleCreatePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === poSupplierId);
    if (!supplier) return;

    // Build the structural items
    let total = 0;
    const structuredItems = poItems.map((item) => {
      const prod = products.find(p => p.id === item.productId);
      const cost = prod ? prod.cost : 10;
      total += cost * item.qty;
      return {
        productId: item.productId,
        productName: prod ? prod.name : "Unknown Item",
        qty: item.qty,
        cost
      };
    });

    await onCreatePO({
      supplierId: poSupplierId,
      supplierName: supplier.name,
      totalAmount: total,
      items: structuredItems
    });

    setIsCreatePOOpen(false);
  };

  return (
    <div className="space-y-6" id="supplier-po-module">
      {/* Tab Selectors */}
      <div className="flex items-center justify-between border-b border-slate-800" id="supplier-navigation">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("suppliers")}
            id="tab-suppliers-view"
            className={`pb-4 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "suppliers" 
                ? "text-white border-b-2 border-indigo-500 font-bold" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Vendor Catalog ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab("pos")}
            id="tab-purchase-orders-view"
            className={`pb-4 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "pos" 
                ? "text-white border-b-2 border-indigo-500 font-bold" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
        </div>

        <div className="pb-2">
          {activeTab === "suppliers" ? (
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              id="btn-add-supplier"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Supplier</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreatePO}
              id="btn-create-po"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Draft PO</span>
            </button>
          )}
        </div>
      </div>

      {/* VENDOR CATALOG PAGE */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="suppliers-list">
          {suppliers.map((sup) => (
            <div key={sup.id} id={`supplier-card-${sup.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-700 transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white tracking-tight text-base">{sup.name}</h3>
                    <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded font-bold uppercase border border-slate-800">{sup.category}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Contact point: <b className="text-slate-300 font-semibold">{sup.contactName}</b></p>
                </div>
                
                {/* Performance score */}
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-slate-200 text-sm">{sup.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 justify-end text-[10px] text-slate-400 font-semibold">
                    <Activity className="w-3 h-3 text-indigo-400" />
                    <span>Score: <b className="text-slate-200">{sup.performanceScore}%</b></span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-800 py-3.5 my-4 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Active POs</span>
                  <span className="text-sm font-bold text-slate-200 mt-0.5 block">{sup.activeOrdersCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">SLA Reliability</span>
                  <span className={`text-sm font-bold mt-0.5 block ${
                    sup.performanceScore >= 90 ? "text-emerald-400" : sup.performanceScore >= 80 ? "text-amber-400" : "text-red-400"
                  }`}>{sup.performanceScore >= 90 ? "Elite" : sup.performanceScore >= 80 ? "Good" : "Risk"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Response</span>
                  <span className="text-sm font-bold text-slate-200 mt-0.5 block">{'<24 hours'}</span>
                </div>
              </div>

              {/* Info details footer */}
              <div className="flex flex-col gap-1 text-xs text-slate-400">
                <span className="truncate">Email: <b className="text-slate-300 font-medium">{sup.email}</b></span>
                <span>Phone: <b className="text-slate-300 font-medium">{sup.phone}</b></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PURCHASE ORDERS PAGE */}
      {activeTab === "pos" && (
        <div className="space-y-4 animate-fade-in" id="purchase-orders-list">
          {purchaseOrders.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-medium">
              No purchase orders registered. Draw a new supply-line order.
            </div>
          ) : (
            purchaseOrders.map((po) => {
              const isPending = po.status === "Pending";
              const isShipped = po.status === "Shipped";
              const isCompleted = po.status === "Completed";

              return (
                <div key={po.id} id={`po-card-${po.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-700 transition-all">
                  {/* PO Title row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">PO #{po.id}</span>
                        <span className="text-xs text-slate-400">• Vendor: <b className="text-slate-200 font-semibold">{po.supplierName}</b></span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-semibold">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-600" /> Created: {new Date(po.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-600" /> Target ETA: {new Date(po.expectedDeliveryDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {isPending && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded text-xs font-bold">
                          Pending Intake
                        </span>
                      )}
                      {isShipped && (
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded text-xs font-bold animate-pulse">
                          In Transit
                        </span>
                      )}
                      {isCompleted && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Received
                        </span>
                      )}

                      {isPending && (
                        <button
                          onClick={() => onReceivePO(po.id)}
                          id={`btn-receive-po-${po.id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          Receive Delivery
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PO Items */}
                  <div className="py-3.5 text-xs text-slate-400 space-y-1">
                    <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1.5">Ordered SKU List</p>
                    {po.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/60">
                        <span>{item.productName}</span>
                        <span className="font-semibold text-slate-200">{item.qty} units (Cost basis: ₹{item.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ea)</span>
                      </div>
                    ))}
                  </div>

                  {/* PO Footer values */}
                  <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-xs">
                    <span className="text-slate-500">Total Purchase Commitment</span>
                    <span className="text-base font-bold text-white">₹{po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ADD SUPPLIER DIALOG */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800 text-slate-100">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-white">Add New Partner Supplier</h3>
              <button onClick={() => setIsAddSupplierOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Supplier Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Fasteners Corp"
                  value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Key Account Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={supForm.contactName}
                  onChange={(e) => setSupForm({ ...supForm, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Supplier Category</label>
                  <select
                    value={supForm.category}
                    onChange={(e) => setSupForm({ ...supForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-slate-100 focus:outline-none"
                  >
                    <option value="Electronics" className="bg-slate-900 text-slate-100">Electronics</option>
                    <option value="Hardware" className="bg-slate-900 text-slate-100">Hardware</option>
                    <option value="Packaging" className="bg-slate-900 text-slate-100">Packaging</option>
                    <option value="Medical" className="bg-slate-900 text-slate-100">Medical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+1-555-0100"
                    value={supForm.phone}
                    onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Orders/SLA Email</label>
                <input
                  type="email"
                  required
                  placeholder="b2b@company.com"
                  value={supForm.email}
                  onChange={(e) => setSupForm({ ...supForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Register Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER DIALOG */}
      {isCreatePOOpen && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-800 text-slate-100">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-white">Compile Restock Purchase Order</h3>
              <button onClick={() => setIsCreatePOOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePOSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Choose Partner Vendor</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-800 rounded-lg text-sm bg-slate-950 text-slate-100 focus:outline-none font-semibold cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              {/* Items list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Replenishment Items</span>
                  <button
                    type="button"
                    onClick={handleAddPOItem}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Item
                  </button>
                </div>

                {poItems.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">Add at least one product to the supply line.</p>
                ) : (
                  poItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-end bg-slate-950 border border-slate-800 p-3 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Catalog Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handlePOItemChange(idx, "productId", e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-800 rounded-md text-xs bg-slate-900 text-slate-100 focus:outline-none"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">{p.name} (Cost: ₹{p.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.qty}
                          onChange={(e) => handlePOItemChange(idx, "qty", e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-800 rounded-md text-xs bg-slate-950 text-slate-100 focus:outline-none"
                        />
                      </div>

                      {poItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePOItem(idx)}
                          className="p-1.5 hover:bg-red-950/50 text-slate-500 hover:text-red-400 rounded transition-all mb-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Total Calculation */}
              <div className="border-t border-slate-800 pt-4 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Accumulated Draft Total:</span>
                <span className="text-base font-bold text-white">
                  ₹{poItems.reduce((acc, item) => {
                    const prod = products.find(p => p.id === item.productId);
                    const cost = prod ? prod.cost : 10;
                    return acc + cost * item.qty;
                  }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatePOOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={poItems.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  Dispatch Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
