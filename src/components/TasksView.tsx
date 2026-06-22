/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Coins, ExternalLink, Image, Send, Sparkles, Check, Award, HelpCircle } from 'lucide-react';
import { dbService } from '../services/db';
import { EarnTask, TaskClaim, UserProfile } from '../types';

interface TasksViewProps {
  onBack: () => void;
}

export default function TasksView({ onBack }: TasksViewProps) {
  const [myProfile, setMyProfile] = React.useState<UserProfile | null>(null);
  const [tasks, setTasks] = React.useState<EarnTask[]>([]);
  const [claims, setClaims] = React.useState<TaskClaim[]>([]);
  
  // Tab control
  const [activeTab, setActiveTab] = React.useState<'active' | 'history'>('active');
  
  // Submission dialog modal states
  const [selectedTask, setSelectedTask] = React.useState<EarnTask | null>(null);
  const [proofText, setProofText] = React.useState('');
  const [proofImage, setProofImage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadData = () => {
    const user = dbService.getCurrentUser();
    setMyProfile(user);
    setTasks(dbService.getEarnTasks());
    if (user) {
      setClaims(dbService.getUserTaskClaims(user.id));
    }
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener('starconnect_db_update', loadData);
    return () => {
      window.removeEventListener('starconnect_db_update', loadData);
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ফাইল সাইজ বেশি বড়! ২ মেগাবাইটের কম সাইজের ছবি দিন।');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProofImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myProfile || !selectedTask) return;

    if (!proofText.trim()) {
      alert('দয়া করে কাজের বিবরণ বা ইউজারনেম প্রুফ বক্সে লিখুন!');
      return;
    }

    setIsSubmitting(true);
    
    dbService.submitTaskClaim({
      taskId: selectedTask.id,
      userId: myProfile.id,
      userName: myProfile.name,
      userPhone: myProfile.phone,
      submittedDetails: proofText,
      proofScreenshotUrl: proofImage || undefined,
      rewardStars: selectedTask.rewardStars,
      rewardValueBDT: selectedTask.rewardValueBDT
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setSelectedTask(null);
      setProofText('');
      setProofImage('');
      alert('আপনার টাস্ক প্রুফ সফলভাবে এডমিনের কাছে সাবমিট করা হয়েছে! 🚀 এডমিন যাচাই করে দ্রুত আপনার ব্যালেন্সে স্টার যোগ করে দিবেন। 🥰');
      loadData();
    }, 800);
  };

  // Helper check to see if task is already submitted / claimed
  const getTaskStatus = (taskId: string) => {
    const relevantClaim = claims.find(c => c.taskId === taskId);
    if (!relevantClaim) return 'not_submitted';
    return relevantClaim.status; // 'pending' | 'approved' | 'rejected'
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 min-h-screen relative font-sans">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between z-10 shrink-0 select-none">
        <button
          onClick={onBack}
          className="p-1 rounded-full text-slate-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer active:scale-95"
          id="btn-tasks-back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-zinc-300" />
        </button>
        <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4.5 h-4.5 text-indigo-650 shrink-0" />
          রোজগার ও টাস্ক সেন্টার
        </span>
        <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/25 px-2.5 py-1 rounded-full text-[10px] font-black text-amber-600 dark:text-amber-400 font-mono shadow-sm">
          <Coins className="w-3.5 h-3.5" />
          <span>{myProfile?.starBalance || 0} ⭐</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Intro banner */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-neutral-900 text-white rounded-[24px] p-5.5 relative overflow-hidden shadow-md text-left border border-white/5">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              Daily Active Earning Pool
            </span>
            <h2 className="text-base font-black leading-tight tracking-tight">এডমিনের দেওয়া সহজ টাস্কগুলি সম্পন্ন করে প্রতিদিন ফ্রিতে স্টার আয় করুন! 🇧🇩💪</h2>
            <p className="text-[10.5px] text-indigo-200 leading-relaxed font-medium">
              সহজ সোশ্যাল পেজ লাইক, ইউটিউব চ্যানেল সাবস্ক্রাইব, বা অ্যাপলিকেশন ইন্সটল করে স্ক্রিনশট প্রুফ পাঠান। এডমিন ২৪ ঘন্টার মধ্যে ব্যালেন্স বা স্টার এপ্রুভ করবেন।
            </p>
          </div>
        </div>

        {/* Earning Tabs */}
        <div className="flex bg-neutral-150/65 dark:bg-neutral-900 rounded-2xl p-1 gap-1 select-none">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-indigo-650 text-white shadow-sm font-extrabold'
                : 'text-neutral-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            সক্রিয় টাস্ক ({tasks.filter(t => t.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-650 text-white shadow-sm font-extrabold'
                : 'text-neutral-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            সাবমিট হিস্ট্রি ({claims.length})
          </button>
        </div>

        {/* ACTIVE TASKS LIST */}
        {activeTab === 'active' && (
          <div className="space-y-3.5 text-left">
            {tasks.filter(t => t.status === 'active').length === 0 ? (
              <div className="bg-white dark:bg-neutral-950 border border-neutral-150 dark:border-zinc-805 p-8 rounded-3xl text-center shadow-xs">
                <HelpCircle className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-black text-slate-650 dark:text-zinc-300">এখন কোনো সক্রিয় টাস্ক নেই!</p>
                <p className="text-[10px] text-zinc-400 mt-1">নতুন টাস্ক এড করার সাথে সাথে আপনাকে নোটিফিকেশন পাঠিয়ে দেওয়া হবে।</p>
              </div>
            ) : (
              tasks.filter(t => t.status === 'active').map((task) => {
                const claimStatus = getTaskStatus(task.id);
                return (
                  <div 
                    key={task.id}
                    className="bg-white dark:bg-neutral-900/40 border border-neutral-150/90 dark:border-zinc-850 rounded-[24px] p-5 shadow-xs hover:border-indigo-200/50 dark:hover:border-indigo-950/40 transition-all duration-300 relative group"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400">
                          {task.type === 'video' ? '📺 Video Watch' :
                           task.type === 'app_download' ? '📲 App Download' :
                           task.type === 'social_follow' ? '🔗 Social Follow' : '🛠️ General Task'}
                        </span>
                        <h3 className="text-xs font-black text-slate-850 dark:text-zinc-100 leading-snug group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition">
                          {task.title}
                        </h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black bg-[#e6fbf3] text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100/30 px-2.5 py-1 rounded-xl shadow-xs leading-none">
                          +{task.rewardStars} ⭐
                        </div>
                        <p className="text-[9px] text-zinc-400 font-bold mt-1">৳ {task.rewardValueBDT} BDT Value</p>
                      </div>
                    </div>

                    <p className="text-[10.5px] text-zinc-500 dark:text-zinc-300 mt-2 leading-relaxed">
                      {task.description}
                    </p>

                    {task.actionUrl && (
                      <div className="mt-3.5 bg-neutral-50 dark:bg-neutral-900/70 border border-neutral-150 dark:border-zinc-805 rounded-xl p-2.5 flex items-center justify-between text-[10.5px] font-bold">
                        <span className="text-zinc-400 dark:text-zinc-400 text-[10px] truncate max-w-[150px] font-mono">
                          Link: {task.actionUrl}
                        </span>
                        <a 
                          href={task.actionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1877f2] dark:text-[#3897f0] hover:underline flex items-center gap-1 text-[10.5px] shrink-0 active:scale-95"
                        >
                          লিংক ভিজিট করুন
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    <div className="mt-4 flex sm:items-center justify-between gap-3 pt-3.5 border-t border-neutral-100 dark:border-neutral-850/60">
                      <div className="text-[9.5px] text-zinc-400 font-bold">
                        👥 মোট সম্পন্ন করেছেঃ <span className="text-slate-800 dark:text-white font-extrabold">{task.completionsCount || 0} জন</span>
                      </div>

                      {claimStatus === 'not_submitted' ? (
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="bg-indigo-650 hover:bg-indigo-750 text-white font-black text-[10.5px] px-4.5 py-2.5 rounded-xl transition shadow flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          প্রুফ সাবমিট দিন
                        </button>
                      ) : claimStatus === 'pending' ? (
                        <span className="text-[10.5px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3.5 py-2 rounded-xl font-bold inline-flex items-center gap-1 select-none">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          যাচাই চলছে (Pending)
                        </span>
                      ) : claimStatus === 'approved' ? (
                        <span className="text-[10.5px] bg-[#e6fbf3] text-emerald-600 border border-emerald-500/15 px-3.5 py-2 rounded-xl font-bold inline-flex items-center gap-1 select-none">
                          <Check className="w-3.5 h-3.5" />
                          অনুমোদিত (Approved) ✅
                        </span>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10.5px] bg-rose-50 text-rose-600 border border-rose-500/15 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1 select-none">
                            <AlertCircle className="w-3.5 h-3.5" />
                            প্রুফ বাতিল হয়েছে (Rejected)
                          </span>
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="text-[#1877f2] text-[9.5px] font-black hover:underline active:scale-95 cursor-pointer mt-1"
                          >
                            আবার চেষ্টা করুন (Resubmit Proof)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SUBMISSION HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3.5 text-left">
            {claims.length === 0 ? (
              <div className="bg-white dark:bg-neutral-950 border border-neutral-150 dark:border-zinc-805 p-8 rounded-3xl text-center shadow-xs">
                <Clock className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mx-auto mb-2 animate-pulse" />
                <p className="text-xs font-black text-slate-650 dark:text-zinc-300">কোনো কাজের বিবরণ বা ইতিহাস পাওয়া যায়নি!</p>
                <p className="text-[10px] text-zinc-400 mt-1">যখন কোনো টাস্ক করবেন ও প্রুফ প্রদান করবেন, তা দেখার তালিকা এখানে আসবে।</p>
              </div>
            ) : (
              claims.map((claim) => {
                const relTask = tasks.find(t => t.id === claim.taskId);
                return (
                  <div 
                    key={claim.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-zinc-850 rounded-[22px] p-4.5 shadow-xs flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100">
                          {relTask?.title || `টাস্ক আইডি: #${claim.taskId}`}
                        </h4>
                        <p className="text-[9.5px] text-zinc-400 mt-1 font-semibold">{new Date(claim.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        {claim.status === 'pending' ? (
                          <span className="bg-amber-500/15 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-0.5">
                            ⏳ যাচাইাধীন
                          </span>
                        ) : claim.status === 'approved' ? (
                          <span className="bg-[#e6fbf3] text-emerald-600 border border-emerald-500/10 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-0.5 animate-pulse">
                            ✅ সফল
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-500 border border-rose-500/10 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-0.5">
                            ❌ বাতিল
                          </span>
                        )}
                        <p className="text-[9.5px] text-emerald-600 font-extrabold mt-1">+{claim.rewardStars} ⭐</p>
                      </div>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-xl border border-neutral-100 dark:border-zinc-805/65">
                      <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">User Submitted Proof / আপনার দেওয়া প্রুফ</p>
                      <p className="text-[11px] text-slate-750 dark:text-zinc-300 font-medium whitespace-pre-line leading-relaxed">
                        {claim.submittedDetails}
                      </p>
                      {claim.proofScreenshotUrl && (
                        <div className="mt-2.5 w-24 aspect-video rounded-lg overflow-hidden border border-neutral-200/50 bg-white relative group">
                          <img src={claim.proofScreenshotUrl} alt="Screenshot proof" className="w-full h-full object-cover" />
                          <a href={claim.proofScreenshotUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[8px] text-white font-extrabold">View Full</a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* PROOF SUBMISSION DIALOG MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn select-text">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-[28px] w-full max-w-sm p-5 shadow-2xl relative space-y-4 text-left">
            <div className="flex justify-between items-start pb-2 border-b border-neutral-100 dark:border-neutral-850">
              <div>
                <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-black px-2 py-0.5 rounded-md uppercase tracking-wide">
                  টাস্কের কাজ জমা দিন
                </span>
                <h3 className="text-xs font-black text-slate-800 dark:text-white mt-1 leading-snug">
                  {selectedTask.title}
                </h3>
              </div>
              <button 
                onClick={() => { setSelectedTask(null); setProofText(''); setProofImage(''); }}
                className="text-neutral-400 hover:text-rose-500 font-bold text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9.5px] uppercase font-black tracking-wider text-slate-450 dark:text-zinc-400 block pl-0.5">
                  ১. কাজের বিবরণ বা ইউজারনেম টাইপ করুনঃ
                </label>
                <textarea
                  rows={3}
                  placeholder="যেমনঃ 'আমার ইউটিউব ইউজারনেম @username এবং আমি চ্যানেল সাবস্ক্রাইব করেছি।'"
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 text-slate-800 dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-650 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9.5px] uppercase font-black tracking-wider text-slate-455 dark:text-zinc-400 block pl-0.5">
                  ২. স্ক্রিনশট প্রুফ ফাইল (ঐচ্ছিক):
                </label>
                
                {proofImage ? (
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 bg-neutral-50 dark:bg-neutral-950 relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-11 h-11 rounded-lg overflow-hidden border border-neutral-150 bg-white shadow-sm shrink-0">
                        <img src={proofImage} alt="proof preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] text-zinc-400 font-bold">Screenshot added 📸</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofImage('')}
                      className="text-rose-500 text-[10px] font-black hover:underline cursor-pointer pr-1"
                    >
                      মুছে দিন
                    </button>
                  </div>
                ) : (
                  <label htmlFor="proof-screenshot-picker" className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl py-5 px-3 bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all select-none">
                    <Image className="w-6 h-6 text-neutral-400" />
                    <span className="text-[10px] font-bold text-slate-500">স্ক্রিনশট আপলোড করতে টাচ করুন</span>
                    <span className="text-[8.5px] text-zinc-400 font-semibold">(Max Size: 2MB)</span>
                    <input 
                      type="file" 
                      id="proof-screenshot-picker" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-black">
                <button
                  type="button"
                  onClick={() => { setSelectedTask(null); setProofText(''); setProofImage(''); }}
                  className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-zinc-200 px-4 py-2.5 rounded-xl transition active:scale-95 cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'সাবমিট হচ্ছে...' : 'সাবমিট দিন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
