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
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = React.useState<FriendRequest[]>([]);

  const loadData = () => {
    setUsers(dbService.getUsers());
    setFriendRequests(dbService.getFriendRequests());
  };

  React.useEffect(() => {
    loadData();
    // Watch for live starconnect db updates (e.g. from firestore snapshots)
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('starconnect_db_update', handleUpdate);
    return () => {
      window.removeEventListener('starconnect_db_update', handleUpdate);
    };
  }, []);

  const handleToggleFollow = (userId: string) => {
    dbService.toggleFollow(userId);
    loadData();
  };

  const handleBlockUser = (user: UserProfile) => {
    const confirm = window.confirm(`Are you sure you want to block "${user.name}"? They will not be able to message you or see your posts.`);
    if (confirm) {
      dbService.blockUser(user.id);
      loadData();
      alert('Blocked successfully. ✅');
    }
  };

  // Friend Request handlers
  const handleSendRequest = (userId: string) => {
    dbService.sendFriendRequest(userId);
    loadData();
  };

  const handleAcceptRequest = (requestId: string) => {
    dbService.acceptFriendRequest(requestId);
    loadData();
    alert('Congratulations! Friend request accepted. You are now friends! 🤝✨');
  };

  const handleCancelRequest = (requestId: string) => {
    const confirm = window.confirm('Are you sure you want to cancel this friend request?');
    if (confirm) {
      dbService.cancelFriendRequest(requestId);
      loadData();
    }
  };

  const handleUnfriend = (user: UserProfile) => {
    const confirm = window.confirm(`Are you sure you want to unfriend "${user.name}"?`);
    if (confirm) {
      dbService.unfriend(user.id);
      loadData();
      alert('Unfriended. 🤝');
    }
  };

  const me = dbService.getCurrentUser();

  // Filters out me + any already blocked users from general display
  const blockedList = me.blockedUsers || [];
  const filteredUsers = users.filter(u => 
    u.id !== me.id && 
    !blockedList.includes(u.id) &&
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Incoming pending requests
  const incomingRequests = friendRequests.filter(fr => fr.receiverId === me.id && fr.status === 'pending');

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-neutral-950 overflow-y-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center px-4 py-3 border-b border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950 sticky top-0 z-10 animate-fadeIn">
        <button
          onClick={onBack}
          className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition mr-2 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
        </button>
        <h1 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">Find Friends & Requests</h1>
      </div>

      {/* Search Bar Input */}
      <div className="p-4 bg-zinc-50/50 dark:bg-neutral-900/10 border-b border-neutral-100 dark:border-neutral-900/50">
        <div className="relative flex items-center bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 px-4 py-3 rounded-2xl shadow-sm">
          <Search className="w-5 h-5 text-neutral-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search friends by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-neutral-80 & dark:text-white placeholder-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Incoming Requests Section */}
      {incomingRequests.length > 0 && (
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-900 bg-indigo-50/30 dark:bg-indigo-950/10 animate-slideDown">
          <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest block mb-2.5">
            Incoming Friend Requests ({incomingRequests.length}) 👋
          </span>
          <div className="space-y-2">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-neutral-900 border border-indigo-100 dark:border-indigo-900/55 p-3 rounded-2xl flex items-center justify-between shadow-sm text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-150 shrink-0 border border-neutral-200 dark:border-neutral-805">
                    <img src={req.senderAvatarUrl} alt={req.senderName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block leading-tight">
                      {req.senderName}
                    </span>
                    <span className="text-[9px] text-neutral-400 block mt-0.5">sent you a friend request</span>
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleCancelRequest(req.id)}
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition duration-150 cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation & Contacts Grid */}
      <div className="p-4 space-y-3 flex-1 text-left">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block pb-1">People You May Know</span>
        
        {filteredUsers.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-12">No users found.</p>
        ) : (
          filteredUsers.map((user) => {
            const isFollowing = dbService.isFollowing(user.id);
            // Find request relation
            const userRequest = friendRequests.find(fr => 
              (fr.senderId === me.id && fr.receiverId === user.id) ||
              (fr.senderId === user.id && fr.receiverId === me.id)
            );

            return (
              <div
                key={user.id}
                className="bg-[#fcfdfd] dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 p-3.5 rounded-2xl flex items-center justify-between shadow-sm group hover:scale-[1.01] transition duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 border border-neutral-205 dark:border-neutral-800 shrink-0">
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-neutral-850 dark:text-neutral-200 flex items-center gap-1.5 leading-sharp">
                      {user.name}
                      {user.isVerified && (
                        <VerifiedBadge className="w-4 h-4" />
                      )}
                    </span>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5">{user.bio}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded-md font-mono">
                        {user.followersCount} followers
                      </span>
                      {userRequest?.status === 'accepted' && (
                        <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          Friends
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Friend request and social actions bundle */}
                <div className="flex flex-col gap-1.5 shrink-0 select-none items-end min-w-[124px]">
                  
                  {/* Dedicated Friend Request Option */}
                  {!userRequest ? (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className="w-full text-[10px] py-1.5 px-3 font-extrabold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 duration-200 bg-indigo-650 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </button>
                  ) : userRequest.status === 'pending' ? (
                    userRequest.senderId === me.id ? (
                      <button
                        onClick={() => handleCancelRequest(userRequest.id)}
                        className="w-full text-[10px] py-1.5 px-3 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 duration-200 bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-955/20 border border-neutral-200/50 dark:border-neutral-800"
                        title="Click to cancel request"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Requested</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAcceptRequest(userRequest.id)}
                        className="w-full text-[10px] py-1.5 px-3 font-extrabold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 duration-200 bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                    )
                  ) : (
                    // status === 'accepted'
                    <button
                      onClick={() => handleUnfriend(user)}
                      className="w-full text-[10px] py-1.5 px-3 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 duration-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/45"
                      title="Click to unfriend"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Unfriend</span>
                    </button>
                  )}

                  {/* Secondary Social buttons: Follow and Message */}
                  <div className="flex w-full gap-1 mt-0.5 justify-end">
                    <button
                      onClick={() => handleToggleFollow(user.id)}
                      className={`text-[9px] font-bold px-2 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                        isFollowing
                          ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                          : 'bg-amber-100/8c text-amber-700 dark:bg-amber-955/20 dark:text-amber-400'
                      }`}
                      title={isFollowing ? 'Unfollow' : 'Follow'}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>

                    <button
                      onClick={() => onChatWithUser && onChatWithUser(user.id)}
                      className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-indigo-50 dark:hover:bg-neutral-805 font-bold text-[9px] px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Message
                    </button>

                    <button
                      onClick={() => handleBlockUser(user)}
                      className="bg-red-50 hover:bg-red-100/50 dark:bg-red-955/10 text-red-500 p-1.5 rounded-lg flex items-center justify-center border border-red-100/50 dark:border-red-950/20 cursor-pointer"
                      aria-label="Block user"
                      title="Block"
                    >
                      <ShieldAlert className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
