"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Columns,
  Sparkles,
  Check,
  Eye,
  Sliders,
  AlertTriangle,
  RotateCcw,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  HelpCircle,
  FileText,
  BadgeAlert,
  Info,
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

export type TargetField =
  | "__ignore__"
  | "full_name"
  | "first_name"
  | "last_name"
  | "phone"
  | "email"
  | "destination"
  | "budget"
  | "travellerCount"
  | "travelDate"
  | "message"
  | "source"
  | "campaign_name"
  | "ad_name"
  | "form_name"
  | "state"
  | "externalLeadId"
  | "status"
  | "priority";

interface TargetFieldDef {
  key: TargetField;
  label: string;
  category: "Contact" | "Trip Requirements" | "Marketing & Source" | "CRM Fields";
  required?: boolean;
  hint: string;
}

const TARGET_FIELDS: TargetFieldDef[] = [
  // Contact
  { key: "phone", label: "Phone / Mobile Number *", category: "Contact", required: true, hint: "Primary phone/WhatsApp number for CRM contact" },
  { key: "full_name", label: "Full Name (First + Last)", category: "Contact", hint: "Automatically splits into first name and surname" },
  { key: "first_name", label: "First Name", category: "Contact", hint: "Given name" },
  { key: "last_name", label: "Last Name / Surname", category: "Contact", hint: "Family name" },
  { key: "email", label: "Email Address", category: "Contact", hint: "Customer email (fallback generated if missing)" },

  // Trip Requirements
  { key: "destination", label: "Destination / Package", category: "Trip Requirements", hint: "Destination or tour package interested in" },
  { key: "budget", label: "Budget (₹)", category: "Trip Requirements", hint: "Stated budget amount (numeric)" },
  { key: "travellerCount", label: "Pax / Travellers Count", category: "Trip Requirements", hint: "Number of guests / travellers" },
  { key: "travelDate", label: "Travel Date / Month", category: "Trip Requirements", hint: "Preferred departure date or travel month" },
  { key: "message", label: "Notes / Query / Requirements", category: "Trip Requirements", hint: "Customer remarks, queries, or custom notes" },

  // Marketing & Source
  { key: "source", label: "Platform / Source", category: "Marketing & Source", hint: "e.g. Instagram, Facebook, Google, Website" },
  { key: "campaign_name", label: "Campaign Name", category: "Marketing & Source", hint: "Marketing campaign or ad set name" },
  { key: "ad_name", label: "Ad Name", category: "Marketing & Source", hint: "Ad creative / ad headline name" },
  { key: "form_name", label: "Form Name", category: "Marketing & Source", hint: "Lead capture form title" },
  { key: "state", label: "City / State / Location", category: "Marketing & Source", hint: "Customer city, state, or location" },
  { key: "externalLeadId", label: "External Lead ID", category: "Marketing & Source", hint: "ID from Meta Lead Ads, Google Ads, or external CRM" },

  // CRM Fields
  { key: "status", label: "Lead Status", category: "CRM Fields", hint: "e.g. new, assigned, responded, converted" },
  { key: "priority", label: "Priority", category: "CRM Fields", hint: "low, medium, high, urgent" },
];

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

