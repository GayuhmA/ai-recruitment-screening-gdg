'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MatchScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function MatchScoreRing({
  score,
  size = 160,
  strokeWidth = 12,
  className,
}: MatchScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 90)
      return { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
    if (score >= 80)
      return { stroke: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
    if (score >= 70)
      return { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
    return { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Strong Match';
    if (score >= 70) return 'Good Match';
    return 'Needs Review';
  };

  const colors = getScoreColor(score);

  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className,
      )}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${colors.stroke}40)`,
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center rounded-full"
        style={{ backgroundColor: colors.bg }}
      >
        <span className="text-4xl font-bold" style={{ color: colors.stroke }}>
          {animatedScore}%
        </span>
        <span className="text-xs text-zinc-400 mt-1">
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
