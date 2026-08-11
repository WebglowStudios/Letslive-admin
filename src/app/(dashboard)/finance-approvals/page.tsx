"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import RoleGuard from "@/components/guards/RoleGuard";
import { BadgeDollarSign, Check, X } from "lucide-react";
import Link from "next/link";

interface FinanceDetails {
  mode: string;
  transactionId: string;
  remarks: string;
  requestedBy?: { firstName: string; lastName: string };
  paidAmount?: number;
}

interface BookingApproval {
  _id: string;
  bookingId: string;
  user: { firstName: string; lastName: string; email: string };
  totalAmount: number;
  paidAmount: number;
  financeDetails?: FinanceDetails;
  updatedAt: string;
}

interface OperationApproval {
  _id: string;
  milestone: string;
  amount: number;
  financeDetails?: FinanceDetails;
  operation: { _id: string; operationId: string; customer: { name: string } };
  requestedBy?: { firstName: string; lastName: string };
  updatedAt: string;
}

export default function FinanceApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingApproval[]>([]);
  const [operations, setOperations] = useState<OperationApproval[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/finance/approvals");
      if (res.data) {
        setBookings(res.data.bookings || []);
        setOperations(res.data.operations || []);
      }
    } catch (err) {
      console.error("Failed to fetch approvals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (type: "booking" | "operation", id: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this payment?`)) return;
    
    setProcessing(id);
    try {
      await api.post(`/finance/approvals/${type}/${id}`, { action });
      fetchApprovals();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process approval");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-[3px] border-cyan-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPending = bookings.length + operations.length;

  return (
    <RoleGuard permission="finance.approve">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BadgeDollarSign className="text-cyan-600" /> Finance Approvals
            </h1>
            <p className="text-slate-500 text-sm mt-1">Review and approve pending payments from staff.</p>
          </div>
          <div className="bg-amber-100 text-amber-800 font-bold px-4 py-2 rounded-xl text-sm">
            {totalPending} Pending Request{totalPending !== 1 && "s"}
          </div>
        </div>

        {totalPending === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            No pending finance approvals. Great job!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Bookings Queue */}
            {bookings.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                  Booking Payments <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{bookings.length}</span>
                </h2>
                {bookings.map((b) => (
                  <div key={b._id} className="bg-white border border-amber-200 shadow-sm rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Link href={`/bookings/${b._id}`} className="text-sm font-bold text-cyan-600 hover:underline">
                          {b.bookingId}
                        </Link>
                        <p className="text-xs text-slate-500">{b.user.firstName} {b.user.lastName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Requested Amount</p>
                        <p className="font-bold text-slate-800">{formatCurrency(b.totalAmount - b.paidAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 mb-4 border border-slate-100">
                      <p><span className="text-slate-400 w-24 inline-block">Mode:</span> <span className="font-semibold">{b.financeDetails?.mode}</span></p>
                      <p><span className="text-slate-400 w-24 inline-block">TXN ID:</span> <span className="font-mono">{b.financeDetails?.transactionId || "N/A"}</span></p>
                      <p><span className="text-slate-400 w-24 inline-block">Remarks:</span> <span>{b.financeDetails?.remarks || "None"}</span></p>
                      <p><span className="text-slate-400 w-24 inline-block">Staff:</span> <span>{b.financeDetails?.requestedBy?.firstName || "System"}</span></p>
                      <p><span className="text-slate-400 w-24 inline-block">Time:</span> <span>{formatDateTime(b.updatedAt)}</span></p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove("booking", b._id, "approve")}
                        disabled={processing === b._id}
                        className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => handleApprove("booking", b._id, "reject")}
                        disabled={processing === b._id}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Operations Queue */}
            {operations.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                  Operation Installments <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{operations.length}</span>
                </h2>
                {operations.map((o) => (
                  <div key={o._id} className="bg-white border border-amber-200 shadow-sm rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Link href={`/operations/${o.operation?._id}`} className="text-sm font-bold text-cyan-600 hover:underline">
                          {o.operation?.operationId}
                        </Link>
                        <p className="text-xs text-slate-500">{o.operation?.customer?.name} - {o.milestone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Requested Amount</p>
                        <p className="font-bold text-slate-800">{formatCurrency(o.financeDetails?.paidAmount || o.amount)}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 mb-4 border border-slate-100">
                      <p><span className="text-slate-400 w-24 inline-block">Mode:</span> <span className="font-semibold">{o.financeDetails?.mode}</span></p>
                      <p><span className="text-slate-400 w-24 inline-block">TXN ID:</span> <span className="font-mono">{o.financeDetails?.transactionId || "N/A"}</span></p>
                      <p><span className="text-slate-400 w-24 inline-block">Remarks:</span> <span>{o.financeDetails?.remarks || "None"}</span></p>
                      <p><span className="text-slate-400 w-24 inline-block">Staff:</span> <span>{o.requestedBy?.firstName || "System"}</span></p>
                      <p><span className="text-slate-400 w-24 inline-block">Time:</span> <span>{formatDateTime(o.updatedAt)}</span></p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApprove("operation", o._id, "approve")}
                        disabled={processing === o._id}
                        className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => handleApprove("operation", o._id, "reject")}
                        disabled={processing === o._id}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </RoleGuard>
  );
}
