import { AppShell } from "@/components/app-shell";
import { StaffView } from "@/components/staff-view";
import { getStaffPageData } from "@/lib/server-data";
import { getSessionUser } from "@/lib/auth";

export default async function StaffRoute() {
  const staff = await getStaffPageData();
  const sessionUser = await getSessionUser();
  const isAdmin = sessionUser?.role === "ADMIN";

  return (
    <AppShell title="Users and staff">
      <StaffView staff={staff} isAdmin={isAdmin} currentUserId={sessionUser?.id || ""} />
    </AppShell>
  );
}
