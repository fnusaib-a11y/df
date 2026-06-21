/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Camera, UserCheck, Shield, CheckCircle, Award, X, Mail, Sparkles, Image as ImageIcon } from 'lucide-react';
import { UserProfile, Post } from '../types';
import { dbService } from '../services/db';
import { VerifiedBadge } from './VerifiedBadge';

interface ProfileViewProps {
  onNavigate: (screen: string) => void;
  onEditProfile: () => void;
  editProfileOpen?: boolean;
  onEditProfileClose?: () => void;
  onPostSelect?: (post: Post) => void;
  onChatWithUser?: (userId: string) => void;
}

const PRESET_AVATARS = [
  { name: '👦', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
  { name: '👧', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { name: '🧑‍🦱', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80' },
  { name: '👩‍🦰', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' },
  { name: '👱‍♂️', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
  { name: '🐱', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80' }
];

const PRESET_COVERS = [
  { name: '🌌 Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80' },
  { name: '⛰️ Nature', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' },
  { name: '🌆 Neon', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80' }
];

export default function ProfileView({ onNavigate, onEditProfile, editProfileOpen, onEditProfileClose, onPostSelect, onChatWithUser }: ProfileViewProps) {
  const [currentUser, setCurrentUser] = React.useState<UserProfile>(dbService.getCurrentUser());
  const [myPosts, setMyPosts] = React.useState<Post[]>([]);
  
  // Profile edit form fields state
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editBio, setEditBio] = React.useState('');
  const [editEmail, setEditEmail] = React.useState('');
  const [editAvatarUrl, setEditAvatarUrl] = React.useState('');
  const [editCoverUrl, setEditCoverUrl] = React.useState('');

  React.useEffect(() => {
    // Fetch posts from dbService for this author
    const posts = dbService.getPosts('সব').filter(p => p.authorId === currentUser.id);
    setMyPosts(posts);
  }, [currentUser]);

  React.useEffect(() => {
    if (editProfileOpen) {
      setEditName(currentUser.name || '');
      setEditBio(currentUser.bio || '');
      setEditEmail(currentUser.email || '');
      setEditAvatarUrl(currentUser.avatarUrl || '');
      setEditCoverUrl(currentUser.coverUrl || '');
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [editProfileOpen, currentUser]);

  const resizeAndCompressImage = (
    file: File, 
    maxWidth: number, 
    maxHeight: number, 
    quality: number,
    callback: (base64Result: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          callback(compressed);
        } else {
          callback(event.target?.result as string);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Please select an image smaller than 10MB.');
      return;
    }

    resizeAndCompressImage(file, 256, 256, 0.6, (compressedBase64) => {
      setEditAvatarUrl(compressedBase64);
    });
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Please select an image smaller than 10MB.');
      return;
    }

    resizeAndCompressImage(file, 720, 360, 0.65, (compressedBase64) => {
      setEditCoverUrl(compressedBase64);
    });
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      alert('Please provide your name.');
      return;
    }
    dbService.updateProfile({
      name: editName,
      bio: editBio,
      email: editEmail,
      avatarUrl: editAvatarUrl,
      coverUrl: editCoverUrl
    });
    alert('Profile updated successfully! 🌟🌸');
    if (onEditProfileClose) {
      onEditProfileClose();
    } else {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    if (onEditProfileClose) {
      onEditProfileClose();
    } else {
      setIsEditing(false);
    }
  };

  // Helper to re-read current user profile instantly or on interval polling
  React.useEffect(() => {
    const handleReload = () => {
      const upToDateUser = dbService.getCurrentUser();
      if (upToDateUser) {
        setCurrentUser(upToDateUser);
      }
    };
    
    window.addEventListener('starconnect_db_update', handleReload);
    const interval = setInterval(handleReload, 3000);
    return () => {
      window.removeEventListener('starconnect_db_update', handleReload);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-neutral-950 pb-16">
      {/* Top Header */}
      <div className="flex justify-between items-center px-4 py-3 sticky top-0 bg-white dark:bg-neutral-950 z-10 border-b border-neutral-100 dark:border-neutral-900">
        <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Profile</h1>
        <button
          onClick={() => onNavigate('SETTINGS')}
          className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition cursor-pointer"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
        </button>
      </div>

      {/* Cover and Profile Image Section */}
      <div className="relative">
        <div className="h-44 w-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <img
            src={currentUser.coverUrl || 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80'}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80';
            }}
          />
        </div>

        {/* Profile Avatar with edit camera badge */}
        <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-neutral-950 overflow-hidden shadow-md ring-2 ring-amber-500">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80';
                }}
              />
            </div>
            <button
              onClick={onEditProfile}
              className="absolute bottom-1 right-1 bg-amber-500 text-white p-1.5 rounded-full border-2 border-white dark:border-neutral-950 shadow hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info Space */}
      <div className="text-center mt-16 px-6">
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-50 tracking-wide">
            {currentUser.name}
          </h2>
          {currentUser.isVerified && (
            <VerifiedBadge className="w-5 h-5" />
          )}
          {currentUser.isPremium && (
            <Award className="w-5 h-5 text-amber-500 shrink-0" />
          )}
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
          {currentUser.bio || 'Hi, I\'m using StarConnect'}
        </p>
      </div>

      {/* Stats Table inside very pale nice mint card */}
      <div className="px-4 mt-6">
        <div className="bg-amber-500/5 dark:bg-amber-950/20 rounded-2xl py-4 px-6 flex justify-around text-center border border-amber-500/10 shadow-sm">
          <div>
            <div className="text-xl font-bold text-amber-600">{myPosts.length}</div>
            <div className="text-xs text-neutral-500 mt-1">Posts</div>
          </div>
          <div className="w-[1px] bg-amber-100/55 dark:bg-amber-900/50"></div>
          <div>
            <div className="text-xl font-bold text-amber-600">{currentUser.followingCount}</div>
            <div className="text-xs text-neutral-500 mt-1">Friends</div>
          </div>
          <div className="w-[1px] bg-amber-100/55 dark:bg-amber-900/50"></div>
          <div>
            <div className="text-xl font-bold text-amber-600">{currentUser.followersCount}</div>
            <div className="text-xs text-neutral-500 mt-1">Followers</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 px-4 mt-5">
        <button
          onClick={onEditProfile}
          className="flex-1 bg-amber-500 text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-md space-x-1 hover:bg-amber-600 active:scale-95 transition flex items-center justify-center cursor-pointer"
        >
          <Camera className="w-4 h-4 mr-1" />
          <span>Edit Profile</span>
        </button>
        <button
          onClick={() => onNavigate('FRIEND_FINDER')}
          className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          <span>Find Friends</span>
        </button>
      </div>

      {/* Posts list grid */}
      <div className="px-4 mt-6 text-left">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#11af5f] border-b border-neutral-100 dark:border-neutral-900 pb-2 mb-4">
          Your Posts ({myPosts.length})
        </h3>
        {myPosts.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
            <p className="text-xs">No posts uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {myPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onPostSelect && onPostSelect(post)}
                className="aspect-square bg-neutral-100 dark:bg-neutral-900 rounded-xl overflow-hidden cursor-pointer group relative shadow-sm hover:opacity-95 animate-fadeIn"
              >
                {post.mediaType === 'image' && post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                )}

                {post.mediaType === 'video' && post.mediaUrl && (
                  <div className="w-full h-full relative bg-neutral-950 flex items-center justify-center">
                    <video
                      src={post.mediaUrl}
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-neutral-950/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Reels
                    </div>
                  </div>
                )}

                {!post.mediaUrl && (
                  <div className="w-full h-full p-3 bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center text-center text-xs font-medium">
                    <p className="line-clamp-4">{post.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Panel Link for Admins */}
      {currentUser.role === 'admin' && (
        <div className="px-4 mt-10">
          <button
            onClick={() => onNavigate('ADMIN_PANEL')}
            className="w-full bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold text-white">Admin Dashboard System</span>
          </button>
        </div>
      )}

      {/* Edit Profile Modal/Overlay */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-neutral-100 text-sm">Edit Profile</h3>
              </div>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-505 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scroll Space */}
            <div className="p-6 overflow-y-auto space-y-5 text-left">
              
              {/* Profile Name & Bio & Email */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full text-xs font-bold border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 bg-neutral-50 dark:bg-zinc-955 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 dark:text-neutral-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Your Email"
                    className="w-full text-xs font-bold border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 bg-neutral-50 dark:bg-zinc-955 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 dark:text-neutral-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">Bio or Status</label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Write something about yourself..."
                    className="w-full text-xs font-bold border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 bg-neutral-50 dark:bg-zinc-955 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800 dark:text-neutral-100 resize-none"
                  />
                </div>
              </div>

              {/* Avatar Preset & Input Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-450 uppercase tracking-wider block">Profile Photo (Avatar Settings)</label>
                <div className="flex flex-wrap gap-2 pb-1">
                  {/* Gallery Upload Option */}
                  <label className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-dashed border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition flex flex-col items-center justify-center text-center shrink-0">
                    <Camera className="w-5 h-5 text-amber-500" />
                    <span className="text-[7.5px] font-black text-amber-600 mt-0.5">Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </label>

                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.url}
                      type="button"
                      onClick={() => setEditAvatarUrl(av.url)}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 cursor-pointer transition ${
                        editAvatarUrl === av.url ? 'border-amber-500 scale-105' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <img src={av.url} alt="av" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-xs">
                        {av.name}
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg font-bold shrink-0 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> URL
                  </span>
                  <input
                    type="text"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="or enter direct image URL"
                    className="w-full text-[11px] font-mono border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-1.5 bg-neutral-50 dark:bg-zinc-950 focus:outline-none text-slate-800 dark:text-neutral-100"
                  />
                </div>
              </div>

              {/* Cover Photo Custom & Preset selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-450 uppercase tracking-wider block">Cover Photo (App Background)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-1">
                  {/* Gallery Upload Option */}
                  <label className="relative h-11 rounded-lg overflow-hidden border border-dashed border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition flex items-center justify-center text-center px-1">
                    <Camera className="w-4 h-4 text-amber-500 mr-1" />
                    <span className="text-[9.5px]/none font-extrabold text-amber-600">Gallery Cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </label>

                  {PRESET_COVERS.map((cv) => (
                    <button
                      key={cv.url}
                      type="button"
                      onClick={() => setEditCoverUrl(cv.url)}
                      className={`relative h-11 rounded-lg overflow-hidden border cursor-pointer transition text-left px-2 flex items-center ${
                        editCoverUrl === cv.url ? 'border-amber-500 bg-amber-50/25 dark:bg-amber-950/20' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <span className="text-[10px] font-black text-slate-700 dark:text-neutral-300">{cv.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg font-bold shrink-0 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> URL
                  </span>
                  <input
                    type="text"
                    value={editCoverUrl}
                    onChange={(e) => setEditCoverUrl(e.target.value)}
                    placeholder="or enter direct cover image URL"
                    className="w-full text-[11px] font-mono border border-neutral-200 dark:border-neutral-800 rounded-xl px-2.5 py-1.5 bg-neutral-50 dark:bg-zinc-950 focus:outline-none text-slate-800 dark:text-neutral-100"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-850 flex gap-3 shrink-0">
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-3 text-xs font-black text-zinc-500 bg-white hover:bg-zinc-100 border border-neutral-250 rounded-xl cursor-pointer transition text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 text-xs font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md cursor-pointer transition text-center"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
