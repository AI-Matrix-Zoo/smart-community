import { Request } from 'express';

export enum SuggestionStatus {
  Submitted = '已提交',
  InProgress = '处理中',
  Resolved = '已解决',
  Rejected = '已驳回',
}

export interface SuggestionProgressUpdate {
  update: string;
  date: string;
  by: string;
  byRole?: UserRole;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  submittedBy: string;
  submittedByUserId?: string;
  submittedDate: string;
  status: SuggestionStatus;
  progressUpdates: SuggestionProgressUpdate[];
}

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  seller: string;
  sellerUserId?: string;
  postedDate: string;
  contactInfo?: string;
}

export enum UserRole {
  USER = 'USER',
  PROPERTY = 'PROPERTY',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  phone: string;
  password?: string;
  name: string;
  role: UserRole;
  building?: string;
  room?: string;
}

export interface Announcement {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  roleOfAuthor: UserRole;
  createdAt: string;
  updatedAt: string;
}

// API相关类型
export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  name: string;
  building: string;
  room: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  phone: string;
  role: UserRole;
  name?: string;
  iat?: number;
  exp?: number;
} 