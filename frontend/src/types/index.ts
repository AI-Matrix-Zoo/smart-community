export enum UserRole {
  USER = 'USER',
  PROPERTY = 'PROPERTY',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  phone?: string;
  email?: string;
  name: string;
  role: UserRole;
  building?: string;
  unit?: string;
  room?: string;
  identity_image?: string;
  is_verified?: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 