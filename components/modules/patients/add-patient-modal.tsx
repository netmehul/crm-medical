"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Patient } from "@/lib/types";

interface PatientFormData {
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  address: string;
}

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: PatientFormData) => Promise<void>;
  editData?: Patient | null;
}

export default function AddPatientModal({ isOpen, onClose, onAdd, editData }: AddPatientModalProps) {
  const [form, setForm] = useState<PatientFormData>({ name: "", age: "", gender: "Male", phone: "", email: "", bloodGroup: "", address: "" });
  const [loading, setLoading] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name,
        age: String(editData.age),
        gender: editData.gender,
        phone: editData.phone,
        email: editData.email || "",
        bloodGroup: editData.bloodGroup || "",
        address: editData.address || "",
      });
    } else {
      setForm({ name: "", age: "", gender: "Male", phone: "", email: "", bloodGroup: "", address: "" });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd(form);
      setForm({ name: "", age: "", gender: "Male", phone: "", email: "", bloodGroup: "", address: "" });
      onClose();
    } catch {
      // parent handles error toasts
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Patient" : "Add New Patient"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Patient name" />
          <Input label="Age" type="number" required value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} placeholder="30" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary cursor-pointer"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <Input label="Phone" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="patient@email.com" />
          <Input label="Blood Group" value={form.bloodGroup} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))} placeholder="B+" />
        </div>
        <Input label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Full address" />

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>{isEdit ? "Save Changes" : "Add Patient"}</Button>
        </div>
      </form>
    </Modal>
  );
}
