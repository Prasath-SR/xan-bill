import { DashboardData } from "@/lib/types";

type DashboardPageProps = {
  data: DashboardData;
};

export function DashboardPage({ data }: DashboardPageProps) {
  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Daily sales",
            value: `Rs ${data.salesSummary.dailyRevenue.toLocaleString()}`,
            note: `${data.salesSummary.weeklyGrowth}% above last week`,
          },
          {
            label: "Orders today",
            value: data.salesSummary.totalOrders.toString(),
            note: `${data.salesSummary.avgOrderTime} min average ticket time`,
          },


        ].map((card) => (
          <article key={card.label} className="glass-card stat-card rounded-[1.25rem] border p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            <p className="mt-1 max-w-[14rem] text-xs leading-5 text-muted">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-1">
        <article className="glass-card rounded-[1.5rem] border p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Quick actions
              </p>
              <h3 className="mt-1 text-xl font-semibold">Front desk shortcuts</h3>
            </div>
            <div className="pill pill-success text-[10px] px-2 py-0.5">Ready</div>
          </div>

          <div className="mt-4 grid gap-2">
            {data.shortcuts.map((shortcut) => (
              <div key={shortcut.title} className="rounded-xl border border-line bg-white/75 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{shortcut.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{shortcut.description}</p>
                  </div>
                  <span className="pill pill-neutral text-[10px] px-2 py-0.5">{shortcut.target}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-3 lg:grid-cols-1">

        <article className="glass-card rounded-[1.5rem] border p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Revenue mix</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {data.revenueChannels.map((channel) => (
              <div key={channel.label} className="rounded-xl bg-[#20150f] p-3 text-white">
                <p className="text-xs text-white/70">{channel.label}</p>
                <p className="mt-2 text-2xl font-semibold">Rs {channel.value.toLocaleString()}</p>
                <p className="mt-1 text-xs text-white/70">{channel.share}% of today&apos;s sales</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
