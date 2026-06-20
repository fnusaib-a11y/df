/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  AppScreen, 
  UserProfile, 
  Post, 
  Comment, 
  Chat, 
  Message, 
  Story, 
  Report, 
  NotificationItem, 
  StarPackage, 
  WithdrawalRequest, 
  TransactionItem,
  ReferralSettings,
  VerificationSettings,
  FriendRequest
} from '../types';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  onSnapshot, 
  Firestore,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

const STORAGE_KEYS = {
  CURRENT_USER: 'starconnect_current_user',
  USERS: 'starconnect_users_db',
  POSTS: 'starconnect_posts_db',
  COMMENTS: 'starconnect_comments_db',
  MESSAGES: 'starconnect_messages_db',
  CHATS: 'starconnect_chats_db',
  STORIES: 'starconnect_stories_db',
  REPORTS: 'starconnect_reports_db',
  NOTIFICATIONS: 'starconnect_notifications_db',
  WITHDRAWALS: 'starconnect_withdrawals_db',
  TRANSACTIONS: 'starconnect_transactions_db',
  REFERRAL_SETTINGS: 'starconnect_referral_settings',
  VERIFICATION_SETTINGS: 'starconnect_verification_settings',
  FRIEND_REQUESTS: 'starconnect_friend_requests_db',
};

// Standard Star Packages
export const STAR_PACKAGES: StarPackage[] = [
  { id: 'pkg_1', starsCount: 50, priceBDT: 50, badge: 'Starter' },
  { id: 'pkg_2', starsCount: 250, priceBDT: 230, badge: 'Bronze Trust' },
  { id: 'pkg_3', starsCount: 600, priceBDT: 500, badge: 'Golden Pack (Best)' },
  { id: 'pkg_4', starsCount: 1300, priceBDT: 1000, badge: 'VIP Diamond' }
];

// Initial Data Bootstrap
const BOOTSTRAP_DATA = {
  currentUser: null as UserProfile | null,

  users: [
    {
      id: 'user_admin',
      name: 'StarConnect Admin',
      username: 'admin',
      phone: '01877722819',
      password: '123456',
      bio: 'StarConnect Official Admin Control Center. Committed to fostering a safe premium ecosystem for creators. 🛡️🔐',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      role: 'admin' as const,
      isVerified: true,
      isPremium: false,
      kycStatus: 'approved' as const,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      blockedUsers: [],
      starBalance: 999999,
      totalStarsEarned: 0,
      totalStarsSpent: 0,
      pendingBalanceStars: 0
    },
    {
      id: 'user_rifat',
      name: 'Rifat Al-Mamun',
      username: 'rifat',
      phone: '01712345678',
      email: 'rifat@starconnect.app',
      password: 'password123',
      bio: 'স্বাগতম! আমি রিফাত। এখানে আমার এক্সক্লুসিভ ট্রাভেল ভ্লগ এবং বাংলাদেশের বিভিন্ন জায়গার চমৎকার ল্যান্ডস্কেপ ফটোগ্রাফি পাবেন। 🌊⛰️📸',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      role: 'creator' as const,
      isVerified: true,
      isPremium: true,
      kycStatus: 'approved' as const,
      followersCount: 1420,
      followingCount: 180,
      postsCount: 2,
      createdAt: new Date().toISOString(),
      blockedUsers: [],
      starBalance: 0,
      totalStarsEarned: 24500,
      totalStarsSpent: 0,
      pendingBalanceStars: 0
    },
    {
      id: 'user_nusrat',
      name: 'Nusrat Jahan',
      username: 'nusrat',
      phone: '01812345678',
      email: 'nusrat@starconnect.app',
      password: 'password123',
      bio: 'ফ্যাশন ও লাইফস্টাইল ইনফ্লুয়েন্সার। এক্সক্লুসিভ স্টাইল টিপস, মেকআপ টিউটোরিয়াল এবং পর্দার পিছনের মেকিং ভিডিও বা ফটো নিয়মিত দেখতে সাবস্ক্রাইব করুন! 💃🌸✨',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80',
      role: 'creator' as const,
      isVerified: true,
      isPremium: true,
      kycStatus: 'approved' as const,
      followersCount: 3820,
      followingCount: 220,
      postsCount: 2,
      createdAt: new Date().toISOString(),
      blockedUsers: [],
      starBalance: 0,
      totalStarsEarned: 48900,
      totalStarsSpent: 0,
      pendingBalanceStars: 0
    },
    {
      id: 'user_ayman_hq',
      name: 'Dr. Ayman Sadiq',
      username: 'ayman_hq',
      phone: '01912345678',
      email: 'ayman_hq@starconnect.app',
      password: 'password123',
      bio: 'নতুন কিছু শিখুন প্রতিদিন। ক্যারিয়ার গাইডলাইন, মেন্টরশিপ ও সফল ক্যারিয়ার গড়ার সেরা টেকনিকগুলো পেতে স্টার দিয়ে প্রিমিয়াম কন্টেন্টগুলো আনলক করুন! 📚🎓💻',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      role: 'creator' as const,
      isVerified: true,
      isPremium: true,
      kycStatus: 'approved' as const,
      followersCount: 9550,
      followingCount: 310,
      postsCount: 2,
      createdAt: new Date().toISOString(),
      blockedUsers: [],
      starBalance: 0,
      totalStarsEarned: 110400,
      totalStarsSpent: 0,
      pendingBalanceStars: 0
    }
  ] as UserProfile[],

  posts: [
    {
      id: 'seed_post_1',
      authorId: 'user_rifat',
      authorName: 'Rifat Al-Mamun',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      authorIsVerified: true,
      title: 'সাজেকের মেঘময় সকাল! 🌄⛰️',
      content: 'আজকের সূর্যোদয় দেখতে অসাধারণ লাগছিল। মেঘের সমুদ্র যেন চারপাশ ঘিরে আছে। আপনাদের কার সাজেক ভালো লাগে? কমেন্ট করে জানান!',
      mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image' as const,
      category: 'Photography',
      tags: ['Sajek', 'Travel', 'Photography'],
      isReel: false,
      likesCount: 142,
      commentsCount: 3,
      sharesCount: 12,
      likedBy: [],
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      isPremiumPost: false,
      starPrice: 0,
      unlockedByUserIds: []
    },
    {
      id: 'seed_post_2',
      authorId: 'user_rifat',
      authorName: 'Rifat Al-Mamun',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      authorIsVerified: true,
      title: 'বান্দরবানের নীলগিরি যাওয়ার পথে এক সুন্দর লুকানো ঝর্ণা! 💧🗺️',
      content: 'এই এক্সক্লুসিভ ঝর্ণার সঠিক লোকেশন এবং নিখুঁত ট্রাভেল গাইড শুধুমাত্র আমার প্রিমিয়াম স্পন্সরদের জন্য। নিচে স্টার বাটন দিয়ে লক কন্টেন্টটি আনলক করুন!',
      mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image' as const,
      category: 'Premium',
      tags: ['Waterfall', 'Travel_Guide', 'Premium'],
      isReel: false,
      likesCount: 96,
      commentsCount: 2,
      sharesCount: 8,
      likedBy: [],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      isPremiumPost: true,
      starPrice: 30,
      unlockedByUserIds: []
    },
    {
      id: 'seed_post_3',
      authorId: 'user_nusrat',
      authorName: 'Nusrat Jahan',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      authorIsVerified: true,
      title: 'আজকের ট্র্যাডিশনাল লুক কেমন হয়েছে বলুন? 🌸✨',
      content: 'শাড়ি পরলে বাঙালি মেয়েদের সবসময়ই একটু অন্যরকম লাগে। শাড়িটি নিয়েছি দেশীয় একটি বুটিক হাউজ থেকে। লাইক দিন এবং কমেন্টে জানান কেমন লেগেছে!',
      mediaUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image' as const,
      category: 'Fashion',
      tags: ['Saree', 'OOTD', 'Traditional'],
      isReel: false,
      likesCount: 354,
      commentsCount: 5,
      sharesCount: 25,
      likedBy: [],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      isPremiumPost: false,
      starPrice: 0,
      unlockedByUserIds: []
    },
    {
      id: 'seed_post_4',
      authorId: 'user_nusrat',
      authorName: 'Nusrat Jahan',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      authorIsVerified: true,
      title: 'আমার ব্রাইডাল ফটোশুটের মেকআপ টিউটোরিয়াল (BTS HD) 💄📸',
      content: 'এই এক্সক্লুসিভ ব্রাইডাল ফটোশুটের মেকআপ টিউটোরিয়াল এবং পর্দার পিছনের ভিডিও শুধুমাত্র আমার প্রিমিয়াম সাবস্ক্রাইবার ও স্টার সাপোর্টারদের জন্য। জলদি আনলক করুন!',
      mediaUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image' as const,
      category: 'Premium',
      tags: ['Makeup', 'Bridal', 'Premium'],
      isReel: false,
      likesCount: 184,
      commentsCount: 1,
      sharesCount: 14,
      likedBy: [],
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      isPremiumPost: true,
      starPrice: 50,
      unlockedByUserIds: []
    },
    {
      id: 'seed_post_5',
      authorId: 'user_ayman_hq',
      authorName: 'Dr. Ayman Sadiq',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
      authorIsVerified: true,
      title: 'সফল ক্যারিয়ার গড়ার ৩টি সোনালী নিয়ম! 🎯📚',
      content: '১. নিজের কাজের প্রতি গভীর ভালোবাসা,\n২. প্রতিনিয়ত নতুন টেকনিক ও স্কিল অর্জন,\n৩. স্ট্রং নেটওয়ার্কিং বৃদ্ধি করা।\nআপনার কাছে কোনটি সবচেয়ে গুরুত্বপূর্ণ মনে হয়? নিচে কমেন্ট করুন!',
      mediaUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image' as const,
      category: 'Education',
      tags: ['CareerTips', 'SuccessRules', 'Education'],
      isReel: false,
      likesCount: 812,
      commentsCount: 11,
      sharesCount: 120,
      likedBy: [],
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      isPremiumPost: false,
      starPrice: 0,
      unlockedByUserIds: []
    },
    {
      id: 'seed_post_6',
      authorId: 'user_ayman_hq',
      authorName: 'Dr. Ayman Sadiq',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
      authorIsVerified: true,
      title: 'ফ্রিল্যান্সিং ও টেক জবে সফল হওয়ার মাস্টার ক্লাস 💻🚀',
      content: '২০২৬ সালে গ্লোবাল ফ্রিল্যান্সিং ও টেক ইন্ডাস্ট্রির ডিমান্ডগুলো বুঝতে এবং একটি রোডম্যাপ পেতে আমার তৈরি এক্সক্লুসিভ ভিডিও সেশন ও রুলবুক এখনই আনলক করুন!',
      mediaUrl: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image' as const,
      category: 'Premium',
      tags: ['Freelancing', 'Masterclass', 'Premium'],
      isReel: false,
      likesCount: 423,
      commentsCount: 8,
      sharesCount: 65,
      likedBy: [],
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      isPremiumPost: true,
      starPrice: 100,
      unlockedByUserIds: []
    }
  ] as Post[],

  comments: [] as Comment[],

  chats: [] as Chat[],

  messages: [] as Message[],

  stories: [] as Story[],

  reports: [] as Report[],

  notifications: [] as NotificationItem[],

  withdrawals: [] as WithdrawalRequest[],

  transactions: [] as TransactionItem[],
  friendRequests: [] as FriendRequest[],

  referralSettings: {
    isEnabled: true,
    signupBonusStars: 10,
    purchaseCommissionPercent: 10
  } as ReferralSettings,
  verificationSettings: {
    isEnabled: true,
    verificationCostStars: 100,
    verificationCostBDT: 150,
    isAutoReferEnabled: true,
    minReferralsForAutoVerify: 30
  } as VerificationSettings
};

