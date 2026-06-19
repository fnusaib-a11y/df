import React from 'react';

interface VerifiedBadgeProps {
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ className = "w-3.5 h-3.5" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={`${className} shrink-0 select-none`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M9.707 2.13a3 3 0 014.586 0l.942 1.055a1 1 0 00.758.337l1.408-.046a3 3 0 013.243 3.243l-.046 1.408a1 1 0 00.337.758l1.055.942a3 3 0 010 4.586l-1.055.942a1 1 0 00-.337.758l.046 1.408a3 3 0 01-3.243 3.243l-1.408-.046a1 1 0 00-.758.337l-.942 1.055a3 3 0 01-4.586 0l-.942-1.055a1 1 0 00-.758-.337l-1.408.046a3 3 0 01-3.243-3.243l.046-1.408a1 1 0 00-.337-.758l-1.055-.942a3 3 0 010-4.586l1.055-.942a1 1 0 00.337-.758l-.046-1.408a3 3 0 013.243-3.243l1.408.046a1 1 0 00.758-.337l.942-1.055z" 
        fill="#0084FF" 
      />
      <path 
        d="M10.5 14.5l-3-3 1.414-1.414L10.5 11.672l5.086-5.086L17 8l-6.5 6.5z" 
        fill="white" 
      />
    </svg>
  );
};
