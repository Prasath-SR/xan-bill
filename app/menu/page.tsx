import { AppShell } from "@/components/app-shell";
import { MenuManagement } from "@/components/menu-management";
import { getMenuPageData } from "@/lib/server-data";

export default async function MenuRoute() {
  const { categories, items } = await getMenuPageData();

  return (
    <AppShell title="Menu and item management">
      <MenuManagement categories={categories} items={items} />
    </AppShell>
  );
}
