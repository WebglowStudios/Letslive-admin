import { Role, User } from "@/types";

type Permission =
  | "dashboard.view"
  | "bookings.view"
  | "bookings.update"
  | "bookings.delete"
  | "destinations.view"
  | "destinations.create"
  | "destinations.edit"
  | "destinations.delete"
  | "packages.view"
  | "packages.create"
  | "packages.edit"
  | "packages.delete"
  | "users.view"
  | "users.edit"
  | "users.delete"
  | "staff.view"
  | "staff.create"
  | "staff.edit"
  | "staff.delete"
  | "reviews.view"
  | "reviews.approve"
  | "reviews.edit"
  | "reviews.delete"
  | "enquiries.view"
  | "enquiries.respond"
  | "enquiries.delete"
  | "careers.view"
  | "careers.create"
  | "careers.edit"
  | "careers.delete"
  | "newsletter.view"
  | "newsletter.export"
  | "settings.view"
  | "settings.edit"
  | "activity.view"
  | "finance.approve";

export const ALL_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "bookings.view", "bookings.update", "bookings.delete",
  "destinations.view", "destinations.create", "destinations.edit", "destinations.delete",
  "packages.view", "packages.create", "packages.edit", "packages.delete",
  "users.view", "users.edit", "users.delete",
  "staff.view", "staff.create", "staff.edit", "staff.delete",
  "reviews.view", "reviews.approve", "reviews.edit", "reviews.delete",
  "enquiries.view", "enquiries.respond", "enquiries.delete",
  "careers.view", "careers.create", "careers.edit", "careers.delete",
  "newsletter.view", "newsletter.export",
  "settings.view", "settings.edit",
  "activity.view", "finance.approve"
];

export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "dashboard.view",
    "bookings.view", "bookings.update", "bookings.delete",
    "destinations.view", "destinations.create", "destinations.edit", "destinations.delete",
    "packages.view", "packages.create", "packages.edit", "packages.delete",
    "users.view", "users.edit", "users.delete",
    "staff.view", "staff.create", "staff.edit", "staff.delete",
    "reviews.view", "reviews.approve", "reviews.edit", "reviews.delete",
    "enquiries.view", "enquiries.respond", "enquiries.delete",
    "careers.view", "careers.create", "careers.edit", "careers.delete",
    "newsletter.view", "newsletter.export",
    "settings.view", "settings.edit",
    "activity.view", "finance.approve",
  ],
  manager: [
    "dashboard.view",
    "bookings.view", "bookings.update",
    "destinations.view", "destinations.create", "destinations.edit", "destinations.delete",
    "packages.view", "packages.create", "packages.edit", "packages.delete",
    "users.view", "users.edit",
    "reviews.view", "reviews.approve", "reviews.edit", "reviews.delete",
    "enquiries.view", "enquiries.respond",
    "careers.view", "careers.create", "careers.edit", "careers.delete",
    "newsletter.view",
    "activity.view",
    "settings.view",
  ],
  "sales-manager": [
    "dashboard.view",
    "destinations.view", "destinations.create", "destinations.edit", "destinations.delete",
    "packages.view", "packages.create", "packages.edit", "packages.delete",
    "users.view", "users.edit",
    "reviews.view", "reviews.approve", "reviews.edit", "reviews.delete",
    "enquiries.view", "enquiries.respond",
    "careers.view", "careers.create", "careers.edit", "careers.delete",
    "newsletter.view",
    "activity.view",
    "settings.view",
  ],
  "sales-staff": [
    "dashboard.view",
    "destinations.view", "destinations.create", "destinations.edit",
    "packages.view", "packages.create", "packages.edit",
    "reviews.view", "reviews.edit",
    "enquiries.view", "enquiries.respond",
    "careers.view",
    "activity.view",
  ],
  "ops-manager": [
    "dashboard.view",
    "bookings.view", "bookings.update",
    "destinations.view", "destinations.create", "destinations.edit", "destinations.delete",
    "packages.view", "packages.create", "packages.edit", "packages.delete",
    "users.view", "users.edit",
    "reviews.view", "reviews.approve", "reviews.edit", "reviews.delete",
    "careers.view", "careers.create", "careers.edit", "careers.delete",
    "newsletter.view",
    "activity.view",
    "settings.view",
  ],
  "ops-staff": [
    "dashboard.view",
    "bookings.view", "bookings.update",
    "destinations.view", "destinations.create", "destinations.edit",
    "packages.view", "packages.create", "packages.edit",
    "reviews.view", "reviews.edit",
    "careers.view",
    "activity.view",
  ],
  staff: [
    "dashboard.view",
    "bookings.view", "bookings.update",
    "destinations.view", "destinations.create", "destinations.edit",
    "packages.view", "packages.create", "packages.edit",
    "reviews.view", "reviews.edit",
    "enquiries.view", "enquiries.respond",
    "careers.view",
    "activity.view",
  ],
  guest: [
    "dashboard.view",
    "bookings.view",
    "destinations.view",
    "packages.view",
    "reviews.view",
    "enquiries.view",
    "careers.view",
  ],
  user: [],
};

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  
  const now = new Date();

  // 1. Check active custom permissions override (grant or revoke)
  if (user.customPermissions) {
    const custom = user.customPermissions.find((p) => p.permission === permission);
    if (custom) {
      const isRevoked = custom.action === "revoke" || custom.granted === false;
      const isExpired = custom.expiresAt ? new Date(custom.expiresAt) <= now : false;

      if (!isExpired) {
        // If explicitly revoked and not expired, deny permission immediately
        if (isRevoked) {
          return false;
        }
        // If explicitly granted and not expired, grant permission immediately
        return true;
      }
    }
  }

  // 2. Check inherent role permissions
  if (rolePermissions[user.role]?.includes(permission)) {
    return true;
  }
  
  return false;
}

export function getPermissions(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

export function getUserPermissions(user: User | null): Permission[] {
  if (!user) return [];
  return ALL_PERMISSIONS.filter((p) => hasPermission(user, p));
}

export type { Permission };
