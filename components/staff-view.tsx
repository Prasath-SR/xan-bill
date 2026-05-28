"use client";

import { StaffMember } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

type StaffViewProps = {
  staff: StaffMember[];
  isAdmin: boolean;
  currentUserId: string;
};

export function StaffView({ staff, isAdmin, currentUserId }: StaffViewProps) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    staffCode: "",
    email: "",
    password: "",
    role: "CASHIER",
  });

  const openAddModal = () => {
    setActiveId(null);
    setForm({ name: "", staffCode: "", email: "", password: "", role: "CASHIER" });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setActiveId(member.id);
    setForm({ 
      name: member.name, 
      staffCode: member.staffCode, 
      email: member.email || "", 
      password: "", 
      role: member.roleEnum 
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const url = activeId ? `/api/staff/${activeId}` : "/api/staff";
      const method = activeId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save staff");
      
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this staff member? They will no longer be able to log in.")) return;
    
    try {
      const res = await fetch(`/api/staff/${userId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to deactivate staff");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="glass-card rounded-[1.5rem] border p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Staff</p>
            <h3 className="mt-1 text-xl font-semibold">Team members</h3>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button 
                onClick={openAddModal}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-accent/90 transition"
              >
                + Add Staff
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {staff.map((member) => (
            <article key={member.id} className={`rounded-xl border border-line bg-white/80 p-3 ${!member.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{member.name}</p>
                    {!member.isActive && (
                      <span className="rounded bg-red-100 text-red-700 px-1.5 py-0.5 text-[10px] font-bold">DEACTIVATED</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {member.role} · Code: {member.staffCode}
                  </p>
                </div>

              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>{member.performanceNote}</span>
                <div className="flex gap-2">
                  {member.isActive && isAdmin && (
                    <>
                      <button 
                        onClick={() => openEditModal(member)}
                        className="rounded-md bg-gray-100 text-gray-700 px-2 py-1 font-semibold hover:bg-gray-200 transition"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(member.id)}
                        className="rounded-md bg-red-50 text-red-600 px-2 py-1 font-semibold hover:bg-red-100 transition"
                      >
                        Deactivate
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
          {staff.length === 0 && (
            <p className="text-sm text-muted text-center py-4">No staff members found.</p>
          )}
        </div>
      </section>

      <section className="glass-card rounded-[1.5rem] border p-4 h-fit">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Role access</p>
        <div className="mt-3 grid gap-2">
          {[
            {
              role: "Admin",
              access: "Reports, inventory, pricing, users, backup, printer settings",
            },
            {
              role: "Cashier",
              access: "POS billing, reprint, split payments, table orders, cancellations",
            },
          ].map((item) => (
            <article key={item.role} className="rounded-xl border border-line bg-white/80 p-3">
              <p className="text-sm font-semibold">{item.role}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.access}</p>
            </article>
          ))}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form 
            onSubmit={handleSave}
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-lg font-bold">{activeId ? "Edit Staff Member" : "Add Staff Member"}</h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {errorMsg && (
                <div className="rounded-lg bg-red-50 text-red-600 p-3 text-sm font-medium">
                  {errorMsg}
                </div>
              )}
              
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-muted">Full Name</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl border border-line bg-gray-50 px-3 py-2 outline-none focus:border-accent focus:bg-white transition"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-muted">Staff Code (Login ID)</label>
                  <input
                    required
                    type="text"
                    value={form.staffCode}
                    onChange={(e) => setForm({ ...form, staffCode: e.target.value })}
                    className="rounded-xl border border-line bg-gray-50 px-3 py-2 outline-none focus:border-accent focus:bg-white transition"
                    placeholder="e.g. EMP01"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-muted">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="rounded-xl border border-line bg-gray-50 px-3 py-2 outline-none focus:border-accent focus:bg-white transition"
                  >
                    <option value="CASHIER">Cashier</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-muted">Email (Optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border border-line bg-gray-50 px-3 py-2 outline-none focus:border-accent focus:bg-white transition"
                  placeholder="e.g. rahul@restaurant.com"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-muted">
                  {activeId ? "New Password (leave blank to keep current)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!activeId}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="rounded-xl border border-line bg-gray-50 px-3 py-2 outline-none focus:border-accent focus:bg-white transition"
                  placeholder={activeId ? "••••••••" : "Create password"}
                />
              </div>
            </div>

            <div className="border-t border-line px-4 py-3 bg-gray-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Staff"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
