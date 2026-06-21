/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Trash2, UserX, Award, Coins, FileCheck, Landmark, Bell, Heart, Sparkles } from 'lucide-react';
import { dbService } from '../services/db';
import { Report, Post, UserProfile, WithdrawalRequest, TransactionItem } from '../types';
import { VerifiedBadge } from './VerifiedBadge';

interface AdminPanelViewProps {
  onBack: () => void;
}

type AdminTab = 'kyc' | 'withdrawals' | 'reports' | 'users' | 'referrals' | 'verification' | 'notifications' | 'booster';

export default function AdminPanelView({ onBack }: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = React.useState<AdminTab>('kyc');
  const [reports, setReports] = React.useState<Report[]>([]);
  const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalRequest[]>([]);
  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [refSettings, setRefSettings] = React.useState({
    isEnabled: true,
    signupBonusStars: 10,
    purchaseCommissionPercent: 10
  });
  const [verSettings, setVerSettings] = React.useState({
    isEnabled: true,
    verificationCostStars: 100,
    verificationCostBDT: 150,
    isAutoReferEnabled: true,
    minReferralsForAutoVerify: 30
  });

  // Admin Custom Notification Composer states
  const [notifTargetUserId, setNotifTargetUserId] = React.useState<string>('all');
  const [notifText, setNotifText] = React.useState<string>('');

  const loadAdminData = () => {
    setReports(dbService.getReports());
    setAllUsers(dbService.getUsers());
    setWithdrawals(dbService.getWithdrawalHistory());
    setRefSettings(dbService.getReferralSettings());
    setVerSettings(dbService.getVerificationSettings());
    
    // Aggregate global transaction logs
    const allTxs: TransactionItem[] = [];
    dbService.getUsers().forEach(u => {
      allTxs.push(...dbService.getTransactions(u.id));
    });
    setTransactions(allTxs);
  };

  React.useEffect(() => {
    loadAdminData();
    window.addEventListener('starconnect_db_update', loadAdminData);
    return () => window.removeEventListener('starconnect_db_update', loadAdminData);
  }, []);

  // Admin Actions
  const handleApproveKyc = (userId: string) => {
    dbService.approveKyc(userId);
    alert('Creator KYC successfully approved and Blue Badge verified! 🌟🎖️');
    loadAdminData();
  };

  const handleRejectKyc = (userId: string) => {
    dbService.rejectKyc(userId);
    alert('Creator KYC request has been rejected. ❌');
    loadAdminData();
  };

  const handleApproveWithdrawal = (id: string) => {
    dbService.approveWithdrawal(id);
    alert('Payment successfully released and creator has been notified! 💸');
    loadAdminData();
  };

  const handleRejectWithdrawal = (id: string) => {
    dbService.rejectWithdrawal(id);
    alert('Cashout request cancelled and refund processed. ⟲');
    loadAdminData();
  };

  const handleBanUser = (userId: string) => {
    const confirm = window.confirm('Are you sure you want to temporarily restrict and ban this user?');
    if (confirm) {
      dbService.banUser(userId);
      alert('User profile successfully restricted. 🛑');
      loadAdminData();
    }
  };

  const handleResolveReport = (reportId: string) => {
    dbService.resolveReport(reportId);
    alert('Report ticket has been successfully resolved. ✅');
    loadAdminData();
  };

  // Computations
  const totalStarsSold = transactions
    .filter(t => t.type === 'buy_stars' && t.status === 'completed')
    .reduce((sum, curr) => sum + curr.amountStars, 0);

  const totalRevenueBDT = transactions
    .filter(t => t.type === 'buy_stars' && t.status === 'completed')
    .reduce((sum, curr) => sum + (curr.amountBDT || 0), 0);

  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;
  const pendingKycCount = allUsers.filter(u => u.kycStatus === 'pending').length;

  // Aggregate reactions across all stories (Request #3)
  const reactionTotals: { [emoji: string]: number } = {
    '👍': 0,
    '❤️': 0,
    '😆': 0,
    '😮': 0,
    '😢': 0,
    '😡': 0
  };

  const stories = dbService.getStories();
  stories.forEach(s => {
    if (s.reacts) {
      Object.values(s.reacts).forEach(emoji => {
        if (reactionTotals[emoji] !== undefined) {
          reactionTotals[emoji]++;
        }
      });
    }
  });

  const totalAppReactions = Object.values(reactionTotals).reduce((sum, count) => sum + count, 0);
  const postLikesCount = dbService.getPosts().reduce((sum, p) => sum + (p.likedBy?.length || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-y-auto pb-16">
      
      {/* Admin Title Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200/50 dark:border-neutral-850 bg-white dark:bg-neutral-900 sticky top-0 z-25">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 mr-2"
          >
            <ArrowLeft className="w-6 h-6 text-slate-800 dark:text-neutral-200" />
          </button>
          <div className="flex items-center gap-1">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h1 className="text-base font-extrabold text-indigo-600 tracking-tight">Admin Control Panel</h1>
          </div>
        </div>

        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
          LIVE CONFIG
        </span>
      </div>

      <div className="p-4 space-y-5">
        
        {/* Analytics dashboard boxes */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-4">
          <h2 className="text-[10px] uppercase tracking-widest pl-0.5 text-indigo-300 font-bold select-none">Key Metrics & Revenue Statistics</h2>
          
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] text-indigo-200 block uppercase font-bold">Total Revenue Received</span>
              <span className="text-lg font-black font-mono block mt-1 text-emerald-400">৳ {totalRevenueBDT}</span>
              <span className="text-[9px] text-zinc-400 font-bold block">{totalStarsSold} Stars Sold</span>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
              <span className="text-[9px] text-indigo-200 block uppercase font-bold">Pending Withdrawals</span>
              <span className="text-lg font-black font-mono block mt-1 text-amber-400">{pendingWithdrawalsCount} Requests</span>
              <span className="text-[9px] text-zinc-400 font-bold block">৳ {withdrawals.filter(w=>w.status==='pending').reduce((s,c)=>s+c.amountBDT,0)} BDT value</span>
            </div>
          </div>
        </div>

        {/* Reactions Dashboard Metrics (Request #3) */}
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-neutral-850 rounded-3xl p-5 shadow-sm space-y-3.5">
          <div className="flex justify-between items-center">
            <h2 className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-black select-none">App-wide Reactions Statistics</h2>
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[9px] font-black px-2.5 py-1 rounded-full font-mono">
              Total: {totalAppReactions + postLikesCount} Reactions
            </span>
          </div>

          {/* Grid displaying react totals */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { emoji: '👍', label: 'Like', count: reactionTotals['👍'] },
              { emoji: '❤️', label: 'Love', count: reactionTotals['❤️'] },
              { emoji: '😆', label: 'Haha', count: reactionTotals['😆'] },
              { emoji: '😮', label: 'Wow', count: reactionTotals['😮'] },
              { emoji: '😢', label: 'Sad', count: reactionTotals['😢'] },
              { emoji: '😡', label: 'Angry', count: reactionTotals['😡'] }
            ].map((item) => (
              <div key={item.label} className="bg-neutral-50 dark:bg-neutral-800 p-2.5 rounded-2xl border border-neutral-100 dark:border-neutral-850 text-center flex flex-col justify-center items-center">
                <span className="text-2xl mb-1 active:scale-125 transition duration-150 inline-block">{item.emoji}</span>
                <span className="text-[8.5px] text-slate-400 font-extrabold uppercase select-none">{item.label}</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 mt-1 font-mono">{item.count}</span>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-2xl border border-indigo-100/55 dark:border-indigo-900/40 flex justify-between items-center text-xs">
            <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-black uppercase">Post Heart Likes (❤️)</span>
            <span className="font-extrabold text-slate-800 dark:text-indigo-200 font-mono text-xs">{postLikesCount} times</span>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="grid grid-cols-4 gap-1.5 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('kyc')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'kyc'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-800 dark:hover:bg-neutral-850'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span className="relative">
              KYC {pendingKycCount > 0 && (
                <span className="absolute -top-1.5 -right-3 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-800 dark:hover:bg-neutral-850'
            }`}
          >
            <Landmark className="w-4 h-4 shrink-0" />
            <span className="relative">
              Withdraw {pendingWithdrawalsCount > 0 && (
                <span className="absolute -top-1.5 -right-3 w-2 h-2 rounded-full bg-rose-500"></span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-800 dark:hover:bg-neutral-850'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-800 dark:hover:bg-neutral-850'
            }`}
          >
            <UserX className="w-4 h-4 shrink-0" />
            <span>Users</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'referrals'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-800 dark:hover:bg-neutral-850'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            <span>Referrals</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'verification'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-850 dark:hover:bg-neutral-800'
            }`}
          >
            <VerifiedBadge className="w-4 h-4 shrink-0" />
            <span>Verify Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-850 dark:hover:bg-neutral-800'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('booster')}
            className={`py-2 rounded-xl text-[10px] font-black transition text-center flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'booster'
                ? 'bg-indigo-650 text-white font-extrabold shadow-sm'
                : 'text-zinc-500 hover:bg-neutral-850 dark:hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Booster</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-4 animate-fadeIn">
          
          {/* Tab A: KYC Queue */}
          {activeTab === 'kyc' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">KYC Approval Pending Queue</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">{pendingKycCount} applications</span>
              </div>

              {allUsers.filter(u => u.kycStatus === 'pending').length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-[24px] border border-neutral-150 p-5 text-neutral-400">
                  <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">No pending KYC requests. 😊</p>
                  <p className="text-[10px] mt-1">All creator applications are fully processed.</p>
                </div>
              ) : (
                allUsers.filter(u => u.kycStatus === 'pending').map((uc) => (
                  <div
                    key={uc.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-150 rounded-[22px] p-5.5 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-neutral-200">
                          <img src={uc.avatarUrl} alt={uc.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800 dark:text-zinc-200 block">{uc.name}</span>
                          <span className="text-[10px] text-zinc-400 font-bold font-mono">@{uc.username} • {uc.phone}</span>
                        </div>
                      </div>

                      <span className="text-[10.5px] bg-amber-50 text-amber-600 px-3 py-1 rounded-full font-black select-none">
                        PENDING
                      </span>
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200/50 rounded-xl space-y-2 text-xs text-slate-800 dark:text-neutral-250">
                      <div>
                        <span className="text-zinc-400 text-[9.5px] font-black uppercase">Legal Name (NID/Passport)</span>
                        <p className="font-bold mt-0.5">{uc.kycRealName || 'Not Set'}</p>
                      </div>
                      
                      <div className="border-t border-dashed border-neutral-200/50 pt-2">
                        <span className="text-zinc-400 text-[9.5px] font-black uppercase">NID number or Passport</span>
                        <p className="font-bold font-mono mt-0.5">{uc.kycNidOrPassport || 'Not Set'}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-[10.5px] font-black pt-1">
                      <button
                        onClick={() => handleRejectKyc(uc.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 py-2.5 px-4.5 rounded-xl transition cursor-pointer"
                      >
                        Reject & Cancel
                      </button>
                      <button
                        onClick={() => handleApproveKyc(uc.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-6 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve & Verify</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab B: Withdrawals Approvals */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Withdrawal / Cashout Requests</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">{pendingWithdrawalsCount} pending cashouts</span>
              </div>

              {withdrawals.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-10 bg-white border border-neutral-200 rounded-[24px]">No withdrawal requests submitted.</p>
              ) : (
                withdrawals.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-150 rounded-[22px] p-5 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-zinc-200 block">{req.userName}</span>
                        <span className="text-[9px] font-bold font-mono text-zinc-400 block uppercase">
                          Code: {req.id} • {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-600'
                          : req.status === 'approved'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-rose-100 text-rose-600'
                      }`}>
                        {req.status === 'pending' ? 'Pending' : req.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl text-slate-800 dark:text-neutral-250">
                      <div>
                        <span className="text-zinc-400 text-[9.5px] font-bold uppercase block leading-none">Withdrawal Method</span>
                        <span className="font-extrabold text-[#D12053] block mt-1">{req.method}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[9.5px] font-bold uppercase block leading-none">Mobile Wallet Number</span>
                        <span className="font-extrabold block font-mono mt-1">{req.accountNumber}</span>
                      </div>
                      <div className="border-t border-neutral-200/30 pt-2 mt-2">
                        <span className="text-zinc-400 text-[9.5px] font-bold uppercase block leading-none">Amount (BDT)</span>
                        <span className="font-black block mt-1 font-mono">৳ {req.amountBDT} BDT</span>
                      </div>
                      <div className="border-t border-neutral-200/30 pt-2 mt-2">
                        <span className="text-zinc-400 text-[9.5px] font-bold uppercase block leading-none">Star Debit Cost</span>
                        <span className="font-black text-zinc-500 block mt-1 font-mono">⭐ {req.amountStars} Stars</span>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex justify-end gap-2 text-[10.5px] font-black pt-1">
                        <button
                          onClick={() => handleRejectWithdrawal(req.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 py-2.5 px-4 rounded-xl transition cursor-pointer"
                        >
                          Reject payment
                        </button>
                        <button
                          onClick={() => handleApproveWithdrawal(req.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-6 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1"
                        >
                          <Coins className="w-4 h-4" />
                          <span>Pay & Mark Approved</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab C: Reports moderation */}
          {activeTab === 'reports' && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Report Tickets Queue</h2>

              {reports.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-10 bg-white border border-neutral-200 rounded-[24px]">No report tickets filed.</p>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-150 p-4 rounded-2xl shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
                      <div className="text-[10.5px]">
                        <p className="font-bold text-slate-700">Reporter: {rep.reporterName}</p>
                        <p className="text-neutral-400 mt-0.5">Reported: {rep.reportedName}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        rep.status === 'pending' ? 'bg-rose-100 text-rose-650' : 'bg-green-150 text-green-650'
                      }`}>
                        {rep.status === 'pending' ? 'Pending' : 'Resolved'}
                      </span>
                    </div>

                    <div className="text-xs bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl space-y-2">
                      <p className="text-[11px] font-semibold text-rose-650 italic">Reason: "{rep.reason}"</p>
                      {rep.postContent && (
                        <div className="border-t border-dashed border-neutral-200/50 pt-1.5 mt-1 text-[10.5px]">
                          <span className="font-bold text-zinc-400">Reported Post Content:</span>
                          <p className="line-clamp-2 text-zinc-500 mt-0.5">{rep.postContent}</p>
                        </div>
                      )}
                    </div>

                    {rep.status === 'pending' && (
                      <div className="flex justify-end gap-2 text-[10px] font-bold">
                        <button
                          onClick={() => handleBanUser(rep.reportedId)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-500 py-1.5 px-3 rounded-lg flex items-center gap-1 border border-rose-100 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Restrict & Ban User</span>
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id)}
                          className="bg-amber-500 hover:bg-amber-600 text-white py-1.5 px-4 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Resolve & Close</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab D: Users overview lists */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Registered Creator Pool</h2>

              <div className="bg-white dark:bg-neutral-900 rounded-[24px] border border-neutral-150 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden shadow-sm">
                {allUsers.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-neutral-100">
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-1 leading-none">
                          {user.name}
                          {user.isVerified && <VerifiedBadge className="w-3.5 h-3.5" />}
                          {user.role === 'creator' && <Award className="w-3.5 h-3.5 text-amber-500" />}
                        </span>
                        <span className="text-[9.5px] font-mono text-zinc-400 mt-1 block">@{user.username} • {user.phone}</span>
                        <span className="text-[9.5px] font-bold text-emerald-600 font-mono mt-0.5 block">Wallet: ⭐{user.starBalance}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.id !== 'user_admin' && (
                        <button
                          onClick={() => handleBanUser(user.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                          title="Restrict Account"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab E: Referral Settings and Commission Control */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-150 rounded-[22px] p-5 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">Referral & Commission Control</h3>
                    <p className="text-[10px] text-zinc-400 font-bold">Admin Panel Commission Settings</p>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    onClick={() => {
                      const updated = { ...refSettings, isEnabled: !refSettings.isEnabled };
                      setRefSettings(updated);
                      dbService.updateReferralSettings(updated);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      refSettings.isEnabled ? 'bg-indigo-600' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        refSettings.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Signup Bonus Stars */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
                      Signup Bonus (Stars)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        disabled={!refSettings.isEnabled}
                        type="number"
                        min="0"
                        value={refSettings.signupBonusStars}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          const updated = { ...refSettings, signupBonusStars: val };
                          setRefSettings(updated);
                        }}
                        className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-zinc-950 focus:outline-none text-slate-800 dark:text-neutral-200 disabled:opacity-50"
                      />
                      <span className="text-xs text-zinc-500 font-bold shrink-0">Stars</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400">The referrer receives this many stars immediately when a new user signs up utilizing their referral code.</p>
                  </div>

                  {/* Purchase Commission Rate */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
                      Star Multiplier Purchase Commission (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        disabled={!refSettings.isEnabled}
                        type="number"
                        min="0"
                        max="100"
                        value={refSettings.purchaseCommissionPercent}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                          const updated = { ...refSettings, purchaseCommissionPercent: val };
                          setRefSettings(updated);
                        }}
                        className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-zinc-950 focus:outline-none text-slate-800 dark:text-neutral-200 disabled:opacity-50"
                      />
                      <span className="text-xs text-zinc-500 font-bold shrink-0">Percent</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400">The percentage of stars a referrer will earn when their referred users purchase stars.</p>
                  </div>

                  <button
                    disabled={!refSettings.isEnabled}
                    onClick={() => {
                      dbService.updateReferralSettings(refSettings);
                      alert('Referral and commission settings updated successfully! 🌟🔒');
                    }}
                    className="w-full py-3 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Save Settings Changes</span>
                  </button>
                </div>
              </div>

              {/* Referral leaderboard/report of referrers */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-150 rounded-[22px] p-5 shadow-sm space-y-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Top Referrer Leaderboard</span>
                
                <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
                  {allUsers
                    .filter(u => (u.referralsCount || 0) > 0)
                    .sort((a, b) => (b.referralsCount || 0) - (a.referralsCount || 0))
                    .map((user, i) => (
                      <div key={user.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-indigo-650">#{i + 1}</span>
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-neutral-100">
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">{user.name}</span>
                            <span className="text-[9.5px] font-mono text-zinc-400 block">Code: {user.referralCode || user.username}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-800 dark:text-zinc-150 block">{user.referralsCount} Referrals</span>
                          <span className="text-[9px] text-amber-600 dark:text-amber-450 font-bold block">⭐ +{(user.totalReferralBonus || 0)} stars bonus earned</span>
                        </div>
                      </div>
                    ))}
                  {allUsers.filter(u => (u.referralsCount || 0) > 0).length === 0 && (
                    <p className="text-xs text-neutral-400 text-center py-6">No users have successfully referred anyone yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-[22px] p-5 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">Creator Verification Rules Settings</h3>
                    <p className="text-[10px] text-zinc-400 font-bold">Verification Badge Integration Rules</p>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    onClick={() => {
                      const updated = { ...verSettings, isEnabled: !verSettings.isEnabled };
                      setVerSettings(updated);
                      dbService.updateVerificationSettings(updated);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      verSettings.isEnabled ? 'bg-indigo-600' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        verSettings.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <p className="text-xs text-slate-650 dark:text-neutral-400 leading-snug">
                    Configure how creators can verify their profile and earn the Blue Badge - by purchasing verified status directly or hitting referral milestones.
                  </p>

                  <div className="border-t border-neutral-100 dark:border-neutral-850 pt-3 space-y-4">
                    <span className="text-[11px] font-black text-indigo-650 uppercase tracking-widest block">Method 1: Paid Verification Badge Upgrade</span>

                    {/* Verification Cost Stars */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
                        Verification Cost (Stars)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          disabled={!verSettings.isEnabled}
                          type="number"
                          min="1"
                          value={verSettings.verificationCostStars}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 0);
                            const updated = { ...verSettings, verificationCostStars: val };
                            setVerSettings(updated);
                          }}
                          className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-zinc-950 focus:outline-none text-slate-850 dark:text-neutral-200 disabled:opacity-50"
                        />
                        <span className="text-xs text-zinc-500 font-bold shrink-0">Stars</span>
                      </div>
                      <p className="text-[9.5px] text-zinc-400">The cost in Stars deducted from creator's wallet for immediate badge checkout.</p>
                    </div>

                    {/* Verification Cost BDT */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
                        Verification Cost Cash (BDT)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          disabled={!verSettings.isEnabled}
                          type="number"
                          min="1"
                          value={verSettings.verificationCostBDT}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 0);
                            const updated = { ...verSettings, verificationCostBDT: val };
                            setVerSettings(updated);
                          }}
                          className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-zinc-950 focus:outline-none text-slate-850 dark:text-neutral-200 disabled:opacity-50"
                        />
                        <span className="text-xs text-zinc-500 font-bold shrink-0">৳ (BDT)</span>
                      </div>
                      <p className="text-[9.5px] text-zinc-400">Amount in money required when manually requesting badges via bKash/Nagad.</p>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-850 pt-3 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-indigo-650 uppercase tracking-widest block">Method 2: Automatic Referral Milestones (Free)</span>
                      
                      {/* Sub-Toggle */}
                      <button
                        onClick={() => {
                          const updated = { ...verSettings, isAutoReferEnabled: !verSettings.isAutoReferEnabled };
                          setVerSettings(updated);
                          dbService.updateVerificationSettings(updated);
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          verSettings.isAutoReferEnabled ? 'bg-indigo-650' : 'bg-zinc-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            verSettings.isAutoReferEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Minimum Referrals */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
                        Required Minimum Referrals Completed
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          disabled={!verSettings.isAutoReferEnabled}
                          type="number"
                          min="1"
                          value={verSettings.minReferralsForAutoVerify}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 0);
                            const updated = { ...verSettings, minReferralsForAutoVerify: val };
                            setVerSettings(updated);
                          }}
                          className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-zinc-950 focus:outline-none text-slate-850 dark:text-neutral-200 disabled:opacity-50"
                        />
                        <span className="text-xs text-zinc-500 font-bold shrink-0">Members</span>
                      </div>
                      <p className="text-[9.5px] text-zinc-400">Once a user hits this referral count target, they are automatically awarded the Verified Blue Badge for free. (Default: 30)</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      dbService.updateVerificationSettings(verSettings);
                      alert('Verification & auto-referral rules updated successfully! 🚀🎖️');
                    }}
                    className="w-full py-3 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                  >
                    <Award className="w-4 h-4" />
                    <span>Save Verification Policy</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab G: Custom Administrative Notifications Board */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 text-left">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 rounded-[24px] p-5.5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <Bell className="w-5 h-5 text-indigo-650" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">Send Admin Notifications</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Admin-created notices are instantly delivered to users' notifications center.</p>
                  </div>
                </div>

                {/* Recipient Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
                    Recipient User
                  </label>
                  <select
                    value={notifTargetUserId}
                    onChange={(e) => setNotifTargetUserId(e.target.value)}
                    className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 text-xs bg-white dark:bg-zinc-950 focus:outline-none text-slate-850 dark:text-neutral-200 font-bold"
                  >
                    <option value="all" className="font-extrabold text-indigo-600">📢 ── Broadcast to All Members ──</option>
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        👤 {user.name} (@{user.username})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notification Message Field */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
                    Notification Message
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Type the customized push notification message here..."
                    value={notifText}
                    onChange={(e) => setNotifText(e.target.value)}
                    className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-3 text-xs bg-white dark:bg-zinc-950 focus:outline-none text-slate-850 dark:text-neutral-200 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Submit Action Button */}
                <button
                  onClick={() => {
                    if (!notifText.trim()) {
                      alert('Please specify the message content to broadcast!');
                      return;
                    }
                    dbService.sendAdminCustomNotification(notifTargetUserId, notifText.trim());
                    alert('Broadcast notification successfully sent! 🚀👑');
                    setNotifText('');
                  }}
                  className="w-full py-3 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>Deliver Notice Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab H: Likes and Comments Booster Control */}
          {activeTab === 'booster' && (
            <div className="space-y-4 text-left">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 rounded-[24px] p-5.5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-850">
                  <Sparkles className="w-5 h-5 text-indigo-650 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">সুপার পোস্ট বুস্টার (Post Likers & Comments Adjuster)</h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">এডমিন প্যানেল থেকে যেকোনো ক্রিয়েটরের পোস্টের লাইক এবং কমেন্ট সংখ্যা গোপনে নিয়ন্ত্রণ করুন।</p>
                  </div>
                </div>

                <div className="space-y-4 divide-y divide-neutral-100 dark:divide-neutral-850/60 font-medium">
                  {dbService.getPosts('All').length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-6">কোনো পোস্ট পাওয়া যায়নি।</p>
                  ) : (
                    dbService.getPosts('All').map((post) => (
                      <PostBoosterCard key={post.id} post={post} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function PostBoosterCard({ post }: { post: Post; key?: string }) {
  const [likes, setLikes] = React.useState(post.likesCount);
  const [comments, setComments] = React.useState(post.commentsCount);
  const [reachWeight, setReachWeight] = React.useState(post.reachWeight || 0);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleUpdate = () => {
    setIsUpdating(true);
    dbService.updatePostMetrics(post.id, likes, comments, reachWeight);
    setTimeout(() => {
      setIsUpdating(false);
      alert('সফলভাবে পোস্টের লাইক, কমেন্ট ও রিচ ওয়েট হালনাগাদ করা হয়েছে! 🚀🎯');
    }, 450);
  };

  const handleBumpToTop = () => {
    setIsUpdating(true);
    const now = new Date().toISOString();
    dbService.updatePostMetrics(post.id, likes, comments, reachWeight, now);
    setTimeout(() => {
      setIsUpdating(false);
      alert('সফলভাবে পোস্টটি সবার উপরে Bump করা হয়েছে! 🔝🔥');
    }, 350);
  };

  return (
    <div className="py-5 flex flex-col gap-3 justify-between border-b border-neutral-100 dark:border-neutral-850/60 last:border-0 text-left">
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-3 items-center">
          {post.mediaUrl ? (
            <img src={post.mediaUrl} alt="" className="w-12 h-12 object-cover rounded-xl border border-neutral-150 dark:border-neutral-800 shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-[10px] text-indigo-500 rounded-xl font-black shrink-0">POST</div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-800 dark:text-neutral-200 truncate max-w-[250px]">{post.title || post.content || 'Untitled post'}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">ক্রিয়েটর: <span className="font-bold text-amber-600">{post.authorName}</span></p>
          </div>
        </div>

        <button
          onClick={handleBumpToTop}
          className="text-[9px] font-black px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition active:scale-95 duration-100 flex items-center gap-1 cursor-pointer"
          title="পোস্টটি সবার উপরে নিয়ে আসুন"
        >
          <span>🔝</span> সবার উপরে তুলুন (Bump)
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Metric inputs (Likes, Comments) */}
        <div className="flex items-center gap-2">
          {/* Likes field */}
          <div className="flex items-center gap-1 bg-neutral-50 dark:bg-zinc-950 border border-neutral-150 dark:border-neutral-800 rounded-lg px-2.5 py-1">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
            <input
              type="number"
              value={likes}
              onChange={(e) => setLikes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-12 text-center text-xs font-black bg-transparent border-none focus:outline-none text-slate-800 dark:text-neutral-100"
              title="লাইক সংখ্যা"
            />
          </div>

          {/* Comments field */}
          <div className="flex items-center gap-1 bg-neutral-50 dark:bg-zinc-950 border border-neutral-150 dark:border-neutral-800 rounded-lg px-2.5 py-1">
            <span className="text-xs shrink-0">💬</span>
            <input
              type="number"
              value={comments}
              onChange={(e) => setComments(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-12 text-center text-xs font-black bg-transparent border-none focus:outline-none text-slate-800 dark:text-neutral-100"
              title="কমেন্ট সংখ্যা"
            />
          </div>
        </div>

        {/* Reach Controls (Up / Down) */}
        <div className="flex items-center gap-1 bg-neutral-50 dark:bg-zinc-950 p-1 rounded-xl border border-neutral-150 dark:border-neutral-800">
          <button
            onClick={() => setReachWeight(-500)}
            className={`px-2.5 py-1 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
              reachWeight < 0 
                ? 'bg-rose-500 text-white shadow-xs' 
                : 'text-zinc-500 hover:bg-neutral-150 dark:hover:bg-neutral-800'
            }`}
          >
            🛑 রিচ ডাউন
          </button>
          
          <button
            onClick={() => setReachWeight(0)}
            className={`px-2.5 py-1 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
              reachWeight === 0 
                ? 'bg-zinc-300 dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-xs' 
                : 'text-zinc-500 hover:bg-neutral-150 dark:hover:bg-neutral-800'
            }`}
          >
            স্বাভাবিক
          </button>

          <button
            onClick={() => setReachWeight(500)}
            className={`px-2.5 py-1 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
              reachWeight > 0 
                ? 'bg-[#11af5f] text-white shadow-xs animate-pulse' 
                : 'text-zinc-500 hover:bg-neutral-150 dark:hover:bg-neutral-800'
            }`}
          >
            🚀 রিচ আপ
          </button>
        </div>

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="text-[11px] font-black px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg transition active:scale-95 duration-100 cursor-pointer disabled:opacity-50"
        >
          {isUpdating ? 'আপডেট...' : 'হালনাগাদ'}
        </button>
      </div>
    </div>
  );
}
