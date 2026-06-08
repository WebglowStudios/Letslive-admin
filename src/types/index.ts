export type Role = "admin" | "manager" | "staff" | "guest";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
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
}

export interface Booking {
  _id: string;
  bookingId?: string;
  user: { _id: string; firstName: string; lastName: string; email: string } | string;
  package: { _id: string; name: string; slug?: string } | string;
  travelDate: string;
  travellers: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  bookingStatus?: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  paymentStatus?: string;
  specialRequests?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  user: { _id: string; firstName: string; lastName: string; avatar?: string } | string;
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

export interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  type?: string;
  status: "new" | "in-progress" | "resolved" | "closed";
  response?: string;
  createdAt: string;
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
