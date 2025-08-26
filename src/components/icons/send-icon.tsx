interface SendIconProps {
  className?: string;
}

export function SendIcon({ className = "w-5 h-5" }: SendIconProps) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
      />
    </svg>
  );
}