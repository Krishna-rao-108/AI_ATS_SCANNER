import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function scoreTone(score: number) {
  return score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
}

export function ScoreRing({ score, size = 148 }: { score: number; size?: number }) {
  const reduce = useReducedMotion();
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Match score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={10} className="fill-none stroke-muted" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={10}
          strokeLinecap="round"
          className={cn("fill-none stroke-current", scoreTone(score))}
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - score / 100) : c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-stat text-4xl">{score}</div>
          <div className="text-xs text-muted-foreground">of 100</div>
        </div>
      </div>
    </div>
  );
}
