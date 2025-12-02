import React from 'react';

export const FireLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto text-[#FF6600]">
      <path
        d="M50 0C50 0 15 40 15 70C15 95 35 115 50 115C65 115 85 95 85 70C85 40 50 0 50 0ZM50 105C40 105 30 95 30 75C30 60 45 40 50 30C55 40 70 60 70 75C70 95 60 105 50 105Z"
        fill="currentColor"
      />
      <path
        d="M50 40C50 40 40 60 40 75C40 85 45 90 50 90C55 90 60 85 60 75C60 60 50 40 50 40Z"
        fill="#FF9933"
      />
    </svg>
    <span className="font-montserrat font-bold text-white tracking-tighter text-2xl">
      Fire
    </span>
  </div>
);
