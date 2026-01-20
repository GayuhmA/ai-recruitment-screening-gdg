interface MatchScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function MatchScoreRing({ 
  score, 
  size = "md", 
  showLabel = true,
  className = ""
}: MatchScoreRingProps) {
  const sizes = {
    sm: { ring: 60, stroke: 6, text: "text-lg" },
    md: { ring: 120, stroke: 10, text: "text-3xl" },
    lg: { ring: 180, stroke: 14, text: "text-5xl" }
  };
  
  const { ring, stroke, text } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 80) return { stroke: "#10b981", glow: "rgba(16, 185, 129, 0.3)" }; // green
    if (score >= 60) return { stroke: "#3b82f6", glow: "rgba(59, 130, 246, 0.3)" }; // blue
    if (score >= 40) return { stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.3)" }; // orange
    return { stroke: "#ef4444", glow: "rgba(239, 68, 68, 0.3)" }; // red
  };
  
  const color = getColor(score);
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: ring, height: ring }}>
        {/* Background circle */}
        <svg
          className="transform -rotate-90"
          width={ring}
          height={ring}
        >
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className="text-zinc-800"
          />
          {/* Progress circle */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            stroke={color.stroke}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${color.glow})`
            }}
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${text}`} style={{ color: color.stroke }}>
            {score}%
          </span>
          {showLabel && size !== "sm" && (
            <span className="text-xs text-zinc-400 mt-1">Match</span>
          )}
        </div>
      </div>
      
      {showLabel && size === "sm" && (
        <span className="text-xs text-zinc-400 mt-1">Match</span>
      )}
    </div>
  );
}
