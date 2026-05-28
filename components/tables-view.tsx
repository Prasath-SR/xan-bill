"use client";

import { useState } from "react";
import { RestaurantTable } from "@/lib/types";

type TablesViewProps = {
  tables: RestaurantTable[];
};

export function TablesView({ tables }: TablesViewProps) {
  const [localTables, setLocalTables] = useState(tables);
  const [creatingTable, setCreatingTable] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newTableSeats, setNewTableSeats] = useState("4");
  const [addTableError, setAddTableError] = useState("");

  const submitAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddTableError("");

    const num = parseInt(newTableNum, 10);
    if (isNaN(num) || num <= 0) {
      setAddTableError("Please enter a valid positive number for table number.");
      return;
    }

    const capacity = parseInt(newTableSeats, 10);
    if (isNaN(capacity) || capacity <= 0) {
      setAddTableError("Please enter a valid positive number for seats.");
      return;
    }

    const name = `T${num.toString().padStart(2, "0")}`;

    setCreatingTable(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        body: JSON.stringify({ name, capacity }),
      });
      if (!res.ok) throw new Error((await res.json()).error || await res.text());
      const data = await res.json();
      setLocalTables([...localTables, data.table]);
      setIsAddModalOpen(false);
      setNewTableNum("");
      setNewTableSeats("4");
    } catch (err: any) {
      setAddTableError("Failed to create table: " + err.message);
    } finally {
      setCreatingTable(false);
    }
  };

  const handleRemoveTable = async (id: string) => {
    if (!confirm("Are you sure you want to remove this table?")) return;

    try {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || await res.text());
      setLocalTables(localTables.filter((t) => t.id !== id));
    } catch (err: any) {
      alert("Failed to remove table: " + err.message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
        >
          <span className="text-base leading-none">+</span>
          Add Table
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {localTables.map((table) => (
          <article key={table.id} className="group relative glass-card rounded-[1.25rem] border p-4">
            <button
              onClick={() => handleRemoveTable(table.id)}
              className="absolute right-2 top-2 hidden rounded p-1 text-red-500 hover:bg-red-50 group-hover:block"
              title="Remove Table"
            >
              <span className="text-base">🗑️</span>
            </button>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Table</p>
                <h3 className="mt-1 text-2xl font-semibold">{table.name}</h3>
              </div>
              <span
                className={`pill text-[10px] px-2 py-0.5 ${
                  table.status === "AVAILABLE"
                    ? "pill-success"
                    : table.status === "RESERVED"
                      ? "pill-warning"
                      : "pill-danger"
                }`}
              >
                {table.status.replace("_", " ")}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted">
              <p>Capacity: {table.capacity}</p>
              <p>Zone: {table.zone}</p>
              <p>Reservation: {table.reservedFor ?? "Walk-in"}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="glass-card rounded-[1.5rem] border p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Operational tools</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {[
            "Create and rename tables",
            "Merge or split tables during rush",
            "Maintain reservation blocks and live occupancy",
          ].map((item) => (
            <div key={item} className="rounded-xl border border-line bg-white/80 p-3 text-xs font-semibold">
              {item}
            </div>
          ))}
        </div>
      </section>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#fcf9f5] p-6 shadow-2xl border border-line">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Add New Table</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-2 hover:bg-muted/10 leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitAddTable} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Table Number</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-muted">T</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-accent"
                    placeholder="e.g., 1 for T01"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-muted">Number of Seats</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-accent"
                  placeholder="Enter capacity"
                />
              </div>

              {addTableError && <p className="text-sm text-red-500">{addTableError}</p>}

              <button
                type="submit"
                disabled={creatingTable}
                className="mt-2 w-full rounded-2xl bg-accent py-3.5 font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
              >
                {creatingTable ? "Saving..." : "Save Table"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
