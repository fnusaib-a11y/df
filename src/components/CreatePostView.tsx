/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Loader2, 
  Coins, 
  Lock, 
  Unlock, 
  Globe, 
  Smile, 
  MapPin, 
  UserPlus, 
  MoreHorizontal, 
  Palette, 
  ArrowLeft, 
  Check,
  Tag,
  MapPinned
} from 'lucide-react';
import { dbService } from '../services/db';
import { UserProfile } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface CreatePostViewProps {
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostView({ onClose, onPostCreated }: CreatePostViewProps) {
  const isOnline = useOnlineStatus();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  
  // Post data states
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [category, setCategory] = React.useState('Public');
  const [isPremium, setIsPremium] = React.useState(false);
  const [starPrice, setStarPrice] = React.useState('50');
  
  const [mediaType, setMediaType] = React.useState<'image' | 'video' | 'none'>('none');
  const [mediaUrl, setMediaUrl] = React.useState<string>('');
  const [originalFileResult, setOriginalFileResult] = React.useState<string>('');
  const [selectedAspect, setSelectedAspect] = React.useState<'16_9' | '1_1' | '9_16' | 'original'>('original');

  // Interactive helper states
  const [showCategoryMenu, setShowCategoryMenu] = React.useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = React.useState(false);
  const [selectedGradient, setSelectedGradient] = React.useState<string>(''); // empty means regular bg
  const [showGradientsSelector, setShowGradientsSelector] = React.useState(false);
  const [showLocationSelector, setShowLocationSelector] = React.useState(false);
  const [locationText, setLocationText] = React.useState('');
  const [showPremiumOptions, setShowPremiumOptions] = React.useState(false);

  // AI assistant states
  const [aiTopic, setAiTopic] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showAiPrompt, setShowAiPrompt] = React.useState(false);

  // List of beautiful Facebook-style gradient status backgrounds
  const GRADIENTS = [
    { id: 'sunset', name: 'Sunset', class: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white' },
    { id: 'ocean', name: 'Ocean', class: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white' },
    { id: 'cosmic', name: 'Cosmic', class: 'bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-500 text-white' },
    { id: 'neon', name: 'Neon', class: 'bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 text-white' },
    { id: 'love', name: 'Romantic', class: 'bg-gradient-to-r from-red-500 to-pink-500 text-white' },
    { id: 'aurora', name: 'Aurora', class: 'bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 text-white' }
  ];

  // Popular Emojis list
  const POPULAR_EMOJIS = ['😊', '❤️', '🌟', '🔥', '😂', '😍', '👍', '🎉', '🚀', '🎂', '😭', '😮', '👏'];

  // Audience list requested by user: Public, Only Me, Premium, Subscriber
  const AUDIENCES = ['Public', 'Only Me', 'Premium', 'Subscriber'];

  // Locations choices
  const PRESET_LOCATIONS = [
    'Dhaka, Bangladesh 🌆',
    'Sajek Valley, Rangamati ⛰️',
    'Cox\'s Bazar Sea Beach 🌊',
    'Sreemangal, Sylhet ☕',
    'Sundarbans, Khulna 🐯',
    'Bandarban Hill District ⛰️'
  ];

  React.useEffect(() => {
    setProfile(dbService.getCurrentUser());
  }, []);

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      alert('🚫 দুঃখিত! ইন্টারনেট কানেকশন নেই। অফলাইন মোডে পোস্ট করা সম্ভব নয়।');
      return;
    }
    if (!content.trim() && !mediaUrl) return;

    // Apply background gradient name or info to content if selected
    let finalContent = content;
    if (selectedGradient) {
      const gradObj = GRADIENTS.find(g => g.id === selectedGradient);
      if (gradObj) {
        finalContent = `[GRADIENT:${selectedGradient}]` + content;
      }
    }

    const finalPrice = isPremium ? (parseInt(starPrice) || 30) : 0;
    const finalTitle = title.trim();

    dbService.createPost(
      finalTitle,
      finalContent,
      mediaUrl,
      mediaType,
      category,
      isPremium,
      finalPrice,
      ['Photography', category, ...(locationText ? [locationText.replace(/[^\w\s]/g, '').trim()] : [])]
    );

    alert('Success! Your Facebook-style post has been published successfully. 🚀');
    onPostCreated();
  };

  const handleGenerateCaption = async () => {
    if (!aiTopic.trim()) return;
    if (!isOnline) {
      alert('🚫 ইন্টারনেট কানেকশন নেই। অফলাইন মোডে AI ক্যাপশন জেনারেট করা সম্ভব নয়।');
      return;
    }
    setIsGenerating(true);
    try {
      const resp = await fetch('/api/gemini/suggest-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiTopic })
      });
      if (!resp.ok) {
        throw new Error('API request failed');
      }
      const data = await resp.json();
      if (data.caption) {
        setContent(data.caption);
        setShowAiPrompt(false);
      } else {
        throw new Error('No caption returned');
      }
    } catch (e) {
      console.warn("AI generation delayed, continuing with local input suggestions");
      setContent(`Captured moment: ${aiTopic}. Follow my profile for more exclusive updates! 🌸✨`);
      setShowAiPrompt(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyImageAspect = (resultUrl: string, aspect: '16_9' | '1_1' | '9_16' | 'original') => {
    if (!resultUrl) return;
    const img = new Image();
    img.src = resultUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (aspect === 'original') {
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 720;
        const MAX_HEIGHT = 720;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
      } else if (aspect === '16_9') {
        const targetWidth = 720;
        const targetHeight = 405;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const srcRatio = img.width / img.height;
        const targetRatio = 16 / 9;
        
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
        if (srcRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
      } else if (aspect === '9_16') {
        const targetWidth = 405;
        const targetHeight = 720;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const srcRatio = img.width / img.height;
        const targetRatio = 9 / 16;
        
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
        if (srcRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
      } else if (aspect === '1_1') {
        const targetSize = 512;
        canvas.width = targetSize;
        canvas.height = targetSize;
        
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
        if (img.width > img.height) {
          sWidth = img.height;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width;
          sy = (img.height - sHeight) / 2;
        }
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetSize, targetSize);
      }

      const compressedResult = canvas.toDataURL('image/jpeg', 0.55);
      setMediaUrl(compressedResult);
      setMediaType('image');
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Warning: Only photo files can be uploaded. Please select an image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size is too large (maximum 10 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      setOriginalFileResult(result);
      applyImageAspect(result, selectedAspect);
    };
    reader.readAsDataURL(file);
  };

  const appendEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiMenu(false);
  };

  const addLocation = (loc: string) => {
    setLocationText(loc);
    setShowLocationSelector(false);
  };

  if (!profile) return null;

  // Active gradient details
  const activeGradClass = selectedGradient ? GRADIENTS.find(g => g.id === selectedGradient)?.class : '';

  return (
    <form onSubmit={handleShare} className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-y-auto pb-20 select-none">
      
      {/* Centered Top Title & Close Button precisely matching provided mockup */}
      <div className="relative flex justify-center items-center px-4 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-zinc-900 sticky top-0 z-30">
        <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">Create Post</h2>
        
        {/* Right close button inside round grey circle */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-white flex items-center justify-center cursor-pointer transition shadow-sm font-bold"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* User profile row with category privacy dropdown selection */}
        <div className="flex items-center gap-3">
          <img
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-neutral-800 shrink-0 select-none"
            alt=""
          />
          <div>
            <h4 className="text-[13px] font-black text-slate-900 dark:text-zinc-100 leading-none">
              {profile.name}
            </h4>
            
            {/* Styled Privacy/Audience select badge resembling Facebook's audience button */}
            <div className="relative mt-1 ml-0.5 inline-block">
              <button
                type="button"
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1 rounded-md text-[10.5px] font-black text-zinc-650 dark:text-zinc-300 border border-neutral-200/50 dark:border-neutral-700 cursor-pointer select-none"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-550 dark:text-zinc-400 shrink-0" />
                <span>{category}</span>
                <span className="text-[7.5px] text-zinc-400 select-none">▼</span>
              </button>

              {showCategoryMenu && (
                <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-40 py-1.5 font-bold text-xs select-none">
                  <div className="px-3.5 py-1.5 text-[9px] text-zinc-400 font-black uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800">Select Audience</div>
                  {AUDIENCES.map((aud) => (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => {
                        setCategory(aud);
                        setShowCategoryMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-between text-slate-800 dark:text-neutral-200 cursor-pointer"
                    >
                      <span>{aud}</span>
                      {category === aud && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text Compose Area */}
        <div className="relative space-y-2">
          
          {/* Main Input Text Box (Supports Selected Facebook BG Theme Gradient) */}
          <div className={`relative transition-all duration-300 rounded-[20px] ${
            selectedGradient 
              ? `${activeGradClass} px-6 flex items-center justify-center min-h-[180px] shadow-inner text-center` 
              : 'bg-transparent py-2 px-1'
          }`}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${profile.name.split(' ')[0]}?`}
              className={`w-full bg-transparent resize-none outline-none focus:ring-0 leading-relaxed font-sans transition-all duration-300 ${
                selectedGradient 
                  ? 'text-center text-lg font-black text-white placeholder:text-white/60 min-h-[140px] max-h-[180px]' 
                  : 'text-sm font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-zinc-400 min-h-[100px] max-h-[300px]'
              }`}
            />

            {/* Bottom Floating Palette "Aa" button & Smile emoji button Inside textarea container */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-center z-10 pointer-events-auto">
              
              {/* Aa Colors Trigger Button */}
              <button
                type="button"
                onClick={() => setShowGradientsSelector(!showGradientsSelector)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-md border hover:scale-110 active:scale-95 transition cursor-pointer ${
                  selectedGradient 
                    ? 'bg-white/20 border-white/30 text-white' 
                    : 'bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 border-transparent text-white'
                }`}
                title="Change Background Theme"
              >
                <Palette className="w-4 h-4" />
              </button>

              {/* Emoji smile Trigger button on bottom right */}
              <button
                type="button"
                onClick={() => setShowEmojiMenu(!showEmojiMenu)}
                className={`w-7 h-7 rounded-full flex items-center justify-center hover:scale-110 transition cursor-pointer relative ${
                  selectedGradient 
                    ? 'text-white hover:bg-white/10' 
                    : 'text-zinc-450 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-zinc-400'
                }`}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Location status overlay indicator if added */}
          {locationText && (
            <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10.5px] font-black px-3 py-1.5 rounded-full border border-rose-100 dark:border-rose-900/40 select-none">
              <MapPinned className="w-3.5 h-3.5 text-rose-550 shrink-0" />
              <span>— is at {locationText}</span>
              <button
                type="button"
                onClick={() => setLocationText('')}
                className="hover:bg-rose-200/50 dark:hover:bg-rose-900 rounded-full p-0.5 ml-1 inline-flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}

          {/* GRADIENT EXPANDED PRESET ROW */}
          {showGradientsSelector && (
            <div className="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-2xl flex items-center gap-2 overflow-x-auto animate-fadeIn select-none">
              <button
                type="button"
                onClick={() => {
                  setSelectedGradient('');
                  setShowGradientsSelector(false);
                }}
                className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition bg-white dark:bg-zinc-950 text-xs text-zinc-500 font-bold cursor-pointer ${
                  !selectedGradient ? 'border-indigo-600' : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                None
              </button>
              {GRADIENTS.map((grad) => (
                <button
                  key={grad.id}
                  type="button"
                  onClick={() => {
                    setSelectedGradient(grad.id);
                    setShowGradientsSelector(false);
                    // Dismiss media when background gradient selected to look proper
                    setMediaType('none');
                    setMediaUrl('');
                  }}
                  className={`w-8 h-8 rounded-xl shrink-0 hover:scale-105 active:scale-95 transition cursor-pointer ${grad.class} ${
                    selectedGradient === grad.id ? 'ring-2 ring-indigo-600 border-2 border-white' : 'border border-transparent'
                  }`}
                  title={grad.name}
                />
              ))}
            </div>
          )}

          {/* EMOJI FLOATING EXPANDED SECTOR */}
          {showEmojiMenu && (
            <div className="absolute right-0 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-3 z-40 max-w-[220px] flex flex-wrap gap-2 animate-fadeIn select-none">
              {POPULAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => appendEmoji(emoji)}
                  className="text-base p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg active:scale-95 transition cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Caption helper inside beautiful expansion card */}
        {!showAiPrompt ? (
          <button
            type="button"
            onClick={() => setShowAiPrompt(true)}
            className="flex items-center gap-1.5 text-[10.5px] font-black text-amber-600 dark:text-amber-400 bg-amber-50/20 px-3.5 py-2.5 rounded-xl border border-amber-200/50 cursor-pointer active:scale-98 transition mx-auto"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Generate Status with AI</span>
          </button>
        ) : (
          <div className="bg-[#fdfbf7] dark:bg-neutral-900 p-4 rounded-2xl border border-amber-200/50 space-y-3 select-none">
            <div className="flex justify-between items-center pb-2 border-b border-amber-100/40">
              <span className="text-[10.5px] font-black text-amber-600 flex items-center gap-1">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>AI Status Generator</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAiPrompt(false)}
                className="text-zinc-400 hover:text-slate-600 text-xs font-bold"
              >
                Close ✕
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.g., Rainy day, traveling, cup of coffee..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="flex-1 text-xs border border-neutral-250 dark:border-neutral-800 rounded-xl px-3 py-2 bg-white dark:bg-zinc-950 focus:outline-none text-slate-800 dark:text-neutral-200"
              />
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={isGenerating || !aiTopic.trim()}
                className="bg-amber-500 text-white text-xs font-black px-4 py-2 rounded-xl"
              >
                {isGenerating ? 'Loading...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* Media Preview Container */}
        {mediaUrl && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-neutral-900 dark:bg-black shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center justify-center min-h-[200px] max-h-[380px]">
              <img src={mediaUrl} alt="" className="w-full h-auto max-h-[380px] object-contain" />
              <button
                type="button"
                onClick={() => {
                  setMediaUrl('');
                  setMediaType('none');
                  setOriginalFileResult('');
                }}
                className="absolute top-2.5 right-2.5 bg-black/60 text-white p-2 rounded-full hover:bg-black transition z-10 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {originalFileResult && (
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-3 rounded-2xl flex flex-col gap-2">
                <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Adjust Photo Aspect Ratio & Crop</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-bold text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAspect('original');
                      applyImageAspect(originalFileResult, 'original');
                    }}
                    className={`py-2 px-1 rounded-xl border transition ${
                      selectedAspect === 'original'
                        ? 'border-indigo-650 bg-indigo-650/10 text-indigo-600'
                        : 'bg-white dark:bg-zinc-950 border-neutral-200 dark:border-neutral-800 text-slate-500'
                    }`}
                  >
                    Fit Size
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAspect('1_1');
                      applyImageAspect(originalFileResult, '1_1');
                    }}
                    className={`py-2 px-1 rounded-xl border transition ${
                      selectedAspect === '1_1'
                        ? 'border-indigo-650 bg-indigo-650/10 text-indigo-600'
                        : 'bg-white dark:bg-zinc-950 border-neutral-200 dark:border-neutral-800 text-slate-500'
                    }`}
                  >
                    1:1 Square
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAspect('16_9');
                      applyImageAspect(originalFileResult, '16_9');
                    }}
                    className={`py-2 px-1 rounded-xl border transition ${
                      selectedAspect === '16_9'
                        ? 'border-indigo-650 bg-indigo-650/10 text-indigo-600'
                        : 'bg-white dark:bg-zinc-950 border-neutral-200 dark:border-neutral-800 text-slate-500'
                    }`}
                  >
                    16:9 Wide
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAspect('9_16');
                      applyImageAspect(originalFileResult, '9_16');
                    }}
                    className={`py-2 px-1 rounded-xl border transition ${
                      selectedAspect === '9_16'
                        ? 'border-indigo-650 bg-indigo-650/10 text-indigo-600'
                        : 'bg-white dark:bg-zinc-950 border-neutral-200 dark:border-neutral-800 text-slate-500'
                    }`}
                  >
                    9:16 Portrait
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOCATION SELECTOR DRAWER */}
        {showLocationSelector && (
          <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-4 rounded-2xl space-y-3 animate-fadeIn select-none">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-[10px] uppercase font-black text-rose-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Add Location</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLocationSelector(false)}
                className="text-xs text-zinc-400 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-bold text-[10px]">
              {PRESET_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => addLocation(loc)}
                  className="p-2.5 rounded-xl border bg-white dark:bg-zinc-950 border-neutral-200 dark:border-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-zinc-900 text-left text-slate-700 dark:text-neutral-200 active:scale-95 transition cursor-pointer"
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* EXPANDABLE PREMIUM CREATOR OPTIONS CARD */}
        {showPremiumOptions && (
          <div className="bg-[#fffbfa] dark:bg-zinc-900/40 p-4 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl space-y-4 animate-slideDown select-none">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPremiumCheck"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="w-5 h-5 accent-amber-500 cursor-pointer"
              />
              <label htmlFor="isPremiumCheck" className="text-xs font-black text-slate-800 dark:text-zinc-200 cursor-pointer flex-1 flex items-center gap-1 select-none">
                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Pin-Lock Premium Star Cover Only</span>
              </label>
            </div>

            {isPremium && (
              <div className="space-y-3 border-t border-dashed border-amber-100 dark:border-amber-900/60 pt-3 animate-slideDown">
                
                {/* Title attribute option */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-zinc-400 pl-0.5">1. Premium Post Title</label>
                  <input
                    type="text"
                    required={isPremium}
                    placeholder="E.g., My Exclusive Beach Shoot"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-slate-850 dark:text-white"
                  />
                </div>

                {/* Star Price attribute option */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-zinc-400 pl-0.5">2. Required Star Balance to Unlock</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={10}
                        max={500}
                        value={starPrice}
                        onChange={(e) => setStarPrice(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-slate-850 dark:text-white"
                      />
                      <Coins className="w-4 h-4 text-amber-500 absolute left-3 top-3 shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-zinc-400 pr-1 select-none">Stars</span>
                  </div>
                  <p className="text-[9px] text-amber-600 font-bold block pt-1 pl-0.5">
                    1 Star = ৳0.80 BDT net creator wallet income. Every unlock pays you ৳<b>{Math.round((parseInt(starPrice) || 0) * 0.8)} BDT</b>!
                  </p>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Hidden device photo input element */}
        <input
          type="file"
          id="photo_upload_input"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Beautiful Facebook "Add to your post" row precisely replicating mockup visuals */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 px-4 flex items-center justify-between bg-white dark:bg-zinc-900 shadow-sm select-none">
          <span className="text-[12px] sm:text-xs font-black text-slate-800 dark:text-zinc-200">Add to your post</span>
          
          <div className="flex items-center gap-1 sm:gap-1.5">
            
            {/* Emerald Green Gallery image upload shortcut icon */}
            <label
              htmlFor="photo_upload_input"
              className="p-2 rounded-full cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-[#45bd62] active:scale-90 transition inline-flex items-center justify-center shrink-0"
              title="Attach photo from device"
            >
              <ImageIcon className="w-5 h-5 fill-emerald-100/10" />
            </label>

            {/* Blue friend selector icon */}
            <button
              type="button"
              onClick={() => {
                setContent(prev => prev + ' with Star-Creator members 👥');
                alert('Tagged with Star-Creator members!');
              }}
              className="p-2 rounded-full cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 text-[#1877f2] active:scale-90 transition inline-flex items-center justify-center shrink-0"
              title="Tag Creator Members"
            >
              <UserPlus className="w-5 h-5" />
            </button>

            {/* Orange feeling Smiley emoji face helper icon */}
            <button
              type="button"
              onClick={() => setShowEmojiMenu(!showEmojiMenu)}
              className="p-2 rounded-full cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20 text-[#f7b928] active:scale-90 transition inline-flex items-center justify-center shrink-0"
              title="Emoji Selector"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Red location Pin icon helper */}
            <button
              type="button"
              onClick={() => setShowLocationSelector(!showLocationSelector)}
              className="p-2 rounded-full cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[#f5533d] active:scale-90 transition inline-flex items-center justify-center shrink-0"
              title="Check in location"
            >
              <MapPin className="w-5 h-5" />
            </button>

            {/* Amber Star Premium Lock helper tab trigger */}
            <button
              type="button"
              onClick={() => setShowPremiumOptions(!showPremiumOptions)}
              className={`p-2 rounded-full cursor-pointer active:scale-90 transition inline-flex items-center justify-center shrink-0 ${
                showPremiumOptions || isPremium
                  ? 'bg-amber-500/10 text-amber-550 border border-amber-500/30' 
                  : 'hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-500'
              }`}
              title="Premium lock settings"
            >
              <Lock className="w-5 h-5" />
            </button>

            {/* Grey dots icon */}
            <button
              type="button"
              onClick={() => {
                alert('Stay tuned for upcoming creator tools in the next update! 🌟');
              }}
              className="p-2 rounded-full cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#65676b] dark:text-zinc-400 active:scale-90 transition inline-flex items-center justify-center shrink-0"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* Large "Next" / "Post" pill button matching the Facebook image style */}
        <button
          type="submit"
          disabled={!isOnline || (!content.trim() && !mediaUrl)}
          className={`w-full py-3 font-black text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer select-none text-center block ${
            !isOnline
              ? 'bg-rose-600 text-white hover:bg-rose-700 cursor-not-allowed'
              : 'bg-indigo-650 hover:bg-indigo-700 disabled:bg-[#e4e6eb] disabled:dark:bg-zinc-800 text-white disabled:text-[#bcc0c4] disabled:dark:text-zinc-650'
          }`}
        >
          {!isOnline 
            ? 'অফলাইনে পোস্ট করা যাবে না 🚫' 
            : mediaUrl && mediaType === 'image' && isPremium 
            ? 'Post Premium Photo 🔒🌟' 
            : 'Post'}
        </button>

      </div>
    </form>
  );
}
