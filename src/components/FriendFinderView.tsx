/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Search, CheckCircle, UserPlus, UserMinus, ShieldAlert, UserCheck, Users, X, MessageSquare } from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile, FriendRequest } from '../types';
import { VerifiedBadge } from './VerifiedBadge';

interface FriendFinderViewProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onChatWithUser?: (userId: string) => void;
}

export default function FriendFinderView({ onBack, onNavigate, onChatWithUser }: FriendFinderViewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [subTab, setSubTab] = React.useState<'requests' | 'suggestions' | 'friends'>('requests');
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = React.useState<FriendRequest[]>([]);

  const loadData = () => {
    setUsers(dbService.getUsers());
    setFriendRequests(dbService.getFriendRequests());
  };

  React.useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('starconnect_db_update', handleUpdate);
    return () => {
      window.removeEventListener('starconnect_db_update', handleUpdate);
    };
  }, []);

  const me = dbService.getCurrentUser();
  const blockedList = me.blockedUsers || [];

  // Actions for database friends
  const handleAcceptRequest = (requestId: string) => {
    dbService.acceptFriendRequest(requestId);
    loadData();
  };

  const handleCancelRequest = (requestId: string) => {
    dbService.cancelFriendRequest(requestId);
    loadData();
  };

  const handleSendRequest = (userId: string) => {
    dbService.sendFriendRequest(userId);
    loadData();
  };

  const matchesSearch = (name: string, username?: string) => {
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || (username && username.toLowerCase().includes(q));
  };

  // 1. Incoming actual friend requests (where user is receiver and status is pending)
  const incomingRequests = friendRequests.filter(fr => fr.receiverId === me.id && fr.status === 'pending');

  // 2. Real friends list (accepted relationships)
  const realFriends = users.filter(user => {
    return friendRequests.some(fr => 
      fr.status === 'accepted' && 
      ((fr.senderId === me.id && fr.receiverId === user.id) ||
       (fr.senderId === user.id && fr.receiverId === me.id))
    );
  });

  // 3. Suggestions list (users who are not me, not blocked, and have no active friend connection)
  const suggestions = users.filter(user => {
    if (user.id === me.id) return false;
    if (blockedList.includes(user.id)) return false;

    // Must not be in any pending/accepted relationship
    const relation = friendRequests.find(fr => 
      (fr.senderId === me.id && fr.receiverId === user.id) ||
      (fr.senderId === user.id && fr.receiverId === me.id)
    );
    
    // Suggest if no relation exists, or if it is rejected
    return !relation || relation.status === 'rejected';
  });

  // Filter listings based on search box query
  const filteredIncomingRequests = incomingRequests.filter(fr => matchesSearch(fr.senderName));
  const filteredFriends = realFriends.filter(fr => matchesSearch(fr.name, fr.username));
  const filteredSuggestions = suggestions.filter(sug => matchesSearch(sug.name, sug.username));
  const filteredAllUsers = users.filter(user => matchesSearch(user.name, user.username));

  return (
    <div id="friend-finder-container" className="flex-1 flex flex-col bg-white dark:bg-neutral-950 overflow-y-auto pb-16">
      {/* Top Header - StarConnect Styling */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950 sticky top-0 z-10 animate-fadeIn">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
          </button>
          <h1 className="text-[20px] font-bold text-neutral-900 dark:text-white tracking-tight">Friends</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative cursor-pointer" onClick={() => onNavigate('PROFILE')}>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <img src={me.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} alt={me.name} className="w-full h-full object-cover" />
            </div>
            {me.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full border border-white dark:border-neutral-900 p-0.5">
                <CheckCircle className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pill tabs row */}
      <div className="flex gap-2.5 px-4 py-3 border-b border-neutral-100 dark:border-neutral-900 overflow-x-auto scrollbar-none select-none">
        
        {/* Tab 1: Requests */}
        <button
          onClick={() => {
            setSubTab('requests');
            setSearchQuery('');
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-150 ${
            subTab === 'requests'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200'
          }`}
        >
          {incomingRequests.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
          <span>Requests ({incomingRequests.length})</span>
        </button>

        {/* Tab 2: Suggestions */}
        <button
          onClick={() => {
            setSubTab('suggestions');
            setSearchQuery('');
          }}
          className={`flex items-center px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-150 ${
            subTab === 'suggestions'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200'
          }`}
        >
          <span>Suggestions ({suggestions.length})</span>
        </button>

        {/* Tab 3: Friends */}
        <button
          onClick={() => {
            setSubTab('friends');
            setSearchQuery('');
          }}
          className={`flex items-center px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-150 ${
            subTab === 'friends'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200'
          }`}
        >
          <span>Your Friends ({realFriends.length})</span>
        </button>

      </div>

      {/* Dynamic Search Box within Tab */}
      <div className="p-3 bg-neutral-50/40 dark:bg-neutral-900/10 border-b border-neutral-100 dark:border-neutral-900/50">
        <div className="relative flex items-center bg-zinc-100 dark:bg-neutral-900 px-3 py-2 rounded-full">
          <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder={
              subTab === 'requests' ? "Search friend requests..." :
              subTab === 'suggestions' ? "Search suggestions..." : "Search your friends..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-neutral-800 dark:text-white placeholder-neutral-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-0.5 rounded-full hover:bg-neutral-250 dark:hover:bg-neutral-850 cursor-pointer">
              <X className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 1: FRIEND REQUESTS
         ───────────────────────────────────────────────────────────── */}
      {subTab === 'requests' && (
        <div className="flex-1 flex flex-col text-left">
          <div className="flex justify-between items-center px-4 pt-4 pb-2 animate-fadeIn">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              Friend requests <span className="text-blue-600 dark:text-blue-400 ml-1 font-extrabold">{incomingRequests.length}</span>
            </h2>
          </div>

          {filteredIncomingRequests.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 text-xs px-4">
              ✨ No pending friend requests at this time.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {filteredIncomingRequests.map((req) => (
                <div key={req.id} className="flex gap-4 px-4 py-3 items-start animate-fadeIn">
                  <div className="relative w-16 h-16 shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-neutral-150 bg-neutral-100">
                      <img src={req.senderAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} alt={req.senderName} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-baseline gap-1.5">
                      <span className="text-[16px] font-bold text-neutral-900 dark:text-white leading-tight truncate">
                        {req.senderName}
                      </span>
                      <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                        Just now
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500 block mt-0.5 mb-2">Sent you a friend request</span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleAcceptRequest(req.id);
                        }}
                        className="flex-1 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-1.5 rounded-lg text-xs transition cursor-pointer text-center"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        className="flex-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold py-1.5 rounded-lg text-xs transition cursor-pointer text-center"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Registered Users Section - Fulfilled directly from DB */}
          <div id="registered_users_container" className="border-t-8 border-neutral-100 dark:border-neutral-900 mt-6 pt-4 pb-2 px-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              All Members ({users.length})
            </h2>
          </div>

          <div id="registered_users_list" className="divide-y divide-neutral-100 dark:divide-neutral-900 px-1 mb-2">
            {filteredAllUsers.length === 0 ? (
              <p className="p-4 text-xs text-neutral-450 text-center">কোন ব্যবহারকারী পাওয়া যায়নি।</p>
            ) : (
              filteredAllUsers.map((user) => {
                const isMe = user.id === me.id;
                const userRequest = friendRequests.find(fr => 
                  (fr.senderId === me.id && fr.receiverId === user.id) ||
                  (fr.senderId === user.id && fr.receiverId === me.id)
                );

                return (
                  <div key={user.id} className="flex gap-4 px-4 py-3 items-start hover:bg-neutral-50 dark:hover:bg-neutral-900/20 rounded-xl transition-all duration-150">
                    <div className="relative w-14 h-14 shrink-0 select-none">
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-blue-100 dark:border-neutral-800 bg-neutral-150">
                        <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      {isMe && (
                        <span className="absolute -top-1 -right-1 bg-[#31a24c] text-white font-extrabold px-1.5 py-0.5 rounded-full text-[8px] uppercase tracking-wider">
                          You
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15.5px] font-bold text-neutral-900 dark:text-white truncate">
                          {user.name}
                        </span>
                        {user.isVerified && <VerifiedBadge className="w-4 h-4 text-blue-500 fill-blue-500" />}
                      </div>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                        @{user.username} • {user.phone}
                      </span>
                      {user.bio && (
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-1 mt-1 bg-neutral-50 dark:bg-neutral-900/50 px-2 py-0.5 rounded italic">
                          {user.bio}
                        </p>
                      )}

                      {!isMe && (
                        <div className="flex gap-2 mt-2.5">
                          {!userRequest ? (
                            <button
                              onClick={() => {
                                handleSendRequest(user.id);
                              }}
                              className="flex-1 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-1.5 px-3 rounded-lg text-xs transition duration-150 cursor-pointer text-center"
                            >
                              Add friend
                            </button>
                          ) : userRequest.status === 'pending' ? (
                            userRequest.senderId === me.id ? (
                              <button
                                onClick={() => handleCancelRequest(userRequest.id)}
                                className="flex-1 bg-neutral-200 hover:bg-[#eaeaea] dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold py-1.5 px-3 rounded-lg text-xs transition cursor-pointer text-center"
                              >
                                Cancel Request
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  handleAcceptRequest(userRequest.id);
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition cursor-pointer text-center"
                              >
                                Accept Request
                              </button>
                            )
                          ) : (
                            <button className="flex-1 bg-green-55 text-green-600 dark:bg-green-950/20 dark:text-green-300 font-bold py-1.5 px-3 rounded-lg text-xs cursor-default text-center" disabled>
                              Friends ✓
                            </button>
                          )}

                          <button
                            onClick={() => onChatWithUser?.(user.id)}
                            className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold py-1.5 px-3 rounded-lg text-xs transition cursor-pointer text-center"
                          >
                            Chat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 2: SUGGESTIONS ONLY
         ───────────────────────────────────────────────────────────── */}
      {subTab === 'suggestions' && (
        <div id="suggestions_container" className="flex-1 flex flex-col text-left animate-fadeIn">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">People you may know</h2>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {filteredSuggestions.length === 0 ? (
              <p className="p-4 text-xs text-neutral-400 text-center">No new suggestions at this time.</p>
            ) : (
              filteredSuggestions.map((user) => {
                const userRequest = friendRequests.find(fr => 
                  (fr.senderId === me.id && fr.receiverId === user.id) ||
                  (fr.senderId === user.id && fr.receiverId === me.id)
                );

                return (
                  <div key={user.id} className="flex gap-4 px-4 py-3 items-start hover:bg-neutral-50 dark:hover:bg-neutral-900/10">
                    <div className="w-16 h-16 shrink-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden border border-neutral-150 bg-neutral-100">
                        <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-[16px] font-bold text-neutral-900 dark:text-white leading-tight truncate flex items-center gap-1.5">
                        {user.name}
                        {user.isVerified && <VerifiedBadge className="w-4 h-4 text-blue-500 fill-blue-500" />}
                      </span>
                      <span className="text-xs text-neutral-400 truncate block mt-0.5 mb-2">
                        {user.bio || `@${user.username}`}
                      </span>

                      <div className="flex gap-2">
                        {!userRequest ? (
                          <button
                            onClick={() => handleSendRequest(user.id)}
                            className="flex-1 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-1.5 px-4 rounded-lg text-xs transition cursor-pointer"
                          >
                            Add friend
                          </button>
                        ) : userRequest.status === 'pending' ? (
                          <button
                            onClick={() => handleCancelRequest(userRequest.id)}
                            className="flex-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold py-1.5 px-4 rounded-lg text-xs transition cursor-pointer"
                          >
                            Cancel Request
                          </button>
                        ) : (
                          <button className="flex-1 bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-300 font-bold py-1.5 px-4 rounded-lg text-xs cursor-default" disabled>
                            Friends ✓
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            dbService.blockUser(user.id);
                            loadData();
                          }}
                          className="flex-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 font-bold py-1.5 px-4 rounded-lg text-xs transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB CONTENT 3: YOUR FRIENDS
         ───────────────────────────────────────────────────────────── */}
      {subTab === 'friends' && (
        <div id="friends_container" className="flex-1 flex flex-col text-left animate-fadeIn">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Your friends</h2>
          </div>

          <div className="px-4 py-2 space-y-3">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-neutral-400 text-sm">You haven't added any real friends yet.</p>
                <button 
                  onClick={() => setSubTab('suggestions')} 
                  className="mt-3 bg-[#1877f2] hover:bg-[#166fe5] text-white text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition"
                >
                  Browse suggestions
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
                {filteredFriends.map((user) => (
                  <div key={user.id} className="flex gap-4 py-3 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-150">
                        <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="text-base font-bold text-neutral-850 dark:text-white flex items-center gap-1.5">
                          {user.name}
                          {user.isVerified && <VerifiedBadge className="w-4 h-4 text-blue-500 fill-blue-500" />}
                        </span>
                        <span className="text-xs text-neutral-500 block">@{user.username}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onChatWithUser?.(user.id)}
                        className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold py-1.5 px-3 rounded-lg transition"
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => {
                          const conf = window.confirm(`Unfriend ${user.name}?`);
                          if (conf) {
                            dbService.unfriend(user.id);
                            loadData();
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-300 text-xs font-bold py-1.5 px-3 rounded-lg transition"
                      >
                        Unfriend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
