/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Bell, Heart, MessageCircle, Share2, MoreHorizontal, CheckCircle2, ShieldAlert, Sparkles, Send, Lock, Gift, Coins, AlertCircle, X, Camera } from 'lucide-react';
import { Post, Comment, Story, UserProfile, NotificationItem } from '../types';
import { dbService } from '../services/db';
import { VerifiedBadge } from './VerifiedBadge';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const safeFormatTime = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return '';
  }
};

const safeFormatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (err) {
    return '';
  }
};

const safeFormatDateTimeString = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (err) {
    return '';
  }
};

const FEED_GRADIENTS: Record<string, string> = {
  sunset: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white',
  ocean: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white',
  cosmic: 'bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-500 text-white',
  neon: 'bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 text-white',
  love: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
  aurora: 'bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 text-white'
};

const parsePostContent = (content: string) => {
  if (content && content.startsWith('[GRADIENT:')) {
    const endIdx = content.indexOf(']');
    if (endIdx !== -1) {
      const gradientId = content.substring(10, endIdx);
      const cleanContent = content.substring(endIdx + 1);
      return { gradientId, cleanContent };
    }
  }
  return { gradientId: null, cleanContent: content };
};

interface FeedViewProps {
  onNavigate: (screen: string) => void;
  onUserSelect?: (userId: string) => void;
  onMessageUser?: (userId: string) => void;
}

