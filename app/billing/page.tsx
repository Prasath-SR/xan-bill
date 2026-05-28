import { PosGrid } from "@/components/pos-grid";
import { getCompanyProfile, getMenuPageData, getPosTablesData } from "@/lib/server-data";
import Link from "next/link";

import { getSessionUser } from "@/lib/auth";

export default async function BillingRoute() {
  const [{ categories, items }, posData, companyProfile, user] = await Promise.all([
    getMenuPageData(),
    getPosTablesData(),
    getCompanyProfile(),
    getSessionUser(),
  ]);

  return (
    <div className="flex h-screen flex-col bg-[#fcf9f5]">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <h1 className="font-serif text-2xl font-semibold">POS Dashboard</h1>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-muted/10 px-4 py-2 text-sm font-semibold hover:bg-muted/20"
        >
          ← Back to Dashboard
        </Link>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <PosGrid
          categories={categories}
          companyProfile={companyProfile}
          items={items}
          initialTables={posData.tables}
          initialParcelOrders={posData.parcelOrders}
          cashierName={user?.name || "Unknown"}
        />
      </main>
    </div>
  );
}
