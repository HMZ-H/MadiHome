import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* House Base */}
          <path
            d="M20 2L6 12v24h8v-12h12v12h8V12L20 2z"
            fill="currentColor"
            className="text-white"
          />
          {/* Medical Cross */}
          <path
            d="M18 18h4v4h-4v4h-4v-4h-4v-4h4v-4h4v4z"
            fill="currentColor"
            className="text-secondary"
          />
          {/* Heart Symbol */}
          <path
            d="M20 28c-1-1-3-3-3-5 0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5c0 2-2 4-3 5z"
            fill="currentColor"
            className="text-accent"
          />
        </svg>
      </div>
      
      {/* Logo Text */}
      <div className="flex flex-col">
        <span className="text-xl font-bold text-white leading-tight">
          Madi<span className="text-secondary">Home</span>
        </span>
        <span className="text-xs text-accent font-medium leading-tight">
          Homecare
        </span>
      </div>
    </div>
  );
}
