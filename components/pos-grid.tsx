"use client";

import { useState } from "react";
import { PosTable, MenuCategory, MenuItem, CompanyProfile } from "@/lib/types";
import { PosModal } from "./pos-modal";

export function PosGrid({
  categories,
  companyProfile,
  items,
  initialTables,
  initialParcelOrders,
  cashierName,
}: {
  categories: MenuCategory[];
  companyProfile: CompanyProfile;
  items: MenuItem[];
  initialTables: PosTable[];
  initialParcelOrders: any[];
  cashierName: string;
}) {
  const [tables, setTables] = useState<PosTable[]>(initialTables);
  const [parcelOrders, setParcelOrders] = useState<any[]>(initialParcelOrders);
  const [activeTable, setActiveTable] = useState<PosTable | null>(null);
  const [activeOrderToEdit, setActiveOrderToEdit] = useState<any>(undefined);
  const [tableSplitModal, setTableSplitModal] = useState<PosTable | null>(null);
  const [isParcelSplitModalOpen, setIsParcelSplitModalOpen] = useState(false);
  const [isParcelActive, setIsParcelActive] = useState(false);

  const updateTableData = (tableId: string, activeOrders: any[], status: any) => {
    setTables(tables.map(t => {
      if (t.id === tableId) {
        return { ...t, status, activeOrders };
      }
      return t;
    }));
  };

  const updateParcelData = (newOrder: any, isCheckout: boolean) => {
    if (isCheckout) {
      setParcelOrders(parcelOrders.filter(o => o.id !== newOrder.id));
    } else {
      setParcelOrders(prev => {
        const exists = prev.find(o => o.id === newOrder.id);
        if (exists) {
          return prev.map(o => o.id === newOrder.id ? newOrder : o);
        } else {
          return [...prev, newOrder];
        }
      });
    }
  };

  const handleTableClick = (table: PosTable) => {
    const orders = table.activeOrders || [];
    if (orders.length === 0) {
      setActiveOrderToEdit(undefined);
      setActiveTable(table);
    } else {
      setTableSplitModal(table);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dine-in Tables</h2>

      </div>

      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {/* Parcel Orders Tile */}
        {(() => {
          const isOccupied = parcelOrders.length > 0;
          const totalAmount = parcelOrders.reduce((sum, o) => sum + o.totalAmount, 0);

          return (
            <div
              onClick={() => {
                if (isOccupied) {
                  setIsParcelSplitModalOpen(true);
                } else {
                  setIsParcelActive(true);
                }
              }}
              className={`group relative cursor-pointer flex flex-col justify-between rounded-2xl border p-3 h-24 transition-all hover:shadow-lg ${isOccupied
                ? "border-orange-500 bg-orange-50 text-orange-600"
                : "border-line bg-white text-foreground hover:border-orange-400"
                }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold leading-none">Parcel</h3>
                  <p className="mt-1 text-[10px] uppercase tracking-wider opacity-60">
                    Takeaway
                  </p>
                </div>
                {isOccupied && parcelOrders.length > 1 && (
                  <span className="absolute -top-2 -right-2 flex h-6 items-center rounded-full bg-orange-500 px-2 text-xs font-bold text-white shadow-md">
                    {parcelOrders.length} Bills
                  </span>
                )}
                <span className={`text-base ${isOccupied ? "opacity-100" : "opacity-30"}`}>🛍️</span>
              </div>

              <div className="mt-2 flex items-end justify-between">
                {isOccupied ? (
                  <div>
                    <p className="text-[10px] opacity-70">Running Bill</p>
                    <p className="text-sm font-bold">Rs {totalAmount.toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-xs font-medium opacity-60">+ New Order</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Dine-in Tables */}
        {tables.map((table) => {
          const orders = table.activeOrders || [];
          const isOccupied = orders.length > 0;
          const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`group relative cursor-pointer flex flex-col justify-between rounded-2xl border p-3 h-24 transition-all hover:shadow-lg ${isOccupied
                ? "border-accent bg-accent/5 text-accent"
                : "border-line bg-white text-foreground hover:border-accent"
                }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold leading-none">{table.name}</h3>
                  <p className="mt-1 text-[10px] uppercase tracking-wider opacity-60">
                    {table.capacity} Seats
                  </p>
                </div>
                {isOccupied && orders.length > 1 && (
                  <span className="absolute -top-2 -right-2 flex h-6 items-center rounded-full bg-accent px-2 text-xs font-bold text-white shadow-md">
                    {orders.length} Bills
                  </span>
                )}
                <span className={`text-base ${isOccupied ? "opacity-100" : "opacity-30"}`}>🍽️</span>
              </div>

              <div className="mt-2 flex items-end justify-between">
                {isOccupied ? (
                  <div>
                    <p className="text-[10px] opacity-70">Running Bill</p>
                    <p className="text-sm font-bold">Rs {totalAmount.toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-xs font-medium opacity-60">Available</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tableSplitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Table {tableSplitModal.name}</h3>
              <button onClick={() => setTableSplitModal(null)} className="rounded-full p-2 hover:bg-muted/10 text-xl leading-none">✕</button>
            </div>
            
            <p className="text-sm text-muted mb-4">Select an active bill to view/checkout, or start a new split bill.</p>
            
            <div className="space-y-3">
              {(tableSplitModal.activeOrders || []).map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setActiveOrderToEdit(order);
                    setActiveTable(tableSplitModal);
                    setTableSplitModal(null);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-line bg-gray-50 p-4 hover:border-accent hover:bg-accent/5 transition-all text-left"
                >
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-muted">{order.items.length} items</p>
                  </div>
                  <p className="font-bold text-accent">Rs {order.totalAmount}</p>
                </button>
              ))}

              <button
                onClick={() => {
                  setActiveOrderToEdit(undefined);
                  setActiveTable(tableSplitModal);
                  setTableSplitModal(null);
                }}
                className="w-full rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4 text-center font-bold text-accent hover:bg-accent hover:text-white transition-all"
              >
                + New Split Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {isParcelSplitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Parcel Orders</h3>
              <button onClick={() => setIsParcelSplitModalOpen(false)} className="rounded-full p-2 hover:bg-muted/10 text-xl leading-none">✕</button>
            </div>
            
            <p className="text-sm text-muted mb-4">Select an active bill to view/checkout, or start a new parcel bill.</p>
            
            <div className="space-y-3">
              {parcelOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setActiveOrderToEdit(order);
                    setIsParcelActive(true);
                    setIsParcelSplitModalOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-line bg-gray-50 p-4 hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                >
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-muted">{order.items.length} items</p>
                  </div>
                  <p className="font-bold text-orange-600">Rs {order.totalAmount}</p>
                </button>
              ))}

              <button
                onClick={() => {
                  setActiveOrderToEdit(undefined);
                  setIsParcelActive(true);
                  setIsParcelSplitModalOpen(false);
                }}
                className="w-full rounded-xl border border-dashed border-orange-400/50 bg-orange-50 p-4 text-center font-bold text-orange-600 hover:bg-orange-500 hover:text-white transition-all"
              >
                + New Parcel Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTable && (
        <PosModal
          table={activeTable}
          categories={categories}
          companyProfile={companyProfile}
          items={items}
          activeOrder={activeOrderToEdit}
          onClose={() => {
            setActiveTable(null);
            setActiveOrderToEdit(undefined);
          }}
          onUpdateTable={updateTableData}
          cashierName={cashierName}
        />
      )}

      {isParcelActive && (
        <PosModal
          table={null}
          categories={categories}
          companyProfile={companyProfile}
          items={items}
          activeOrder={activeOrderToEdit}
          onClose={() => {
            setIsParcelActive(false);
            setActiveOrderToEdit(undefined);
          }}
          onUpdateTable={(tId, o, s, pNewOrder, isCheckout) => {
            if (pNewOrder) {
              updateParcelData(pNewOrder, isCheckout || false);
            }
          }}
          cashierName={cashierName}
        />
      )}
    </div>
  );
}
