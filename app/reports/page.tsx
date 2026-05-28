import { AppShell } from "@/components/app-shell";
import { ReportsView } from "@/components/reports-view";
import { getReportsPageData } from "@/lib/server-data";

export default async function ReportsRoute({ searchParams }: { searchParams: Promise<{ period?: string, start?: string, end?: string }> }) {
  const { period, start, end } = await searchParams;
  const { reports, dashboard, itemSales, periodLabel } = await getReportsPageData(period, start, end);

  return (
    <AppShell title="Reports and analytics">
      <ReportsView 
        reports={reports} 
        dashboard={dashboard} 
        itemSales={itemSales} 
        periodLabel={periodLabel} 
      />
    </AppShell>
  );
}
