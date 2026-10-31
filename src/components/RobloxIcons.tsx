import React from 'react';

export const RobuxIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L3 7.5V16.5L12 22L21 16.5V7.5L12 2Z"
      fill="#00B06F"
      stroke="#4ADE80"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" fill="#0A2A1E" stroke="#86EFAC" strokeWidth="1.2" />
  </svg>
);

export const QBitIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z"
      fill="#D97706"
      stroke="#FBBF24"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3.5" fill="#FEF3C7" />
  </svg>
);

export const CpuIllustration: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="20" height="20" rx="3" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.8" />
    <rect x="10" y="10" width="12" height="12" rx="1.5" fill="#0284C7" />
    <circle cx="16" cy="16" r="2.5" fill="#BAE6FD" />
    {/* Pins */}
    <path d="M10 3V6M16 3V6M22 3V6M10 26V29M16 26V29M22 26V29M3 10H6M3 16H6M3 22H6M26 10H29M26 16H29M26 22H29" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const RamIllustration: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="10" width="26" height="12" rx="2" fill="#0F172A" stroke="#C084FC" strokeWidth="1.8" />
    {/* Memory Chips */}
    <rect x="6" y="12" width="4" height="6" rx="0.8" fill="#7C3AED" />
    <rect x="12" y="12" width="4" height="6" rx="0.8" fill="#7C3AED" />
    <rect x="18" y="12" width="4" height="6" rx="0.8" fill="#7C3AED" />
    <rect x="24" y="12" width="3" height="6" rx="0.8" fill="#7C3AED" />
    {/* Gold Notch Pins */}
    <path d="M5 22V24M8 22V24M11 22V24M14 22V24M18 22V24M21 22V24M24 22V24M27 22V24" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const CoolerIllustration: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="13" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.8" />
    {/* Fan Blades */}
    <path
      d="M16 16L16 6C19 6 22 9 22 13L16 16ZM16 16L26 16C26 19 23 22 19 22L16 16ZM16 16L16 26C13 26 10 23 10 19L16 16ZM16 16L6 16C6 13 9 10 13 10L16 16Z"
      fill="#38BDF8"
      opacity="0.85"
    />
    <circle cx="16" cy="16" r="3.5" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.2" />
  </svg>
);

export const BusIllustration: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="8" width="24" height="16" rx="2.5" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.8" />
    <path d="M8 12H24M8 16H24M8 20H24" stroke="#FCD34D" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
    <circle cx="9" cy="12" r="1.5" fill="#10B981" />
    <circle cx="23" cy="20" r="1.5" fill="#EF4444" />
  </svg>
);

export const PasteIllustration: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 25L17 15" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
    <path d="M15 13L19 17L26 10L22 6L15 13Z" fill="#F43F5E" stroke="#FDA4AF" strokeWidth="1.5" />
    <path d="M23 7L27 3" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="5.5" cy="26.5" r="2" fill="#E2E8F0" />
  </svg>
);

export const RobloxLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="4.5" y="4.5" width="15" height="15" rx="3" transform="rotate(-15 12 12)" fill="#E11D48" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1.2" transform="rotate(-15 12 12)" fill="#FFFFFF" />
  </svg>
);

export const FlameIllustration: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C9.5 5 7 8 7 12C7 15.5 9.5 19 12 21C14.5 19 17 15.5 17 12C17 8 14.5 5 12 2Z"
      fill="#F97316"
      stroke="#FDBA74"
      strokeWidth="1.5"
    />
    <path
      d="M12 8C10.5 10 9.5 12 9.5 14C9.5 16 10.5 18 12 19C13.5 18 14.5 16 14.5 14C14.5 12 13.5 10 12 8Z"
      fill="#FDE047"
    />
  </svg>
);

export const MemoryIllustration: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="20" height="12" rx="2" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
    <circle cx="6" cy="12" r="1.5" fill="#38BDF8" />
    <circle cx="12" cy="12" r="1.5" fill="#38BDF8" />
    <circle cx="18" cy="12" r="1.5" fill="#38BDF8" />
  </svg>
);

