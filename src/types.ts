export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'servicer';
  plan: 'free' | 'pro' | 'enterprise';
}

export interface Plan {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

export interface Booking {
  id: number;
  service_id: number;
  service_name?: string;
  customer_name: string;
  customer_email: string;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}
