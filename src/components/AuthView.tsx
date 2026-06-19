/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

interface AuthViewProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [activeTab, setActiveTab] = React.useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<'user' | 'creator'>('user');
  const [referralCodeInput, setReferralCodeInput] = React.useState('');

  // Login states
  const [loginPhone, setLoginPhone] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = await dbService.loginUser(loginPhone, loginPassword);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMsg(result.error || 'Login failed.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setErrorMsg('Mobile phone number is required!');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long!');
      return;
    }

    const result = await dbService.signupUser(fullName, phone, email, password, role, referralCodeInput);
    if (result.success && result.user) {
      setSuccessMsg('Account created successfully! Logging you in automatically...');
      setTimeout(() => {
        if (result.user) {
          onLoginSuccess(result.user);
        }
      }, 1500);
    } else {
      setErrorMsg(result.error || 'Registration failed.');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between h-full overflow-y-auto select-none p-6 pb-8">
      <div>
        {/* Animated Brand Header */}
        <div className="text-center space-y-2 mt-4 mb-6 flex flex-col items-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/25 animate-pulse">
            <span className="text-white font-black text-3xl tracking-tighter italic font-display">D</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-neutral-50 tracking-tight font-sans">Dept.file</h1>
            <p className="text-[9px] text-amber-600 dark:text-amber-450 font-bold tracking-widest uppercase mt-0.5">
              Creator Cash-out & Premium Photo Platform
            </p>
          </div>
        </div>

        {/* Tab Selector (Facebook Style) */}
        <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-neutral-800 p-1 rounded-2xl flex gap-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-amber-500 dark:bg-amber-600 text-white shadow-md shadow-amber-500/10'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signup'
                ? 'bg-amber-500 dark:bg-amber-600 text-white shadow-md shadow-amber-500/10'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>

        {/* Alerts / Real-time notifications */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl mb-4 leading-relaxed pl-4">
            ⚠️ {errorMsg}
          </div>
        )}

        {dbService.getAuthError() && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] rounded-2xl mb-4 leading-relaxed pr-3 pl-4">
            💡 <strong>ফায়ারবেস সতর্কতা:</strong> আপনার ফায়ারবেস প্রোজেক্টে (Anonymous Auth) নিষ্ক্রিয় আছে। স্থায়ীভাবে ডাটা ক্লাউডে সেভ করতে চাইলে দয়া করে আপনার <strong>Firebase Console ➜ Authentication ➜ Sign-in method</strong> থেকে <strong>Anonymous</strong> সাইন-ইন প্রভাইডারটি চালু (Enable) করে রাখুন।
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl mb-4 leading-relaxed pl-4">
            🚀 {successMsg}
          </div>
        )}

        {/* Active View forms */}
        {activeTab === 'login' ? (
          /* Login Form (Phone + Password) */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-widest pl-1 block">
                Mobile Phone Number
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="tel"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="e.g. +880 1700000000"
                  className="w-full border border-neutral-250 dark:border-neutral-750 rounded-2xl pl-10 pr-4 py-3 text-xs bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-neutral-100 transition-all font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-widest pl-1 block">
                Security Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your secret password"
                  className="w-full border border-neutral-250 dark:border-neutral-750 rounded-2xl pl-10 pr-10 py-3 text-xs bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-neutral-100 transition-all font-sans font-semibold"
                />
                <button
                  type="button"
                  id="toggle-login-pass"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              className="w-full bg-amber-500 dark:bg-amber-600 text-white hover:bg-amber-600 text-xs font-black py-3.5 rounded-2xl shadow-lg shadow-amber-500/10 active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              Complete Login ➜
            </button>
          </form>
        ) : (
          /* Signup Form (Name + Gmail + Phone + Password + Role) */
          <form onSubmit={handleSignup} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-widest pl-1 block">
                Your Name (Full Name)
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maimun Islam"
                  className="w-full border border-neutral-250 dark:border-neutral-750 rounded-2xl pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-neutral-100 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-widest pl-1 block">
                Gmail / Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. example@gmail.com"
                  className="w-full border border-neutral-250 dark:border-neutral-750 rounded-2xl pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-neutral-100 transition-all font-sans font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-widest pl-1 block">
                Mobile Number (Phone)
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01700000000"
                  className="w-full border border-neutral-250 dark:border-neutral-750 rounded-2xl pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-neutral-100 transition-all font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-widest pl-1 block">
                Set Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  id="signup-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret password"
                  className="w-full border border-neutral-250 dark:border-neutral-750 rounded-2xl pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-neutral-100 transition-all font-sans font-semibold"
                />
                <button
                  type="button"
                  id="toggle-signup-pass"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Referral Code input block */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-widest pl-1 block">
                Referral Code (Optional)
              </label>
              <div className="relative flex items-center">
                <Sparkles className="absolute left-3.5 w-4 h-4 text-amber-500 animate-pulse" />
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value)}
                  placeholder="Enter referral code (e.g. admin)"
                  className="w-full border border-neutral-250 dark:border-neutral-750 rounded-2xl pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 dark:text-neutral-100 transition-all font-mono font-bold placeholder:font-sans placeholder:font-normal placeholder:text-neutral-400"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-signup-submit"
              className="w-full bg-amber-500 dark:bg-amber-600 text-white hover:bg-amber-600 text-xs font-black py-3.5 rounded-2xl shadow-lg shadow-amber-500/10 active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              Complete Registration
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