// Smart auto-detect mapping function based on header name synonyms
function autoDetectTargetField(header: string): TargetField {
  if (!header) return "__ignore__";
  const h = header.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

  if (h.includes("firstname") || h === "fname" || h === "givenname") return "first_name";
  if (h.includes("lastname") || h === "lname" || h === "surname") return "last_name";
  if (
    h === "name" ||
    h === "fullname" ||
    h.includes("fullname") ||
    h.includes("clientname") ||
    h.includes("customername") ||
    h.includes("leadname") ||
    h.includes("passengername") ||
    h.includes("contactname")
  ) {
    return "full_name";
  }

  if (
    h.includes("phone") ||
    h.includes("mobile") ||
    h.includes("contact") ||
    h.includes("whatsapp") ||
    h === "cell" ||
    h === "tel"
  ) {
    return "phone";
  }

  if (h.includes("email") || h === "mail" || h.includes("emailid")) {
    return "email";
  }

  if (
    h.includes("destination") ||
    h.includes("interestedin") ||
    h.includes("package") ||
    h.includes("place") ||
    h.includes("tour") ||
    h.includes("trip")
  ) {
    return "destination";
  }

  if (h.includes("budget") || h.includes("cost") || h.includes("price") || h.includes("budgetrange")) {
    return "budget";
  }

  if (
    h.includes("pax") ||
    h.includes("traveller") ||
    h.includes("traveler") ||
    h.includes("guest") ||
    h.includes("people") ||
    h.includes("adult") ||
    h.includes("groupsize")
  ) {
    return "travellerCount";
  }

  if (
    h.includes("traveldate") ||
    h.includes("departuredate") ||
    h.includes("startdate") ||
    h.includes("dateoftravel") ||
    h.includes("travelmonth") ||
    h.includes("dates")
  ) {
    return "travelDate";
  }

  if (
    h.includes("message") ||
    h.includes("note") ||
    h.includes("remark") ||
    h.includes("requirement") ||
    h.includes("comment") ||
    h.includes("query") ||
    h.includes("description")
  ) {
    return "message";
  }

  if (h === "source" || h === "platform" || h === "channel" || h.includes("leadsource")) {
    return "source";
  }

  if (h.includes("campaign") || h.includes("utmcampaign")) {
    return "campaign_name";
  }

  if (h.includes("adname") || h === "ad" || h.includes("utmcontent")) {
    return "ad_name";
  }

  if (h.includes("form") || h.includes("formname")) {
    return "form_name";
  }

  if (h.includes("state") || h.includes("city") || h.includes("location") || h.includes("region") || h.includes("address")) {
    return "state";
  }

  if (h === "id" || h === "leadid" || h.includes("leadid") || h.includes("externalid")) {
    return "externalLeadId";
  }

  if (h === "status" || h.includes("leadstatus")) {
    return "status";
  }

  if (h === "priority") {
    return "priority";
  }

  return "__ignore__";
}

