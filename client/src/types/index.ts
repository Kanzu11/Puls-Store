export type Role = 'CUSTOMER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  telegramId?: string | null;
  telegramUsername?: string | null;
  createdAt: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
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
  items: OrderItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: ProductDTO;
  quantity: number;
}

