import React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background Rounded Square */}
      <rect width="100" height="100" rx="20" fill="url(#logo-gradient)" />
      
      {/* Document Icon Part */}
      <path
        d="M30 25H60L75 40V75C75 77.7614 72.7614 80 70 80H30C27.2386 80 25 77.7614 25 75V30C25 27.2386 27.2386 25 30 25Z"
        fill="white"
        fillOpacity="0.2"
      />
      
      {/* Folded corner */}
      <path
        d="M60 25V40H75L60 25Z"
        fill="white"
        fillOpacity="0.4"
      />

      {/* Checkmark inside document */}
      <path
        d="M40 55L48 63L65 46"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Decorative dots for "data/placeholders" */}
      <circle cx="35" cy="35" r="3" fill="white" />
      <circle cx="45" cy="35" r="3" fill="white" />
      
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
