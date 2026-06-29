import { create } from "zustand";
import { User, Role } from "@/types";
import { api } from "@/lib/api";

// Hardcoded demo credentials for UI preview
const DEMO_USERS: Record<string, User> = {
  "admin@letslivetours.in": {
    _id: "demo-admin-001",
    firstName: "Admin",
    lastName: "User",
    email: "admin@letslivetours.in",
    role: "admin",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  "manager@letslivetours.in": {
    _id: "demo-manager-001",
    firstName: "Manager",
    lastName: "User",
    email: "manager@letslivetours.in",
    role: "manager",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  "staff@letslivetours.in": {
    _id: "demo-staff-001",
    firstName: "Staff",
    lastName: "User",
    email: "staff@letslivetours.in",
    role: "staff",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  "guest@letslivetours.in": {
    _id: "demo-guest-001",
    firstName: "Guest",
    lastName: "Viewer",
    email: "guest@letslivetours.in",
    role: "guest",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
};

const DEMO_PASSWORD = "admin123";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  login: async (email, password) => {
    // Demo login — hardcoded for UI preview
    const demoUser = DEMO_USERS[email.toLowerCase()];
    if (demoUser && password === DEMO_PASSWORD) {
      set({ user: demoUser });
      if (typeof window !== "undefined") {
        localStorage.setItem("demo_user", JSON.stringify(demoUser));
      }
      return { success: true };
    }

    // Try real API login as fallback
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res?.status === "success" && res.data) {
        const user = res.data.user || res.data;
        const allowedRoles: Role[] = ["admin", "manager", "staff"];
        if (!allowedRoles.includes(user.role)) {
          return { success: false, message: "Access denied. This panel is for authorized staff only." };
        }
        set({ user });
        return { success: true };
      }
      return { success: false, message: res?.message || "Invalid credentials" };
    } catch {
      return { success: false, message: "Invalid email or password." };
    }
  },

  logout: async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_user");
    }
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore
    }
    set({ user: null });
  },

  checkAuth: async () => {
    // Check for demo user in localStorage first
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("demo_user");
      if (stored) {
        try {
          const user = JSON.parse(stored);
          set({ user, loading: false });
          return;
        } catch {
          localStorage.removeItem("demo_user");
        }
      }
    }

    // Try real API
    try {
      const res = await api.get("/auth/me");
      if (res?.status === "success" && res.data) {
        const user = res.data.user || res.data;
        const allowedRoles: Role[] = ["admin", "manager", "staff", "guest"];
        if (allowedRoles.includes(user.role)) {
          set({ user, loading: false });
          return;
        }
      }
      set({ user: null, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));
