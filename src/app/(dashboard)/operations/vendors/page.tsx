"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus, Trash2, Save, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Vendor {
  _id: string;
  name: string;
  type: string;
  contactPerson: string;
  phone: string;
  email: string;
  bankDetails: string;
  gstNumber: string;
  address: string;
  notes: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Vendor>>({});

  useEffect(() => { fetchVendors(); }, []);

  async function fetchVendors() {
    setLoading(true);
    try {
      const res = await api.get("/vendors");
      setVendors(res?.data || []);
    } catch { setVendors([]); }
    finally { setLoading(false); }
  }

  async function addVendor() {
    try {
      const res = await api.post("/vendors", { name: "New Vendor", type: "mixed" });
      if (res?.data) {
        setVendors([res.data, ...vendors]);
        setEditing(res.data._id);
        setForm(res.data);
      }
    } catch { alert("Failed to create vendor"); }
  }

  async function saveVendor() {
    if (!editing || !form.name?.trim()) return;
    try {
      const res = await api.put(`/vendors/${editing}`, form);
      if (res?.data) {
        setVendors(vendors.map((v) => v._id === editing ? res.data : v));
        setEditing(null);
        setForm({});
      }
    } catch { alert("Failed to save"); }
  }

  async function deleteVendor(id: string) {
    if (!confirm("Delete this vendor?")) return;
    try {
      await api.del(`/vendors/${id}`);
      setVendors(vendors.filter((v) => v._id !== id));
    } catch { alert("Failed to delete"); }
  }

  const filtered = vendors.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.type.includes(q) || v.contactPerson.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/operations" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-800">Vendor Directory</h1>
          <p className="text-xs text-slate-400">Manage your vendor database — select from these when adding flights, hotels, vehicles</p>
        </div>
        <button onClick={addVendor} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-700">
          <Plus size={14} /> Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 max-w-sm">
        <Search size={16} className="text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors..." className="bg-transparent border-none outline-none text-sm w-full" />
      </div>

      {/* Vendor Cards */}
      {loading ? (
        <div className="text-center py-12 text-sm text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">No vendors found. Add your first vendor above.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((v) => (
            <div key={v._id} className="bg-white rounded-xl border border-slate-200 p-5">
              {editing === v._id ? (
                /* Edit mode */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Name *</label><input type="text" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                    <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Type</label>
                      <select value={form.type || "mixed"} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs">
                        <option value="flight">Flight</option><option value="hotel">Hotel</option><option value="vehicle">Vehicle</option><option value="activity">Activity</option><option value="mixed">Mixed</option>
                      </select>
                    </div>
                    <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Contact Person</label><input type="text" value={form.contactPerson || ""} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                    <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Phone</label><input type="text" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                    <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Email</label><input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                    <div><label className="text-[9px] text-slate-400 uppercase block mb-1">GST Number</label><input type="text" value={form.gstNumber || ""} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                  </div>
                  <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Bank Details</label><input type="text" value={form.bankDetails || ""} onChange={(e) => setForm({ ...form, bankDetails: e.target.value })} placeholder="Account no / IFSC / Bank name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                  <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Address</label><input type="text" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                  <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Notes</label><input type="text" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveVendor} className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"><Save size={12} /> Save</button>
                    <button onClick={() => { setEditing(null); setForm({}); }} className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancel</button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{v.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold capitalize bg-cyan-50 text-cyan-700">{v.type}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(v._id); setForm(v); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-600 text-xs">Edit</button>
                      <button onClick={() => deleteVendor(v._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 mt-3">
                    {v.contactPerson && <p><span className="text-slate-400">Contact:</span> {v.contactPerson}</p>}
                    {v.phone && <p><span className="text-slate-400">Phone:</span> {v.phone}</p>}
                    {v.email && <p><span className="text-slate-400">Email:</span> {v.email}</p>}
                    {v.gstNumber && <p><span className="text-slate-400">GST:</span> {v.gstNumber}</p>}
                  </div>
                  {v.bankDetails && <p className="text-[10px] text-slate-400 mt-2">Bank: {v.bankDetails}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
