"use client";

import { useMemo, useState } from "react";
import { PaymentMethod } from "@prisma/client";
import { CompanyProfile, MenuCategory, MenuItem, PosTable } from "@/lib/types";


type CartItem = MenuItem & {
  quantity: number;
};

type PosModalProps = {
  table: PosTable | null; // null for parcel
  categories: MenuCategory[];
  companyProfile: CompanyProfile;
  items: MenuItem[];
  activeOrder?: any; // The specific order being edited, if any
  onClose: () => void;
  onUpdateTable: (tableId: string, activeOrders: any[], status: string, pNewOrder?: any, isCheckout?: boolean) => void;
  cashierName: string;
};

const paymentMethods: PaymentMethod[] = ["CASH", "UPI", "CARD", "MIXED"];

export function PosModal({
  table,
  categories,
  companyProfile,
  items,
  activeOrder,
  onClose,
  onUpdateTable,
  cashierName,
}: PosModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [discount, setDiscount] = useState<number>(activeOrder?.discountAmount ?? 0);
  const [customerName, setCustomerName] = useState(activeOrder?.customerName ?? "");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const [cart, setCart] = useState<CartItem[]>(
    activeOrder?.items.map((i: any) => {
      const menuItem = items.find(m => m.id === i.menuItemId)!;
      return { ...menuItem, price: i.price, quantity: i.quantity };
    }) || []
  );

  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const filteredItems = useMemo(() => {
    let filtered = items.filter((item) => item.enabled && item.available);

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.categoryId === selectedCategory);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, selectedCategory, searchQuery]);

  const grandTotalBeforeDiscount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => {
    const totalItemPrice = item.price * item.quantity;
    return sum + (totalItemPrice / (1 + item.gstRate / 100));
  }, 0);
  const tax = cart.reduce((sum, item) => {
    const totalItemPrice = item.price * item.quantity;
    const basePrice = totalItemPrice / (1 + item.gstRate / 100);
    return sum + (totalItemPrice - basePrice);
  }, 0);
  const grandTotal = grandTotalBeforeDiscount - discount;

  const updateQty = (itemId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const addItem = (item: MenuItem) => {
    const itemPrice = (!table && item.parcelPrice) ? item.parcelPrice : item.price;
    setCart((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }
      return [...current, { ...item, price: itemPrice, quantity: 1 }];
    });
  };

  async function handleSave() {
    if (cart.length === 0) {
      setStatusMessage("Add items before saving.");
      return;
    }
    setSaving(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/pos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder?.id,
          diningMode: table ? "DINE_IN" : "PARCEL",
          tableName: table?.name,
          customerName,
          notes,
          discount,
          items: cart.map((item) => ({
            id: item.id,
            price: item.price,
            gstRate: item.gstRate,
            quantity: item.quantity,
          })),
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save order");

      if (table) {
        // Build the updated order object
        const updatedOrder = {
          id: payload.orderId,
          orderNumber: payload.orderNumber,
          diningMode: "DINE_IN",
          totalAmount: grandTotal,
          items: cart.map(c => ({ 
            id: c.id,
            menuItemId: c.id, 
            name: c.name,
            price: c.price,
            quantity: c.quantity,
            gstRate: c.gstRate
          }))
        };

        // If editing an existing order, replace it in the array. If new, append it.
        const currentOrders = table.activeOrders || [];
        const isExisting = currentOrders.some((o: any) => o.id === payload.orderId);
        const newActiveOrders = isExisting 
          ? currentOrders.map((o: any) => o.id === payload.orderId ? updatedOrder : o)
          : [...currentOrders, updatedOrder];

        onUpdateTable(table.id, newActiveOrders, "OCCUPIED");
      } else {
        // Parcel
        const updatedOrder = {
          id: payload.orderId,
          orderNumber: payload.orderNumber,
          diningMode: "PARCEL",
          totalAmount: grandTotal,
          items: cart.map(c => ({ 
            id: c.id,
            menuItemId: c.id, 
            name: c.name,
            price: c.price,
            quantity: c.quantity,
            gstRate: c.gstRate
          }))
        };
        onUpdateTable("", [], "", updatedOrder, false);
      }

      onClose();
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openThermalPrint(payload: {
    billedAt: string;
    invoiceNumber?: string;
    orderNumber: string;
    totalAmount: number;
    isProforma?: boolean;
  }) {
    const printWindow = window.open("", "_blank", "width=420,height=900");

    if (!printWindow) {
      setStatusMessage("Order created, but the print window was blocked.");
      return;
    }

    const billedAt = new Date(payload.billedAt);

    const cgst = tax / 2;
    const sgst = tax / 2;
    const totalItem = cart.length;
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    const thermalHtml = `
    <!doctype html>
    <html>
      <head>
        <title>${payload.isProforma ? 'Proforma Bill' : payload.invoiceNumber}</title>

        <style>
          @page {
            margin: 0;
          }

          html, body {
            margin: 0;
            padding: 0;
            font-family: monospace;
            background: #fff;
            color: #000;
          }

          .bill {
            width: 76mm;
            margin: 0 auto;
            padding: 10px 4px 20px 4px;
          }

          .center {
            text-align: center;
          }

          .title {
            font-size: 20px;
            font-weight: bold;
          }

          .invoice-title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 4px;
          }

          .line {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }

          .row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin: 2px 0;
          }

          .table-row {
            display: grid;
            grid-template-columns: 1.8fr 0.7fr 0.9fr 0.9fr 1fr;
            font-size: 13px;
            margin-top: 4px;
          }

          .table-head {
            font-weight: bold;
          }

          .totals {
            margin-top: 10px;
          }

          .totals .row {
            font-size: 14px;
          }

          .grand {
            font-size: 16px !important;
            font-weight: bold;
          }

          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 14px;
          }

          .bold {
            font-weight: bold;
          }

          .mt {
            margin-top: 8px;
          }
        </style>
      </head>

      <body>
        <div class="bill">

          <!-- HEADER -->

          <div class="center">
            ${companyProfile.logoUrl
        ? `
                  <img 
                    src="${companyProfile.logoUrl}" 
                    style="max-width:90px;max-height:70px;object-fit:contain;"
                  />
                `
        : ""
      }

            <div class="title">
              ${companyProfile.companyName || "Company Name"}
            </div>

            <div>
              ${(companyProfile.address || "Address").replace(/\n/g, "<br/>")}
            </div>

            ${companyProfile.gstin
        ? `<div>GSTIN: ${companyProfile.gstin}</div>`
        : ""
      }

            ${companyProfile.fssai
        ? `<div>FSSAI: ${companyProfile.fssai}</div>`
        : ""
      }

            <div class="invoice-title">
              ${payload.isProforma ? "PROFORMA BILL" : (companyProfile.invoiceTitle || "TAX INVOICE")}
            </div>
          </div>

          <!-- DATE / INVOICE -->

          <div class="row mt">
            <div>Date: ${billedAt.toLocaleDateString()}</div>
            ${!payload.isProforma && payload.invoiceNumber ? `<div>Invoice No: ${payload.invoiceNumber}</div>` : ''}
          </div>
          
          <div class="row">
            <div>Time: ${billedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
          </div>

          <div class="row">
            <div>Customer Name: ${customerName || "Walk-in"}</div>
          </div>

          <div class="line"></div>

          <!-- MODE -->

          <div class="row">
            <div>${table ? "Dine In" : "Parcel"}</div>
            ${table ? `<div>Table No: ${table.name}</div>` : ''}
          </div>

          <div class="line"></div>

          <!-- ORDER -->

          <div class="row">
            <div>Order No: ${payload.orderNumber}</div>
            <div>${totalItem} Items (${totalQty} Qty)</div>
          </div>

          <div class="row">
            <div>Cashier: ${cashierName}</div>
          </div>

          <div class="line"></div>

          <!-- TABLE HEADER -->

          <div class="table-row table-head">
            <div>Item</div>
            <div style="text-align:center;">Qty</div>
            <div style="text-align:right;">Rate</div>
            <div style="text-align:right;">GST</div>
            <div style="text-align:right;">Amount</div>
          </div>

          <div class="line"></div>

          <!-- ITEMS -->

          ${cart
        .map((item) => {
          const amount = item.price * item.quantity;
          const basePrice = amount / (1 + item.gstRate / 100);
          const gstAmount = amount - basePrice;

          return `
                <div class="table-row">
                  <div>${item.name}</div>

                  <div style="text-align:center;">
                    ${item.quantity}
                  </div>

                  <div style="text-align:right;">
                    ${item.price.toFixed(2)}
                  </div>

                  <div style="text-align:right;">
                    ${gstAmount.toFixed(2)}
                  </div>

                  <div style="text-align:right;">
                    ${amount.toFixed(2)}
                  </div>
                </div>
              `;
        })
        .join("")}

          <!-- TOTALS -->

          <div class="totals">

            <div class="row">
              <div>Subtotal</div>
              <div>${subtotal.toFixed(2)}</div>
            </div>

            <div class="row">
              <div>CGST</div>
              <div>${cgst.toFixed(2)}</div>
            </div>

            <div class="row">
              <div>SGST</div>
              <div>${sgst.toFixed(2)}</div>
            </div>

            <div class="row">
              <div>Discount</div>
              <div>${discount.toFixed(2)}</div>
            </div>

            <div class="row grand">
              <div>Grand Total</div>
              <div>${payload.totalAmount.toFixed(2)}</div>
            </div>

          </div>

          <!-- FOOTER -->

          <div class="footer">
            Thank you. Please visit again.
          </div>

        </div>

        <script>
          window.onload = () => {
            window.print();

            window.onafterprint = () => {
              window.close();
            };
          };
        </script>

      </body>
    </html>
  `;

    printWindow.document.open();
    printWindow.document.write(thermalHtml);
    printWindow.document.close();
  }

  async function handlePrintBill() {
    if (cart.length === 0) {
      setStatusMessage("Add items before printing bill.");
      return;
    }

    setSaving(true);
    setStatusMessage("");

    try {
      // Save order first
      const saveRes = await fetch("/api/pos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder?.id,
          diningMode: table ? "DINE_IN" : "PARCEL",
          tableName: table?.name,
          customerName,
          notes,
          discount,
          items: cart.map((item) => ({
            id: item.id,
            price: item.price,
            gstRate: item.gstRate,
            quantity: item.quantity,
          })),
        }),
      });

      const payload = await saveRes.json();
      if (!saveRes.ok) throw new Error(payload.error || "Failed to save order");

      if (table) {
        const updatedOrder = {
          id: payload.orderId,
          orderNumber: payload.orderNumber,
          diningMode: "DINE_IN",
          totalAmount: grandTotal,
          items: cart.map(c => ({ 
            id: c.id,
            menuItemId: c.id, 
            name: c.name,
            price: c.price,
            quantity: c.quantity,
            gstRate: c.gstRate
          }))
        };

        const currentOrders = table.activeOrders || [];
        const isExisting = currentOrders.some((o: any) => o.id === payload.orderId);
        const newActiveOrders = isExisting 
          ? currentOrders.map((o: any) => o.id === payload.orderId ? updatedOrder : o)
          : [...currentOrders, updatedOrder];

        onUpdateTable(table.id, newActiveOrders, "OCCUPIED");
      }

      openThermalPrint({
        billedAt: new Date().toISOString(),
        orderNumber: payload.orderNumber,
        totalAmount: grandTotal,
        isProforma: true,
      });

    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      setStatusMessage("Add items before checking out.");
      return;
    }

    setCheckingOut(true);
    setStatusMessage("");

    try {
      // Always save the latest cart state before checking out
      const saveRes = await fetch("/api/pos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder?.id,
          diningMode: table ? "DINE_IN" : "PARCEL",
          tableName: table?.name,
          customerName,
          notes,
          discount,
          items: cart.map((item) => ({
            id: item.id,
            price: item.price,
            gstRate: item.gstRate,
            quantity: item.quantity,
          })),
        }),
      });
      const savePayload = await saveRes.json();
      if (!saveRes.ok) throw new Error(savePayload.error || "Failed to sync order before checkout");
      
      const orderIdToCheckout = savePayload.orderId;

      // Now checkout
      const response = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderIdToCheckout,
          paymentMethod,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to checkout");

      openThermalPrint({
        billedAt: payload.billedAt,
        invoiceNumber: payload.invoiceNumber,
        orderNumber: payload.orderNumber,
        totalAmount: payload.totalAmount,
      });

      if (table) {
        const currentOrders = table.activeOrders || [];
        const newActiveOrders = currentOrders.filter((o: any) => o.id !== orderIdToCheckout);
        const newStatus = newActiveOrders.length === 0 ? "AVAILABLE" : "OCCUPIED";
        onUpdateTable(table.id, newActiveOrders, newStatus);
      } else {
        // Remove checked out parcel order
        onUpdateTable("", [], "", { id: orderIdToCheckout }, true);
      }
      onClose();
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-7xl flex-col rounded-3xl bg-[#fcf9f5] shadow-2xl overflow-hidden">
        <header className="flex items-center justify-between border-b border-line bg-white px-4 py-3">
          <h2 className="text-xl font-bold">
            {table ? `Table ${table.name}` : "Parcel Order"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted/10">
            <span className="text-xl leading-none">✕</span>
          </button>
        </header>

        <main className="flex-1 overflow-hidden p-3 md:p-4">
          <div className="grid gap-3 xl:grid-cols-[1.5fr_0.9fr] h-full overflow-hidden">
            {/* Left side: Menu items */}
            <div className="flex flex-col gap-3 overflow-hidden">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-accent shadow-sm"
              />
              <div className="rounded-[1.25rem] border border-line bg-white/78 p-3">
                <p className="text-xs font-semibold">Categories</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedCategory === "all" ? "bg-accent text-white" : "bg-[#fff4e9]"
                      }`}
                    onClick={() => setSelectedCategory("all")}
                  >
                    All items
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedCategory === category.id ? "bg-accent text-white" : "bg-[#fff4e9]"
                        }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredItems.map((item) => (
                    <article key={item.id} className="rounded-[1.25rem] border border-line bg-white/80 p-3 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between" onClick={() => addItem(item)}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold leading-tight">{item.name}</p>
                          <p className="mt-1 text-[10px] text-muted line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm font-bold text-accent">Rs {item.price}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Cart */}
            <div className="flex flex-col rounded-[1.5rem] border border-line bg-white p-4 shadow-sm overflow-hidden">
              <h3 className="text-lg font-semibold mb-3 shrink-0">Current Order</h3>

              <div className="flex-1 overflow-y-auto pr-2 pb-2">
                <div className="space-y-2 mb-4">
                  {cart.length === 0 ? (
                    <div className="flex items-center justify-center text-muted text-xs py-8">
                      No items added yet
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="rounded-xl border border-line bg-gray-50/50 p-2.5">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="line-clamp-1 pr-2">{item.name}</span>
                          <span className="shrink-0">Rs {(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button onClick={() => updateQty(item.id, -1)} className="rounded-full bg-white border shadow-sm px-2.5 py-0.5 text-xs">-</button>
                          <span className="w-4 text-center text-xs">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="rounded-full bg-white border shadow-sm px-2.5 py-0.5 text-xs">+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-line pt-3 space-y-2.5 mb-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Subtotal</span>
                    <span>Rs {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Tax</span>
                    <span>Rs {tax.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold whitespace-nowrap text-muted">Discount Rs</label>
                    <input
                      type="number"
                      className="w-20 rounded-lg border border-line bg-gray-50 px-2 py-1 text-right text-xs outline-none focus:border-accent transition"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold whitespace-nowrap text-muted">Payment</label>
                    <select
                      className="rounded-lg border border-line bg-gray-50 px-2 py-1 text-xs outline-none focus:border-accent transition"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-line pt-3 mt-auto shrink-0">
                <div className="flex justify-between text-base font-bold">
                  <span>Grand Total</span>
                  <span className="text-accent">Rs {grandTotal.toFixed(2)}</span>
                </div>

                {statusMessage && <div className="text-xs text-red-500 font-semibold mt-1.5">{statusMessage}</div>}

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || checkingOut}
                    className="rounded-xl border border-line bg-white py-2.5 text-xs font-semibold text-foreground hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Order"}
                  </button>
                  <button
                    onClick={handlePrintBill}
                    disabled={saving || checkingOut}
                    className="rounded-xl border border-line bg-white py-2.5 text-xs font-semibold text-foreground hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Print Bill
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={saving || checkingOut}
                    className="rounded-xl bg-accent py-2.5 text-xs font-semibold text-white hover:bg-accent/90 transition disabled:opacity-50"
                  >
                    {checkingOut ? "Processing..." : "Checkout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
