"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Minus, AlertTriangle, Pencil, Trash2, X, Loader2, CreditCard, ChevronDown, Filter, Info, Truck } from "lucide-react";
import { inventoryApi, suppliersApi } from "@/lib/api";
import { InventoryItem, Supplier } from "@/lib/types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { formatUSD, toCents } from "@/lib/currency";
import { useToast } from "@/lib/toast-context";

type Category = "All" | "Medicines" | "Equipment" | "Consumables" | "Samples" | "Other";

const statusVariant: Record<string, "success" | "warning" | "danger"> = {
  "In Stock": "success", "Low Stock": "warning", "Out of Stock": "danger",
};

const categoryToApi: Record<string, string> = {
  Medicines: "medicine", Equipment: "equipment", Consumables: "consumable", Samples: "sample", Other: "other",
};

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  // Edit item state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "Medicines",
    quantity: "",
    unit: "",
    threshold: "",
    price: "",
    sellingPrice: "",
    supplierId: "",
    notes: ""
  });

  // Add items bulk form state
  const getEmptyDraft = () => ({
    name: "",
    category: "Medicines",
    unit: "",
    quantity: "",
    threshold: "",
    price: "",
    sellingPrice: "",
    supplier: "",
    notes: ""
  });
  const [newItems, setNewItems] = useState([getEmptyDraft()]);

  const categories: Category[] = ["All", "Medicines", "Equipment", "Consumables", "Samples", "Other"];
  const lowStockCount = items.filter((i) => i.status !== "In Stock").length;

  const fetchData = useCallback(async () => {
    try {
      const [invData, supData] = await Promise.all([
        inventoryApi.list({ limit: 100 }),
        suppliersApi.list()
      ]);
      setItems(invData.items);
      setSuppliers(supData);
    } catch (err) {
      addToast({ type: "error", title: "Failed to load inventory", message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    let list = items;
    if (category !== "All") list = list.filter((i) => i.category === category);
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [items, category, search]);

  const handleAddItem = async () => {
    const validItems = newItems.filter(item => item.name.trim() !== "");
    if (validItems.length === 0) return;

    setSubmitting(true);
    try {
      await Promise.all(validItems.map(item =>
        inventoryApi.create({
          item_name: item.name,
          category: categoryToApi[item.category] || "other",
          quantity: parseInt(item.quantity) || 0,
          unit: item.unit,
          reorder_level: item.threshold ? parseInt(item.threshold) : Math.ceil((parseInt(item.quantity) || 0) * 0.12),
          cost_per_unit_cents: item.price ? toCents(item.price) : undefined,
          selling_price_cents: item.sellingPrice ? toCents(item.sellingPrice) : undefined,
          supplier_id: item.supplier || undefined,
          notes: item.notes || undefined,
        })
      ));

      addToast({ type: "success", title: `Added ${validItems.length} items to inventory` });
      setAddItemOpen(false);
      resetAddForm();
      await fetchData();
    } catch (err) {
      addToast({ type: "error", title: "Failed to add items", message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    try {
      await inventoryApi.delete(item.id);
      addToast({ type: "success", title: "Item deleted", message: `${item.name} removed from inventory` });
      await fetchData();
    } catch (err) {
      addToast({ type: "error", title: "Failed to delete item", message: (err as Error).message });
    }
  };

  const resetAddForm = () => {
    setNewItems([getEmptyDraft()]);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      category: item.category || "Medicines",
      quantity: item.currentStock.toString(),
      unit: item.unit || "",
      threshold: item.threshold?.toString() || "",
      price: item.unitPrice ? (item.unitPrice / 100).toFixed(2) : "",
      sellingPrice: item.sellingPriceCents ? (item.sellingPriceCents / 100).toFixed(2) : "",
      supplierId: item.supplierId || "",
      notes: ""
    });
    setEditModalOpen(true);
  };

  const handleEditItem = async () => {
    if (!editingItem || !editFormData.name.trim()) return;
    setSubmitting(true);
    try {
      await inventoryApi.update(editingItem.id, {
        item_name: editFormData.name,
        category: categoryToApi[editFormData.category] || "other",
        quantity: parseInt(editFormData.quantity) || undefined,
        unit: editFormData.unit,
        reorder_level: parseInt(editFormData.threshold) || undefined,
        cost_per_unit_cents: editFormData.price ? toCents(editFormData.price) : undefined,
        selling_price_cents: editFormData.sellingPrice ? toCents(editFormData.sellingPrice) : undefined,
        supplier_id: editFormData.supplierId || undefined,
        notes: editFormData.notes || undefined,
      });
      addToast({ type: "success", title: "Item updated successfully" });
      setEditModalOpen(false);
      setEditingItem(null);
      await fetchData();
    } catch (err) {
      addToast({ type: "error", title: "Failed to update item", message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
      {/* Alert banner */}
      {lowStockCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20"
        >
          <AlertTriangle size={18} className="text-warning shrink-0" />
          <p className="text-sm text-warning flex-1">
            {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} low on stock or out of stock.
          </p>
        </motion.div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Inventory</h1>
          <p className="text-sm text-text-secondary mt-0.5">{items.length} items tracked</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.push('/suppliers')}><Truck size={16} /> Suppliers</Button>
          <Button onClick={() => setAddItemOpen(true)} size="sm"><Plus size={16} /> Add Item</Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: items.length, color: "text-brand" },
          { label: "Low Stock", value: items.filter((i) => i.status === "Low Stock").length, color: "text-warning" },
          { label: "Out of Stock", value: items.filter((i) => i.status === "Out of Stock").length, color: "text-danger" },
          { label: "Last Updated", value: "Today", color: "text-text-secondary" },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card p-4">
            <p className="text-xs text-text-muted uppercase mb-1">{kpi.label}</p>
            <p className={`text-xl font-mono font-medium ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-64">
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Package size={16} />} />
        </div>
        <div className="flex gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${category === c ? "bg-brand/15 text-brand border border-border-brand" : "bg-bg-surface text-text-secondary border border-border-subtle hover:bg-bg-hover"
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-surface/50">
                {["Item Name", "Category", "Current Stock", "Threshold", "Purchase", "Selling", "Status", "Supplier", ""].map((h) => (
                  <th key={h} className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {filtered.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-bg-hover transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-bold text-text-primary">{item.name}</p>
                      <p className="text-[10px] text-text-muted font-mono">{item.sku || "NO SKU"}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="muted" className="text-[10px] uppercase font-bold">{item.category}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className={`text-sm font-mono font-bold ${item.status === "Out of Stock" ? "text-danger" : item.status === "Low Stock" ? "text-warning" : "text-text-primary"}`}>
                          {item.currentStock} <span className="text-[10px] font-sans font-medium text-text-muted ml-0.5">{item.unit}</span>
                        </span>
                        {item.split && (
                          <div className="flex gap-2 mt-0.5">
                            <div className="flex items-center gap-1" title="Purchased">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                              <span className="text-[9px] font-mono text-text-muted">{item.split.purchased}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Sample">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                              <span className="text-[9px] font-mono text-text-muted">{item.split.sample}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted font-mono">{item.threshold}</td>
                  <td className="px-5 py-4 text-sm font-mono font-medium text-text-secondary">{formatUSD(item.unitPrice)}</td>
                  <td className="px-5 py-4 text-sm font-mono font-medium text-brand">{formatUSD(item.sellingPriceCents)}</td>
                  <td className="px-5 py-4">
                    <Badge variant={statusVariant[item.status]}
                      className={item.status === "Low Stock" ? "animate-pulse" : ""}
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-text-secondary truncate max-w-[120px]" title={item.supplier}>
                      {item.supplier || <span className="text-text-muted italic opacity-50">None</span>}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(item)} className="p-2 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-brand transition-all cursor-pointer" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteItem(item)} className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-all cursor-pointer" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <Package size={40} className="mx-auto text-text-muted mb-3 opacity-20" />
            <p className="text-sm text-text-muted font-medium">No items found in this category</p>
          </div>
        )}
      </div>

      {/* Bulk Add Item Modal */}
      <Modal isOpen={addItemOpen} onClose={() => { setAddItemOpen(false); resetAddForm(); }} title="Add Inventory Items" size="2xl">
        <div className="space-y-2">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle text-xs font-bold text-text-muted uppercase bg-bg-elevated/50">
                    <th className="px-4 py-3 min-w-[200px]">Item Name *</th>
                    <th className="px-4 py-3 min-w-[140px]">Category</th>
                    <th className="px-4 py-3 min-w-[150px]">Quantity</th>
                    <th className="px-4 py-3 min-w-[120px]">Threshold</th>
                    <th className="px-4 py-3 min-w-[150px]">Purchase Price ($)</th>
                    <th className="px-4 py-3 min-w-[150px]">Selling Price ($)</th>
                    <th className="px-4 py-3 min-w-[140px]">Total Payable</th>
                    <th className="px-4 py-3 min-w-[180px]">Supplier</th>
                    <th className="px-4 py-3 min-w-[200px]">Notes</th>
                    <th className="px-4 py-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {newItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-bg-hover/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Item Name"
                          className="w-full bg-transparent border-b border-transparent focus:border-brand px-2 py-1.5 text-sm text-text-primary focus:outline-none transition-colors"
                          value={item.name}
                          onChange={(e) => {
                            const arr = [...newItems];
                            arr[idx].name = e.target.value;
                            setNewItems(arr);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full bg-transparent border-b border-transparent focus:border-brand px-2 py-1.5 text-sm text-text-primary cursor-pointer focus:outline-none"
                          value={item.category}
                          onChange={(e) => {
                            const arr = [...newItems];
                            arr[idx].category = e.target.value;
                            setNewItems(arr);
                          }}
                        >
                          <option>Medicines</option>
                          <option>Equipment</option>
                          <option>Consumables</option>
                          <option>Samples</option>
                          <option>Other</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 bg-bg-surface border border-border-subtle rounded-lg p-0.5 shadow-sm">
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-bg-hover text-text-secondary transition-colors"
                            onClick={() => {
                              const arr = [...newItems];
                              const val = Math.max(0, (parseInt(arr[idx].quantity) || 0) - 1);
                              arr[idx].quantity = val.toString();
                              setNewItems(arr);
                            }}
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            className="w-12 text-center bg-transparent border-none text-sm font-mono focus:outline-none"
                            value={item.quantity}
                            placeholder="0"
                            onChange={(e) => {
                              const arr = [...newItems];
                              arr[idx].quantity = Math.max(0, parseInt(e.target.value) || 0).toString();
                              setNewItems(arr);
                            }}
                          />
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-bg-hover text-text-secondary transition-colors"
                            onClick={() => {
                              const arr = [...newItems];
                              const val = (parseInt(arr[idx].quantity) || 0) + 1;
                              arr[idx].quantity = val.toString();
                              setNewItems(arr);
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          placeholder={Math.ceil((parseInt(item.quantity) || 0) * 0.12).toString()}
                          className="w-full bg-transparent border-b border-transparent focus:border-brand px-2 py-1.5 text-sm font-mono text-text-primary focus:outline-none transition-colors"
                          value={item.threshold}
                          onChange={(e) => {
                            const arr = [...newItems];
                            arr[idx].threshold = e.target.value;
                            setNewItems(arr);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full bg-transparent border-b border-transparent focus:border-brand px-2 py-1.5 text-sm font-mono text-text-primary focus:outline-none transition-colors"
                          value={item.price}
                          onChange={(e) => {
                            const arr = [...newItems];
                            arr[idx].price = e.target.value;
                            setNewItems(arr);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full bg-transparent border-b border-transparent focus:border-success px-2 py-1.5 text-sm font-mono text-text-primary focus:outline-none transition-colors"
                          value={item.sellingPrice}
                          onChange={(e) => {
                            const arr = [...newItems];
                            arr[idx].sellingPrice = e.target.value;
                            setNewItems(arr);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-transparent border-b border-transparent px-2 py-1.5 text-sm font-mono font-bold text-brand">
                          {formatUSD(((parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0)) * 100)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="w-full bg-transparent border-b border-transparent focus:border-brand px-2 py-1.5 text-sm text-text-primary cursor-pointer focus:outline-none"
                          value={item.supplier}
                          onChange={(e) => {
                            const arr = [...newItems];
                            arr[idx].supplier = e.target.value;
                            setNewItems(arr);
                          }}
                        >
                          <option value="">None</option>
                          {suppliers && suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Optional notes"
                          className="w-full bg-transparent border-b border-transparent focus:border-brand px-2 py-1.5 text-sm text-text-primary focus:outline-none transition-colors"
                          value={item.notes}
                          onChange={(e) => {
                            const arr = [...newItems];
                            arr[idx].notes = e.target.value;
                            setNewItems(arr);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            if (newItems.length > 1) {
                              setNewItems(newItems.filter((_, i) => i !== idx));
                            } else {
                              resetAddForm();
                            }
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors mx-auto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-bg-surface border-t border-border-subtle flex justify-center">
              <button
                onClick={() => setNewItems([...newItems, getEmptyDraft()])}
                className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-dark px-4 py-2 rounded-lg hover:bg-brand/5 transition-colors"
              >
                <Plus size={16} /> Add Another Row
              </button>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <Button variant="ghost" onClick={() => { setAddItemOpen(false); resetAddForm(); }} className="flex-1 max-w-[200px]">Cancel</Button>
            <Button onClick={handleAddItem} disabled={!newItems.some(i => i.name.trim()) || submitting} className="flex-1 shadow-md">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : `Save ${newItems.filter(i => i.name.trim()).length || ''} Items`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setEditingItem(null); }} title="Edit Inventory Item" size="md">
        {editingItem && (
          <div className="space-y-4">
            <Input
              label="Item Name *"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Category</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary cursor-pointer focus:border-brand transition-all shadow-sm"
                >
                  <option>Medicines</option>
                  <option>Equipment</option>
                  <option>Consumables</option>
                  <option>Samples</option>
                  <option>Other</option>
                </select>
              </div>
              <Input
                label="Quantity"
                type="number"
                value={editFormData.quantity}
                onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min. Alert Threshold"
                type="number"
                value={editFormData.threshold}
                onChange={(e) => setEditFormData({ ...editFormData, threshold: e.target.value })}
              />
              <Input
                label="Purchase Price ($) per Unit"
                type="number"
                value={editFormData.price}
                onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
              />
            </div>

            <Input
              label="Selling Price ($) per Unit"
              type="number"
              value={editFormData.sellingPrice}
              onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-brand/5 border border-brand/10 space-y-1">
                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-0.5">Total Payable (Cost)</p>
                <p className="text-xl font-mono font-black text-brand">
                  {formatUSD(((parseInt(editFormData.quantity) || 0) * (parseFloat(editFormData.price) || 0)) * 100)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-success/5 border border-success/10 space-y-1">
                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-wider mb-0.5">Total Revenue (Selling)</p>
                <p className="text-xl font-mono font-black text-success">
                  {formatUSD(((parseInt(editFormData.quantity) || 0) * (parseFloat(editFormData.sellingPrice) || 0)) * 100)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Primary Supplier</label>
              <select
                value={editFormData.supplierId}
                onChange={(e) => setEditFormData({ ...editFormData, supplierId: e.target.value })}
                className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary cursor-pointer focus:border-brand transition-all shadow-sm"
              >
                <option value="">None / Not specified</option>
                {suppliers && suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Internal Notes</label>
              <textarea
                className="w-full bg-bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary resize-none h-24 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all shadow-sm"
                placeholder="Optional notes..."
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-border-subtle">
              <Button variant="ghost" onClick={() => { setEditModalOpen(false); setEditingItem(null); }} className="flex-1">Cancel</Button>
              <Button onClick={handleEditItem} disabled={!editFormData.name?.trim() || submitting} className="flex-1 shadow-lg">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
