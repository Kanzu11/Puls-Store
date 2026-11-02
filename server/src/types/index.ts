export type Role = 'CUSTOMER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  telegramId: string | null;
  telegramUsername: string | null;
  orderCount?: number;
  createdAt: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  images: string[];
  isActive: boolean;
  categoryId: string | null;
  category?: CategoryDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

export interface OrderItemDTO {
  id: string;
  quantity: number;
  price: number;
  product: ProductDTO;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: ShippingAddress;
  notes: string | null;
  userId?: string | null;
  items: OrderItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: ShippingAddress;
  notes?: string;
  userId?: string;
  items: { productId: string; quantity: number; price: number }[];
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface StatsDTO {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalUsers?: number;
  revenueToday: number;
  ordersToday: number;
  recentOrders: OrderDTO[];
  dailyRevenue: DailyRevenue[];
}

