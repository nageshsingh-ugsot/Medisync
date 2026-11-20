"use client";

import { useState, type FormEvent } from "react";
import { signOutAction } from "@/app/auth-actions";
import {
  DemoEmptyState,
  DemoLoadingState,
  DemoModeNotice,
  DemoPageHeading,
} from "@/components/demo-workspace-ui";
import { useDemoWorkspace } from "@/lib/workspace-demo-context";
import type { DemoSettings } from "@/lib/workspace-demo";

export function SettingsDemoPage() {
  const { clearAllDemoData, data, pharmacyId, ready, updateData } = useDemoWorkspace();
  const [drafts, setDrafts] = useState<Record<string, Partial<DemoSettings>>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const form = data
    ? { ...data.settings, ...drafts[pharmacyId] }
    : null;

  if (!ready) return <DemoLoadingState />;

  if (!data || !form) {
    return (
      <section className="workspace-section-page demo-page">
        <DemoPageHeading
          title="Settings"
          description="Manage the pharmacy details used in sample receipts."
        />
        <DemoModeNotice />
        <DemoEmptyState
          description="Load browser-only settings to edit sample pharmacy details and default tax and reorder levels."
          title="No demo settings yet"
        />
      </section>
    );
  }

  function updateField<Key extends keyof DemoSettings>(
    key: Key,
    value: DemoSettings[Key],
  ) {
    setDrafts((current) => ({
      ...current,
      [pharmacyId]: { ...current[pharmacyId], [key]: value },
    }));
    setSaved(false);
    setError("");
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const settings = form;
    if (!settings) {
      setError("Load demo settings before saving.");
      return;
    }
    if (settings.taxPercent < 0 || settings.taxPercent > 100) {
      setError("Tax must be between 0 and 100 percent.");
      return;
    }
    if (
      !Number.isSafeInteger(settings.lowStockDefault) ||
      settings.lowStockDefault < 0
    ) {
      setError("The low-stock reorder level must be a non-negative whole number.");
      return;
    }
    updateData((current) => ({ ...current, settings }));
    setSaved(true);
    setError("");
  }

  function deleteDemoData() {
    if (
      window.confirm(
        "Delete all MediSync demo data saved in this browser? This cannot be undone.",
      )
    ) {
      setDrafts({});
      clearAllDemoData();
    }
  }

  return (
    <section className="workspace-section-page demo-page">
      <DemoPageHeading
        title="Settings"
        description="These sample preferences affect only demo receipts and reports."
      />
      <DemoModeNotice />
      <form className="panel demo-panel demo-settings-form" onSubmit={saveSettings}>
        <div className="panel-heading">
          <div><h3>Pharmacy details</h3><p>All business details are optional.</p></div>
        </div>
        <div className="demo-form-grid demo-settings-grid">
          <label className="demo-field">
            <span>Pharmacy name</span>
            <input onChange={(event) => updateField("pharmacyName", event.target.value)} value={form.pharmacyName} />
          </label>
          <label className="demo-field">
            <span>Owner name</span>
            <input onChange={(event) => updateField("ownerName", event.target.value)} value={form.ownerName} />
          </label>
          <label className="demo-field">
            <span>WhatsApp number</span>
            <input
              inputMode="tel"
              onChange={(event) => updateField("whatsapp", event.target.value)}
              placeholder="Optional"
              value={form.whatsapp}
            />
          </label>
          <label className="demo-field">
            <span>Area</span>
            <input onChange={(event) => updateField("area", event.target.value)} value={form.area} />
          </label>
          <label className="demo-field demo-field-wide">
            <span>Address</span>
            <textarea onChange={(event) => updateField("address", event.target.value)} rows={3} value={form.address} />
          </label>
          <label className="demo-field">
            <span>GST number</span>
            <input onChange={(event) => updateField("gstNumber", event.target.value)} placeholder="Optional" value={form.gstNumber} />
          </label>
        </div>
        <div className="demo-settings-defaults">
          <label className="demo-field">
            <span>Default tax (%)</span>
            <input
              max={100}
              min={0}
              onChange={(event) => updateField("taxPercent", Number(event.target.value))}
              step="0.01"
              type="number"
              value={form.taxPercent}
            />
          </label>
          <label className="demo-field">
            <span>Default low-stock reorder level</span>
            <input
              min={0}
              onChange={(event) => updateField("lowStockDefault", Number(event.target.value))}
              step={1}
              type="number"
              value={form.lowStockDefault}
            />
          </label>
        </div>
        {error && <p className="demo-inline-error" role="alert">{error}</p>}
        {saved && <p className="demo-success" role="status">Demo settings saved in this browser.</p>}
        <div className="demo-settings-actions">
          <button className="button button-primary" type="submit">Save demo settings</button>
        </div>
      </form>
      <section className="panel demo-panel demo-danger-zone">
        <div>
          <h3>Demo data</h3>
          <p>Delete sample sales, customers, stock adjustments and settings from this browser.</p>
        </div>
        <button className="button demo-delete-button" onClick={deleteDemoData} type="button">
          Delete all demo data
        </button>
      </section>
      <section className="panel demo-panel demo-signout">
        <div><h3>Account</h3><p>Sign out of your MediSync account.</p></div>
        <form action={signOutAction}>
          <button className="button button-secondary" type="submit">Sign out</button>
        </form>
      </section>
    </section>
  );
}
