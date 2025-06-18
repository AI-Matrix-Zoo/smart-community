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
  byRole?: string;
}

export interface SuggestionComment {
  id: number;
  suggestionId: string;
  userId: string;
  userName: string;
  userVerified?: boolean;
  content: string;
  createdAt: string;
}

export interface SuggestionLike {
  id: number;
  suggestionId: string;
  userId: string;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  submittedBy: string;
  submittedByUserId: string;
  submittedByUserVerified?: boolean;
  submittedDate: string;
  status: SuggestionStatus;
  progressUpdates: SuggestionProgressUpdate[];
  comments?: SuggestionComment[];
  likes?: SuggestionLike[];
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
}

export interface MarketItemComment {
  id: number;
  marketItemId: string;
  userId: string;
  userName: string;
  userVerified?: boolean;
  content: string;
  createdAt: string;
}

export interface MarketItemLike {
  id: number;
  marketItemId: string;
  userId: string;
  createdAt: string;
}

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string; // 主图片，保持向后兼容
  imageUrls?: string[]; // 多图片数组
  seller: string;
  sellerUserId?: string;
  sellerVerified?: boolean;
  postedDate: string;
  contactInfo?: string;
  comments?: MarketItemComment[];
  likes?: MarketItemLike[];
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
}

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
  identifier: string; // 可以是手机号或邮箱
  password: string;
}

export interface RegisterRequest {
  identifier: string; // 可以是邮箱或手机号
  password: string;
  name: string;
  building: string;
  unit: string;
  room: string;
  verificationCode: string;
  verificationType: 'email' | 'sms';
}

export interface SendVerificationCodeRequest {
  identifier: string; // 邮箱或手机号
  type: 'email' | 'sms';
}

export interface VerifyCodeRequest {
  identifier: string;
  code: string;
  type: 'email' | 'sms';
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
  email?: string;
  phone?: string;
  role: UserRole;
  name: string;
} 