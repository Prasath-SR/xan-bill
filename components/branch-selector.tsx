"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Branch = {
  id: string;
  name: string;
  code: string;
};

export function BranchSelector() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // We fetch the current session to check role and active branch
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (session?.role === "ADMIN") {
          setIsAdmin(true);
          setActiveBranchId(session.branchId || "");
          // Fetch branches
          fetch("/api/branches")
            .then((r) => r.json())
            .then((data) => {
              setBranches(data);
              // If admin has no active branch yet but branches exist, we might default it
              if (!session.branchId && data.length > 0) {
                switchBranch(data[0].id);
              }
            });
        }
      });
  }, []);

  const switchBranch = async (branchId: string) => {
    setActiveBranchId(branchId);
    await fetch("/api/auth/branch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId }),
    });
    // Refresh the page to load data for the new branch
    window.location.reload();
  };

  if (!isAdmin || branches.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mr-4">
      <span className="text-xs font-semibold text-muted uppercase tracking-widest hidden md:inline-block">Branch:</span>
      <select
        className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
        value={activeBranchId}
        onChange={(e) => switchBranch(e.target.value)}
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
