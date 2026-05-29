import { useAuthStore } from "@/stores/authStore";
import { hasPermission, Permission } from "@/lib/permissions";

export function usePermission(permission: Permission): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return hasPermission(user.role, permission);
}

export function useRole() {
  const user = useAuthStore((s) => s.user);
  return user?.role || null;
}
