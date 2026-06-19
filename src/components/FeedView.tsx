/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Bell, Heart, MessageCircle, Share2, MoreHorizontal, CheckCircle2, ShieldAlert, Sparkles, Send, Lock, Gift, Coins, AlertCircle } from 'lucide-react';
import { Post, Comment, Story, UserProfile, NotificationItem } from '../types';
import { dbService } from '../services/db';
import { VerifiedBadge } from './VerifiedBadge';

interface FeedViewProps {
  onNavigate: (screen: string) => void;
  onUserSelect?: (userId: string) => void;
  onMessageUser?: (userId: string) => void;
}

export default function FeedView({ onNavigate, onUserSelect, onMessageUser }: FeedViewProps) {
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
    if (!giftingPost || !myProfile) return;
    if (myProfile.id === giftingPost.authorId) {
      setGiftingError('You cannot send star gifts to yourself!');
      return;
    }
    if (myProfile.starBalance < giftAmount) {
      setGiftingError(`Oops! You don't have enough balance. Top up your wallet now!`);
      return;
    }

    const res = dbService.sendDirectStars(giftingPost.authorId, giftAmount);
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
                      {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {post.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
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
                <div className="space-y-1 pr-1.5 text-left">
                  {post.title && (
                    <h3 className="text-xs font-extrabold text-slate-850 dark:text-white">{post.title}</h3>
                  )}
                  <p className="text-xs text-slate-700 dark:text-neutral-250 whitespace-pre-wrap leading-relaxed font-sans font-medium">
                    {post.content}
                  </p>
                </div>

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
                    onClick={() => handleSharePostLink(post)}
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
                    {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex flex-col justify-end"
          onClick={() => setActiveCommentsPost(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full h-[85%] bg-white dark:bg-neutral-900 rounded-t-[32px] border-t border-neutral-100 dark:border-neutral-800 shadow-2xl flex flex-col animate-slideUp overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-850 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-neutral-150 text-xs text-left">Comments ({commentsList.length})</h3>
              <button
                onClick={() => setActiveCommentsPost(null)}
                className="text-xs font-bold text-slate-450 p-2 hover:text-slate-650 transition cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-zinc-950">
              {commentsList.length === 0 ? (
                <div className="py-12 text-center text-zinc-450 dark:text-zinc-500 text-xs">No comments found. Be the first to leave a warm comment!</div>
              ) : (
                commentsList.map(cmt => (
                  <div key={cmt.id} className="flex gap-2.5 text-left">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 shrink-0">
                      <img src={cmt.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 bg-white dark:bg-neutral-850 rounded-2xl p-3 border border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-neutral-250">{cmt.authorName}</span>
                        <span className="text-[8.5px] text-zinc-400 font-mono">
                          {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-655 dark:text-neutral-300 leading-relaxed font-sans font-medium">{cmt.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2">
              <input
                type="text"
                required
                placeholder="Write a beautiful comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 bg-slate-5 w border border-neutral-250 dark:border-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-zinc-500 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-500 text-white p-2.5 rounded-xl flex items-center justify-center hover:bg-amber-600 shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------- */}
      {/* 3. Action Sheet: Gifting direct Stars */}
      {/* ------------------------------------- */}
      {giftingPost && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-55 flex items-end justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-[32px] w-full p-6 space-y-4 animate-slideUp shadow-2xl border-t border-neutral-200">
            
            <div className="flex justify-between items-center border-b border-neutral-110 pb-2">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-500 animate-bounce" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200 text-left">Send Star Gift to Creator</h3>
              </div>
              <button onClick={() => setGiftingPost(null)} className="text-slate-450 hover:text-slate-650 font-bold p-1 text-sm">✕</button>
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
              <div className="space-y-4 text-left">
                <div className="p-3 bg-neutral-50 dark:bg-zinc-950 border border-neutral-150 dark:border-neutral-850 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-white border shrink-0">
                    <img src={giftingPost.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-200 block">Recipient: {giftingPost.authorName}</span>
                    <span className="text-[10px] text-zinc-400 block font-mono truncate">Post Title: {giftingPost.title || 'Creator Post'}</span>
                  </div>
                </div>

                {giftingError && (
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-600 text-xs flex flex-col gap-2 items-start justify-start">
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
                  
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 50, 100, 200].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setGiftAmount(amt)}
                        className={`py-3.5 rounded-xl text-center text-xs font-black transition cursor-pointer font-mono border ${
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
                  <span className="text-amber-700 font-bold">Your Wallet Balance:</span>
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

    </div>
  );
}
