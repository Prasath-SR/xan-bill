import { AppShell } from "@/components/app-shell";
import { DashboardPage } from "@/components/dashboard-page";
import { getDashboardData } from "@/lib/server-data";

export default async function DashboardRoute() {
  const data = await getDashboardData();

  return (
    <AppShell title="Restaurant command center">
      <DashboardPage data={data} />
    </AppShell>
  );
}
