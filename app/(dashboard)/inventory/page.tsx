"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Minus, AlertTriangle, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { inventoryApi } from "@/lib/api";
import { InventoryItem } from "@/lib/types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

type Category = "All" | "Medicines" | "Equipment" | "Consumables" | "Samples" | "Other";

const statusVariant: Record<string, "success" | "warning" | "danger"> = {
  "In Stock": "success", "Low Stock": "warning", "Out of Stock": "danger",
};

const categoryToApi: Record<string, string> = {
  Medicines: "medicine", Equipment: "equipment", Consumables: "consumable", Samples: "sample", Other: "other",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [stockModal, setStockModal] = useState<{ item: InventoryItem; type: "in" | "out" } | null>(null);
  const [stockQty, setStockQty] = useState(0);
  const [stockNotes, setStockNotes] = useState("");
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  // Add item form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Medicines");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemThreshold, setNewItemThreshold] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemSupplier, setNewItemSupplier] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");

  const categories: Category[] = ["All", "Medicines", "Equipment", "Consumables", "Samples", "Other"];
  const lowStockCount = items.filter((i) => i.status !== "In Stock").length;

  const fetchItems = useCallback(async () => {
    try {
      const data = await inventoryApi.list({ limit: 100 });
      setItems(data.items);
    } catch (err) {
      addToast({ type: "error", title: "Failed to load inventory", message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    let list = items;
    if (category !== "All") list = list.filter((i) => i.category === category);
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [items, category, search]);

  const handleStockTransaction = async () => {
    if (!stockModal || stockQty <= 0) return;
    const { item, type } = stockModal;
    setSubmitting(true);
    try {
      await inventoryApi.stockTransaction(item.id, { type, quantity: stockQty, reason: stockNotes || undefined });
      addToast({ type: "success", title: `Stock ${type === "in" ? "added" : "removed"}`, message: `${item.name}: ${type === "in" ? "+" : "-"}${stockQty} ${item.unit}` });
      setStockModal(null);
      setStockQty(0);
      setStockNotes("");
      await fetchItems();
    } catch (err) {
      addToast({ type: "error", title: "Stock transaction failed", message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    setSubmitting(true);
    try {
      await inventoryApi.create({
        item_name: newItemName,
        category: categoryToApi[newItemCategory] || "other",
        quantity: parseInt(newItemStock) || 0,
        unit: newItemUnit,
        reorder_level: parseInt(newItemThreshold) || 10,
        unit_price: newItemPrice ? parseFloat(newItemPrice) : undefined,
        supplier: newItemSupplier || undefined,
        notes: newItemNotes || undefined,
      });
      addToast({ type: "success", title: "Item added to inventory" });
      setAddItemOpen(false);
      resetAddForm();
      await fetchItems();
    } catch (err) {
      addToast({ type: "error", title: "Failed to add item", message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    try {
      await inventoryApi.delete(item.id);
      addToast({ type: "success", title: "Item deleted", message: `${item.name} removed from inventory` });
      await fetchItems();
    } catch (err) {
      addToast({ type: "error", title: "Failed to delete item", message: (err as Error).message });
    }
  };

  const resetAddForm = () => {
    setNewItemName("");
    setNewItemCategory("Medicines");
    setNewItemUnit("");
    setNewItemStock("");
    setNewItemThreshold("");
    setNewItemPrice("");
    setNewItemSupplier("");
    setNewItemNotes("");
  };

  const newBalance = stockModal
    ? stockModal.type === "in"
      ? stockModal.item.currentStock + stockQty
      : Math.max(0, stockModal.item.currentStock - stockQty)
    : 0;

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
        <Button onClick={() => setAddItemOpen(true)} size="sm"><Plus size={16} /> Add Item</Button>
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                category === c ? "bg-brand/15 text-brand border border-border-brand" : "bg-bg-surface text-text-secondary border border-border-subtle hover:bg-bg-hover"
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {["Item Name", "Category", "Current Stock", "Unit", "Threshold", "Status", "Last Updated", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border-subtle/50 hover:bg-bg-hover transition-colors group"
                >
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{item.category}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-mono font-medium ${item.status === "Out of Stock" ? "text-danger" : item.status === "Low Stock" ? "text-warning" : "text-text-primary"}`}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">{item.unit}</td>
                  <td className="px-4 py-3 text-sm text-text-muted font-mono">{item.threshold}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[item.status]}
                      className={item.status === "Low Stock" ? "animate-pulse" : ""}
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">{formatDate(item.lastUpdated)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setStockModal({ item, type: "in" }); setStockQty(0); }} className="p-1.5 rounded hover:bg-bg-elevated text-success transition-colors cursor-pointer" title="Stock In">
                        <Plus size={15} />
                      </button>
                      <button onClick={() => { setStockModal({ item, type: "out" }); setStockQty(0); }} className="p-1.5 rounded hover:bg-bg-elevated text-danger transition-colors cursor-pointer" title="Stock Out">
                        <Minus size={15} />
                      </button>
                      <button onClick={() => addToast({ type: "info", title: `Editing ${item.name}` })} className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-secondary transition-colors cursor-pointer" title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDeleteItem(item)} className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-danger transition-colors cursor-pointer" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-text-muted">No items found</div>}
      </div>

      {/* Stock Transaction Modal */}
      <Modal isOpen={!!stockModal} onClose={() => setStockModal(null)} title={stockModal ? `Stock ${stockModal.type === "in" ? "In" : "Out"} — ${stockModal.item.name}` : ""} size="sm">
        {stockModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface border border-border-subtle">
              <span className="text-sm text-text-muted">Current Stock:</span>
              <span className="text-sm font-mono font-medium text-text-primary">{stockModal.item.currentStock} {stockModal.item.unit}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Quantity</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setStockQty((q) => Math.max(0, q - 1))} className="w-10 h-10 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary hover:bg-bg-hover cursor-pointer">
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={stockQty}
                  onChange={(e) => setStockQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 text-center bg-bg-surface border border-border-subtle rounded-lg py-2 text-lg font-mono text-text-primary"
                />
                <button onClick={() => setStockQty((q) => q + 1)} className="w-10 h-10 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center text-text-secondary hover:bg-bg-hover cursor-pointer">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-brand/5 border border-border-brand">
              <span className="text-sm text-text-muted">New Balance:</span>
              <span className={`text-lg font-mono font-bold ${newBalance <= stockModal.item.threshold ? "text-warning" : "text-success"}`}>
                {newBalance} {stockModal.item.unit}
              </span>
            </div>

            <Input label="Date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes</label>
              <textarea
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none h-16 focus:border-brand focus:shadow-[0_0_0_3px_rgba(11,179,122,0.15)]"
                placeholder="Transaction notes..."
              />
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStockModal(null)}>Cancel</Button>
              <Button variant={stockModal.type === "in" ? "success" : "danger"} onClick={handleStockTransaction} disabled={stockQty <= 0 || submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {stockModal.type === "in" ? "Add Stock" : "Remove Stock"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Item Modal */}
      <Modal isOpen={addItemOpen} onClose={() => { setAddItemOpen(false); resetAddForm(); }} title="Add Inventory Item" size="md">
        <div className="space-y-4">
          <Input label="Item Name" placeholder="e.g. Amoxicillin 500mg" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer"
              >
                <option>Medicines</option>
                <option>Equipment</option>
                <option>Consumables</option>
                <option>Samples</option>
                <option>Other</option>
              </select>
            </div>
            <Input label="Unit" placeholder="Tablets, Units, Pairs..." value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Initial Stock" type="number" placeholder="0" value={newItemStock} onChange={(e) => setNewItemStock(e.target.value)} />
            <Input label="Low Stock Threshold" type="number" placeholder="50" value={newItemThreshold} onChange={(e) => setNewItemThreshold(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unit Price" type="number" placeholder="0.00" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} />
            <Input label="Supplier" placeholder="Supplier name" value={newItemSupplier} onChange={(e) => setNewItemSupplier(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Notes</label>
            <textarea
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none h-16 focus:border-brand focus:shadow-[0_0_0_3px_rgba(11,179,122,0.15)]"
              placeholder="Additional notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setAddItemOpen(false); resetAddForm(); }}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={!newItemName.trim() || submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Add Item
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
