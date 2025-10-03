import React from "react";

interface SimpleLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function SimpleLogo({ className = "", size = "md" }: SimpleLogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-10 h-10"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon */}
      <div className={`${sizeClasses[size]} relative bg-primary rounded-full flex items-center justify-center`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4"
        >
          {/* House */}
          <path d="M16 2L4 10v18h6v-8h12v8h6V10L16 2z" fill="white"/>
          {/* Medical Cross */}
          <rect x="14" y="12" width="4" height="8" fill="white"/>
          <rect x="10" y="16" width="12" height="4" fill="white"/>
        </svg>
      </div>

      {/* Text */}
      <span className="text-xl font-bold">
        <span className="text-gray-800">Madi</span>
        <span className="text-primary">Home</span>
      </span>
    </div>
  );
}