class StarConnectDatabaseService {
  private cache: typeof BOOTSTRAP_DATA;
  private db: Firestore | null = null;
  private isFirebaseReady = false;
  public firebaseAuthError: string | null = null;

  private cleanForFirestore<T>(obj: T): T {
    if (obj === undefined || obj === null) return obj;
    return JSON.parse(JSON.stringify(obj)) as T;
  }

  constructor() {
    this.cache = this.loadFromStorage();
    
    // Ensure the admin user is always in the cache with the correct, updated information
    const adminTemplate = BOOTSTRAP_DATA.users.find(u => u.id === 'user_admin');
    if (adminTemplate) {
      const existingAdminIdx = this.cache.users.findIndex(u => u.id === 'user_admin');
      if (existingAdminIdx !== -1) {
        this.cache.users[existingAdminIdx] = {
          ...this.cache.users[existingAdminIdx],
          phone: adminTemplate.phone,
          password: adminTemplate.password,
          role: 'admin',
          username: adminTemplate.username,
          name: adminTemplate.name
        };
      } else {
        this.cache.users.push(adminTemplate);
      }
      this.sync();
    }

    this.initFirebase();
  }

  getAuthError(): string | null {
    return this.firebaseAuthError;
  }

  private signInAnon(auth: Auth) {
    signInAnonymously(auth).then((cred) => {
      this.isFirebaseReady = true;
      this.firebaseAuthError = null;
      console.log("StarConnect Real Firestore Connected & Authenticated (Anonymous):", cred.user.uid);
      
      const me = this.cache.currentUser;
      if (me && this.db) {
        setDoc(doc(this.db, 'users', me.id), this.cleanForFirestore(me)).catch(console.warn);
      }
      this.syncFromFirestore();
    }).catch(err => {
      this.firebaseAuthError = err.code || err.message || String(err);
      console.warn("[Firebase Authentication Info] Anonymous auth provider is disabled or not fully configured in your Firebase Console. fallback local database active.", err);
    });
  }

  private initFirebase() {
    try {
      if (firebaseConfig && firebaseConfig.projectId) {
        const app = initializeApp(firebaseConfig);
        
        let dbId = (firebaseConfig as any).firestoreDatabaseId;
        // Only use the custom workspace database ID if the loaded project is the default platform sandbox.
        // For custom user projects (like dept-38c4f), use the standard "(default)" database.
        if (!dbId && firebaseConfig.projectId && firebaseConfig.projectId.startsWith("gen-lang-client-")) {
          dbId = "ai-studio-5323cef6-5f3f-4344-b8c8-63efded4ec36";
        }
        this.db = dbId ? getFirestore(app, dbId) : getFirestore(app);
        
        const auth = getAuth(app);
        const me = this.cache.currentUser;

        if (me && me.email && me.password) {
          const loginEmail = me.email.includes('@') ? me.email.trim() : `${me.phone.trim()}@starconnect.app`;
          signInWithEmailAndPassword(auth, loginEmail, me.password).then((cred) => {
            this.isFirebaseReady = true;
            this.firebaseAuthError = null;
            console.log("StarConnect Authentic Multi-device Session Connected:", cred.user.uid);
            
            // Re-sync local with Firestore
            this.syncFromFirestore();
          }).catch(err => {
            console.warn("Cached user auto-signin failed, checking anonymous fallback:", err);
            this.signInAnon(auth);
          });
        } else {
          this.signInAnon(auth);
        }
      }
    } catch (e) {
      console.warn("Operating in local database model fallback.", e);
    }
  }

  private rebuildChatsFromMessages() {
    const me = this.cache.currentUser;
    if (!me) return;

    // Group messages by chatId
    const chatMap = new Map<string, Message[]>();
    this.cache.messages.forEach(m => {
      if (!chatMap.has(m.chatId)) {
        chatMap.set(m.chatId, []);
      }
      chatMap.get(m.chatId)!.push(m);
    });

    chatMap.forEach((msgs, chatId) => {
      if (msgs.length === 0) return;
      const first = msgs[0];
      const participants = [first.senderId, first.receiverId];
      if (!participants.includes(me.id)) return; // not our chat

      // Sort messages by date
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const lastMsg = msgs[msgs.length - 1];

      // Calculate unread count for us
      const unreadCount: { [userId: string]: number } = {};
      participants.forEach(pId => {
        unreadCount[pId] = 0;
      });
      msgs.forEach(m => {
        if (!m.isRead) {
          unreadCount[m.receiverId] = (unreadCount[m.receiverId] || 0) + 1;
        }
      });

      // Check if existing
      const existingIdx = this.cache.chats.findIndex(c => c.id === chatId);
      const isPaidChatEnabled = this.cache.chats[existingIdx]?.isPaidChatEnabled || false;
      const starRatePerMessage = this.cache.chats[existingIdx]?.starRatePerMessage || 0;

      const chatObj = {
        id: chatId,
        participants,
        lastMessage: lastMsg.mediaType === 'star_gift' ? `🎁 ${lastMsg.starGiftAmount} Stars Gift!` : lastMsg.content,
        lastMessageAt: lastMsg.createdAt,
        unreadCount,
        isPaidChatEnabled,
        starRatePerMessage
      };

      if (existingIdx !== -1) {
        this.cache.chats[existingIdx] = chatObj;
      } else {
        this.cache.chats.push(chatObj);
      }
    });
  }

