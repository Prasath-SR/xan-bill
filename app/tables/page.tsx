import { AppShell } from "@/components/app-shell";
import { TablesView } from "@/components/tables-view";
import { getTablesPageData } from "@/lib/server-data";

export default async function TablesRoute() {
  const tables = await getTablesPageData();

  return (
    <AppShell title="Table management">
      <TablesView tables={tables} />
    </AppShell>
  );
}
