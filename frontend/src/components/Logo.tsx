interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "full" | "simple";
  theme?: "light" | "dark";
}

export default function Logo({ className = "", size = "md", variant = "full", theme = "light" }: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-10 h-10"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl", 
    lg: "text-2xl"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} relative ${theme === 'dark' ? 'bg-white' : 'bg-primary'} rounded-full flex items-center justify-center`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4"
        >
          {/* House */}
          <path d="M16 2L4 10v18h6v-8h12v8h6V10L16 2z" fill={theme === 'dark' ? '#10B981' : 'white'}/>
          {/* Medical Cross */}
          <rect x="14" y="12" width="4" height="8" fill={theme === 'dark' ? '#10B981' : 'white'}/>
          <rect x="10" y="16" width="12" height="4" fill={theme === 'dark' ? '#10B981' : 'white'}/>
        </svg>
      </div>

      {/* Logo Text */}
      {variant === "full" ? (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold leading-tight`}>
            <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>Madi</span>
            <span className={theme === 'dark' ? 'text-white' : 'text-primary'}>Home</span>
          </span>
          <span className={`text-xs font-medium leading-tight ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
            Homecare
          </span>
        </div>
      ) : (
        <span className={`${textSizes[size]} font-bold`}>
          <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>Madi</span>
          <span className={theme === 'dark' ? 'text-white' : 'text-primary'}>Home</span>
        </span>
      )}
    </div>
  );
}
