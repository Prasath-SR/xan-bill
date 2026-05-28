"use client";

import { DashboardData, ReportCard, ItemSalesData } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";

type ReportsViewProps = {
  dashboard: DashboardData;
  reports: ReportCard[];
  itemSales: ItemSalesData[];
  periodLabel: string;
};

export function ReportsView({ dashboard, reports, itemSales, periodLabel }: ReportsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [period, setPeriod] = useState(searchParams.get("period") || "monthly");
  const [startDate, setStartDate] = useState(searchParams.get("start") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    if (period === "custom") {
      params.set("start", startDate);
      params.set("end", endDate);
    } else {
      params.delete("start");
      params.delete("end");
    }
    router.push(`/reports?${params.toString()}`);
  };

  const mostSellingItem = itemSales.length > 0 ? itemSales[0] : null;
  const leastSellingItem = itemSales.length > 0 ? itemSales[itemSales.length - 1] : null;

  return (
    <div className="space-y-3">
      <div className="glass-card flex items-center justify-between rounded-[1.25rem] border p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Filter By Date</p>
          <h3 className="mt-1 text-xl font-semibold">Select Period</h3>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold outline-none"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>
          {period === "custom" && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold outline-none"
              />
              <span className="text-xs text-muted">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold outline-none"
              />
            </>
          )}
          <button 
            onClick={handleFilter}
            className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
          >
            Apply
          </button>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => (
          <article key={report.title} className="glass-card rounded-[1.25rem] border p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{report.period}</p>
            <p className="mt-2 text-xl font-semibold">{report.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{report.description}</p>
            <p className="mt-3 text-lg font-semibold">{report.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <article className="glass-card rounded-[1.5rem] border p-4 lg:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Item-Wise Sales ({periodLabel})</p>
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-accent/5 p-4 flex flex-col justify-between">
                <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Most Selling Item</p>
                {mostSellingItem ? (
                  <>
                    <p className="text-lg font-bold">{mostSellingItem.name}</p>
                    <p className="text-sm text-muted mt-1">{mostSellingItem.quantitySold} units sold (Rs {mostSellingItem.totalRevenue.toLocaleString()})</p>
                  </>
                ) : (
                  <p className="text-sm text-muted">No items sold</p>
                )}
              </div>
              <div className="rounded-xl border border-line bg-red-50 p-4 flex flex-col justify-between">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Least Selling Item</p>
                {leastSellingItem ? (
                  <>
                    <p className="text-lg font-bold text-red-950">{leastSellingItem.name}</p>
                    <p className="text-sm text-red-800 mt-1">{leastSellingItem.quantitySold} units sold (Rs {leastSellingItem.totalRevenue.toLocaleString()})</p>
                  </>
                ) : (
                  <p className="text-sm text-muted">No items sold</p>
                )}
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-line bg-white/80">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-gray-50/50">
                    <th className="px-4 py-3 font-semibold text-muted">Item Name</th>
                    <th className="px-4 py-3 font-semibold text-muted">Category</th>
                    <th className="px-4 py-3 font-semibold text-muted text-right">Qty Sold</th>
                    <th className="px-4 py-3 font-semibold text-muted text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {itemSales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted">No sales data for this period.</td>
                    </tr>
                  ) : (
                    itemSales.map((item) => (
                      <tr key={item.menuItemId} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-xs">{item.category}</td>
                        <td className="px-4 py-3 text-right font-semibold">{item.quantitySold}</td>
                        <td className="px-4 py-3 text-right">Rs {item.totalRevenue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <article className="glass-card flex flex-col gap-3 rounded-[1.5rem] border p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Operational highlights</p>
          <div className="mt-3 grid gap-2">
            {[
              `Top selling channel: ${dashboard.revenueChannels[0]?.label || 'N/A'}`,
              `Total orders: ${dashboard.salesSummary.totalOrders}`,
              `Average ticket time: ${dashboard.salesSummary.avgOrderTime} mins`,
            ].map((line) => (
              <div key={line} className="rounded-xl border border-line bg-white/80 p-3 text-xs font-medium">
                {line}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
