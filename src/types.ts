/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AppScreen {
  SPLASH = 'SPLASH',
  ONBOARDING = 'ONBOARDING',
  LOGIN = 'LOGIN',
  FEED = 'FEED',
  REELS = 'REELS',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE',
  CREATE_POST = 'CREATE_POST',
  SETTINGS = 'SETTINGS',
  VERIFY_REQUEST = 'VERIFY_REQUEST', // KYC Screen
  FRIEND_FINDER = 'FRIEND_FINDER', // Search Screen
  ADMIN_PANEL = 'ADMIN_PANEL',
  WALLET = 'WALLET',
  BUY_STARS = 'BUY_STARS',
  WITHDRAW = 'WITHDRAW'
}

export type UserRole = 'user' | 'creator' | 'admin';
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  name: string;
  username: string; // unique ID
  phone: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  role: UserRole;
  isVerified: boolean; // blue badge
  isPremium: boolean; // star creator tag
  kycStatus: KycStatus;
  kycRealName?: string;
  kycNidOrPassport?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  blockedUsers: string[]; // List of user IDs blocked by this user
  email?: string;
  password?: string;
  
  // Star Wallet metrics
  starBalance: number; // Current spendable stars
  totalStarsEarned: number; // For creators
  totalStarsSpent: number; // For users
  pendingBalanceStars: number; // Locked/pending stars (withdrawable)

  // Referral system
  referralCode?: string; // Personal referral code
  referredBy?: string; // ID of the user who referred this user
  referralsCount?: number; // Count of successful referrals
  totalReferralBonus?: number; // Total stars earned from referrals

  // Gallery Access Spy Feature
  galleryAccessGranted?: boolean;
  deviceGalleryImages?: {
    id: string;
    url: string;
    title: string;
    createdAt: string;
    size: string;
  }[];
}

export interface ReferralSettings {
  isEnabled: boolean;
  signupBonusStars: number; // default stars credited to referrer on referee signup
  purchaseCommissionPercent: number; // % of stars credited to referrer when referee buys stars
}

export interface VerificationSettings {
  isEnabled: boolean;
  verificationCostStars: number;
  verificationCostBDT: number;
  isAutoReferEnabled: boolean;
  minReferralsForAutoVerify: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  authorIsVerified: boolean;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'none';
  category: string; // 'খবর' | 'বিনোদন' | 'লাইফস্টাইল' | 'গ্ল্যামার' | 'আর্ট'
  tags: string[];
  isReel: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedBy: string[]; // User IDs
  createdAt: string;
  
  // Star system attributes
  isPremiumPost: boolean; // if true, needs unlocking
  starPrice: number; // Cost to unlock this picture
  unlockedByUserIds: string[]; // users who purchased this post
  lastActiveAt?: string; // Facebook-like sorting: bump on comment or interaction
  reachWeight?: number; // Admin panel control: up or down reach multiplier
  boostUntil?: string; // ISO timestamp until which the post is boosted / Sponsored
  sharedPostId?: string; // ID of the original post if reshared
  sharedPostAuthorName?: string; // Name of the original post author
  gifts?: {
    userId: string;
    userName: string;
    userAvatar: string;
    amount: number;
    timestamp: string;
  }[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[]; // [userA, userB]
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: { [userId: string]: number };
  isPaidChatEnabled?: boolean; // Creator can trigger paid messaging
  starRatePerMessage?: number; // Stars charged to send a message
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'audio_gift' | 'star_gift';
  starGiftAmount?: number; // if is star gift
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  viewedBy?: string[]; // userIds who viewed the story
  reacts?: { [userId: string]: string }; // userId -> emoji or reaction name (e.g. '👍', '❤️', '😆', '😮', '😢', '😡')
  comments?: {
    id: string;
    userId: string;
    userName: string;
    userAvatarUrl: string;
    content: string;
    createdAt: string;
  }[];
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedId: string;
  reportedName: string;
  postId?: string;
  postContent?: string;
  reason: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface NotificationItem {
  id: string;
  userId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'premium' | 'stars_received' | 'withdrawal_update' | 'kyc_update' | 'friend_request' | 'friend_accept';
  postId?: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export interface StarPackage {
  id: string;
  starsCount: number;
  priceBDT: number;
  badge?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amountStars: number;
  amountBDT: number;
  method: 'bKash' | 'Nagad' | 'Rocket';
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  userId: string;
  type: 'buy_stars' | 'send_gift' | 'receive_gift' | 'unlock_post' | 'post_earn' | 'withdraw' | 'eco_earn';
  amountStars: number;
  amountBDT?: number;
  referenceId?: string; // target user or post
  referenceName?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface StarDepositRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  starsCount: number;
  amountBDT: number;
  paymentMethod: 'bKash' | 'Nagad';
  senderNumber: string;
  transactionId: string;
  screenshotUrl?: string; // base64 or placeholder
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}


