"use client";

import { Clock, User, Package, MapPin, FileText, Trash2, Edit, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import RoleGuard from "@/components/guards/RoleGuard";

interface ActivityEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  type: "create" | "update" | "delete";
}

const mockActivities: ActivityEntry[] = [
  { id: "1", timestamp: "2024-12-20T14:30:00Z", user: "Rahul Sharma", action: "Created new package 'Maldives Luxury Escape'", type: "create" },
  { id: "2", timestamp: "2024-12-20T13:15:00Z", user: "Priya Patel", action: "Updated destination 'Bali' pricing", type: "update" },
  { id: "3", timestamp: "2024-12-20T12:00:00Z", user: "Admin", action: "Deleted expired career listing 'Marketing Intern'", type: "delete" },
  { id: "4", timestamp: "2024-12-19T18:45:00Z", user: "Rahul Sharma", action: "Created new destination 'Santorini, Greece'", type: "create" },
  { id: "5", timestamp: "2024-12-19T16:20:00Z", user: "Priya Patel", action: "Updated booking #BK-1042 status to confirmed", type: "update" },
  { id: "6", timestamp: "2024-12-19T14:10:00Z", user: "Admin", action: "Deleted review from user 'spam_account'", type: "delete" },
  { id: "7", timestamp: "2024-12-19T11:30:00Z", user: "Vikram Singh", action: "Created career listing 'Senior Developer'", type: "create" },
  { id: "8", timestamp: "2024-12-18T17:00:00Z", user: "Priya Patel", action: "Updated package 'Kerala Backwaters' images", type: "update" },
  { id: "9", timestamp: "2024-12-18T15:45:00Z", user: "Admin", action: "Created new staff account for 'Neha Gupta'", type: "create" },
  { id: "10", timestamp: "2024-12-18T10:20:00Z", user: "Rahul Sharma", action: "Deleted draft package 'Test Package'", type: "delete" },
];

export default function ActivityPage() {
  const typeColors: Record<string, string> = {
    create: "bg-emerald-100 text-emerald-700",
    update: "bg-blue-100 text-blue-700",
    delete: "bg-red-100 text-red-700",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    create: <Plus size={12} />,
    update: <Edit size={12} />,
    delete: <Trash2 size={12} />,
  };

  return (
    <RoleGuard permission="activity.view">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Activity Log</h1>
          <p className="text-sm text-slate-500">Recent actions performed in the system</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="space-y-0">
            {mockActivities.map((activity, index) => (
              <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Timeline line */}
                {index < mockActivities.length - 1 && (
                  <div className="absolute left-[17px] top-10 bottom-0 w-px bg-slate-200" />
                )}

                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                  <Clock size={14} className="text-slate-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-700">{activity.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">{activity.user}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-400">{formatDateTime(activity.timestamp)}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${typeColors[activity.type]}`}>
                      {typeIcons[activity.type]}
                      {activity.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