  public async syncFromFirestore() {
    if (!this.isFirebaseReady || !this.db) return;
    try {
      // Sync Users
      let remoteUserCount = 0;
      try {
        const usersSnap = await getDocs(collection(this.db, 'users'));
        remoteUserCount = usersSnap.size;
        usersSnap.forEach(d => {
          const u = d.data() as UserProfile;
          const idx = this.cache.users.findIndex(item => item.id === u.id);
          if (idx !== -1) {
            // Keep the password and other local configurations if remote does not have it
            this.cache.users[idx] = { ...this.cache.users[idx], ...u };
          } else {
            this.cache.users.push(u);
          }
        });
      } catch (err) {
        console.warn("Users sync issue:", err);
      }

      // Sync Posts
      try {
        const postsSnap = await getDocs(collection(this.db, 'posts'));
        postsSnap.forEach(d => {
          const p = d.data() as Post;
          const idx = this.cache.posts.findIndex(item => item.id === p.id);
          if (idx !== -1) {
            this.cache.posts[idx] = { ...this.cache.posts[idx], ...p };
          } else {
            this.cache.posts.push(p);
          }
        });
      } catch (err) {
        console.warn("Posts sync issue:", err);
      }

      // Seed initial data if Firestore database is completely empty/unseeded
      // But verify we don't duplicate or overwrite already uploaded posts
      if (remoteUserCount === 0) {
        await this.seedInitialDataIfEmpty();
      }

      // Sync Follows
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('follow_')) {
            localStorage.setItem(key, 'false');
          }
        }
        const followsSnap = await getDocs(collection(this.db, 'follows'));
        followsSnap.forEach(d => {
          const f = d.data();
          if (f.id && f.followerId && f.followingId) {
            localStorage.setItem(`follow_${f.followerId}_${f.followingId}`, 'true');
          }
        });
      } catch (err) {
        console.warn("Follows catchup issue:", err);
      }

      // Sync Messages
      try {
        const messagesSnap = await getDocs(collection(this.db, 'messages'));
        const fetchedMessages: Message[] = [];
        messagesSnap.forEach(d => {
          const m = d.data() as Message;
          fetchedMessages.push(m);
        });
        if (fetchedMessages.length > 0) {
          const combined = [...this.cache.messages, ...fetchedMessages];
          const uniqueMap = new Map<string, Message>();
          combined.forEach(m => uniqueMap.set(m.id, m));
          this.cache.messages = Array.from(uniqueMap.values());
        }
      } catch (err) {
        console.warn("Messages catchup issue:", err);
      }

      // Sync Friend Requests
      try {
        const frSnap = await getDocs(collection(this.db, 'friend_requests'));
        const fetchedFRs: FriendRequest[] = [];
        frSnap.forEach(d => {
          fetchedFRs.push(d.data() as FriendRequest);
        });
        if (fetchedFRs.length > 0) {
          const combined = [...this.cache.friendRequests, ...fetchedFRs];
          const uniqueMap = new Map<string, FriendRequest>();
          combined.forEach(m => uniqueMap.set(m.id, m));
          this.cache.friendRequests = Array.from(uniqueMap.values());
        }
      } catch (err) {
        console.warn("Friend requests catchup issue:", err);
      }

      this.rebuildChatsFromMessages();
      this.sync();
      window.dispatchEvent(new CustomEvent('starconnect_db_update'));

      // Set up real-time snapshot listeners for friend requests
      onSnapshot(collection(this.db, 'friend_requests'), (snapshot) => {
        const updatedFRs: FriendRequest[] = [];
        snapshot.forEach(doc => {
          updatedFRs.push(doc.data() as FriendRequest);
        });
        if (updatedFRs.length > 0) {
          const combined = [...this.cache.friendRequests, ...updatedFRs];
          const uniqueMap = new Map<string, FriendRequest>();
          combined.forEach(fr => uniqueMap.set(fr.id, fr));
          this.cache.friendRequests = Array.from(uniqueMap.values());
          this.sync();
          window.dispatchEvent(new CustomEvent('starconnect_db_update'));
        }
      }, (err) => {
        console.warn("Firestore friend_requests snapshot listener error: ", err);
      });

      // Set up real-time snapshot listeners for messages so chat is responsive and fast
      onSnapshot(collection(this.db, 'messages'), (snapshot) => {
        const updatedMsgs: Message[] = [];
        snapshot.forEach(doc => {
          updatedMsgs.push(doc.data() as Message);
        });
        if (updatedMsgs.length > 0) {
          const combined = [...this.cache.messages, ...updatedMsgs];
          const uniqueMap = new Map<string, Message>();
          combined.forEach(m => uniqueMap.set(m.id, m));
          this.cache.messages = Array.from(uniqueMap.values());
          this.rebuildChatsFromMessages();
          this.sync();
          window.dispatchEvent(new CustomEvent('starconnect_db_update'));
        }
      }, (err) => {
        console.warn("Firestore messages snapshot listener error: ", err);
      });

      // Set up real-time snapshot listeners for follows to keep following values accurate
      onSnapshot(collection(this.db, 'follows'), (snapshot) => {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('follow_')) {
            localStorage.setItem(key, 'false');
          }
        }
        snapshot.forEach(doc => {
          const f = doc.data();
          if (f.followerId && f.followingId) {
            localStorage.setItem(`follow_${f.followerId}_${f.followingId}`, 'true');
          }
        });
        this.sync();
        window.dispatchEvent(new CustomEvent('starconnect_db_update'));
      }, (err) => {
        console.warn("Firestore follows snapshot listener error: ", err);
      });

      // Set up real-time snapshot listeners for users to get live updates of follow counts/stars/verifications
      onSnapshot(collection(this.db, 'users'), (snapshot) => {
        snapshot.forEach(doc => {
          const u = doc.data() as UserProfile;
          const idx = this.cache.users.findIndex(item => item.id === u.id);
          if (idx !== -1) {
            this.cache.users[idx] = { ...this.cache.users[idx], ...u };
          } else {
            this.cache.users.push(u);
          }
          if (this.cache.currentUser && u.id === this.cache.currentUser.id) {
            this.cache.currentUser = { ...this.cache.currentUser, ...u };
          }
        });
        this.sync();
        window.dispatchEvent(new CustomEvent('starconnect_db_update'));
      }, (err) => {
        console.warn("Firestore users snapshot listener error: ", err);
      });

      // Set up real-time snapshot listeners for posts to keep feed updated live
      onSnapshot(collection(this.db, 'posts'), (snapshot) => {
        snapshot.forEach(doc => {
          const p = doc.data() as Post;
          const idx = this.cache.posts.findIndex(item => item.id === p.id);
          if (idx !== -1) {
            this.cache.posts[idx] = { ...this.cache.posts[idx], ...p };
          } else {
            this.cache.posts.push(p);
          }
        });
        // Keep feed sorted by latest date
        this.cache.posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.sync();
        window.dispatchEvent(new CustomEvent('starconnect_db_update'));
      }, (err) => {
        console.warn("Firestore posts snapshot listener error: ", err);
      });

    } catch (err) {
      console.warn("Error running Firestore collections catchup:", err);
    }
  }

  private async seedInitialDataIfEmpty() {
    if (!this.isFirebaseReady || !this.db) return;
    try {
      console.log("Seeding beautiful initial Bangladeshi creators and posts to Firestore...");
      
      const seedUsers: UserProfile[] = [
        {
          id: 'user_rifat',
          name: 'Rifat Al-Mamun',
          username: 'rifat',
          phone: '01712345678',
          email: 'rifat@starconnect.app',
          password: 'password123',
          bio: 'স্বাগতম! আমি রিফাত। এখানে আমার এক্সক্লুসিভ ট্রাভেল ভ্লগ এবং বাংলাদেশের বিভিন্ন জায়গার চমৎকার ল্যান্ডস্কেপ ফটোগ্রাফি পাবেন। 🌊⛰️📸',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          role: 'creator',
          isVerified: true,
          isPremium: true,
          kycStatus: 'approved',
          followersCount: 1420,
          followingCount: 180,
          postsCount: 2,
          createdAt: new Date().toISOString(),
          blockedUsers: [],
          starBalance: 0,
          totalStarsEarned: 24500,
          totalStarsSpent: 0,
          pendingBalanceStars: 0
        },
        {
          id: 'user_nusrat',
          name: 'Nusrat Jahan',
          username: 'nusrat',
          phone: '01812345678',
          email: 'nusrat@starconnect.app',
          password: 'password123',
          bio: 'ফ্যাশন ও লাইফস্টাইল ইনফ্লুয়েন্সার। এক্সক্লুসিভ স্টাইল টিপস, মেকআপ টিউটোরিয়াল এবং পর্দার পিছনের মেকিং ভিডিও বা ফটো নিয়মিত দেখতে সাবস্ক্রাইব করুন! 💃🌸✨',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80',
          role: 'creator',
          isVerified: true,
          isPremium: true,
          kycStatus: 'approved',
          followersCount: 3820,
          followingCount: 220,
          postsCount: 2,
          createdAt: new Date().toISOString(),
          blockedUsers: [],
          starBalance: 0,
          totalStarsEarned: 48900,
          totalStarsSpent: 0,
          pendingBalanceStars: 0
        },
        {
          id: 'user_ayman_hq',
          name: 'Dr. Ayman Sadiq',
          username: 'ayman_hq',
          phone: '01912345678',
          email: 'ayman_hq@starconnect.app',
          password: 'password123',
          bio: 'নতুন কিছু শিখুন প্রতিদিন। ক্যারিয়ার গাইডলাইন, মেন্টরশিপ ও সফল ক্যারিয়ার গড়ার সেরা টেকনিকগুলো পেতে স্টার দিয়ে প্রিমিয়াম কন্টেন্টগুলো আনলক করুন! 📚🎓💻',
          avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
          role: 'creator',
          isVerified: true,
          isPremium: true,
          kycStatus: 'approved',
          followersCount: 9550,
          followingCount: 310,
          postsCount: 2,
          createdAt: new Date().toISOString(),
          blockedUsers: [],
          starBalance: 0,
          totalStarsEarned: 110400,
          totalStarsSpent: 0,
          pendingBalanceStars: 0
        }
      ];

      const seedPosts: Post[] = [
        {
          id: 'seed_post_1',
          authorId: 'user_rifat',
          authorName: 'Rifat Al-Mamun',
          authorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          authorIsVerified: true,
          title: 'সাজেকের মেঘময় সকাল! 🌄⛰️',
          content: 'আজকের সূর্যোদয় দেখতে অসাধারণ লাগছিল। মেঘের সমুদ্র যেন চারপাশ ঘিরে আছে। আপনাদের কার সাজেক ভালো লাগে? কমেন্ট করে জানান!',
          mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          mediaType: 'image',
          category: 'Photography',
          tags: ['Sajek', 'Travel', 'Photography'],
          isReel: false,
          likesCount: 142,
          commentsCount: 3,
          sharesCount: 12,
          likedBy: [],
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          isPremiumPost: false,
          starPrice: 0,
          unlockedByUserIds: []
        },
        {
          id: 'seed_post_2',
          authorId: 'user_rifat',
          authorName: 'Rifat Al-Mamun',
          authorAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          authorIsVerified: true,
          title: 'বান্দরবানের নীলগিরি যাওয়ার পথে এক সুন্দর লুকানো ঝর্ণা! 💧🗺️',
          content: 'এই এক্সক্লুসিভ ঝর্ণার সঠিক লোকেশন এবং নিখুঁত ট্রাভেল গাইড শুধুমাত্র আমার প্রিমিয়াম স্পন্সরদের জন্য। নিচে স্টার বাটন দিয়ে লক কন্টেন্টটি আনলক করুন!',
          mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
          mediaType: 'image',
          category: 'Premium',
          tags: ['Waterfall', 'Travel_Guide', 'Premium'],
          isReel: false,
          likesCount: 96,
          commentsCount: 2,
          sharesCount: 8,
          likedBy: [],
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          isPremiumPost: true,
          starPrice: 30,
          unlockedByUserIds: []
        },
        {
          id: 'seed_post_3',
          authorId: 'user_nusrat',
          authorName: 'Nusrat Jahan',
          authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          authorIsVerified: true,
          title: 'আজকের ট্র্যাডিশনাল লুক কেমন হয়েছে বলুন? 🌸✨',
          content: 'শাড়ি পরলে বাঙালি মেয়েদের সবসময়ই একটু অন্যরকম লাগে। শাড়িটি নিয়েছি দেশীয় একটি বুটিক হাউজ থেকে। লাইক দিন এবং কমেন্টে জানান কেমন লেগেছে!',
          mediaUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
          mediaType: 'image',
          category: 'Fashion',
          tags: ['Saree', 'OOTD', 'Traditional'],
          isReel: false,
          likesCount: 354,
          commentsCount: 5,
          sharesCount: 25,
          likedBy: [],
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          isPremiumPost: false,
          starPrice: 0,
          unlockedByUserIds: []
        },
        {
          id: 'seed_post_4',
          authorId: 'user_nusrat',
          authorName: 'Nusrat Jahan',
          authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          authorIsVerified: true,
          title: 'আমার ব্রাইডাল ফটোশুটের মেকআপ টিউটোরিয়াল (BTS HD) 💄📸',
          content: 'এই এক্সক্লুসিভ ব্রাইডাল ফটোশুটের মেকআপ টিউটোরিয়াল এবং পর্দার পিছনের ভিডিও শুধুমাত্র আমার প্রিমিয়াম সাবস্ক্রাইবার ও স্টার সাপোর্টারদের জন্য। জলদি আনলক করুন!',
          mediaUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
          mediaType: 'image',
          category: 'Premium',
          tags: ['Makeup', 'Bridal', 'Premium'],
          isReel: false,
          likesCount: 184,
          commentsCount: 1,
          sharesCount: 14,
          likedBy: [],
          createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
          isPremiumPost: true,
          starPrice: 50,
          unlockedByUserIds: []
        },
        {
          id: 'seed_post_5',
          authorId: 'user_ayman_hq',
          authorName: 'Dr. Ayman Sadiq',
          authorAvatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
          authorIsVerified: true,
          title: 'সফল ক্যারিয়ার গড়ার ৩টি সোনালী নিয়ম! 🎯📚',
          content: '১. নিজের কাজের প্রতি গভীর ভালোবাসা,\n২. প্রতিনিয়ত নতুন টেকনিক ও স্কিল অর্জন,\n৩. স্ট্রং নেটওয়ার্কিং বৃদ্ধি করা।\nআপনার কাছে কোনটি সবচেয়ে গুরুত্বপূর্ণ মনে হয়? নিচে কমেন্ট করুন!',
          mediaUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
          mediaType: 'image',
          category: 'Education',
          tags: ['CareerTips', 'SuccessRules', 'Education'],
          isReel: false,
          likesCount: 812,
          commentsCount: 11,
          sharesCount: 120,
          likedBy: [],
          createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
          isPremiumPost: false,
          starPrice: 0,
          unlockedByUserIds: []
        },
        {
          id: 'seed_post_6',
          authorId: 'user_ayman_hq',
          authorName: 'Dr. Ayman Sadiq',
          authorAvatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
          authorIsVerified: true,
          title: 'ফ্রিল্যান্সিং ও টেক জবে সফল হওয়ার মাস্টার ক্লাস 💻🚀',
          content: '২০২৬ সালে গ্লোবাল ফ্রিল্যান্সিং ও টেক ইন্ডাস্ট্রির ডিমান্ডগুলো বুঝতে এবং একটি রোডম্যাপ পেতে আমার তৈরি এক্সক্লুসিভ ভিডিও সেশন ও রুলবুক এখনই আনলক করুন!',
          mediaUrl: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80',
          mediaType: 'image',
          category: 'Premium',
          tags: ['Freelancing', 'Masterclass', 'Premium'],
          isReel: false,
          likesCount: 423,
          commentsCount: 8,
          sharesCount: 65,
          likedBy: [],
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          isPremiumPost: true,
          starPrice: 100,
          unlockedByUserIds: []
        }
      ];

      for (const u of seedUsers) {
        const idx = this.cache.users.findIndex(x => x.id === u.id);
        if (idx === -1) {
          this.cache.users.push(u);
        } else {
          this.cache.users[idx] = { ...this.cache.users[idx], ...u };
        }
        await setDoc(doc(this.db, 'users', u.id), this.cleanForFirestore(u)).catch(console.warn);
      }

      for (const p of seedPosts) {
        const idx = this.cache.posts.findIndex(x => x.id === p.id);
        if (idx === -1) {
          this.cache.posts.push(p);
        } else {
          this.cache.posts[idx] = { ...this.cache.posts[idx], ...p };
        }
        await setDoc(doc(this.db, 'posts', p.id), this.cleanForFirestore(p)).catch(console.warn);
      }

      this.cache.posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.sync();
    } catch (e) {
      console.warn("Seeding failed or exception triggered:", e);
    }
  }

  async fetchCommentsFromFirestore(postId: string): Promise<Comment[]> {
    if (!this.isFirebaseReady || !this.db) {
      return this.getComments(postId);
    }
    try {
      const q = collection(this.db, 'posts', postId, 'comments');
      
      // Set a robust timeout to prevent any cloud hang blocking the user interface
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 1500)
      );

      const snapshot = await Promise.race([
        getDocs(q),
        timeoutPromise
      ]) as any;

      const list: Comment[] = [];
      snapshot.forEach((d: any) => {
        const c = d.data() as Comment;
        list.push(c);
        
        // Populate local cache copy if missing
        if (!this.cache.comments.some(x => x.id === c.id)) {
          this.cache.comments.push(c);
        }
      });
      this.sync();
      return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (err) {
      console.warn("Exception/Timeout during Comments download from Firestore:", err);
      return this.getComments(postId);
    }
  }

  private loadFromStorage(): typeof BOOTSTRAP_DATA {
    const data: any = {};
    try {
      const uCurrent = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const uAll = localStorage.getItem(STORAGE_KEYS.USERS);
      const posts = localStorage.getItem(STORAGE_KEYS.POSTS);
      const comments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      const messages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const chats = localStorage.getItem(STORAGE_KEYS.CHATS);
      const stories = localStorage.getItem(STORAGE_KEYS.STORIES);
      const reports = localStorage.getItem(STORAGE_KEYS.REPORTS);
      const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const withdrawals = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
      const transactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const referralSettings = localStorage.getItem(STORAGE_KEYS.REFERRAL_SETTINGS);
      const verificationSettings = localStorage.getItem(STORAGE_KEYS.VERIFICATION_SETTINGS);
      const friendRequests = localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS);
 
      data.currentUser = uCurrent && uCurrent !== 'null' ? JSON.parse(uCurrent) : null;
      
      const parsedUsers = uAll ? JSON.parse(uAll) : [];
      data.users = parsedUsers.length > 1 ? parsedUsers : BOOTSTRAP_DATA.users;
      
      const parsedPosts = posts ? JSON.parse(posts) : [];
      data.posts = parsedPosts.length > 0 ? parsedPosts : BOOTSTRAP_DATA.posts;
      
      data.comments = comments ? JSON.parse(comments) : BOOTSTRAP_DATA.comments;
      data.messages = messages ? JSON.parse(messages) : BOOTSTRAP_DATA.messages;
      data.chats = chats ? JSON.parse(chats) : BOOTSTRAP_DATA.chats;
      data.stories = stories ? JSON.parse(stories) : BOOTSTRAP_DATA.stories;
      data.reports = reports ? JSON.parse(reports) : BOOTSTRAP_DATA.reports;
      data.notifications = notifications ? JSON.parse(notifications) : BOOTSTRAP_DATA.notifications;
      data.withdrawals = withdrawals ? JSON.parse(withdrawals) : BOOTSTRAP_DATA.withdrawals;
      data.transactions = transactions ? JSON.parse(transactions) : BOOTSTRAP_DATA.transactions;
      data.referralSettings = referralSettings ? JSON.parse(referralSettings) : BOOTSTRAP_DATA.referralSettings;
      data.verificationSettings = verificationSettings ? JSON.parse(verificationSettings) : BOOTSTRAP_DATA.verificationSettings;
      data.friendRequests = friendRequests ? JSON.parse(friendRequests) : BOOTSTRAP_DATA.friendRequests;
      
      if (!uCurrent) this.saveToStorage(data);
      return data as typeof BOOTSTRAP_DATA;
    } catch (e) {
      return BOOTSTRAP_DATA;
    }
  }

  private saveToStorage(data: typeof BOOTSTRAP_DATA) {
    try {
      if (data.currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(data.posts));
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(data.comments));
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages));
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(data.chats));
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(data.stories));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(data.reports));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(data.withdrawals));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      localStorage.setItem(STORAGE_KEYS.REFERRAL_SETTINGS, JSON.stringify(data.referralSettings));
      if (data.verificationSettings) {
        localStorage.setItem(STORAGE_KEYS.VERIFICATION_SETTINGS, JSON.stringify(data.verificationSettings));
      }
      localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(data.friendRequests));
    } catch (e: any) {
      console.error("[Storage Quota Info] Local storage exceeded 5MB limit or threw an exception:", e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("Warning: Your browser local storage (5MB) is full! This may be due to uploading large images or video assets.");
      }
    }
  }

  private sync() {
    this.saveToStorage(this.cache);
  }

  // --- Auth & Users ---
  getCurrentUser(): UserProfile | null {
    return this.cache.currentUser;
  }

  getUsers(): UserProfile[] {
    return this.cache.users;
  }

  getUserById(userId: string): UserProfile | undefined {
    return this.cache.users.find(u => u.id === userId);
  }

  private isSamePhone(p1: string, p2: string): boolean {
    const clean = (p: string) => p.replace(/\D/g, '');
    const c1 = clean(p1);
    const c2 = clean(p2);
    if (!c1 || !c2) return false;
    
    // Support Bangladeshi phone formats (+88018..., 88018..., 018...) by comparing the last 10 digits
    if (c1.length >= 10 && c2.length >= 10) {
      return c1.slice(-10) === c2.slice(-10);
    }
    
    return c1 === c2 || c1.endsWith(c2) || c2.endsWith(c1);
  }

  async signupUser(name: string, phone: string, email: string, password: string, role: 'user' | 'creator' = 'user', referrerCodeInput?: string): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    
    // Check if duplicate phone exists in cache
    let existingLocal = this.cache.users.find(u => this.isSamePhone(u.phone, trimmedPhone));
    
    // Double check Firestore if not in cache yet
    if (!existingLocal && this.isFirebaseReady && this.db) {
      try {
        const q = query(collection(this.db, 'users'), where('phone', '==', trimmedPhone));
        const snap = await getDocs(q);
        if (!snap.empty) {
          existingLocal = snap.docs[0].data() as UserProfile;
          this.cache.users.push(existingLocal);
          this.sync();
        }
      } catch (e) {
        console.warn("Direct Firestore look-up error on signup check:", e);
      }
    }

    if (existingLocal) {
      return { success: false, error: 'This phone number is already registered under another account!' };
    }

    // Check referral code if provided
    let referredByUser: UserProfile | undefined;
    const refCodeClean = referrerCodeInput ? referrerCodeInput.trim().toLowerCase() : '';
    if (refCodeClean) {
      referredByUser = this.cache.users.find(u => 
        (u.username && u.username.toLowerCase() === refCodeClean) || 
        (u.referralCode && u.referralCode.toLowerCase() === refCodeClean)
      );
      if (!referredByUser) {
        return { success: false, error: 'Invalid referral code! Please enter a correct code or leave the input field empty.' };
      }
    }

    let uid = 'user_' + Math.random().toString(36).substr(2, 9);
    
    // Attempt real Firebase Email/Password Auth registration
    if (firebaseConfig && firebaseConfig.projectId) {
      try {
        const auth = getAuth();
        const virtualEmail = `${trimmedPhone}@starconnect.app`;
        const cred = await createUserWithEmailAndPassword(auth, virtualEmail, password);
        if (cred && cred.user) {
          uid = cred.user.uid;
          this.isFirebaseReady = true;
          this.firebaseAuthError = null;
          console.log("Firebase Auth account created successfully for", trimmedPhone, uid);
        }
      } catch (authErr: any) {
        console.warn("Firebase email/password signup registration exception or warning:", authErr);
        if (authErr.code === 'auth/email-already-in-use') {
          return { success: false, error: 'This phone number is already registered under another account! Please log in instead.' };
        } else if (authErr.code === 'auth/weak-password') {
          return { success: false, error: 'Password is too weak! Try a stronger password (at least 6 characters).' };
        }
        // Fall back to generated local ID if the provider is disabled or config issues
        console.warn("Falling back to local ID due to Firebase configuration limitations");
      }
    }

    const username = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 100);
    const newUser: UserProfile = {
      id: uid,
      name: name.trim(),
      username,
      phone: trimmedPhone,
      email: trimmedEmail,
      password: password,
      bio: `Welcome to StarConnect! 🌟 (${role === 'creator' ? 'Creator Profile' : 'Member Profile'})`,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      coverUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
      role,
      isVerified: false,
      isPremium: role === 'creator',
      kycStatus: 'none',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      blockedUsers: [],
      starBalance: role === 'creator' ? 0 : 100, // starting balance
      totalStarsEarned: 0,
      totalStarsSpent: 0,
      pendingBalanceStars: 0,
      
      // Referral fields on signup
      referralCode: username,
      referredBy: referredByUser ? referredByUser.id : undefined,
      referralsCount: 0,
      totalReferralBonus: 0
    };

    // Credit bonus to the referrer if settings allow it
    const refSettings = this.cache.referralSettings || {
      isEnabled: true,
      signupBonusStars: 10,
      purchaseCommissionPercent: 10
    };

    if (referredByUser && refSettings.isEnabled && refSettings.signupBonusStars > 0) {
      referredByUser.starBalance = (referredByUser.starBalance || 0) + refSettings.signupBonusStars;
      referredByUser.totalStarsEarned = (referredByUser.totalStarsEarned || 0) + refSettings.signupBonusStars;
      referredByUser.referralsCount = (referredByUser.referralsCount || 0) + 1;
      referredByUser.totalReferralBonus = (referredByUser.totalReferralBonus || 0) + refSettings.signupBonusStars;

      // Auto-verification check on meeting referral milestone
      const verSettings = this.getVerificationSettings();
      if (
        verSettings.isAutoReferEnabled && 
        !referredByUser.isVerified && 
        referredByUser.referralsCount >= verSettings.minReferralsForAutoVerify
      ) {
        referredByUser.isVerified = true;
      }
      
      this.updateUserRecord(referredByUser);

      this.addTransaction(
        referredByUser.id, 
        'post_earn', 
        refSettings.signupBonusStars, 
        undefined, 
        uid, 
        `New member referral bonus (${newUser.name})`
      );

      this.addNotification(
        referredByUser.id, 
        'user_admin', 
        'StarConnect Referral', 
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 
        'stars_received', 
        `Congratulations! ${newUser.name} joined using your referral code. You earned ${refSettings.signupBonusStars} bonus stars! 🌟`
      );

      if (
        verSettings.isAutoReferEnabled && 
        referredByUser.isVerified && 
        referredByUser.referralsCount === verSettings.minReferralsForAutoVerify
      ) {
        this.addNotification(
          referredByUser.id, 
          'user_admin', 
          'StarConnect Verification', 
          'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 
          'kyc_update', 
          `Congratulations! You have successfully completed ${verSettings.minReferralsForAutoVerify} referrals. Your account is now automatically Verified! 🌟✔️`
        );
      }

      // Save updated referrer to Firestore if online
      if (this.isFirebaseReady && this.db) {
        setDoc(doc(this.db, 'users', referredByUser.id), this.cleanForFirestore(referredByUser)).catch(console.warn);
      }
    }

    this.cache.users.push(newUser);
    this.cache.currentUser = newUser;
    this.sync();

    // Firestore Sync
    if (this.isFirebaseReady && this.db) {
      await setDoc(doc(this.db, 'users', uid), this.cleanForFirestore(newUser)).catch(console.warn);
    }

    return { success: true, user: newUser };
  }

  async loginUser(phone: string, password: string): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    const trimmedPhone = phone.trim();

    // Attempt real Firebase Email/Password Auth login
    if (firebaseConfig && firebaseConfig.projectId) {
      try {
        const auth = getAuth();
        const virtualEmail = `${trimmedPhone}@starconnect.app`;
        const cred = await signInWithEmailAndPassword(auth, virtualEmail, password);
        if (cred && cred.user) {
          this.isFirebaseReady = true;
          this.firebaseAuthError = null;
          console.log("Firebase Auth account authenticated successfully for", trimmedPhone, cred.user.uid);
          // Pre-sync all data from Firestore right away
          await this.syncFromFirestore();
        }
      } catch (authErr: any) {
        console.warn("Firebase email/password login failed or not configured, falling back to local/cached validation:", authErr);
      }
    }

    // Find matching user
    let user = this.cache.users.find(u => this.isSamePhone(u.phone, trimmedPhone));
    
    // Direct lookup in Firestore if not in cache yet
    if (!user && this.isFirebaseReady && this.db) {
      try {
        const q = query(collection(this.db, 'users'), where('phone', '==', trimmedPhone));
        const snap = await getDocs(q);
        if (!snap.empty) {
          user = snap.docs[0].data() as UserProfile;
          this.cache.users.push(user);
          this.sync();
        }
      } catch (e) {
        console.warn("Direct Firestore look-up error on login check:", e);
      }
    }

    if (!user) {
      return { success: false, error: 'No account found with this phone number!' };
    }

    const storedPassword = user.password || '123456'; // standard default password for preset seed users
    if (storedPassword !== password) {
      return { success: false, error: 'Incorrect password! Please try again.' };
    }

    this.cache.currentUser = user;
    this.sync();

    // Sync to Firestore Users collection
    if (this.isFirebaseReady && this.db) {
      await setDoc(doc(this.db, 'users', user.id), this.cleanForFirestore(user)).catch(console.warn);
    }

    return { success: true, user };
  }

  registerUser(name: string, phone: string, role: 'user' | 'creator' = 'user'): UserProfile {
    const existing = this.cache.users.find(u => this.isSamePhone(u.phone, phone));
    if (existing) {
      this.cache.currentUser = existing;
      this.sync();
      return existing;
    }

    const uid = 'user_' + Math.random().toString(36).substr(2, 9);
    const username = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 100);
    const newUser: UserProfile = {
      id: uid,
      name,
      username,
      phone,
      bio: `Welcome to StarConnect! 🌟 (${role === 'creator' ? 'Creator Profile' : 'Member Profile'})`,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      coverUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
      role,
      isVerified: false,
      isPremium: role === 'creator',
      kycStatus: 'none',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      blockedUsers: [],
      starBalance: role === 'creator' ? 0 : 100, // 100 starter stars for testing!
      totalStarsEarned: 0,
      totalStarsSpent: 0,
      pendingBalanceStars: 0
    };

    this.cache.users.push(newUser);
    this.cache.currentUser = newUser;
    this.sync();

    // Firestore Sync
    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', uid), this.cleanForFirestore(newUser)).catch(console.warn);
    }

    return newUser;
  }

  updateProfile(updates: Partial<UserProfile>): UserProfile {
    const user = this.cache.currentUser;
    Object.assign(user, updates);

    const idx = this.cache.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.cache.users[idx] = { ...user };
    }

    this.cache.posts = this.cache.posts.map(p => {
      if (p.authorId === user.id) {
        return {
          ...p,
          authorName: user.name,
          authorAvatarUrl: user.avatarUrl,
          authorIsVerified: user.isVerified
        };
      }
      return p;
    });

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', user.id), this.cleanForFirestore(user)).catch(console.warn);
    }

    return user;
  }

  switchRole(role: 'user' | 'creator' | 'admin') {
    const user = this.cache.currentUser;
    user.role = role;
    
    // Modify verified and premium tags on creator role for safety checks
    if (role === 'creator') {
      user.isPremium = true;
      if (user.kycStatus === 'none') {
        user.kycStatus = 'approved'; // auto-approve mock role switch as well
        user.isVerified = true;
      }
    } else if (role === 'admin') {
      user.isVerified = true;
    }

    const idx = this.cache.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.cache.users[idx] = { ...user };
    }
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  submitKyc(realName: string, idNum: string): UserProfile {
    const user = this.cache.currentUser;
    user.kycStatus = 'pending';
    user.kycRealName = realName;
    user.kycNidOrPassport = idNum;

    const idx = this.cache.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.cache.users[idx] = { ...user };
    }
    this.sync();

    // Notify admins
    this.addNotification('user_admin', user.id, user.name, user.avatarUrl, 'kyc_update', `Submitted creator verification (KYC) request. NID/Passport: ${idNum}`);

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', user.id), this.cleanForFirestore(user)).catch(console.warn);
    }

    return user;
  }

  logout() {
    // Simply clear session locally can trigger login
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.cache.currentUser = null as any;
    
    if (firebaseConfig && firebaseConfig.projectId) {
      try {
        const auth = getAuth();
        auth.signOut().then(() => {
          this.signInAnon(auth);
        }).catch(() => {
          this.signInAnon(auth);
        });
      } catch (e) {
        console.warn("Sign out err:", e);
      }
    }
  }

  // --- Follow Rules ---
  toggleFollow(targetUserId: string): { isFollowing: boolean; targetUser: UserProfile } {
    const me = this.cache.currentUser;
    const target = this.getUserById(targetUserId);
    if (!target) return { isFollowing: false, targetUser: null as any };

    const followKey = `follow_${me.id}_${target.id}`;
    const followExists = localStorage.getItem(followKey) === 'true';

    if (followExists) {
      localStorage.setItem(followKey, 'false');
      me.followingCount = Math.max(0, me.followingCount - 1);
      target.followersCount = Math.max(0, target.followersCount - 1);
    } else {
      localStorage.setItem(followKey, 'true');
      me.followingCount++;
      target.followersCount++;
      this.addNotification(target.id, me.id, me.name, me.avatarUrl, 'follow', 'started following your profile.');
    }

    this.cache.currentUser = { ...me };
    const idxMe = this.cache.users.findIndex(u => u.id === me.id);
    if (idxMe !== -1) this.cache.users[idxMe] = { ...me };

    const idxTarget = this.cache.users.findIndex(u => u.id === target.id);
    if (idxTarget !== -1) this.cache.users[idxTarget] = { ...target };

    // Update Firestore if available
    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', me.id), this.cleanForFirestore(me)).catch(console.warn);
      setDoc(doc(this.db, 'users', target.id), this.cleanForFirestore(target)).catch(console.warn);

      if (!followExists) {
        setDoc(doc(this.db, 'follows', followKey), this.cleanForFirestore({
          id: followKey,
          followerId: me.id,
          followingId: target.id
        })).catch(console.warn);
      } else {
        deleteDoc(doc(this.db, 'follows', followKey)).catch(console.warn);
      }
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return { isFollowing: !followExists, targetUser: target };
  }

  isFollowing(targetUserId: string): boolean {
    const me = this.cache.currentUser;
    if (!me) return false;
    return localStorage.getItem(`follow_${me.id}_${targetUserId}`) === 'true';
  }

  // --- Friend Requests & Friends ---
  getFriendRequests(): FriendRequest[] {
    const me = this.getCurrentUser();
    if (!me) return [];
    return this.cache.friendRequests.filter(fr => fr.senderId === me.id || fr.receiverId === me.id);
  }

  sendFriendRequest(targetUserId: string): FriendRequest | null {
    const me = this.getCurrentUser();
    if (!me || me.id === targetUserId) return null;

    // Check if request already exists
    const existing = this.cache.friendRequests.find(fr => 
      (fr.senderId === me.id && fr.receiverId === targetUserId) ||
      (fr.senderId === targetUserId && fr.receiverId === me.id)
    );
    if (existing) return existing;

    const frId = `fr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newFr: FriendRequest = {
      id: frId,
      senderId: me.id,
      senderName: me.name,
      senderAvatarUrl: me.avatarUrl,
      receiverId: targetUserId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.cache.friendRequests.push(newFr);

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'friend_requests', frId), this.cleanForFirestore(newFr)).catch(console.warn);
    }

    // Add notification for receiver
    this.addNotification(
      targetUserId,
      me.id,
      me.name,
      me.avatarUrl,
      'friend_request',
      `${me.name} sent you a friend request.`
    );

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return newFr;
  }

  acceptFriendRequest(requestId: string): boolean {
    const me = this.getCurrentUser();
    if (!me) return false;

    const idx = this.cache.friendRequests.findIndex(fr => fr.id === requestId);
    if (idx === -1) return false;

    const fr = this.cache.friendRequests[idx];
    if (fr.receiverId !== me.id) return false; // only receiver can accept

    fr.status = 'accepted';
    this.cache.friendRequests[idx] = fr;

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'friend_requests', requestId), this.cleanForFirestore(fr)).catch(console.warn);
    }

    // Trigger mutual follows for convenience
    const senderId = fr.senderId;
    this.forceFollow(me.id, senderId);
    this.forceFollow(senderId, me.id);

    // Friend acceptance notification
    this.addNotification(
      senderId,
      me.id,
      me.name,
      me.avatarUrl,
      'friend_accept',
      `${me.name} accepted your friend request.`
    );

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return true;
  }

  cancelFriendRequest(requestId: string): boolean {
    const me = this.getCurrentUser();
    if (!me) return false;

    const idx = this.cache.friendRequests.findIndex(fr => fr.id === requestId);
    if (idx === -1) return false;

    const fr = this.cache.friendRequests[idx];
    this.cache.friendRequests.splice(idx, 1);

    if (this.isFirebaseReady && this.db) {
      deleteDoc(doc(this.db, 'friend_requests', requestId)).catch(console.warn);
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return true;
  }

  unfriend(targetUserId: string): boolean {
    const me = this.getCurrentUser();
    if (!me) return false;

    // Filter out friend requests between us
    this.cache.friendRequests = this.cache.friendRequests.filter(fr => {
      const isMatch = (fr.senderId === me.id && fr.receiverId === targetUserId) ||
                      (fr.senderId === targetUserId && fr.receiverId === me.id);
      if (isMatch && this.isFirebaseReady && this.db) {
        deleteDoc(doc(this.db, 'friend_requests', fr.id)).catch(console.warn);
      }
      return !isMatch;
    });

    // Remove follow relationship
    const followKey1 = `follow_${me.id}_${targetUserId}`;
    if (localStorage.getItem(followKey1) === 'true') {
      localStorage.setItem(followKey1, 'false');
      me.followingCount = Math.max(0, me.followingCount - 1);
      const target = this.getUserById(targetUserId);
      if (target) {
        target.followersCount = Math.max(0, target.followersCount - 1);
        const idxT = this.cache.users.findIndex(u => u.id === targetUserId);
        if (idxT !== -1) this.cache.users[idxT] = { ...target };
        if (this.isFirebaseReady && this.db) {
          setDoc(doc(this.db, 'users', targetUserId), this.cleanForFirestore(target)).catch(console.warn);
        }
      }
      if (this.isFirebaseReady && this.db) {
        deleteDoc(doc(this.db, 'follows', followKey1)).catch(console.warn);
      }
    }

    const followKey2 = `follow_${targetUserId}_${me.id}`;
    if (localStorage.getItem(followKey2) === 'true') {
      localStorage.setItem(followKey2, 'false');
      me.followersCount = Math.max(0, me.followersCount - 1);
      const target = this.getUserById(targetUserId);
      if (target) {
        target.followingCount = Math.max(0, target.followingCount - 1);
        const idxT = this.cache.users.findIndex(u => u.id === targetUserId);
        if (idxT !== -1) this.cache.users[idxT] = { ...target };
        if (this.isFirebaseReady && this.db) {
          setDoc(doc(this.db, 'users', targetUserId), this.cleanForFirestore(target)).catch(console.warn);
        }
      }
      if (this.isFirebaseReady && this.db) {
        deleteDoc(doc(this.db, 'follows', followKey2)).catch(console.warn);
      }
    }

    this.cache.currentUser = { ...me };
    const idxMe = this.cache.users.findIndex(u => u.id === me.id);
    if (idxMe !== -1) this.cache.users[idxMe] = { ...me };

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', me.id), this.cleanForFirestore(me)).catch(console.warn);
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return true;
  }

  forceFollow(followerId: string, followingId: string) {
    const follower = this.getUserById(followerId);
    const following = this.getUserById(followingId);
    if (!follower || !following) return;

    const followKey = `follow_${followerId}_${followingId}`;
    const followExists = localStorage.getItem(followKey) === 'true';

    if (!followExists) {
      localStorage.setItem(followKey, 'true');
      follower.followingCount++;
      following.followersCount++;

      const idxF = this.cache.users.findIndex(u => u.id === followerId);
      if (idxF !== -1) {
        this.cache.users[idxF] = { ...follower };
      }
      const idxFl = this.cache.users.findIndex(u => u.id === followingId);
      if (idxFl !== -1) {
        this.cache.users[idxFl] = { ...following };
      }

      if (this.cache.currentUser && this.cache.currentUser.id === followerId) {
        this.cache.currentUser = { ...follower };
      } else if (this.cache.currentUser && this.cache.currentUser.id === followingId) {
        this.cache.currentUser = { ...following };
      }

      if (this.isFirebaseReady && this.db) {
        setDoc(doc(this.db, 'users', followerId), this.cleanForFirestore(follower)).catch(console.warn);
        setDoc(doc(this.db, 'users', followingId), this.cleanForFirestore(following)).catch(console.warn);
        setDoc(doc(this.db, 'follows', followKey), this.cleanForFirestore({
          id: followKey,
          followerId,
          followingId
        })).catch(console.warn);
      }
    }
  }

  // --- Post Functions ---
  getPosts(category: string = 'All'): Post[] {
    const me = this.cache.currentUser;
    const blocked = me?.blockedUsers || [];
    let list = this.cache.posts.filter(p => !blocked.includes(p.authorId));

    if (category !== 'সব' && category !== 'All') {
      list = list.filter(p => p.category === category);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getReels(): Post[] {
    const me = this.cache.currentUser;
    const blocked = me?.blockedUsers || [];
    return this.cache.posts
      .filter(p => !blocked.includes(p.authorId) && (p.isReel || p.mediaType === 'video'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPostsByAuthor(authorId: string): Post[] {
    return this.cache.posts.filter(p => p.authorId === authorId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createPost(title: string, content: string, mediaUrl: string, mediaType: 'image' | 'video' | 'none', category: string, isPremium: boolean, starPrice: number, tags: string[] = []): Post {
    const me = this.cache.currentUser;
    const postId = 'post_' + Math.random().toString(36).substr(2, 9);
    
    // Fallback beautiful images if none provided
    let finalMedia = mediaUrl;
    if (mediaType === 'image' && !mediaUrl) {
      const artImages = [
        'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80'
      ];
      finalMedia = artImages[Math.floor(Math.random() * artImages.length)];
    }

    const newPost: Post = {
      id: postId,
      authorId: me.id,
      authorName: me.name,
      authorAvatarUrl: me.avatarUrl,
      authorIsVerified: me.isVerified,
      title: title ? title.trim() : '',
      content,
      mediaUrl: finalMedia,
      mediaType,
      category,
      tags,
      isReel: false,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      isPremiumPost: isPremium,
      starPrice: isPremium ? starPrice : 0,
      unlockedByUserIds: []
    };

    this.cache.posts.unshift(newPost);
    me.postsCount++;
    this.updateUserRecord(me);
    this.sync();

    // Notify followers
    this.cache.users.forEach(u => {
      if (this.isFollowingCheck(u.id, me.id)) {
        this.addNotification(u.id, me.id, me.name, me.avatarUrl, 'premium', `posted ${isPremium ? 'an exclusive photo' : 'a new public photo'}: "${title}"`);
      }
    });

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'posts', postId), this.cleanForFirestore(newPost)).catch(console.warn);
    }

    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return newPost;
  }

  private isFollowingCheck(followerId: string, followingId: string): boolean {
    return localStorage.getItem(`follow_${followerId}_${followingId}`) === 'true';
  }

  toggleLike(postId: string): Post | null {
    const me = this.cache.currentUser;
    const idx = this.cache.posts.findIndex(p => p.id === postId);
    if (idx === -1) return null;

    const post = this.cache.posts[idx];
    const likedIdx = post.likedBy.indexOf(me.id);

    if (likedIdx > -1) {
      post.likedBy.splice(likedIdx, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likedBy.push(me.id);
      post.likesCount++;
      if (post.authorId !== me.id) {
        this.addNotification(post.authorId, me.id, me.name, me.avatarUrl, 'like', `liked your post: "${post.title || 'post'}" ⭐`, post.id);
      }
    }

    this.cache.posts[idx] = { ...post };
    this.sync();
    return post;
  }

  addComment(postId: string, content: string): Comment {
    const me = this.cache.currentUser;
    const cid = 'c_' + Math.random().toString(36).substr(2, 9);
    const newComment: Comment = {
      id: cid,
      postId,
      authorId: me.id,
      authorName: me.name,
      authorAvatarUrl: me.avatarUrl,
      content,
      createdAt: new Date().toISOString()
    };

    this.cache.comments.push(newComment);
    const postIdx = this.cache.posts.findIndex(p => p.id === postId);
    let updatedPost: Post | null = null;
    if (postIdx !== -1) {
      const post = this.cache.posts[postIdx];
      post.commentsCount++;
      updatedPost = post;
      if (post.authorId !== me.id) {
        this.addNotification(post.authorId, me.id, me.name, me.avatarUrl, 'comment', `commented on your post "${post.title || 'post'}": "${content}"`, postId);
      }
    }
    this.sync();

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'posts', postId, 'comments', cid), this.cleanForFirestore(newComment)).catch(console.warn);
      if (updatedPost) {
        setDoc(doc(this.db, 'posts', postId), this.cleanForFirestore(updatedPost)).catch(console.warn);
      }
    }

    return newComment;
  }

  getComments(postId: string): Comment[] {
    return this.cache.comments.filter(c => c.postId === postId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // --- Unlock Premium Post ---
  unlockPremiumPost(postId: string): { success: boolean; error?: string } {
    const me = this.cache.currentUser;
    const post = this.cache.posts.find(p => p.id === postId);
    if (!post) return { success: false, error: 'Post not found.' };
    if (!post.isPremiumPost) return { success: true }; // already unlocked as public
    if (post.unlockedByUserIds.includes(me.id) || post.authorId === me.id) return { success: true };

    if (me.starBalance < post.starPrice) {
      return { success: false, error: 'Insufficient star balance. Please recharge stars!' };
    }

    // Deduct and Transfer Stars
    me.starBalance -= post.starPrice;
    me.totalStarsSpent += post.starPrice;
    this.updateUserRecord(me);

    // Transfer stars to creator's cashout balance
    const creator = this.getUserById(post.authorId);
    if (creator) {
      creator.starBalance += post.starPrice; // creator earns instantly
      creator.totalStarsEarned += post.starPrice;
      creator.pendingBalanceStars += post.starPrice; // cashable pending approval
      this.updateUserRecord(creator);

      // Log transactions
      this.addTransaction(me.id, 'unlock_post', post.starPrice, undefined, post.id, post.title || 'Premium Post');
      this.addTransaction(creator.id, 'post_earn', post.starPrice, undefined, post.id, post.title || 'Premium Post');

      // Notify creator
      this.addNotification(creator.id, me.id, me.name, me.avatarUrl, 'stars_received', `sent ${post.starPrice} stars to unlock your photo "${post.title || 'photo'}". 🌟`);
    }

    post.unlockedByUserIds.push(me.id);
    this.sync();
    
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return { success: true };
  }

  // --- Star Transactions & Packages ---
  buyStars(pkgId: string): { success: boolean; starsAdded: number } {
    const me = this.cache.currentUser;
    const pkg = STAR_PACKAGES.find(p => p.id === pkgId);
    if (!pkg) return { success: false, starsAdded: 0 };

    me.starBalance += pkg.starsCount;
    this.updateUserRecord(me);

    this.addTransaction(me.id, 'buy_stars', pkg.starsCount, pkg.priceBDT, pkg.id, pkg.badge || 'Star Recharge');
    this.addNotification(me.id, 'user_admin', 'StarConnect Billing', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'premium', `Congratulations! Successfully recharged ${pkg.starsCount} stars via bKash/Nagad. Amount: ৳${pkg.priceBDT}`);

    // Process referral purchase commission
    const refSettings = this.cache.referralSettings || {
      isEnabled: true,
      signupBonusStars: 10,
      purchaseCommissionPercent: 10
    };

    if (refSettings.isEnabled && me.referredBy) {
      const referrer = this.getUserById(me.referredBy);
      if (referrer) {
        const commissionPercent = refSettings.purchaseCommissionPercent || 0;
        const commissionStars = Math.floor((pkg.starsCount * commissionPercent) / 100);
        if (commissionStars > 0) {
          referrer.starBalance = (referrer.starBalance || 0) + commissionStars;
          referrer.totalStarsEarned = (referrer.totalStarsEarned || 0) + commissionStars;
          referrer.totalReferralBonus = (referrer.totalReferralBonus || 0) + commissionStars;
          this.updateUserRecord(referrer);

          this.addTransaction(
            referrer.id, 
            'post_earn', 
            commissionStars, 
            undefined, 
            me.id, 
            `Referral Recharge Commission (${me.name})`
          );

          this.addNotification(
            referrer.id, 
            'user_admin', 
            'StarConnect Referral', 
            'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 
            'stars_received', 
            `Congratulations! Your referred user ${me.name} recharged ${pkg.starsCount} stars. You received ${commissionStars} stars (${commissionPercent}%) as referral bonus commission! 🌟`
          );

          if (this.isFirebaseReady && this.db) {
            setDoc(doc(this.db, 'users', referrer.id), this.cleanForFirestore(referrer)).catch(console.warn);
          }
        }
      }
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return { success: true, starsAdded: pkg.starsCount };
  }

  sendDirectStars(targetUserId: string, amount: number): { success: boolean; error?: string } {
    const me = this.cache.currentUser;
    if (me.id === targetUserId) return { success: false, error: 'You cannot send stars to yourself!' };
    if (me.starBalance < amount) return { success: false, error: 'Insufficient star balance!' };

    const target = this.getUserById(targetUserId);
    if (!target) return { success: false, error: 'User not found!' };

    me.starBalance -= amount;
    me.totalStarsSpent += amount;
    this.updateUserRecord(me);

    target.starBalance += amount;
    target.totalStarsEarned += amount;
    target.pendingBalanceStars += amount;
    this.updateUserRecord(target);

    // Save Transactions log
    this.addTransaction(me.id, 'send_gift', amount, undefined, target.id, target.name);
    this.addTransaction(target.id, 'receive_gift', amount, undefined, me.id, me.name);

    // Notifications
    this.addNotification(target.id, me.id, me.name, me.avatarUrl, 'stars_received', `gifted you ${amount} stars directly. 😍🌟`);

    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'users', me.id), this.cleanForFirestore(me)).catch(console.warn);
      setDoc(doc(this.db, 'users', target.id), this.cleanForFirestore(target)).catch(console.warn);
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return { success: true };
  }

  // --- Cash Out / Withdraw System ---
  submitWithdrawal(amountStars: number, method: 'bKash' | 'Nagad' | 'Rocket', accountNumber: string): { success: boolean; error?: string } {
    const me = this.cache.currentUser;
    
    if (amountStars < 500) {
      return { success: false, error: 'Minimum withdrawal amount is 500 stars.' };
    }
    
    if (me.pendingBalanceStars < amountStars) {
      return { success: false, error: 'You do not have sufficient pending balance to withdraw.' };
    }

    // star conversion: 1 star = ৳0.8 BDT
    const amountBDT = Math.round(amountStars * 0.8);

    // Lock/Move pending state logically
    me.pendingBalanceStars -= amountStars;
    this.updateUserRecord(me);

    const reqId = 'w_req_' + Date.now();
    const newRequest: WithdrawalRequest = {
      id: reqId,
      userId: me.id,
      userName: me.name,
      amountStars,
      amountBDT,
      method,
      accountNumber,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.cache.withdrawals.unshift(newRequest);
    this.addTransaction(me.id, 'withdraw', amountStars, amountBDT, reqId, `${method} Withdrawal Application`);

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return { success: true };
  }

  getWithdrawalHistory(userId?: string): WithdrawalRequest[] {
    if (userId) {
      return this.cache.withdrawals.filter(w => w.userId === userId);
    }
    return this.cache.withdrawals;
  }

  getTransactions(userId: string): TransactionItem[] {
    return this.cache.transactions.filter(t => t.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Chat Systems ---
  getChats(): Chat[] {
    const me = this.cache.currentUser;
    if (!me) return [];
    return this.cache.chats.filter(c => c.participants.includes(me.id)).sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  getMessages(chatId: string): Message[] {
    return this.cache.messages.filter(m => m.chatId === chatId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  sendMessage(receiverId: string, content: string, mediaType: Message['mediaType'] = 'text', starGiftAmount?: number): Message {
    const me = this.cache.currentUser;
    const chatId = [me.id, receiverId].sort().join('_');
    const msgId = 'msg_' + Date.now();
    const timestamp = new Date().toISOString();

    // Check if Paid Chat is active (where sending user must pay stars config)
    const activeChat = this.cache.chats.find(c => c.id === chatId);
    if (activeChat && activeChat.isPaidChatEnabled && activeChat.starRatePerMessage && me.role !== 'creator') {
      const rate = activeChat.starRatePerMessage;
      if (me.starBalance < rate) {
        throw new Error(`This creator's Paid Chat is enabled. Sending a message requires ${rate} Stars.`);
      }
      // charge
      me.starBalance -= rate;
      this.updateUserRecord(me);
      
      const receiver = this.getUserById(receiverId);
      if (receiver) {
        receiver.starBalance += rate;
        receiver.totalStarsEarned += rate;
        receiver.pendingBalanceStars += rate;
        this.updateUserRecord(receiver);
        this.addTransaction(me.id, 'send_gift', rate, undefined, receiver.id, receiver.name);
        this.addTransaction(receiver.id, 'receive_gift', rate, undefined, me.id, me.name);
      }
    }

    const newMsg: Message = {
      id: msgId,
      chatId,
      senderId: me.id,
      receiverId,
      content,
      createdAt: timestamp,
      isRead: false,
      mediaType,
      starGiftAmount
    };

    // Save to Firestore if available
    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'messages', msgId), this.cleanForFirestore(newMsg)).catch(console.warn);
    }

    this.cache.messages.push(newMsg);

    // Update chat index
    const chatIdx = this.cache.chats.findIndex(c => c.id === chatId);
    if (chatIdx !== -1) {
      this.cache.chats[chatIdx].lastMessage = mediaType === 'star_gift' ? `🎁 ${starGiftAmount} Stars Gift!` : content;
      this.cache.chats[chatIdx].lastMessageAt = timestamp;
      if (!this.cache.chats[chatIdx].unreadCount) this.cache.chats[chatIdx].unreadCount = {};
      this.cache.chats[chatIdx].unreadCount[receiverId] = (this.cache.chats[chatIdx].unreadCount[receiverId] || 0) + 1;
    } else {
      this.cache.chats.push({
        id: chatId,
        participants: [me.id, receiverId],
        lastMessage: mediaType === 'star_gift' ? `🎁 ${starGiftAmount} Stars Gift!` : content,
        lastMessageAt: timestamp,
        unreadCount: { [receiverId]: 1, [me.id]: 0 },
        isPaidChatEnabled: false
      });
    }

    this.sync();

    // Trigger auto bot reply from initial creators for gorgeous UX if desired
    if (receiverId === 'user_mymun' || receiverId === 'user_anika' || receiverId === 'user_samin') {
      setTimeout(() => {
        this.simulateCreatorAutoReply(chatId, receiverId);
      }, 1500);
    }

    window.dispatchEvent(new CustomEvent('starconnect_new_message', { detail: { chatId } }));
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return newMsg;
  }

  private simulateCreatorAutoReply(chatId: string, creatorId: string) {
    const me = this.cache.currentUser;
    const creator = this.getUserById(creatorId);
    if (!creator) return;

    const replies = [
      'Thank you so much for your sweet Star gift! Your support inspires me to create more high-quality premium content. 🥰🌟',
      'Hello! I received your message. How do you like my exclusive photos in the Art section?',
      'Great! It was wonderful receiving your message. I will be uploading brand new premium photos very soon. Stay tuned!',
      'Thank you! I am delighted to be connected with you all via the StarConnect platform. 😊'
    ];
    const picked = replies[Math.floor(Math.random() * replies.length)];
    const timestamp = new Date().toISOString();
    const msgId = 'msg_' + Date.now() + '_auto';

    const replyMsg: Message = {
      id: msgId,
      chatId,
      senderId: creatorId,
      receiverId: me.id,
      content: picked,
      createdAt: timestamp,
      isRead: false,
      mediaType: 'text'
    };

    // Save to Firestore if available
    if (this.isFirebaseReady && this.db) {
      setDoc(doc(this.db, 'messages', msgId), this.cleanForFirestore(replyMsg)).catch(console.warn);
    }

    this.cache.messages.push(replyMsg);

    const chatIdx = this.cache.chats.findIndex(c => c.id === chatId);
    if (chatIdx !== -1) {
      this.cache.chats[chatIdx].lastMessage = picked;
      this.cache.chats[chatIdx].lastMessageAt = timestamp;
      if (!this.cache.chats[chatIdx].unreadCount) this.cache.chats[chatIdx].unreadCount = {};
      this.cache.chats[chatIdx].unreadCount[me.id] = (this.cache.chats[chatIdx].unreadCount[me.id] || 0) + 1;
    }

    this.addNotification(me.id, creatorId, creator.name, creator.avatarUrl, 'message', `sent you a message: "${picked.substring(0,20)}..."`);
    this.sync();

    window.dispatchEvent(new CustomEvent('starconnect_new_message', { detail: { chatId } }));
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  markChatAsRead(chatId: string) {
    const me = this.cache.currentUser;
    if (!me) return;

    // Set messages to isRead: true for messages sent by the partner
    this.cache.messages = this.cache.messages.map(m => {
      if (m.chatId === chatId && m.receiverId === me.id) {
        const updated = { ...m, isRead: true };
        if (this.isFirebaseReady && this.db) {
          setDoc(doc(this.db, 'messages', m.id), this.cleanForFirestore(updated)).catch(console.warn);
        }
        return updated;
      }
      return m;
    });

    // Reset unread count for current user
    const chatIdx = this.cache.chats.findIndex(c => c.id === chatId);
    if (chatIdx !== -1) {
      if (!this.cache.chats[chatIdx].unreadCount) {
        this.cache.chats[chatIdx].unreadCount = {};
      }
      this.cache.chats[chatIdx].unreadCount[me.id] = 0;
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  marChatAsRead(chatId: string) {
    this.markChatAsRead(chatId);
  }

  // --- Reports & Moderations ---
  getReports(): Report[] {
    return this.cache.reports;
  }

  reportContent(reportedId: string, reportedName: string, reason: string, postId?: string, postContent?: string) {
    const me = this.cache.currentUser;
    const repId = 'rep_' + Date.now();
    const rep: Report = {
      id: repId,
      reporterId: me.id,
      reporterName: me.name,
      reportedId,
      reportedName,
      postId,
      postContent,
      reason,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    this.cache.reports.push(rep);
    this.sync();
  }

  resolveReport(reportId: string) {
    this.cache.reports = this.cache.reports.map(r => {
      if (r.id === reportId) return { ...r, status: 'resolved' as const };
      return r;
    });
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  requestPremium(): UserProfile {
    const me = this.cache.currentUser;
    me.isPremium = true;

    // Update in users array
    const idx = this.cache.users.findIndex(u => u.id === me.id);
    if (idx !== -1) {
      this.cache.users[idx].isPremium = true;
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    return me;
  }

  // --- ADMIN SPECIAL MANAGEMENT METHODS ---
  approveKyc(userId: string) {
    const creator = this.getUserById(userId);
    if (!creator) return;

    creator.kycStatus = 'approved';
    creator.role = 'creator';
    creator.isVerified = true;
    creator.isPremium = true;

    this.updateUserRecord(creator);
    this.addNotification(creator.id, 'user_admin', 'StarConnect Team', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'kyc_update', 'Congratulations! Your Creator KYC and NID/passport verification have been approved. You are now authorized to upload premium content and set custom star pricing! 🌟💼');

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  rejectKyc(userId: string) {
    const creator = this.getUserById(userId);
    if (!creator) return;

    creator.kycStatus = 'rejected';
    this.updateUserRecord(creator);
    this.addNotification(creator.id, 'user_admin', 'StarConnect Team', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'kyc_update', 'Sorry, your submitted KYC document was rejected because it did not comply with our verification policies. Please try again with valid legal identification.');

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  approveWithdrawal(withdrawalId: string) {
    const idx = this.cache.withdrawals.findIndex(w => w.id === withdrawalId);
    if (idx === -1) return;

    const req = this.cache.withdrawals[idx];
    req.status = 'approved';

    const creator = this.getUserById(req.userId);
    if (creator) {
      this.updateUserRecord(creator);
      this.addNotification(creator.id, 'user_admin', 'StarConnect Accounts', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'withdrawal_update', `Your cash-out request of ৳${req.amountBDT} BDT has been approved and successfully transferred to your ${req.method} number. Transaction ID: ${req.id}`);
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  rejectWithdrawal(withdrawalId: string) {
    const idx = this.cache.withdrawals.findIndex(w => w.id === withdrawalId);
    if (idx === -1) return;

    const req = this.cache.withdrawals[idx];
    req.status = 'rejected';

    const creator = this.getUserById(req.userId);
    if (creator) {
      // Return stars to pending balance
      creator.pendingBalanceStars += req.amountStars;
      this.updateUserRecord(creator);
      this.addNotification(creator.id, 'user_admin', 'StarConnect Accounts', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 'withdrawal_update', `Sorry! Your cash-out request of ৳${req.amountBDT} BDT has been rejected. The ${req.amountStars} stars have been refunded to your wallet balance.`);
    }

    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  banUser(userId: string) {
    const user = this.getUserById(userId);
    if (!user) return;

    // We can simulate ban simply by adding to blocked users of current user or changing bio to ban
    user.bio = '🛑 [This account has been banned/suspended by StarConnect Administration for content policy violation]';
    this.updateUserRecord(user);
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  // --- Local Utilities ---
  public updateUserRecord(user: UserProfile) {
    const idx = this.cache.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.cache.users[idx] = { ...user };
    }
    if (this.cache.currentUser && this.cache.currentUser.id === user.id) {
      this.cache.currentUser = { ...user };
    }
    this.sync();
  }

  private addTransaction(userId: string, type: TransactionItem['type'], amountStars: number, amountBDT?: number, refId?: string, refName?: string) {
    const tx: TransactionItem = {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      userId,
      type,
      amountStars,
      amountBDT,
      referenceId: refId,
      referenceName: refName,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    this.cache.transactions.unshift(tx);
    this.sync();
  }

  public addNotification(userId: string, senderId: string, senderName: string, senderAvatarUrl: string, type: NotificationItem['type'], text: string, postId?: string) {
    const notif: NotificationItem = {
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      userId,
      senderId,
      senderName,
      senderAvatarUrl,
      type,
      text,
      isRead: false,
      createdAt: new Date().toISOString(),
      postId
    };
    this.cache.notifications.unshift(notif);
    this.sync();
  }

  getNotifications(): NotificationItem[] {
    return this.cache.notifications;
  }

  markAllNotificationsRead() {
    this.cache.notifications = this.cache.notifications.map(n => ({ ...n, isRead: true }));
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  getStories(): Story[] {
    return this.cache.stories;
  }

  addStory(mediaUrl: string): Story {
    const me = this.cache.currentUser;
    const story: Story = {
      id: 'story_' + Date.now(),
      userId: me.id,
      userName: me.name,
      userAvatarUrl: me.avatarUrl,
      mediaUrl,
      mediaType: 'image',
      createdAt: new Date().toISOString()
    };
    this.cache.stories.push(story);
    this.sync();
    return story;
  }

  viewStory(storyId: string, viewerId: string) {
    const story = this.cache.stories.find(s => s.id === storyId);
    if (story) {
      if (!story.viewedBy) story.viewedBy = [];
      if (!story.viewedBy.includes(viewerId)) {
        story.viewedBy.push(viewerId);
        this.sync();
        window.dispatchEvent(new CustomEvent('starconnect_db_update'));
      }
    }
  }

  reactToStory(storyId: string, userId: string, reaction: string) {
    const story = this.cache.stories.find(s => s.id === storyId);
    if (story) {
      if (!story.reacts) story.reacts = {};
      if (story.reacts[userId] === reaction) {
        delete story.reacts[userId];
      } else {
        story.reacts[userId] = reaction;
      }
      this.sync();
      window.dispatchEvent(new CustomEvent('starconnect_db_update'));
    }
  }

  commentOnStory(storyId: string, userId: string, userName: string, userAvatarUrl: string, content: string) {
    const story = this.cache.stories.find(s => s.id === storyId);
    if (story) {
      if (!story.comments) story.comments = [];
      const newComment = {
        id: 's_cmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        userId,
        userName,
        userAvatarUrl,
        content,
        createdAt: new Date().toISOString()
      };
      story.comments.push(newComment);
      this.sync();
      window.dispatchEvent(new CustomEvent('starconnect_db_update'));
      return newComment;
    }
    return null;
  }

  deletePost(postId: string) {
    this.cache.posts = this.cache.posts.filter(p => p.id !== postId);
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  blockUser(userId: string) {
    const me = this.cache.currentUser;
    if (!me.blockedUsers) me.blockedUsers = [];
    if (!me.blockedUsers.includes(userId)) {
      me.blockedUsers.push(userId);
    }
    this.updateUserRecord(me);
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  getReferralSettings(): ReferralSettings {
    return this.cache.referralSettings || {
      isEnabled: true,
      signupBonusStars: 10,
      purchaseCommissionPercent: 10
    };
  }

  updateReferralSettings(settings: ReferralSettings) {
    this.cache.referralSettings = { ...settings };
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  getVerificationSettings(): VerificationSettings {
    return this.cache.verificationSettings || {
      isEnabled: true,
      verificationCostStars: 100,
      verificationCostBDT: 150,
      isAutoReferEnabled: true,
      minReferralsForAutoVerify: 30
    };
  }

  updateVerificationSettings(settings: VerificationSettings) {
    this.cache.verificationSettings = { ...settings };
    this.sync();
    window.dispatchEvent(new CustomEvent('starconnect_db_update'));
  }

  purchaseVerification(userId: string, payWith: 'stars' | 'money'): { success: boolean; error?: string } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, error: 'User not found.' };
    if (user.isVerified) return { success: false, error: 'Your account is already verified.' };

    const verSettings = this.getVerificationSettings();
    if (!verSettings.isEnabled) {
      return { success: false, error: 'Feature to buy a verification badge using stars or cash is currently disabled.' };
    }

    if (payWith === 'stars') {
      const cost = verSettings.verificationCostStars;
      if (user.starBalance < cost) {
        return { success: false, error: `Insufficient star balance. This verification requires ${cost} stars.` };
      }
      user.starBalance -= cost;
      user.totalStarsSpent = (user.totalStarsSpent || 0) + cost;
      user.isVerified = true;
      this.updateUserRecord(user);

      // Check if current user in session is this user
      if (this.cache.currentUser && this.cache.currentUser.id === user.id) {
        this.cache.currentUser = { ...user };
      }

      this.addTransaction(
        user.id, 
        'unlock_post',
        cost, 
        undefined, 
        'verification', 
        `Account verification purchase with stars`
      );

      this.addNotification(
        user.id, 
        'user_admin', 
        'StarConnect Team', 
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 
        'kyc_update', 
        `Congratulations! Your account has been automatically verified with ${cost} stars deducted! 🌟✔️`
      );
      this.sync();
      window.dispatchEvent(new CustomEvent('starconnect_db_update'));
      return { success: true };
    } else {
      const costBDT = verSettings.verificationCostBDT;
      user.isVerified = true;
      this.updateUserRecord(user);

      // Check if current user in session is this user
      if (this.cache.currentUser && this.cache.currentUser.id === user.id) {
        this.cache.currentUser = { ...user };
      }

      this.addTransaction(
        user.id, 
        'buy_stars',
        0, 
        costBDT, 
        'verification', 
        `Account verification purchase via ৳${costBDT} cash payment`
      );

      this.addNotification(
        user.id, 
        'user_admin', 
        'StarConnect Team', 
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', 
        'kyc_update', 
        `Congratulations! Your ৳${costBDT} BDT payment succeeded, and your account has been automatically verified! 🌟✔️`
      );
      this.sync();
      window.dispatchEvent(new CustomEvent('starconnect_db_update'));
      return { success: true };
    }
  }
}

export const dbService = new StarConnectDatabaseService();
export const firebaseReady = firebaseConfig && !!firebaseConfig.projectId;