export default function ImportLeadsModal({ onClose, onSuccess, staffList }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow steps: 1 = File Upload, 2 = Column Mapping & Defaults, 3 = Preview & Import
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [activeTab, setActiveTab] = useState<"mapping" | "defaults">("mapping");

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);

  // Column mapping: maps column header index to TargetField
  const [columnMapping, setColumnMapping] = useState<Record<number, TargetField>>({});

  // Default values & fallbacks ("Let the default be the default")
  const [defaultStatus, setDefaultStatus] = useState<string>("new");
  const [defaultChannel, setDefaultChannel] = useState<string>("excel_import");
  const [defaultSource, setDefaultSource] = useState<string>("other");
  const [defaultAssignedTo, setDefaultAssignedTo] = useState<string>("");
  const [defaultDestination, setDefaultDestination] = useState<string>("");
  const [defaultPriority, setDefaultPriority] = useState<string>("medium");
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [skipTestLeads, setSkipTestLeads] = useState<boolean>(true);

  // Import state
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    total: number;
    imported: number;
    duplicatesSkipped: number;
    testLeadsSkipped: number;
    errors: { row: number; reason: string }[];
  } | null>(null);

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    const ext = selectedFile.name.toLowerCase();
    if (!ext.endsWith(".csv") && !ext.endsWith(".xlsx") && !ext.endsWith(".xls")) {
      setParseError("Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array", cellDates: true });
        setWorkbook(wb);

        const sheetNames = wb.SheetNames || [];
        setSheets(sheetNames);

        if (sheetNames.length === 0) {
          setParseError("The uploaded file does not contain any sheets.");
          return;
        }

        const initialSheet = sheetNames[0];
        setSelectedSheet(initialSheet);
        parseWorksheet(wb, initialSheet);
      } catch (err: any) {
        setParseError("Failed to parse file: " + (err?.message || "Unknown error"));
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Parse a specific worksheet from the workbook
  const parseWorksheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      setParseError(`Sheet "${sheetName}" not found.`);
      return;
    }

    const json = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" });
    if (!json || json.length === 0) {
      setParseError("The selected sheet is empty.");
      return;
    }

    // Find header row: first row with at least 1 non-empty cell
    let headerRowIdx = 0;
    while (
      headerRowIdx < json.length &&
      (!Array.isArray(json[headerRowIdx]) || json[headerRowIdx].every((c) => !c?.toString().trim()))
    ) {
      headerRowIdx++;
    }

    if (headerRowIdx >= json.length) {
      setParseError("No valid header row found in the sheet.");
      return;
    }

    const detectedHeaders = (json[headerRowIdx] as any[]).map((c, i) =>
      c !== undefined && c !== null && c.toString().trim() !== ""
        ? c.toString().trim()
        : `Column ${i + 1}`
    );

    const dataRows = (json.slice(headerRowIdx + 1) as any[][])
      .filter((row) => row && row.some((c) => c !== undefined && c !== null && c.toString().trim() !== ""))
      .map((row) =>
        detectedHeaders.map((_, i) => (row[i] !== undefined && row[i] !== null ? row[i].toString().trim() : ""))
      );

    if (detectedHeaders.length === 0 || dataRows.length === 0) {
      setParseError("The sheet contains headers but no data rows.");
      return;
    }

    setHeaders(detectedHeaders);
    setRawRows(dataRows);

    // Initial Auto-Detection of columns
    const initialMapping: Record<number, TargetField> = {};
    const usedFields = new Set<TargetField>();

    detectedHeaders.forEach((hdr, idx) => {
      const detected = autoDetectTargetField(hdr);
      // Avoid duplicate 1-to-1 mappings except for ignore
      if (detected !== "__ignore__" && !usedFields.has(detected)) {
        initialMapping[idx] = detected;
        usedFields.add(detected);
      } else {
        initialMapping[idx] = "__ignore__";
      }
    });

    setColumnMapping(initialMapping);
    setStep(2); // Automatically advance to column mapping pop-up step!
  };

  // Switch sheet handler
  const handleSheetChange = (sheetName: string) => {
    if (!workbook) return;
    setSelectedSheet(sheetName);
    parseWorksheet(workbook, sheetName);
  };

  // Reset mappings to auto-detect
  const handleAutoMapReset = () => {
    const newMapping: Record<number, TargetField> = {};
    const usedFields = new Set<TargetField>();

    headers.forEach((hdr, idx) => {
      const detected = autoDetectTargetField(hdr);
      if (detected !== "__ignore__" && !usedFields.has(detected)) {
        newMapping[idx] = detected;
        usedFields.add(detected);
      } else {
        newMapping[idx] = "__ignore__";
      }
    });

    setColumnMapping(newMapping);
  };

  // Clear all mappings to ignore
  const handleClearAllMappings = () => {
    const cleared: Record<number, TargetField> = {};
    headers.forEach((_, idx) => {
      cleared[idx] = "__ignore__";
    });
    setColumnMapping(cleared);
  };

  // Update a single column's mapping
  const handleSetColumnField = (colIdx: number, targetField: TargetField) => {
    setColumnMapping((prev) => ({
      ...prev,
      [colIdx]: targetField,
    }));
  };

  // Transform raw rows into structured CRM lead objects based on mappings & defaults
  const parsedLeads = useMemo(() => {
    if (rawRows.length === 0 || headers.length === 0) return [];

    // Map each target field to its column index
    const fieldToColIndices: Partial<Record<TargetField, number[]>> = {};
    Object.entries(columnMapping).forEach(([colIdxStr, targetField]) => {
      if (targetField === "__ignore__") return;
      const colIdx = Number(colIdxStr);
      if (!fieldToColIndices[targetField]) fieldToColIndices[targetField] = [];
      fieldToColIndices[targetField]!.push(colIdx);
    });

    const getVal = (row: string[], field: TargetField): string => {
      const indices = fieldToColIndices[field];
      if (!indices || indices.length === 0) return "";
      for (const idx of indices) {
        const v = (row[idx] ?? "").toString().trim();
        if (v) return v;
      }
      return "";
    };

    return rawRows.map((row, rowIdx) => {
      // Phone
      let rawPhone = getVal(row, "phone");
      if (rawPhone.startsWith("p:")) rawPhone = rawPhone.substring(2).trim();
      const phoneDigits = rawPhone.replace(/\D/g, "").slice(-10);

      // Name
      let firstName = getVal(row, "first_name");
      let lastName = getVal(row, "last_name");
      if (!firstName && !lastName) {
        const fullName = getVal(row, "full_name");
        if (fullName) {
          const parts = fullName.split(/\s+/);
          firstName = parts[0] || "";
          lastName = parts.slice(1).join(" ") || "";
        }
      }

      // Email
      const email = getVal(row, "email").toLowerCase();

      // Destination
      const rawDest = getVal(row, "destination");
      const destination = rawDest
        ? formatDestination(rawDest)
        : defaultDestination
        ? formatDestination(defaultDestination)
        : "";

      // Budget
      const rawBudget = getVal(row, "budget").replace(/[^0-9.]/g, "");
      const budget = rawBudget && !isNaN(Number(rawBudget)) ? Number(rawBudget) : undefined;

      // Pax
      const rawPax = getVal(row, "travellerCount").replace(/[^0-9]/g, "");
      const travellerCount = rawPax && !isNaN(Number(rawPax)) ? Number(rawPax) : undefined;

      // Travel Date
      const travelDate = getVal(row, "travelDate");

      // Message / Notes
      const message = getVal(row, "message");

      // Source & Channel
      let rawSource = getVal(row, "source").toLowerCase();
      let source = defaultSource;
      let channel = defaultChannel;
      if (rawSource) {
        if (rawSource.includes("fb") || rawSource.includes("facebook")) {
          source = "facebook";
          channel = "facebook";
        } else if (rawSource.includes("ig") || rawSource.includes("instagram")) {
          source = "instagram";
          channel = "instagram";
        } else if (rawSource.includes("google")) {
          source = "google";
          channel = "google";
        } else if (rawSource.includes("website")) {
          source = "website";
          channel = "website";
        } else if (rawSource.includes("whatsapp")) {
          source = "whatsapp";
          channel = "whatsapp";
        } else {
          source = "other";
          channel = rawSource;
        }
      }

      // Status & Priority
      const rowStatus = getVal(row, "status").toLowerCase();
      const status = rowStatus || defaultStatus;

      const rowPriority = getVal(row, "priority").toLowerCase();
      const priority = rowPriority || defaultPriority;

      // Marketing fields
      const campaign_name = getVal(row, "campaign_name");
      const ad_name = getVal(row, "ad_name");
      const form_name = getVal(row, "form_name");
      const state = getVal(row, "state");
      const externalLeadId = getVal(row, "externalLeadId");

      // Test lead detection
      const isTestLead =
        status === "test" ||
        email.includes("test@meta.com") ||
        firstName.toLowerCase().includes("<test lead") ||
        rawPhone.toLowerCase().includes("<test lead") ||
        destination.toLowerCase().includes("<test lead") ||
        state.toLowerCase().includes("<test lead");

      // Basic validation
      const hasPhone = phoneDigits.length >= 6;
      const hasName = firstName.length > 0;
      const isValid = hasPhone || (hasName && email.includes("@"));

      return {
        rowIndex: rowIdx + 1,
        externalLeadId,
        firstName: firstName || (rawPhone ? `Lead ${phoneDigits.slice(-4)}` : "Valued Customer"),
        lastName,
        fullName: [firstName, lastName].filter(Boolean).join(" "),
        email,
        phone: rawPhone,
        phoneDigits,
        destination,
        budget,
        travellerCount,
        travelDate,
        message,
        source,
        channel,
        status,
        priority,
        campaign_name,
        ad_name,
        form_name,
        state,
        isTestLead,
        hasPhone,
        isValid,
      };
    });
  }, [
    rawRows,
    headers,
    columnMapping,
    defaultDestination,
    defaultSource,
    defaultChannel,
    defaultStatus,
    defaultPriority,
  ]);

  // Status mapping validation
  const isPhoneMapped = useMemo(() => {
    return Object.values(columnMapping).includes("phone");
  }, [columnMapping]);

  const isNameMapped = useMemo(() => {
    const vals = Object.values(columnMapping);
    return vals.includes("full_name") || vals.includes("first_name");
  }, [columnMapping]);

  const mappedColumnsCount = useMemo(() => {
    return Object.values(columnMapping).filter((v) => v !== "__ignore__").length;
  }, [columnMapping]);

  const activeLeadsCount = useMemo(() => {
    return parsedLeads.filter((l) => (skipTestLeads ? !l.isTestLead : true) && l.isValid).length;
  }, [parsedLeads, skipTestLeads]);

  const testLeadsCount = useMemo(() => {
    return parsedLeads.filter((l) => l.isTestLead).length;
  }, [parsedLeads]);

  const invalidLeadsCount = useMemo(() => {
    return parsedLeads.filter((l) => !l.isValid && (!l.isTestLead || !skipTestLeads)).length;
  }, [parsedLeads, skipTestLeads]);

  // Execute import
  const handleImport = async () => {
    if (parsedLeads.length === 0) return;
    setLoading(true);
    setParseError(null);

    try {
      const payloadLeads = parsedLeads.map((l) => ({
        externalLeadId: l.externalLeadId || undefined,
        firstName: l.firstName,
        lastName: l.lastName || undefined,
        email: l.email || undefined,
        phone: l.phone,
        destination: l.destination || undefined,
        budget: l.budget,
        travellerCount: l.travellerCount,
        travelDate: l.travelDate || undefined,
        notes: l.message || undefined,
        message: l.message || undefined,
        source: l.source,
        channel: l.channel,
        status: l.status,
        priority: l.priority,
        campaign_name: l.campaign_name || undefined,
        ad_name: l.ad_name || undefined,
        form_name: l.form_name || undefined,
        state: l.state || undefined,
        isTestLead: l.isTestLead,
      }));

      const res = await api.post("/enquiries/import", {
        leads: payloadLeads,
        defaultAssignedTo: defaultAssignedTo || undefined,
        defaultChannel,
        defaultSource,
        defaultStatus,
        defaultDestination: defaultDestination || undefined,
        skipDuplicates,
        skipTestLeads,
      });

      if (res?.data) {
        setResult(res.data);
      }
    } catch (err: any) {
      setParseError(err?.message || "Failed to import leads. Please verify your data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shadow-xs">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {result
                  ? "Import Complete"
                  : step === 1
                  ? "Upload Leads Sheet (Excel / CSV)"
                  : step === 2
                  ? "Map Columns & Default Values"
                  : "Preview & Confirm Import"}
              </h2>
              <p className="text-xs text-slate-500">
                {result
                  ? "Review results and view updated CRM pipeline"
                  : step === 1
                  ? "Supports .xlsx, .xls, and .csv files from Meta Ads, Google Ads, or custom spreadsheets"
                  : step === 2
                  ? "Match your sheet columns to CRM fields and specify default fallbacks"
                  : "Verify mapped data before inserting into the enquiries pipeline"}
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

        {/* Multi-step progress indicator */}
        {!result && (
          <div className="px-6 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              {/* Step 1 */}
              <button
                onClick={() => file && setStep(1)}
                disabled={!file}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  step === 1 ? "text-cyan-700 font-bold" : file ? "text-slate-600 hover:text-cyan-600" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 1
                      ? "bg-cyan-600 text-white font-bold"
                      : file
                      ? "bg-cyan-100 text-cyan-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {file && step > 1 ? <Check size={12} /> : "1"}
                </div>
                <span>1. Upload File</span>
              </button>

              <ArrowRight size={14} className="text-slate-300" />

              {/* Step 2 */}
              <button
                onClick={() => file && setStep(2)}
                disabled={!file}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  step === 2 ? "text-cyan-700 font-bold" : file && step > 2 ? "text-slate-600 hover:text-cyan-600" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 2
                      ? "bg-cyan-600 text-white font-bold"
                      : file && step > 2
                      ? "bg-cyan-100 text-cyan-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {file && step > 2 ? <Check size={12} /> : "2"}
                </div>
                <span>2. Column Mapping & Defaults</span>
              </button>

              <ArrowRight size={14} className="text-slate-300" />

              {/* Step 3 */}
              <button
                onClick={() => file && setStep(3)}
                disabled={!file}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  step === 3 ? "text-cyan-700 font-bold" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 3 ? "bg-cyan-600 text-white font-bold" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  3
                </div>
                <span>3. Live Preview & Import</span>
              </button>
            </div>

            {file && (
              <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                <FileSpreadsheet size={13} className="text-cyan-600" />
                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{file.name}</span>
                <span>({rawRows.length} rows)</span>
              </div>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Parse error alert */}
          {parseError && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle size={16} className="shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              RESULT VIEW
             ════════════════════════════════════════════════════════════════════════ */}
          {result ? (
            <div className="py-6 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Leads Import Completed!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The leads have been successfully mapped and added to the CRM pipeline.
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
                    Existing contacts & duplicate IDs were safely skipped to prevent repeated enquiries.
                  </span>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="text-left bg-rose-50 border border-rose-200 rounded-xl p-4 max-w-xl mx-auto">
                  <div className="text-xs font-semibold text-rose-800 mb-2 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {result.errors.length} Row(s) could not be imported:
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
                  className="px-6 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  View Enquiries List <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* ════════════════════════════════════════════════════════════════════════
                STEP 1: FILE UPLOAD
               ════════════════════════════════════════════════════════════════════════ */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-300 hover:border-cyan-500 hover:bg-cyan-50/20 rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                  }}
                />
                <div className="w-16 h-16 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-3 shadow-xs">
                  <Upload size={32} />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or drag and drop your Excel or CSV sheet
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) exports from Meta Ads (Instagram/Facebook), Google Ads, or custom CRM sheets.
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Sparkles size={13} className="text-cyan-600" /> Interactive Column Mapping
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-600" /> Duplicate Safe
                  </span>
                </div>
              </div>

              {/* Tips banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Info size={14} className="text-cyan-600" /> How the Column Mapping pop-up works:
                </div>
                <p className="text-slate-500 leading-relaxed">
                  No need to reformat your Excel sheet! In the next step, you can manually map any column name from your sheet (e.g. &ldquo;Client Phone&rdquo; → &ldquo;Phone&rdquo;) and set default values for empty fields so no mismatch happens.
                </p>
              </div>
            </div>
          ) : step === 2 ? (
            /* ════════════════════════════════════════════════════════════════════════
                STEP 2: COLUMN MAPPING & DEFAULT VALUES (THE REQUESTED FEATURE)
               ════════════════════════════════════════════════════════════════════════ */
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      {file?.name}
                      <span className="text-[10px] font-semibold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">
                        {headers.length} Columns Detected
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        {rawRows.length} Data Rows
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sheets.length > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-medium">Sheet:</span>
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="border border-slate-300 rounded-lg px-2 py-1 bg-white text-xs font-medium text-slate-700"
                      >
                        {sheets.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setFile(null);
                      setWorkbook(null);
                      setStep(1);
                    }}
                    className="text-xs font-medium text-slate-600 hover:text-rose-600 px-2.5 py-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Sub-tabs: Column Mapping vs Default Settings */}
              <div className="flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("mapping")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                      activeTab === "mapping"
                        ? "border-cyan-600 text-cyan-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Columns size={14} /> Column Mapping ({mappedColumnsCount} of {headers.length} mapped)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("defaults")}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                      activeTab === "defaults"
                        ? "border-cyan-600 text-cyan-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Sliders size={14} /> Default CRM Values &amp; Fallbacks
                  </button>
                </div>

                {activeTab === "mapping" && (
                  <div className="flex items-center gap-2 pb-1.5">
                    <button
                      type="button"
                      onClick={handleAutoMapReset}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors cursor-pointer"
                      title="Re-run intelligent column detection"
                    >
                      <Sparkles size={12} /> Auto-Detect All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllMappings}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Unmap all columns"
                    >
                      <RotateCcw size={12} /> Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Tab 1: Column Mapping Grid */}
              {activeTab === "mapping" && (
                <div className="space-y-3">
                  {/* Status alert if Phone or Name is missing */}
                  {!isPhoneMapped && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                      <div>
                        <span className="font-semibold">Phone column is not mapped!</span> Inquiries require a valid contact number. Please map your sheet&apos;s phone/mobile column to{" "}
                        <span className="font-semibold">&ldquo;Phone / Mobile Number *&rdquo;</span>.
                      </div>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold w-1/3">Sheet Column Header</th>
                          <th className="py-2.5 px-2 font-semibold text-center w-12"></th>
                          <th className="py-2.5 px-4 font-semibold w-1/2">Map To CRM Lead Field</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Sample Value (Row 1)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {headers.map((header, colIdx) => {
                          const currentField = columnMapping[colIdx] || "__ignore__";
                          const sampleVal = rawRows[0]?.[colIdx] || "—";
                          const isMapped = currentField !== "__ignore__";
                          const isRequiredField = currentField === "phone";

                          return (
                            <tr key={colIdx} className={isMapped ? "bg-white hover:bg-slate-50/60" : "bg-slate-50/40 text-slate-400"}>
                              <td className="py-3 px-4 font-medium text-slate-800">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-800">{header}</span>
                                  {isMapped && (
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                        isRequiredField ? "bg-amber-100 text-amber-800 font-bold" : "bg-emerald-100 text-emerald-800"
                                      }`}
                                    >
                                      {isRequiredField ? "Required" : "Mapped"}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-2 text-center text-slate-400">
                                <ArrowRight size={14} className={isMapped ? "text-cyan-600" : "text-slate-300"} />
                              </td>

                              <td className="py-3 px-4">
                                <select
                                  value={currentField}
                                  onChange={(e) => handleSetColumnField(colIdx, e.target.value as TargetField)}
                                  className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 transition-all ${
                                    isMapped
                                      ? "border-cyan-300 bg-cyan-50/20 text-slate-800 font-medium focus:ring-cyan-500"
                                      : "border-slate-200 bg-white text-slate-500 focus:ring-slate-400"
                                  }`}
                                >
                                  <option value="__ignore__">— Do Not Import (Ignore Column) —</option>

                                  <optgroup label="Core Contact Details">
                                    <option value="phone">Phone / Mobile Number * (Required)</option>
                                    <option value="full_name">Full Name (Auto-split into First &amp; Last)</option>
                                    <option value="first_name">First Name</option>
                                    <option value="last_name">Last Name / Surname</option>
                                    <option value="email">Email Address</option>
                                  </optgroup>

                                  <optgroup label="Trip Requirements">
                                    <option value="destination">Destination / Tour Package</option>
                                    <option value="budget">Budget (₹ Amount)</option>
                                    <option value="travellerCount">Pax / Travellers Count</option>
                                    <option value="travelDate">Travel Date / Month</option>
                                    <option value="message">Notes / Requirements / Query</option>
                                  </optgroup>

                                  <optgroup label="Marketing &amp; Attribution">
                                    <option value="source">Platform / Source (e.g. Instagram, Facebook)</option>
                                    <option value="campaign_name">Campaign Name</option>
                                    <option value="ad_name">Ad Name</option>
                                    <option value="form_name">Form Name</option>
                                    <option value="state">City / State / Location</option>
                                    <option value="externalLeadId">External Lead ID</option>
                                  </optgroup>

                                  <optgroup label="CRM System">
                                    <option value="status">Lead Status</option>
                                    <option value="priority">Priority</option>
                                  </optgroup>
                                </select>
                              </td>

                              <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500 max-w-[200px] truncate">
                                {sampleVal}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Default Values & Fallbacks ("Let the default be the default") */}
              {activeTab === "defaults" && (
                <div className="space-y-4">
                  <div className="bg-cyan-50/50 border border-cyan-100 rounded-xl p-3.5 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800 mb-1">
                      Default Values &amp; Fallback Rules
                    </p>
                    <p className="text-slate-500">
                      When a row in the sheet is missing a value, or if a column wasn&apos;t in your Excel export, these default values will be automatically applied to keep your inquiries clean and consistent.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Default Status */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Default Inquiry Status
                      </label>
                      <select
                        value={defaultStatus}
                        onChange={(e) => setDefaultStatus(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="new">New (Unassigned / Fresh inquiry)</option>
                        <option value="assigned">Assigned</option>
                        <option value="begin">Begin</option>
                        <option value="ytc">YTC (Yet To Connect)</option>
                        <option value="responded">Responded</option>
                        <option value="in-progress">In-Progress</option>
                        <option value="follow-up">Follow-Up</option>
                        <option value="whatsapp-sent">WhatsApp Sent</option>
                        <option value="callback-scheduled">Callback Scheduled</option>
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Applied if status is not specified in the sheet.
                      </p>
                    </div>

                    {/* Default Channel */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Default Channel / Source
                      </label>
                      <select
                        value={defaultChannel}
                        onChange={(e) => {
                          setDefaultChannel(e.target.value);
                          if (["instagram", "facebook", "google", "website", "whatsapp", "phone", "referral"].includes(e.target.value)) {
                            setDefaultSource(e.target.value);
                          } else {
                            setDefaultSource("other");
                          }
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="excel_import">Excel / Spreadsheet Import</option>
                        <option value="instagram">Instagram Ads / Organic</option>
                        <option value="facebook">Facebook Ads / Page</option>
                        <option value="google">Google Ads / Search</option>
                        <option value="website">Website Form</option>
                        <option value="whatsapp">WhatsApp Query</option>
                        <option value="phone">Phone / Direct Call</option>
                        <option value="referral">Referral / Word of Mouth</option>
                        <option value="other">Other / Custom</option>
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Channel recorded on inquiry and activity timeline.
                      </p>
                    </div>

                    {/* Default Assigned Staff */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Assign Leads to Staff
                      </label>
                      <select
                        value={defaultAssignedTo}
                        onChange={(e) => setDefaultAssignedTo(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">Unassigned — admin will assign later</option>
                        {staffList.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.firstName} {s.lastName}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Optional: Automatically route all leads in this sheet to a team member.
                      </p>
                    </div>

                    {/* Default Destination */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Default Destination (Fallback)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kashmir, Goa, Dubai, Bali..."
                        value={defaultDestination}
                        onChange={(e) => setDefaultDestination(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Fallback if the sheet does not have a destination column.
                      </p>
                    </div>
                  </div>

                  {/* Deduplication & Cleanup Options */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800">
                          Skip duplicate phone numbers &amp; lead IDs (Recommended)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Prevents duplicate inquiries if you re-upload the same cumulative export file or existing CRM contacts.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer select-none pt-2 border-t border-slate-200/60">
                      <input
                        type="checkbox"
                        checked={skipTestLeads}
                        onChange={(e) => setSkipTestLeads(e.target.checked)}
                        className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800">
                          Skip Meta dummy test leads
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Automatically filters out &lt;test lead: dummy data...&gt; generated by Facebook Lead Testing Tool.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════════════════
                STEP 3: LIVE PREVIEW & IMPORT
               ════════════════════════════════════════════════════════════════════════ */
            <div className="space-y-4">
              {/* Stat Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500 font-medium">Total Rows</div>
                  <div className="text-lg font-bold text-slate-800 mt-0.5">{parsedLeads.length}</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="text-[11px] text-emerald-700 font-medium">Ready to Import</div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">{activeLeadsCount}</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="text-[11px] text-amber-700 font-medium">Missing Phone</div>
                  <div className="text-lg font-bold text-amber-700 mt-0.5">{invalidLeadsCount}</div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="text-[11px] text-blue-700 font-medium">Test Leads Skipped</div>
                  <div className="text-lg font-bold text-blue-700 mt-0.5">{testLeadsCount}</div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      CRM Data Preview (First 8 Rows)
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                      Showing how leads will be entered into inquiries
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Showing 8 of {parsedLeads.length} records
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Row</th>
                        <th className="py-2 px-3 font-semibold">Customer Name</th>
                        <th className="py-2 px-3 font-semibold">Phone Number</th>
                        <th className="py-2 px-3 font-semibold">Email</th>
                        <th className="py-2 px-3 font-semibold">Destination</th>
                        <th className="py-2 px-3 font-semibold">Pax / Budget</th>
                        <th className="py-2 px-3 font-semibold">Source</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedLeads.slice(0, 8).map((lead, idx) => (
                        <tr
                          key={idx}
                          className={
                            lead.isTestLead && skipTestLeads
                              ? "bg-slate-50/70 text-slate-400 line-through"
                              : !lead.hasPhone
                              ? "bg-amber-50/40"
                              : "hover:bg-slate-50/50"
                          }
                        >
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                            #{lead.rowIndex}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {lead.fullName || lead.firstName}
                            {lead.isTestLead && (
                              <span className="ml-1 text-[9px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded no-underline font-normal">
                                Test
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {lead.phone ? (
                              <span className="text-slate-700 font-mono text-[11px]">{lead.phone}</span>
                            ) : (
                              <span className="text-amber-600 font-semibold text-[10px]">Missing Phone</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 truncate max-w-[130px]">
                            {lead.email || <span className="text-slate-400 italic">Auto-generated</span>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">
                            {lead.destination || <span className="text-slate-400 italic">Not Decided</span>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {lead.travellerCount ? `${lead.travellerCount} Pax` : "—"}
                            {lead.budget ? ` • ₹${lead.budget.toLocaleString("en-IN")}` : ""}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 capitalize">
                            {lead.channel || lead.source}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="capitalize px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                              {lead.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!result && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <div className="text-xs text-slate-400">
                  Select a file to begin mapping
                </div>
              </>
            ) : step === 2 ? (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to File Upload
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    Next: Preview Leads <ArrowRight size={14} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to Column Mapping
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={loading || activeLeadsCount === 0}
                  className="px-5 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
