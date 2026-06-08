import { Role } from "@/types";

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
  | "activity.view";

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "dashboard.view",
    "bookings.view", "bookings.update", "bookings.delete",
    "destinations.view", "destinations.create", "destinations.edit", "destinations.delete",
    "packages.view", "packages.create", "packages.edit", "packages.delete",
    "users.view", "users.edit", "users.delete",
    "staff.view", "staff.create", "staff.edit", "staff.delete",
    "reviews.view", "reviews.approve", "reviews.delete",
    "enquiries.view", "enquiries.respond", "enquiries.delete",
    "careers.view", "careers.create", "careers.edit", "careers.delete",
    "newsletter.view", "newsletter.export",
    "settings.view", "settings.edit",
    "activity.view",
  ],
  manager: [
    "dashboard.view",
    "bookings.view", "bookings.update",
    "destinations.view", "destinations.create", "destinations.edit", "destinations.delete",
    "packages.view", "packages.create", "packages.edit", "packages.delete",
    "users.view", "users.edit",
    "reviews.view", "reviews.approve", "reviews.delete",
    "enquiries.view", "enquiries.respond",
    "careers.view", "careers.create", "careers.edit", "careers.delete",
    "newsletter.view",
    "activity.view",
  ],
  staff: [
    "dashboard.view",
    "bookings.view", "bookings.update",
    "destinations.view", "destinations.create", "destinations.edit",
    "packages.view", "packages.create", "packages.edit",
    "reviews.view",
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
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

export type { Permission };