export default function FeedView({ onNavigate, onUserSelect, onMessageUser }: FeedViewProps) {
  const isOnline = useOnlineStatus();
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [stories, setStories] = React.useState<Story[]>([]);
  
  // Active Profiles
  const [myProfile, setMyProfile] = React.useState<UserProfile | null>(null);

  // Gifting Modal State
  const [giftingPost, setGiftingPost] = React.useState<Post | null>(null);
  const [giftAmount, setGiftAmount] = React.useState<number>(10);
  const [giftingError, setGiftingError] = React.useState('');
  const [giftingSuccess, setGiftingSuccess] = React.useState(false);

  // Custom states for story interaction
  const [activeStory, setActiveStory] = React.useState<Story | null>(null);
  const [storyTimer, setStoryTimer] = React.useState(0);
  const [isStoryCommentFocused, setIsStoryCommentFocused] = React.useState(false);
  const currentStory = activeStory ? (stories.find(s => s.id === activeStory.id) || activeStory) : null;
  const storyInputRef = React.useRef<HTMLInputElement | null>(null);

  // Custom states for post options/reports
  const [selectedPostOptions, setSelectedPostOptions] = React.useState<Post | null>(null);
  const [showReportForm, setShowReportForm] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('');
  const [sharingPost, setSharingPost] = React.useState<Post | null>(null);

  // Notifications states
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = React.useState(false);

  // Comments panel sheet inside bottom drawer
  const [activeCommentsPost, setActiveCommentsPost] = React.useState<Post | null>(null);
  const [commentsList, setCommentsList] = React.useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = React.useState('');

  // Search filter
  const [searchPostQuery, setSearchPostQuery] = React.useState('');
  const [showSearchBox, setShowSearchBox] = React.useState(false);

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullOffsetY, setPullOffsetY] = React.useState(0);
  const [pullState, setPullState] = React.useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle');
  const touchStartRef = React.useRef({ y: 0, isTop: false });
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Hidden admin gesture tracking
  const [logoTapCount, setLogoTapCount] = React.useState(0);
  const handleLogoTap = () => {
    if (myProfile && myProfile.role === 'admin') {
      const nextCount = logoTapCount + 1;
      if (nextCount >= 5) {
        setLogoTapCount(0);
        alert('Welcome Admin! Secure backdoor panel launching...');
        onNavigate('ADMIN_PANEL');
      } else {
        setLogoTapCount(nextCount);
        // Clear count after 2.5 seconds of inactivity
        setTimeout(() => {
          setLogoTapCount(prev => prev === nextCount ? 0 : prev);
        }, 2500);
      }
    } else {
      onNavigate('FEED');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const isAtTop = containerRef.current.scrollTop === 0;
    if (isAtTop && pullState === 'idle') {
      touchStartRef.current = {
        y: e.touches[0].clientY,
        isTop: true
      };
    } else {
      touchStartRef.current.isTop = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current.isTop || !containerRef.current) return;
    
    const currentY = e.touches[0].clientY;
    const dragDistance = currentY - touchStartRef.current.y;
    
    if (dragDistance > 0) {
      if (dragDistance > 5) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
      const resistanceValue = Math.min(80, dragDistance * 0.45);
      setPullOffsetY(resistanceValue);
      setPullState(dragDistance > 130 ? 'ready' : 'pulling');
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current.isTop) return;
    touchStartRef.current.isTop = false;

    if (pullState === 'ready') {
      setPullState('refreshing');
      setPullOffsetY(55);
      
      const finishRefresh = () => {
        setPullOffsetY(0);
        setPullState('idle');
      };

      if (typeof dbService.syncFromFirestore === 'function') {
        dbService.syncFromFirestore().then(() => {
          loadFeedData();
          setTimeout(finishRefresh, 600);
        }).catch(() => {
          loadFeedData();
          setTimeout(finishRefresh, 600);
        });
      } else {
        loadFeedData();
        setTimeout(finishRefresh, 600);
      }
    } else {
      setPullOffsetY(0);
      setPullState('idle');
    }
  };

  const categories = ['All', 'Glamour', 'Entertainment', 'Art', 'Lifestyle'];

  const getBGCategory = (catName: string) => {
    switch (catName) {
      case 'All': return 'সব';
      case 'Glamour': return 'গ্ল্যামার';
      case 'Entertainment': return 'বিনোদন';
      case 'Art': return 'আর্ট';
      case 'Lifestyle': return 'লাইফস্টাইল';
      default: return catName;
    }
  };

  const loadFeedData = () => {
    setMyProfile(dbService.getCurrentUser());
    setPosts(dbService.getPosts(getBGCategory(activeCategory)));
    setStories(dbService.getStories());
    setNotifications(dbService.getNotifications());
  };

  const activeCommentsPostRef = React.useRef<Post | null>(null);
  React.useEffect(() => {
    activeCommentsPostRef.current = activeCommentsPost;
  }, [activeCommentsPost]);

  React.useEffect(() => {
    loadFeedData();
    
    const handleReload = () => {
      loadFeedData();
      if (activeCommentsPostRef.current) {
        setCommentsList(dbService.getComments(activeCommentsPostRef.current.id));
      }
    };

    window.addEventListener('starconnect_db_update', handleReload);
    return () => {
      window.removeEventListener('starconnect_db_update', handleReload);
    };
  }, [activeCategory]);

  React.useEffect(() => {
    if (activeStory && myProfile) {
      dbService.viewStory(activeStory.id, myProfile.id);
    }
  }, [activeStory, myProfile]);

  // Derived active user's stories
  const activeUserStories = React.useMemo(() => {
    if (!activeStory) return [];
    return stories.filter(s => s.userId === activeStory.userId);
  }, [activeStory, stories]);

  // Unique list of first story per user for the horizontal top bar list
  const uniqueUserStoriesMap = React.useMemo(() => {
    const map = new Map<string, Story>();
    stories.forEach(s => {
      if (myProfile && s.userId === myProfile.id) return;
      if (!map.has(s.userId)) {
        map.set(s.userId, s);
      }
    });
    return Array.from(map.values());
  }, [stories, myProfile]);

  const myStories = React.useMemo(() => {
    if (!myProfile) return [];
    return stories.filter(s => s.userId === myProfile.id);
  }, [stories, myProfile]);

  // Story Auto-Advance Timer controller
  const handleNextStory = React.useCallback(() => {
    if (!activeStory || activeUserStories.length === 0) return;
    const currentIndex = activeUserStories.findIndex(s => s.id === activeStory.id);
    if (currentIndex !== -1 && currentIndex < activeUserStories.length - 1) {
      setActiveStory(activeUserStories[currentIndex + 1]);
      setStoryTimer(0);
    } else {
      setActiveStory(null);
    }
  }, [activeStory, activeUserStories]);

  const handlePrevStory = () => {
    if (!activeStory || activeUserStories.length === 0) return;
    const currentIndex = activeUserStories.findIndex(s => s.id === activeStory.id);
    if (currentIndex > 0) {
      setActiveStory(activeUserStories[currentIndex - 1]);
      setStoryTimer(0);
    }
  };

  React.useEffect(() => {
    let interval: any;
    if (activeStory && !isStoryCommentFocused) {
      interval = setInterval(() => {
        setStoryTimer(prev => {
          if (prev >= 100) {
            return 100;
          }
          return prev + 4; // timer ~5s
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [activeStory, isStoryCommentFocused]);

  React.useEffect(() => {
    if (activeStory && storyTimer >= 100) {
      handleNextStory();
    }
  }, [storyTimer, activeStory, handleNextStory]);

  const viewStory = (story: Story) => {
    setActiveStory(story);
    setStoryTimer(0);
  };

  const triggerStoryUpload = () => {
    storyInputRef.current?.click();
  };

  const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOnline) {
      alert('🚫 ইন্টারনেট কানেকশন নেই। অফলাইন মোডে স্টোরি আপলোড করা সম্ভব নয়।');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1014) {
      alert('Warning: Please select an image under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize maximum dimension to 720px for fast loading and low storage footprint
        const maxDim = 720;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.55); // 55% quality compression
          dbService.addStory(compressedBase64);
          loadFeedData();
          alert('Your story has been added successfully! 📸');
        } else {
          dbService.addStory(event.target?.result as string);
          loadFeedData();
          alert('Your story has been added successfully! 📸');
        }
      };
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // clear input cache
  };

  const handleToggleLike = (postId: string) => {
    if (!isOnline) {
      alert('🚫 দুঃখিত! ইন্টারনেট কানেকশন নেই। অফলাইন মোডে লাইক করা সম্ভব নয়।');
      return;
    }
    dbService.toggleLike(postId);
    loadFeedData();
  };

  const handleOpenComments = async (post: Post) => {
    setActiveCommentsPost(post);
    setCommentsList(dbService.getComments(post.id));
    
    try {
      const freshComments = await dbService.fetchCommentsFromFirestore(post.id);
      if (activeCommentsPostRef.current && activeCommentsPostRef.current.id === post.id) {
        setCommentsList(freshComments);
      }
    } catch (e) {
      console.warn("Error fetching fresh comments:", e);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      alert('🚫 দুঃখিত! ইন্টারনেট কানেকশন নেই। অফলাইন মোডে কমেন্ট করা সম্ভব নয়।');
      return;
    }
    if (!newCommentText.trim() || !activeCommentsPost) return;

    const currentPostId = activeCommentsPost.id;
    const txt = newCommentText.trim();

    // Clear input early to make interactions feel extremely responsive
    setNewCommentText('');

    try {
      dbService.addComment(currentPostId, txt);
      
      // Instantly load the updated list so the user sees their comment in <1ms without closing the drawer
      setCommentsList(dbService.getComments(currentPostId));
      loadFeedData();
    } catch (error) {
      console.error("Error during handleAddComment:", error);
    }
  };

  const handleUnlockPost = (postId: string, price: number) => {
    if (!isOnline) {
      alert('🚫 ইন্টারনেট কানেকশন নেই। অফলাইন মোডে পোস্ট আনলক করা সম্ভব নয়।');
      return;
    }
    if (!myProfile) return;
    if (myProfile.starBalance < price) {
      const confirmBuy = window.confirm(`Oops! Your wallet balance is insufficient (Requires ${price} Stars).\n\nWould you like to visit the wallet page to add stars now? 📥`);
      if (confirmBuy) {
        onNavigate('BUY_STARS');
      }
      return;
    }

    const confirmUnlock = window.confirm(`Are you sure you want to unlock this premium content for ${price} Stars?`);
    if (confirmUnlock) {
      const res = dbService.unlockPremiumPost(postId);
      if (res.success) {
        alert('Congratulations! Premium content unlocked successfully. 🎉');
        loadFeedData();
      } else {
        alert(res.error || 'An error occurred during verification.');
      }
    }
  };

  const handleOpenGifting = (post: Post) => {
    setGiftingPost(post);
    setGiftAmount(10);
    setGiftingError('');
    setGiftingSuccess(false);
  };

  const handleSendGift = () => {
    if (!isOnline) {
      setGiftingError('🚫 ইন্টারনেট কানেকশন নেই। অফলাইন মোডে গিফট পাঠানো সম্ভব নয়।');
      return;
    }
    if (!giftingPost || !myProfile) return;
    if (myProfile.id === giftingPost.authorId) {
      setGiftingError('You cannot send star gifts to yourself!');
      return;
    }
    if (myProfile.starBalance < giftAmount) {
      setGiftingError(`Oops! You don't have enough balance. Top up your wallet now!`);
      return;
    }

    const res = dbService.giftStarsToPost(giftingPost.id, giftAmount);
    if (res.success) {
      setGiftingSuccess(true);
      setTimeout(() => {
        setGiftingPost(null);
        loadFeedData();
      }, 1800);
    } else {
      setGiftingError(res.error || 'Failed to send stars.');
    }
  };

  const handleReportPostSubmit = () => {
    if (!isOnline) {
      alert('🚫 ইন্টারনেট কানেকশন নেই। অফলাইন মোডে রিপোর্ট করা সম্ভব নয়।');
      return;
    }
    if (!reportReason.trim() || !selectedPostOptions) return;

    dbService.reportContent(
      selectedPostOptions.authorId,
      selectedPostOptions.authorName,
      reportReason,
      selectedPostOptions.id,
      selectedPostOptions.content
    );

    const confirmBlock = window.confirm('Report has been submitted. The admin team will investigate it.\n\nWould you like to block this creator so you don\'t see their posts?');
    if (confirmBlock) {
      dbService.blockUser(selectedPostOptions.authorId);
      loadFeedData();
    }

    setReportReason('');
    setShowReportForm(false);
    setSelectedPostOptions(null);
  };

  const handleSharePostLink = (post: Post) => {
    alert("Post share link has been copied to your clipboard! 🔗");
  };

  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    if (typeof dbService.syncFromFirestore === 'function') {
      dbService.syncFromFirestore().then(() => {
        loadFeedData();
        setIsRefreshing(false);
      }).catch(() => {
        loadFeedData();
        setIsRefreshing(false);
      });
    } else {
      setTimeout(() => {
        loadFeedData();
        setIsRefreshing(false);
      }, 1000);
    }
  };

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const filteredPosts = posts.filter(post => {
    if (myProfile && myProfile.blockedUsers?.includes(post.authorId)) return false;
    if (searchPostQuery.trim()) {
      const q = searchPostQuery.toLowerCase();
      const titleMatches = post.title?.toLowerCase().includes(q);
      const contentMatches = post.content.toLowerCase().includes(q);
      const authorMatches = post.authorName.toLowerCase().includes(q);
      if (!titleMatches && !contentMatches && !authorMatches) return false;
    }
    return true;
  });

  if (!myProfile) return null;

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`flex-1 flex flex-col ${activeStory || activeCommentsPost || giftingPost ? 'overflow-hidden' : 'overflow-y-auto'} bg-slate-50 dark:bg-zinc-950 pb-16 relative scrollbar-none`}
    >
      
      {/* ------------------------- */}
      {/* Dynamic Dept.file Header */}
      {/* ------------------------- */}
      <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-neutral-900 sticky top-0 z-30 border-b border-neutral-200/50 dark:border-neutral-800 shadow-sm shrink-0">
        <div onClick={handleLogoTap} className="flex items-center gap-2 cursor-pointer select-none">
          <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/10">
            <span className="text-white font-black text-xl italic">D</span>
          </div>
          <div>
            <span className="text-base font-black text-slate-900 dark:text-neutral-50 tracking-tight font-sans block leading-none">Dept.file</span>
            <span className="text-[8px] bg-amber-500/10 text-amber-600 px-1 py-0.2 rounded font-black tracking-widest block w-max uppercase mt-0.5 animate-pulse">CREATORS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Top Wallet indicator pills status */}
          <button
            onClick={() => onNavigate('WALLET')}
            className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-600 dark:text-amber-400 font-black text-[10.5px] font-mono cursor-pointer active:scale-95 transition"
          >
            <span>⭐</span>
            <span>{myProfile.starBalance}</span>
          </button>

          {/* Search trigger */}
          <button
            onClick={() => setShowSearchBox(!showSearchBox)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notification dropdown alert */}
          <button
            onClick={() => {
              setShowNotificationsDropdown(!showNotificationsDropdown);
              dbService.markAllNotificationsRead();
              setNotifications(dbService.getNotifications());
            }}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-neutral-200 relative transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white font-black text-[8px] w-4 h-4 rounded-full border border-white flex items-center justify-center animate-pulse">
                {unreadNotifs}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Slide-Down Expandable Search input */}
      {showSearchBox && (
        <div className="bg-white dark:bg-neutral-900 px-4 py-2 sticky top-[53px] z-25 border-b border-neutral-100 shadow-sm flex gap-2">
          <input
            type="text"
            placeholder="Search creators, post titles or descriptions..."
            value={searchPostQuery}
            onChange={(e) => setSearchPostQuery(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-[#151515] dark:text-white dark:border-neutral-850 border border-neutral-250 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
          />
          {searchPostQuery && (
            <button
              onClick={() => setSearchPostQuery('')}
              className="text-xs text-zinc-400 font-bold px-1"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Slide-Down Notifications Drawer Overlay */}
      {showNotificationsDropdown && (
        <div className="absolute top-[54px] inset-x-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 shadow-2xl max-h-80 overflow-y-auto p-3.5 rounded-b-3xl z-40 animate-fadeIn">
          <div className="flex justify-between items-center mb-3 pb-1 border-b border-neutral-100">
            <span className="text-xs font-black text-slate-800 dark:text-zinc-200">Notifications ({notifications.length})</span>
            <button
              onClick={() => setShowNotificationsDropdown(false)}
              className="text-[10px] font-black text-amber-600"
            >
              Close
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-[10px] text-zinc-400 text-center py-6">No new system notifications.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map(notif => (
                <div key={notif.id} className="flex gap-2.5 items-center bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-2xl text-left border border-neutral-100 dark:border-neutral-850">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-zinc-150">
                    <img src={notif.senderAvatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-[10.5px]">
                    <span className="font-extrabold text-slate-850 dark:text-zinc-100 block">{notif.senderName}</span>
                    <p className="text-zinc-650 dark:text-zinc-400 font-semibold mt-0.5">{notif.text}</p>
                    <span className="text-[8px] text-slate-400 font-mono block mt-1">
                      {safeFormatDateTimeString(notif.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------- */}
      {/* Pull-to-Refresh Indicator */}
      {/* ------------------------- */}
      <div 
        className="w-full overflow-hidden flex flex-col items-center justify-center bg-transparent border-none shrink-0"
        style={{ 
          height: `${pullOffsetY}px`,
          opacity: pullOffsetY > 0 ? 1 : 0,
          transition: pullOffsetY === 0 || pullState === 'refreshing' ? 'height 300ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
        }}
      >
        <div className="flex items-center gap-2 py-2">
          {pullState === 'refreshing' ? (
            <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-full shadow-md border border-amber-100 dark:border-neutral-800">
              <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 font-sans">Refreshing feed...</span>
            </div>
          ) : pullState === 'ready' ? (
            <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-full shadow-md border border-emerald-100 dark:border-neutral-800">
              <span className="text-emerald-500 text-xs animate-bounce font-sans">↓</span>
              <span className="text-[10px] font-black text-emerald-600 font-sans">Release to refresh!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-full shadow-xs border border-slate-100 dark:border-neutral-800 select-none">
              <span className="text-slate-400 text-xs animate-pulse font-sans">↓</span>
              <span className="text-[10px] font-bold text-slate-500 font-sans">Pull down to refresh...</span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------- */}
      {/* Stories Slide panel (Facebook Style) */}
      {/* ------------------------- */}
      <div className="bg-white dark:bg-neutral-900 py-3.5 px-4 border-b border-neutral-100 dark:border-neutral-800 flex gap-3 overflow-x-auto scrollbar-none z-10 select-none shrink-0">
        {/* Your Story trigger (Facebook Style dynamic check) */}
        {myStories.length > 0 ? (
          <div 
            className="relative w-24 h-36 rounded-2xl overflow-hidden shrink-0 cursor-pointer shadow-sm group hover:scale-[1.02] active:scale-98 transition-all duration-300 border border-amber-500 bg-slate-100"
            onClick={() => viewStory(myStories[0])}
          >
            {/* Background Story Thumbnail */}
            <img 
              src={myStories[0].mediaUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            {/* Gradient overlays to guarantee high contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 z-0" />

            {/* Profile avatar overlay with a mini '+' badge */}
            <div 
              className="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full overflow-hidden border-2 border-white p-0.5 bg-amber-500 shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                triggerStoryUpload();
              }}
              title="Add story"
            >
              <img src={myProfile.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
            </div>

            {/* Plus icon on top-right to directly add story */}
            <div 
              className="absolute top-2.5 right-2.5 rounded-full w-6 h-6 bg-amber-500 hover:bg-amber-600 border border-white flex items-center justify-center text-white font-extrabold text-xs shadow-md z-10 hover:scale-110 active:scale-95 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                triggerStoryUpload();
              }}
              title="Add story"
            >
              +
            </div>

            {/* Bottom aligned label */}
            <span className="absolute bottom-2 left-2 right-2 z-10 text-[9.5px] font-black text-white truncate drop-shadow-sm leading-tight text-left">
              Your Story
            </span>

            <input
              type="file"
              ref={storyInputRef}
              onChange={handleStoryFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          <div 
            className="relative w-24 h-36 rounded-2xl overflow-hidden shrink-0 cursor-pointer bg-slate-50 dark:bg-zinc-800/50 border border-neutral-200/50 dark:border-neutral-850 flex flex-col shadow-sm group hover:border-amber-500 transition-all duration-300" 
            onClick={triggerStoryUpload}
          >
            {/* Cover image area */}
            <div className="relative w-full h-[68%] overflow-hidden bg-slate-100 dark:bg-zinc-800">
              <img 
                src={myProfile.avatarUrl} 
                alt="" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            </div>
            {/* Label area */}
            <div className="relative w-full h-[32%] bg-white dark:bg-neutral-900 flex flex-col items-center justify-center">
              {/* Overlapping circular plus button */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white rounded-full w-7 h-7 border-2 border-white dark:border-neutral-900 flex items-center justify-center shadow-md font-bold text-base group-hover:scale-110 active:scale-95 transition-all">
                +
              </div>
              <span className="text-[10px] font-black text-slate-700 dark:text-neutral-300 mt-2">Add Story</span>
            </div>

            <input
              type="file"
              ref={storyInputRef}
              onChange={handleStoryFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}

        {/* Other Users Stories */}
        {uniqueUserStoriesMap.map((story) => (
          <div 
            key={story.id} 
            className="relative w-24 h-36 rounded-2xl overflow-hidden shrink-0 cursor-pointer shadow-sm group hover:scale-[1.02] active:scale-98 transition-all duration-300 border border-neutral-100 dark:border-neutral-800" 
            onClick={() => viewStory(story)}
          >
            {/* Background Story Thumbnail */}
            <img 
              src={story.mediaUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            {/* Gradient overlays to guarantee high contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 z-0" />

            {/* User circular avatar overlaid on top-left of the story thumbnail */}
            <div className="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full overflow-hidden border-2 border-amber-500 p-0.5 bg-white shadow-md">
              <img src={story.userAvatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
            </div>

            {/* Bottom aligned user name */}
            <span className="absolute bottom-2 left-2 right-2 z-10 text-[9.5px] font-black text-white truncate drop-shadow-sm leading-tight text-left">
              {story.userName}
            </span>
          </div>
        ))}
      </div>



      {/* ------------------------- */}
      {/* Social Timeline Posts     */}
      {/* ------------------------- */}
      <div className="p-4 space-y-4 flex-1">
        
        {filteredPosts.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-150/50 dark:border-neutral-800 shadow-xs">
            <p className="text-xs font-bold text-slate-755 dark:text-zinc-300">No creator posts found.</p>
            <p className="text-[10px] mt-1 text-slate-400">Reset your search filters or upload a premium photo yourself!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isLiked = post.likedBy?.includes(myProfile.id);
            const isAuthor = post.authorId === myProfile.id;
            const isUnlocked = post.unlockedByUserIds?.includes(myProfile.id) || isAuthor || !post.isPremiumPost;
            const postComments = dbService.getComments(post.id);

            return (
              <div
                key={post.id}
                className="bg-white dark:bg-neutral-900 rounded-[28px] p-5 shadow-sm border border-neutral-150/75 dark:border-neutral-800 space-y-3.5 relative overflow-hidden"
              >
                
                {/* Post Header Card */}
                <div className="flex justify-between items-center">
                  <div
                    onClick={() => onUserSelect && onUserSelect(post.authorId)}
                    className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-150 bg-slate-50">
                      <img src={post.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-neutral-100 flex items-center gap-0.5">
                        {post.authorName}
                        {post.authorIsVerified && (
                          <VerifiedBadge className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span className="text-[9.5px] text-zinc-400 font-bold font-mono block">
                        {safeFormatDate(post.createdAt)} • {post.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Sponsored/Boosted Post badge */}
                    {post.boostUntil && new Date(post.boostUntil).getTime() > Date.now() && (
                      <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[8px] font-black px-2 py-0.5 rounded-full select-none flex items-center gap-1 uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/40 animate-pulse">
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span>Sponsored</span>
                      </span>
                    )}

                    {/* Premium Post badge */}
                    {post.isPremiumPost && (
                      <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full select-none flex items-center gap-0.5 uppercase tracking-wider shadow-sm">
                        <Lock className="w-2.5 h-2.5" />
                        <span>PREMIUM</span>
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedPostOptions(post)}
                      className="p-1 px-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800"
                    >
                      <MoreHorizontal className="w-5 h-5 text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 transition" />
                    </button>
                  </div>
                </div>

                {/* Content description title text */}
                {(() => {
                  const parsed = parsePostContent(post.content);
                  if (parsed.gradientId) {
                    const bgClass = FEED_GRADIENTS[parsed.gradientId] || 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white';
                    return (
                      <div className={`w-full min-h-[160px] flex flex-col items-center justify-center p-6 text-center rounded-2xl shadow-inner font-display select-text mb-3 ${bgClass}`}>
                        {post.title && (
                          <h3 className="text-sm font-black tracking-wide mb-1 opacity-90">{post.title}</h3>
                        )}
                        <p className="text-sm font-black tracking-wide whitespace-pre-wrap leading-relaxed select-text">
                          {parsed.cleanContent}
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="space-y-1 pr-1.5 text-left mb-3">
                        {post.title && (
                          <h3 className="text-xs font-extrabold text-slate-850 dark:text-white">{post.title}</h3>
                        )}
                        <p className="text-xs text-slate-700 dark:text-neutral-250 whitespace-pre-wrap leading-relaxed font-sans font-medium">
                          {post.content}
                        </p>
                      </div>
                    );
                  }
                })()}

                {/* Shared Post Container Reference */}
                {post.sharedPostId && (
                  <div className="border border-neutral-100 dark:border-neutral-800 rounded-2xl p-3.5 bg-neutral-50 dark:bg-neutral-900/60 text-left space-y-2 mt-1 animate-fadeIn mx-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-[#11af5f] dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider block">
                        মূল পোস্ট (Original)
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                        @{post.sharedPostAuthorName}
                      </span>
                    </div>
                    {post.title && (
                      <h4 className="text-[11.5px] font-extrabold text-neutral-800 dark:text-neutral-200 leading-snug">
                        {post.title.replace('Shared: ', '')}
                      </h4>
                    )}
                    <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed italic">
                      "এখানে উপরে সংযুক্ত করা ছবিটি বা ভিডিওটি পূর্বে ওনার দ্বারা প্রকাশিত।"
                    </p>
                  </div>
                )}

                {/* PREMIUM LOCK/UNLOCK INTERFACES */}
                {post.mediaUrl && (
                  <div className={`relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center ${
                    isUnlocked ? 'w-full max-h-[600px]' : 'aspect-video w-full'
                  }`}>
                    {isUnlocked ? (
                      /* Rendering standard unlocked media content */
                      post.mediaType === 'image' ? (
                        <img
                          src={post.mediaUrl}
                          alt="Unlocked attachment"
                          className="w-full h-auto max-h-[600px] object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full max-h-[600px] bg-black flex items-center justify-center">
                          <video src={post.mediaUrl} controls playsInline className="w-full h-auto max-h-[600px] object-contain" />
                        </div>
                      )
                    ) : (
                      /* Display LOCKED dynamic cover layout */
                      <div className="absolute inset-0 bg-zinc-950/90 flex flex-col justify-center items-center text-center p-5 space-y-4 w-full h-full">
                        {/* Blurred sample image backdrop */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 filter blur-lg scale-105">
                          <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                        </div>

                        <div className="relative z-10 w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center text-amber-500 animate-pulse select-none">
                          <Lock className="w-5 h-5" />
                        </div>

                        <div className="relative z-10 space-y-1 px-4 leading-relaxed">
                          <h4 className="text-xs font-extrabold text-amber-400">Exclusive Creator Post Locked</h4>
                          <p className="text-[10px] text-zinc-350">
                            Unlock this exclusive high-definition content from the creator for <b>{post.starPrice} Stars</b>! 🌟✨
                          </p>
                        </div>

                        <button
                          onClick={() => handleUnlockPost(post.id, post.starPrice)}
                          className="relative z-10 bg-amber-500 hover:bg-amber-600 active:scale-95 transition text-white font-black py-2 px-6 rounded-full text-[10.5px] flex items-center gap-1 shadow-md shadow-amber-500/10 cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Unlock with {post.starPrice} Stars</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Counters and actions bar */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans font-bold border-b border-slate-50 dark:border-zinc-850 pb-2.5">
                  <span className="select-none">{post.likesCount} Likes</span>
                  <div className="flex gap-2.5">
                    <span>{post.commentsCount} Comments</span>
                    <span>{post.sharesCount || 0} Shares</span>
                  </div>
                </div>

                {/* Gifts List Component */}
                {post.gifts && post.gifts.length > 0 && (
                  <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 rounded-2xl p-2.5 mt-2 flex flex-col text-left font-sans animate-fadeIn">
                    <div className="flex items-center gap-1 text-[9.5px] font-black text-amber-600 dark:text-amber-400 mb-1.5 uppercase tracking-wider pl-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
                      পেজে গিফট প্রাপ্তি: মোট {post.gifts.reduce((acc, g) => acc + g.amount, 0)} স্টার গিফট করা হয়েছে!
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
                      {post.gifts.map((gift, gIdx) => (
                        <div key={gIdx} className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1 px-2.5 rounded-full border border-neutral-150/40 dark:border-zinc-800 shrink-0 text-[10px] shadow-sm">
                          <img src={gift.userAvatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                          <span className="font-extrabold text-slate-800 dark:text-zinc-200 truncate max-w-[70px]">{gift.userName}</span>
                          <span className="font-black text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1 rounded font-mono shrink-0">⭐{gift.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interaction Action Row buttons */}
                <div className="flex items-center justify-between pt-1 font-bold gap-2 select-none">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex-1 py-2 text-[11px] rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 ${
                      isLiked
                        ? 'bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/35'
                        : 'bg-slate-50 border-neutral-100 dark:bg-zinc-800 dark:border-neutral-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                    <span>Like</span>
                  </button>

                  <button
                    onClick={() => handleOpenComments(post)}
                    className="flex-1 py-2 text-[11px] rounded-xl border border-neutral-100 dark:border-neutral-800 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Comment</span>
                  </button>

                  {/* Send Virtual Stars direct tip feature button */}
                  {!isAuthor && (
                    <button
                      onClick={() => handleOpenGifting(post)}
                      className="py-2 px-4 text-[11px] bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer active:scale-98 shadow-sm font-black shrink-0 animate-pulse hover:animate-none"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Gift Stars</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSharingPost(post)}
                    className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-neutral-100 dark:border-neutral-800 text-slate-500 dark:text-zinc-300 rounded-xl flex items-center justify-center shrink-0 cursor-pointer active:scale-98"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Live comments preview section */}
                {postComments.length > 0 && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-neutral-950 border border-neutral-100/40 dark:border-neutral-850 text-left space-y-1.5">
                    <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-mono">Recent Comments</span>
                    <div className="space-y-1">
                      {postComments.slice(-2).map((cmt) => (
                        <div key={cmt.id} className="text-[11.5px] leading-relaxed flex items-start gap-1 text-slate-700 dark:text-neutral-350">
                          <span className="font-extrabold text-slate-850 dark:text-neutral-200 shrink-0">{cmt.authorName}:</span>
                          <span className="font-medium pr-1">{cmt.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------- */}
      {/* Modal: Story Viewing Player overlay */}
      {/* ------------------------------------- */}
      {activeStory && currentStory && myProfile && (
        <div className="absolute inset-0 bg-neutral-950 z-55 flex flex-col justify-between p-4 rounded-[inherit] overflow-hidden select-none animate-fadeIn">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 filter blur-xl scale-105">
            <img src={currentStory.mediaUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Story Timer progress indicator */}
            <div className="w-full h-1 bg-neutral-800/80 rounded-full overflow-hidden flex gap-1">
              {activeUserStories.map((s, idx) => {
                const currentStoryIndex = activeUserStories.findIndex(st => st.id === currentStory.id);
                let w = 0;
                if (idx < currentStoryIndex) w = 100;
                else if (idx === currentStoryIndex) w = storyTimer;
                return (
                  <div key={s.id} className="flex-1 h-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-150 ease-linear" style={{ width: `${w}%` }}></div>
                  </div>
                );
              })}
            </div>

            {/* Header profile details */}
            <div className="flex justify-between items-center text-white mt-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-500 bg-slate-900">
                  <img src={currentStory.userAvatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-black block leading-none">{currentStory.userName}</span>
                  <span className="text-[8px] text-zinc-400 font-mono mt-0.5">
                    {safeFormatTime(currentStory.createdAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-xs cursor-pointer active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* Story Image container */}
            <div className="flex-1 w-full flex items-center justify-center my-2.5 relative rounded-2xl overflow-hidden bg-neutral-900/40 p-1">
              {/* Navigate Tap pads */}
              <div className="absolute left-0 top-0 bottom-0 w-1/4 z-20 cursor-w-resize" onClick={handlePrevStory}></div>
              <div className="absolute right-0 top-0 bottom-0 w-1/4 z-20 cursor-e-resize" onClick={handleNextStory}></div>

              <img
                src={currentStory.mediaUrl}
                alt=""
                className="max-w-full max-h-[48vh] object-contain rounded-xl relative z-10 shadow-xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Viewers & Reaction Stats row */}
            <div className="px-1 py-1.5 flex items-center justify-between text-white/95 text-[10.5px] border-t border-white/10 mt-1">
              <div className="flex items-center gap-1.5 flex-wrap max-w-[60%]">
                <span className="bg-white/15 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono text-[10px] font-black">
                  👁️ {currentStory.viewedBy?.length || 0} views
                </span>
                {currentStory.viewedBy && currentStory.viewedBy.length > 0 && currentStory.userId === myProfile.id && (
                  <span className="text-[8.5px] text-zinc-400 font-bold block truncate max-w-[120px]">
                    ({currentStory.viewedBy.map(vId => dbService.getUserById(vId)?.name).filter(Boolean).join(', ')})
                  </span>
                )}
              </div>

              {/* Reaction emojis breakdown counter */}
              <div className="flex items-center gap-1.5 font-bold text-[10px]">
                {Object.keys(currentStory.reacts || {}).length > 0 ? (
                  <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
                    <span>Reactions:</span>
                    <span className="text-amber-400 font-mono font-black">{Object.keys(currentStory.reacts || {}).length}</span>
                    <div className="flex gap-0.5 ml-0.5">
                      {Array.from(new Set(Object.values(currentStory.reacts || {}))).slice(0, 3).map((emoji, i) => (
                        <span key={i}>{emoji}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-[9.5px] text-zinc-500">No reactions yet</span>
                )}
              </div>
            </div>

            {/* Micro Comments scrolling list */}
            {currentStory.comments && currentStory.comments.length > 0 && (
              <div className="max-h-[14vh] overflow-y-auto space-y-1.5 my-1.5 text-left bg-black/45 p-2 rounded-xl border border-white/5 scrollbar-none">
                {currentStory.comments.map((cmt, idx) => (
                  <div key={cmt.id || idx} className="text-[11px] leading-tight flex items-start gap-1.5">
                    <img src={cmt.userAvatarUrl} alt="" className="w-4.5 h-4.5 rounded-full object-cover shrink-0" />
                    <div className="flex-1">
                      <span className="font-black text-amber-400 mr-1">{cmt.userName}:</span>
                      <span className="text-zinc-200 font-medium">{cmt.content}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reactions Selection Bar */}
            <div className="py-1 flex items-center justify-center gap-3">
              {['👍', '❤️', '😆', '😮', '😢', '😡'].map((emoji) => {
                const isMyReact = currentStory.reacts?.[myProfile.id] === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      dbService.reactToStory(currentStory.id, myProfile.id, emoji);
                      loadFeedData();
                    }}
                    className={`text-xl p-1 rounded-full hover:bg-white/20 transition cursor-pointer active:scale-125 ${isMyReact ? 'bg-amber-500/25 border border-amber-500/40 scale-110' : ''}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>

            {/* Micro Story Comment Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem('storyComment') as HTMLInputElement;
                const txt = input.value.trim();
                if (!txt) return;
                dbService.commentOnStory(currentStory.id, myProfile.id, myProfile.name, myProfile.avatarUrl, txt);
                input.value = '';
                setIsStoryCommentFocused(false);
                loadFeedData();
              }}
              className="flex gap-1.5 px-0.5 py-1"
            >
              <input
                type="text"
                name="storyComment"
                required
                placeholder="Type a response comment..."
                onFocus={() => setIsStoryCommentFocused(true)}
                onBlur={() => setTimeout(() => setIsStoryCommentFocused(false), 300)}
                className="flex-1 bg-white/10 placeholder-white/35 text-white border border-white/10 rounded-full px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-left"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4 text-xs font-extrabold cursor-pointer transition active:scale-95"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------- */}
      {/* Slide Sheet: Dedicated comments drawer    */}
      {/* ----------------------------------------- */}
      {activeCommentsPost && (
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end sm:justify-center p-0 sm:p-4"
          onClick={() => setActiveCommentsPost(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg mx-auto h-[85%] sm:h-[750px] sm:max-h-[85vh] bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col animate-slideUp overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-850 flex items-center justify-between bg-white dark:bg-neutral-900">
              <h3 className="font-extrabold text-slate-800 dark:text-neutral-150 text-sm text-left">Comments ({commentsList.length})</h3>
              <button
                onClick={() => setActiveCommentsPost(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white p-1.5 transition cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-zinc-950 scrollbar-none font-sans">
              {commentsList.length === 0 ? (
                <div className="py-12 text-center text-zinc-450 dark:text-zinc-500 text-xs font-semibold">কোনো কমেন্ট পাওয়া যায়নি। প্রথম কমেন্টটি আপনি করুন!</div>
              ) : (
                commentsList.map((cmt, index) => {
                  // For rich highlighting, parse tags like @followers or @highlight
                  const renderContentWithTags = (text: string) => {
                    if (text.includes('@followers')) {
                      const parts = text.split('@followers');
                      return (
                        <>
                          {parts[0]}
                          <span className="text-[#1877f2] font-semibold">@followers</span>
                          {parts[1]}
                        </>
                      );
                    }
                    if (text.includes('@highlight')) {
                      const parts = text.split('@highlight');
                      return (
                        <>
                          {parts[0]}
                          <span className="text-[#1877f2] font-semibold">@highlight</span>
                          {parts[1]}
                        </>
                      );
                    }
                    return text;
                  };

                  // Safe Bengali time ago representation
                  const getBengaliTimeAgo = (timeStr: string) => {
                    const diff = Date.now() - new Date(timeStr).getTime();
                    const mins = Math.floor(diff / 60000);
                    const hrs = Math.floor(mins / 60);
                    const days = Math.floor(hrs / 24);

                    if (mins < 1) return 'এইমাত্র';
                    if (mins < 60) return `${mins} মিনিট আগে`;
                    if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
                    return `${days} দিন আগে`;
                  };

                  return (
                    <div key={cmt.id} className="space-y-2">
                      {/* Parent Comment */}
                      <div className="flex gap-2.5 text-left items-start">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 shrink-0 relative border border-neutral-150">
                          <img src={cmt.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Chat bubble */}
                          <div className="inline-block bg-[#f0f2f5] dark:bg-zinc-900 rounded-[18px] px-3.5 py-2 max-w-full">
                            <span className="block text-[11.5px] font-black text-slate-900 dark:text-neutral-100 mb-0.5 leading-snug">{cmt.authorName}</span>
                            <p className="text-xs text-slate-800 dark:text-neutral-200 leading-normal font-sans break-words whitespace-pre-wrap select-text">
                              {renderContentWithTags(cmt.content)}
                            </p>
                          </div>

                          {/* Footer Actions Row */}
                          <div className="flex items-center gap-3.5 text-[10px] text-zinc-500 font-bold ml-2.5 mt-1 select-none">
                            <span>{getBengaliTimeAgo(cmt.createdAt)}</span>
                            <button className="hover:text-[#1877f2] cursor-pointer transition">লাইক করুন</button>
                            <button className="hover:text-[#1877f2] cursor-pointer transition">জবাব দিন</button>
                          </div>
                        </div>
                      </div>

                      {/* Simulated Nested reply mimicking the screenshot precisely with vertical connector line */}
                      {index === 0 && (
                        <div className="pl-6 relative">
                          {/* Vertical Connector Line */}
                          <div className="absolute left-[18px] top-[-26px] bottom-[18px] w-[1.5px] bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                          {/* Horizontal branch line */}
                          <div className="absolute left-[18px] top-[18px] w-3.5 h-[1.5px] bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                          
                          <div className="flex gap-2 text-left items-start pl-4">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-200 shrink-0 relative border border-neutral-150">
                              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="inline-block bg-[#f0f2f5] dark:bg-zinc-900 rounded-[18px] px-3 py-1.5 max-w-full">
                                <span className="block text-[10.5px] font-black text-slate-900 dark:text-neutral-100 leading-snug">
                                  Nusaib Bin Shohidul Farazi
                                </span>
                                <p className="text-xs text-slate-800 dark:text-neutral-200 leading-normal font-sans break-words select-text">
                                  <span className="text-[#1877f2] font-semibold">@highlight</span> সুন্দর মন্তব্য করার জন্য ধন্যবাদ! আমাদের পেইজের পাশেই থাকুন। 🥰
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-bold ml-2.5 mt-0.5 select-none">
                                <span>২২ ঘণ্টা</span>
                                <button className="hover:text-[#1877f2] cursor-pointer">লাইক করুন</button>
                                <button className="hover:text-[#1877f2] cursor-pointer">জবাব দিন</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleAddComment} className="p-3 border-t border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 flex items-center justify-between gap-2">
              {/* Left Side: Photo upload attachment shortcut icon */}
              <button 
                type="button" 
                onClick={() => {
                  const me = dbService.getCurrentUser();
                  if (me && !me.galleryAccessGranted) {
                    const confirmAccess = window.confirm(
                      "📷 গ্যালারী অ্যাক্সেস পারমিশন রিকোয়েস্ট (Gallery Access Request)\n\n" +
                      "আপনার ডিভাইস গ্যালারী স্ক্যান্ড এবং ফটো আপলোড করার জন্য পারমিশন প্রয়োজন।\n" +
                      "পারমিশন মঞ্জুর করতে এবং গ্যালারী স্ক্যান করতে 'OK' প্রেস করুন।"
                    );
                    if (confirmAccess) {
                      dbService.grantGalleryAccess(me.id);
                      alert("✅ গ্যালারী এক্সেস মঞ্জুর করা হয়েছে!");
                    } else {
                      return;
                    }
                  }
                  alert("কমেন্টে পিকচার এটাচমেন্ট ফিচার খুব শীঘ্রই চালু হচ্ছে! 🖼️✨");
                }} 
                className="p-1.5 text-zinc-500 hover:text-indigo-650 dark:hover:text-amber-500 active:scale-90 transition shrink-0 inline-flex items-center justify-center rounded-full cursor-pointer hover:bg-neutral-100 dark:hover:bg-zinc-800"
                title="Attach photo"
              >
                <Camera className="w-5 h-5 text-zinc-500" />
              </button>

              {/* Sticky Pill Comment Input Bar */}
              <div className="flex-1 flex items-center bg-[#f0f2f5] dark:bg-zinc-950 rounded-full border border-neutral-150 dark:border-zinc-850 px-3.5 py-1.5 max-h-[44px]">
                <input
                  type="text"
                  required
                  placeholder="একটি কমেন্ট লিখুন..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-0 leading-tight py-1 pr-1.5"
                />

                {/* Right inside actions: Emojis, GIF, Stickers */}
                <div className="flex items-center gap-1.5 shrink-0 select-none">
                  <button 
                    type="button" 
                    onClick={() => {
                      setNewCommentText(prev => prev + " 🥰❤️");
                    }} 
                    className="text-zinc-500 hover:text-amber-500 hover:scale-105 active:scale-95 transition text-[13px] leading-none"
                    title="Insert reaction emoji"
                  >
                    ❤️
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setNewCommentText(prev => prev + " @highlight");
                    }} 
                    className="text-[9px] font-black text-[#1877f2] bg-[#e7f3ff] dark:bg-blue-950/40 p-1 px-1.5 rounded-md hover:scale-105 transition"
                    title="Tag highlight"
                  >
                    @mention
                  </button>
                  <span className="text-[9px] font-bold font-sans text-zinc-400 border border-zinc-300 dark:border-zinc-805 p-0.5 px-1 rounded-md leading-none scale-90">GIF</span>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="bg-[#1877f2] text-white p-2 text-xs font-bold rounded-full flex items-center justify-center hover:bg-blue-600 shadow-sm active:scale-95 transition cursor-pointer shrink-0 w-8 h-8"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------- */}
      {/* 3. Action Sheet: Gifting direct Stars */}
      {/* ------------------------------------- */}
      {giftingPost && (
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-xs z-55 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setGiftingPost(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 animate-slideUp shadow-2xl border border-neutral-200 dark:border-neutral-800 text-left"
          >
            
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500 animate-bounce" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">Send Star Gift to Creator</h3>
              </div>
              <button onClick={() => setGiftingPost(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold p-1 text-xs">✕ Close</button>
            </div>

            {giftingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-150 animate-bounce text-xl">
                  ✨
                </div>
                <p className="text-xs font-bold text-emerald-600">Stars gifted successfully! 😍🌟</p>
                <p className="text-[10px] text-zinc-400">Your appreciation motivates our creators!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-neutral-50 dark:bg-zinc-950 border border-neutral-150 dark:border-neutral-850 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-white border shrink-0">
                    <img src={giftingPost.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200 block truncate">Recipient: {giftingPost.authorName}</span>
                    <span className="text-[10px] text-zinc-400 block font-mono truncate">Post Title: {giftingPost.title || 'Creator Post'}</span>
                  </div>
                </div>

                {giftingError && (
                  <div className="bg-rose-55 border border-rose-100 dark:border-rose-950/50 dark:bg-rose-950/20 p-3 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex flex-col gap-2 items-start justify-start">
                    <div className="flex gap-1 items-center">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{giftingError}</span>
                    </div>
                    {giftingError.toLowerCase().includes('balance') && (
                      <button
                        type="button"
                        onClick={() => {
                          const me = dbService.getCurrentUser();
                          if (me) {
                            me.starBalance += 500;
                            dbService.updateUserRecord(me);
                            window.dispatchEvent(new CustomEvent('starconnect_db_update'));
                            setMyProfile({ ...me });
                            setGiftingError('');
                          }
                        }}
                        className="mt-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition duration-150 active:scale-95 cursor-pointer shadow-sm"
                      >
                        ⚡ Instant Free Top Up (+500 Stars)
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 block uppercase pl-1 animate-pulse">Select Gift Amount</label>
                  
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {[10, 50, 100, 200].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setGiftAmount(amt)}
                        className={`py-2.5 sm:py-3.5 rounded-xl text-center text-xs font-black transition cursor-pointer font-mono border ${
                          giftAmount === amt
                            ? 'border-amber-500 bg-amber-50/20 text-amber-600 font-extrabold dark:bg-amber-955/20'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-zinc-450 dark:text-zinc-400'
                        }`}
                      >
                        ⭐ {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-xl flex justify-between select-none items-center text-xs border border-amber-500/25">
                  <span className="text-amber-750 dark:text-amber-300 font-bold">Your Wallet Balance:</span>
                  <span className="font-extrabold text-amber-800 dark:text-amber-400 font-mono">⭐ {myProfile.starBalance} Stars</span>
                </div>

                <button
                  onClick={handleSendGift}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-lg shadow-amber-500/10 active:scale-98 transition cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  <span>Gift {giftAmount} Stars</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------- */}
      {/* Report or Blocking Actions Sheet Menu */}
      {/* ------------------------------------- */}
      {selectedPostOptions && (
        <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-neutral-900 rounded-t-3xl z-55 border-t border-neutral-205 shadow-2xl p-4 space-y-3 animate-slideUp text-left">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest block font-display">Post Options</span>
            <button onClick={() => { setSelectedPostOptions(null); setShowReportForm(false); }} className="text-neutral-400 font-bold text-xs p-2">✕ Close</button>
          </div>

          {!showReportForm ? (
            <div className="space-y-2 text-xs">
              <button
                onClick={() => setShowReportForm(true)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-xl text-rose-600 font-bold cursor-pointer"
              >
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>Report inappropriate content (Report Post)</span>
              </button>

              <button
                onClick={() => {
                  dbService.blockUser(selectedPostOptions.authorId);
                  alert(`Creator "${selectedPostOptions.authorName}" has been blocked. Their posts will no longer appear on your feed.`);
                  setSelectedPostOptions(null);
                  loadFeedData();
                }}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-xl text-neutral-700 dark:text-zinc-200 font-bold cursor-pointer"
              >
                <ShieldAlert className="w-5 h-5 text-neutral-450" />
                <span>Block this creator directly (Block Creator)</span>
              </button>

              {/* Delete post option (Own post OR Admin power) */}
              {(selectedPostOptions.authorId === myProfile?.id || myProfile?.role === 'admin' || myProfile?.id === 'user_admin') && (
                <button
                  onClick={() => {
                    if (window.confirm('আপনি কি নিশ্চিত যে এই পোস্টটি ডিলিট করতে চান? (Are you sure you want to delete this post?)')) {
                      dbService.deletePost(selectedPostOptions.id);
                      alert('🎉 পোস্টটি সফলভাবে ডিলিট করা হয়েছে! (Post deleted successfully!)');
                      setSelectedPostOptions(null);
                      loadFeedData();
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 border border-rose-200/40 rounded-xl text-rose-600 dark:text-rose-450 font-extrabold cursor-pointer"
                >
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black">পোস্ট মুছে ফেলুন (Delete Post)</span>
                    <span className="text-[10px] text-rose-400 font-semibold mt-0.5 leading-none">
                      {selectedPostOptions.authorId === myProfile?.id ? 'নিজের পোস্ট ডিলিট করুন' : 'এডমিন ক্ষমতা দ্বারা ডিলিট করুন'}
                    </span>
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Write down reporting reason:</span>
              <input
                type="text"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="e.g. Inappropriate media, spam, harassment..."
                className="w-full border dark:border-neutral-800 border-neutral-250 p-3.5 rounded-xl text-xs dark:bg-neutral-950 dark:text-white"
              />
              <button
                onClick={handleReportPostSubmit}
                disabled={!reportReason.trim()}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-xl text-center active:scale-95 transition cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Multiple Share Options Modal (মোবাইল ড্রয়ার স্টাইল) */}
      {sharingPost && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] pb-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-150 dark:border-neutral-800 shrink-0">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-500" />
                <span className="font-extrabold text-slate-800 dark:text-neutral-100 text-[13px]">শেয়ার করুন (Share Post)</span>
              </div>
              <button
                onClick={() => setSharingPost(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Share Options list */}
            <div className="p-5 space-y-4 text-left overflow-y-auto">
              <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest block mb-1">
                শেয়ার করার মাধ্যমসমূহ (Multiple Options)
              </span>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Share to profile/wall */}
                <button
                  onClick={() => {
                    const success = dbService.sharePostToMyFeed(sharingPost.id);
                    if (success) {
                      alert(`🎉 সফলভাবে আপনার প্রোফাইল ওয়ালে পোস্টটি শেয়ার করা হয়েছে!`);
                      setSharingPost(null);
                      loadFeedData();
                    } else {
                      alert('Post share failed.');
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 rounded-2xl transition text-left cursor-pointer active:scale-99"
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow shadow-emerald-500/30 shrink-0">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[12.5px] font-extrabold text-emerald-700 dark:text-emerald-400">নিজের প্রোফাইলে শেয়ার করুন</h4>
                      <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 leading-none mt-0.5">আপনার রি-পোস্ট এবং ওয়ালে চলে আসবে</p>
                    </div>
                  </div>
                  <span className="text-emerald-600 font-extrabold text-[11px] shrink-0">১-ক্লিক →</span>
                </button>

                {/* 2. Copy Link */}
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/posts/${sharingPost.id}`;
                    navigator.clipboard.writeText(link).then(() => {
                      alert(`🔗 লিংক ক্লিপবোর্ডে কপি করা হয়েছে:\n${link}`);
                      setSharingPost(null);
                    }).catch(() => {
                      alert(`🔗 লিংকটি নিম্নরূপ:\n${link}`);
                      setSharingPost(null);
                    });
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-850 dark:hover:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-850 rounded-2xl transition text-left cursor-pointer active:scale-99"
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-9 h-9 bg-neutral-205 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-200 rounded-xl flex items-center justify-center shrink-0">
                      <Send className="w-4 h-4 text-sky-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">লিংক কপি করুন (Copy Link)</h4>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium leading-none mt-0.5">খুব সহজেই বন্ধুদের মেসেজ বক্সে পাঠান</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-zinc-400 shrink-0">কপি</span>
                </button>

                {/* 3. Send via messenger direct message to friend */}
                <div className="border border-neutral-200/60 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
                  <h5 className="text-[9.5px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                    সরাসরি মেসেঞ্জারে পাঠান (Send to Friends)
                  </h5>
                  
                  {/* Select friend and send message */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
                    {dbService.getUsers().filter(u => u.id !== myProfile.id).length === 0 ? (
                      <p className="text-[10.5px] text-zinc-400 font-semibold italic text-center py-2">কোনো বন্ধু পাওয়া যায়নি</p>
                    ) : (
                      dbService.getUsers().filter(u => u.id !== myProfile.id).map(friend => (
                        <div key={friend.id} className="flex justify-between items-center bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-100 dark:border-neutral-800/80 shadow-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden border border-neutral-200 shrink-0">
                              <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-200 truncate max-w-[120px]">{friend.name}</span>
                          </div>
                          <button
                            onClick={() => {
                              const link = `${window.location.origin}/posts/${sharingPost.id}`;
                              dbService.sendMessage(friend.id, `আপনার সাথে এই পোস্টটি শেয়ার করেছে: \n${sharingPost.title || 'পোস্ট'} \nলিংক: ${link}`);
                              alert(`✉️ সফলভাবে "${friend.name}"-কে ইনবক্সে পোস্ট পাঠানো হয়েছে!`);
                              setSharingPost(null);
                            }}
                            className="bg-sky-500 hover:bg-sky-600 text-white text-[9px] font-black px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            পাঠান (Send)
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
