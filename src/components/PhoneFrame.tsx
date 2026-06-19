/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-neutral-100 flex flex-col font-sans antialiased">
      {/* Responsive centered content container: full screen on mobile, elegant column on desktop */}
      <div className="w-full max-w-xl mx-auto bg-white dark:bg-neutral-900 h-full flex flex-col relative shadow-xl border-x border-neutral-200/50 dark:border-neutral-800/40 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

