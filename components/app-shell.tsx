"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import { BranchSelector } from "@/components/branch-selector";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/billing", label: "Billing / POS" },
  { href: "/menu", label: "Menu" },
  { href: "/tables", label: "Tables" },
  { href: "/staff", label: "Staff" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

type AppShellProps = {
  badge?: string;
  children: ReactNode;
  subtitle?: string;
  title: string;
};

export function AppShell({ children, title }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const desktopGrid = useMemo(
    () => ({ gridTemplateColumns: collapsed ? "72px minmax(0,1fr)" : "240px minmax(0,1fr)" }),
    [collapsed],
  );

  return (
    <div className="app-shell min-h-screen overflow-hidden">
      <div className="min-h-screen lg:grid" style={desktopGrid}>
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[240px] border-r border-line bg-[#fffaf5]/95 p-3 shadow-2xl backdrop-blur transition-transform duration-300 lg:static lg:w-auto lg:translate-x-0 lg:shadow-none ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } ${collapsed ? "lg:px-2" : "lg:px-3"}`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-2 rounded-[1rem] bg-[#1c120d] px-3 py-3 text-white">
              <div className={collapsed ? "lg:hidden" : ""}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Xan Bill</p>
              </div>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/8 text-xs font-bold"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setMobileOpen(false);
                    return;
                  }

                  setCollapsed((value) => !value);
                }}
                type="button"
              >
                {collapsed ? ">" : "<"}
              </button>
            </div>

            <nav className="mt-3 flex-1 space-y-1">
              {navigation.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    className={`flex items-center rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      collapsed ? "justify-center lg:px-0" : "justify-between"
                    } ${
                      active
                        ? "bg-white text-[#1c120d] shadow-sm"
                        : "bg-white/60 text-foreground hover:bg-white"
                    }`}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={item.label}
                  >
                    <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
                    <span className={collapsed ? "hidden" : "text-xs opacity-70"}>
                      {active ? "Live" : "Go"}
                    </span>
                    <span className={collapsed ? "hidden text-base lg:inline" : "hidden"}>
                      {item.label.charAt(0)}
                    </span>
                  </Link>
                );
              })}
            </nav>


          </div>
        </aside>

        {mobileOpen ? (
          <button
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
        ) : null}

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-[#fffaf2]/92 px-3 backdrop-blur md:px-5">
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white lg:hidden text-xs"
                onClick={() => setMobileOpen(true)}
                type="button"
              >
                =
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Xan Bill
                </p>
                <h2 className="font-serif text-xl leading-none md:text-2xl">{title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BranchSelector />
              <span className="pill pill-success hidden sm:inline-flex text-[10px] px-2 py-0.5">Realtime sync</span>
              <form action="/api/auth/logout" method="post">
                <button
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold"
                  type="submit"
                >
                  Logout
                </button>
              </form>
            </div>
          </header>

          <main className="min-w-0 p-3 md:p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
