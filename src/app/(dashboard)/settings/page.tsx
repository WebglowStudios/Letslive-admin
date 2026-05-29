"use client";

import { useState } from "react";
import { Settings, Mail, AlertTriangle, RefreshCw } from "lucide-react";
import RoleGuard from "@/components/guards/RoleGuard";

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  async function handleClearCache() {
    if (!confirm("Are you sure you want to clear the cache?")) return;
    setClearing(true);
    setClearSuccess(false);
    // Simulate cache clear
    setTimeout(() => {
      setClearing(false);
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    }, 1500);
  }

  return (
    <RoleGuard permission="settings.view">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500">Manage your application settings</p>
        </div>

        {/* Site Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Settings size={18} className="text-cyan-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Site Settings</h2>
              <p className="text-xs text-slate-400">General site configuration</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Site Name</label>
              <input
                type="text"
                value="LetsLive Tours"
                readOnly
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Email</label>
              <input
                type="email"
                value="info@letslivetours.com"
                readOnly
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input
                type="text"
                value="+91 98765 43210"
                readOnly
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Mail size={18} className="text-cyan-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Email Settings</h2>
              <p className="text-xs text-slate-400">SMTP configuration</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">SMTP Host</label>
                <input
                  type="text"
                  value="smtp.gmail.com"
                  readOnly
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">SMTP Port</label>
                <input
                  type="text"
                  value="587"
                  readOnly
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">From Email</label>
              <input
                type="email"
                value="noreply@letslivetours.com"
                readOnly
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
              <p className="text-xs text-slate-400">Irreversible actions</p>
            </div>
          </div>

          {clearSuccess && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              Cache cleared successfully!
            </div>
          )}

          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700">Clear Cache</p>
              <p className="text-xs text-slate-400">Remove all cached data and force refresh</p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={clearing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={14} className={clearing ? "animate-spin" : ""} />
              {clearing ? "Clearing..." : "Clear Cache"}
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
