/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, User, UserPlus, Star, LogOut, Award, ShieldAlert } from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface SettingsViewProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export default function SettingsView({ onBack, onNavigate, onLogout }: SettingsViewProps) {
  const [currentUser, setCurrentUser] = React.useState<UserProfile>(dbService.getCurrentUser());
  const authErr = dbService.getAuthError();

  const handleMakePremium = () => {
    const updated = dbService.requestPremium();
    setCurrentUser({ ...updated });
    alert('Congratulations! You are now a premium member. ✨');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-neutral-950 overflow-y-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center px-4 py-3 bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-900 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition mr-2 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
        </button>
        <h1 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">Settings</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Firebase Authentication Configuration Setup Assistance */}
        {authErr && (
          <div className="bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-4 text-xs space-y-2 text-amber-900 dark:text-amber-400 leading-relaxed font-sans text-left">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-450 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong className="font-extrabold text-[#78350f] dark:text-amber-400">Firebase Auth Action Required ⚠️</strong>
                <p className="mt-1 font-medium text-slate-700 dark:text-neutral-300">
                  Your Firebase project does not have the <strong>Anonymous Sign-in</strong> provider enabled; real-time backup and sync will be disabled.
                </p>
              </div>
            </div>
            <div className="pl-6 pt-1 space-y-2.5">
              <p className="text-[10px] font-black text-slate-500 dark:text-neutral-400 uppercase tracking-wider">How to enable:</p>
              <ol className="list-decimal pl-4 pr-1 list-inside text-[10.5px] text-slate-600 dark:text-neutral-300 font-medium space-y-1.5 font-sans">
                <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline font-bold">Firebase Console</a>.</li>
                <li>Navigate to Authentication and open the <strong>Sign-in method</strong> tab.</li>
                <li>Edit the <strong>Anonymous</strong> provider, click <strong>Enable</strong>, and save.</li>
              </ol>
              <div className="p-2 bg-white/45 dark:bg-black/15 rounded-xl border border-amber-500/10 text-[9.5px] font-semibold text-zinc-500 dark:text-neutral-400">
                Your app is currently running in fast, offline-first local database mode and is fully functional.
              </div>
            </div>
          </div>
        )}

        {/* Main Settings Menu Panel Card */}
        <div className="bg-amber-500/5 dark:bg-amber-955/20 rounded-2xl p-4 shadow-sm border border-amber-500/10 space-y-4">
          
          <button
            onClick={() => onNavigate('EDIT_PROFILE')} // Route to Edit/Navigation
            className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-neutral-900 rounded-xl hover:shadow-md transition text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 dark:bg-neutral-800 text-amber-500 p-2.5 rounded-full">
                <User className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Edit Profile</span>
            </div>
            <span className="text-xs text-neutral-400 group-hover:translate-x-1 transition font-mono">&gt;</span>
          </button>

          <button
            onClick={() => onNavigate('FRIEND_FINDER')}
            className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-neutral-900 rounded-xl hover:shadow-md transition text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 dark:bg-neutral-800 text-amber-500 p-2.5 rounded-full">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Find Friends</span>
            </div>
            <span className="text-xs text-neutral-400 group-hover:translate-x-1 transition font-mono">&gt;</span>
          </button>

          <button
            onClick={() => onNavigate('VERIFY_REQUEST')}
            className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-neutral-900 rounded-xl hover:shadow-md transition text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#fff4e5] dark:bg-amber-955/35 text-amber-500 p-2.5 rounded-full">
                <Star className="w-5 h-5 fill-amber-500" />
              </div>
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Blue Verification Request</span>
            </div>
            <span className="text-xs text-neutral-400 group-hover:translate-x-1 transition font-mono">&gt;</span>
          </button>

        </div>

        {/* Premium Upgrade Card if not premium */}
        {!currentUser.isPremium && (
          <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5 text-neutral-950 shadow-lg relative overflow-hidden text-left">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
              <Award className="w-40 h-40" />
            </div>
            <h3 className="text-base font-extrabold flex items-center gap-1.5">
              <Star className="w-5 h-5 fill-neutral-950" />
              <span>Get Star Membership!</span>
            </h3>
            <p className="text-xs font-medium text-neutral-800/90 mt-1 max-w-[80%] leading-relaxed">
              Join today to unlock golden profile stars, ad-free browsing, and premium support.
            </p>
            <button
              onClick={handleMakePremium}
              className="mt-4 bg-neutral-900 text-white font-bold text-[10px] py-2 px-3 rounded-xl shadow hover:bg-neutral-800 transition active:scale-95 duration-200 cursor-pointer"
            >
              Unlock Premium Membership
            </button>
          </div>
        )}

        {/* Log Out card */}
        <div className="bg-amber-500/5 dark:bg-amber-955/20 rounded-2xl p-4 shadow-sm border border-amber-500/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-neutral-900 rounded-xl hover:shadow-md transition text-left cursor-pointer"
          >
            <div className="bg-red-50 dark:bg-red-955/30 text-red-500 p-2.5 rounded-full">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">Log Out</span>
          </button>
        </div>

        {/* Footnote */}
        <div className="text-center pt-8 text-neutral-400 dark:text-neutral-600 space-y-1">
          <p className="text-[10px] font-black tracking-wider uppercase">Dept.file v2.5.0</p>
          <p className="text-[9px]">Creator Cash-out & Premium Platform 🌟</p>
        </div>
      </div>
    </div>
  );
}
