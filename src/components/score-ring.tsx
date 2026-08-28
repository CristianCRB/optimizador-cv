"use client"

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  animated?: boolean
  label?: string
  sublabel?: string
}

export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  animated = true,
  label,
  sublabel,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.max(0, Math.min(100, score))
  const offset = circumference - (clampedScore / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 90) return "stroke-[#22D66E]"
    if (s >= 80) return "stroke-[#1E88FF]"
    if (s >= 60) return "stroke-amber-500"
    return "stroke-red-500"
  }

  const getTextColor = (s: number) => {
    if (s >= 90) return "text-[#22D66E]"
    if (s >= 80) return "text-[#1E88FF]"
    if (s >= 60) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="img"
        aria-label={`Score ATS: ${clampedScore}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={getColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? circumference : offset}
          style={
            animated
              ? {
                  strokeDashoffset: offset,
                  transition: "stroke-dashoffset 1.5s ease-out",
                }
              : undefined
          }
        />
        {animated && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - 2}
            fill="none"
            className="stroke-primary/10 animate-ring-scan"
            strokeWidth={strokeWidth - 2}
            strokeLinecap="round"
            strokeDasharray={circumference * 0.15}
            strokeDashoffset={circumference * 0.9}
          />
        )}
      </svg>
      <span
        className={`text-3xl font-bold font-mono -mt-[${size + 8}px] ${getTextColor(score)}`}
        style={{ marginTop: -8 }}
      >
        {clampedScore}%
      </span>
      {label && (
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[10px] text-muted-foreground/60">{sublabel}</span>
      )}
    </div>
  )
}
