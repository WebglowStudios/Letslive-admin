export type Role = "admin" | "manager" | "staff" | "guest" | "user" | "sales-manager" | "sales-staff" | "ops-manager" | "ops-staff";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
  avatar?: string;
  description?: string;
  isActive: boolean;
  isVerified?: boolean;
  customPermissions?: {
    permission: string;
    expiresAt?: string;
  }[];
  createdAt: string;
}

export interface Destination {
  _id: string;
  name: string;
  slug: string;
  country?: string;
  region?: string;
  description?: string;
  shortDescription?: string;
  images: string[];
  heroImage?: string;
  category?: string;
  rating: number;
  reviewCount: number;
  packageCount: number;
  startingPrice?: number;
  bestSeason?: string;
  visaType?: string;
  isActive: boolean;
  isFeatured: boolean;
  approvalStatus?: string;
  createdAt: string;
}

export interface Package {
  _id: string;
  name: string;
  slug: string;
  destination: { _id: string; name: string; slug: string } | string;
  description?: string;
  images: string[];
  heroImage?: string;
  duration: { nights: number; days: number };
  hotelRating?: string;
  category?: string;
  originalPrice?: number;
  price: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  isActive: boolean;
  isFeatured: boolean;
  approvalStatus?: string;
  createdAt: string;
  paymentPolicy?: string[];
  cancellationPolicy?: string[];
  flightCancellationPolicy?: string[];
}

export interface Booking {
  _id: string;
  bookingId?: string;
  user: { _id: string; firstName: string; lastName: string; email: string } | string;
  package: { _id: string; name: string; slug?: string } | string;
  travelDate: string;
  travellers: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "staff-confirmed" | "in-progress" | "completed" | "cancelled";
  bookingStatus?: "pending" | "confirmed" | "staff-confirmed" | "in-progress" | "completed" | "cancelled";
  paymentStatus?: string;
  specialRequests?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  user?: { _id: string; firstName: string; lastName: string; avatar?: string } | string;
  reviewerName?: string;
  package: { _id: string; name: string; slug?: string } | string;
  destination?: { _id: string; name: string } | string;
  rating: number;
  title?: string;
  text: string;
  tripType?: string;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface CallLogEntry {
  _id: string;
  attemptedAt: string;
  outcome: "answered" | "dnp" | "busy" | "whatsapp-sent" | "email-sent" | "callback-scheduled";
  notes?: string;
  by?: { firstName: string; lastName: string };
  duration?: number;
}

export interface EnquiryNote {
  _id?: string;
  text: string;
  by?: { firstName: string; lastName: string };
  date: string;
}

export interface Enquiry {
  _id: string;
  type: "general" | "booking" | "support" | "callback" | "group-quote";
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  destination?: string;
  travelDate?: string;
  message?: string;
  packageName?: string;
  package?: string;
  departureId?: string;
  linkedItineraries?: { _id: string; name: string; slug: string; price?: number }[];
  status: "new" | "assigned" | "in-progress" | "follow-up" | "converted" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: { _id: string; firstName: string; lastName: string };
  notes: EnquiryNote[];
  source: "website" | "whatsapp" | "phone";
  // CRM fields
  dnpCount: number;
  followUpDate?: string;
  followUpNotes?: string;
  lostReason?: string;
  lostReasonOtherText?: string;
  conversionValue?: number;
  bookingRef?: { bookingId: string; totalAmount: number } | string;
  travellerCount?: number;
  budget?: number;
  tags: string[];
  channel?: string;
  callLog: CallLogEntry[];
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Career {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience?: string;
  description?: string;
  requirements: string[];
  isActive: boolean;
  applicationsCount?: number;
  createdAt: string;
}

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
}

export interface StatsData {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  totalPackages: number;
  totalDestinations: number;
  pendingBookings: number;
  pendingReviews: number;
  newEnquiries: number;
}
