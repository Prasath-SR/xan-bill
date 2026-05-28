"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ staffId, password }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Login failed");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Staff ID</span>
        <input
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
          onChange={(event) => setStaffId(event.target.value)}
          placeholder="Enter staff code"
          value={staffId}
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Password</span>
        <input
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          type="password"
          value={password}
        />
      </label>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        className="w-full rounded-2xl bg-[#1c120d] px-4 py-3 font-semibold text-white transition hover:bg-[#341d14] disabled:opacity-70"
        disabled={loading}
        type="submit"
      >
        {loading ? "Signing in..." : "Continue to dashboard"}
      </button>
    </form>
  );
}
