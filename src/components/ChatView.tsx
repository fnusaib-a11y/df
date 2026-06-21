/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Send, Search, CheckCircle, Award, Sparkles, X } from 'lucide-react';
import { dbService } from '../services/db';
import { Chat, Message, UserProfile } from '../types';
import { VerifiedBadge } from './VerifiedBadge';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface ChatViewProps {
  onBack: () => void;
  selectedUserId?: string;
  onClearSelectedUser?: () => void;
}

export default function ChatView({ onBack, selectedUserId, onClearSelectedUser }: ChatViewProps) {
  const isOnline = useOnlineStatus();
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);
  const [activePartner, setActivePartner] = React.useState<UserProfile | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeMessengerTab, setActiveMessengerTab] = React.useState<'chats' | 'group'>('chats');

  // Pull-to-refresh states
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const touchStartY = React.useRef(0);
  const isProneToPull = React.useRef(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      isProneToPull.current = true;
    } else {
      isProneToPull.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isProneToPull.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      const distance = Math.min(diff * 0.4, 70);
      setPullDistance(distance);
      // Prevent browser default scroll bounding drag
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (isRefreshing) return;
    isProneToPull.current = false;
    if (pullDistance > 45) {
      setIsRefreshing(true);
      setPullDistance(35);
      setTimeout(() => {
        loadChatData();
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1200);
    } else {
      setPullDistance(0);
    }
  };

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // Load chat threads and users
  const loadChatData = () => {
    const list = dbService.getChats();
    setChats(list);
    setUsers(dbService.getUsers());
  };

  React.useEffect(() => {
    loadChatData();
    
    // Subscribe to custom event for new simulator chatbot messages and Firestore updates
    const handleNewMsg = () => {
      loadChatData();
      if (activeChatId) {
        setMessages(dbService.getMessages(activeChatId));
      }
    };

    window.addEventListener('starconnect_new_message', handleNewMsg);
    window.addEventListener('starconnect_db_update', handleNewMsg);
    return () => {
      window.removeEventListener('starconnect_new_message', handleNewMsg);
      window.removeEventListener('starconnect_db_update', handleNewMsg);
    };
  }, [activeChatId]);

  // Handle outside routing/navigation from Reels/Profile directly to user chat
  React.useEffect(() => {
    if (selectedUserId) {
      const me = dbService.getCurrentUser();
      if (!me) return;
      const chatId = [me.id, selectedUserId].sort().join('_');
      const partner = dbService.getUsers().find(u => u.id === selectedUserId);
      if (partner) {
        setActivePartner(partner);
        setActiveChatId(chatId);
        setMessages(dbService.getMessages(chatId));
        dbService.marChatAsRead(chatId);
      }
    }
  }, [selectedUserId]);

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const selectChat = (chat: Chat) => {
    const me = dbService.getCurrentUser();
    const partnerId = chat.participants.find(id => id !== me.id) || '';
    const partner = users.find(u => u.id === partnerId);
    if (partner) {
      setActivePartner(partner);
      setActiveChatId(chat.id);
      setMessages(dbService.getMessages(chat.id));
      dbService.marChatAsRead(chat.id);
      loadChatData();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      alert('🚫 দুঃখিত! ইন্টারনেট কানেকশন নেই। অফলাইন মোডে মেসেজ পাঠানো সম্ভব নয়।');
      return;
    }
    if (!newMessageText.trim() || !activePartner) return;

    dbService.sendMessage(activePartner.id, newMessageText);
    setNewMessageText('');
    
    // Refresh chats in panel lists
    loadChatData();
  };

  const filteredUsers = users.filter(u => 
    u.id !== dbService.getCurrentUser().id && 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startNewChatWithUser = (user: UserProfile) => {
    const me = dbService.getCurrentUser();
    const chatId = [me.id, user.id].sort().join('_');
    setActivePartner(user);
    setActiveChatId(chatId);
    setMessages(dbService.getMessages(chatId));
    dbService.marChatAsRead(chatId);
    setSearchQuery('');
  };

  const handleExitChatDetail = () => {
    setActiveChatId(null);
    setActivePartner(null);
    if (onClearSelectedUser) onClearSelectedUser();
    loadChatData();
  };

  const me = dbService.getCurrentUser();

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-neutral-950 overflow-hidden h-full pb-16">
      
      {/* ---------------------------- */}
      {/* CASE A: CONVERSATION LIST VIEW */}
      {/* ---------------------------- */}
      {!activeChatId ? (
        <div className="flex-1 flex flex-col h-full">
          {/* Top Header */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-900 sticky top-0 bg-white dark:bg-neutral-950 z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="p-1 rounded-full hover:bg-neutral-105 active:scale-95 text-neutral-800 dark:text-neutral-200 transition mr-1"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">Messenger</h1>
            </div>
            <button
              onClick={onBack}
              className="text-xs bg-slate-100 dark:bg-neutral-900 text-slate-500 hover:text-slate-800 dark:text-neutral-300 px-3 py-1.5 rounded-lg font-bold"
            >
              Exit
            </button>
          </div>

          {/* Tabs for Inbox vs Group */}
          <div className="flex border-b border-neutral-100 dark:border-neutral-900 mx-4 mt-2 mb-2 shrink-0">
            <button
              onClick={() => setActiveMessengerTab('chats')}
              className={`flex-1 pb-3 text-xs font-black tracking-wider uppercase transition border-b-2 text-center cursor-pointer ${
                activeMessengerTab === 'chats' 
                  ? 'border-[#11af5f] text-[#11af5f]' 
                  : 'border-transparent text-zinc-400 hover:text-slate-600 dark:hover:text-neutral-300'
              }`}
            >
              মেসেজসমূহ (Inbox)
            </button>
            <button
              onClick={() => setActiveMessengerTab('group')}
              className={`flex-1 pb-3 text-xs font-black tracking-wider uppercase transition border-b-2 text-center cursor-pointer ${
                activeMessengerTab === 'group' 
                  ? 'border-[#11af5f] text-[#11af5f]' 
                  : 'border-transparent text-zinc-400 hover:text-slate-600 dark:hover:text-neutral-300'
              }`}
            >
              আমার গ্রুপ ও লিডার
            </button>
          </div>

          {activeMessengerTab === 'chats' ? (
            <>
              {/* Search Contacts Bar */}
              <div className="px-4 py-3">
                <div className="relative flex items-center bg-neutral-100 dark:bg-neutral-900 rounded-xl px-3.5 py-2.5">
                  <Search className="w-5 h-5 text-neutral-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search creators and friends to chat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Search Result Overlay Dropdown */}
              {searchQuery && (
                <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-900 bg-amber-500/5 dark:bg-amber-950/10 space-y-1">
                  <span className="text-[10px] font-bold text-amber-600 tracking-wide uppercase">Search Results ({filteredUsers.length})</span>
                  <div className="space-y-2 mt-2">
                    {filteredUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => startNewChatWithUser(user)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 text-left hover:scale-[1.01] transition"
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-200">
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                          {user.name}
                          {user.isVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Threads List */}
              <div 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="flex-1 overflow-y-auto px-4 divide-y divide-neutral-50 dark:divide-neutral-900 scrollbar-none"
              >
                {/* Dynamic pull-to-refresh indicator */}
                <div 
                  className="w-full flex items-center justify-center overflow-hidden transition-all duration-150 relative border-b border-amber-500/5 dark:border-neutral-900/10 mb-2"
                  style={{ 
                    height: pullDistance > 0 ? `${pullDistance}px` : '0px',
                    opacity: pullDistance > 0 ? Math.min(pullDistance / 35, 1) : 0 
                  }}
                >
                  <div className="flex items-center gap-2 py-1">
                    {isRefreshing ? (
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-[#111] border border-amber-100 dark:border-neutral-800 px-3 py-1.5 rounded-full shadow-sm text-amber-700 dark:text-amber-400 font-bold text-xs select-none">
                        <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                        <span className="animate-pulse">Loading messages...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 px-3 py-1.5 rounded-full shadow-sm text-neutral-500 font-bold text-xs select-none">
                        <span className="font-mono text-amber-600 dark:text-amber-400 tracking-wider text-[9px] uppercase font-black animate-pulse">
                          {pullDistance > 45 ? "Release to refresh" : "Pull to refresh"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {chats.length === 0 ? (
                  <div className="py-24 text-center text-neutral-500 dark:text-neutral-400 space-y-2">
                    <p className="text-sm">No chat threads found.</p>
                    <p className="text-xs">Start a conversation by searching creators at the top search bar!</p>
                  </div>
                ) : (
                  chats.map((chat) => {
                    const partnerId = chat.participants.find(id => id !== me.id) || '';
                    const partner = users.find(u => u.id === partnerId);
                    const unread = chat.unreadCount ? chat.unreadCount[me.id] || 0 : 0;

                    if (!partner) return null;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => selectChat(chat)}
                        className="flex items-center gap-4 py-4 cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition px-1 rounded-xl"
                      >
                        {/* Contact avatar with active offline status indicator */}
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-100">
                            <img src={partner.avatarUrl} alt={partner.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute right-0.5 bottom-0.5 w-3.5 h-3.5 bg-zinc-300 dark:bg-zinc-700 border-2 border-white dark:border-neutral-950 rounded-full shadow" title="Offline"></div>
                        </div>

                        {/* Contact Info and Message teaser details snippet */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 leading-sharp">
                              {partner.name}
                              {partner.isVerified && (
                                <VerifiedBadge className="w-4 h-4" />
                              )}
                            </span>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                              {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className={`text-xs truncate ${unread > 0 ? 'font-extrabold text-amber-600 dark:text-amber-400' : 'text-neutral-500'}`}>
                              {chat.lastMessage}
                            </p>
                            {unread > 0 && (
                              <div className="bg-amber-500 text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center scale-95">
                                {unread}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Custom Referral Group details displayed inside messenger list */
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 text-left animate-fadeIn">
              {/* Leader Section */}
              <div className="bg-amber-500/5 dark:bg-amber-955/20 border border-amber-500/15 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-1">
                  <span>👤</span> আমার দলনেতা (My Leader)
                </h4>
                {(() => {
                  const leaderId = me.referredBy;
                  const leader = leaderId ? dbService.getUserById(leaderId) : null;
                  if (leader) {
                    return (
                      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-neutral-800 p-3 rounded-xl shadow-xs">
                        <div className="flex items-center gap-3">
                          <img src={leader.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-amber-100" />
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                              {leader.name}
                              {leader.isVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
                            </p>
                            <p className="text-[9.5px] text-zinc-400 font-mono">@{leader.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => startNewChatWithUser(leader)}
                          className="px-3 py-1.5 bg-[#11af5f] hover:bg-[#0fa056] text-white text-[10px] font-black rounded-lg transition active:scale-95 cursor-pointer"
                        >
                          মেসেজ করুন
                        </button>
                      </div>
                    );
                  } else {
                    return (
                      <p className="text-[11px] text-zinc-400 leading-relaxed pl-1">
                        আপনি সরাসরি অ্যাপ এ জয়েন করেছেন, তাই আপনার কোনো নির্দিষ্ট দলনেতা (Leader) নেই।
                      </p>
                    );
                  }
                })()}
              </div>

              {/* Group Members Section */}
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center pb-1 border-b border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    👥 আমার দল সদস্য (My Group Members)
                  </h4>
                  <span className="text-[9.5px] bg-[#11af5f]/10 text-[#11af5f] font-black px-2 py-0.5 rounded-md">
                    মোট: {dbService.getUsers().filter(u => u.referredBy === me.id).length} জন
                  </span>
                </div>

                {(() => {
                  const members = dbService.getUsers().filter(u => u.referredBy === me.id);
                  if (members.length === 0) {
                    return (
                      <div className="py-6 text-center">
                        <p className="text-[11px] text-zinc-400">আপনার রেফারেল কোড ব্যবহার করে এখনো কেউ সাইনআপ করেনি।</p>
                        <p className="text-[10px] text-[#11af5f] font-bold mt-1">
                          কোড শেয়ার করুন: <span className="font-black bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-250">{me.referralCode}</span>
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {members.map((u) => (
                          <div key={u.id} className="flex items-center justify-between bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-neutral-850 p-2.5 rounded-xl">
                            <div className="flex items-center gap-2.5">
                              <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                <p className="text-[11px] font-bold text-slate-800 dark:text-neutral-200 leading-none">{u.name}</p>
                                <p className="text-[9px] text-zinc-400 font-mono mt-1">@{u.username} • ব্যালেন্স: ⭐{u.starBalance || 0}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => startNewChatWithUser(u)}
                              className="bg-[#11af5f] hover:bg-[#0fa056] text-white text-[10px] font-black px-3 py-1.5 rounded-lg active:scale-95 transition cursor-pointer"
                            >
                              চ্যাট
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ---------------------------- */
        /* CASE B: ACTIVE CHAT DETAIL PANEL VIEW */
        /* ---------------------------- */
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-neutral-950">
          {/* Conversation Detail Header */}
          <div className="px-4 py-3 bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExitChatDetail}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
              >
                <ArrowLeft className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
              </button>
              
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200 border border-neutral-100 dark:border-neutral-800">
                  <img src={activePartner?.avatarUrl} alt={activePartner?.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-zinc-300 dark:bg-zinc-700 border-2 border-white dark:border-neutral-950 rounded-full shadow"></div>
              </div>

              <div>
                <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-100 flex items-center gap-1 leading-none">
                  {activePartner?.name}
                  {activePartner?.isVerified && (
                    <VerifiedBadge className="w-3.5 h-3.5" />
                  )}
                </span>
                <span className="text-[10px] text-zinc-400 font-bold block mt-0.5 select-none">Offline (অফলাইন)</span>
              </div>
            </div>

            {/* CUT/CLOSE THE MESSAGE BOX OPTION */}
            <button
              onClick={() => {
                if (onClearSelectedUser) onClearSelectedUser();
                onBack();
              }}
              className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 hover:bg-rose-100 rounded-xl transition flex items-center gap-1 text-[11px] font-black uppercase tracking-wider active:scale-95 cursor-pointer border border-rose-200/40"
              title="Close chat box and return to Feed"
            >
              <X className="w-4 h-4" />
              <span>বন্ধ করুন</span>
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.filter((m, idx, self) => self.findIndex(msg => msg.id === m.id) === idx).map((msg) => {
              const isMe = msg.senderId === me.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {/* Partner avatar beside their speech bubbles */}
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 mr-2 shadow-sm shrink-0">
                      <img src={activePartner?.avatarUrl} alt={activePartner?.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="max-w-[70%]">
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isMe
                           ? 'bg-[#11af5f] text-white rounded-br-none'
                           : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded-bl-none border border-neutral-100 dark:border-neutral-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    {/* Message timestamp metadata */}
                    <span className="text-[9px] text-neutral-400 mt-1 block font-mono px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input form creation box */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-900 flex gap-2">
            <input
              type="text"
              required
              disabled={!isOnline}
              placeholder={isOnline ? "Type a message..." : "অফলাইন মোড: মেসেজ পাঠানো বন্ধ 🚫"}
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              className="flex-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#11af5f] text-neutral-800 dark:text-white disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!isOnline}
              className={`p-3 rounded-xl flex items-center justify-center transition ${
                isOnline
                  ? 'bg-[#11af5f] text-white hover:bg-[#0fa056] active:scale-95'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4 rotate-[-10deg]" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
