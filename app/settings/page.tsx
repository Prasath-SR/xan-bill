import { AppShell } from "@/components/app-shell";
import { CompanyProfileForm } from "@/components/company-profile-form";
import { getCompanyProfile } from "@/lib/server-data";

export default async function SettingsRoute() {
  const profile = await getCompanyProfile();

  return (
    <AppShell title="Settings">
      <CompanyProfileForm profile={profile} />
    </AppShell>
  );
}
