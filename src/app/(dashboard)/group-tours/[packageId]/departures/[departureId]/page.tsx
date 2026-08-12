"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Users, FileText, Settings, ExternalLink } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";

export default function GroupTourDeparturePage() {
  const router = useRouter();
  const params = useParams();
  const { packageId, departureId } = params;

  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<any>(null);
  const [departure, setDeparture] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<"enrolled" | "enquiries">("enrolled");

  useEffect(() => {
    fetchData();
  }, [packageId, departureId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [pkgRes, bookingsRes, enquiriesRes] = await Promise.all([
        api.get(`/packages/${packageId}`),
        api.get(`/bookings/all?package=${packageId}&departureId=${departureId}&limit=100`),
        api.get(`/enquiries?package=${packageId}&departureId=${departureId}&limit=100`)
      ]);

      const packageData = pkgRes?.data || pkgRes;
      setPkg(packageData);
      
      const dep = packageData?.departures?.find((d: any) => d._id === departureId);
      setDeparture(dep);

      // Filter bookings that have this departureId
      // Ensure we only show confirmed/paid ones if desired, or all.
      const depsBookings = (bookingsRes?.data || []).filter((b: any) => b.departureId === departureId);
      setBookings(depsBookings);

      const depsEnquiries = (enquiriesRes?.data || []).filter((e: any) => e.departureId === departureId);
      setEnquiries(depsEnquiries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <RoleGuard permission="bookings.view">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </RoleGuard>
    );
  }

  if (!pkg || !departure) {
    return (
      <RoleGuard permission="bookings.view">
        <div className="text-center py-20 text-slate-500">Departure not found</div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard permission="bookings.view">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{pkg.name}</h1>
            <p className="text-sm text-slate-500">
              Departure: {formatDate(departure.startDate)} - {formatDate(departure.endDate)}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-400 font-medium uppercase mb-1">Status</p>
            <p className={`text-lg font-bold capitalize ${
              departure.status === 'sold-out' ? 'text-red-600' :
              departure.status === 'cancelled' ? 'text-slate-600' :
              'text-emerald-600'
            }`}>{departure.status}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-400 font-medium uppercase mb-1">Slots (Booked / Total)</p>
            <p className="text-lg font-bold text-slate-800">{departure.bookedSlots || 0} / {departure.totalSlots}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-400 font-medium uppercase mb-1">Enrolled Users</p>
            <p className="text-lg font-bold text-slate-800">{bookings.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-400 font-medium uppercase mb-1">Pending Enquiries</p>
            <p className="text-lg font-bold text-slate-800">{enquiries.filter(e => !['converted', 'closed', 'resolved'].includes(e.status)).length}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href={`/packages/${pkg._id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Settings size={16} /> Manage Package
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab("enrolled")}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 flex justify-center items-center gap-2 transition-colors ${activeTab === "enrolled" ? "border-cyan-600 text-cyan-700 bg-cyan-50" : "border-transparent text-slate-500 hover:bg-slate-50"}`}
            >
              <Users size={16} /> Enrolled Users ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab("enquiries")}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 flex justify-center items-center gap-2 transition-colors ${activeTab === "enquiries" ? "border-cyan-600 text-cyan-700 bg-cyan-50" : "border-transparent text-slate-500 hover:bg-slate-50"}`}
            >
              <FileText size={16} /> Linked Enquiries ({enquiries.length})
            </button>
          </div>

          <div className="p-0">
            {activeTab === "enrolled" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Guest</th>
                      <th className="px-6 py-3 font-medium">Pax</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {bookings.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No enrolled users yet</td></tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-700">{b.user?.firstName} {b.user?.lastName}</p>
                            <p className="text-xs text-slate-400">{b.user?.email}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {(b.travellers?.adults || 1) + (b.travellers?.children || 0)}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{formatCurrency(b.totalAmount)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              b.bookingStatus === 'confirmed' ? 'bg-cyan-100 text-cyan-700' :
                              b.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>{b.bookingStatus}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/bookings/${b._id}`} className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-medium">
                              View <ExternalLink size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "enquiries" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Lead Name</th>
                      <th className="px-6 py-3 font-medium">Pax</th>
                      <th className="px-6 py-3 font-medium">Assigned To</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {enquiries.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No linked enquiries yet</td></tr>
                    ) : (
                      enquiries.map((e) => (
                        <tr key={e._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-700">{e.firstName} {e.lastName}</p>
                            <p className="text-xs text-slate-400">{e.email}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{e.travellerCount || '—'}</td>
                          <td className="px-6 py-4 text-slate-600">
                            {e.assignedTo ? `${e.assignedTo.firstName} ${e.assignedTo.lastName}` : <span className="text-slate-400">Unassigned</span>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              e.status === 'converted' ? 'bg-emerald-100 text-emerald-700' :
                              e.status === 'closed' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>{e.status}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/enquiries/${e._id}`} className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-medium">
                              View <ExternalLink size={14} />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
