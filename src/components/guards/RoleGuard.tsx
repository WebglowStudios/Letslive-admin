"use client";

import { useAuthStore } from "@/stores/authStore";
import { hasPermission, Permission } from "@/lib/permissions";

interface RoleGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ permission, children, fallback }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user || !hasPermission(user, permission)) {
    return fallback ? <>{fallback}</> : (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-700">Access Denied</h2>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
          You don&apos;t have permission to view this section. Contact your administrator for access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
