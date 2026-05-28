"use client";

import { FormEvent, useState } from "react";
import { CompanyProfile } from "@/lib/types";

type CompanyProfileFormProps = {
  profile: CompanyProfile;
};

export function CompanyProfileForm({ profile }: CompanyProfileFormProps) {
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/company-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as CompanyProfile & { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to save company profile.");
      setSaving(false);
      return;
    }

    setForm(payload);
    setMessage("Company profile saved. New printouts will use these details.");
    setSaving(false);
  }

  return (
    <form className="glass-card rounded-[1.5rem] border p-4" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Print profile</p>
          <h3 className="mt-1 text-xl font-semibold">Company and invoice details</h3>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field
          label="Company name"
          value={form.companyName}
          onChange={(value) => setForm((current) => ({ ...current, companyName: value }))}
        />
        <Field
          label="Invoice title"
          value={form.invoiceTitle}
          onChange={(value) => setForm((current) => ({ ...current, invoiceTitle: value }))}
        />
        <TextField
          label="Address"
          value={form.address}
          onChange={(value) => setForm((current) => ({ ...current, address: value }))}
        />
        <Field
          label="GSTIN"
          value={form.gstin}
          onChange={(value) => setForm((current) => ({ ...current, gstin: value }))}
        />
        <Field
          label="FSSAI"
          value={form.fssai}
          onChange={(value) => setForm((current) => ({ ...current, fssai: value }))}
        />
        <Field
          label="Phone"
          value={form.phone}
          onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
        />
        <Field
          label="Email"
          value={form.email}
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
        />
        <Field
          label="Logo URL"
          value={form.logoUrl}
          onChange={(value) => setForm((current) => ({ ...current, logoUrl: value }))}
        />
      </div>

      {message ? (
        <div className="mt-3 rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted">
          {message}
        </div>
      ) : null}

      <button
        className="mt-4 rounded-xl bg-[#1c120d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        disabled={saving}
        type="submit"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}

function Field({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium">{label}</span>
      <input
        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-1 block text-xs font-medium">{label}</span>
      <textarea
        className="min-h-20 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
