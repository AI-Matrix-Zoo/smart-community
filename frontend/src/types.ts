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
  imageUrl: string;
  seller: string;
  sellerUserId?: string;
  postedDate: string;
  contactInfo?: string;
  comments?: MarketItemComment[];
  likes?: MarketItemLike[];
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
}

export type NavItem = {
  name: string;
  path: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  roles?: UserRole[]; // Optional: roles that can see this nav item
};

export enum UserRole {
  USER = 'USER',
  PROPERTY = 'PROPERTY',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  phone?: string;
  email?: string;
  password?: string; // Only for mock auth, don't store real passwords like this
  name: string; // Display name, e.g., "张三 (1栋-101)" or "物业李四"
  role: UserRole;
  building?: string; // e.g., "1栋"
  unit?: string; // e.g., "1单元"
  room?: string; // e.g., "101"
}

export interface RegistrationData {
  identifier: string; // 邮箱或手机号
  password: string;
  name: string;
  building: string;
  unit: string;
  room: string;
  verificationCode: string;
  verificationType: 'email' | 'sms';
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