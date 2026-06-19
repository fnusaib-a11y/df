/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Gift, Lock, RefreshCw, Smartphone } from 'lucide-react';
import { dbService } from '../services/db';
import { TransactionItem, UserProfile } from '../types';

interface WalletViewProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function WalletView({ onBack, onNavigate }: WalletViewProps) {
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadData = () => {
    const user = dbService.getCurrentUser();
    setProfile(user);
    if (user) {
      setTransactions(dbService.getTransactions(user.id));
    }
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener('starconnect_db_update', loadData);
    return () => window.removeEventListener('starconnect_db_update', loadData);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadData();
      setIsRefreshing(false);
    }, 800);
  };

  if (!profile) return null;

  // Star conversion rate: 1 star = ৳0.80 BDT cashout
  const estimatedBDT = Math.round(profile.starBalance * 0.8);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-y-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200/50 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 mr-1 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 text-slate-800 dark:text-neutral-200" />
          </button>
          <div className="flex items-center gap-1.5">
            <Wallet className="w-5 h-5 text-amber-500" />
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white">Virtual Wallet</h1>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-transform cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 text-left">
        {/* Main Glassy Balance Card */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-605 to-amber-700 text-white rounded-[28px] p-6 shadow-xl shadow-amber-500/15 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center z-10 relative">
            <span className="text-xs font-bold tracking-widest text-amber-100 uppercase">Total Balance (Stars)</span>
            <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
              {profile.role === 'creator' ? 'Content Creator' : 'Star Viewer'}
            </div>
          </div>

          <div className="my-5 flex items-baseline gap-2 z-10 relative">
            <span className="text-4xl font-extrabold font-mono tracking-tight">{profile.starBalance}</span>
            <span className="text-lg font-black text-amber-200">⭐ STAR</span>
          </div>

          <div className="border-t border-white/20 pt-4 flex justify-between items-center z-10 relative text-xs">
            <div>
              <p className="text-amber-200 font-medium font-bold">Equivalent BDT (Estimated)</p>
              <p className="text-lg font-bold font-mono text-white mt-0.5">৳ {estimatedBDT} BDT</p>
            </div>
            
            {profile.role === 'creator' && (
              <div className="text-right font-bold">
                <p className="text-amber-200 font-medium select-none flex items-center justify-end gap-1">
                  <Lock className="w-3 h-3 text-amber-300" /> Pending Balance
                </p>
                <p className="text-lg font-bold font-mono text-white mt-0.5">৳ {Math.round(profile.pendingBalanceStars * 0.8)} BDT</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Quick Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('BUY_STARS')}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 transition-all text-xs cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 shrink-0" />
            <span>Buy Stars 📥</span>
          </button>

          <button
            onClick={() => {
              if (profile.role !== 'creator') {
                alert('You must be a Creator to use the cash-out and withdrawal system. Please submit your KYC form in Settings. 🛡️');
                return;
              }
              onNavigate('WITHDRAW');
            }}
            className="bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-amber-600 dark:text-amber-400 border border-amber-250 font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs shadow-sm cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 shrink-0" />
            <span>Cash Out 💸</span>
          </button>
        </div>

        {/* Metrics Grid Analytics */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[24px] p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Wallet Summary</span>
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl text-left">
              <span className="text-[10px] font-bold text-zinc-400 block uppercase">Total Stars Earned</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                ⭐ {profile.totalStarsEarned}
              </span>
            </div>
            
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl text-left">
              <span className="text-[10px] font-bold text-zinc-400 block uppercase">Total Stars Spent</span>
              <span className="text-lg font-bold font-mono text-rose-500 dark:text-rose-400 mt-1 block">
                ⭐ {profile.totalStarsSpent}
              </span>
            </div>
          </div>
        </div>

        {/* Referral Status Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[24px] p-5 shadow-sm space-y-4 text-left">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              <Gift className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Referral & Income Program</span>
            </h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-650 font-bold px-2 py-0.5 rounded-full">Active</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-neutral-200/50 rounded-2xl flex flex-col items-center text-center space-y-2">
            <span className="text-[11px] text-zinc-500 font-medium">Your Unique Referral Code</span>
            <div className="bg-white dark:bg-zinc-900 border border-neutral-250 px-4 py-2 rounded-xl text-sm font-mono font-black text-amber-600 tracking-wider flex items-center gap-2">
              <span>{profile.referralCode || profile.username}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(profile.referralCode || profile.username);
                  alert('Referral code copied successfully! 📋✈️');
                }}
                className="text-[10px] bg-amber-50 px-2.5 py-1 rounded-lg text-amber-705 font-sans font-black cursor-pointer hover:bg-amber-100 transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Share this code with friends to earn free stars when they sign up!</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 block uppercase">Total Successful Referrals</span>
              <span className="text-base font-black text-slate-800 dark:text-zinc-200 block mt-1">
                {profile.referralsCount || 0} members
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 block uppercase">Referral Bonus Earned</span>
              <span className="text-base font-black text-amber-500 block mt-1">
                ⭐ {profile.totalReferralBonus || 0} Stars
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Transaction history list row */}
        <div className="space-y-3 text-left">
          <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest pl-1">Transaction History</h2>

          {transactions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-[24px] border border-neutral-150 p-5 text-neutral-400">
              <p className="text-xs font-bold text-slate-650 dark:text-zinc-300">No transaction records found.</p>
              <p className="text-[11px] mt-1 text-slate-400">Your picture unlocks, star purchases, and cash-outs will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isEarn = tx.type === 'post_earn' || tx.type === 'receive_gift' || tx.type === 'buy_stars';
                return (
                  <div
                    key={tx.id}
                    className="bg-white dark:bg-neutral-900 p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isEarn ? 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-955/40 dark:text-rose-450'}`}>
                        {tx.type === 'buy_stars' && <Smartphone className="w-4 h-4" />}
                        {tx.type === 'post_earn' && <Lock className="w-4 h-4" />}
                        {tx.type === 'unlock_post' && <Lock className="w-4 h-4" />}
                        {tx.type === 'send_gift' && <Gift className="w-4 h-4" />}
                        {tx.type === 'receive_gift' && <Gift className="w-4 h-4" />}
                        {tx.type === 'withdraw' && <Wallet className="w-4 h-4" />}
                      </div>

                      <div className="text-left">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 block">
                          {tx.type === 'buy_stars' && 'Star Recharge (bKash/Nagad)'}
                          {tx.type === 'post_earn' && `Photo Unlock Earned [${tx.referenceName}]`}
                          {tx.type === 'unlock_post' && `Exclusive Photo Unlock`}
                          {tx.type === 'send_gift' && `Star Gift Sent [${tx.referenceName}]`}
                          {tx.type === 'receive_gift' && `Received Star Gift`}
                          {tx.type === 'withdraw' && 'Cash Out Request'}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 font-mono">
                          {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-black font-mono block ${isEarn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isEarn ? '+' : '-'}{tx.amountStars} ⭐
                      </span>
                      {tx.amountBDT && (
                        <span className="text-[10px] font-bold text-slate-500 block">
                          ৳{tx.amountBDT} BDT
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
