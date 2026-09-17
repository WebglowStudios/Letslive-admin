"use client";

import { useState, useRef, useMemo } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  staffList: StaffMember[];
}

interface ParsedLead {
  externalLeadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  destination: string;
  platform: string;
  source: string;
  channel: string;
  campaign_name: string;
  ad_name: string;
  form_name: string;
  state: string;
  lead_status: string;
  created_time?: string;
  isTestLead: boolean;
  raw: Record<string, string>;
}

// Robust CSV parser supporting quotes, commas within quotes, and CRLF
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[][] = [];
  let row: string[] = [];
  let currentVal = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote
          currentVal += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(currentVal.trim());
        currentVal = "";
      } else if (char === "\r") {
        if (nextChar === "\n") {
          i++;
        }
        row.push(currentVal.trim());
        if (row.some((cell) => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        currentVal = "";
      } else if (char === "\n") {
        row.push(currentVal.trim());
        if (row.some((cell) => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal.length > 0 || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = lines[0].map((h) => h.trim());
  const rows = lines.slice(1);
  return { headers: rawHeaders, rows };
}

// Clean and capitalize slug/destination names
function formatDestination(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim();
  if (cleaned.toLowerCase() === "not_decided_yet" || cleaned.toLowerCase() === "not decided yet") {
    return "Not Decided Yet";
  }
  if (cleaned.includes("<test lead")) return "";
  return cleaned
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function ImportLeadsModal({ onClose, onSuccess, staffList }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [isMetaFormat, setIsMetaFormat] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [defaultChannel, setDefaultChannel] = useState("auto");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [skipTestLeads, setSkipTestLeads] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    imported: number;
    duplicatesSkipped: number;
    testLeadsSkipped: number;
    errors: { row: number; reason: string }[];
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setParseError("Please select a valid CSV file (.csv)");
      return;
    }
    setFile(selectedFile);
    setParseError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        processCSVContent(text);
      } catch (err: any) {
        setParseError("Failed to parse CSV: " + (err.message || "Unknown error"));
      }
    };
    reader.readAsText(selectedFile);
  };

  const processCSVContent = (content: string) => {
    const { headers, rows } = parseCSV(content);

    if (headers.length === 0 || rows.length === 0) {
      setParseError("The CSV file is empty or missing data rows.");
      return;
    }

    // Identify header positions
    const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[\s_-]+/g, "_"));

    // Find column index helper
    const findCol = (...candidates: string[]): number => {
      for (const cand of candidates) {
        const idx = lowerHeaders.findIndex((h) => h === cand || h.includes(cand));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const idIdx = findCol("id", "lead_id", "leadid", "external_id");
    const nameIdx = findCol("full_name", "name", "client_name", "customer_name");
    const firstNameIdx = findCol("first_name", "firstname");
    const lastNameIdx = findCol("last_name", "lastname");
    const emailIdx = findCol("email", "email_address");
    const phoneIdx = findCol("phone_number", "phone", "mobile", "contact");
    const destIdx = findCol(
      "which_destination_are_you_interested_in",
      "destination",
      "destination_interested",
      "package",
      "place"
    );
    const platformIdx = findCol("platform", "source", "channel");
    const campaignIdx = findCol("campaign_name", "campaign");
    const adIdx = findCol("ad_name", "ad");
    const formIdx = findCol("form_name", "form");
    const stateIdx = findCol("state", "city", "location");
    const leadStatusIdx = findCol("lead_status", "status");
    const createdTimeIdx = findCol("created_time", "created_at", "date");

    // Check if looks like Meta Lead Ads
    const looksLikeMeta =
      headers.some((h) => h.includes("which_destination") || h.includes("ad_id") || h.includes("campaign_id")) ||
      rows.some((r) => (phoneIdx !== -1 ? r[phoneIdx]?.startsWith("p:") : false));

    setIsMetaFormat(looksLikeMeta);

    const leads: ParsedLead[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || row.every((c) => !c.trim())) continue;

      const rawExternalId = idIdx !== -1 ? (row[idIdx] || "").trim() : "";

      // Phone
      let rawPhone = phoneIdx !== -1 ? (row[phoneIdx] || "").trim() : "";
      if (rawPhone.startsWith("p:")) {
        rawPhone = rawPhone.substring(2).trim();
      }

      // Name
      let firstName = firstNameIdx !== -1 ? (row[firstNameIdx] || "").trim() : "";
      let lastName = lastNameIdx !== -1 ? (row[lastNameIdx] || "").trim() : "";
      if (!firstName && nameIdx !== -1) {
        const fullName = (row[nameIdx] || "").trim();
        const parts = fullName.split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }

      const email = emailIdx !== -1 ? (row[emailIdx] || "").trim().toLowerCase() : "";
      const rawDest = destIdx !== -1 ? (row[destIdx] || "").trim() : "";
      const destination = formatDestination(rawDest);

      const rawPlatform = platformIdx !== -1 ? (row[platformIdx] || "").trim().toLowerCase() : "";
      let platform = "instagram";
      if (rawPlatform === "fb" || rawPlatform.includes("facebook")) {
        platform = "facebook";
      } else if (rawPlatform === "ig" || rawPlatform.includes("instagram")) {
        platform = "instagram";
      } else if (rawPlatform) {
        platform = rawPlatform;
      }

      const campaign_name = campaignIdx !== -1 ? (row[campaignIdx] || "").trim() : "";
      const ad_name = adIdx !== -1 ? (row[adIdx] || "").trim() : "";
      const form_name = formIdx !== -1 ? (row[formIdx] || "").trim() : "";
      const state = stateIdx !== -1 ? (row[stateIdx] || "").trim() : "";
      const lead_status = leadStatusIdx !== -1 ? (row[leadStatusIdx] || "").trim() : "";
      const created_time = createdTimeIdx !== -1 ? (row[createdTimeIdx] || "").trim() : undefined;

      // Check if dummy / test lead
      const isTestLead =
        lead_status.toLowerCase() === "test" ||
        email === "test@meta.com" ||
        firstName.includes("<test lead") ||
        rawPhone.includes("<test lead") ||
        rawDest.includes("<test lead") ||
        state.includes("<test lead");

      // Build raw map
      const rawMap: Record<string, string> = {};
      headers.forEach((h, hIdx) => {
        rawMap[h] = row[hIdx] || "";
      });

      leads.push({
        externalLeadId: rawExternalId,
        firstName,
        lastName,
        email,
        phone: rawPhone,
        destination,
        platform,
        source: platform,
        channel: platform,
        campaign_name,
        ad_name,
        form_name,
        state,
        lead_status,
        created_time,
        isTestLead,
        raw: rawMap,
      });
    }

    setParsedLeads(leads);
  };

  // Preview filtering stats
  const activeLeadsCount = useMemo(() => {
    return parsedLeads.filter((l) => (skipTestLeads ? !l.isTestLead : true)).length;
  }, [parsedLeads, skipTestLeads]);

  const testLeadsCount = useMemo(() => {
    return parsedLeads.filter((l) => l.isTestLead).length;
  }, [parsedLeads]);

  const handleImport = async () => {
    if (parsedLeads.length === 0) return;
    setLoading(true);
    setParseError(null);

    try {
      const payloadLeads = parsedLeads.map((l) => ({
        externalLeadId: l.externalLeadId,
        firstName: l.firstName,
        lastName: l.lastName,
        email: l.email,
        phone: l.phone,
        destination: l.destination,
        source: defaultChannel !== "auto" ? defaultChannel : l.source,
        channel: defaultChannel !== "auto" ? defaultChannel : l.channel,
        platform: l.platform,
        campaign_name: l.campaign_name,
        ad_name: l.ad_name,
        form_name: l.form_name,
        state: l.state,
        lead_status: l.lead_status,
        created_time: l.created_time,
        isTestLead: l.isTestLead,
      }));

      const res = await api.post("/enquiries/import", {
        leads: payloadLeads,
        defaultAssignedTo: assignedTo || undefined,
        defaultChannel: defaultChannel !== "auto" ? defaultChannel : undefined,
        defaultSource: defaultChannel !== "auto" ? defaultChannel : undefined,
        skipDuplicates,
        skipTestLeads,
      });

      if (res?.data) {
        setResult(res.data);
      }
    } catch (err: any) {
      setParseError(err?.message || "Failed to import leads. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Import Leads from CSV</h2>
              <p className="text-xs text-slate-500">
                Upload lead exports from Meta Ads (Instagram/Facebook), Google Ads, or spreadsheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Result view */}
          {result ? (
            <div className="py-6 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">CSV Import Complete</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The lead database has been updated with the imported records.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-xs text-slate-500 font-medium">Total Rows</div>
                  <div className="text-xl font-bold text-slate-800 mt-0.5">{result.total}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="text-xs text-emerald-700 font-medium">Imported</div>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">{result.imported}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="text-xs text-amber-700 font-medium">Duplicates Skipped</div>
                  <div className="text-xl font-bold text-amber-700 mt-0.5">{result.duplicatesSkipped}</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="text-xs text-blue-700 font-medium">Test Leads Skipped</div>
                  <div className="text-xl font-bold text-blue-700 mt-0.5">{result.testLeadsSkipped}</div>
                </div>
              </div>

              {result.duplicatesSkipped > 0 && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-50 py-2 px-4 rounded-lg max-w-lg mx-auto">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>
                    Existing IDs / contacts were safely skipped. No duplicate enquiries were created.
                  </span>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="text-left bg-rose-50 border border-rose-200 rounded-xl p-4 max-w-xl mx-auto">
                  <div className="text-xs font-semibold text-rose-800 mb-2 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {result.errors.length} Row(s) could not be processed:
                  </div>
                  <ul className="text-xs text-rose-700 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>
                        • Row {err.row}: {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 shadow-sm inline-flex items-center gap-2"
                >
                  View Enquiries List <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* File Dropzone */}
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-cyan-500 hover:bg-cyan-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                    }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                    <Upload size={28} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Click to browse or drag and drop your CSV file here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports Meta Lead Ads export (.csv), Instagram/Facebook Ads, Google Ads, or standard CRM leads
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    <ShieldCheck size={13} className="text-cyan-600" /> Duplicate lead IDs are automatically detected & skipped
                  </div>
                </div>
              ) : (
                /* File Selected Header Card */
                <div className="flex items-center justify-between p-3.5 bg-cyan-50/60 border border-cyan-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        {file.name}
                        {isMetaFormat && (
                          <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                            Meta Lead Ads Detected
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {parsedLeads.length} leads detected ({activeLeadsCount} ready to import
                        {skipTestLeads && testLeadsCount > 0 ? `, ${testLeadsCount} test leads skipped` : ""})
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setParsedLeads([]);
                      setParseError(null);
                    }}
                    className="text-xs font-medium text-slate-600 hover:text-rose-600 px-2.5 py-1 hover:bg-white rounded-lg transition-colors"
                  >
                    Change File
                  </button>
                </div>
              )}

              {parseError && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Configuration Settings */}
              {parsedLeads.length > 0 && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Assign leads to staff (optional)
                      </label>
                      <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">Unassigned — admin will assign later</option>
                        {staffList.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.firstName} {s.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Default Channel / Source
                      </label>
                      <select
                        value={defaultChannel}
                        onChange={(e) => setDefaultChannel(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="auto">Auto-detect from CSV (Instagram / Facebook)</option>
                        <option value="instagram">Instagram</option>
                        <option value="facebook">Facebook</option>
                        <option value="google">Google</option>
                        <option value="website">Website</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="phone">Phone</option>
                        <option value="referral">Referral</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Checkbox Options */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800">
                          Skip duplicate lead IDs & contacts (Recommended)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Prevents re-uploading duplicate inquiries if the same CSV or cumulative export is uploaded repeatedly.
                        </div>
                      </div>
                    </label>

                    {testLeadsCount > 0 && (
                      <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1 border-t border-slate-200/60">
                        <input
                          type="checkbox"
                          checked={skipTestLeads}
                          onChange={(e) => setSkipTestLeads(e.target.checked)}
                          className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800">
                            Skip Meta dummy test leads ({testLeadsCount} detected)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Filters out rows with `&lt;test lead: dummy data...&gt;` generated by Facebook Lead testing tools.
                          </div>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Data Preview Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Preview (First 5 Rows)</span>
                      <span className="text-[11px] text-slate-400">Showing 5 of {parsedLeads.length} rows</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Lead ID</th>
                            <th className="py-2 px-3 font-semibold">Name</th>
                            <th className="py-2 px-3 font-semibold">Phone</th>
                            <th className="py-2 px-3 font-semibold">Email</th>
                            <th className="py-2 px-3 font-semibold">Destination</th>
                            <th className="py-2 px-3 font-semibold">Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedLeads.slice(0, 5).map((l, idx) => (
                            <tr
                              key={idx}
                              className={
                                l.isTestLead && skipTestLeads
                                  ? "bg-slate-50/70 text-slate-400 line-through"
                                  : "hover:bg-slate-50/50"
                              }
                            >
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                                {l.externalLeadId || "—"}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-800">
                                {l.firstName} {l.lastName}
                                {l.isTestLead && (
                                  <span className="ml-1.5 text-[9px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded no-underline">
                                    Test
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-600">{l.phone || "—"}</td>
                              <td className="py-2 px-3 text-slate-600 truncate max-w-[130px]">{l.email || "—"}</td>
                              <td className="py-2 px-3 text-slate-700 font-medium">
                                {l.destination || "Not specified"}
                              </td>
                              <td className="py-2 px-3 text-slate-600 capitalize">
                                {l.platform || "Instagram"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!result && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading || parsedLeads.length === 0}
              className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Importing Leads...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Import {activeLeadsCount} Lead{activeLeadsCount !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
